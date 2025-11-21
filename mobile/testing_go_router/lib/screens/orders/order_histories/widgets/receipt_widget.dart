import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/custom_amount_items.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/history_detail_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';

final isPrintHistory = StateProvider<bool>((ref) => false);

class ReceiptWidget extends ConsumerWidget {
  const ReceiptWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedOrder = ref.watch(historyDetailProvider);
    final isPrint = ref.watch(isPrintHistory);

    if (selectedOrder == null) {
      return Container(
        color: Colors.grey[50],
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.receipt_long, size: 64, color: Colors.grey),
              SizedBox(height: 16),
              Text(
                'Receipt preview will appear here',
                style: TextStyle(fontSize: 16, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      color: Colors.grey[50],
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black12,
                      spreadRadius: 2,
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: _buildReceiptContent(selectedOrder),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextButton.icon(
              style: TextButton.styleFrom(
                backgroundColor: isPrint ? Colors.grey[500] : Colors.blue[700],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                // width full,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: () => isPrint ? null : _showPrintDialog(context, ref),
              label:
                  isPrint ? const Text('Print...') : const Text('Print Struk'),
              icon:
                  isPrint
                      ? const CircularProgressIndicator()
                      : const Icon(Icons.print),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptContent(OrderDetailModel order) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Header
        const Text(
          'BARAJA AMPHITHEATER',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        _buildDivider(),
        const SizedBox(height: 16),

        // Order Info
        _buildReceiptRow('Order ID', order.orderId!, isBold: true),
        _buildReceiptRow(
          'Date',
          DateFormat('dd/MM/yyyy HH:mm').format(order.createdAt!),
        ),
        _buildReceiptRow('Customer', order.user ?? 'Unknown'),
        if (order.tableNumber!.isNotEmpty)
          _buildReceiptRow('Table', order.tableNumber!),
        _buildReceiptRow('Payment', order.paymentMethod!),

        const SizedBox(height: 16),
        Text(order.orderType.name, textAlign: TextAlign.center),
        const SizedBox(height: 16),
        _buildDivider(),
        const SizedBox(height: 16),

        // Items
        ...order.items.map((item) => _buildReceiptItem(item)),
        if (order.customAmountItems != null &&
            order.customAmountItems!.isNotEmpty)
          ...order.customAmountItems!.map(
            (item) => _buildReceiptCustomAmountItem(item),
          ),

        const SizedBox(height: 16),
        _buildDivider(),
        const SizedBox(height: 16),

        // Pricing
        _buildReceiptRow('Subtotal', formatPrice(order.totalBeforeDiscount)),

        if (order.discounts!.autoPromoDiscount > 0)
          _buildReceiptRow(
            'Auto Promo Disc',
            '-${formatPrice(order.discounts!.autoPromoDiscount)}',
          ),
        if (order.discounts!.manualDiscount > 0)
          _buildReceiptRow(
            'Manual Disc',
            '-${formatPrice(order.discounts!.manualDiscount)}',
          ),
        if (order.discounts!.voucherDiscount > 0)
          _buildReceiptRow(
            'Voucher Disc',
            '-${formatPrice(order.discounts!.voucherDiscount)}',
          ),

        ...order.taxAndServiceDetails.map(
          (detail) => _buildReceiptRow(
            detail.name!,
            formatPrice(detail.amount.toInt()),
          ),
        ),

        if (order.totalServiceFee > 0)
          _buildReceiptRow('Service Fee', formatPrice(order.totalServiceFee)),

        const SizedBox(height: 8),
        _buildDivider(),
        const SizedBox(height: 8),

        _buildReceiptRow(
          'TOTAL',
          formatRupiah(order.grandTotal),
          isBold: true,
          isTotal: true,
        ),

        const SizedBox(height: 16),
        _buildDivider(),
        const SizedBox(height: 16),

        // Payment Detail Section
        _buildPaymentDetailsSection(order),

        const SizedBox(height: 16),
        _buildDivider(),
        const SizedBox(height: 16),

        // Footer
        const Text(
          'Thank you!',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          textAlign: TextAlign.center,
        ),
        // const SizedBox(height: 16),
        // Text(
        //   'Printed: ${DateFormat('dd/MM/yyyy HH:mm:ss').format(DateTime.now())}',
        //   style: const TextStyle(fontSize: 10, color: Colors.grey),
        //   textAlign: TextAlign.center,
        // ),
      ],
    );
  }

  Widget _buildReceiptRow(
    String label,
    String value, {
    bool isBold = false,
    bool isTotal = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 14 : 12,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isTotal ? 14 : 12,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptItem(OrderItemModel item) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                '(${OrderTypeExtension.orderTypeToJson(item.orderType)}) ${item.menuItem.name!}',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Text('${item.quantity}x', style: const TextStyle(fontSize: 12)),
            SizedBox(
              width: 80,
              child: Text(
                formatPrice(item.subtotal),
                style: const TextStyle(fontSize: 12),
                textAlign: TextAlign.right,
              ),
            ),
          ],
        ),

        // Toppings
        if (item.selectedToppings.isNotEmpty)
          ...item.selectedToppings.map(
            (topping) => Padding(
              padding: const EdgeInsets.only(left: 16, top: 1),
              child: Text(
                '+ ${topping.name}',
                style: const TextStyle(fontSize: 10, color: Colors.grey),
              ),
            ),
          ),

        // Addons
        if (item.selectedAddons.isNotEmpty)
          ...item.selectedAddons.map(
            (addon) => Padding(
              padding: const EdgeInsets.only(left: 16, top: 1),
              child: Text(
                '${addon.name!}: ${addon.options == null ? '' : addon.options!.map((e) => e.label!).join(', ')}',
                style: const TextStyle(fontSize: 10, color: Colors.grey),
              ),
            ),
          ),

        //notes
        if (item.notes != null && item.notes != '')
          Padding(
            padding: const EdgeInsets.only(left: 16, top: 1),
            child: Text(
              'catatan: ${item.notes!}',
              style: const TextStyle(fontSize: 10, color: Colors.grey),
            ),
          ),

        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildReceiptCustomAmountItem(CustomAmountItemsModel item) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                item.name!,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            SizedBox(
              width: 80,
              child: Text(
                formatPrice(item.amount),
                style: const TextStyle(fontSize: 12),
                textAlign: TextAlign.right,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildDivider() {
    return SizedBox(
      height: 1,
      width: double.infinity,
      child: CustomPaint(painter: DashedLinePainter()),
    );
  }

  void _showPrintDialog(BuildContext context, WidgetRef ref) {
    final selectedOrder = ref.read(historyDetailProvider);
    if (selectedOrder == null) return;
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          title: const Text(
            'Pilihan Print Struk',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            spacing: 8.0,
            children: [
              TextButton.icon(
                style: TextButton.styleFrom(
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  minimumSize: const Size.fromHeight(40),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(color: Colors.grey[300]!),
                  ),
                ),
                icon: const Icon(Icons.print, color: Colors.blue),
                label: const Text('Print Customer'),
                onPressed: () {
                  Navigator.of(context).pop();
                  _handlePrintCustomer(context, ref);
                },
              ),
              TextButton.icon(
                style: TextButton.styleFrom(
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  minimumSize: const Size.fromHeight(40),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(color: Colors.grey[300]!),
                  ),
                ),
                icon: const Icon(Icons.label, color: Colors.green),
                label: const Text('Print Label'),
                onPressed: () {
                  Navigator.of(context).pop();
                  _handlePrintLabel(context, ref);
                },
              ),
              TextButton.icon(
                style: TextButton.styleFrom(
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  minimumSize: const Size.fromHeight(40),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(color: Colors.grey[300]!),
                  ),
                ),
                icon: const Icon(Icons.kitchen, color: Colors.orange),
                label: const Text('Print Kitchen'),
                onPressed: () {
                  Navigator.of(context).pop();
                  _handlePrintKitchen(context, ref);
                },
              ),
              //bar,
              TextButton.icon(
                style: TextButton.styleFrom(
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  minimumSize: const Size.fromHeight(40),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(color: Colors.grey[300]!),
                  ),
                ),
                icon: const Icon(Icons.local_bar, color: Colors.purple),
                label: const Text('Print Bar'),
                onPressed: () {
                  Navigator.of(context).pop();
                  _handlePrintBar(context, ref);
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Batal'),
            ),
          ],
        );
      },
    );
  }

  void _handlePrintCustomer(BuildContext context, WidgetRef ref) {
    try {
      ref.read(isPrintHistory.notifier).state = true;
      final savedPrinter = ref.read(savedPrintersProvider.notifier);
      savedPrinter.printToPrinter(
        orderDetail: ref.read(historyDetailProvider)!,
        printType: 'customer',
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Expanded(child: Text('Error: ${e.toString()}')),
            ],
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      ref.read(isPrintHistory.notifier).state = false;
    }
  }

  void _handlePrintLabel(BuildContext context, WidgetRef ref) {
    try {
      ref.read(isPrintHistory.notifier).state = true;
      final savedPrinter = ref.read(savedPrintersProvider.notifier);
      savedPrinter.printToPrinter(
        orderDetail: ref.read(historyDetailProvider)!,
        printType: 'waiter',
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Expanded(child: Text('Error: ${e.toString()}')),
            ],
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      ref.read(isPrintHistory.notifier).state = false;
    }
  }

  void _handlePrintKitchen(BuildContext context, WidgetRef ref) {
    try {
      ref.read(isPrintHistory.notifier).state = true;
      final savedPrinter = ref.read(savedPrintersProvider.notifier);
      savedPrinter.printToPrinter(
        orderDetail: ref.read(historyDetailProvider)!,
        printType: 'kitchen',
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Expanded(child: Text('Error: ${e.toString()}')),
            ],
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      ref.read(isPrintHistory.notifier).state = false;
    }
  }

  void _handlePrintBar(BuildContext context, WidgetRef ref) {
    try {
      ref.read(isPrintHistory.notifier).state = true;
      final savedPrinter = ref.read(savedPrintersProvider.notifier);
      savedPrinter.printToPrinter(
        orderDetail: ref.read(historyDetailProvider)!,
        printType: 'bar',
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Expanded(child: Text('Error: ${e.toString()}')),
            ],
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      ref.read(isPrintHistory.notifier).state = false;
    }
  }

  Widget _buildPaymentDetailsSection(OrderDetailModel order) {
    final details = order.payment; // <-- sesuaikan jika nama field berbeda
    if (details == null || details.isEmpty) {
      // fallback lama: hanya tampilkan baris Payment tunggal jika ada
      if (order.paymentMethod != null && order.paymentMethod!.isNotEmpty) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Payment Detail',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            _buildReceiptRow('Metode', order.paymentMethod!),
          ],
        );
      }
      return const SizedBox.shrink();
    }

    // Hitung total dibayar (settlement) & sisa
    final int totalPaid = details
        .where(
          (d) => (d.status?.toString().toLowerCase() ?? '') == 'settlement',
        )
        .fold<int>(0, (sum, d) => sum + (d.amount));
    final int remaining = (order.grandTotal ?? 0) - totalPaid;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Payment Detail',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),

        // List setiap payment detail
        ...details.map<Widget>((d) {
          final String method = d.method?.toString() ?? '-'; // sesuaikan field
          final String status =
              (d.status?.toString() ?? '-').toLowerCase(); // sesuaikan field
          final String? paidAt = d.paidAt; // sesuaikan field
          final int amount = d.amount; // sesuaikan field

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Baris judul + status chip
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        method,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    _statusChip(status),
                  ],
                ),

                const SizedBox(height: 4),

                // Amount + waktu bayar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Amount',
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                    Text(
                      formatRupiah(amount),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        }),

        const SizedBox(height: 8),
        _buildDivider(),
        const SizedBox(height: 8),

        // Ringkasan pembayaran
        _buildReceiptRow(
          'Total Dibayar',
          formatRupiah(totalPaid),
          isBold: true,
        ),
        _buildReceiptRow(
          remaining > 0 ? 'Sisa Tagihan' : 'Kembalian',
          formatRupiah(remaining.abs()),
          isBold: true,
        ),
      ],
    );
  }

  Widget _statusChip(String status) {
    final color = _statusColor(status);
    final label =
        status.isEmpty
            ? '-'
            : status[0].toUpperCase() + status.substring(1); // kapital di awal
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withOpacity(0.5), width: 0.7),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'settlement':
        return const Color(0xFF1B5E20); // hijau gelap
      case 'pending':
        return const Color(0xFFEF6C00); // oranye
      case 'void':
      case 'canceled':
      case 'failed':
        return const Color(0xFFB71C1C); // merah
      default:
        return const Color(0xFF455A64); // abu kebiruan
    }
  }

  String _formatPaymentMethod(String raw) {
    // Sesuaikan jika kamu pakai enum PaymentMethod
    // Misal: 'qris', 'cash', 'transfer', 'va_bca', 'va_bri', 'debit', dll.
    final v = raw.toLowerCase();
    if (v.startsWith('va_')) {
      // contoh: va_bca -> VA BCA
      return 'VA ${v.substring(3).toUpperCase()}';
    }
    switch (v) {
      case 'qris':
        return 'QRIS';
      case 'cash':
        return 'Cash';
      case 'debit':
        return 'Kartu Debit';
      case 'credit':
        return 'Kartu Kredit';
      case 'transfer':
        return 'Transfer';
      default:
        // fallback: kapitalisasi awal tiap kata
        return raw
            .split(RegExp(r'[_\s-]+'))
            .map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1))
            .join(' ');
    }
  }
}

class DashedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    Paint paint =
        Paint()
          ..color = Colors.grey[400]!
          ..strokeWidth = 1;

    double dashWidth = 5;
    double dashSpace = 3;
    double startX = 0;

    while (startX < size.width) {
      canvas.drawLine(Offset(startX, 0), Offset(startX + dashWidth, 0), paint);
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
