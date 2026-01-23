import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

/// Dialog untuk input custom discount dengan validasi
/// Support percentage dan fixed amount dengan preview real-time
class CustomDiscountDialog extends StatefulWidget {
  final String title;
  final int itemSubtotal; // Subtotal untuk kalkulasi preview
  final Function(String discountType, int discountValue, String reason) onApply;

  const CustomDiscountDialog({
    super.key,
    required this.title,
    required this.itemSubtotal,
    required this.onApply,
  });

  @override
  State<CustomDiscountDialog> createState() => _CustomDiscountDialogState();
}

class _CustomDiscountDialogState extends State<CustomDiscountDialog> {
  String _discountType = 'percentage'; // 'percentage' or 'fixed'
  final TextEditingController _valueController = TextEditingController();
  String? _selectedReason;
  final TextEditingController _customReasonController = TextEditingController();

  // Predefined reasons
  static const List<String> _reasons = [
    'Pelanggan Setia',
    'Ulang Tahun',
    'Komplain',
    'Promo Spesial',
    'Barang Rusak',
    'Lainnya...',
  ];

  String? _valueError;
  String? _reasonError;

  @override
  void dispose() {
    _valueController.dispose();
    _customReasonController.dispose();
    super.dispose();
  }

  int _calculateDiscountAmount() {
    final value = int.tryParse(_valueController.text) ?? 0;
    if (value <= 0) return 0;

    if (_discountType == 'percentage') {
      return (widget.itemSubtotal * value / 100).round();
    } else {
      return value;
    }
  }

  bool _validate() {
    setState(() {
      _valueError = null;
      _reasonError = null;
    });

    final value = int.tryParse(_valueController.text);
    bool isValid = true;

    // Validate discount value
    if (value == null || value <= 0) {
      setState(() => _valueError = 'Nilai harus lebih dari 0');
      isValid = false;
    } else if (_discountType == 'percentage' && value > 100) {
      setState(() => _valueError = 'Persentase maksimal 100%');
      isValid = false;
    } else if (_discountType == 'fixed' && value > widget.itemSubtotal) {
      setState(() => _valueError = 'Diskon tidak boleh melebihi harga');
      isValid = false;
    }

    // Validate reason
    final reason =
        _selectedReason == 'Lainnya...'
            ? _customReasonController.text.trim()
            : _selectedReason ?? '';

    if (reason.isEmpty) {
      setState(() => _reasonError = 'Alasan harus diisi');
      isValid = false;
    } else if (reason.length < 5) {
      setState(() => _reasonError = 'Alasan minimal 5 karakter');
      isValid = false;
    }

    return isValid;
  }

  void _handleApply() {
    if (!_validate()) return;

    final value = int.parse(_valueController.text);
    final reason =
        _selectedReason == 'Lainnya...'
            ? _customReasonController.text.trim()
            : _selectedReason!;

    widget.onApply(_discountType, value, reason);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final discountAmount = _calculateDiscountAmount();
    final finalPrice = (widget.itemSubtotal - discountAmount).clamp(
      0,
      widget.itemSubtotal,
    );

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500, maxHeight: 600),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Title
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    widget.title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Discount Type Toggle
              Row(
                children: [
                  Expanded(
                    child: _ToggleButton(
                      label: 'Persentase (%)',
                      isSelected: _discountType == 'percentage',
                      onTap: () => setState(() => _discountType = 'percentage'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _ToggleButton(
                      label: 'Jumlah Tetap (Rp)',
                      isSelected: _discountType == 'fixed',
                      onTap: () => setState(() => _discountType = 'fixed'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Value Input
              TextField(
                controller: _valueController,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(
                  labelText: 'Nilai Diskon',
                  suffixText: _discountType == 'percentage' ? '%' : 'Rp',
                  errorText: _valueError,
                  border: const OutlineInputBorder(),
                ),
                onChanged: (_) => setState(() => _valueError = null),
              ),
              const SizedBox(height: 16),

              // Reason Dropdown
              DropdownButtonFormField<String>(
                value: _selectedReason,
                decoration: InputDecoration(
                  labelText: 'Alasan Diskon',
                  errorText: _reasonError,
                  border: const OutlineInputBorder(),
                ),
                items:
                    _reasons.map((reason) {
                      return DropdownMenuItem(
                        value: reason,
                        child: Text(reason),
                      );
                    }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedReason = value;
                    _reasonError = null;
                  });
                },
              ),

              // Custom Reason Input (if "Lainnya..." selected)
              if (_selectedReason == 'Lainnya...') ...[
                const SizedBox(height: 12),
                TextField(
                  controller: _customReasonController,
                  decoration: const InputDecoration(
                    labelText: 'Masukkan alasan kustom',
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (_) => setState(() => _reasonError = null),
                ),
              ],

              const SizedBox(height: 20),

              // Preview Calculation
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _PreviewRow(
                      label: 'Harga Asli:',
                      value: formatRupiah(widget.itemSubtotal),
                    ),
                    const SizedBox(height: 4),
                    _PreviewRow(
                      label: 'Diskon:',
                      value: '- ${formatRupiah(discountAmount)}',
                      valueColor: Colors.green.shade700,
                    ),
                    const Divider(height: 16),
                    _PreviewRow(
                      label: 'Harga Akhir:',
                      value: formatRupiah(finalPrice),
                      isBold: true,
                      valueSize: 18,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Batal'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _handleApply,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Terapkan Diskon'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Helper Widgets
class _ToggleButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ToggleButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black87,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

class _PreviewRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool isBold;
  final double? valueSize;

  const _PreviewRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.isBold = false,
    this.valueSize,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: valueColor,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            fontSize: valueSize,
          ),
        ),
      ],
    );
  }
}
