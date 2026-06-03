// ignore_for_file: invalid_annotation_target

import 'package:kasirbaraja/models/order_type.model.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'custom_amount_items.model.freezed.dart';
part 'custom_amount_items.model.g.dart';

@freezed
@HiveType(typeId: 28)
abstract class CustomAmountItemsModel with _$CustomAmountItemsModel {
  factory CustomAmountItemsModel({
    @HiveField(0) @Default(0) int amount,
    @HiveField(1) @Default('Custom Amount') String? name,
    @HiveField(2) @Default(null) String? description,
    @HiveField(3)
    @Default(OrderTypeModel.dineIn)
    @JsonKey(
      fromJson: OrderTypeModel.fromString,
      toJson: OrderTypeModel.toJsonString,
    )
    OrderTypeModel? orderType,
  }) = _CustomAmountItemsModel;

  CustomAmountItemsModel._();

  // int countSubTotalPrice() {
  //   int total = menuItem.originalPrice ?? 0;
  //   total += selectedToppings.fold(
  //     0,
  //     (sum, topping) => sum + (topping.price ?? 0),
  //   );
  //   total += selectedAddons.fold(
  //     0,
  //     (sum, addon) =>
  //         sum +
  //         (addon.options?.fold(
  //               0,
  //               (sum, option) => sum! + (option.price ?? 0),
  //             ) ??
  //             0),
  //   );
  //   return total * quantity;
  // }

  factory CustomAmountItemsModel.fromJson(Map<String, dynamic> json) =>
      _$CustomAmountItemsModelFromJson(json);
}
