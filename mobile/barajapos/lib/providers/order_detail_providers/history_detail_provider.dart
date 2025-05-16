import 'package:barajapos/models/order_detail_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';

class HistoryDetailProvider extends StateNotifier<List<OrderDetailModel?>> {
  HistoryDetailProvider() : super([]);

  //ini harusnya buat List History
  void addToHistoryDetail(OrderDetailModel orderDetail) {
    state = [...state, orderDetail];
  }

  //memindahkan state history detail provider ke order detail provider
  void moveToOrderDetail() {
    if (state.isNotEmpty) {
      // state = state;
    }
  }

  void removeItem(String menuItemId) {
    if (state.isNotEmpty) {
      state = [
        ...state.map((orderDetail) => orderDetail?.copyWith(
              items: orderDetail.items
                  .where((item) => item.menuItem.id != menuItemId)
                  .toList(),
            )),
      ];
    }
  }

  // Kosongkan daftar pesanan
  void clearHistoryDetail() {
    state = [];
  }

  // Hitung total harga dari daftar pesanan
  double get totalPrice {
    return state.expand((orderDetail) => orderDetail!.items).fold(
          0,
          (sum, item) => sum + item.subTotalPrice,
        );
  }
}

// Provider untuk HistoryDetailProvider
final historyDetailProvider =
    StateNotifierProvider<HistoryDetailProvider, List<OrderDetailModel?>>(
        (ref) {
  return HistoryDetailProvider();
});
