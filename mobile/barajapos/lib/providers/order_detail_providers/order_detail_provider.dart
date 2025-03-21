import 'package:barajapos/models/menu_item_model.dart';
import 'package:barajapos/models/order_detail_model.dart';
import 'package:barajapos/models/order_item_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';

class OrderDetailNotifier extends StateNotifier<OrderDetailModel?> {
  OrderDetailNotifier() : super(null);

  /// this method does nothing. Otherwise, it creates a ,new `OrderDetailModel`
  void initializeOrder({
    required String orderType,
  }) {
    print('condition Initialize order');
    if (state != null) return;
    print('Initialize order');
    state = OrderDetailModel(
      orderType: orderType,
      items: [],
    );
  }

  void addOrderFromSavedOrderDetail(OrderDetailModel orderDetail) {
    clearOrder();
    state = orderDetail;
  }

  // Set order type (dine-in, take away, delivery)
  void updateOrderType(String orderType) {
    if (state != null) {
      state = state!.copyWith(orderType: orderType);
      print('Order Type: $orderType');
    }
  }

  // Set customer name, phone number, dan table number
  void updateCustomerDetails({
    String? customerName,
    String? phoneNumber,
    int? tableNumber,
  }) {
    if (state != null) {
      state = state!.copyWith(
        customerName: customerName ?? state!.customerName,
        phoneNumber: phoneNumber ?? state!.phoneNumber,
        tableNumber: tableNumber ?? state!.tableNumber,
      );
    }
  }

  // Tambahkan menu ke daftar pesanan
  void addItemToOrder(OrderItemModel orderItem) {
    final existingOrderItemIndex = state!.items.indexWhere(
      (item) =>
          item.menuItem.id == orderItem.menuItem.id &&
          _areToppingsEqual(
              item.selectedToppings, orderItem.selectedToppings) &&
          _areAddonsEqual(item.selectedAddons, orderItem.selectedAddons),
    );
    if (existingOrderItemIndex != -1) {
      // Jika menu item sudah ada, tambahkan quantity-nya
      state?.items[existingOrderItemIndex].quantity += orderItem.quantity;
      state = state!.copyWith(items: state!.items);
    } else {
      // Jika menu item belum ada, tambahkan ke daftar pesanan
      state = state!.copyWith(items: [...state!.items, orderItem]);
    }
    // if (state != null) {
    //   state = state!.copyWith(items: [...state!.items, orderItem]);
    // }
  }

  bool _areToppingsEqual(
      List<ToppingModel> toppings1, List<ToppingModel> toppings2) {
    if (toppings1.length != toppings2.length) return false;
    for (var i = 0; i < toppings1.length; i++) {
      if (toppings1[i].id != toppings2[i].id) return false;
    }
    return true;
  }

  bool _areAddonsEqual(List<AddonModel> addons1, List<AddonModel> addons2) {
    if (addons1.length != addons2.length) return false;
    for (var i = 0; i < addons1.length; i++) {
      if (addons1[i].options.first.id != addons2[i].options.first.id) {
        return false;
      }
    }
    return true;
  }

  void removeItem(OrderItemModel menuItem) {
    final index = state!.items.indexOf(menuItem);
    if (index != -1) {
      state!.items.removeAt(index);
      state = state!.copyWith(items: state!.items);
    }
  }

  void updateItemQuantity(String menuItemId, int quantity) {
    if (state != null) {
      state = state!.copyWith(
        items: state!.items.map((item) {
          if (item.menuItem.id == menuItemId) {
            return item.copyWith(quantity: quantity);
          }
          return item;
        }).toList(),
      );
    }
  }

  void editOrderItem(OrderItemModel oldOrderItem, OrderItemModel newOrderItem) {
    final index = state!.items.indexOf(oldOrderItem);
    if (index != -1) {
      state!.items[index] =
          newOrderItem; // Ganti OrderItem lama dengan yang baru
      state = state = state!.copyWith(items: state!.items);
    }
  }

  // Kosongkan daftar pesanan
  void clearOrder() {
    state = null;
  }

  // Hitung total harga dari daftar pesanan
  double get totalPrice {
    if (state != null) {
      return state!.items.fold(
        0,
        (sum, item) => sum + item.subTotalPrice,
      );
    } else {
      return 0;
    }
  }
}

// Provider untuk OrderDetailNotifier
final orderDetailProvider =
    StateNotifierProvider<OrderDetailNotifier, OrderDetailModel?>((ref) {
  return OrderDetailNotifier();
});
