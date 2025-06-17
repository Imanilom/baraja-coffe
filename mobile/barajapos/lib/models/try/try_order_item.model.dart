import 'package:barajapos/models/adapter/menu_item.model.dart';
import 'package:barajapos/models/adapter/topping.model.dart';
import 'package:barajapos/models/adapter/addon.model.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';
import 'package:barajapos/models/try/try_menu_item.model.dart';
import 'package:barajapos/models/try/try_addon.model.dart';

part 'try_order_item.model.freezed.dart';
part 'try_order_item.model.g.dart';

@freezed
@HiveType(typeId: 10)
abstract class TryOrderItemModel with _$TryOrderItemModel {
  factory TryOrderItemModel({
    @HiveField(0) TryMenuItemModel? menuItem,
    @HiveField(1) @Default([]) List<ToppingModel> selectedToppings,
    @HiveField(2) List<TryAddonModel>? selectedAddons,
    @HiveField(3) @Default(1) int quantity,
  }) = _TryOrderItemModel;

  TryOrderItemModel._();

  // int calculateSubTotalPrice() {
  //   int total = menuItem.price ?? 0;
  //   total +=
  //       selectedToppings.fold(0, (sum, topping) => sum + (topping.price ?? 0));
  //   total += selectedAddons.fold(
  //     0,
  //     (sum, addon) =>
  //         sum +
  //         (addon.options
  //                 ?.fold(0, (sum, option) => sum! + (option.price ?? 0)) ??
  //             0),
  //   );
  //   return total * quantity;
  // }

  factory TryOrderItemModel.fromJson(Map<String, dynamic> json) =>
      _$TryOrderItemModelFromJson(json);
}
