import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/services/notification_service.dart';
import 'package:kasirbaraja/services/order_history_service.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
// import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';

class SocketService {
  late IO.Socket socket;
  final String _serverUrl = AppConfig.baseUrl;
  final Ref ref;

  SocketService(this.ref);

  void connect(String cashierId) {
    socket = IO.io(_serverUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
      'reconnection': true,
      'reconnectionAttempts': 5,
    });
    socket
      ..onConnect((_) => print('CONNECTED: ${socket.id}'))
      ..onDisconnect((_) => print('DISCONNECTED'))
      ..onError((err) => print('ERROR: $err'));

    socket.onAny(
      (event, data) => print('<<< Incoming event: $event | Data: $data'),
    );
    socket.connect();

    socket.onConnect((_) {
      print('Socket connected');
      // socket.emit('kasir:join', {'id': cashierId});
      socket.emit('join_cashier_room', {'id': cashierId});
      print('success join cashier room');
    });

    socket.on('order_created', (data) {
      try {
        print('Received order_created: $data');
        NotificationService.showSystemNotification(
          'Pesanan Baru',
          'Pelanggan: Hello World!',
        );
        // void _ = ref.refresh(activityProvider.future);
        ref.invalidate(activityProvider);
      } catch (e) {
        print('Error refreshing activityProvider: $e');
      }
    });

    socket.on('new_order', (data) {
      try {
        print('ready received new_order');
        // ref.read(orderOnlineIndicatorProvider.notifier).state = true;
        // ref.read(orderOnlineIndicatorProvider.notifier).state = false;
        // Notifikasi sistem
        // notificationService.showLocalNotification(
        //   'Pesanan Baru',
        //   'Pesanan #${data['order_id']} diterima',
        // );

        // // Notifikasi in-app
        NotificationService.showInAppNotification(
          'Pesanan Baru',
          'Pelanggan: ${data['customerName']}\nTotal: Rp ${data['totalPrice']}',
        );
        // Refresh data jika perlu
        ref.invalidate(onlineOrderProvider);
        // void _ = ref.refresh(onlineOrderProvider.future);
        print('success received new_order: $data');
      } catch (e) {
        print('Error refreshing activityProvider: $e');
      }
    });

    socket.onDisconnect((_) => print('Socket disconnected'));
  }

  void disconnect() {
    socket.disconnect();
  }

  IO.Socket get instance => socket;
}
