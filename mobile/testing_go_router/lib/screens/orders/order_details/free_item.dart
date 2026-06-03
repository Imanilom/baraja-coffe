import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:kasirbaraja/models/free_item.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';

/// Widget untuk menampilkan free items dari promo
class FreeItemsSection extends ConsumerWidget {
  const FreeItemsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderDetailProvider);

    if (order == null || order.appliedPromos == null) {
      return const SizedBox.shrink();
    }

    // Collect all free items dari semua applied promos
    final allFreeItems = <FreeItemModel>[];
    for (final promo in order.appliedPromos!) {
      allFreeItems.addAll(promo.freeItems);
    }

    if (allFreeItems.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Icon(Icons.card_giftcard, color: Colors.green.shade700, size: 20),
              const SizedBox(width: 8),
              Text(
                'Item Gratis',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade800,
                ),
              ),
            ],
          ),
        ),

        // Free items list
        ...allFreeItems.map((freeItem) {
          return FreeItemCard(freeItem: freeItem);
        }),

        const Divider(),
      ],
    );
  }
}

/// Card untuk single free item
class FreeItemCard extends StatelessWidget {
  final FreeItemModel freeItem;

  const FreeItemCard({super.key, required this.freeItem});

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp',
      decimalDigits: 0,
    );

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Row(
        children: [
          // Free badge
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.green.shade400, Colors.green.shade600],
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Center(
              child: Text(
                'FREE',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Item details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  freeItem.menuItemName,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      '${freeItem.quantity}x',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(width: 8),
                    // if (freeItem.originalPrice != null) ...[
                    //   Text(
                    //     currencyFormatter.format(freeItem.originalPrice),
                    //     style: TextStyle(
                    //       fontSize: 12,
                    //       color: Colors.grey.shade500,
                    //       decoration: TextDecoration.lineThrough,
                    //     ),
                    //   ),
                    // ],
                  ],
                ),
              ],
            ),
          ),

          // Free price tag
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Rp 0',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: Colors.green.shade700,
                ),
              ),
              // if (freeItem.originalPrice != null)
              //   Text(
              //     'Hemat ${currencyFormatter.format(freeItem.originalPrice)}',
              //     style: TextStyle(fontSize: 10, color: Colors.green.shade600),
              //   ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Indicator untuk free items count
class FreeItemsIndicator extends ConsumerWidget {
  const FreeItemsIndicator({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderDetailProvider);

    if (order == null || order.appliedPromos == null) {
      return const SizedBox.shrink();
    }

    // Count total free items
    var totalFreeItems = 0;
    var totalSavings = 0;

    // for (final promo in order.appliedPromos!) {
    //   for (final freeItem in promo.freeItems) {
    //     totalFreeItems += freeItem.quantity;
    //     totalSavings += (freeItem.originalPrice ?? 0) * freeItem.quantity;
    //   }
    // }

    if (totalFreeItems == 0) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green.shade400, Colors.green.shade600],
        ),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.green.shade200,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.celebration, color: Colors.white, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$totalFreeItems Item Gratis!',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                if (totalSavings > 0)
                  Text(
                    'Hemat Rp${_formatCurrency(totalSavings)}',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
              ],
            ),
          ),
          const Icon(Icons.card_giftcard, color: Colors.white, size: 24),
        ],
      ),
    );
  }

  String _formatCurrency(int amount) {
    return amount.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }
}

/// Helper untuk get free items dari order
class FreeItemsHelper {
  /// Get all free items dari order
  static List<FreeItemModel> getAllFreeItems(OrderDetailModel? order) {
    if (order == null || order.appliedPromos == null) return [];

    final allFreeItems = <FreeItemModel>[];
    for (final promo in order.appliedPromos!) {
      allFreeItems.addAll(promo.freeItems);
    }

    return allFreeItems;
  }

  /// Get total quantity free items
  static int getTotalFreeItemsCount(OrderDetailModel? order) {
    final freeItems = getAllFreeItems(order);
    return freeItems.fold(0, (sum, item) => sum + item.quantity);
  }

  /// Get total savings dari free items
  // static int getTotalFreeItemsSavings(OrderDetailModel? order) {
  //   final freeItems = getAllFreeItems(order);
  //   return freeItems.fold(
  //     0,
  //     (sum, item) => sum + ((item.originalPrice ?? 0) * item.quantity),
  //   );
  // }

  /// Check if specific menu item ada di free items
  static bool hasMenuItem(String menuItemId, OrderDetailModel? order) {
    final freeItems = getAllFreeItems(order);
    return freeItems.any((item) => item.menuItem == menuItemId);
  }

  /// Get free item untuk menu item tertentu
  static FreeItemModel? getFreeItemForMenu(
    String menuItemId,
    OrderDetailModel? order,
  ) {
    final freeItems = getAllFreeItems(order);
    try {
      return freeItems.firstWhere((item) => item.menuItem == menuItemId);
    } catch (e) {
      return null;
    }
  }
}
