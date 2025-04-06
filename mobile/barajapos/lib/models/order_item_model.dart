import 'package:barajapos/models/adapter/menu_item.model.dart';
import 'package:barajapos/models/adapter/topping.model.dart';
import 'package:barajapos/models/adapter/addon.model.dart';

class OrderItemModel {
  final MenuItemModel menuItem;
  final List<ToppingModel> selectedToppings;
  final List<AddonModel> selectedAddons;
  int quantity;
  // final int? subtotal;
  // final String note = '';

  OrderItemModel({
    required this.menuItem,
    this.selectedToppings = const [],
    this.selectedAddons = const [],
    this.quantity = 1,
    // this.subtotal,
  });

  int get subTotalPrice {
    int total = menuItem.price;
    total += selectedToppings.fold(0, (sum, topping) => sum + topping.price);
    total += selectedAddons.fold(
        0,
        (sum, addon) =>
            sum + addon.options.fold(0, (sum, option) => sum + option.price));
    return total * quantity;
  }

  void incrementQuantity(int newQuantity) {
    quantity += newQuantity;
  }

  OrderItemModel copyWith({
    MenuItemModel? menuItem,
    int? quantity,
    List<ToppingModel>? selectedToppings,
    List<AddonModel>? selectedAddons,
    int? subTotalPrice,
  }) {
    return OrderItemModel(
      menuItem: menuItem ?? this.menuItem,
      quantity: quantity ?? this.quantity,
      selectedToppings: selectedToppings ?? this.selectedToppings,
      selectedAddons: selectedAddons ?? this.selectedAddons,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'menuItem': menuItem.id,
      'addons': selectedAddons.map((addon) => {'_id': addon.id}).toList(),
      'toppings':
          selectedToppings.map((topping) => {'_id': topping.id}).toList(),
      'quantity': quantity,
      'subtotal': subTotalPrice,
    };
  }
}
