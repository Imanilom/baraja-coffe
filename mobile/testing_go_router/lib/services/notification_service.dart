import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  // Gunakan konstanta channel yang STABIL (jangan diubah di update berikutnya)
  static const String _channelId = 'orders_channel';
  static const String _channelName = 'Orders';
  static const String _channelDesc = 'Notifikasi pesanan baru';

  // Inisialisasi (panggil sekali, mis. saat login kasir atau app start)
  static Future<void> init() async {
    const AndroidInitializationSettings androidInit =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iosInit = DarwinInitializationSettings(
      // iOS 10+: minta izin alert/badge/sound saat init (boleh juga kamu pindah ke halaman login)
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
      // Opsional: handle ketika notifikasi ditekan
      onDidReceiveNotificationResponse: (resp) {
        debugPrint('Tapped notification with payload: ${resp.payload}');
        // TODO: arahkan ke halaman yang diinginkan
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
      await Permission.notification.request();
    }

    // iOS: izinkan tampil saat app foreground (biar kelihatan)
    await _plugin
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >()
        ?.requestPermissions(alert: true, badge: true, sound: true);
  }

  // Notifikasi sistem (keluar OS). Kembalikan Future dan pakai await di pemanggil.
  static Future<void> showSystemNotification(
    String title,
    String body, {
    String? payload,
    int? id, // kalau null, auto-random agar tidak menimpa
  }) async {
    final notifId = id ?? Random().nextInt(1 << 31);

    const android = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: _channelDesc,
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
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
  }

  // Notifikasi in-app (opsional, pakai overlay/toast sendiri kalau mau)
  // Kamu bisa pakai overlay_support di tempat lain; sengaja dihapus di sini biar fokus ke sistem.
}
