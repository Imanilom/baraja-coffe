import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/addon_option.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

class AddOrderItemDialog extends StatefulWidget {
  final OrderItemModel orderItem;
  final Function(OrderItemModel) onAddOrder;
  final Function() onClose;

  const AddOrderItemDialog({
    super.key,
    required this.orderItem,
    required this.onAddOrder,
    required this.onClose,
  });

  @override
  AddOrderItemDialogState createState() => AddOrderItemDialogState();
}

class AddOrderItemDialogState extends State<AddOrderItemDialog> {
  late Map<String, int> toppingQuantities; // ToppingId -> Quantity
  late Map<String, Map<String, int>>
  addonOptionQuantities; // AddonId -> {OptionId -> Quantity}
  late int quantity;
  late String note;

  @override
  void initState() {
    super.initState();
    quantity = widget.orderItem.quantity;
    note = widget.orderItem.notes ?? '';

    // Initialize topping quantities
    toppingQuantities = {};
    for (var topping in widget.orderItem.selectedToppings) {
      toppingQuantities[topping.id!] =
          (toppingQuantities[topping.id!] ?? 0) + 1;
    }

    // Initialize addon option quantities
    addonOptionQuantities = {};
    _initializeAddonQuantities();
  }

  void _initializeAddonQuantities() {
    final menuItem = widget.orderItem.menuItem;
    if (menuItem.addons != null) {
      for (var addon in menuItem.addons!) {
        final addonId = addon.id!;
        addonOptionQuantities[addonId] = {};

        if (addon.options != null && addon.options!.isNotEmpty) {
          // Initialize all options to 0
          for (var option in addon.options!) {
            addonOptionQuantities[addonId]![option.id!] = 0;
          }

          // Set default option quantity to match product quantity
          var defaultOption = addon.options!.firstWhere(
            (option) => option.isDefault == true,
            orElse: () => addon.options!.first,
          );
          addonOptionQuantities[addonId]![defaultOption.id!] = quantity;
        }
      }
    }
  }

  int _getTotalAddonQuantity(String addonId) {
    return addonOptionQuantities[addonId]?.values.fold(
          0,
          (sum, qty) => sum! + qty,
        ) ??
        0;
  }

  bool _canIncreaseAddonOption(String addonId, String optionId) {
    final currentQty = addonOptionQuantities[addonId]?[optionId] ?? 0;
    final totalAddonQty = _getTotalAddonQuantity(addonId);
    return totalAddonQty < quantity;
  }

  bool _canDecreaseAddonOption(String addonId, String optionId) {
    final currentQty = addonOptionQuantities[addonId]?[optionId] ?? 0;
    return currentQty > 0;
  }

  void _updateAddonOptionQuantity(String addonId, String optionId, int change) {
    setState(() {
      final currentQty = addonOptionQuantities[addonId]?[optionId] ?? 0;
      final newQty = currentQty + change;

      if (newQty >= 0) {
        addonOptionQuantities[addonId]![optionId] = newQty;

        // If increasing and total would exceed product quantity,
        // reduce other options proportionally
        if (change > 0) {
          final totalQty = _getTotalAddonQuantity(addonId);
          if (totalQty > quantity) {
            _redistributeAddonQuantities(addonId, optionId);
          }
        }
      }
    });
  }

  void _redistributeAddonQuantities(String addonId, String priorityOptionId) {
    final options = addonOptionQuantities[addonId]!;
    int totalQty = options.values.fold(0, (sum, qty) => sum + qty);
    int excess = totalQty - quantity;

    // Reduce from other options (not the priority one)
    for (var entry in options.entries.toList()) {
      if (entry.key != priorityOptionId && excess > 0 && entry.value > 0) {
        int reduction = entry.value.clamp(0, excess);
        options[entry.key] = entry.value - reduction;
        excess -= reduction;
      }
    }
  }

  void _updateProductQuantity(int newQuantity) {
    setState(() {
      final oldQuantity = quantity;
      quantity = newQuantity;

      // Adjust addon quantities when product quantity changes
      for (var addonId in addonOptionQuantities.keys) {
        final options = addonOptionQuantities[addonId]!;
        final totalAddonQty = _getTotalAddonQuantity(addonId);

        if (totalAddonQty != newQuantity) {
          if (newQuantity > oldQuantity) {
            // Increase: Add to default option
            final menuAddon = widget.orderItem.menuItem.addons!.firstWhere(
              (addon) => addon.id == addonId,
            );
            var defaultOption = menuAddon.options!.firstWhere(
              (option) => option.isDefault == true,
              orElse: () => menuAddon.options!.first,
            );

            final increase = newQuantity - totalAddonQty;
            options[defaultOption.id!] =
                (options[defaultOption.id!] ?? 0) + increase;
          } else {
            // Decrease: Remove from options with highest quantity first
            int decrease = totalAddonQty - newQuantity;
            final sortedEntries =
                options.entries.where((e) => e.value > 0).toList()
                  ..sort((a, b) => b.value.compareTo(a.value));

            for (var entry in sortedEntries) {
              if (decrease <= 0) break;

              int reduction = entry.value.clamp(0, decrease);
              options[entry.key] = entry.value - reduction;
              decrease -= reduction;
            }
          }
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final menuItem = widget.orderItem.menuItem;
    final screenHeight = MediaQuery.of(context).size.height;

    return Container(
      height: screenHeight,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  _buildTopSection(menuItem),
                  const SizedBox(height: 16),
                  _buildNotesSection(),
                  const SizedBox(height: 16),
                  _buildToppingsAndAddons(menuItem),
                ],
              ),
            ),
          ),
          _buildActionButtons(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFF4CAF50).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.edit,
                  color: Color(0xFF4CAF50),
                  size: 16,
                ),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Add Item',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTopSection(dynamic menuItem) {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFF4CAF50).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.restaurant_menu,
                    color: Color(0xFF4CAF50),
                    size: 18,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        menuItem.name!,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1A1A1A),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        formatRupiah(menuItem.displayPrice()),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.shopping_cart_outlined,
                      size: 16,
                      color: const Color(0xFF4CAF50),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Jumlah',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[700],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildQuantityButton(
                      icon: Icons.remove,
                      onPressed:
                          quantity > 1
                              ? () => _updateProductQuantity(quantity - 1)
                              : null,
                    ),
                    Container(
                      width: 40,
                      alignment: Alignment.center,
                      child: Text(
                        '$quantity',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1A1A),
                        ),
                      ),
                    ),
                    _buildQuantityButton(
                      icon: Icons.add,
                      onPressed: () => _updateProductQuantity(quantity + 1),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    required VoidCallback? onPressed,
  }) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: onPressed != null ? const Color(0xFF4CAF50) : Colors.grey[200],
        borderRadius: BorderRadius.circular(6),
      ),
      child: IconButton(
        icon: Icon(icon, size: 14),
        color: onPressed != null ? Colors.white : Colors.grey[400],
        padding: EdgeInsets.zero,
        onPressed:
            onPressed != null
                ? () {
                  HapticFeedback.lightImpact();
                  onPressed();
                }
                : null,
      ),
    );
  }

  Widget _buildNotesSection() {
    return InkWell(
      onTap: () => _showNoteDialog(),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Icon(Icons.note_outlined, size: 16, color: const Color(0xFF4CAF50)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                note.isEmpty ? 'Tambahkan catatan...' : note,
                style: TextStyle(
                  fontSize: 13,
                  color: note.isEmpty ? Colors.grey[500] : Colors.grey[800],
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Icon(Icons.edit_outlined, size: 14, color: Colors.grey[600]),
          ],
        ),
      ),
    );
  }

  Widget _buildToppingsAndAddons(dynamic menuItem) {
    final hasToppings = menuItem.toppings?.isNotEmpty ?? false;
    final hasAddons = menuItem.addons?.isNotEmpty ?? false;

    if (!hasToppings && !hasAddons) return const SizedBox.shrink();

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (hasToppings) ...[
          Expanded(child: _buildToppingsSection(menuItem.toppings!)),
          if (hasAddons) const SizedBox(width: 12),
        ],
        if (hasAddons) ...[
          Expanded(child: _buildAddonsSection(menuItem.addons!)),
        ],
      ],
    );
  }

  Widget _buildToppingsSection(List<ToppingModel> toppings) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              Icons.add_circle_outline,
              size: 16,
              color: const Color(0xFF4CAF50),
            ),
            const SizedBox(width: 6),
            Text(
              'Topping (Opsional)',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            children:
                toppings.map((topping) => _buildToppingItem(topping)).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildToppingItem(ToppingModel topping) {
    final currentQty = toppingQuantities[topping.id!] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color:
            currentQty > 0
                ? const Color(0xFF4CAF50).withOpacity(0.1)
                : Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: currentQty > 0 ? const Color(0xFF4CAF50) : Colors.grey[200]!,
          width: currentQty > 0 ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  topping.name!,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  topping.price! > 0
                      ? '+ ${formatRupiah(topping.price!)}'
                      : 'Free',
                  style: TextStyle(
                    fontSize: 10,
                    color: topping.price! > 0 ? Colors.blue : Colors.green,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildSmallQuantityButton(
                icon: Icons.remove,
                onPressed:
                    currentQty > 0
                        ? () {
                          setState(() {
                            toppingQuantities[topping.id!] = currentQty - 1;
                            if (toppingQuantities[topping.id!] == 0) {
                              toppingQuantities.remove(topping.id!);
                            }
                          });
                        }
                        : null,
              ),
              Container(
                width: 30,
                alignment: Alignment.center,
                child: Text(
                  '$currentQty',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              _buildSmallQuantityButton(
                icon: Icons.add,
                onPressed: () {
                  setState(() {
                    toppingQuantities[topping.id!] = currentQty + 1;
                  });
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAddonsSection(List<AddonModel> addons) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              Icons.extension_outlined,
              size: 16,
              color: const Color(0xFF4CAF50),
            ),
            const SizedBox(width: 6),
            Text(
              'Addon (Wajib)',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
          ],
        ),
        Text(
          'Setiap produk harus memiliki 1 addon option',
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[600],
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 8),
        ...addons.map((addon) => _buildAddonItem(addon)),
      ],
    );
  }

  Widget _buildAddonItem(AddonModel addon) {
    final totalQty = _getTotalAddonQuantity(addon.id!);
    final isValid = totalQty == quantity;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: isValid ? Colors.grey[50] : Colors.red[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isValid ? Colors.grey[200]! : Colors.red[200]!,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                addon.name!,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1A1A1A),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isValid ? Colors.green[100] : Colors.red[100],
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '$totalQty/$quantity',
                  style: TextStyle(
                    fontSize: 10,
                    color: isValid ? Colors.green[700] : Colors.red[700],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ...addon.options!.map((option) => _buildAddonOption(addon, option)),
        ],
      ),
    );
  }

  Widget _buildAddonOption(AddonModel addon, AddonOptionModel option) {
    final currentQty = addonOptionQuantities[addon.id!]?[option.id!] ?? 0;
    final canIncrease = _canIncreaseAddonOption(addon.id!, option.id!);
    final canDecrease = _canDecreaseAddonOption(addon.id!, option.id!);

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: currentQty > 0 ? Colors.green[50] : Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: currentQty > 0 ? const Color(0xFF4CAF50) : Colors.grey[200]!,
          width: currentQty > 0 ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      option.label!,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (option.isDefault == true) ...[
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 1,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.orange[100],
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(
                          'Default',
                          style: TextStyle(
                            fontSize: 8,
                            color: Colors.orange[700],
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  option.price! > 0
                      ? '+ ${formatRupiah(option.price!)}'
                      : 'Free',
                  style: TextStyle(
                    fontSize: 10,
                    color: option.price! > 0 ? Colors.blue : Colors.green,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildSmallQuantityButton(
                icon: Icons.remove,
                onPressed:
                    canDecrease
                        ? () {
                          // Special validation: ensure we don't reduce below minimum requirement
                          final totalAfterDecrease =
                              _getTotalAddonQuantity(addon.id!) - 1;
                          if (totalAfterDecrease >= 1) {
                            // Must keep at least 1 total
                            _updateAddonOptionQuantity(
                              addon.id!,
                              option.id!,
                              -1,
                            );
                          }
                        }
                        : null,
              ),
              Container(
                width: 30,
                alignment: Alignment.center,
                child: Text(
                  '$currentQty',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              _buildSmallQuantityButton(
                icon: Icons.add,
                onPressed:
                    canIncrease
                        ? () {
                          _updateAddonOptionQuantity(addon.id!, option.id!, 1);
                        }
                        : null,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSmallQuantityButton({
    required IconData icon,
    required VoidCallback? onPressed,
  }) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: onPressed != null ? const Color(0xFF4CAF50) : Colors.grey[200],
        borderRadius: BorderRadius.circular(4),
      ),
      child: IconButton(
        icon: Icon(icon, size: 12),
        color: onPressed != null ? Colors.white : Colors.grey[400],
        padding: EdgeInsets.zero,
        onPressed:
            onPressed != null
                ? () {
                  HapticFeedback.lightImpact();
                  onPressed();
                }
                : null,
      ),
    );
  }

  Widget _buildActionButtons() {
    // Validate that all addons have correct total quantities
    bool isValid = true;
    final menuItem = widget.orderItem.menuItem;

    if (menuItem.addons != null) {
      for (var addon in menuItem.addons!) {
        final totalQty = _getTotalAddonQuantity(addon.id!);
        if (totalQty != quantity) {
          isValid = false;
          break;
        }
      }
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Column(
        children: [
          if (!isValid) ...[
            Container(
              padding: const EdgeInsets.all(8),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.red[200]!),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.warning_outlined,
                    size: 16,
                    color: Colors.red[600],
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Jumlah addon option harus sama dengan jumlah produk',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.red[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: widget.onClose,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    side: const BorderSide(color: Color(0xFF4CAF50)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Batal',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF4CAF50),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed:
                      isValid
                          ? () {
                            HapticFeedback.lightImpact();
                            _saveOrderItems();
                            widget.onClose();
                          }
                          : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        isValid ? const Color(0xFF4CAF50) : Colors.grey[300],
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    elevation: isValid ? 2 : 0,
                  ),
                  child: const Text(
                    'Tambahkan',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _saveOrderItems() {
    // Debug: Print current state
    print('=== DEBUG SAVE ORDER ITEMS ===');
    print('Product quantity: $quantity');

    for (var addonId in addonOptionQuantities.keys) {
      print('Addon $addonId:');
      addonOptionQuantities[addonId]!.forEach((optionId, qty) {
        print('  Option $optionId: $qty');
      });
    }

    // Create distribution list for each unit
    final List<Map<String, dynamic>> unitDistributions = [];

    // Build distribution for each product unit
    for (int unitIndex = 0; unitIndex < quantity; unitIndex++) {
      print('Processing unit $unitIndex');

      // Build toppings for this unit
      final unitToppings = <ToppingModel>[];
      final menuToppings = widget.orderItem.menuItem.toppings ?? [];

      for (var topping in menuToppings) {
        final toppingQty = toppingQuantities[topping.id!] ?? 0;
        if (toppingQty > unitIndex) {
          unitToppings.add(topping);
        }
      }

      // Build addons for this unit
      final unitAddons = <AddonModel>[];
      final menuAddons = widget.orderItem.menuItem.addons ?? [];

      for (var addon in menuAddons) {
        final optionQuantities = addonOptionQuantities[addon.id!] ?? {};
        AddonOptionModel? selectedOption;

        // Find which option this unit should get
        int distributedSoFar = 0;
        for (var entry in optionQuantities.entries) {
          final optionQty = entry.value;
          if (unitIndex >= distributedSoFar &&
              unitIndex < distributedSoFar + optionQty) {
            // This unit gets this option
            selectedOption = addon.options!.firstWhere(
              (opt) => opt.id == entry.key,
            );
            print(
              '  Unit $unitIndex gets addon ${addon.name} option ${selectedOption.label}',
            );
            break;
          }
          distributedSoFar += optionQty;
        }

        if (selectedOption != null) {
          unitAddons.add(
            AddonModel(
              id: addon.id,
              name: addon.name,
              type: addon.type,
              options: [selectedOption],
            ),
          );
        }
      }

      unitDistributions.add({'toppings': unitToppings, 'addons': unitAddons});
    }

    // Group similar combinations
    final Map<String, OrderItemModel> groupedItems = {};

    for (int i = 0; i < unitDistributions.length; i++) {
      final unitToppings =
          unitDistributions[i]['toppings'] as List<ToppingModel>;
      final unitAddons = unitDistributions[i]['addons'] as List<AddonModel>;

      // Create a unique key for this combination
      final toppingsKey = unitToppings.map((t) => t.id).toList()..sort();
      final addonsKey =
          unitAddons
              .map((a) => '${a.id}:${a.options!.map((o) => o.id).join(',')}')
              .toList()
            ..sort();
      final combinationKey =
          '${toppingsKey.join('|')}__${addonsKey.join('|')}__$note';

      print('Unit $i combination key: $combinationKey');

      if (groupedItems.containsKey(combinationKey)) {
        // Increase quantity for existing combination
        final existingItem = groupedItems[combinationKey]!;
        groupedItems[combinationKey] = existingItem.copyWith(
          quantity: existingItem.quantity + 1,
        );
        print('  Increased quantity to ${existingItem.quantity + 1}');
      } else {
        // Create new item for this combination
        groupedItems[combinationKey] = OrderItemModel(
          menuItem: widget.orderItem.menuItem,
          quantity: 1,
          selectedToppings: unitToppings,
          selectedAddons: unitAddons,
          notes: note.isEmpty ? null : note,
        );
        print('  Created new item with quantity 1');
      }
    }

    print('Final grouped items: ${groupedItems.length}');

    // Add each grouped item to the order
    for (var orderItem in groupedItems.values) {
      print('Adding item with quantity ${orderItem.quantity}');
      print(
        '  Addons: ${orderItem.selectedAddons.map((a) => '${a.name}: ${a.options!.map((o) => o.label).join(',')}').join(' | ')}',
      );
      widget.onAddOrder(orderItem);
    }
  }

  void _showNoteDialog() {
    final controller = TextEditingController(text: note);
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            title: const Row(
              children: [
                Icon(Icons.note_outlined, color: Color(0xFF4CAF50), size: 20),
                SizedBox(width: 8),
                Text(
                  'Catatan Pesanan',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            content: TextField(
              controller: controller,
              autofocus: true,
              maxLines: 2,
              maxLength: 200,
              decoration: InputDecoration(
                hintText: 'Masukkan catatan khusus...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: const BorderSide(color: Color(0xFF4CAF50)),
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(
                  'Batal',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    note = controller.text;
                  });
                  Navigator.of(context).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4CAF50),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                child: const Text(
                  'Simpan',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
    );
  }
}
