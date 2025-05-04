// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';
// import 'package:barajapos/models/adapter/order_item.model.dart';
import 'package:barajapos/models/try/try_order_item.model.dart';

part 'try_order_detail.model.freezed.dart';
part 'try_order_detail.model.g.dart';

@freezed
@HiveType(typeId: 9)
abstract class TryOrderDetailModel with _$TryOrderDetailModel {
  factory TryOrderDetailModel({
    @HiveField(0) @JsonKey(name: 'userId') String? customerId,
    @HiveField(1) String? customerName,
    @HiveField(2) String? cashierId,
    @HiveField(3) String? phoneNumber,
    @HiveField(4) @Default([]) List<TryOrderItemModel> items,
    @HiveField(5) required String orderType,
    @HiveField(6) String? deliveryAddress,
    @HiveField(7) String? tableNumber,
    @HiveField(8) String? paymentMethod,
    @HiveField(9) String? status,
    @HiveField(10) double? totalPrice,
  }) = _TryOrderDetailModel;

  factory TryOrderDetailModel.fromJson(Map<String, dynamic> json) =>
      _$TryOrderDetailModelFromJson(json);
}
