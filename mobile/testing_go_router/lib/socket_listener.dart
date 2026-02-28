import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketListener {
  static final SocketListener _instance = SocketListener._internal();
  late io.Socket socket;

  factory SocketListener() => _instance;

  SocketListener._internal() {
    // Setup koneksi
    socket = io.io('http://localhost:3000', {
      'transports': ['websocket'],
      'autoConnect': true,
    });

    // Listen event order baru
    socket.on('order_created', (data) {
      AppLogger.info('🛎️ Order Baru: ${data['id']}');

      // muncul snack bar
      // Note: This won't work because data is not a BuildContext
      /*
      ScaffoldMessenger.of(data).showSnackBar(
        SnackBar(
          content: Text('Order Baru: ${data['id']}'),
          duration: Duration(seconds: 2),
        ),
      );
      */
    });

    socket.onConnect((_) => AppLogger.info('Terhubung ke server'));
    socket.onDisconnect((_) => AppLogger.info('Terputus dari server'));
  }
}
