import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/history_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/order_history_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/screens/orders/order_histories/widgets/order_list_widget.dart';
import 'package:kasirbaraja/screens/orders/order_histories/widgets/receipt_widget.dart';
import 'package:kasirbaraja/screens/orders/order_histories/widgets/order_detail_widget.dart';

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
      body: orderHistoryAsync.when(
        data:
            (orders) => Row(
              children: [
                // Left Section - Order List
                Expanded(
                  flex: 3,
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border(
                        right: BorderSide(color: Colors.grey[300]!),
                      ),
                    ),
                    child: OrderListWidget(orders: orders),
                  ),
                ),
                // Middle Section - Order Detail
                Expanded(
                  flex: 3,
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border(
                        right: BorderSide(color: Colors.grey[300]!),
                      ),
                      //color,
                      color: Colors.grey[50],
                    ),
                    child: const OrderDetailWidget(),
                  ),
                ),
                // Right Section - Receipt
                Expanded(flex: 3, child: const ReceiptWidget()),
              ],
            ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error:
            (error, stackTrace) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        // 'Base Price: Rp ${items.menuItem.price}',
                        'Base Price: Rp 0000',
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                      Text(
                        'Subtotal: Rp 0000',
                        // 'Subtotal: Rp ${item.subtotal}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
      ),
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
