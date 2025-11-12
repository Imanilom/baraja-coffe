import 'package:assorted_layout_widgets/assorted_layout_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/event.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/providers/menu_item_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/widgets/cards/event_item_card.dart';
import 'package:kasirbaraja/widgets/cards/menu_item_card.dart';
import 'package:kasirbaraja/widgets/dialogs/add_custom_amount_dialog.dart';
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
    //jika stock 0, tidak bisa add to order dan dihimbau agar kasir mengupdate stock di worksstation
    if (menuItem.stock?.manualStock == 0) {
      showDialog(
        context: context,
        builder:
            (context) => AlertDialog(
              title: const Text(
                'Stock Kosong',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              content: const Text(
                'Silakan update stock di Workstation,\natau ganti menu lainnya.',
                style: TextStyle(fontSize: 16),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: const Text('Baiklah'),
                  ),
                ),
              ],
            ),
      );
      return;
    }

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

  void _handleAddCustomAmount() {
    final orderDetail = ref.read(orderDetailProvider);
    final notifier = ref.read(orderDetailProvider.notifier);

    if (orderDetail == null) {
      notifier.initializeOrder(orderType: OrderType.dineIn);
    }
    // Panggil dialog
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (context) => AddCustomAmountDialog(
            orderType: OrderType.dineIn, // opsional
            onAddCustomAmount: (customAmountItem) {
              notifier.addCustomAmountItem(customAmountItem);
            },
            onClose: () => Navigator.pop(context),
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedCategory = ref.watch(categoryProvider);
    // final event = ref.watch(localEventProvider);
    final menu = ref.watch(reservationMenuItemProvider);
    final isSearchBarVisible = ref.watch(searchBarProvider);

    const categories = ['All', 'makanan', 'minuman', 'event', 'Art Galery'];

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
            color: Colors.grey.shade50,
            child: Column(
              children: [
                // Search Bar
                if (isSearchBarVisible)
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: SearchBar(
                      controller: _searchController,
                      hintText: 'Cari menu...',
                      leading: const Icon(Icons.search_rounded),
                      trailing: [
                        IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            ref.read(searchQueryProvider.notifier).state = '';
                          },
                        ),
                      ],
                      onChanged: (value) {
                        ref.read(searchQueryProvider.notifier).state = value;
                      },

                      // opsional: biar tampilannya mirip TextField kamu
                      elevation: const WidgetStatePropertyAll(0),
                      backgroundColor: const WidgetStatePropertyAll(
                        Colors.white,
                      ),
                      shape: WidgetStatePropertyAll(
                        RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      constraints: const BoxConstraints(maxHeight: 48),
                    ),
                  ),

                // Menu Grid
                Expanded(
                  child:
                  // selectedCategory == 'Event'
                  //     ? event.when(
                  //       loading:
                  //           () => const Center(
                  //             child: CircularProgressIndicator(),
                  //           ),
                  //       error:
                  //           (error, stack) =>
                  //               Center(child: Text('Error: $error')),
                  //       data:
                  //           (data) =>
                  //               data.isEmpty
                  //                   ? const Center(
                  //                     child: Text(
                  //                       'Tidak ada menu ditemukan',
                  //                     ),
                  //                   )
                  //                   : GridView.builder(
                  //                     gridDelegate:
                  //                         const SliverGridDelegateWithFixedCrossAxisCount(
                  //                           crossAxisCount: 2,
                  //                           mainAxisSpacing: 8,
                  //                           crossAxisSpacing: 8,
                  //                           childAspectRatio: 1.5,
                  //                         ),
                  //                     padding: const EdgeInsets.all(8),
                  //                     itemCount: data.length,
                  //                     itemBuilder:
                  //                         (context, index) => Container(
                  //                           decoration: BoxDecoration(
                  //                             color: Colors.white,
                  //                             borderRadius:
                  //                                 BorderRadius.circular(8),
                  //                           ),
                  //                           child: Padding(
                  //                             padding: const EdgeInsets.all(
                  //                               8.0,
                  //                             ),
                  //                             child: Column(
                  //                               children: [
                  //                                 Expanded(
                  //                                   flex: 4,
                  //                                   child: ClipRRect(
                  //                                     borderRadius:
                  //                                         BorderRadius.circular(
                  //                                           8,
                  //                                         ),
                  //                                     child: Image.network(
                  //                                       data[index]
                  //                                               .imageUrl ??
                  //                                           '',
                  //                                       fit: BoxFit.cover,
                  //                                       width:
                  //                                           double.infinity,
                  //                                       height:
                  //                                           double.infinity,
                  //                                       errorBuilder: (
                  //                                         context,
                  //                                         error,
                  //                                         stackTrace,
                  //                                       ) {
                  //                                         return Container(
                  //                                           color:
                  //                                               Colors
                  //                                                   .grey[100],
                  //                                           child: Center(
                  //                                             child: Icon(
                  //                                               Icons
                  //                                                   .restaurant_menu,
                  //                                               color:
                  //                                                   Colors
                  //                                                       .grey[400],
                  //                                               size: 32,
                  //                                             ),
                  //                                           ),
                  //                                         );
                  //                                       },
                  //                                     ),
                  //                                   ),
                  //                                 ),
                  //                                 Expanded(
                  //                                   flex: 2,
                  //                                   child: Center(
                  //                                     child: Text(
                  //                                       data[index].name,
                  //                                       style:
                  //                                           const TextStyle(
                  //                                             fontSize: 12,
                  //                                             fontWeight:
                  //                                                 FontWeight
                  //                                                     .bold,
                  //                                           ),
                  //                                       textAlign:
                  //                                           TextAlign
                  //                                               .center,
                  //                                     ),
                  //                                   ),
                  //                                 ),
                  //                               ],
                  //                             ),
                  //                           ),
                  //                         ),
                  //                   ),
                  //     )
                  //     :
                  menu.when(
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
                                      SliverGridDelegateWithFixedCrossAxisCount(
                                        crossAxisCount:
                                            selectedCategory == 'event' ? 2 : 4,
                                        mainAxisSpacing:
                                            selectedCategory == 'event' ? 8 : 4,
                                        crossAxisSpacing:
                                            selectedCategory == 'event' ? 8 : 4,
                                        childAspectRatio:
                                            selectedCategory == 'event'
                                                ? 1.5
                                                : 1,
                                      ),
                                  padding: const EdgeInsets.all(8),
                                  itemCount: data.length + 1,
                                  itemBuilder: (context, index) {
                                    // Item pertama adalah tombol Custom Amount
                                    if (index == 0) {
                                      return _buildCustomAmountButton();
                                    }

                                    // Item selanjutnya adalah menu (index - 1 karena ada custom amount di depan)
                                    final menuIndex = index - 1;

                                    return selectedCategory == 'event'
                                        ? EventItemCard(
                                          menuItem: data[menuIndex],
                                          onTap:
                                              () => _handleAddToOrder(
                                                data[menuIndex],
                                              ),
                                        )
                                        : MenuItemCard(
                                          menuItem: data[menuIndex],
                                          onTap:
                                              () => _handleAddToOrder(
                                                data[menuIndex],
                                              ),
                                        );
                                  },
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

  Widget _buildCustomAmountButton() {
    return GestureDetector(
      onTap: _handleAddCustomAmount,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200, width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image Container
            Expanded(
              flex: 3,
              child: Container(
                decoration: const BoxDecoration(
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                ),
                child: ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                  child: Container(
                    color: Colors.grey[100],
                    child: Center(
                      child: Icon(Icons.add, color: Colors.grey[400], size: 42),
                    ),
                  ),
                ),
              ),
            ),
            // Content Container
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: Center(
                  child: Text(
                    'Custom Amount',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF2D3748),
                      height: 1.2,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
