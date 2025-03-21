import 'package:barajapos/models/order_detail_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';

class SavedOrderProvider extends StateNotifier<List<OrderDetailModel?>> {
  SavedOrderProvider() : super([]);

  //ini harusnya buat List savedOrderDetail
  void savedOrder(OrderDetailModel orderDetail) {
    state = [...state, orderDetail];
  }

  //memindahkan state saved order detail ke order detail provider
  void moveToOrder(OrderDetailModel orderDetail) {
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

// Provider untuk SavedOrderProvider
final savedOrderProvider =
    StateNotifierProvider<SavedOrderProvider, List<OrderDetailModel?>>((ref) {
  return SavedOrderProvider();
});
