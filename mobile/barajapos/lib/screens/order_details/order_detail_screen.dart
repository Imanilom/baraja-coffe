import 'package:barajapos/utils/format_rupiah.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barajapos/providers/order_detail_provider.dart';

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderDetailProvider);
    final totalPrices = ref.watch(orderDetailProvider.notifier).totalPrice;
    final orderDetail = ref.watch(orderDetailProvider);

    // State untuk input customer dan order type
    // final customerNameController = TextEditingController();
    // final phoneNumberController = TextEditingController();
    return Column(
      children: [
        // Padding(
        //   padding: const EdgeInsets.all(8.0),
        //   child: Column(
        //     children: [
        //       TextField(
        //         controller: customerNameController,
        //         decoration: const InputDecoration(
        //           labelText: 'Nama Customer',
        //           border: OutlineInputBorder(),
        //         ),
        //       ),
        //       const SizedBox(height: 10),
        //       TextField(
        //         controller: phoneNumberController,
        //         decoration: const InputDecoration(
        //           labelText: 'Nomor Telepon (Opsional)',
        //           border: OutlineInputBorder(),
        //         ),
        //       ),
        //       const SizedBox(height: 10),
        //       DropdownButtonFormField<String>(
        //         value: orderType,
        //         items: ['Dine-In', 'Takeaway'].map((String value) {
        //           return DropdownMenuItem<String>(
        //             value: value,
        //             child: Text(value),
        //           );
        //         }).toList(),
        //         onChanged: (value) {
        //           orderType = value!;
        //         },
        //         decoration: const InputDecoration(
        //           labelText: 'Order Type',
        //           border: OutlineInputBorder(),
        //         ),
        //       ),
        //       const SizedBox(height: 10),
        //       if (orderType == 'Dine-In')
        //         TextField(
        //           keyboardType: TextInputType.number,
        //           decoration: const InputDecoration(
        //             labelText: 'Nomor Meja',
        //             border: OutlineInputBorder(),
        //           ),
        //           onChanged: (value) {
        //             // tableNumber = int.tryParse(value) ?? 0;
        //           },
        //         ),
        //     ],
        //   ),
        // ),
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
                  itemCount: order!.items.length,
                  itemBuilder: (context, index) {
                    final orderItem = order.items[index];
                    return ListTile(
                      title: Text(orderItem.menuItem.name),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (orderItem.selectedToppings.isNotEmpty)
                            Text(
                                'Topping: ${orderItem.selectedToppings.map((t) => t.name).join(', ')}'),
                          if (orderItem.selectedAddons.isNotEmpty)
                            Text(
                                'Addon: ${orderItem.selectedAddons.map((a) => a.label).join(', ')}'),
                          Text(
                              'Sub total: ${formatRupiah(orderItem.subTotalPrice)}'),
                        ],
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.remove),
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
    );
  }
}
