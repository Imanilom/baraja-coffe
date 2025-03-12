import 'package:barajapos/models/menu_item_model.dart';

class OrderItemModel {
  final MenuItemModel menuItem;
  final List<ToppingModel> selectedToppings;
  final List<AddOnOptionModel> selectedAddons;

  OrderItemModel({
    required this.menuItem,
    this.selectedToppings = const [],
    this.selectedAddons = const [],
  });

  double get subTotalPrice {
    double total = menuItem.price;
    total += selectedToppings.fold(0, (sum, topping) => sum + topping.price);
    total += selectedAddons.fold(0, (sum, option) => sum + option.price);
    return total;
  }
}
