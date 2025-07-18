import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/order_detail_providers/saved_order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/saved_order_provider.dart';

class SavedOrder extends ConsumerWidget {
  const SavedOrder({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedOrderDetail = ref.watch(savedOrderProvider);

    return savedOrderDetail.isEmpty
        ? const Center(child: Text('No saved orders available'))
        : ListView.builder(
          itemCount: savedOrderDetail.length,
          itemBuilder: (context, index) {
            final savedOrder = savedOrderDetail[index];
            return ListTile(
              dense: true,
              title: Text(savedOrder!.user.toString()),
              subtitle: Text(
                savedOrder.items.map((x) => x.menuItem.name).join(', '),
                style: const TextStyle(color: Colors.black),
              ),
              leading: CircleAvatar(
                child: Text(
                  savedOrder.items.length.toString(),
                  style: const TextStyle(color: Colors.black),
                ),
              ),

              onTap:
                  () => ref
                      .read(savedOrderDetailProvider.notifier)
                      .savedOrderDetail(savedOrder),
            );
          },
        );
  }
}
