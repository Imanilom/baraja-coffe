import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/services/order_service.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/providers/orders/pending_order_provider.dart';
import 'package:kasirbaraja/services/printer_service.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/utils/app_logger.dart';

class PendingOrderDetailProvider extends StateNotifier<OrderDetailModel?> {
  PendingOrderDetailProvider() : super(null);

  //ini harusnya buat List savedOrderDetail
  void savedPendingOrderDetail(OrderDetailModel orderDetail) {
    state = orderDetail;
  }

  void clearPendingOrderDetail() {
    state = null;
  }

  // Hitung total harga dari daftar pesanan
  int get subTotalPrice {
    if (state != null) {
      return state!.items.fold(0, (sum, item) => sum + item.subtotal);
    } else {
      return 0;
    }
  }

  Future<bool> submitPendingOrder(WidgetRef ref) async {
    if (state == null) return false;
    final cashier = await HiveService.getCashier();

    try {
      //update cashier id di order detail model
      state = state!.copyWith(cashier: cashier);

      final order = await OrderService().createOrder(state!);
      AppLogger.debug('Order ID : $order');
      if (order.isNotEmpty) {
        return true;
      }
    } catch (e) {
      AppLogger.error('Error submitting pending order', error: e);
      return false;
    }
    return false;
  }

  /// ❌ DEPRECATED: Close bill now uses PaymentScreen for payment selection
  /// This method is no longer used. Close bill button now navigates to PaymentScreen
  /// with isCloseBill flag, where payment details are collected before submission.
  ///
  /// See: order_detail_widget.dart line ~226 for new implementation
  @Deprecated('Use PaymentScreen with isCloseBill flag instead')
  Future<bool> closeBill(WidgetRef ref, String orderId) async {
    try {
      final cashier = await HiveService.getCashier();

      if (cashier?.id == null) {
        throw Exception("Cashier ID not found in local storage");
      }

      // ❌ This call is now invalid - closeOpenBill requires payment details
      // Keeping for backward compatibility but will throw error
      final orderService = OrderService();

      // This will fail because closeOpenBill now requires paymentDetails
      throw Exception(
        'Close bill without payment is no longer supported. '
        'Please use PaymentScreen to select payment method first.',
      );

      // Old code commented out:
      // final result = await orderService.closeOpenBill(orderId, cashier!.id!);
      //
      // if (result['success'] == true) {
      //   ref.invalidate(pendingOrderProvider);
      //   final updatedOrder = await orderService.fetchOrderDetail(orderId);
      //   state = updatedOrder;
      //   // ... print receipt ...
      //   return true;
      // }
      // return false;
    } catch (e) {
      AppLogger.error('Error closing bill', error: e);
      rethrow;
    }
  }
}

// Provider untuk PendingOrderDetailProvider
final pendingOrderDetailProvider =
    StateNotifierProvider<PendingOrderDetailProvider, OrderDetailModel?>((ref) {
      return PendingOrderDetailProvider();
    });
