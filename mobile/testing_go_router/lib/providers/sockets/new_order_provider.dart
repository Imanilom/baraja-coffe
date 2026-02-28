// lib/providers/realtime_order_provider.dart
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/sockets/connect_to_socket.dart';

final realtimeOrderProvider = StreamProvider<OrderDetailModel>((ref) {
  final socketService = ref.read(socketServiceProvider);
  final controller = StreamController<OrderDetailModel>();

  // Dengarkan event dari socket
  socketService.instance.on('new_order', (data) {
    final order = OrderDetailModel.fromJson(data['order']);
    controller.add(order);
  });

  // dengarkan event dari socket new_order_created
  socketService.instance.on('new_order_created', (data) {
    final order = OrderDetailModel.fromJson(data['order']);
    controller.add(order);
  });

  ref.onDispose(() {
    controller.close();
  });

  return controller.stream;
});
