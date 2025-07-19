// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';
import 'package:barajapos/models/adapter/order_item.model.dart';

part 'order_detail.model.freezed.dart';
part 'order_detail.model.g.dart';

@freezed
@HiveType(typeId: 5)
abstract class OrderDetailModel with _$OrderDetailModel {
  factory OrderDetailModel({
    @HiveField(0) @JsonKey(name: 'userId') String? customerId,
    @HiveField(1) String? customerName,
    @HiveField(2) String? cashierId,
    @HiveField(3) String? phoneNumber,
    @HiveField(4) @Default([]) List<OrderItemModel> items,
    @HiveField(5) required String orderType,
    @HiveField(6) String? deliveryAddress,
    @HiveField(7) String? tableNumber,
    @HiveField(8) String? paymentMethod,
    @HiveField(9) String? status,
    @HiveField(10) double? totalPrice,
    @HiveField(11) @JsonKey(name: '_id') String? orderId,
  }) = _OrderDetailModel;

  factory OrderDetailModel.fromJson(Map<String, dynamic> json) =>
      _$OrderDetailModelFromJson(json);
}
