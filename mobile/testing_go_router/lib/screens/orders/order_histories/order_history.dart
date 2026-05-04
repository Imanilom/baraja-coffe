import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/orders/order_history_provider.dart';
import 'package:kasirbaraja/screens/orders/order_histories/widgets/order_list_widget.dart';
import 'package:kasirbaraja/screens/orders/order_histories/widgets/receipt_widget.dart';
import 'package:kasirbaraja/screens/orders/order_histories/widgets/order_detail_widget.dart';
import 'package:kasirbaraja/providers/order_detail_providers/history_detail_provider.dart';

class OrderHistoryScreen extends ConsumerWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderHistoryAsync = ref.watch(orderHistoryProvider);

    return Scaffold(
      // appBar: AppBar(
      //   title: const Text('Order History'),
      //   backgroundColor: Colors.blue[700],
      //   foregroundColor: Colors.white,
      //   actions: [
      //     IconButton(
      //       icon: const Icon(Icons.refresh),
      //       onPressed: () {
      //         ref.invalidate(orderHistoryProvider);
      //       },
      //     ),
      //   ],
      // ),
      body: Row(
        children: [
          // Left Section - Order List
          Expanded(
            flex: 3,
            child: Container(
              decoration: BoxDecoration(
                border: Border(right: BorderSide(color: Colors.grey[300]!)),
              ),
              // child: OrderListWidget(orders: orders),
              child: orderHistoryAsync.when(
                data:
                    (orders) => OrderListWidget(
                      orders: orders,
                      selectedOrder: ref.watch(historyDetailProvider),
                      onSelect:
                          (order) => ref
                              .read(historyDetailProvider.notifier)
                              .addToHistoryDetail(order),
                      onRefresh: () => ref.invalidate(orderHistoryProvider),
                    ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stackTrace) => _buildErrorState(error, ref),
              ),
            ),
          ),
          // Middle Section - Order Detail
          Expanded(
            flex: 3,
            child: Container(
              decoration: BoxDecoration(
                border: Border(right: BorderSide(color: Colors.grey[300]!)),
                //color,
                color: Colors.grey[50],
              ),
              child: OrderDetailWidget(
                order: ref.watch(historyDetailProvider),
                onClose:
                    () =>
                        ref
                            .read(historyDetailProvider.notifier)
                            .clearHistoryDetail(),
              ),
            ),
          ),
          // Right Section - Receipt
          Expanded(flex: 3, child: const ReceiptWidget()),
        ],
      ),
      // body: orderHistoryAsync.when(
      //   data:
      //       (orders) =>
      //   loading: () => const Center(child: CircularProgressIndicator()),
      //   error:
      //       (error, stackTrace) => Center(
      //         child: Column(
      //           mainAxisAlignment: MainAxisAlignment.center,
      //           children: [
      //             Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
      //             const SizedBox(height: 8),
      //             Row(
      //               mainAxisAlignment: MainAxisAlignment.spaceBetween,
      //               children: [
      //                 Text(
      //                   // 'Base Price: Rp ${items.menuItem.price}',
      //                   'Base Price: Rp 0000',
      //                   style: TextStyle(color: Colors.grey[600], fontSize: 12),
      //                 ),
      //                 Text(
      //                   'Subtotal: Rp 0000',
      //                   // 'Subtotal: Rp ${item.subtotal}',
      //                   style: const TextStyle(
      //                     fontWeight: FontWeight.bold,
      //                     fontSize: 12,
      //                   ),
      //                 ),
      //               ],
      //             ),
      //           ],
      //         ),
      //       ),
      // ),
    );
  }

  Widget _buildPricingDetails(OrderDetailModel order) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Pricing Details',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildPriceRow('Subtotal', order.totalBeforeDiscount),
            if (order.discounts!.autoPromoDiscount > 0)
              _buildPriceRow(
                'Auto Promo Discount',
                -order.discounts!.autoPromoDiscount,
                isDiscount: true,
              ),
            if (order.discounts!.manualDiscount > 0)
              _buildPriceRow(
                'Manual Discount',
                -order.discounts!.manualDiscount,
                isDiscount: true,
              ),
            if (order.discounts!.voucherDiscount > 0)
              _buildPriceRow(
                'Voucher Discount',
                -order.discounts!.voucherDiscount,
                isDiscount: true,
              ),
            _buildPriceRow('Total after Discount', order.totalAfterDiscount),
            ...order.taxAndServiceDetails.map(
              (detail) => _buildPriceRow(
                detail.name!,
                detail.amount.toInt(),
                isTax: true,
              ),
            ),
            if (order.totalServiceFee > 0)
              _buildPriceRow('Service Fee', order.totalServiceFee, isTax: true),
            const Divider(),
            _buildPriceRow('Grand Total', order.grandTotal, isGrandTotal: true),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceRow(
    String label,
    int amount, {
    bool isDiscount = false,
    bool isTax = false,
    bool isGrandTotal = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: isGrandTotal ? Colors.black : Colors.grey[600],
              fontWeight: isGrandTotal ? FontWeight.bold : FontWeight.normal,
              fontSize: isGrandTotal ? 16 : 14,
            ),
          ),
          Text(
            'Rp $amount',
            style: TextStyle(
              color:
                  isDiscount
                      ? Colors.red
                      : (isGrandTotal ? Colors.green[700] : Colors.black),
              fontWeight: isGrandTotal ? FontWeight.bold : FontWeight.w500,
              fontSize: isGrandTotal ? 16 : 14,
            ),
          ),
        ],
      ),
    );
  }
}

Widget _buildErrorState(dynamic error, WidgetRef ref) {
  return Container(
    padding: const EdgeInsets.all(32),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.red.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.error_outline_rounded,
            size: 48,
            color: Colors.red,
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Something went wrong',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Unable to load history. Please try again.',
          style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: () {
            ref.read(orderHistoryProvider.notifier).refreshHistory();
          },
          icon: const Icon(Icons.refresh_rounded, size: 18),
          label: const Text('Try Again'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 4,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Error: ${error.toString()}',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade500,
            fontFamily: 'monospace',
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    ),
  );
}
