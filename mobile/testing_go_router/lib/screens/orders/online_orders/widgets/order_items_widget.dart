import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:kasirbaraja/models/order_item.model.dart';

class OrderItemsWidget extends StatelessWidget {
  final List<OrderItemModel> items;

  const OrderItemsWidget({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Item Header
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        item.menuItem.name!,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.blue,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'x${item.quantity}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                // Base Price
                Text(
                  'Base Price: Rp ${NumberFormat('#,##0').format(item.menuItem.originalPrice)}',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                ),

                // Toppings
                if (item.selectedToppings.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Toppings:',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Colors.grey.shade700,
                    ),
                  ),
                  ...item.selectedToppings.map(
                    (topping) => Padding(
                      padding: const EdgeInsets.only(left: 16, top: 2),
                      child: Text(
                        '• ${topping.name} (+Rp ${NumberFormat('#,##0').format(topping.price)})',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ),
                  ),
                ],

                // Add-ons
                if (item.selectedAddons.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Add-ons:',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Colors.grey.shade700,
                    ),
                  ),
                  ...item.selectedAddons.map(
                    (addon) => Padding(
                      padding: const EdgeInsets.only(left: 16, top: 2),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '• ${addon.name}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          if (addon.options!.isNotEmpty)
                            ...addon.options!.map(
                              (option) => Padding(
                                padding: const EdgeInsets.only(
                                  left: 16,
                                  top: 1,
                                ),
                                child: Text(
                                  '  - ${option.label}${option.price! > 0 ? " (+Rp ${NumberFormat('#,##0').format(option.price)})" : ""}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey.shade500,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],

                // Notes
                if (item.notes!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.yellow.shade50,
                      border: Border.all(color: Colors.yellow.shade200),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.note,
                          size: 16,
                          color: Colors.orange.shade700,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Note: ${item.notes}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.orange.shade700,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Subtotal
                const SizedBox(height: 12),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Subtotal:',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      'Rp ${NumberFormat('#,##0').format(item.subtotal)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Colors.green,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
