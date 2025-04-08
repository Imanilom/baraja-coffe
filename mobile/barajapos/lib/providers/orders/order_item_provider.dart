import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barajapos/models/order_item_model.dart';
import 'package:barajapos/models/menu_item_model.dart';

class OrderItemNotifier extends StateNotifier<OrderItemModel> {
  OrderItemNotifier(super.initialOrder);

  void setQuantity(int newQuantity) {
    if (newQuantity > 0) {
      state = state.copyWith(quantity: newQuantity);
    }
  }

  void toggleTopping(ToppingModel topping) {
    final selectedToppings = List<ToppingModel>.from(state.selectedToppings);
    if (selectedToppings.contains(topping)) {
      selectedToppings.remove(topping);
    } else {
      selectedToppings.add(topping);
    }
    state = state.copyWith(selectedToppings: selectedToppings);
  }

  void selectAddon(AddonModel addon, AddonOptionModel option) {
    final selectedAddons = List<AddonModel>.from(state.selectedAddons);
    final index = selectedAddons.indexWhere((a) => a.id == addon.id);
    if (index != -1) {
      selectedAddons[index] = addon.copyWith(options: [option]);
    } else {
      selectedAddons.add(addon.copyWith(options: [option]));
    }
    state = state.copyWith(selectedAddons: selectedAddons);
  }
}

final orderItemProvider = StateNotifierProvider.family<OrderItemNotifier,
    OrderItemModel, OrderItemModel>(
  (ref, initialOrder) => OrderItemNotifier(initialOrder),
);
