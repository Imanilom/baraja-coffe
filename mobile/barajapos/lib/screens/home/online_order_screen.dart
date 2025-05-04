import 'package:barajapos/models/adapter/order_detail.model.dart';
import 'package:barajapos/providers/orders/online_order_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class OnlineOrderScreen extends ConsumerWidget {
  const OnlineOrderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final onlineOrder = ref.watch(onlineOrderProvider);

    //refresh dengan menarik ke bawah
    void refresh() {
      ref.read(onlineOrderProvider);
    }

    return Scaffold(
      // appBar: AppBar(title: const Text('Order Online')),
      body: RefreshIndicator(
        onRefresh: () async => refresh(),
        child: onlineOrder.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stack) => Center(child: Text('Error: $error')),
          data: (orders) {
            if (orders.isEmpty) {
              return const Center(child: Text("Tidak ada order online"));
            }
            return ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: orders.length,
              itemBuilder: (context, index) {
                final order = orders[index];
                return ListTile(
                  title: Text(order.customerId ??
                      order.customerName ??
                      'unknow customer'),
                  subtitle: Text('Order Id: ${order.orderId}'),
                  onTap: () {
                    // Tampilkan detail order saat ditekan
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Detail Order'),
                        content: Column(
                          children: [
                            Text('Detail untuk ${order.customerName}'),
                            Text(
                                'Item: ${order.items.map((item) => item.menuItem.name).join(', ')}'),
                            Text(
                                'Topping: ${order.items.map((item) => item.selectedToppings.map((t) => t.name).join(', ')).join(', ')}'),
                            Text(
                                'Addons: ${order.items.map((item) => item.selectedAddons.map((a) => a.options!.map((o) => o.label).join(', ')).join(', ')).join(', ')}'),
                          ],
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(context).pop(),
                            child: const Text('Tutup'),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }
}
