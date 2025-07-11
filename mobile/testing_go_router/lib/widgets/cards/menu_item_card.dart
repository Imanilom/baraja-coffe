// import 'package:flutter/material.dart';
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
      behavior: HitTestBehavior.opaque, // Memperbolehkan tekan lama
      child: Card(
        color: Colors.white,
        clipBehavior: Clip.antiAlias,
        elevation: 0,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: ClipRRect(
                clipBehavior: Clip.antiAlias,
                child: Image.network(
                  menuItem.imageURL!,
                  fit:
                      BoxFit.cover, // Gambar akan mengisi ruang tanpa terpotong
                  width: double.infinity, // Pastikan lebar penuh
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.grey[300],
                      child: const Icon(Icons.image, color: Colors.grey),
                    );
                  },
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(menuItem.name!),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
