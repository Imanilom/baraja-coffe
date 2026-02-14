import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/pending_order_detail_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/utils/payment_status_utils.dart';
import 'package:kasirbaraja/services/printer_service.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';

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
          const SizedBox(height: 8),
          _buildReprintButtons(context, order, ref),
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
              style: TextButton.styleFrom(
                backgroundColor:
                    order.isOpenBill == true
                        ? Colors.blue.withValues(alpha: 0.1)
                        : Colors.green[50],
              ),
              icon: Icon(
                order.items.isEmpty ? Icons.add : Icons.edit,
                color: order.isOpenBill == true ? Colors.blue : Colors.green,
              ),
              label: Text(
                order.items.isEmpty
                    ? 'Add Order Item'
                    : (order.isOpenBill == true
                        ? 'Lanjutkan Open Bill'
                        : 'Edit Order Item'),
                style: TextStyle(
                  color: order.isOpenBill == true ? Colors.blue : Colors.green,
                ),
              ),
              onPressed: () {
                if (order.isOpenBill == true) {
                  // Resume flow: Load to POS and switch tab
                  ref
                      .read(orderDetailProvider.notifier)
                      .loadFromOpenBill(order);
                  // Switch to Order Tab (Index 0)
                  ref.read(currentPageIndexProvider.notifier).setIndex(0);
                } else {
                  // Standard edit flow
                  context.pushNamed(
                    'edit-order-item',
                    pathParameters: {'id': order.id ?? ''},
                    extra: order,
                  );
                }
              },
            ),

          if (order.isOpenBill == true) ...[
            const SizedBox(height: 12),
            // ✅ NEW: Print Struk button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.blue[700],
                  side: BorderSide(color: Colors.blue[700]!),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                icon: const Icon(Icons.print),
                label: const Text(
                  'PRINT STRUK (BELUM LUNAS)',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                onPressed: () async {
                  final printers = ref.read(savedPrintersProvider);
                  if (printers.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Tidak ada printer yang tersedia'),
                        backgroundColor: Colors.orange,
                      ),
                    );
                    return;
                  }

                  // ✅ FIXED: Check if any printer supports customer receipts
                  final customerPrinters =
                      printers.where((p) => p.canPrintCustomer).toList();

                  if (customerPrinters.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          '⚠️ Tidak ada printer untuk struk customer',
                        ),
                        backgroundColor: Colors.orange,
                      ),
                    );
                    return;
                  }

                  try {
                    await PrinterService.printDocuments(
                      orderDetail: order,
                      printType: 'customer',
                      printers: customerPrinters,
                      forceReprint: true, // Force reprint all items
                    );
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Struk berhasil dicetak'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Gagal mencetak: $e'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  }
                },
              ),
            ),
            // CLOSE BILL button dihapus untuk Open Bills - user harus klik 'Lanjutkan Open Bill' terlebih dahulu
            // lalu bayar dari layar POS utama
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

  Widget _buildReprintButtons(
    BuildContext context,
    OrderDetailModel order,
    WidgetRef ref,
  ) {
    // Check if order has items for each workstation
    final hasKitchenItems = order.items.any(
      (item) => item.menuItem.workstation == 'kitchen',
    );
    final hasBarItems = order.items.any(
      (item) => item.menuItem.workstation == 'bar',
    );
    final hasWaiterItems = order.items.isNotEmpty;

    // Don't show section if no items
    if (!hasKitchenItems && !hasBarItems && !hasWaiterItems) {
      return const SizedBox.shrink();
    }

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
            'Print Ulang Workstation',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (hasKitchenItems)
                _buildReprintButton(
                  context: context,
                  ref: ref,
                  order: order,
                  label: 'Kitchen',
                  icon: Icons.restaurant,
                  color: Colors.orange,
                  printType: 'kitchen',
                ),
              if (hasBarItems)
                _buildReprintButton(
                  context: context,
                  ref: ref,
                  order: order,
                  label: 'Bar',
                  icon: Icons.local_bar,
                  color: Colors.purple,
                  printType: 'bar',
                ),
              if (hasWaiterItems)
                _buildReprintButton(
                  context: context,
                  ref: ref,
                  order: order,
                  label: 'Waiter',
                  icon: Icons.person,
                  color: Colors.blue,
                  printType: 'waiter',
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReprintButton({
    required BuildContext context,
    required WidgetRef ref,
    required OrderDetailModel order,
    required String label,
    required IconData icon,
    required Color color,
    required String printType,
  }) {
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      icon: Icon(icon, size: 18),
      label: Text(label),
      onPressed: () async {
        final printers = ref.read(savedPrintersProvider);
        if (printers.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Tidak ada printer yang tersedia'),
              backgroundColor: Colors.orange,
            ),
          );
          return;
        }

        // ✅ FIXED: Check if any printer supports this workstation
        final supportedPrinters =
            printers.where((printer) {
              switch (printType) {
                case 'kitchen':
                  return printer.canPrintKitchen;
                case 'bar':
                  return printer.canPrintBar;
                case 'waiter':
                  return printer.canPrintWaiter;
                case 'customer':
                  return printer.canPrintCustomer;
                default:
                  return false;
              }
            }).toList();

        if (supportedPrinters.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('⚠️ Tidak ada printer untuk $label'),
              backgroundColor: Colors.orange,
            ),
          );
          return;
        }

        try {
          await PrinterService.printDocuments(
            orderDetail: order,
            printType: printType,
            printers: supportedPrinters,
            forceReprint: true, // Force reprint all items
          );

          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('✅ Struk $label berhasil dicetak ulang'),
                backgroundColor: Colors.green,
              ),
            );
          }
        } catch (e) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Gagal mencetak: $e'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      },
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
