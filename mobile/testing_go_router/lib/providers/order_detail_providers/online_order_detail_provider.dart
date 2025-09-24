import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/menu_item_model.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/order_service.dart';

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
      return state!.items.fold(0, (sum, item) => sum + item.subtotal);
    } else {
      return 0;
    }
  }

  Future<bool> submitOnlineOrder() async {
    final cashier = await HiveService.getCashier();
    //update cashier id di order detail model
    state = state!.copyWith(cashierId: cashier!.id);
    if (state == null) return false;
    print('Mengirim data orderDetail ke backend... ${state!.toJson()}');
    try {
      // final order = await OrderService().createOrder(state!);
      // print('Order ID : $order');
      // if (order.isNotEmpty) {
      //   return true;
      // }
    } catch (e) {
      print('error apa? $e');
      return false;
    }
    return false; // Return false if state is null
  }
}

// Provider untuk OnlineOrderDetailProvider
final onlineOrderDetailProvider =
    StateNotifierProvider<OnlineOrderDetailProvider, OrderDetailModel?>((ref) {
      return OnlineOrderDetailProvider();
    });
