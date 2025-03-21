import 'package:barajapos/models/order_detail_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';

class SavedOrderDetailProvider extends StateNotifier<List<OrderDetailModel?>> {
  SavedOrderDetailProvider() : super([]);

  //ini harusnya buat List savedOrderDetail
  void savedOrderDetail(OrderDetailModel orderDetail) {
    state = [...state, orderDetail];
  }

  //memindahkan state saved order detail ke order detail provider
  void moveToOrderDetail(OrderDetailModel orderDetail) {
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

  // Hitung total harga dari daftar pesanan
  double get totalPrice {
    return state.expand((orderDetail) => orderDetail!.items).fold(
          0,
          (sum, item) => sum + item.subTotalPrice,
        );
  }
}

// Provider untuk SavedOrderDetailProvider
final savedOrderDetailProvider =
    StateNotifierProvider<SavedOrderDetailProvider, List<OrderDetailModel?>>(
        (ref) {
  return SavedOrderDetailProvider();
});
