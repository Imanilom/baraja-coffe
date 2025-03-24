import 'package:barajapos/widgets/cards/menu_item_card.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barajapos/providers/menu_item_provider.dart';
import 'package:barajapos/providers/order_detail_providers/order_detail_provider.dart';
import 'package:barajapos/widgets/dialogs/order_option_dialogs.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final menu = ref.watch(menuItemProvider);
    final orderDetailNotifier = ref.read(orderDetailProvider.notifier);
    final orderDetail = ref.watch(orderDetailProvider);
    return Scaffold(
      backgroundColor: Colors.gray[100],
      child: menu.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
        data: (menuItems) {
          return GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1,
              // mainAxisExtent: 200,
            ),
            padding: const EdgeInsets.all(16),
            itemCount: menuItems.length,
            itemBuilder: (context, index) {
              final menuItem = menuItems[index];
              return MenuItemCard(
                menuItem: menuItem,
                onTap: () {
                  if (orderDetail == null) {
                    print('Initialize order dulu');
                    orderDetailNotifier.initializeOrder(
                      orderType: 'dine-in', // Default order type
                    );
                  }
                  // Tampilkan dialog pemilihan topping dan addon
                  showDialog(
                    context: context,
                    builder: (context) {
                      return OrderOptionDialogs(
                        menuItem: menuItem,
                        onAddToOrder: (orderItem) =>
                            orderDetailNotifier.addItemToOrder(orderItem),
                      );
                    },
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
