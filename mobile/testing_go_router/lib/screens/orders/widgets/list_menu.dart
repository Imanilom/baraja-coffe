import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/providers/menu_item_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/promotion_providers/auto_promo_provider.dart';
import 'package:kasirbaraja/widgets/cards/event_item_card.dart';
import 'package:kasirbaraja/widgets/cards/menu_item_card.dart';
import 'package:kasirbaraja/widgets/dialogs/add_custom_amount_dialog.dart';
import 'package:kasirbaraja/widgets/dialogs/add_order_item_dialog.dart';

final disabledMenuIdsProvider = StateProvider<Set<String>>((ref) => {});

class ListMenu extends ConsumerStatefulWidget {
  const ListMenu({super.key});

  @override
  ConsumerState<ListMenu> createState() => _ListMenuState();
}

class _ListMenuState extends ConsumerState<ListMenu> {
  late final TextEditingController _searchController;
  final _searchFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();

    _searchFocus.addListener(() {
      if (_searchFocus.hasFocus) {
        _selectAll();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  void _selectAll() {
    // Jalankan setelah frame biar selection nggak ketimpa
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final text = _searchController.text;
      _searchController.selection = TextSelection(
        baseOffset: 0,
        extentOffset: text.length,
      );
    });
  }

  void _showMenuActionSheet(MenuItemModel menuItem, bool isDisabled) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: Icon(
                  isDisabled ? Icons.check_circle_outline : Icons.block,
                  color: isDisabled ? Colors.green : Colors.red,
                ),
                title: Text(
                  isDisabled ? 'Aktifkan menu ini' : 'Nonaktifkan menu ini',
                ),
                subtitle: const Text('Perubahan hanya di device kasir ini'),
                onTap: () {
                  final notifier = ref.read(disabledMenuIdsProvider.notifier);
                  final current = {...notifier.state};

                  if (isDisabled) {
                    current.remove(menuItem.id);
                  } else {
                    current.add(menuItem.id);
                  }

                  notifier.state = current;
                  Navigator.pop(ctx);
                },
              ),
              const Divider(height: 0),
              ListTile(
                leading: const Icon(Icons.close),
                title: const Text('Batal'),
                onTap: () => Navigator.pop(ctx),
              ),
            ],
          ),
        );
      },
    );
  }

  void _handleAddToOrder(MenuItemModel menuItem) {
    //jika stock 0, tidak bisa add to order dan dihimbau agar kasir mengupdate stock di worksstation
    // if (menuItem.stock?.manualStock == 0) {
    //   showDialog(
    //     context: context,
    //     builder:
    //         (context) => AlertDialog(
    //           title: const Text(
    //             'Stock Kosong',
    //             style: TextStyle(fontWeight: FontWeight.bold),
    //           ),
    //           content: const Text(
    //             'Silakan update stock di Workstation,\natau ganti menu lainnya.',
    //             style: TextStyle(fontSize: 16),
    //           ),
    //           actions: [
    //             TextButton(
    //               onPressed: () => Navigator.pop(context),
    //               child: Padding(
    //                 padding: const EdgeInsets.all(8.0),
    //                 child: const Text('Baiklah'),
    //               ),
    //             ),
    //           ],
    //         ),
    //   );
    //   return;
    // }

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
    final promoGroup = ref.watch(promoGroupsProvider);
    final isSearchBarVisible = ref.watch(searchBarProvider);
    print('Promo Groups: $promoGroup');
    const categories = [
      'promo',
      'All',
      'makanan',
      'minuman',
      'event',
      'art galery',
      'bazar',
    ];

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
                  final visible = ref.read(searchBarProvider);
                  ref.read(searchBarProvider.notifier).state = !visible;

                  // clear saat MENYEMBUNYIKAN
                  if (visible) {
                    _searchController.clear();
                    ref.read(searchQueryProvider.notifier).state = '';
                    _searchFocus.unfocus();
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
                      onTap: () {
                        ref.read(categoryProvider.notifier).state = category;

                        if (category == 'promo') {
                          // paksa refetch realtime
                          print('asd');
                          ref.invalidate(autopromoProvider);
                          ref.invalidate(promoGroupsProvider);
                        }
                      },
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
                      focusNode: _searchFocus,
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
                      onTap: _selectAll,
                      onTapOutside: (_) => _searchFocus.unfocus(),
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
                      selectedCategory == 'promo'
                          ? promoGroup.when(
                            data:
                                (data) =>
                                    data.isEmpty
                                        ? const Center(
                                          child: Text(
                                            'Tidak ada promo ditemukan',
                                          ),
                                        )
                                        : GridView.builder(
                                          padding: const EdgeInsets.all(8),
                                          gridDelegate:
                                              const SliverGridDelegateWithFixedCrossAxisCount(
                                                crossAxisCount: 2,
                                                mainAxisSpacing: 8,
                                                crossAxisSpacing: 8,
                                                childAspectRatio: 1.6,
                                              ),
                                          itemCount: data.length,
                                          itemBuilder: (context, index) {
                                            final g = data[index];
                                            return _PromoGroupCard(
                                              title: g.name,
                                              subtitle: g.promoType,
                                              promoType: g.promoType,
                                              onTap: () async {
                                                await ref
                                                    .read(
                                                      orderDetailProvider
                                                          .notifier,
                                                    )
                                                    .applyPromoGroup(g);
                                              },
                                            );
                                          },
                                        ),
                            error:
                                (error, stack) =>
                                    Center(child: Text('Error: $error')),
                            loading:
                                () => const Center(
                                  child: CircularProgressIndicator(),
                                ),
                          )
                          : menu.when(
                            loading:
                                () => const Center(
                                  child: CircularProgressIndicator(),
                                ),
                            error:
                                (error, stack) =>
                                    Center(child: Text('Error: $error')),
                            data:
                                (data) =>
                                    data.isEmpty
                                        ? const Center(
                                          child: Text(
                                            'Tidak ada menu ditemukan',
                                          ),
                                        )
                                        : GridView.builder(
                                          gridDelegate:
                                              SliverGridDelegateWithFixedCrossAxisCount(
                                                crossAxisCount:
                                                    selectedCategory == 'event'
                                                        ? 2
                                                        : 4,
                                                mainAxisSpacing:
                                                    selectedCategory == 'event'
                                                        ? 8
                                                        : 4,
                                                crossAxisSpacing:
                                                    selectedCategory == 'event'
                                                        ? 8
                                                        : 4,
                                                childAspectRatio:
                                                    selectedCategory == 'event'
                                                        ? 1.5
                                                        : 1,
                                              ),
                                          padding: const EdgeInsets.all(8),
                                          itemCount: data.length + 1,
                                          itemBuilder: (context, index) {
                                            if (index == 0) {
                                              return _buildCustomAmountButton();
                                            }

                                            final menuIndex = index - 1;
                                            final menuItem = data[menuIndex];

                                            // cek apakah menu ini sedang di-disable
                                            final disabledIds = ref.watch(
                                              disabledMenuIdsProvider,
                                            );
                                            final isOutOfStock =
                                                (menuItem.stock?.manualStock ??
                                                    0) <=
                                                0;
                                            final isDisabled =
                                                disabledIds.contains(
                                                  menuItem.id,
                                                ) ||
                                                isOutOfStock;

                                            if (selectedCategory == 'event') {
                                              return EventItemCard(
                                                menuItem: menuItem,
                                                onTap:
                                                    () => _handleAddToOrder(
                                                      menuItem,
                                                    ),
                                              );
                                            }

                                            return MenuItemCard(
                                              menuItem: menuItem,
                                              isDisabled: isDisabled,
                                              onTap:
                                                  () => _handleAddToOrder(
                                                    menuItem,
                                                  ),
                                              onLongPress:
                                                  () => _showMenuActionSheet(
                                                    menuItem,
                                                    isDisabled,
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

class _PromoGroupCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String promoType;
  final VoidCallback onTap;

  const _PromoGroupCard({
    required this.title,
    required this.subtitle,
    required this.promoType,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isBundle = promoType == 'bundling';
    final icon =
        isBundle ? Icons.all_inbox_rounded : Icons.card_giftcard_rounded;

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200, width: 1),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 28),
            const SizedBox(height: 8),
            Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
            ),
            const Spacer(),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    isBundle ? 'Bundling' : 'Buy X Get Y',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Spacer(),
                const Icon(Icons.add_circle_outline, size: 20),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
