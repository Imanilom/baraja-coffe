import 'package:barajapos/models/adapter/topping.model.dart';
import 'package:barajapos/models/adapter/addon.model.dart';
import 'package:barajapos/models/adapter/order_detail.model.dart';
import 'package:barajapos/models/adapter/order_item.model.dart';
import 'package:barajapos/services/order_service.dart';
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

  // Set payment method
  void updatePaymentMethod(String paymentMethod) {
    if (state != null) {
      state = state!.copyWith(paymentMethod: paymentMethod);
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
    print('memeriksa apakah menu item sudah ada....');
    final existingOrderItemIndex = state!.items.indexWhere(
      (item) =>
          item.menuItem.id == orderItem.menuItem.id &&
          _areToppingsEqual(
              item.selectedToppings, orderItem.selectedToppings) &&
          _areAddonsEqual(item.selectedAddons, orderItem.selectedAddons),
    ); //letak errornya disiini
    print('mendapatkan index: $existingOrderItemIndex');
    if (existingOrderItemIndex != -1) {
      print('menu item yang sudah ada');
      // Jika menu item sudah ada, tambahkan quantity-nya
      final updatedItem = state!.items[existingOrderItemIndex].copyWith(
          quantity: state!.items[existingOrderItemIndex].quantity +
              orderItem.quantity);
      final updatedItems = [...state!.items];
      updatedItems[existingOrderItemIndex] = updatedItem;
      state = state!.copyWith(items: updatedItems);
    } else {
      print('menu item yang belum ada');

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
  int get totalPrice {
    if (state != null) {
      return state!.items.fold(
        0,
        (sum, item) =>
            sum +
            item.calculateSubTotalPrice(
              menuItem: item.menuItem,
              selectedToppings: item.selectedToppings,
              selectedAddons: item.selectedAddons,
              quantity: item.quantity,
            ),
      );
    } else {
      return 0;
    }
  }

  // Kirim data orderDetail ke backend
  Future<bool> submitOrder() async {
    try {
      final order = await OrderService().createOrder(state!);
      // print('Order ID: $order');
      if (order.isNotEmpty) {
        return true;
      }
    } catch (e) {
      // print(e);
      return false;
    }
    return false; // Return false if state is null
  }
}

// Provider untuk OrderDetailNotifier
final orderDetailProvider =
    StateNotifierProvider<OrderDetailNotifier, OrderDetailModel?>((ref) {
  return OrderDetailNotifier();
});
