import 'package:barajapos/models/menu_item_model.dart';

class OrderItemModel {
  final MenuItemModel menuItem;
  final List<ToppingModel> selectedToppings;
  final List<AddOnOptionModel> selectedAddons;
  final int quantity;
  // final double subtotal;
  // final String note = '';

  OrderItemModel({
    required this.menuItem,
    this.selectedToppings = const [],
    this.selectedAddons = const [],
    this.quantity = 1,
    // required this.subtotal,
  });

  double get subTotalPrice {
    double total = menuItem.price * quantity;
    total += selectedToppings.fold(
        0, (sum, topping) => sum + topping.price * quantity);
    total +=
        selectedAddons.fold(0, (sum, option) => sum + option.price * quantity);
    return total;
  }

  Map<String, dynamic> toJson() {
    return {
      'menuItem': menuItem.id,
      'addons': selectedAddons.map((addon) => {'_id': addon.id}).toList(),
      'toppings':
          selectedToppings.map((topping) => {'_id': topping.id}).toList(),
      'quantity': quantity,
      // 'subtotal': subtotal,
    };
  }
}
