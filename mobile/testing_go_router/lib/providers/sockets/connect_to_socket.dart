import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/services/socket_service.dart';

final socketServiceProvider = Provider<SocketService>((ref) {
  return SocketService(ref);
});

final realtimeOrderProvider = StreamProvider<OrderDetailModel>((ref) {
  final socket = ref.read(socketServiceProvider).instance;
  final controller = StreamController<OrderDetailModel>();

  void handler(dynamic data) {
    controller.add(OrderDetailModel.fromJson(data));
  }

  //
  socket.on('order:new', handler);

  ref.onDispose(() {
    socket.off('order:new', handler); // ✅ penting
    controller.close();
  });

  return controller.stream;
});

final testSocket = StreamProvider<String>((ref) {
  final socketService = ref.read(socketServiceProvider);
  final controller = StreamController<String>();

  socketService.instance.on('order_created', (data) {
    controller.add(data);
  });

  socketService.instance.on('update_stock', (data) {
    controller.add(data);
  });

  ref.onDispose(() {
    controller.close();
  });

  return controller.stream;
});
