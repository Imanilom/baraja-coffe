import 'package:barajapos/models/adapter/order_item.model.dart';
import 'package:barajapos/widgets/cards/menu_item_card.dart';
import 'package:barajapos/widgets/sheets/order_item_options_sheet.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barajapos/providers/menu_item_provider.dart';
import 'package:barajapos/providers/order_detail_providers/order_detail_provider.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final menu = ref.watch(menuItemProvider);
    final orderDetailNotifier = ref.read(orderDetailProvider.notifier);
    final orderDetail = ref.watch(orderDetailProvider);

    // print('menu item di UI ${menu.value}');
    return Row(
      children: [
        NavigationRail(
          alignment: NavigationRailAlignment.start,
          labelPosition: NavigationLabelPosition.bottom,
          onSelected: (index) {},
          labelType: NavigationLabelType.all,
          children: const [
            NavigationItem(
              label: Text('Popular'),
              child: Icon(LucideIcons.blocks),
            ),
            NavigationItem(
              label: Text('Coffee'),
              child: Icon(LucideIcons.coffee),
            )
          ],
        ),
        const VerticalDivider(),
        //menampilkan menuItems
        Expanded(
          child: Scaffold(
            backgroundColor: Colors.gray[100],
            child: menu.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(child: Text('Error: $error')),
              data: (menuItems) {
                if (menuItems.isEmpty) {
                  return const Center(child: Text("Tidak ada menu tersedia"));
                }
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
                          orderDetailNotifier.initializeOrder(
                            orderType: 'dine-in', // Default order type
                          );
                        }
                        // Tampilkan sheet pemilihan topping dan addon
                        openSheet(
                          context: context,
                          position: OverlayPosition.bottom,
                          draggable: true,
                          builder: (context) {
                            return OrderItemOptionsSheet(
                              orderItem: OrderItemModel(
                                menuItem: menuItem,
                                quantity: 1,
                                selectedToppings: [],
                                // selectedAddons: [],
                                selectedAddons: menuItem.addons != []
                                    ? menuItem.addons!
                                        .map(
                                          (addon) => addon.copyWith(
                                            options: addon.options
                                                .where(
                                                    (o) => o.isDefault == true)
                                                .toList(), // join(', ')
                                          ),
                                        )
                                        .toList()
                                    : [],
                              ),
                              onSubmit: (newOrder) =>
                                  orderDetailNotifier.addItemToOrder(newOrder),
                            );
                          },
                        );
                      },
                    );
                  },
                );
              },
            ),
          ),
          // child: Center(
          //   child: Text('Menu'),
          // ),
        ),
      ],
    );
  }
}
