import 'package:barajapos/providers/auth_provider.dart';
import 'package:barajapos/screens/order_details/order_detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barajapos/providers/menu_item_provider.dart';
import 'package:barajapos/providers/order_detail_provider.dart';
import 'package:barajapos/utils/format_rupiah.dart';
import 'package:barajapos/widgets/dialogs/order_option_dialogs.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final menu = ref.watch(menuItemProvider);
    final logout = ref.read(authProvider.notifier).logout;

    return Scaffold(
      body: Row(
        children: [
          // Daftar Menu (Sebelah Kiri)
          Expanded(
            flex: 2,
            child: Scaffold(
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
              body: menu.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stack) => Center(child: Text('Error: $error')),
                data: (menuItems) {
                  return ListView.builder(
                    itemCount: menuItems.length,
                    itemBuilder: (context, index) {
                      final menuItem = menuItems[index];
                      return ListTile(
                        title: Text(menuItem.name),
                        subtitle:
                            Text('Price: ${formatRupiah(menuItem.price)}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.add),
                          onPressed: () {
                            ref
                                .read(orderDetailProvider.notifier)
                                .initializeOrder(
                                  cashierId:
                                      'Nama Kasir', // Ambil dari state login
                                  orderType: 'Dine-In', // Default order type
                                );
                            // Tampilkan dialog pemilihan topping dan addon
                            showDialog(
                              context: context,
                              builder: (context) {
                                return OrderOptionDialogs(
                                  menuItem: menuItem,
                                  onAddToOrder: (orderItem) {
                                    // Tambahkan ke daftar pesanan
                                    ref
                                        .read(orderDetailProvider.notifier)
                                        .addItemToOrder(orderItem);
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
          ),

          // Daftar Pesanan (Sebelah Kanan)
          const Expanded(
            flex: 1,
            child: OrderDetailScreen(),
          ),
        ],
      ),
    );
  }
}
