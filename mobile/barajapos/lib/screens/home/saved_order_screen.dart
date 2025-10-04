import 'package:barajapos/providers/order_detail_providers/saved_order_detail_provider.dart';
import 'package:barajapos/providers/orders/saved_order_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SavedOrderScreen extends ConsumerWidget {
  const SavedOrderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedOrderDetail = ref.watch(savedOrderProvider);

    return Scaffold(
        body: savedOrderDetail.isEmpty
            ? const Center(child: Text('No saved orders available'))
            : ListView.builder(
                itemCount: savedOrderDetail.length,
                itemBuilder: (context, index) {
                  final savedOrder = savedOrderDetail[index];
                  return ListTile(
                    onTap: () => ref
                        .read(savedOrderDetailProvider.notifier)
                        .savedOrderDetail(savedOrder),
                    title: Text(
                      //menampilkan daftaritems dari saved order
                      savedOrder!.items.map((x) => x.menuItem.name).join(', '),
                    ),
                  );
                },
              ));
  }
}
