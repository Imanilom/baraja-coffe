import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/providers/menu_item_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/widgets/cards/menu_item_card.dart';

class ListMenu extends ConsumerWidget {
  const ListMenu({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // buat provider selected index category
    final selectedCategoryIndex = ref.watch(selectedCategoryIndexProvider);
    final menu = ref.watch(menuItemProvider);
    final orderDetailNotifier = ref.read(orderDetailProvider.notifier);
    final orderDetail = ref.watch(orderDetailProvider);

    return Row(
      children: [
        NavigationRail(
          selectedIndex: selectedCategoryIndex,
          backgroundColor: Colors.white,
          labelType: NavigationRailLabelType.all,
          useIndicator: false,
          onDestinationSelected: (int index) {
            ref.read(selectedCategoryIndexProvider.notifier).state = index;
          },
          selectedLabelTextStyle: const TextStyle(
            color: Color.fromARGB(255, 24, 138, 39),
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelTextStyle: const TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w400,
          ),
          destinations: [
            NavigationRailDestination(
              icon: const SizedBox.shrink(),
              label: Text('Popular'),
            ),
            NavigationRailDestination(
              icon: const SizedBox.shrink(),
              label: Text('Promo'),
            ),
            NavigationRailDestination(
              icon: const SizedBox.shrink(),
              label: Text('Makanan'),
            ),
            NavigationRailDestination(
              icon: const SizedBox.shrink(),
              label: Text('Minuman'),
            ),
            NavigationRailDestination(
              icon: const SizedBox.shrink(),
              label: Text('Snack'),
            ),
          ],
        ),
        Divider(color: Colors.grey.shade500, thickness: 2),
        Expanded(
          child: Container(
            color: Colors.grey.shade200,
            child: Column(
              children: [
                // Search Input (TIDAK memerlukan Expanded)
                // Padding(
                //   padding: const EdgeInsets.all(8.0),
                //   child: TextField(
                //     decoration: InputDecoration(
                //       hintText: 'Cari menu...',
                //       prefixIcon: const Icon(Icons.search),
                //       border: OutlineInputBorder(
                //         borderRadius: BorderRadius.circular(8),
                //         borderSide: BorderSide.none,
                //       ),
                //       filled: true,
                //       fillColor: Colors.white,
                //     ),
                //   ),
                // ),

                // GridView (MEMERLUKAN Expanded)
                Expanded(
                  child: menu.when(
                    loading:
                        () => const Center(child: CircularProgressIndicator()),
                    error:
                        (error, stack) => Center(child: Text('Error: $error')),
                    data: (data) {
                      return GridView.builder(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 4,
                              mainAxisSpacing: 4,
                              crossAxisSpacing: 4,
                              childAspectRatio: 1,
                            ),
                        padding: const EdgeInsets.all(8),
                        itemCount: data.length,
                        itemBuilder: (context, index) {
                          final menuItem = data[index];
                          return MenuItemCard(
                            menuItem: menuItem,
                            onTap: () {
                              if (orderDetail == null) {
                                orderDetailNotifier.initializeOrder(
                                  orderType: 'Dine-In', // Default order type
                                );
                              }
                              orderDetailNotifier.addItemToOrder(
                                OrderItemModel(
                                  menuItem: menuItem,
                                  selectedToppings: [],
                                  selectedAddons: [],
                                ),
                              );
                            },
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

final selectedCategoryIndexProvider = StateProvider<int>((ref) => 0);
