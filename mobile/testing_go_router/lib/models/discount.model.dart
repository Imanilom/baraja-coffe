import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'discount.model.freezed.dart';
part 'discount.model.g.dart';

@freezed
@HiveType(typeId: 9)
abstract class DiscountModel with _$DiscountModel {
  factory DiscountModel({
    @HiveField(0) @Default(0) int autoPromoDiscount,
    @HiveField(1) @Default(0) int manualDiscount,
    @HiveField(2) @Default(0) int voucherDiscount,
    @HiveField(3) @Default(0) int customDiscount,
  }) = _DiscountModel;

  factory DiscountModel.fromJson(Map<String, dynamic> json) =>
      _$DiscountModelFromJson(json);
}

extension DiscountModelExt on DiscountModel {
  int get totalDiscount {
    return autoPromoDiscount +
        manualDiscount +
        voucherDiscount +
        customDiscount;
  }
}
