import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';

class SavedOrderDetailProvider extends StateNotifier<OrderDetailModel?> {
  SavedOrderDetailProvider() : super(null);

  //ini harusnya buat List savedOrderDetail
  void savedOrderDetail(OrderDetailModel orderDetail) {
    state = orderDetail;
  }

  //memindahkan state saved order detail ke order detail provider
  void moveToOrderDetail(OrderDetailModel orderDetail, WidgetRef ref) {
    if (state!.items.isNotEmpty) {
      ref
          .read(orderDetailProvider.notifier)
          .addOrderFromSavedOrderDetail(orderDetail);
      state = null;
    }
  }

  // Hitung total harga dari daftar pesanan
  int get subTotalPrice {
    if (state != null) {
      return state!.items.fold(
        0,
        (sum, item) => sum + item.calculateSubTotalPrice(),
      );
    } else {
      return 0;
    }
  }
}

// Provider untuk SavedOrderDetailProvider
final savedOrderDetailProvider =
    StateNotifierProvider<SavedOrderDetailProvider, OrderDetailModel?>((ref) {
      return SavedOrderDetailProvider();
    });
