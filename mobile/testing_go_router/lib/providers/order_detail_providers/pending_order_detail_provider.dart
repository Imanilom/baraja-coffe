import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/services/hive_service.dart';

class PendingOrderDetailProvider extends StateNotifier<OrderDetailModel?> {
  PendingOrderDetailProvider() : super(null);

  //ini harusnya buat List savedOrderDetail
  void savedPendingOrderDetail(OrderDetailModel orderDetail) {
    state = orderDetail;
  }

  void clearPendingOrderDetail() {
    state = null;
  }

  // Hitung total harga dari daftar pesanan
  int get subTotalPrice {
    if (state != null) {
      return state!.items.fold(0, (sum, item) => sum + item.subtotal);
    } else {
      return 0;
    }
  }

  Future<bool> submitPendingOrder() async {
    final cashier = await HiveService.getCashier();
    //update cashier id di order detail model
    state = state!.copyWith(cashier: cashier);
    if (state == null) return false;
    try {
      // final order = await OrderService().createOrder(state!);
      // print('Order ID : $order');
      // if (order.isNotEmpty) {
      //   return true;
      // }
    } catch (e) {
      return false;
    }
    return false; // Return false if state is null
  }
}

// Provider untuk PendingOrderDetailProvider
final pendingOrderDetailProvider =
    StateNotifierProvider<PendingOrderDetailProvider, OrderDetailModel?>((ref) {
      return PendingOrderDetailProvider();
    });
