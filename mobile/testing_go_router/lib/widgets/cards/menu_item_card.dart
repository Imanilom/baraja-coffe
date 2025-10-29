import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

class MenuItemCard extends ConsumerWidget {
  final MenuItemModel menuItem;
  final VoidCallback onTap;

  const MenuItemCard({super.key, required this.menuItem, required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: onTap,
      onLongPress: () {},
      behavior: HitTestBehavior.opaque,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200, width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image Container
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                      ),
                      child:
                          menuItem.imageURL == null
                              ? Container(
                                color: Colors.grey[100],
                                child: Center(
                                  child: Icon(
                                    Icons.restaurant_menu,
                                    color: Colors.grey[400],
                                    size: 32,
                                  ),
                                ),
                              )
                              : Image.network(
                                menuItem.imageURL!,
                                fit: BoxFit.cover,
                                width: double.infinity,
                                height: double.infinity,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    color: Colors.grey[100],
                                    child: Center(
                                      child: Icon(
                                        Icons.restaurant_menu,
                                        color: Colors.grey[400],
                                        size: 32,
                                      ),
                                    ),
                                  );
                                },
                              ),
                    ),
                  ),
                  // Stock Badge
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getStockColor(menuItem.stock?.manualStock ?? 0),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        '${menuItem.stock?.manualStock ?? 0}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Content Container
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: Center(
                  child: Text(
                    menuItem.name ?? 'Nama Produk',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF2D3748),
                      height: 1.2,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStockColor(int stock) {
    if (stock <= 0) {
      return Colors.red;
    } else if (stock <= 10) {
      return Colors.orange;
    } else {
      return Colors.green;
    }
  }
}
