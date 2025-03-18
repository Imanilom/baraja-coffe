import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barajapos/providers/menu_item_provider.dart';
// import 'package:barajapos/providers/order_detail_providers/order_detail_provider.dart';
// import 'package:barajapos/utils/format_rupiah.dart';
// import 'package:barajapos/widgets/dialogs/order_option_dialogs.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final menu = ref.watch(menuItemProvider);
    // final orderDetailNotifier = ref.read(orderDetailProvider.notifier);
    // final orderDetail = ref.watch(orderDetailProvider);
    return Scaffold(
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
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Price: Rp${menuItem.price}'),
                    Text(
                        'Toppings: ${menuItem.toppings.map((x) => x.name).join(', ')}'),
                    Text(
                        'Addons: ${menuItem.addons!.map((x) => x.options.map((y) => y.label)).join(', ')}'),
                  ],
                ),
                trailing: Text(menuItem.category.map((x) => x).join(', ')),
              );
              // return ListTile(
              //   title: Text(menuItem.name),
              //   subtitle: Text('Price: ${formatRupiah(menuItem.price)}'),
              //   trailing: IconButton(
              //     icon: const Icon(Icons.add),
              //     onPressed: () {
              //       if (orderDetail == null) {
              //         print('Initialize order dulu');
              //         orderDetailNotifier.initializeOrder(
              //           cashierId: 'Nama Kasir', // Ambil dari state login
              //           orderType: 'Dine-In', // Default order type
              //         );
              //       }
              //       // Tampilkan dialog pemilihan topping dan addon
              //       // showDialog(
              //       //   context: context,
              //       //   builder: (context) {
              //       //     return OrderOptionDialogs(
              //       //       menuItem: menuItem,
              //       //       onAddToOrder: (orderItem) =>
              //       //           orderDetailNotifier.addItemToOrder(orderItem),
              //       //     );
              //       //   },
              //       // );
              //     },
              //   ),
              // );
            },
          );
        },
      ),
    );
  }
}
