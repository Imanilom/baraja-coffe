import 'package:barajapos/models/adapter/order_detail.model.dart';
import 'package:barajapos/providers/order_detail_providers/order_detail_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';

class SavedOrderProvider extends StateNotifier<List<OrderDetailModel?>> {
  SavedOrderProvider() : super([]);

  //ini harusnya buat List savedOrderDetail
  void savedOrder(WidgetRef ref) {
    final orderDetail = ref.watch(orderDetailProvider);
    if (orderDetail == null || orderDetail.items.isEmpty) return;
    state = [...state, orderDetail];
  }

  //hapus order detail
  void deleteOrderDetail(OrderDetailModel orderDetail) {
    if (state.isNotEmpty) {
      state = state.where((detail) => detail != orderDetail).toList();
    }
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
          (sum, item) => sum + item.calculateSubTotalPrice(),
        );
  }
}

// Provider untuk SavedOrderProvider
final savedOrderProvider =
    StateNotifierProvider<SavedOrderProvider, List<OrderDetailModel?>>((ref) {
  return SavedOrderProvider();
});
