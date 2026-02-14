import 'package:flutter/material.dart';

import 'package:intl/intl.dart';
import 'package:kasirbaraja/models/custom_amount_items.model.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';

import 'package:kasirbaraja/utils/format_rupiah.dart';

class OrderDetailWidget extends StatelessWidget {
  final OrderDetailModel? order;
  final VoidCallback? onClose;

  const OrderDetailWidget({super.key, this.order, this.onClose});

  @override
  Widget build(BuildContext context) {
    if (order == null) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.touch_app, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'Select an order to view details',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          //close,
          if (onClose != null)
            IconButton(
              icon: const Icon(Icons.close, color: Colors.grey),
              onPressed: onClose,
            ),
          _buildHeader(order!),
          const SizedBox(height: 8),
          _buildOrderInfo(order!),
          const SizedBox(height: 8),
          _buildItemsList(order!),
          const SizedBox(height: 8),
          _buildPromoDetails(order!),
          const SizedBox(height: 8),
          _buildPricingDetails(order!),
        ],
      ),
    );
  }

  Widget _buildHeader(OrderDetailModel order) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue[700]!, Colors.blue[500]!],
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
                  order.orderId!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  DateFormat('dd MMM yyyy, HH:mm').format(order.createdAt!),
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
          _buildInfoRow('Cashier', order.cashier?.username ?? 'Unknown'),
          if (order.tableNumber!.isNotEmpty)
            _buildInfoRow('Table', order.tableNumber!),
          // _buildInfoRow('Payment Method', order.paymentMethod!),
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
          Text(': $value', style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildItemsList(OrderDetailModel order) {
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
          Text(
            'Items (${order.items.length})',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          ...order.items.map((item) => _buildItemCard(item)),
          if (order.customAmountItems != null &&
              order.customAmountItems!.isNotEmpty)
            ...order.customAmountItems!.map(
              (item) => _buildCustomAmountItemsCard(item),
            ),
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
            ...item.selectedAddons.map((addon) {
              final name = addon.name!;
              final options =
                  addon.options != null
                      ? addon.options!.map((e) => e.label).join(', ')
                      : '';
              final optionPrices =
                  addon.options != null
                      ? addon.options!
                          .map((e) => formatPrice(e.price ?? 0))
                          .join(', ')
                      : 'free';
              return Padding(
                padding: const EdgeInsets.only(left: 8, top: 2),
                child: Text(
                  '+ $name: $options (+ $optionPrices)',
                  style: TextStyle(color: Colors.grey[600], fontSize: 11),
                ),
              );
            }),
          ],
          const SizedBox(),
          const SizedBox(),
          Text(
            'Base Price: ${formatRupiah(item.menuItem.displayPrice())}',
            style: TextStyle(color: Colors.grey[600], fontSize: 12),
          ),
          if (item.customDiscount?.isActive == true)
            Text(
              'Diskon ${item.customDiscount!.discountType == 'percentage' ? '(${item.customDiscount!.discountValue}%)' : ''}: -${formatRupiah(item.customDiscount!.discountAmount)}',
              style: TextStyle(
                color: Colors.green[700],
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
            ),
          const SizedBox(height: 4),
          Row(
            children: [
              if (item.customDiscount?.isActive == true) ...[
                Text(
                  formatRupiah(item.subtotal),
                  style: const TextStyle(
                    decoration: TextDecoration.lineThrough,
                    fontSize: 11,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(width: 6),
              ],
              Text(
                'Subtotal: ${formatRupiah(item.subtotal - (item.customDiscount?.discountAmount ?? 0))}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCustomAmountItemsCard(CustomAmountItemsModel item) {
    return Container(
      width: double.infinity,
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
          Text(
            item.name!,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            'Subtotal: ${formatRupiah(item.amount)}',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoDetails(OrderDetailModel order) {
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
            'Promo Details',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          //text kumpulan nama promo,
          Text(
            'Promo: ${order.appliedPromos?.map((e) => e.promoName).join(', ')}',
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

          // Discount Display
          if ((order.discounts?.totalDiscount ?? 0) > 0 ||
              (order.customDiscountDetails?.discountAmount ?? 0) > 0) ...[
            Builder(
              builder: (context) {
                final totalDiscount =
                    (order.discounts?.autoPromoDiscount ?? 0) +
                    (order.discounts?.manualDiscount ?? 0) +
                    (order.discounts?.voucherDiscount ?? 0) +
                    (order.discounts?.customDiscount ?? 0) +
                    (order.customDiscountDetails?.discountAmount ?? 0);

                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Total Diskon',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap:
                              () => _showDiscountDetailsDialog(
                                context,
                                order,
                                totalDiscount,
                              ),
                          child: const Icon(
                            Icons.info_outline,
                            size: 16,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '- ${formatRupiah(totalDiscount)}',
                      style: const TextStyle(
                        color: Colors.green,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                );
              },
            ),
          ],

          _buildPriceRow('Tax', order.totalTax),
          // _buildPriceRow('Discount', -order.discounts),
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

  void _showDiscountDetailsDialog(
    BuildContext context,
    OrderDetailModel order,
    int totalDiscount,
  ) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Detail Diskon'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Auto Promos (Broken down by promo)
              if (order.appliedPromos != null &&
                  order.appliedPromos!.isNotEmpty) ...[
                if ((order.discounts?.autoPromoDiscount ?? 0) > 0) ...[
                  // Header if needed, or just list them
                  for (final promo in order.appliedPromos!)
                    if ((promo.discount ?? 0) > 0)
                      _DiscountDetailRow(
                        label: promo.promoName,
                        value: promo.discount!,
                        percentage:
                            (promo.affectedItems.isNotEmpty &&
                                    (promo
                                                .affectedItems
                                                .first
                                                .discountPercentage ??
                                            0) >
                                        0)
                                ? '${promo.affectedItems.first.discountPercentage}%'
                                : null,
                      ),
                ],
              ] else if ((order.discounts?.autoPromoDiscount ?? 0) > 0) ...[
                // Fallback for legacy or if appliedPromos is missing but total exists
                _DiscountDetailRow(
                  label: 'Promo Otomatis',
                  value: order.discounts!.autoPromoDiscount,
                ),
              ],

              // 2. Manual Discount
              if ((order.discounts?.manualDiscount ?? 0) > 0)
                _DiscountDetailRow(
                  label: 'Diskon Manual',
                  value: order.discounts!.manualDiscount,
                ),

              // 3. Voucher
              if ((order.discounts?.voucherDiscount ?? 0) > 0)
                _DiscountDetailRow(
                  label: 'Voucher',
                  value: order.discounts!.voucherDiscount,
                  subtitle: order.appliedVoucher,
                ),

              // 4. Item Custom Discounts
              if ((order.discounts?.customDiscount ?? 0) > 0)
                _DiscountDetailRow(
                  label: 'Diskon per Item',
                  value: order.discounts!.customDiscount,
                ),

              // 5. Order Custom Discount
              if (order.customDiscountDetails?.isActive == true)
                _DiscountDetailRow(
                  label: 'Diskon Order',
                  value: order.customDiscountDetails!.discountAmount,
                  subtitle: order.customDiscountDetails?.reason,
                  percentage:
                      order.customDiscountDetails?.discountType == 'percentage'
                          ? '${order.customDiscountDetails?.discountValue}%'
                          : null,
                ),

              const Divider(),

              // Total
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    formatRupiah(totalDiscount),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Tutup'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildPriceRow(
    String label,
    int amount, {
    bool isBold = false,
    Color? color,
    bool? isDiscount,
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
            isDiscount == true
                ? '- ${formatRupiah(amount)}'
                : formatRupiah(amount),
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

class _DiscountDetailRow extends StatelessWidget {
  final String label;
  final int value;
  final String? subtitle;
  final String? percentage;

  const _DiscountDetailRow({
    required this.label,
    required this.value,
    this.subtitle,
    this.percentage,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(label, style: const TextStyle(fontSize: 14)),
                  if (percentage != null) ...[
                    const SizedBox(width: 4),
                    Text(
                      '($percentage)',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ],
              ),
              Text(
                formatRupiah(value),
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
            ],
          ),
          if (subtitle != null && subtitle!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                subtitle!,
                style: const TextStyle(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: Colors.grey,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
