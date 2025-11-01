import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';

part 'edit_order_item.model.freezed.dart';
part 'edit_order_item.model.g.dart';

@freezed
@HiveType(typeId: 26)
abstract class EditOrderItemModel with _$EditOrderItemModel {
  factory EditOrderItemModel({
    @HiveField(0) @Default(null) String? reason,
    @HiveField(1) @Default(null) OrderDetailModel? order,
    @HiveField(2) @Default([]) List<OrderItemModel>? originalItems,
    @HiveField(3) @Default(false) bool isSubmitting,
    @HiveField(4) @Default(null) String? error,
  }) = _EditOrderItemModel;

  factory EditOrderItemModel.fromJson(Map<String, dynamic> json) =>
      _$EditOrderItemModelFromJson(json);
}
