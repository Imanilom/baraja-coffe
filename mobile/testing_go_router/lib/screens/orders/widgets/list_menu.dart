import 'package:assorted_layout_widgets/assorted_layout_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/providers/menu_item_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/widgets/cards/menu_item_card.dart';
import 'package:kasirbaraja/widgets/dialogs/add_order_item_dialog.dart';

class ListMenu extends ConsumerStatefulWidget {
  const ListMenu({super.key});

  @override
  ConsumerState<ListMenu> createState() => _ListMenuState();
}

class _ListMenuState extends ConsumerState<ListMenu> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _handleAddToOrder(MenuItemModel menuItem) {
    final orderDetail = ref.read(orderDetailProvider);
    final notifier = ref.read(orderDetailProvider.notifier);

    if (orderDetail == null) {
      notifier.initializeOrder(orderType: OrderType.dineIn);
    }

    final List<AddonModel> selectedAddons =
        menuItem.addons!
            .map((addon) {
              final defaultOptions =
                  addon.options
                      ?.where((option) => option.isDefault == true)
                      .toList();

              return AddonModel(
                id: addon.id,
                name: addon.name,
                type: addon.type,
                options: defaultOptions,
              );
            })
            .where(
              (addon) => addon.options != null && addon.options!.isNotEmpty,
            )
            .toList();

    print('selectedAddons: $selectedAddons');

    final orderItem = OrderItemModel(
      menuItem: menuItem,
      selectedToppings: [],
      selectedAddons: selectedAddons,
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (context) => AddOrderItemDialog(
            orderItem: orderItem,
            onAddOrder: (addOrderItem) {
              notifier.addItemToOrder(addOrderItem);
            },
            onClose: () => Navigator.pop(context),
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedCategory = ref.watch(categoryProvider);
    // final menu = ref.watch(menuItemProvider);
    final menu = ref.watch(reservationMenuItemProvider);
    final isSearchBarVisible = ref.watch(searchBarProvider);

    const categories = ['All', 'makanan', 'minuman'];

    return Row(
      children: [
        // Categories Sidebar
        Expanded(
          flex: 1,
          child: Scaffold(
            backgroundColor: Colors.white,
            bottomNavigationBar: BottomAppBar(
              color: Colors.white,
              padding: const EdgeInsets.all(8.0),
              height: 52,
              surfaceTintColor: Colors.white,
              child: IconButton(
                icon: Icon(
                  isSearchBarVisible
                      ? Icons.search_off_rounded
                      : Icons.search_rounded,
                ),
                onPressed: () {
                  ref.read(searchBarProvider.notifier).state =
                      !isSearchBarVisible;
                  if (!isSearchBarVisible) {
                    _searchController.clear();
                    ref.read(searchQueryProvider.notifier).state = '';
                  }
                },
              ),
            ),
            body: ListView(
              children:
                  categories.map((category) {
                    return ListTile(
                      horizontalTitleGap: 4,
                      visualDensity: const VisualDensity(vertical: -2),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                      dense: true,
                      selected: selectedCategory == category,
                      selectedTileColor: Colors.green.shade50,
                      title: Text(
                        category,
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                      onTap:
                          () =>
                              ref.read(categoryProvider.notifier).state =
                                  category,
                    );
                  }).toList(),
            ),
          ),
        ),

        VerticalDivider(width: 2, color: Colors.grey.shade200),

        // Main Content
        Expanded(
          flex: 4,
          child: Container(
            color: Colors.grey.shade200,
            child: Column(
              children: [
                // Search Bar
                if (isSearchBarVisible)
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Cari menu...',
                        prefixIcon: const Icon(Icons.search_rounded),
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            ref.read(searchQueryProvider.notifier).state = '';
                          },
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: Colors.white,
                      ),
                      onChanged:
                          (value) =>
                              ref.read(searchQueryProvider.notifier).state =
                                  value,
                      autofocus: false,
                    ),
                  ),

                // Menu Grid
                Expanded(
                  child: menu.when(
                    loading:
                        () => const Center(child: CircularProgressIndicator()),
                    error:
                        (error, stack) => Center(child: Text('Error: $error')),
                    data:
                        (data) =>
                            data.isEmpty
                                ? const Center(
                                  child: Text('Tidak ada menu ditemukan'),
                                )
                                : GridView.builder(
                                  gridDelegate:
                                      const SliverGridDelegateWithFixedCrossAxisCount(
                                        crossAxisCount: 4,
                                        mainAxisSpacing: 4,
                                        crossAxisSpacing: 4,
                                        childAspectRatio: 1,
                                      ),
                                  padding: const EdgeInsets.all(8),
                                  itemCount: data.length,
                                  itemBuilder:
                                      (context, index) => MenuItemCard(
                                        menuItem: data[index],
                                        onTap:
                                            () =>
                                                _handleAddToOrder(data[index]),
                                      ),
                                ),
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
