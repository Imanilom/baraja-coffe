// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/order_item.model.dart';

part 'order_detail.model.freezed.dart';
part 'order_detail.model.g.dart';

@freezed
@HiveType(typeId: 5)
abstract class OrderDetailModel with _$OrderDetailModel {
  factory OrderDetailModel({
    @HiveField(0) @Default("") @JsonKey(name: 'userId') String? customerId,
    @HiveField(1) @Default("") String? customerName, //
    @HiveField(2) @Default("") String? cashierId, //
    @HiveField(3) @Default("") String? phoneNumber,
    @HiveField(4) @Default([]) List<OrderItemModel> items, //
    @HiveField(5) required String orderType, //
    @HiveField(6) @Default("") String? deliveryAddress,
    @HiveField(7) @Default("") String? tableNumber,
    @HiveField(8) @Default("") String? paymentMethod,
    @HiveField(9) @Default("") String? status,
    @HiveField(10) @Default(0) int? subTotalPrice,
    @HiveField(11) @Default("") @JsonKey(name: 'order_id') String? orderId, //
    @HiveField(12) @Default(0) int? tax,
    @HiveField(13) @Default(0) int? totalPrice,
    @HiveField(14) @Default(0) int? serviceFee,
    @HiveField(15) @Default([]) Map<String, int>? discounts,
  }) = _OrderDetailModel;

  factory OrderDetailModel.fromJson(Map<String, dynamic> json) =>
      _$OrderDetailModelFromJson(json);
}
