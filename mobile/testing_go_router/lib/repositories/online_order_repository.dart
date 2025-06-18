import 'package:kasirbaraja/services/order_service.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/utils/extention.dart';
// import 'package:barajapos/models/try/try_order_detail.model.dart';

class OnlineOrderRepository {
  final OrderService _orderService = OrderService();

  Future<List<OrderDetailModel>> fetchPendingOrders() async {
    try {
      final response = await _orderService.fetchPendingOrders();
      // print("response pending orders: $response");
      print("Data pending orders yg diambil: ${response.length}");

      // Batasi hanya 10 data
      final limitedResponse =
          response.length > 10 ? response.sublist(0, 10) : response;

      final onlineOrders =
          limitedResponse.map((json) {
            // Pertama buat model dasar dari JSON
            final baseModel = OrderDetailModel.fromJson(json);

            // Kemudian hitung dan tambahkan field kalkulasi
            return baseModel.withCalculations(
              totalTax: json['totalTax'],
              discounts: json['discounts'],
              totalServiceFee: json['totalServiceFee'],
            );
          }).toList();
      return onlineOrders;
    } catch (e) {
      print("Gagal mengambil data pending orders: ${e.toString()}");
      rethrow;
    }
  }

  Future<void> confirmOrder(WidgetRef ref, OrderDetailModel orderDetail) async {
    try {
      final result = await _orderService.confirmPendingOrder(ref, orderDetail);
      print('Order berhasil dikonfirmasi: $result');
    } catch (e) {
      print('Gagal konfirmasi order: ${e.toString()}');
      rethrow;
    }
  }
}
