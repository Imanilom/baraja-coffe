import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/enums/order_type.dart';

class OrderTypeSelectionDialog extends ConsumerWidget {
  final OrderType? currentOrderType;
  final Function(OrderType) onOrderTypeSelected;
  final VoidCallback? onTakeAwaySelected; // Callback khusus untuk take away

  const OrderTypeSelectionDialog({
    super.key,
    required this.currentOrderType,
    required this.onOrderTypeSelected,
    this.onTakeAwaySelected,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(
            Icons.restaurant_menu_rounded,
            color: Theme.of(context).primaryColor,
          ),
          const SizedBox(width: 8),
          const Text(
            'Pilih Tipe Pesanan',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildOrderTypeOption(
            context: context,
            orderType: OrderType.dineIn,
            title: 'Dine-In',
            subtitle: 'Makan di tempat',
            icon: Icons.table_restaurant,
            onTap: () {
              onOrderTypeSelected(OrderType.dineIn);
              Navigator.pop(context);
            },
          ),
          const SizedBox(height: 8),
          _buildOrderTypeOption(
            context: context,
            orderType: OrderType.takeAway,
            title: 'Take Away',
            subtitle: 'Bawa pulang',
            icon: Icons.takeout_dining,
            onTap: () {
              onOrderTypeSelected(OrderType.takeAway);
              onTakeAwaySelected?.call(); // Panggil callback khusus jika ada
              Navigator.pop(context);
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          style: TextButton.styleFrom(foregroundColor: Colors.grey[600]),
          child: const Text('Batal'),
        ),
      ],
    );
  }

  Widget _buildOrderTypeOption({
    required BuildContext context,
    required OrderType orderType,
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    final bool isSelected = currentOrderType == orderType;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color:
                isSelected ? Theme.of(context).primaryColor : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
          color:
              isSelected
                  ? Theme.of(context).primaryColor.withOpacity(0.1)
                  : Colors.transparent,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color:
                    isSelected
                        ? Theme.of(context).primaryColor
                        : Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : Colors.grey[600],
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color:
                          isSelected
                              ? Theme.of(context).primaryColor
                              : Colors.black87,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: Theme.of(context).primaryColor,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }

  // Static method untuk menampilkan dialog
  static Future<void> show({
    required BuildContext context,
    required OrderType? currentOrderType,
    required Function(OrderType) onOrderTypeSelected,
    VoidCallback? onTakeAwaySelected,
  }) {
    return showDialog(
      context: context,
      builder:
          (context) => OrderTypeSelectionDialog(
            currentOrderType: currentOrderType,
            onOrderTypeSelected: onOrderTypeSelected,
            onTakeAwaySelected: onTakeAwaySelected,
          ),
    );
  }
}
