import 'dart:math';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:kasirbaraja/utils/app_logger.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  static bool _initialized = false;

  // Gunakan konstanta channel yang STABIL (jangan diubah di update berikutnya)
  static const String _channelId = 'orders_channel';
  static const String _channelName = 'Orders';
  static const String _channelDesc = 'Notifikasi pesanan baru';

  // Inisialisasi (panggil sekali, mis. saat login kasir atau app start)
  static Future<void> init() async {
    // Gunakan icon yang sama dengan AndroidManifest.xml
    const AndroidInitializationSettings androidInit =
        AndroidInitializationSettings('@mipmap/launcher_icon');

    const DarwinInitializationSettings iosInit = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings settings = InitializationSettings(
      android: androidInit,
      iOS: iosInit,
    );

    await _plugin.initialize(
      settings,
      onDidReceiveNotificationResponse: (resp) {
        AppLogger.debug('Tapped notification with payload: ${resp.payload}');
      },
    );

    // Pastikan channel dibuat dengan importance MAX (Android 8+)
    final androidSpecific =
        _plugin
            .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin
            >();

    await androidSpecific?.createNotificationChannel(
      const AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: _channelDesc,
        importance: Importance.max,
        playSound: true,
        enableVibration: true,
      ),
    );

    // Meminta izin menggunakan permission_handler (lebih handal di Android 13+)
    if (await Permission.notification.isDenied) {
      final status = await Permission.notification.request();
      AppLogger.info('🔔 Notification permission: $status');
    }

    // iOS: izinkan tampil saat app foreground (biar kelihatan)
    await _plugin
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >()
        ?.requestPermissions(alert: true, badge: true, sound: true);

    _initialized = true;
    AppLogger.info('✅ NotificationService initialized');
  }

  // Notifikasi sistem (keluar OS). Kembalikan Future dan pakai await di pemanggil.
  static Future<void> showSystemNotification(
    String title,
    String body, {
    String? payload,
    int? id, // kalau null, auto-random agar tidak menimpa
  }) async {
    try {
      // Kalau belum init, coba init dulu
      if (!_initialized) {
        AppLogger.warning('⚠️ NotificationService belum init, mencoba init...');
        await init();
      }

      final notifId = id ?? Random().nextInt(1 << 31);

      const android = AndroidNotificationDetails(
        _channelId,
        _channelName,
        channelDescription: _channelDesc,
        importance: Importance.max,
        priority: Priority.high,
        playSound: true,
        enableVibration: true,
        icon: '@mipmap/launcher_icon',
      );

      const ios = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      await _plugin.show(
        notifId,
        title,
        body,
        const NotificationDetails(android: android, iOS: ios),
        payload: payload,
      );

      AppLogger.debug('📢 Notification shown: $title');
    } catch (e, st) {
      AppLogger.error('❌ Gagal menampilkan notifikasi: $e\n$st');
    }
  }
}
