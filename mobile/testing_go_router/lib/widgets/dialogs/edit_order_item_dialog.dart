import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:kasirbaraja/models/order_type.model.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/addon_option.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:kasirbaraja/models/custom_discount.model.dart';
import 'package:kasirbaraja/screens/orders/order_details/custom_discount_dialog.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

class EditOrderItemDialog extends StatefulWidget {
  final OrderItemModel orderItem;
  final Function(OrderItemModel) onEditOrder;
  final Function() onClose;
  final Function()? onDeleteOrderItem;
  final bool isLocked;

  const EditOrderItemDialog({
    super.key,
    required this.orderItem,
    required this.onEditOrder,
    required this.onClose,
    this.onDeleteOrderItem,
    this.isLocked = false,
  });

  @override
  EditOrderItemDialogState createState() => EditOrderItemDialogState();
}

class EditOrderItemDialogState extends State<EditOrderItemDialog> {
  late List<ToppingModel> selectedToppings;
  late List<AddonModel> selectedAddons;
  late int quantity;
  late String note;
  late OrderTypeModel selectedOrderType;
  CustomDiscountModel? customDiscount;

  @override
  void initState() {
    super.initState();
    selectedToppings = List.from(widget.orderItem.selectedToppings);
    selectedAddons = List.from(widget.orderItem.selectedAddons);
    AppLogger.debug('selectedAddons: $selectedAddons');
    quantity = widget.orderItem.quantity;
    note = widget.orderItem.notes ?? '';
    selectedOrderType = widget.orderItem.orderType ?? OrderTypeModel.dineIn;
    customDiscount = widget.orderItem.customDiscount;
  }

  @override
  Widget build(BuildContext context) {
    final menuItem = widget.orderItem.menuItem;
    final screenHeight = MediaQuery.of(context).size.height;

    return Container(
      height: screenHeight, // Fixed height for landscape
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          // Header - Compact
          _buildHeader(),

          // Content - Scrollable
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  if (widget.isLocked)
                    Container(
                      margin: const EdgeInsets.only(top: 16),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.amber[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.amber),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.lock, size: 16, color: Colors.amber[800]),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Item ini sudah tersimpan. Hapus dan input ulang jika ingin mengubah.',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.amber[900],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
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

          // Bottom actions
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
          // Handle bar
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 12),

          // Title and delete button
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: (widget.isLocked
                          ? Colors.grey
                          : const Color(0xFF4CAF50))
                      .withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(
                  widget.isLocked ? Icons.lock : Icons.edit,
                  color:
                      widget.isLocked ? Colors.grey : const Color(0xFF4CAF50),
                  size: 16,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  widget.isLocked ? 'Detail Item (Terkunci)' : 'Edit Item',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
              ),
              if (widget.onDeleteOrderItem != null) _buildDeleteButton(),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDeleteButton() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(6),
      ),
      child: IconButton(
        icon: const Icon(Icons.delete_outline, size: 18),
        color: Colors.red[600],
        padding: const EdgeInsets.all(8),
        constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
        onPressed: () => _showDeleteConfirmation(),
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
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(8),
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
                          const SizedBox(height: 8),
                          InkWell(
                            onTap: () => _showDiscountDialog(menuItem),
                            borderRadius: BorderRadius.circular(4),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color:
                                    customDiscount != null
                                        ? Colors.green[50]
                                        : Colors.grey[100],
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(
                                  color:
                                      customDiscount != null
                                          ? const Color(0xFF4CAF50)
                                          : Colors.grey[300]!,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.discount_outlined,
                                    size: 14,
                                    color:
                                        customDiscount != null
                                            ? Colors.green[700]
                                            : Colors.grey[600],
                                  ),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      customDiscount != null
                                          ? '${customDiscount!.discountType == 'percentage' ? '${customDiscount!.discountValue}% ' : ''}-${formatRupiah(customDiscount!.discountAmount)}'
                                          : 'Diskon',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                        color:
                                            customDiscount != null
                                                ? Colors.green[700]
                                                : Colors.grey[600],
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (customDiscount != null) ...[
                                    const SizedBox(width: 4),
                                    InkWell(
                                      onTap: () {
                                        setState(() {
                                          customDiscount = null;
                                        });
                                      },
                                      child: const Icon(
                                        Icons.close,
                                        size: 14,
                                        color: Colors.red,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
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
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(8),
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
                              ? () => _updateQuantity(quantity - 1)
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
                      onPressed: () => _updateQuantity(quantity + 1),
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
        _updateQuantity(sanitized);
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
    final enabled = onPressed != null && !widget.isLocked;
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
            onTap: widget.isLocked ? null : () => _showNoteDialog(),
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
                  if (!widget.isLocked)
                    Icon(
                      Icons.edit_outlined,
                      size: 14,
                      color: Colors.grey[600],
                    ),
                ],
              ),
            ),
          ),
        ],
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
              'Topping',
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
    final selectedTopIds = selectedToppings.map((t) => t.id).toSet();
    final isSelected = selectedTopIds.contains(topping.id);

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
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
        dense: true,
        title: Text(
          topping.name!,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        ),
        subtitle:
            topping.price! > 0
                ? Text(
                  '+ ${formatRupiah(topping.price!)}',
                  style: TextStyle(
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
        onChanged:
            widget.isLocked
                ? null
                : (value) {
                  HapticFeedback.lightImpact();
                  setState(() {
                    if (isSelected) {
                      selectedToppings.remove(topping);
                    } else {
                      selectedToppings.add(topping);
                    }
                    _recalculateDiscount();
                  });
                },
      ),
    );
  }

  Widget _buildAddonsSection(List<AddonModel> addons) {
    if (addons.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              Icons.extension_outlined,
              size: 16,
              color: Color(0xFF4CAF50),
            ),
            const SizedBox(width: 6),
            Text(
              'Addon',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...addons.map(_buildAddonItem),
      ],
    );
  }

  Widget _buildAddonItem(AddonModel addon) {
    final options = addon.options ?? const <AddonOptionModel>[];
    if (options.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
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
          ...options.map((opt) => _buildAddonOption(addon, opt)),
        ],
      ),
    );
  }

  Widget _buildAddonOption(AddonModel addon, AddonOptionModel option) {
    final selectedOptionId = _selectedOptionIdFor(addon.id!); // bisa null
    final isSelected = selectedOptionId == option.id;

    return Container(
      margin: const EdgeInsets.only(bottom: 2),
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
      child: RadioListTile<String>(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
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
                    backgroundColor: Colors.green[50],
                  ),
                ),
        value: option.id!, // ← pakai id
        groupValue: selectedOptionId, // ← pakai id terpilih
        activeColor: const Color(0xFF4CAF50),
        onChanged:
            widget.isLocked
                ? null
                : (val) {
                  if (val == null) return;
                  HapticFeedback.lightImpact();
                  _setSelectedOption(addon.id!, option, addon);
                },
      ),
    );
  }

  // Ambil optionId terpilih utk addon.id tertentu
  String? _selectedOptionIdFor(String addonId) {
    final a = selectedAddons.firstWhere(
      (x) => x.id == addonId,
      orElse: () => AddonModel(id: addonId, name: '', type: '', options: []),
    );
    if (a.options == null || a.options!.isEmpty) return null;
    return a.options!.first.id; // karena single-choice
  }

  // Set option terpilih utk addon.id tertentu (replace single-choice)
  void _setSelectedOption(
    String addonId,
    AddonOptionModel option,
    AddonModel addonSource,
  ) {
    final idx = selectedAddons.indexWhere((x) => x.id == addonId);
    final updated = addonSource.copyWith(options: [option]);
    if (idx == -1) {
      selectedAddons.add(updated);
    } else {
      selectedAddons[idx] = updated;
    }
    setState(() {
      _recalculateDiscount();
    });
  }

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
              child: Text(
                widget.isLocked ? 'Tutup' : 'Batal',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF4CAF50),
                ),
              ),
            ),
          ),
          if (!widget.isLocked) ...[
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  final editedOrderItem = OrderItemModel(
                    menuItem: widget.orderItem.menuItem,
                    quantity: quantity,
                    selectedToppings: selectedToppings,
                    selectedAddons: selectedAddons,
                    notes: note.isEmpty ? null : note,
                    orderType: selectedOrderType,
                    customDiscount: customDiscount,
                  );
                  widget.onEditOrder(editedOrderItem);
                  widget.onClose();
                },
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
                  'Simpan',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showDeleteConfirmation() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(
                    Icons.delete_outline,
                    color: Colors.red[600],
                    size: 18,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Hapus Item',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            content: const Text(
              'Apakah Anda yakin ingin menghapus item ini?',
              style: TextStyle(fontSize: 13),
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
                  HapticFeedback.lightImpact();
                  widget.onDeleteOrderItem?.call();
                  Navigator.of(context).pop();
                  widget.onClose();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red[600],
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                child: const Text(
                  'Hapus',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
    );
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
            child: SegmentedButton<OrderTypeModel>(
              segments: [
                ButtonSegment<OrderTypeModel>(
                  value: OrderTypeModel.dineIn,
                  label: Text(
                    OrderTypeModel.dineIn.name,
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
                ButtonSegment<OrderTypeModel>(
                  value: OrderTypeModel.takeAway,
                  label: Text(
                    OrderTypeModel.takeAway.name,
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
              ],
              selected: {selectedOrderType},
              onSelectionChanged: (Set<OrderTypeModel> newSelection) {
                setState(() {
                  selectedOrderType = newSelection.first;
                });
                AppLogger.debug('Selected Order Type: $selectedOrderType');
              },
              showSelectedIcon: false,
            ),
          ),
        ],
      ),
    );
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

  // ---------- Discount & Quantity Helpers ----------

  void _updateQuantity(int newQuantity) {
    if (newQuantity < 1) return;

    setState(() {
      quantity = newQuantity;
      _recalculateDiscount();
    });
  }

  void _recalculateDiscount() {
    if (customDiscount == null || !customDiscount!.isActive) return;

    // Only recalculate amount for percentage discount
    if (customDiscount!.discountType == 'percentage') {
      final unitPrice = _calculateUnitBasePrice();
      final currentSubtotal = unitPrice * quantity;

      final newDiscountAmount =
          (currentSubtotal * customDiscount!.discountValue / 100).round();

      customDiscount = customDiscount!.copyWith(
        discountAmount: newDiscountAmount,
      );
    }
    // For fixed discount, the amount stays fixed as per requirement (or common behavior)
    // If the user entered a nominal amount, it's usually a specific deduction they want.
    // However, if they want "5000 per item", our current UI/Model structure (single amount field)
    // suggests it's a total discount.
  }

  int _calculateUnitBasePrice() {
    final menuItem = widget.orderItem.menuItem;
    final double basePrice = (menuItem.originalPrice ?? 0).toDouble();

    // Hitung total toppings
    double toppingTotal = 0;
    final selectedToppingIds = selectedToppings.map((t) => t.id).toSet();
    final allToppings = menuItem.toppings ?? const [];
    for (final t in allToppings) {
      if (selectedToppingIds.contains(t.id)) {
        toppingTotal += t.price ?? 0;
      }
    }

    // Hitung total addons
    double addonTotal = 0;
    for (final addon in selectedAddons) {
      if (addon.options != null && addon.options!.isNotEmpty) {
        addonTotal += addon.options!.first.price ?? 0;
      }
    }

    return (basePrice + toppingTotal + addonTotal).toInt();
  }

  void _showDiscountDialog(dynamic menuItem) {
    final unitPrice = _calculateUnitBasePrice();
    final currentSubtotal = unitPrice * quantity;

    showDialog(
      context: context,
      builder:
          (context) => CustomDiscountDialog(
            title: 'Diskon Item',
            itemSubtotal: currentSubtotal.toInt(),
            initialDiscountType: customDiscount?.discountType,
            initialDiscountValue: customDiscount?.discountValue,
            initialReason: customDiscount?.reason,
            onApply: (type, value, reason) {
              final discountAmount =
                  type == 'percentage'
                      ? (currentSubtotal * value / 100).round()
                      : value;

              setState(() {
                customDiscount = CustomDiscountModel(
                  isActive: true,
                  discountType: type,
                  discountValue: value,
                  discountAmount: discountAmount,
                  reason: reason,
                  appliedAt: DateTime.now(),
                );
              });
            },
          ),
    );
  }
}

// ---------- Small helpers ----------
class _SectionCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  const _SectionCard({
    required this.child,
    required this.padding,
    required this.margin,
  });

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
