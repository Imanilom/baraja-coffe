import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../config/app_config.dart';
import '../models/display_state.dart';
import '../services/api_service.dart';
import '../services/sound_service.dart';

class DisplayController extends ChangeNotifier {
  static const _screenChannel = MethodChannel('com.baraja.display/screen');

  void _triggerNativeWakeScreen() {
    try {
      if (!kIsWeb) {
        _screenChannel.invokeMethod('wakeScreen');
      }
    } catch (_) {}
  }

  final ApiService _apiService = ApiService();

  String _deviceId = AppConfig.defaultDeviceId;
  String _apiUrl = AppConfig.defaultApiUrl;
  int _idleSleepSeconds = AppConfig.defaultIdleSleepSeconds;
  int _storeOpenHour = AppConfig.defaultStoreOpenHour;
  int _storeCloseHour = AppConfig.defaultStoreCloseHour;

  DisplayState _state = DisplayState.initial();
  int _lastTimestamp = 0;

  bool _isStoreClosed = false;
  bool _isScreenSleeping = false;
  final bool _manualWakeOverride = false;
  DateTime? _manualWakeUntil;

  // Network connection state tracking
  bool _isNetworkConnected = true;
  int _failedNetworkCount = 0;

  // Dynamic Promos & Tickers fetched from SQLite (admin.php)
  List<Map<String, dynamic>> _dynamicPromos = [];
  List<Map<String, dynamic>> _dynamicTickers = [];

  DateTime _lastTransactionActivity = DateTime.now();
  Timer? _pollTimer;
  Timer? _tickerTimer;
  Timer? _syncTimer;
  StreamSubscription<DisplayState>? _sseSubscription;

  // Modals & Overlays
  bool _isReceiptOpen = false;
  bool _isRatingOpen = false;
  bool _isSpinOpen = false;
  bool _isSettingsOpen = false;
  List<String> _availableDevices = [];
  bool _isFetchingDevices = false;

  // Toast / Alerts
  String? _toastMessage;
  dynamic _toastIcon;
  Timer? _toastTimer;

  // Getters
  String get deviceId => _deviceId;
  String get apiUrl => _apiUrl;
  int get idleSleepSeconds => _idleSleepSeconds;
  int get storeOpenHour => _storeOpenHour;
  int get storeCloseHour => _storeCloseHour;
  DisplayState get state => _state;
  bool get isStoreClosed => _isStoreClosed;
  bool get isScreenSleeping => _isScreenSleeping;
  bool get isNetworkConnected => _isNetworkConnected;
  List<Map<String, dynamic>> get dynamicPromos => _dynamicPromos;
  List<Map<String, dynamic>> get dynamicTickers => _dynamicTickers;
  bool get isReceiptOpen => _isReceiptOpen;
  bool get isRatingOpen => _isRatingOpen;
  bool get isSpinOpen => _isSpinOpen;
  bool get isSettingsOpen => _isSettingsOpen;
  List<String> get availableDevices => _availableDevices;
  bool get isFetchingDevices => _isFetchingDevices;
  String? get toastMessage => _toastMessage;
  dynamic get toastIcon => _toastIcon;
  int get secondsRemainingToSleep {
    if (!_state.hasItems || _isScreenSleeping) return 0;
    final elapsed = DateTime.now().difference(_lastTransactionActivity).inSeconds;
    final remaining = _idleSleepSeconds - elapsed;
    return remaining > 0 ? remaining : 0;
  }

  DisplayController() {
    _loadSettings();
    _startTimers();
  }

  Future<void> _loadSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _deviceId = prefs.getString('device_id') ?? AppConfig.defaultDeviceId;
      _apiUrl = AppConfig.defaultApiUrl; // https://barajacoffee.com/display2/api.php
      await prefs.setString('api_url', _apiUrl);
      _idleSleepSeconds = prefs.getInt('idle_sleep_seconds') ?? AppConfig.defaultIdleSleepSeconds;
      _storeOpenHour = prefs.getInt('store_open_hour') ?? AppConfig.defaultStoreOpenHour;
      _storeCloseHour = prefs.getInt('store_close_hour') ?? AppConfig.defaultStoreCloseHour;
      _apiService.baseUrl = _apiUrl;

      // Load cached promos and tickers if offline
      _loadOfflineCache(prefs);

      _startSseSubscription();
      fetchPromos();
      fetchTickers();
      notifyListeners();
    } catch (_) {}
  }

  void _loadOfflineCache(SharedPreferences prefs) {
    try {
      final cachedPromosStr = prefs.getString('cache_promos');
      if (cachedPromosStr != null && cachedPromosStr.isNotEmpty) {
        final decoded = jsonDecode(cachedPromosStr);
        if (decoded is List) {
          _dynamicPromos = decoded.cast<Map<String, dynamic>>();
        }
      }
      final cachedTickersStr = prefs.getString('cache_tickers');
      if (cachedTickersStr != null && cachedTickersStr.isNotEmpty) {
        final decoded = jsonDecode(cachedTickersStr);
        if (decoded is List) {
          _dynamicTickers = decoded.cast<Map<String, dynamic>>();
        }
      }
    } catch (_) {}
  }

  Future<void> saveSettings({
    required String newDeviceId,
    required String newApiUrl,
    required int newIdleSleepSeconds,
    required int newStoreOpenHour,
    required int newStoreCloseHour,
  }) async {
    _deviceId = newDeviceId;
    _apiUrl = newApiUrl;
    _idleSleepSeconds = newIdleSleepSeconds.clamp(30, 300);
    _storeOpenHour = newStoreOpenHour;
    _storeCloseHour = newStoreCloseHour;
    _apiService.baseUrl = _apiUrl;

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('device_id', _deviceId);
      await prefs.setString('api_url', _apiUrl);
      await prefs.setInt('idle_sleep_seconds', _idleSleepSeconds);
      await prefs.setInt('store_open_hour', _storeOpenHour);
      await prefs.setInt('store_close_hour', _storeCloseHour);
    } catch (_) {}

    _lastTimestamp = 0;
    _startSseSubscription();
    fetchState();
    fetchPromos();
    fetchTickers();
    notifyListeners();
  }

  void _startTimers() {
    _startSseSubscription();
    fetchState(); // Initial fetch
    fetchPromos();
    fetchTickers();
    // Periodic fallback polling every 3s (SSE is the primary real-time stream)
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => fetchState());
    _tickerTimer = Timer.periodic(const Duration(milliseconds: 1000), (_) => _evaluateScheduleAndSleep());
    _syncTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      fetchPromos();
      fetchTickers();
    });
  }

  Future<void> fetchPromos() async {
    final list = await _apiService.fetchPromos();
    if (list.isNotEmpty) {
      _dynamicPromos = list;
      notifyListeners();
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('cache_promos', jsonEncode(list));
      } catch (_) {}
    }
  }

  Future<void> fetchTickers() async {
    final list = await _apiService.fetchTickers();
    if (list.isNotEmpty) {
      _dynamicTickers = list;
      notifyListeners();
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('cache_tickers', jsonEncode(list));
      } catch (_) {}
    }
  }

  void _startSseSubscription() {
    _sseSubscription?.cancel();
    _sseSubscription = _apiService.subscribeToState(_deviceId).listen(
      (newState) => _applyStateUpdate(newState),
      onError: (_) {
        _markNetworkFailure();
        // Reconnect setelah 2s jika error
        Future.delayed(const Duration(seconds: 2), () {
          if (!hasListeners) return;
          _startSseSubscription();
        });
      },
      onDone: () {
        // SSE stream selesai setelah 60s (normal behavior dari server)
        // Reset failure count karena ini bukan error — koneksi memang di-cycle
        _failedNetworkCount = 0;
        // Reconnect segera (500ms) agar banner merah tidak muncul
        Future.delayed(const Duration(milliseconds: 500), () {
          if (!hasListeners) return;
          _startSseSubscription();
        });
      },
    );
  }

  void _markNetworkFailure() {
    _failedNetworkCount++;
    // Butuh 5 kegagalan berturut-turut sebelum tampilkan banner merah
    // (mencegah false alarm saat SSE sedang reconnect)
    if (_failedNetworkCount >= 5 && _isNetworkConnected) {
      _isNetworkConnected = false;
      _startFallbackPolling();
      notifyListeners();
    }
  }

  void _markNetworkSuccess() {
    _failedNetworkCount = 0;
    if (!_isNetworkConnected) {
      _isNetworkConnected = true;
      notifyListeners();
    }
  }

  void _startFallbackPolling() {
    if (_pollTimer == null || !_pollTimer!.isActive) {
      _pollTimer = Timer.periodic(const Duration(seconds: 2), (_) => fetchState());
    }
  }

  void _evaluateScheduleAndSleep() {
    final now = DateTime.now();

    bool closedNow = false;
    if (_storeCloseHour < _storeOpenHour) {
      if (now.hour >= _storeCloseHour && now.hour < _storeOpenHour) {
        closedNow = true;
      }
    } else {
      if (now.hour < _storeOpenHour || now.hour >= _storeCloseHour) {
        closedNow = true;
      }
    }

    if (_isStoreClosed != closedNow) {
      _isStoreClosed = closedNow;
      if (_isStoreClosed) {
        _isScreenSleeping = true;
      }
      notifyListeners();
    }

    if (_isSettingsOpen) {
      if (_isScreenSleeping) {
        _isScreenSleeping = false;
        _updateWakelock();
        notifyListeners();
      }
      return;
    }

    if (_manualWakeUntil != null && DateTime.now().isBefore(_manualWakeUntil!)) {
      if (_isScreenSleeping) {
        _isScreenSleeping = false;
        _updateWakelock();
        notifyListeners();
      }
      return;
    }

    if (!_isStoreClosed && !_manualWakeOverride) {
      if (!_state.hasItems) {
        if (!_isScreenSleeping) {
          _isScreenSleeping = true;
          _updateWakelock();
          notifyListeners();
        }
      } else {
        final idleDuration = now.difference(_lastTransactionActivity).inSeconds;
        if (idleDuration >= _idleSleepSeconds) {
          if (!_isScreenSleeping) {
            _isScreenSleeping = true;
            _isReceiptOpen = false;
            _isRatingOpen = false;
            _isSpinOpen = false;
            _updateWakelock();
            notifyListeners();
          }
        } else {
          if (_isScreenSleeping) {
            _isScreenSleeping = false;
            _updateWakelock();
            notifyListeners();
          }
        }
      }
    } else {
      _updateWakelock();
    }
  }

  void _updateWakelock() {
    try {
      if (!kIsWeb) {
        // During store open hours, keep hardware screen awake so Android OS never sleeps
        if (!_isStoreClosed) {
          WakelockPlus.enable();
        } else {
          WakelockPlus.disable();
        }
      }
    } catch (_) {}
  }

  void _applyStateUpdate(DisplayState newState) {
    _markNetworkSuccess();

    final isNewEvent = newState.timestamp > _lastTimestamp ||
        newState.orderNumber != _state.orderNumber ||
        newState.items.length != _state.items.length ||
        newState.status != _state.status ||
        newState.grandTotal != _state.grandTotal;

    if (newState.timestamp > _lastTimestamp) {
      _lastTimestamp = newState.timestamp;
    }

    _state = newState;

    if (_state.hasItems) {
      _lastTransactionActivity = DateTime.now();
      _triggerNativeWakeScreen();

      if (_isScreenSleeping) {
        _isScreenSleeping = false;
        showToast(Icons.notifications_active_rounded, 'Pesanan baru masuk!');
        SoundService.playChime();
      } else if (isNewEvent && _state.status != 2) {
        SoundService.playChime();
      }

      if (_state.status == 2 && !_isReceiptOpen) {
        _isReceiptOpen = true;
        showToast(Icons.check_circle_rounded, 'Pembayaran Berhasil! Terima kasih.');
        SoundService.playSuccess();
      } else if (_state.status != 2) {
        _isReceiptOpen = false;
      }
    } else {
      _isReceiptOpen = false;
      _isRatingOpen = false;
      _isSpinOpen = false;
      _manualWakeUntil = null;
    }

    _updateWakelock();
    notifyListeners();
  }

  bool _isFetchingState = false;

  Future<void> fetchState() async {
    if (_isFetchingState) return;
    _isFetchingState = true;
    try {
      final newState = await _apiService.fetchState(_deviceId);
      if (newState == null) {
        _markNetworkFailure();
        return;
      }
      _applyStateUpdate(newState);
    } finally {
      _isFetchingState = false;
    }
  }

  void wakeScreenManual({int seconds = 60}) {
    _isScreenSleeping = false;
    _manualWakeUntil = DateTime.now().add(Duration(seconds: seconds));
    _lastTransactionActivity = DateTime.now();
    _updateWakelock();
    notifyListeners();
  }

  void openSettings() {
    _isSettingsOpen = true;
    _isScreenSleeping = false;
    _updateWakelock();
    fetchAvailableDevices();
    notifyListeners();
  }

  void closeSettings() {
    _isSettingsOpen = false;
    notifyListeners();
  }

  Future<void> fetchAvailableDevices() async {
    _isFetchingDevices = true;
    notifyListeners();
    _availableDevices = await _apiService.fetchDevices();
    _isFetchingDevices = false;
    notifyListeners();
  }

  void openReceipt() {
    _isReceiptOpen = true;
    notifyListeners();
  }

  void closeReceipt() {
    _isReceiptOpen = false;
    notifyListeners();
  }

  void openRating() {
    _isReceiptOpen = false;
    _isRatingOpen = true;
    notifyListeners();
  }

  void closeRating() {
    _isRatingOpen = false;
    notifyListeners();
  }

  void openSpin() {
    _isReceiptOpen = false;
    _isSpinOpen = true;
    notifyListeners();
  }

  void closeSpin() {
    _isSpinOpen = false;
    notifyListeners();
  }

  void showToast(dynamic icon, String message) {
    _toastIcon = icon;
    _toastMessage = message;
    notifyListeners();

    _toastTimer?.cancel();
    _toastTimer = Timer(const Duration(seconds: 4), () {
      _toastIcon = null;
      _toastMessage = null;
      notifyListeners();
    });
  }

  Future<bool> sendReceiptEmail(String email) async {
    return await _apiService.sendReceiptEmail(
      deviceId: _deviceId,
      email: email,
      state: _state,
    );
  }

  // ─── Simulation Helpers ───────────────────────────────────────────────────
  Future<void> simulateSampleTransaction() async {
    final payload = {
      'device_id': _deviceId,
      'items': [
        {'name': 'Manual Brew Arabica Gayo', 'qty': 1, 'price': 65000, 'note': 'Less ice'},
        {'name': 'Croissant Speculoos Butter', 'qty': 2, 'price': 45000, 'note': 'Hangatkan'},
        {'name': 'Matcha Cream Latte', 'qty': 1, 'price': 38000, 'note': 'Oatmilk'},
      ],
      'discount_rate': 0.05,
      'status': 0,
      'order_number': 'A-${(100 + DateTime.now().second).toString()}',
      'customer_name': 'Bpk. Ahmad',
      'table_name': 'Meja 12',
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };

    await _apiService.sendState(_deviceId, payload);
    await fetchState();
    showToast(Icons.send_rounded, 'Simulasi Transaksi Baru Terkirim!');
  }

  Future<void> simulatePaymentComplete() async {
    final payload = {
      'device_id': _deviceId,
      'items': _state.items.map((i) => i.toJson()).toList(),
      'discount_rate': _state.discountRate,
      'status': 2,
      'order_number': _state.orderNumber,
      'customer_name': _state.customerName,
      'table_name': _state.tableName,
      'payment_method': 'QRIS BCA',
      'payment_amount': _state.grandTotal,
      'change_amount': 0.0,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };

    await _apiService.sendState(_deviceId, payload);
    await fetchState();
  }

  Future<void> simulateClearTransaction() async {
    final payload = {
      'device_id': _deviceId,
      'items': [],
      'discount_rate': 0.0,
      'status': 0,
      'order_number': '-',
      'customer_name': null,
      'table_name': null,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };

    await _apiService.sendState(_deviceId, payload);
    await fetchState();
    showToast(Icons.cleaning_services_rounded, 'Transaksi Kosong - Layar Segera Sleep.');
  }

  @override
  void dispose() {
    _sseSubscription?.cancel();
    _pollTimer?.cancel();
    _tickerTimer?.cancel();
    _syncTimer?.cancel();
    _toastTimer?.cancel();
    super.dispose();
  }
}
