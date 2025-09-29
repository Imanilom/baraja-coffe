import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';

class EventItemCard extends ConsumerWidget {
  final MenuItemModel menuItem;
  final VoidCallback onTap;

  const EventItemCard({super.key, required this.menuItem, required this.onTap});

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
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                Expanded(
                  flex: 4,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child:
                        menuItem.imageURL == null
                            ? Container(
                              color: Colors.grey[100],
                              child: Center(
                                child: Icon(
                                  Icons.event,
                                  color: Colors.grey[400],
                                  size: 32,
                                ),
                              ),
                            )
                            : Image.network(
                              menuItem.imageURL ?? '',
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
                Expanded(
                  flex: 2,
                  child: Center(
                    child: Text(
                      menuItem.name ?? 'Nama Produk',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
