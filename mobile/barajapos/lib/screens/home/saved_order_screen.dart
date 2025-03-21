import 'package:barajapos/providers/orders/saved_order_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SavedOrderScreen extends ConsumerWidget {
  const SavedOrderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedOrderDetail = ref.watch(savedOrderProvider);

    return Scaffold(
        backgroundColor: Colors.white,
        body: savedOrderDetail.isEmpty
            ? const Center(child: Text('No saved orders available'))
            : ListView.builder(
                itemCount: savedOrderDetail.length,
                itemBuilder: (context, index) {
                  final order = savedOrderDetail[index];
                  return ListTile(
                    title: Text(order.toString()),
                  );
                },
              ));
  }
}
