import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/custom_amount_items.model.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/enums/order_type.dart';

class AddCustomAmountDialog extends ConsumerStatefulWidget {
  final Function(CustomAmountItemsModel) onAddCustomAmount;
  final VoidCallback onClose;
  final OrderType? orderType;

  const AddCustomAmountDialog({
    super.key,
    required this.onAddCustomAmount,
    required this.onClose,
    this.orderType,
  });

  @override
  ConsumerState<AddCustomAmountDialog> createState() =>
      AddCustomAmountDialogState();
}

class AddCustomAmountDialogState extends ConsumerState<AddCustomAmountDialog> {
  late String name;
  late String description;
  late int amount;
  late OrderType selectedOrderType;

  // final _nameController = TextEditingController();
  // final _amountController = TextEditingController();

  @override
  void initState() {
    super.initState();
    name = 'Custom Amount';
    description = '';
    amount = 0;
    selectedOrderType = widget.orderType ?? OrderType.dineIn;
  }

  // @override
  // void dispose() {
  //   // _nameController.dispose();
  //   _amountController.dispose(); // hanya amount yang dipakai
  //   super.dispose(); // dispose controllers
  // }

  @override
  Widget build(BuildContext context) {
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
                  _buildTopSection(),
                  const SizedBox(height: 16),
                  _descriptionAndTypeSection(),
                  const SizedBox(height: 16),
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
                  color: const Color(0xFF4CAF50).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.add_circle_outline,
                  color: Color(0xFF4CAF50),
                  size: 16,
                ),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Add Custom Amount',
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
  Widget _buildTopSection() {
    return Row(
      spacing: 16,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: _buildNameSection()),
        Expanded(child: _buildAmountSection()),
      ],
    );
  }

  Widget _buildNameSection() {
    return _SectionCard(
      padding: const EdgeInsets.all(8),
      margin: const EdgeInsets.only(right: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 8,
        children: [
          Row(
            children: [
              const Icon(
                Icons.label_outline,
                size: 16,
                color: Color(0xFF4CAF50),
              ),
              const SizedBox(width: 4),
              Text(
                'Nama Item',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
            ],
          ),
          InkWell(
            onTap: () => _showNameInputDialog(),
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
                      name.isEmpty ? 'Masukkan nama...' : name,
                      style: TextStyle(
                        fontSize: 13,
                        color:
                            name.isEmpty ? Colors.grey[500] : Colors.grey[800],
                        fontWeight:
                            name.isEmpty ? FontWeight.normal : FontWeight.w600,
                      ),
                      maxLines: 2,
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

  Widget _buildAmountSection() {
    return _SectionCard(
      margin: const EdgeInsets.only(left: 8),
      padding: const EdgeInsets.all(12),
      child: Column(
        spacing: 8,
        children: [
          Row(
            children: [
              const Icon(
                Icons.attach_money,
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
          InkWell(
            onTap: () => _showAmountInputDialog(),
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Expanded(
                    child: Text(
                      amount > 0 ? formatRupiah(amount) : 'Rp 0',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color:
                            amount > 0
                                ? const Color(0xFF1A1A1A)
                                : Colors.grey[500],
                      ),
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

  // ---------- Description Section ----------
  Widget _buildDescriptionSection() {
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
                Icons.description_outlined,
                size: 16,
                color: const Color(0xFF4CAF50),
              ),
              const SizedBox(width: 6),
              Text(
                'Deskripsi',
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
            onTap: () => _showDescriptionDialog(),
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
                      description.isEmpty
                          ? 'Tambahkan deskripsi...'
                          : description,
                      style: TextStyle(
                        fontSize: 13,
                        color:
                            description.isEmpty
                                ? Colors.grey[500]
                                : Colors.grey[800],
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
              selected: {selectedOrderType},
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

  Widget _descriptionAndTypeSection() {
    return Row(
      spacing: 16,
      children: [
        Expanded(child: _buildDescriptionSection()),
        Expanded(child: _buildOrderTypeSelector()),
      ],
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
    // Validasi input
    if (name.trim().isEmpty) {
      _showErrorSnackBar('Nama item tidak boleh kosong');
      return;
    }

    if (amount <= 0) {
      _showErrorSnackBar('Jumlah harus lebih dari 0');
      return;
    }

    HapticFeedback.lightImpact();

    final customAmountItem = CustomAmountItemsModel(
      name: name.trim(),
      description: description.trim().isEmpty ? null : description.trim(),
      amount: amount,
      orderType: selectedOrderType,
    );

    print('CustomAmountItem: $customAmountItem');

    widget.onAddCustomAmount(customAmountItem);
    widget.onClose();
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red[400],
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  // ---------- Dialogs ----------
  void _showNameInputDialog() {
    final controller = TextEditingController(text: name);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          title: const Row(
            children: [
              Icon(Icons.label_outline, color: Color(0xFF4CAF50), size: 20),
              SizedBox(width: 8),
              Text(
                'Nama Item',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          content: TextField(
            controller: controller,
            autofocus: true,
            maxLength: 100,
            decoration: InputDecoration(
              hintText: 'Masukkan nama item...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              focusedBorder: const OutlineInputBorder(
                borderSide: BorderSide(color: Color(0xFF4CAF50)),
              ),
            ),
            onSubmitted: (_) => Navigator.of(context).pop('submit'),
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
      if (result == 'submit') {
        HapticFeedback.lightImpact();
        setState(() => name = controller.text.trim());
      }
    });
  }

  void _showAmountInputDialog() {
    final controller = TextEditingController(
      text: amount > 0 ? amount.toString() : '',
    );

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          title: const Row(
            children: [
              Icon(Icons.attach_money, color: Color(0xFF4CAF50), size: 20),
              SizedBox(width: 8),
              Text(
                'Jumlah',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          content: TextField(
            controller: controller,
            autofocus: true,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: InputDecoration(
              hintText: 'Masukkan jumlah...',
              prefixText: 'Rp ',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              focusedBorder: const OutlineInputBorder(
                borderSide: BorderSide(color: Color(0xFF4CAF50)),
              ),
            ),
            onSubmitted: (_) => Navigator.of(context).pop('submit'),
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
      if (result == 'submit') {
        final parsed = int.tryParse(controller.text.trim()) ?? 0;
        HapticFeedback.lightImpact();
        setState(() => amount = parsed);
      }
    });

    // auto-select semua biar cepat ganti
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.selection = TextSelection(
        baseOffset: 0,
        extentOffset: controller.text.length,
      );
    });
  }

  void _showDescriptionDialog() {
    final controller = TextEditingController(text: description);
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            title: const Row(
              children: [
                Icon(
                  Icons.description_outlined,
                  color: Color(0xFF4CAF50),
                  size: 20,
                ),
                SizedBox(width: 8),
                Text(
                  'Deskripsi',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            content: TextField(
              controller: controller,
              autofocus: true,
              maxLines: 3,
              maxLength: 200,
              decoration: InputDecoration(
                hintText: 'Masukkan deskripsi...',
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
                  setState(() => description = controller.text.trim());
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
