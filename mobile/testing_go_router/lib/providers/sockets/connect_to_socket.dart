import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/services/socket_service.dart';

final socketServiceProvider = Provider<SocketService>((ref) {
  return SocketService(ref);
});

final realtimeOrderProvider = StreamProvider<OrderDetailModel>((ref) {
  final socketService = ref.read(socketServiceProvider);
  final controller = StreamController<OrderDetailModel>();

  socketService.instance.on('order:new', (data) {
    final order = OrderDetailModel.fromJson(data);
    controller.add(order);
  });

  ref.onDispose(() {
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

  ref.onDispose(() {
    controller.close();
  });

  return controller.stream;
});
