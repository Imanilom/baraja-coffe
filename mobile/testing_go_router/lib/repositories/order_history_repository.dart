import 'package:kasirbaraja/models/cashier.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/services/order_history_service.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:hive_ce/hive.dart';

class OrderHistoryRepository {
  final OrderHistoryService _orderHistoryService = OrderHistoryService();

  Future<List<OrderDetailModel>> fetchOrderHistory() async {
    try {
      final box = Hive.box('userBox');
      final cashier = box.get('cashier') as CashierModel?;
      AppLogger.debug('Cashier from Hive: ${cashier?.id}');
      final response = await _orderHistoryService.fetchOrderHistory(
        cashier!.id!,
      );

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
