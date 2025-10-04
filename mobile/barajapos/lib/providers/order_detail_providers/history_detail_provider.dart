import 'package:barajapos/models/adapter/order_detail.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';

class HistoryDetailProvider extends StateNotifier<OrderDetailModel?> {
  HistoryDetailProvider() : super(null);

  //ini harusnya buat List History
  void addToHistoryDetail(OrderDetailModel orderDetail) {
    state = orderDetail;
  }

  //memindahkan state history detail provider ke order detail provider
  void moveToOrderDetail() {
    if (state != null) {
      // state = state;
    }
  }

  void removeItem(String menuItemId) {
    if (state != null && state!.items.isNotEmpty) {
      state = state!.copyWith(
        items: state!.items
            .where((item) => item.menuItem.id != menuItemId)
            .toList(),
      );
    }
  }

  // Kosongkan daftar pesanan
  void clearHistoryDetail() {
    state = null;
  }

  // Hitung total harga dari daftar pesanan
  int get totalPrice {
    return state?.items.fold(
          0,
          (sum, item) => sum! + item.calculateSubTotalPrice(),
        ) ??
        0;
  }
}

// Provider untuk HistoryDetailProvider
final historyDetailProvider =
    StateNotifierProvider<HistoryDetailProvider, OrderDetailModel?>((ref) {
  return HistoryDetailProvider();
});
