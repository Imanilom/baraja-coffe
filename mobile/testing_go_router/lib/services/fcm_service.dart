import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:kasirbaraja/services/notification_service.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import '../firebase_options.dart';

/// Handler untuk pesan FCM yang diterima di background/terminated.
/// Fungsi ini HARUS berupa top-level function (bukan method dari class).
///
/// CATATAN PENTING:
/// Saat app di-kill/terminated, FCM messages dengan `notification` payload
/// akan ditampilkan OTOMATIS oleh Android system tray.
/// Handler ini hanya perlu memproses data payload (jika diperlukan).
/// JANGAN panggil NotificationService.showSystemNotification() di sini
/// karena bisa crash di background isolate dan malah menghalangi
/// notifikasi otomatis dari Android.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    // Skip pesanan kasir — hanya online order
    final source = message.data['source'];
    AppLogger.info(
      '📩 [FCM Background] title=${message.notification?.title}, source=$source',
    );

    // Android system tray sudah menampilkan notifikasi secara otomatis
    // untuk messages yang memiliki `notification` payload.
    // Handler ini hanya untuk logging/processing data jika diperlukan.
  } catch (e) {
    AppLogger.error('❌ FCM background handler error: $e');
  }
}

class FcmService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  /// Inisialisasi FCM: minta izin, ambil token, dan pasang listener.
  static Future<void> init() async {
    // 1. Minta izin notifikasi (Android 13+ / iOS)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    AppLogger.info('🔔 FCM permission: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      AppLogger.warning('🚫 User denied notification permissions');
      return;
    }

    // 2. Ambil FCM token (ID unik device ini di Firebase)
    final token = await _messaging.getToken();
    AppLogger.info('🔑 FCM Token: $token');

    // 3. Dengarkan perubahan token (FCM bisa me-rotate token sewaktu-waktu)
    _messaging.onTokenRefresh.listen((newToken) {
      AppLogger.info('🔄 FCM Token refreshed: $newToken');
      // TODO: kirim newToken ke backend agar tetap up-to-date
    });

    // 4. Handle pesan saat app di foreground
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      AppLogger.info('📩 [FCM Foreground] ${message.notification?.title}');

      // Skip notifikasi dari pesanan kasir — hanya online order
      final source = message.data['source'];
      if (source == 'Cashier') {
        AppLogger.info(
          '📩 [FCM Foreground] Skipped Cashier order notification',
        );
        return;
      }

      NotificationService.showSystemNotification(
        message.notification?.title ?? 'Pesanan Baru',
        message.notification?.body ?? 'Ada pesanan masuk.',
      );
    });

    // 5. Handle saat user menekan notifikasi (app dibuka dari notifikasi)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      AppLogger.info('📩 [FCM Opened] ${message.data}');
      // TODO: navigasi ke halaman pesanan online jika diperlukan
    });

    // 6. Cek apakah app dibuka via notifikasi (saat terminated)
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      AppLogger.info('📩 [FCM Initial] ${initialMessage.data}');
      // TODO: navigasi ke halaman pesanan online
    }
  }

  /// Mengambil FCM token saat ini (untuk dikirim ke backend).
  static Future<String?> getToken() async {
    return await _messaging.getToken();
  }
}
