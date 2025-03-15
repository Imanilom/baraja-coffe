import 'package:barajapos/providers/auth_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barajapos/providers/menu_item_provider.dart';
import 'package:barajapos/providers/order_provider.dart';
import 'package:barajapos/utils/format_rupiah.dart';
import 'package:barajapos/widgets/dialogs/order_option_dialogs.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final menu = ref.watch(menuItemProvider);
    final order = ref.watch(orderProvider);
    final totalPrices = ref.watch(orderProvider.notifier).totalPrice;
    final logout = ref.read(authProvider.notifier).logout;

    // State untuk input customer dan order type
    final customerNameController = TextEditingController();
    final phoneNumberController = TextEditingController();
    String orderType = 'Dine-In';
    int tableNumber;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('Pesan Menu'),
        actions: [
          //tombol logout
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => logout(),
          ),
        ],
      ),
      body: Row(
        children: [
          // Daftar Menu (Sebelah Kiri)
          Expanded(
            flex: 2,
            child: menu.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(child: Text('Error: $error')),
              data: (menuItems) {
                return ListView.builder(
                  itemCount: menuItems.length,
                  itemBuilder: (context, index) {
                    final menuItem = menuItems[index];
                    return ListTile(
                      title: Text(menuItem.name),
                      subtitle: Text('Price: ${formatRupiah(menuItem.price)}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.add),
                        onPressed: () {
                          // Tampilkan dialog pemilihan topping dan addon
                          showDialog(
                            context: context,
                            builder: (context) {
                              return OrderOptionDialogs(
                                menuItem: menuItem,
                                onAddToOrder: (orderItem) {
                                  // Tambahkan ke daftar pesanan
                                  ref
                                      .read(orderProvider.notifier)
                                      .addToOrder(orderItem);
                                },
                              );
                            },
                          );
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),

          // Daftar Pesanan (Sebelah Kanan)
          Expanded(
            flex: 1,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Column(
                    children: [
                      TextField(
                        controller: customerNameController,
                        decoration: const InputDecoration(
                          labelText: 'Nama Customer',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: phoneNumberController,
                        decoration: const InputDecoration(
                          labelText: 'Nomor Telepon (Opsional)',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 10),
                      DropdownButtonFormField<String>(
                        value: orderType,
                        items: ['Dine-In', 'Takeaway'].map((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value),
                          );
                        }).toList(),
                        onChanged: (value) {
                          orderType = value!;
                        },
                        decoration: const InputDecoration(
                          labelText: 'Order Type',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 10),
                      if (orderType == 'Dine-In')
                        TextField(
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Nomor Meja',
                            border: OutlineInputBorder(),
                          ),
                          onChanged: (value) {
                            tableNumber = int.tryParse(value) ?? 0;
                          },
                        ),
                    ],
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.all(8.0),
                  child: Text(
                    'Daftar Pesanan',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: order.length,
                    itemBuilder: (context, index) {
                      final orderItem = order[index];
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
                                .read(orderProvider.notifier)
                                .removeFromOrder(orderItem);
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
                      ref.read(orderProvider.notifier).clearOrder();
                    },
                    child: const Text('Clear Order'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
