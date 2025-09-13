import 'package:kasirbaraja/services/order_service.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/utils/extention.dart';
// import 'package:barajapos/models/try/try_order_detail.model.dart';

class OnlineOrderRepository {
  final OrderService _orderService = OrderService();

  Future<List<OrderDetailModel>> fetchPendingOrders(String outletId) async {
    try {
      final response = await _orderService.fetchPendingOrders(outletId);
      // print("response pending orders: $response");
      print("Data pending orders yg diambil: ${response.length}");

      if (response['orders'] == null || response['orders'].length == 0) {
        print("Tidak ada data pending orders yang ditemukan. $response");
        return [];
      }

      // Batasi hanya 10 data
      final limitedResponse = response['orders'];

      print("Data pending orders yg diambil sebelum limit: $limitedResponse");
      final onlineOrders =
          (limitedResponse as List).map((json) {
            // Pertama buat model dasar dari JSON
            print(
              "Data pending orders yg diambil, berikut datanya json: $json",
            );
            final baseModel = OrderDetailModel.fromJson(json);

            // Kemudian hitung dan tambahkan field kalkulasi
            print('base model: $baseModel');
            return baseModel;
          }).toList();
      print("Data pending orders yg diambil, berikut datanya: $onlineOrders");
      return onlineOrders;
    } catch (e) {
      print("Gagal mengambil data pending orders: ${e.toString()}");
      rethrow;
    }
  }

  Future<void> confirmPaidOrder(
    WidgetRef ref,
    String? orderId,
    String source,
  ) async {
    try {
      final result = await _orderService.confirmPaidOrder(ref, orderId, source);
      print('Order berhasil dikonfirmasi: $result');
    } catch (e) {
      print('Gagal konfirmasi order: ${e.toString()}');
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
