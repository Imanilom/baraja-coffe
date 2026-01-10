import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/services/order_history_service.dart';
import 'package:kasirbaraja/utils/app_logger.dart';

class OrderHistoryRepository {
  final OrderHistoryService _orderHistoryService = OrderHistoryService();

  // ✅ FIX #4: Accept cashierId as parameter, remove Hive access
  Future<List<OrderDetailModel>> fetchOrderHistory(String cashierId) async {
    try {
      final response = await _orderHistoryService.fetchOrderHistory(cashierId);

      AppLogger.debug("Order history data fetched: ${response.length}");

      if (response['orders'].isEmpty) {
        AppLogger.info("No pending orders found. $response");
        return [];
      }

      final orders = response['orders'] as List;
      AppLogger.debug(
        'Converting JSON to model ${response['orders'][0]['payment_details']}',
      );
      final orderHistory =
          orders.map((json) => OrderDetailModel.fromJson(json)).toList();

      AppLogger.debug("Data order history yg diambils: ${orderHistory.length}");

      return orderHistory;
    } catch (e) {
      AppLogger.error("Failed to fetch order history", error: e);
      rethrow;
    }
  }
}
