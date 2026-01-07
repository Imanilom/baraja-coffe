import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/addon_option.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/enums/order_type.dart';

class AddOrderItemDialog extends ConsumerStatefulWidget {
  final OrderItemModel orderItem;
  final Function(OrderItemModel) onAddOrder;
  final VoidCallback onClose;
  final OrderType? orderType;

  const AddOrderItemDialog({
    super.key,
    required this.orderItem,
    required this.onAddOrder,
    required this.onClose,
    this.orderType,
  });

  @override
  ConsumerState<AddOrderItemDialog> createState() => AddOrderItemDialogState();
}

class AddOrderItemDialogState extends ConsumerState<AddOrderItemDialog> {
  late Set<String> selectedToppingIds; // toppingId
  late Map<String, String>
  selectedAddonOptionIdByAddonId; // addonId -> optionId
  late int quantity;
  late String note;
  late OrderType selectedOrderType;

  @override
  void initState() {
    super.initState();
    // Seed dari orderItem awal (pakai id agar stabil terhadap re-instansti model)
    selectedToppingIds =
        widget.orderItem.selectedToppings
            .where((t) => t.id != null)
            .map((t) => t.id!)
            .toSet();

    selectedAddonOptionIdByAddonId = {
      for (final a in widget.orderItem.selectedAddons)
        if (a.id != null && (a.options?.isNotEmpty ?? false))
          a.id!: a.options!.first.id ?? '',
    }..removeWhere((_, v) => v.isEmpty);

    quantity = widget.orderItem.quantity;
    note = widget.orderItem.notes ?? '';
    selectedOrderType = widget.orderType ?? OrderType.dineIn;
  }

  @override
  Widget build(BuildContext context) {
    final menuItem = widget.orderItem.menuItem;
    final screenHeight = MediaQuery.of(context).size.height;

    return Container(
      height: screenHeight, // tetap full sheet
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
                  _notesAndTypeSection(),
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

  // ---------- Header ----------
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
                  color: const Color(0xFF4CAF50).withValues(alpha: 0.1),
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

  // ---------- Top section ----------
  Widget _buildTopSection(dynamic menuItem) {
    return Row(
      spacing: 16,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 8,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.menu_book_rounded,
                      size: 16,
                      color: Color(0xFF4CAF50),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Menu Item',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[700],
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFF4CAF50).withValues(alpha: 0.1),
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
                            menuItem.name ?? '-',
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
              ],
            ),
          ),
        ),
        Expanded(
          child: _SectionCard(
            child: Column(
              spacing: 8,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.shopping_cart_outlined,
                      size: 16,
                      color: Color(0xFF4CAF50),
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildQuantityButton(
                      icon: Icons.remove,
                      onPressed:
                          quantity > 1
                              ? () => setState(() => quantity--)
                              : null,
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Center(
                        child: TextButton(
                          onPressed: _showQuantityInputDialog,
                          style: TextButton.styleFrom(
                            // minimumSize: Size.,
                            padding: EdgeInsets.all(8),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            alignment: Alignment.center,
                            backgroundColor: Colors.transparent,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(6),
                              side: const BorderSide(color: Color(0xFF4CAF50)),
                            ),
                          ),
                          child: Text(
                            '$quantity',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1A1A1A),
                            ),
                          ),
                        ),
                      ),
                    ),
                    _buildQuantityButton(
                      icon: Icons.add,
                      onPressed: () => setState(() => quantity++),
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

  void _showQuantityInputDialog() {
    final controller = TextEditingController(text: quantity.toString());
    final focusNode = FocusNode();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          title: const Text(
            'Ubah Jumlah',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          content: SizedBox(
            width: 280,
            child: Row(
              children: [
                // Tombol -
                IconButton(
                  onPressed: () {
                    final current = int.tryParse(controller.text) ?? quantity;
                    final next = (current - 1).clamp(1, 9999);
                    controller.text = next.toString();
                  },
                  icon: const Icon(Icons.remove),
                ),
                // Input angka
                Expanded(
                  child: TextField(
                    controller: controller,
                    focusNode: focusNode,
                    autofocus: true,
                    textAlign: TextAlign.center,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: InputDecoration(
                      hintText: 'Masukkan jumlah',
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFF4CAF50)),
                      ),
                    ),
                    onSubmitted: (_) => Navigator.of(context).pop('submit'),
                  ),
                ),
                // Tombol +
                IconButton(
                  onPressed: () {
                    final current = int.tryParse(controller.text) ?? quantity;
                    final next = (current + 1).clamp(1, 9999);
                    controller.text = next.toString();
                  },
                  icon: const Icon(Icons.add),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('Batal', style: TextStyle(color: Colors.grey[700])),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: () => Navigator.of(context).pop('submit'),
              child: const Text('Simpan'),
            ),
          ],
        );
      },
    ).then((result) {
      // Validasi & simpan
      if (result == 'submit') {
        final raw = controller.text.trim();
        final parsed = int.tryParse(raw) ?? quantity;
        final sanitized = parsed.clamp(1, 9999); // batas atas opsional
        HapticFeedback.lightImpact();
        setState(() => quantity = sanitized);
      }
      controller.dispose();
      focusNode.dispose();
    });

    // auto-select semua biar cepat ganti
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.selection = TextSelection(
        baseOffset: 0,
        extentOffset: controller.text.length,
      );
      focusNode.requestFocus();
    });
  }

  // ---------- Quantity button ----------

  Widget _buildQuantityButton({
    required IconData icon,
    required VoidCallback? onPressed,
  }) {
    final enabled = onPressed != null;
    return Container(
      // width: 28,
      // height: 28,
      decoration: BoxDecoration(
        color: enabled ? const Color(0xFF4CAF50) : Colors.grey[200],
        borderRadius: BorderRadius.circular(6),
      ),
      child: IconButton(
        icon: Icon(icon),
        color: enabled ? Colors.white : Colors.grey[400],
        padding: EdgeInsets.zero,
        onPressed:
            enabled
                ? () {
                  HapticFeedback.lightImpact();
                  onPressed();
                }
                : null,
      ),
    );
  }

  // ---------- Notes ----------
  Widget _buildNotesSection() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.note_outlined,
                size: 16,
                color: const Color(0xFF4CAF50),
              ),
              const SizedBox(width: 6),
              Text(
                'Catatan',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          InkWell(
            onTap: () => _showNoteDialog(),
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      note.isEmpty ? 'Tambahkan catatan...' : note,
                      style: TextStyle(
                        fontSize: 13,
                        color:
                            note.isEmpty ? Colors.grey[500] : Colors.grey[800],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Icon(Icons.edit_outlined, size: 14, color: Colors.grey[600]),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------- Toppings & Addons ----------
  Widget _buildToppingsAndAddons(dynamic menuItem) {
    final List<ToppingModel> toppings =
        (menuItem.toppings as List<ToppingModel>?) ?? const [];
    final List<AddonModel> addons =
        (menuItem.addons as List<AddonModel>?) ?? const [];

    if (toppings.isEmpty && addons.isEmpty) return const SizedBox.shrink();

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (toppings.isNotEmpty) ...[
          Expanded(child: _buildToppingsSection(toppings)),
          if (addons.isNotEmpty) const SizedBox(width: 12),
        ],
        if (addons.isNotEmpty) Expanded(child: _buildAddonsSection(addons)),
      ],
    );
  }

  Widget _buildToppingsSection(List<ToppingModel> toppings) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle(icon: Icons.add_circle_outline, label: 'Topping'),
        const SizedBox(height: 8),
        _SectionCard(
          padding: const EdgeInsets.all(8),
          child: Column(children: toppings.map(_buildToppingItem).toList()),
        ),
      ],
    );
  }

  Widget _buildToppingItem(ToppingModel topping) {
    final id = topping.id ?? '';
    final isSelected = selectedToppingIds.contains(id);

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color:
            isSelected
                ? const Color(0xFF4CAF50).withValues(alpha: 0.1)
                : Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isSelected ? const Color(0xFF4CAF50) : Colors.grey[200]!,
          width: isSelected ? 1.5 : 1,
        ),
      ),
      child: CheckboxListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8),
        dense: true,
        title: Text(
          topping.name ?? '-',
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        ),
        subtitle:
            (topping.price ?? 0) > 0
                ? Text(
                  '+ ${formatRupiah(topping.price!)}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: Colors.blue,
                    fontWeight: FontWeight.w500,
                  ),
                )
                : Text(
                  'Free',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 10,
                    color: Colors.green,
                    backgroundColor: Colors.green[50],
                  ),
                ),
        value: isSelected,
        activeColor: const Color(0xFF4CAF50),
        controlAffinity: ListTileControlAffinity.trailing,
        onChanged: (_) {
          HapticFeedback.lightImpact();
          setState(() {
            if (isSelected) {
              selectedToppingIds.remove(id);
            } else {
              selectedToppingIds.add(id);
            }
          });
        },
      ),
    );
  }

  Widget _buildAddonsSection(List<AddonModel> addons) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle(icon: Icons.extension_outlined, label: 'Addon'),
        const SizedBox(height: 8),
        ...addons.map(_buildAddonItem),
      ],
    );
  }

  Widget _buildAddonItem(AddonModel addon) {
    final options = addon.options ?? const <AddonOptionModel>[];
    return _SectionCard(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            addon.name ?? '-',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 6),
          ...options.map((o) => _buildAddonOption(addon, o)),
        ],
      ),
    );
  }

  Widget _buildAddonOption(AddonModel addon, AddonOptionModel option) {
    final addonId = addon.id ?? '';
    final optionId = option.id ?? '';
    final groupValue = selectedAddonOptionIdByAddonId[addonId];
    final isSelected = groupValue == optionId;

    return Container(
      margin: const EdgeInsets.only(bottom: 2),
      decoration: BoxDecoration(
        color: isSelected ? Colors.green[50] : Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isSelected ? const Color(0xFF4CAF50) : Colors.grey[200]!,
          width: isSelected ? 1.5 : 1,
        ),
      ),
      child: RadioListTile<String>(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8),
        dense: true,
        title: Text(
          option.label ?? '-',
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        ),
        subtitle:
            (option.price ?? 0) > 0
                ? Text(
                  '+ ${formatRupiah(option.price!)}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: Colors.blue,
                    fontWeight: FontWeight.w500,
                  ),
                )
                : Text(
                  'Free',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 10,
                    color: Colors.green,
                    backgroundColor: Colors.greenAccent,
                  ),
                ),
        value: optionId,
        groupValue: groupValue,
        activeColor: const Color(0xFF4CAF50),
        onChanged: (val) {
          if (val == null) return;
          HapticFeedback.lightImpact();
          setState(() {
            selectedAddonOptionIdByAddonId[addonId] = val;
          });
        },
      ),
    );
  }

  // ---------- Bottom actions ----------
  Widget _buildActionButtons() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Row(
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
              onPressed: _onConfirm,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                elevation: 2,
              ),
              child: const Text(
                'Tambahkan',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _onConfirm() {
    HapticFeedback.lightImpact();

    // Rekonstruksi list dari ID yang dipilih agar konsisten dengan skema model kamu
    final allToppings = widget.orderItem.menuItem.toppings ?? const [];
    final selectedToppings =
        allToppings.where((t) => selectedToppingIds.contains(t.id)).toList();

    final allAddons = widget.orderItem.menuItem.addons ?? const [];
    final selectedAddons = <AddonModel>[];
    for (final addon in allAddons) {
      final addonId = addon.id ?? '';
      final selectedOptionId = selectedAddonOptionIdByAddonId[addonId];
      if (selectedOptionId == null) continue;
      final option = (addon.options ?? const <AddonOptionModel>[]).firstWhere(
        (o) => o.id == selectedOptionId,
        orElse: () => AddonOptionModel(id: '', label: '', price: 0),
      );
      if (option.id?.isNotEmpty == true) {
        selectedAddons.add(addon.copyWith(options: [option]));
      }
    }

    final edited = OrderItemModel(
      menuItem: widget.orderItem.menuItem,
      quantity: quantity,
      selectedToppings: selectedToppings,
      selectedAddons: selectedAddons,
      notes: note.isEmpty ? null : note,
      orderType: selectedOrderType,
    );

    print('OrderItem orderType: ${edited.orderType}');

    widget.onAddOrder(edited);
    widget.onClose();
  }

  // ---------- Dialogs ----------
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
                focusedBorder: const OutlineInputBorder(
                  borderSide: BorderSide(color: Color(0xFF4CAF50)),
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
                  setState(() => note = controller.text.trim());
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

  Widget _buildOrderTypeSelector() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.delivery_dining_outlined,
                size: 16,
                color: const Color(0xFF4CAF50),
              ),
              const SizedBox(width: 6),
              Text(
                'Tipe Pesanan',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Center(
            child: SegmentedButton<OrderType>(
              segments: [
                ButtonSegment<OrderType>(
                  value: OrderType.dineIn,
                  label: Text(
                    _getShortOrderTypeLabel(OrderType.dineIn),
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
                ButtonSegment<OrderType>(
                  value: OrderType.takeAway,
                  label: Text(
                    _getShortOrderTypeLabel(OrderType.takeAway),
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
              ],
              selected: {selectedOrderType ?? OrderType.dineIn},
              onSelectionChanged: (Set<OrderType> newSelection) {
                setState(() {
                  selectedOrderType = newSelection.first;
                });
                print('Selected Order Type: $selectedOrderType');
              },
              showSelectedIcon: false,
            ),
          ),
        ],
      ),
    );
  }

  String _getShortOrderTypeLabel(OrderType orderType) {
    switch (orderType) {
      case OrderType.dineIn:
        return 'Dine-In';
      case OrderType.pickup:
        return 'Pickup';
      case OrderType.delivery:
        return 'Delivery';
      case OrderType.takeAway:
        return 'Take Away';
      case OrderType.reservation:
        return 'Reservation';
      default:
        return 'Unknown';
    }
  }

  Widget _notesAndTypeSection() {
    return Row(
      spacing: 16,
      children: [
        Expanded(child: _buildNotesSection()),
        Expanded(child: _buildOrderTypeSelector()),
      ],
    );
  }
}

// ---------- Small helpers ----------
class _SectionCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  const _SectionCard({required this.child, this.padding, this.margin});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding ?? const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final IconData icon;
  final String label;

  const _SectionTitle({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFF4CAF50)),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
      ],
    );
  }
}
