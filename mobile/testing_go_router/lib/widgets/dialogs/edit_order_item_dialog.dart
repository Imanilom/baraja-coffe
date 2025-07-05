import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/addon_option.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

class EditOrderItemDialog extends StatefulWidget {
  final OrderItemModel orderItem;
  final Function(OrderItemModel) onEditOrder;
  final Function() onClose;
  final Function()? onDeleteOrderItem;

  const EditOrderItemDialog({
    super.key,
    required this.orderItem,
    required this.onEditOrder,
    required this.onClose,
    this.onDeleteOrderItem,
  });

  @override
  EditOrderItemDialogState createState() => EditOrderItemDialogState();
}

class EditOrderItemDialogState extends State<EditOrderItemDialog> {
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
    note = widget.orderItem.note ?? '';
  }

  @override
  Widget build(BuildContext context) {
    final menuItem = widget.orderItem.menuItem;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header dengan drag handle
              _buildHeader(),
              const SizedBox(height: 24),

              // Menu item info
              _buildMenuItemInfo(menuItem),
              const SizedBox(height: 24),

              // Quantity section
              _buildQuantitySection(),
              const SizedBox(height: 24),

              // Notes section
              _buildNotesSection(),
              const SizedBox(height: 24),

              // Toppings section
              if (menuItem.toppings!.isNotEmpty) ...[
                _buildToppingsSection(menuItem.toppings!),
                const SizedBox(height: 24),
              ],

              // Addons section
              if (menuItem.addons!.isNotEmpty) ...[
                _buildAddonsSection(menuItem.addons!),
                const SizedBox(height: 24),
              ],

              // Action buttons
              _buildActionButtons(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF4CAF50).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.edit, color: Color(0xFF4CAF50), size: 20),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Edit Order Item',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1A1A),
                ),
              ),
            ),
            _buildDeleteButton(),
          ],
        ),
      ],
    );
  }

  Widget _buildDeleteButton() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: IconButton(
        icon: const Icon(Icons.delete_outline),
        color: Colors.red[600],
        onPressed: () => _showDeleteConfirmation(),
      ),
    );
  }

  Widget _buildMenuItemInfo(dynamic menuItem) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFF4CAF50).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.restaurant_menu,
              color: Color(0xFF4CAF50),
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  menuItem.name!,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  formatRupiah(menuItem.displayPrice()),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuantitySection() {
    return _buildSection(
      title: 'Jumlah',
      icon: Icons.shopping_cart_outlined,
      child: Row(
        children: [
          _buildQuantityButton(
            icon: Icons.remove,
            onPressed: quantity > 1 ? () => setState(() => quantity--) : null,
          ),
          Container(
            width: 60,
            height: 40,
            alignment: Alignment.center,
            child: Text(
              '$quantity',
              style: const TextStyle(
                fontSize: 18,
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
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    required VoidCallback? onPressed,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: onPressed != null ? const Color(0xFF4CAF50) : Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: IconButton(
        icon: Icon(icon),
        color: onPressed != null ? Colors.white : Colors.grey[400],
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
    return _buildSection(
      title: 'Catatan',
      icon: Icons.note_outlined,
      child: InkWell(
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
              Expanded(
                child: Text(
                  note.isEmpty ? 'Tambahkan catatan...' : note,
                  style: TextStyle(
                    fontSize: 14,
                    color: note.isEmpty ? Colors.grey[500] : Colors.grey[800],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Icon(Icons.edit_outlined, size: 16, color: Colors.grey[600]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildToppingsSection(List<ToppingModel> toppings) {
    return _buildSection(
      title: 'Topping',
      icon: Icons.add_circle_outline,
      child: Column(
        children:
            toppings.map((topping) => _buildToppingItem(topping)).toList(),
      ),
    );
  }

  Widget _buildToppingItem(ToppingModel topping) {
    final isSelected = selectedToppings.contains(topping);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color:
            isSelected
                ? const Color(0xFF4CAF50).withOpacity(0.1)
                : Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isSelected ? const Color(0xFF4CAF50) : Colors.grey[200]!,
        ),
      ),
      child: CheckboxListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        title: Text(
          topping.name!,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
        subtitle: Text(
          formatRupiah(topping.price!),
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
        value: isSelected,
        activeColor: const Color(0xFF4CAF50),
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
    return _buildSection(
      title: 'Addon',
      icon: Icons.extension_outlined,
      child: Column(
        children: addons.map((addon) => _buildAddonItem(addon)).toList(),
      ),
    );
  }

  Widget _buildAddonItem(AddonModel addon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            addon.name!,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 12),
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
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color:
            isSelected
                ? const Color(0xFF4CAF50).withOpacity(0.1)
                : Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isSelected ? const Color(0xFF4CAF50) : Colors.grey[200]!,
        ),
      ),
      child: RadioListTile<AddonOptionModel>(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        title: Text(
          option.label!,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
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

  Widget _buildSection({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: const Color(0xFF4CAF50)),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1A1A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        child,
      ],
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: widget.onClose,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              side: const BorderSide(color: Color(0xFF4CAF50)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Batal',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF4CAF50),
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: ElevatedButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              final editedOrderItem = OrderItemModel(
                menuItem: widget.orderItem.menuItem,
                quantity: quantity,
                selectedToppings: selectedToppings,
                selectedAddons: selectedAddons,
                note: note.isEmpty ? null : note,
              );
              widget.onEditOrder(editedOrderItem);
              widget.onClose();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4CAF50),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 2,
            ),
            child: const Text(
              'Simpan',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ],
    );
  }

  void _showDeleteConfirmation() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.delete_outline,
                    color: Colors.red[600],
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Hapus Item',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            content: const Text(
              'Apakah Anda yakin ingin menghapus item ini dari pesanan?',
              style: TextStyle(fontSize: 14),
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
                    borderRadius: BorderRadius.circular(8),
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

  void _showNoteDialog() {
    final controller = TextEditingController(text: note);
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Row(
              children: [
                Icon(Icons.note_outlined, color: Color(0xFF4CAF50)),
                SizedBox(width: 12),
                Text(
                  'Catatan Pesanan',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            content: TextField(
              controller: controller,
              autofocus: true,
              maxLines: 3,
              maxLength: 200,
              decoration: InputDecoration(
                hintText: 'Masukkan catatan khusus...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
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
                    borderRadius: BorderRadius.circular(8),
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
