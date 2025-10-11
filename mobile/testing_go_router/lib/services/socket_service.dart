import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/device.model.dart';
import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/notification_service.dart';
import 'package:kasirbaraja/services/order_history_service.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
// import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';

class SocketService {
  late IO.Socket socket;
  final String _serverUrl = AppConfig.baseUrl;
  final Ref ref;
  Timer? _debounce;

  SocketService(this.ref);

  void connect(String cashierId) {
    socket = IO.io(_serverUrl, {
      'transports': ['websocket'],
      'autoConnect': false,
      'reconnection': true,
      'reconnectionAttempts': 10,
      'extraHeaders': {'ngrok-skip-browser-warning': 'true'},
    });

    socket.onConnect((_) async {
      print('CONNECTED: ${socket.id}');
      socket.emit('join_cashier_room', {'id': cashierId});
      final device = await HiveService.getDevice();

      if (device != null && device.assignedAreas.isNotEmpty) {
        joinArea(device.assignedAreas[0]);
      }
    });
    socket.onDisconnect((_) => print('DISCONNECTED'));
    socket.onError((err) => print('ERROR: $err'));

    socket.on('order_created', (data) {
      print('order_created: $data');
      NotificationService.showSystemNotification(
        'Pesanan Baru',
        'Hello World!',
      );
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 500), () {
        ref.invalidate(onlineOrderProvider);
      });
    });

    socket.on('new_order', (data) {
      print('new_order: $data');
      NotificationService.showSystemNotification(
        'Pesanan Baru',
        'Pelanggan: ${data['customerName']} • Rp ${data['totalPrice']}',
      );
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 500), () {
        ref.invalidate(onlineOrderProvider);
      });
    });

    socket.on('new_order_created', (data) {
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 500), () {
        ref.invalidate(onlineOrderProvider);
      });
    });

    socket.connect();
  }

  void joinArea(String tableCode) {
    socket.emit('join_area', tableCode);
    print('join_area_group: $tableCode');
  }

  void disconnect() {
    _debounce?.cancel();
    socket.disconnect();
  }

  void dispose() {
    socket.off('order_created');
    socket.off('new_order');
    socket.offAny();
    socket.dispose();
  }

  IO.Socket get instance => socket;
}
