import 'package:barajapos/models/adapter/order_detail.model.dart';
import 'package:barajapos/services/order_history_service.dart';

class OrderHistoryRepository {
  final OrderHistoryService _orderHistoryService = OrderHistoryService();

  Future<List<OrderDetailModel>> fetchOrderHistory(String cashierId) async {
    try {
      final response = await _orderHistoryService.fetchOrderHistory(cashierId);

      print("response order history: $response");
      print("Data order history yg diambil: ${response.length}");

      final orderHistory = (response['orders'] as List)
          .map((json) => OrderDetailModel.fromJson(json))
          .toList();

      return orderHistory;
    } catch (e) {
      print("Gagal mengambil data order history: ${e.toString()}");
      rethrow;
    }
  }
}
