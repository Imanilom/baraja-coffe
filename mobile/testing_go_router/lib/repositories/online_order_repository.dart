import 'package:kasirbaraja/services/order_service.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/models/try/try_order_detail.model.dart';

class OnlineOrderRepository {
  final OrderService _orderService = OrderService();

  Future<List<OrderDetailModel>> fetchPendingOrders(String outletId) async {
    try {
      final response = await _orderService.fetchPendingOrders(outletId);
      // AppLogger.debug("response pending orders: $response");
      AppLogger.debug("Pending orders fetched: ${response.length}");

      if (response['orders'] == null || response['orders'].length == 0) {
        // print("Tidak ada data pending orders yang ditemukan. $response");
        return [];
      }

      // Batasi hanya 10 data
      final limitedResponse = response['orders'];

      // print("Data pending orders yg diambil sebelum limit: $limitedResponse");
      final onlineOrders =
          (limitedResponse as List).map((json) {
            // Pertama buat model dasar dari JSON
            // print(
            //   "Data pending orders yg diambil, berikut datanya json: $json",
            // );
            final baseModel = OrderDetailModel.fromJson(json);

            // Kemudian hitung dan tambahkan field kalkulasi
            // print('base model: $baseModel');
            return baseModel;
          }).toList();
      // AppLogger.debug("Data pending orders yg diambil, berikut datanya: $onlineOrders");
      return onlineOrders;
    } catch (e) {
      AppLogger.error("Failed to fetch pending orders", error: e);
      rethrow;
    }
  }

  Future<OrderDetailModel> deleteOrderItem({
    required String orderId,
    required String menuItemId,
  }) async {
    try {
      final response = await _orderService.deleteOrderItemAtOrder(
        orderId: orderId,
        menuItemId: menuItemId,
      );

      final json = response['data']?['order'] ?? response['data'] ?? response;

      AppLogger.debug('response delete order item: $json');
      final updatedOrder = json['order_id'];
      AppLogger.debug('Updated order after delete item: $updatedOrder');
      return _orderService.fetchOrderDetail(updatedOrder);
    } catch (e) {
      AppLogger.error("Failed to remove item from order", error: e);
      rethrow;
    }
  }

  Future<void> confirmOrder(WidgetRef ref, OrderDetailModel orderDetail) async {
    try {
      final result = await _orderService.confirmPendingOrder(ref, orderDetail);
      AppLogger.info('Order confirmed successfully: $result');
    } catch (e) {
      AppLogger.error('Failed to confirm order', error: e);
      rethrow;
    }
  }
}
