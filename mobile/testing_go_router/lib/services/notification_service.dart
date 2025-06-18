// // lib/services/notification_service.dart
// import 'package:flutter_local_notifications/flutter_local_notifications.dart';
// import 'package:overlay_support/overlay_support.dart';
// import 'package:flutter/material.dart';

// class NotificationService {
//   final FlutterLocalNotificationsPlugin _notificationsPlugin =
//       FlutterLocalNotificationsPlugin();

//   Future<void> initialize() async {
//     const AndroidInitializationSettings androidSettings =
//         AndroidInitializationSettings('@mipmap/ic_launcher');

//     const InitializationSettings settings = InitializationSettings(
//       android: androidSettings,
//       iOS: DarwinInitializationSettings(),
//     );

//     await _notificationsPlugin.initialize(settings);
//   }

//   void showLocalNotification(String title, String body) {
//     const AndroidNotificationDetails androidDetails =
//         AndroidNotificationDetails(
//           'channel_id',
//           'Channel Name',
//           importance: Importance.max,
//           priority: Priority.high,
//         );

//     const NotificationDetails details = NotificationDetails(
//       android: androidDetails,
//       iOS: DarwinNotificationDetails(),
//     );

//     _notificationsPlugin.show(0, title, body, details);
//   }

//   void showInAppNotification(String title, String message) {
//     showOverlayNotification((context) {
//       return Card(
//         margin: const EdgeInsets.symmetric(horizontal: 16),
//         child: ListTile(
//           leading: const Icon(Icons.notifications),
//           title: Text(title),
//           subtitle: Text(message),
//           trailing: IconButton(
//             icon: const Icon(Icons.close),
//             onPressed: () => OverlaySupportEntry.of(context)?.dismiss(),
//           ),
//         ),
//       );
//     }, duration: const Duration(seconds: 5));
//   }
// }
