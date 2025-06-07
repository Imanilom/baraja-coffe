import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/services/order_history_service.dart';

class OrderHistoryRepository {
  final OrderHistoryService _orderHistoryService = OrderHistoryService();

  Future<List<OrderDetailModel>> fetchOrderHistory(String cashierId) async {
    try {
      final response = await _orderHistoryService.fetchOrderHistory(cashierId);

      final orders = response['orders'];

      if (orders == null || orders is! List) {
        return [];
      }

      final orderHistory =
          orders
              .map((json) => OrderDetailModel.fromJson(json))
              .toList()
              .cast<OrderDetailModel>();

      print("Data order history yg diambil: ${orderHistory.length}");

      return orderHistory;
    } catch (e) {
      print("Gagal mengambil data order history: ${e.toString()}");
      rethrow;
    }
  }
}
