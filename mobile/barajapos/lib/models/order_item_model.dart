import 'package:barajapos/models/menu_item_model.dart';

class OrderItemModel {
  final MenuItemModel menuItem;
  final List<ToppingModel> selectedToppings;
  final List<AddOnModel> selectedAddons;
  int quantity;
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
    double total = menuItem.price;
    total += selectedToppings.fold(0, (sum, topping) => sum + topping.price);
    total += selectedAddons.fold(
        0.0,
        (sum, addon) =>
            sum + addon.options.fold(0.0, (sum, option) => sum + option.price));
    return total * quantity;
  }

  void incrementQuantity(int newQuantity) {
    quantity += newQuantity;
  }

  OrderItemModel copyWith({
    MenuItemModel? menuItem,
    int? quantity,
    List<ToppingModel>? selectedToppings,
    List<AddOnModel>? selectedAddons,
    double? subTotalPrice,
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
      // 'subtotal': subtotal,
    };
  }
}
