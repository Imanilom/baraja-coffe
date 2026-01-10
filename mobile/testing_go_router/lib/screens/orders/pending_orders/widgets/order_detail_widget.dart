import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/pending_order_detail_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/utils/payment_status_utils.dart';

class OrderDetailWidget extends ConsumerWidget {
  final OrderDetailModel order;

  const OrderDetailWidget({super.key, required this.order});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          //close,
          IconButton(
            icon: const Icon(Icons.close, color: Colors.grey),
            onPressed: () {
              ref
                  .read(pendingOrderDetailProvider.notifier)
                  .clearPendingOrderDetail();
            },
          ),
          const SizedBox(height: 8),
          _buildHeader(order),
          const SizedBox(height: 8),
          _buildOrderInfo(order),
          const SizedBox(height: 8),
          _buildItemsList(context, order, ref),
          const SizedBox(height: 8),
          _buildPricingDetails(order),
        ],
      ),
    );
  }

  Widget _buildHeader(OrderDetailModel order) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            PaymentStatusUtils.getColor(order.paymentStatus!),
            PaymentStatusUtils.getColor(
              order.paymentStatus!,
            ).withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order.orderId ?? '-',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  order.createdAt != null
                      ? DateFormat(
                        'dd MMM yyyy, HH:mm',
                      ).format(order.createdAt!)
                      : '-',
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              order.status.name.toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderInfo(OrderDetailModel order) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Order Information',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          _buildInfoRow('Customer', order.user ?? 'Unknown'),
          _buildInfoRow('Order Type', order.orderType.name),
          if (order.tableNumber!.isNotEmpty)
            _buildInfoRow('Table', order.tableNumber ?? 'Unknown'),
          _buildInfoRow('Payment Method', order.paymentMethod ?? 'Unknown'),
          _buildInfoRow('Source', order.source ?? 'Unknown'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              ': $value',
              style: const TextStyle(fontWeight: FontWeight.w500),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemsList(
    BuildContext context,
    OrderDetailModel order,
    WidgetRef ref,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Items (${order.items.length})',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          ...order.items.map((item) => _buildItemCard(item)),

          //tombol edit order item hanyamuncul ketika payment detailnya belu sepenuhnya dibayar,
          if (order.items.isEmpty ||
              order.payments.isEmpty ||
              order.payments.any((p) => p.status!.toLowerCase() == "pending"))
            TextButton.icon(
              style: TextButton.styleFrom(backgroundColor: Colors.green[50]),
              icon: Icon(
                order.items.isEmpty ? Icons.add : Icons.edit,
                color: Colors.green,
              ),
              label: Text(
                order.items.isEmpty || order.isOpenBill == true
                    ? 'Add Order Item'
                    : 'Edit Order Item',
                style: TextStyle(color: Colors.green),
              ),
              onPressed: () {
                context.pushNamed(
                  'edit-order-item',
                  pathParameters: {'id': order.id ?? ''},
                  extra: order,
                );
              },
            ),

          if (order.isOpenBill == true) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange[700],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                icon: const Icon(Icons.receipt_long),
                label: const Text(
                  'CLOSE BILL',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                onPressed: () {
                  // ✅ Navigate to PaymentScreen (auto-detects close bill)
                  context.pushNamed(
                    'payment-method',
                    extra: order, // ✅ Pass order directly, auto-detect inside
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildItemCard(OrderItemModel item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.menuItem.name!,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${item.quantity}x',
                  style: TextStyle(
                    color: Colors.blue[700],
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // Text(
          //   item.menuItem.description!,
          //   style: TextStyle(color: Colors.grey[600], fontSize: 12),
          //   maxLines: 2,
          //   overflow: TextOverflow.ellipsis,
          // ),
          if (item.selectedToppings.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Toppings:',
              style: TextStyle(
                color: Colors.grey[700],
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
            ),
            ...item.selectedToppings.map(
              (topping) => Padding(
                padding: const EdgeInsets.only(left: 8, top: 2),
                child: Text(
                  '+ ${topping.name} (+ ${formatPrice(topping.price!)})',
                  style: TextStyle(color: Colors.grey[600], fontSize: 11),
                ),
              ),
            ),
          ],
          if (item.selectedAddons.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Options:',
              style: TextStyle(
                color: Colors.grey[700],
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
            ),
            ...item.selectedAddons.map(
              (addon) => Padding(
                padding: const EdgeInsets.only(left: 8, top: 2),
                child: Text(
                  addon.name ?? 'undefined',
                  style: TextStyle(color: Colors.grey[600], fontSize: 11),
                ),
              ),
            ),
          ],
          const SizedBox(),
          Text(
            'Base Price: ${formatRupiah(item.menuItem.displayPrice())}',
            style: TextStyle(color: Colors.grey[600], fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            'Subtotal: ${formatRupiah(item.subtotal)}',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildPricingDetails(OrderDetailModel order) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Pricing Details',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          _buildPriceRow('Subtotal', order.totalBeforeDiscount),
          _buildPriceRow('Tax', order.totalTax),
          // _buildPriceRow('Discount', -order.discount!),
          const Divider(),
          _buildPriceRow(
            'Grand Total',
            order.grandTotal,
            isBold: true,
            color: Colors.green[700],
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(
    String label,
    int amount, {
    bool isBold = false,
    Color? color,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey[600],
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            formatRupiah(amount),
            style: TextStyle(
              color: color ?? Colors.black,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
