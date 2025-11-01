import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';

class HistoryDetailProvider extends StateNotifier<OrderDetailModel?> {
  HistoryDetailProvider() : super(null);

  //ini harusnya buat List History
  void addToHistoryDetail(OrderDetailModel orderDetail) {
    state = orderDetail;
  }

  void removeItem(String menuItemId) {
    if (state != null && state!.items.isNotEmpty) {
      state = state!.copyWith(
        items:
            state!.items
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
  int get subTotalPrice {
    print('menghitung history subtotal');
    if (state != null) {
      return state!.items.fold(0, (sum, item) => sum + item.subtotal);
    } else {
      return 0;
    }
  }
}

// Provider untuk HistoryDetailProvider
final historyDetailProvider =
    StateNotifierProvider<HistoryDetailProvider, OrderDetailModel?>((ref) {
      return HistoryDetailProvider();
    });
