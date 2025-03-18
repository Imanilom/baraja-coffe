import 'package:barajapos/models/order_detail_model.dart';
import 'package:barajapos/providers/navigation_provider.dart';
import 'package:barajapos/utils/format_rupiah.dart';
import 'package:barajapos/widgets/dialogs/edit_order_item_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barajapos/providers/order_detail_providers/order_detail_provider.dart';

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currenIndex = ref.watch(navigationProvider);
    double totalPrices = 0;
    OrderDetailModel? orderDetail;

    switch (currenIndex) {
      case 0:
        orderDetail = ref.watch(orderDetailProvider);
        totalPrices = ref.watch(orderDetailProvider.notifier).totalPrice;
        break;
      default:
    }

    // final totalPrices = ref.watch(orderDetailProvider.notifier).totalPrice;
    // final orderDetail = ref.watch(orderDetailProvider);

    return Scaffold(
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(8.0),
            child: Text(
              'Daftar Pesanan',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: orderDetail == null || orderDetail.items.isEmpty
                ? const Center(child: Text('Pilih menu untuk memulai pesanan'))
                : ListView.builder(
                    itemCount: orderDetail.items.length,
                    itemBuilder: (context, index) {
                      final orderItem = orderDetail!.items[index];
                      return ListTile(
                        onTap: () {
                          // Tampilkan dialog edit
                          showDialog(
                            context: context,
                            builder: (context) {
                              return EditOrderItemDialog(
                                orderItem: orderItem,
                                onEditOrder: (editedOrderItem) {
                                  // Panggil method editOrderItem di OrderNotifier
                                  ref
                                      .read(orderDetailProvider.notifier)
                                      .editOrderItem(
                                          orderItem, editedOrderItem);
                                },
                              );
                            },
                          );
                        },
                        title: Text(
                            '${orderItem.menuItem.name} (x${orderItem.quantity})'),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (orderItem.selectedToppings.isNotEmpty)
                              Text(
                                  'Topping: ${orderItem.selectedToppings.map((t) => t.name).join(', ')}'),
                            if (orderItem.selectedAddons.isNotEmpty)
                              //mengambil nama addons dan lable pada opsions

                              Text(
                                  'Addons: ${orderItem.selectedAddons.map((addon) => addon.options.first.label).join(', ')}'),
                            Text(
                                'Sub total: ${formatRupiah(orderItem.subTotalPrice)}'),
                          ],
                        ),
                        trailing: IconButton(
                          icon: const Icon(
                            Icons.delete_outline_rounded,
                            color: Colors.grey,
                          ),
                          onPressed: () {
                            ref
                                .read(orderDetailProvider.notifier)
                                .removeItem(orderItem.menuItem.id);
                          },
                        ),
                      );
                    },
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              'Total: ${formatRupiah(totalPrices)}',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: ElevatedButton(
              onPressed: () {
                ref.read(orderDetailProvider.notifier).clearOrder();
              },
              child: const Text('Clear Order'),
            ),
          ),
        ],
      ),
    );
  }
}
