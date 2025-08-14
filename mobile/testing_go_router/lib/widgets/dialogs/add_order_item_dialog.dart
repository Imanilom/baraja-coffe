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
  late List<ToppingModel> selectedToppings;
  late List<AddonModel> selectedAddons;
  late int quantity;
  late String note;

  @override
  void initState() {
    super.initState();
    selectedToppings = List.from(widget.orderItem.selectedToppings);
    selectedAddons = List.from(widget.orderItem.selectedAddons);
    quantity = widget.orderItem.quantity;
    note = widget.orderItem.notes ?? '';
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
                  const SizedBox(height: 16),
                  // Menu info and quantity in, one row
                  _buildTopSection(menuItem),
                  const SizedBox(height: 16),

                  // Notes section - compact
                  _buildNotesSection(),
                  const SizedBox(height: 16),

                  // Toppings and Addons side by side
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
              // _buildDeleteButton(),
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

  Widget _buildTopSection(dynamic menuItem) {
    return Row(
      children: [
        // Menu item info
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

        // Quantity section
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
                              ? () => setState(() => quantity--)
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
    final isSelected = selectedToppings.contains(topping);

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color:
            isSelected
                ? const Color(0xFF4CAF50).withOpacity(0.1)
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
        subtitle: Text(
          formatRupiah(topping.price!),
          style: TextStyle(fontSize: 10, color: Colors.grey[600]),
        ),
        value: isSelected,
        activeColor: const Color(0xFF4CAF50),
        controlAffinity: ListTileControlAffinity.trailing,
        onChanged: (value) {
          HapticFeedback.lightImpact();
          setState(() {
            if (isSelected) {
              selectedToppings.remove(topping);
            } else {
              selectedToppings.add(topping);
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
        Row(
          children: [
            Icon(
              Icons.extension_outlined,
              size: 16,
              color: const Color(0xFF4CAF50),
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
        ...addons.map((addon) => _buildAddonItem(addon)),
      ],
    );
  }

  Widget _buildAddonItem(AddonModel addon) {
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
            addon.name!,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 6),
          ...addon.options!.map((option) => _buildAddonOption(addon, option)),
        ],
      ),
    );
  }

  Widget _buildAddonOption(AddonModel addon, AddonOptionModel option) {
    final selectedAddon = selectedAddons.firstWhere(
      (a) => a.id == addon.id,
      orElse: () => AddonModel(id: '', name: '', type: '', options: []),
    );
    final isSelected = selectedAddon.options?.contains(option) ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 2),
      decoration: BoxDecoration(
        color:
            isSelected
                ? const Color(0xFF4CAF50).withOpacity(0.1)
                : Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isSelected ? const Color(0xFF4CAF50) : Colors.grey[200]!,
          width: isSelected ? 1.5 : 1,
        ),
      ),
      child: RadioListTile<AddonOptionModel>(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
        dense: true,
        title: Text(
          option.label!,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        ),
        value: option,
        groupValue: selectedAddon.options?.firstOrNull,
        activeColor: const Color(0xFF4CAF50),
        onChanged: (value) {
          if (value != null) {
            HapticFeedback.lightImpact();
            setState(() {
              final index = selectedAddons.indexWhere((a) => a.id == addon.id);
              if (index != -1) {
                selectedAddons[index] = addon.copyWith(options: [value]);
              } else {
                selectedAddons.add(addon.copyWith(options: [value]));
              }
            });
          }
        },
      ),
    );
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
              onPressed: () {
                HapticFeedback.lightImpact();
                final editedOrderItem = OrderItemModel(
                  menuItem: widget.orderItem.menuItem,
                  quantity: quantity,
                  selectedToppings: selectedToppings,
                  selectedAddons: selectedAddons,
                  notes: note.isEmpty ? null : note,
                );
                widget.onAddOrder(editedOrderItem);
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
                'Tambahkan',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ),
          ),
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
              // ElevatedButton(
              //   onPressed: () {
              //     HapticFeedback.lightImpact();
              //     widget.onDeleteOrderItem?.call();
              //     Navigator.of(context).pop();
              //     widget.onClose();
              //   },
              //   style: ElevatedButton.styleFrom(
              //     backgroundColor: Colors.red[600],
              //     foregroundColor: Colors.white,
              //     shape: RoundedRectangleBorder(
              //       borderRadius: BorderRadius.circular(6),
              //     ),
              //   ),
              //   child: const Text(
              //     'Hapus',
              //     style: TextStyle(fontWeight: FontWeight.w600),
              //   ),
              // ),
            ],
          ),
    );
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
