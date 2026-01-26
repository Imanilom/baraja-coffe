// ignore_for_file: invalid_annotation_target

import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/custom_discount.model.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'order_item.model.freezed.dart';
part 'order_item.model.g.dart';

@freezed
@HiveType(typeId: 4)
abstract class OrderItemModel with _$OrderItemModel {
  factory OrderItemModel({
    @HiveField(0) required MenuItemModel menuItem,
    @HiveField(1) @Default([]) List<ToppingModel> selectedToppings,
    @HiveField(2) @Default([]) List<AddonModel> selectedAddons,
    @HiveField(3) @Default(1) int quantity,
    @HiveField(4) @Default("") String? notes,
    @HiveField(5) @Default(0) int subtotal,
    @HiveField(6)
    @Default(OrderType.dineIn)
    @JsonKey(
      name: 'dineType',
      fromJson: OrderTypeExtension.fromString,
      toJson: OrderTypeExtension.orderTypeToJson,
    )
    OrderType orderType,
    @HiveField(7) @Default(null) String? orderItemid,
    @HiveField(8) @Default(false) bool isPrinted,
    @HiveField(9) @Default(0) int printedQuantity,
    @HiveField(10) @Default([]) List<String> printBatchIds,
    @HiveField(11) @Default(null) String? reservedPromoId,
    // Custom discount untuk item ini
    @HiveField(12) @Default(null) CustomDiscountModel? customDiscount,
  }) = _OrderItemModel;

  OrderItemModel._();

  int countSubTotalPrice() {
    int total = menuItem.originalPrice ?? 0;
    total += selectedToppings.fold(
      0,
      (sum, topping) => sum + (topping.price ?? 0),
    );
    total += selectedAddons.fold(
      0,
      (sum, addon) =>
          sum +
          (addon.options?.fold(
                0,
                (sum, option) => sum! + (option.price ?? 0),
              ) ??
              0),
    );
    return total * quantity;
  }

  String get uniqueId {
    // Urutkan addon dan topping untuk konsistensi hash
    final addonIds = (selectedAddons.map((a) => a.id).toList()..sort()).join(
      '-',
    );
    final toppingIds = (selectedToppings.map((t) => t.id).toList()..sort())
        .join('-');
    // Pastikan notes dan orderType juga masuk ke hash
    return '${menuItem.id}-$addonIds-$toppingIds-${notes ?? ''}-${orderType.name}-${customDiscount.toString()}';
  }

  factory OrderItemModel.fromJson(Map<String, dynamic> json) =>
      _$OrderItemModelFromJson(json);
}
