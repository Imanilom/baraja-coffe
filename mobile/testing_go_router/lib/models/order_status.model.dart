import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'order_status.model.freezed.dart';
part 'order_status.model.g.dart';

@freezed
@HiveType(typeId: 207)
abstract class OrderStatusModel with _$OrderStatusModel {
  const OrderStatusModel._();

  const factory OrderStatusModel({
    @HiveField(0) required String id,
    @HiveField(1) required String name,
  }) = _OrderStatusModel;

  factory OrderStatusModel.fromJson(Map<String, dynamic> json) =>
      _$OrderStatusModelFromJson(json);

  // Static instances to mimic enum behavior
  static const pending = OrderStatusModel(id: 'Pending', name: 'Pending');
  static const waiting = OrderStatusModel(id: 'Waiting', name: 'Waiting');
  static const reserved = OrderStatusModel(id: 'Reserved', name: 'Reserved');
  static const onProcess = OrderStatusModel(id: 'OnProcess', name: 'OnProcess');
  static const completed = OrderStatusModel(id: 'Completed', name: 'Completed');
  static const canceled = OrderStatusModel(id: 'Canceled', name: 'Canceled');
  static const unknown = OrderStatusModel(id: 'Unknown', name: 'Unknown');

  static List<OrderStatusModel> get values => [
    pending,
    waiting,
    reserved,
    onProcess,
    completed,
    canceled,
    unknown,
  ];

  static OrderStatusModel fromString(String status) {
    try {
      return values.firstWhere(
        (e) => e.id.toLowerCase() == status.toLowerCase(),
        orElse: () => unknown,
      );
    } catch (_) {
      return unknown;
    }
  }

  static String toJsonString(OrderStatusModel? status) =>
      status?.id ?? unknown.id;

  Color get color {
    switch (id) {
      case 'Pending':
        return Colors.orange;
      case 'Waiting':
        return Colors.blue;
      case 'Reserved':
        return Colors.purple;
      case 'OnProcess':
        return Colors.amber;
      case 'Completed':
        return Colors.green;
      case 'Canceled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
