import 'package:barajapos/models/order_item_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';

class OrderNotifier extends StateNotifier<List<OrderItemModel>> {
  OrderNotifier() : super([]);

  // Tambahkan menu ke daftar pesanan
  void addToOrder(OrderItemModel orderItem) {
    state = [...state, orderItem];
  }

  // Hapus menu dari daftar pesanan
  void removeFromOrder(OrderItemModel orderItem) {
    state = state.where((item) => item != orderItem).toList();
  }

  // Kosongkan daftar pesanan
  void clearOrder() {
    state = [];
  }

  // Hitung total harga dari daftar pesanan
  double get totalPrice {
    return state.fold(0, (sum, item) => sum + item.subTotalPrice);
  }
}

// Provider untuk OrderNotifier
final orderProvider =
    StateNotifierProvider<OrderNotifier, List<OrderItemModel>>((ref) {
  return OrderNotifier();
});
