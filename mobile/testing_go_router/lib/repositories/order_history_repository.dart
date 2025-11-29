import 'package:kasirbaraja/models/cashier.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/services/order_history_service.dart';
import 'package:hive_ce/hive.dart';

class OrderHistoryRepository {
  final OrderHistoryService _orderHistoryService = OrderHistoryService();

  Future<List<OrderDetailModel>> fetchOrderHistory() async {
    try {
      final box = Hive.box('userBox');
      final cashier = box.get('cashier') as CashierModel?;
      print('Cashier from Hive: ${cashier?.id}');
      final response = await _orderHistoryService.fetchOrderHistory(
        cashier!.id!,
      );

      print("Data order history yg diambil: ${response.length}");

      if (response['orders'].isEmpty) {
        print("Tidak ada data pending orders yang ditemukan. $response");
        return [];
      }

      final orders = response['orders'] as List;
      print(
        'konversi json ke model ${response['orders'][0]['payment_details']}',
      );
      final orderHistory =
          orders.map((json) => OrderDetailModel.fromJson(json)).toList();

      print("Data order history yg diambils: ${orderHistory.length}");

      return orderHistory;
    } catch (e) {
      print("Gagal mengambil data order history: ${e.toString()}");
      rethrow;
    }
  }
}
