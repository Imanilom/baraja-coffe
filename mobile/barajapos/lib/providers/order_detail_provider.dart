import 'package:barajapos/models/order_detail_model.dart';
import 'package:barajapos/models/order_item_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';

class OrderDetailNotifier extends StateNotifier<OrderDetailModel?> {
  OrderDetailNotifier() : super(null);

  void initializeOrder({
    required String cashierId,
    required String orderType,
  }) {
    print('Initialize order');
    if (state != null) return;
    state = OrderDetailModel(
      cashierId: cashierId,
      customerName: '',
      orderType: orderType,
      items: [],
    );
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
    if (state != null) {
      state = state!.copyWith(items: [...state!.items, orderItem]);
    }
  }

  void removeItem(String menuItemId) {
    if (state != null) {
      state = state!.copyWith(
        items: state!.items
            .where((item) => item.menuItem.id != menuItemId)
            .toList(),
      );
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
