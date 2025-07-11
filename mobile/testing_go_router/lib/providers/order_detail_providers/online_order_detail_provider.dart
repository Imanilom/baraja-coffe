import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';

class OnlineOrderDetailProvider extends StateNotifier<OrderDetailModel?> {
  OnlineOrderDetailProvider() : super(null);

  //ini harusnya buat List savedOrderDetail
  void savedOnlineOrderDetail(OrderDetailModel orderDetail) {
    print(orderDetail);
    state = orderDetail;
  }

  void clearOnlineOrderDetail() {
    state = null;
  }

  //memindahkan state saved order detail ke order detail provider
  // void moveToOrderDetail(OrderDetailModel orderDetail, WidgetRef ref) {
  //   if (state!.items.isNotEmpty) {
  //     ref
  //         .read(orderDetailProvider.notifier)
  //         .addOrderFromSavedOrderDetail(orderDetail);
  //     state = null;
  //   }
  // }

  // Hitung total harga dari daftar pesanan
  int get subTotalPrice {
    if (state != null) {
      return state!.items.fold(0, (sum, item) => sum + item.subTotalPrice!);
    } else {
      return 0;
    }
  }
}

// Provider untuk OnlineOrderDetailProvider
final onlineOrderDetailProvider =
    StateNotifierProvider<OnlineOrderDetailProvider, OrderDetailModel?>((ref) {
      return OnlineOrderDetailProvider();
    });
