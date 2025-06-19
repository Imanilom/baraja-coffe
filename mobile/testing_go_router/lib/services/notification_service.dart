import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:overlay_support/overlay_support.dart';
import 'package:flutter/material.dart';

class NotificationService {
  static final _notifications = FlutterLocalNotificationsPlugin();

  // Inisialisasi
  static Future<void> init() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iOSSettings =
        DarwinInitializationSettings();

    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
      iOS: iOSSettings,
    );

    await _notifications.initialize(settings);
  }

  // Notifikasi sistem (muncul di luar aplikasi)
  static void showSystemNotification(String title, String body) {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
          'channel_id',
          'Channel Name',
          importance: Importance.max,
          priority: Priority.high,
        );

    _notifications.show(
      0,
      title,
      body,
      const NotificationDetails(android: androidDetails),
    );
  }

  // Notifikasi in-app (toast)
  static void showInAppNotification(String title, String message) {
    // showSimpleNotification(
    //   Text(title),
    //   leading: const Icon(Icons.notifications),
    //   subtitle: Text(message),
    // );
    showOverlayNotification(
      (context) => MaterialBanner(
        content: Text(message),
        actions: [
          TextButton(
            child: const Text('OK'),
            onPressed: () => OverlaySupportEntry.of(context)!.dismiss(),
          ),
        ],
      ),
    );
  }
}
