import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/services/printer_service.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:hive_ce/hive.dart';
import 'package:permission_handler/permission_handler.dart';

// ===============================
// ENUMS & DATA CLASSES
// ===============================

enum PrinterConnectionState {
  disconnected,
  connecting,
  connected,
  failed,
  reconnecting,
}

enum PrinterScanState { idle, scanning, completed, error }

// Connection status untuk setiap printer
// @immutable
class PrinterStatus {
  final String address;
  final PrinterConnectionState state;
  final String? errorMessage;
  final DateTime lastUpdated;

  const PrinterStatus({
    required this.address,
    required this.state,
    this.errorMessage,
    required this.lastUpdated,
  });

  PrinterStatus copyWith({
    String? address,
    PrinterConnectionState? state,
    String? errorMessage,
    DateTime? lastUpdated,
  }) {
    return PrinterStatus(
      address: address ?? this.address,
      state: state ?? this.state,
      errorMessage: errorMessage ?? this.errorMessage,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

// Scan result dengan metadata
// @immutable
class PrinterScanResult {
  final List<BluetoothInfo> devices;
  final PrinterScanState state;
  final String? errorMessage;
  final DateTime? lastScanTime;

  const PrinterScanResult({
    required this.devices,
    required this.state,
    this.errorMessage,
    this.lastScanTime,
  });

  PrinterScanResult copyWith({
    List<BluetoothInfo>? devices,
    PrinterScanState? state,
    String? errorMessage,
    DateTime? lastScanTime,
  }) {
    return PrinterScanResult(
      devices: devices ?? this.devices,
      state: state ?? this.state,
      errorMessage: errorMessage ?? this.errorMessage,
      lastScanTime: lastScanTime ?? this.lastScanTime,
    );
  }
}

// ===============================
// PROVIDERS
// ===============================

// 1. Hive Box Provider - lebih robust error handling
final printerBoxProvider = Provider<Box<BluetoothPrinterModel>>((ref) {
  throw UnimplementedError(
    'Harus di override di main.dart dengan proper box initialization',
  );
});

// 2. Permission Provider untuk centralized permission management
final permissionProvider = Provider<PermissionService>((ref) {
  return PermissionService();
});

// 3. Printer Service Provider untuk dependency injection
final printerServiceProvider = Provider<PrinterService>((ref) {
  return PrinterService();
});

// 4. Provider untuk printer tersimpan dengan better error handling
final savedPrintersProvider =
    NotifierProvider<SavedPrintersNotifier, List<BluetoothPrinterModel>>(() {
      return SavedPrintersNotifier();
    });

// 5. Provider untuk printer scanner dengan enhanced functionality
final printerScannerProvider =
    AsyncNotifierProvider<PrinterScannerNotifier, PrinterScanResult>(() {
      return PrinterScannerNotifier();
    });

// 6. Provider untuk koneksi printer dengan status tracking
final printerConnectionProvider =
    NotifierProvider<PrinterConnectionNotifier, Map<String, PrinterStatus>>(() {
      return PrinterConnectionNotifier();
    });

// 7. Provider untuk active connection (single printer connection)
final activePrinterConnectionProvider =
    NotifierProvider<ActivePrinterConnectionNotifier, PrinterStatus?>(() {
      return ActivePrinterConnectionNotifier();
    });

// ===============================
// SERVICES
// ===============================

class PermissionService {
  Future<bool> requestBluetoothPermissions() async {
    try {
      final permissions =
          await [
            Permission.bluetoothScan,
            Permission.bluetoothConnect,
            Permission.locationWhenInUse,
          ].request();

      return permissions.values.every(
        (status) => status == PermissionStatus.granted,
      );
    } catch (e) {
      AppLogger.error('Error requesting permissions', error: e);
      return false;
    }
  }

  Future<bool> checkBluetoothPermissions() async {
    try {
      final bluetoothScan = await Permission.bluetoothScan.status;
      final bluetoothConnect = await Permission.bluetoothConnect.status;
      final location = await Permission.locationWhenInUse.status;

      return bluetoothScan.isGranted &&
          bluetoothConnect.isGranted &&
          location.isGranted;
    } catch (e) {
      AppLogger.error('Error checking permissions', error: e);
      return false;
    }
  }
}

// ===============================
// NOTIFIERS
// ===============================

class SavedPrintersNotifier extends Notifier<List<BluetoothPrinterModel>> {
  late Box<BluetoothPrinterModel> _box;

  @override
  List<BluetoothPrinterModel> build() {
    try {
      _box = ref.watch(printerBoxProvider);
      return _box.values.toList();
    } catch (e) {
      AppLogger.error('Error loading saved printers', error: e);
      return [];
    }
  }

  // Get printer by address
  BluetoothPrinterModel? getPrinterByAddress(String address) {
    try {
      return _box.get(address);
    } catch (e) {
      AppLogger.error('Error getting printer by address', error: e);
      return null;
    }
  }

  // Add printer with validation
  Future<Result<void>> addPrinter(BluetoothPrinterModel printer) async {
    try {
      // Validate printer
      if (printer.name.isEmpty || printer.address.isEmpty) {
        return Result.failure('Printer name and address cannot be empty');
      }

      // Check if already exists
      if (_box.containsKey(printer.address)) {
        return Result.failure('Printer with this address already exists');
      }

      await _box.put(printer.address, printer);
      state = _box.values.toList();

      return Result.success(null);
    } catch (e) {
      final errorMessage = 'Failed to add printer: ${e.toString()}';
      AppLogger.error(errorMessage, error: e);
      return Result.failure(errorMessage);
    }
  }

  // Update printer
  Future<Result<void>> updatePrinter(BluetoothPrinterModel printer) async {
    try {
      if (!_box.containsKey(printer.address)) {
        return Result.failure('Printer not found');
      }

      await _box.put(printer.address, printer);
      state = _box.values.toList();

      return Result.success(null);
    } catch (e) {
      final errorMessage = 'Failed to update printer: ${e.toString()}';
      AppLogger.error(errorMessage, error: e);
      return Result.failure(errorMessage);
    }
  }

  // Remove printer
  Future<Result<void>> removePrinter(String address) async {
    try {
      if (!_box.containsKey(address)) {
        return Result.failure('Printer not found');
      }

      await _box.delete(address);
      state = _box.values.toList();

      // Disconnect if currently connected
      ref
          .read(activePrinterConnectionProvider.notifier)
          .disconnectPrinter(address);

      return Result.success(null);
    } catch (e) {
      final errorMessage = 'Failed to remove printer: ${e.toString()}';
      AppLogger.error(errorMessage, error: e);
      return Result.failure(errorMessage);
    }
  }

  // Print with better error handling
  Future<Result<void>> printToPrinter({
    required OrderDetailModel orderDetail,
    required String printType,
  }) async {
    try {
      if (state.isEmpty) {
        return Result.failure('No printers available');
      }

      if (printType.isEmpty) {
        return Result.failure('Print type cannot be empty');
      }

      await PrinterService.printDocuments(
        orderDetail: orderDetail,
        printType: printType,
        printers: state,
      );

      return Result.success(null);
    } catch (e) {
      final errorMessage = 'Failed to print: ${e.toString()}';
      AppLogger.error(errorMessage, error: e);
      return Result.failure(errorMessage);
    }
  }

  // Get printers by type
  List<BluetoothPrinterModel> getPrintersByType(String connectionType) {
    return state
        .where((printer) => printer.connectionType == connectionType)
        .toList();
  }

  // Get printers by capability
  List<BluetoothPrinterModel> getPrintersByCapability(String capability) {
    return state.where((printer) {
      switch (capability) {
        case 'customer':
          return printer.canPrintCustomer;
        case 'kitchen':
          return printer.canPrintKitchen;
        case 'bar':
          return printer.canPrintBar;
        case 'waiter':
          return printer.canPrintWaiter;
        default:
          return false;
      }
    }).toList();
  }
}

class PrinterScannerNotifier extends AsyncNotifier<PrinterScanResult> {
  @override
  Future<PrinterScanResult> build() async {
    return const PrinterScanResult(devices: [], state: PrinterScanState.idle);
  }

  Future<void> scanPrinters() async {
    try {
      // Set scanning state
      state = AsyncValue.data(
        state.valueOrNull?.copyWith(state: PrinterScanState.scanning) ??
            const PrinterScanResult(
              devices: [],
              state: PrinterScanState.scanning,
            ),
      );

      // Check and request permissions
      final permissionService = ref.read(permissionProvider);
      final hasPermissions =
          await permissionService.checkBluetoothPermissions();

      if (!hasPermissions) {
        final granted = await permissionService.requestBluetoothPermissions();
        if (!granted) {
          state = AsyncValue.data(
            PrinterScanResult(
              devices: const [],
              state: PrinterScanState.error,
              errorMessage: 'Bluetooth permissions not granted',
              lastScanTime: DateTime.now(),
            ),
          );
          return;
        }
      }

      // Check if bluetooth is enabled
      final isBluetoothEnabled = await PrintBluetoothThermal.bluetoothEnabled;
      if (!isBluetoothEnabled) {
        state = AsyncValue.data(
          PrinterScanResult(
            devices: const [],
            state: PrinterScanState.error,
            errorMessage: 'Bluetooth is not enabled',
            lastScanTime: DateTime.now(),
          ),
        );
        return;
      }

      // Scan for paired devices
      final pairedDevices = await PrintBluetoothThermal.pairedBluetooths;

      state = AsyncValue.data(
        PrinterScanResult(
          devices: pairedDevices,
          state: PrinterScanState.completed,
          lastScanTime: DateTime.now(),
        ),
      );
    } catch (e) {
      final errorMessage = 'Failed to scan printers: ${e.toString()}';
      AppLogger.error(errorMessage, error: e);

      state = AsyncValue.data(
        PrinterScanResult(
          devices: const [],
          state: PrinterScanState.error,
          errorMessage: errorMessage,
          lastScanTime: DateTime.now(),
        ),
      );
    }
  }

  void clearScannedPrinters() {
    state = const AsyncValue.data(
      PrinterScanResult(devices: [], state: PrinterScanState.idle),
    );
  }

  // Rescan with automatic retry
  Future<void> rescanWithRetry({int maxRetries = 3}) async {
    int attempts = 0;

    while (attempts < maxRetries) {
      await scanPrinters();

      final currentState = state.valueOrNull;
      if (currentState?.state == PrinterScanState.completed) {
        break;
      }

      attempts++;
      if (attempts < maxRetries) {
        await Future.delayed(
          Duration(seconds: attempts * 2),
        ); // Exponential backoff
      }
    }
  }
}

class PrinterConnectionNotifier extends Notifier<Map<String, PrinterStatus>> {
  @override
  Map<String, PrinterStatus> build() {
    return {};
  }

  PrinterStatus? getConnectionStatus(String address) {
    return state[address];
  }

  void updatePrinterStatus(
    String address,
    PrinterConnectionState connectionState, {
    String? errorMessage,
  }) {
    state = {
      ...state,
      address: PrinterStatus(
        address: address,
        state: connectionState,
        errorMessage: errorMessage,
        lastUpdated: DateTime.now(),
      ),
    };
  }

  void removePrinterStatus(String address) {
    final newState = Map<String, PrinterStatus>.from(state);
    newState.remove(address);
    state = newState;
  }

  // Get all connected printers
  List<PrinterStatus> getConnectedPrinters() {
    return state.values
        .where((status) => status.state == PrinterConnectionState.connected)
        .toList();
  }
}

class ActivePrinterConnectionNotifier extends Notifier<PrinterStatus?> {
  @override
  PrinterStatus? build() {
    return null;
  }

  Future<Result<void>> connectToPrinter(BluetoothPrinterModel printer) async {
    try {
      // Update status to connecting
      state = PrinterStatus(
        address: printer.address,
        state: PrinterConnectionState.connecting,
        lastUpdated: DateTime.now(),
      );

      // Update global status
      ref
          .read(printerConnectionProvider.notifier)
          .updatePrinterStatus(
            printer.address,
            PrinterConnectionState.connecting,
          );

      // Disconnect any existing connection
      await PrintBluetoothThermal.disconnect;

      // Connect to new printer
      final connected = await PrintBluetoothThermal.connect(
        macPrinterAddress: printer.address,
      );

      final newState =
          connected
              ? PrinterConnectionState.connected
              : PrinterConnectionState.failed;

      // Update states
      state = PrinterStatus(
        address: printer.address,
        state: newState,
        lastUpdated: DateTime.now(),
      );

      ref
          .read(printerConnectionProvider.notifier)
          .updatePrinterStatus(printer.address, newState);

      return connected
          ? Result.success(null)
          : Result.failure('Failed to connect to printer');
    } catch (e) {
      final errorMessage = 'Connection error: ${e.toString()}';

      state = PrinterStatus(
        address: printer.address,
        state: PrinterConnectionState.failed,
        errorMessage: errorMessage,
        lastUpdated: DateTime.now(),
      );

      ref
          .read(printerConnectionProvider.notifier)
          .updatePrinterStatus(
            printer.address,
            PrinterConnectionState.failed,
            errorMessage: errorMessage,
          );

      return Result.failure(errorMessage);
    }
  }

  Future<void> disconnectPrinter([String? address]) async {
    try {
      await PrintBluetoothThermal.disconnect;

      if (state != null) {
        ref
            .read(printerConnectionProvider.notifier)
            .updatePrinterStatus(
              state!.address,
              PrinterConnectionState.disconnected,
            );
      }

      state = null;
    } catch (e) {
      AppLogger.error('Error disconnecting', error: e);
    }
  }

  // Auto-reconnect functionality
  Future<void> reconnectIfNeeded(BluetoothPrinterModel printer) async {
    if (state?.address == printer.address &&
        state?.state == PrinterConnectionState.failed) {
      state = state!.copyWith(
        state: PrinterConnectionState.reconnecting,
        lastUpdated: DateTime.now(),
      );

      await connectToPrinter(printer);
    }
  }
}

// ===============================
// UTILITY CLASSES
// ===============================

// Result class for better error handling
// @immutable
class Result<T> {
  final T? data;
  final String? error;
  final bool isSuccess;

  const Result._({this.data, this.error, required this.isSuccess});

  factory Result.success(T data) => Result._(data: data, isSuccess: true);
  factory Result.failure(String error) =>
      Result._(error: error, isSuccess: false);

  bool get isFailure => !isSuccess;
}
