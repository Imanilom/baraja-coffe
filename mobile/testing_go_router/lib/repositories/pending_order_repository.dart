import 'package:kasirbaraja/services/order_service.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/utils/extention.dart';
// import 'package:barajapos/models/try/try_order_detail.model.dart';

class PendingOrderRepository {
  final OrderService _orderService = OrderService();

  Future<List<OrderDetailModel>> fetchPendingOrders(String outletId) async {
    try {
      final response = await _orderService.fetchPendingOrdersCashier(outletId);

      if (response['orders'] == null || response['orders'].length == 0) {
        return [];
      }

      // Batasi hanya 10 data
      final limitedResponse = response['orders'];

      final pendingOrders =
          (limitedResponse as List).map((json) {
            final baseModel = OrderDetailModel.fromJson(json);
            return baseModel;
          }).toList();

      return pendingOrders;
    } catch (e) {
      print("Gagal mengambil data pending orders: ${e.toString()}");
      rethrow;
    }
  }

  Future<void> confirmOrder(WidgetRef ref, OrderDetailModel orderDetail) async {
    try {
      final result = await _orderService.confirmPendingOrder(ref, orderDetail);
    } catch (e) {
      print('Gagal konfirmasi order: ${e.toString()}');
      rethrow;
    }
  }
}
