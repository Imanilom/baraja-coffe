import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/history_detail_provider.dart';

class ReceiptWidget extends ConsumerWidget {
  const ReceiptWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedOrder = ref.watch(historyDetailProvider);

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
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              children: [
                Icon(Icons.receipt, color: Colors.blue[700]),
                const SizedBox(width: 8),
                const Text(
                  'Receipt Preview',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.print),
                  onPressed: () {
                    // Implement print functionality
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Print functionality would be implemented here',
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
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
                      color: Colors.grey.withOpacity(0.1),
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
          'LA BARAJA COFFEE',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const Text(
          'Jl. Coffee Street No. 123',
          style: TextStyle(fontSize: 12),
          textAlign: TextAlign.center,
        ),
        const Text(
          'Tel: (021) 1234-5678',
          style: TextStyle(fontSize: 12),
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
        _buildReceiptRow('Customer', order.user),
        _buildReceiptRow('Order Type', order.orderType.name),
        if (order.tableNumber!.isNotEmpty)
          _buildReceiptRow('Table', order.tableNumber!),
        _buildReceiptRow('Payment', order.paymentMethod!),

        const SizedBox(height: 16),
        _buildDivider(),
        const SizedBox(height: 16),

        // Items
        ...order.items.map((item) => _buildReceiptItem(item)),

        const SizedBox(height: 16),
        _buildDivider(),
        const SizedBox(height: 16),

        // Pricing
        _buildReceiptRow(
          'Subtotal',
          'Rp ${NumberFormat('#,###').format(order.totalBeforeDiscount)}',
        ),

        if (order.discounts!.autoPromoDiscount > 0)
          _buildReceiptRow(
            'Auto Promo Disc',
            '-Rp ${NumberFormat('#,###').format(order.discounts!.autoPromoDiscount)}',
          ),
        if (order.discounts!.manualDiscount > 0)
          _buildReceiptRow(
            'Manual Disc',
            '-Rp ${NumberFormat('#,###').format(order.discounts!.manualDiscount)}',
          ),
        if (order.discounts!.voucherDiscount > 0)
          _buildReceiptRow(
            'Voucher Disc',
            '-Rp ${NumberFormat('#,###').format(order.discounts!.voucherDiscount)}',
          ),

        ...order.taxAndServiceDetails.map(
          (detail) => _buildReceiptRow(
            detail.name!,
            'Rp ${NumberFormat('#,###').format(detail.amount)}',
          ),
        ),

        if (order.totalServiceFee > 0)
          _buildReceiptRow(
            'Service Fee',
            'Rp ${NumberFormat('#,###').format(order.totalServiceFee)}',
          ),

        const SizedBox(height: 8),
        _buildDivider(),
        const SizedBox(height: 8),

        _buildReceiptRow(
          'TOTAL',
          'Rp ${NumberFormat('#,###').format(order.grandTotal)}',
          isBold: true,
          isTotal: true,
        ),

        const SizedBox(height: 16),
        _buildDivider(),
        const SizedBox(height: 16),

        // Footer
        const Text(
          'Thank you for your visit!',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        const Text(
          'Follow us @labarajacoffee',
          style: TextStyle(fontSize: 12),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        Text(
          'Printed: ${DateFormat('dd/MM/yyyy HH:mm:ss').format(DateTime.now())}',
          style: const TextStyle(fontSize: 10, color: Colors.grey),
          textAlign: TextAlign.center,
        ),
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
                item.menuItem.name!,
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
                'Rp ${NumberFormat('#,###').format(item.subtotal)}',
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
                addon.name!,
                style: const TextStyle(fontSize: 10, color: Colors.grey),
              ),
            ),
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
