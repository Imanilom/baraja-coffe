import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/services/order_history_service.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:kasirbaraja/models/order_detail.model.dart';
// import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';

// class SocketService {
//   // final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

//   static final SocketService _instance = SocketService._internal();
//   late io.Socket _socket;
//   final String _serverUrl = AppConfig.baseUrl;

//   factory SocketService() => _instance;

//   SocketService._internal() {
//     _socket = io.io(_serverUrl, {
//       'transports': ['websocket'],
//       'autoConnect': false, // for manual connection
//     });
//   }

//   void connect() {
//     _socket.connect();
//     _socket.onConnect((_) {
//       print('Connected to Socket.io server');
//     });
//   }

//   void joinRoom(String room) {
//     _socket.emit('newOrder', room);
//   }

//   void sendOrder(OrderDetailModel order) {
//     _socket.emit('newOrder', order.toJson());
//   }

//   void updateOrderStatus(String orderId, String status) {
//     _socket.emit('update-status', {'orderId': orderId, 'status': status});
//   }

//   void listenToOrders(Function(OrderDetailModel) callback) {
//     _socket.on('order-update', (data) {
//       final order = OrderDetailModel.fromJson(data);
//       callback(order);
//     });
//   }

//   void dispose() {
//     _socket.disconnect();
//     _socket.clearListeners();
//   }
// }
class SocketService {
  late IO.Socket socket;
  final String _serverUrl = AppConfig.baseUrl;
  final Ref ref;

  SocketService(this.ref);

  void connect(String cashierId) {
    socket = IO.io(_serverUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

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
        // void _ = ref.refresh(activityProvider.future);
        ref.invalidate(activityProvider);
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
