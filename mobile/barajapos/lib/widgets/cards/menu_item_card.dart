// import 'package:flutter/material.dart';
import 'package:barajapos/models/menu_item_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';

class MenuItemCard extends ConsumerWidget {
  final MenuItemModel menuItem;
  final VoidCallback onTap;

  const MenuItemCard({
    super.key,
    required this.menuItem,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: onTap,
      onLongPress: () {},
      behavior: HitTestBehavior.opaque, // Memperbolehkan tekan lama
      child: Card(
        padding: const EdgeInsets.all(8),
        borderRadius: const BorderRadius.all(Radius.circular(16)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.all(Radius.circular(12)),
                clipBehavior: Clip.antiAlias,
                child: Image.network(
                  menuItem.imageURL,
                  fit:
                      BoxFit.cover, // Gambar akan mengisi ruang tanpa terpotong
                  width: double.infinity, // Pastikan lebar penuh
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.gray[300],
                      child: const Icon(Icons.image, color: Colors.gray),
                    );
                  },
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Text(menuItem.name).center(),
            ),
          ],
        ),
      ),
    );

    // return CardImage(
    //   //tambahkan background color

    //   key: ValueKey(menuItem.id),
    //   image: Image.network(
    //     menuItem.imageURL,
    //     errorBuilder: (context, error, stackTrace) {
    //       return Container(
    //         color: Colors.gray[300],
    //         child: const Icon(Icons.image, color: Colors.gray),
    //       );
    //     },
    //   ),
    //   title: Padding(
    //     padding: const EdgeInsets.all(8.0),
    //     child: Text(menuItem.name).center(),
    //   ),
    //   onPressed: onTap,
    // );
  }
}
