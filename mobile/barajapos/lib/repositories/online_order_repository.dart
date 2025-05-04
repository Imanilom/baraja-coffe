import 'package:barajapos/services/order_service.dart';
import 'package:barajapos/models/adapter/order_detail.model.dart';
// import 'package:barajapos/models/try/try_order_detail.model.dart';

class OnlineOrderRepository {
  final OrderService _orderService = OrderService();

  Future<List<OrderDetailModel>> fetchPendingOrders() async {
    try {
      final response = await _orderService.fetchPendingOrders();
      print("response pending orders: $response");
      print("Data pending orders yg diambil: ${response.length}");

      final onlineOrders = response
          .take(10)
          .map((json) => OrderDetailModel.fromJson(json))
          .toList();
      return onlineOrders;
    } catch (e) {
      print("Gagal mengambil data pending orders: ${e.toString()}");
      rethrow;
    }
  }
}
