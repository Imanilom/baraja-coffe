import 'package:barajapos/models/adapter/menu_item.model.dart';
import 'package:barajapos/models/adapter/topping.model.dart';
import 'package:barajapos/models/adapter/addon.model.dart';
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
  }) = _OrderItemModel;

  OrderItemModel._();

  int calculateSubTotalPrice({
    required MenuItemModel menuItem,
    required List<ToppingModel> selectedToppings,
    required List<AddonModel> selectedAddons,
    required int quantity,
  }) {
    int total = menuItem.price!;
    total += selectedToppings.fold(0, (sum, topping) => sum + topping.price!);
    total += selectedAddons.fold(
        0,
        (sum, addon) =>
            sum + addon.options!.fold(0, (sum, option) => sum + option.price!));
    return total * quantity;
  }

  factory OrderItemModel.fromJson(Map<String, dynamic> json) =>
      _$OrderItemModelFromJson(json);
}
