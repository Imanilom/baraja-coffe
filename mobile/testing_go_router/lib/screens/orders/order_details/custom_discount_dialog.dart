import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Simplified compact dialog untuk input custom discount
/// Design optimized untuk landscape tablet tanpa overflow
class CustomDiscountDialog extends StatefulWidget {
  final String title;
  final int itemSubtotal;
  final Function(String discountType, int discountValue, String reason) onApply;

  const CustomDiscountDialog({
    super.key,
    required this.title,
    required this.itemSubtotal,
    required this.onApply,
    this.initialDiscountType,
    this.initialDiscountValue,
    this.initialReason,
  });

  final String? initialDiscountType;
  final int? initialDiscountValue;
  final String? initialReason;

  @override
  State<CustomDiscountDialog> createState() => _CustomDiscountDialogState();
}

class _CustomDiscountDialogState extends State<CustomDiscountDialog> {
  late String _discountType;
  late TextEditingController _valueController;
  String? _valueError;

  @override
  void initState() {
    super.initState();
    _discountType = widget.initialDiscountType ?? 'percentage';
    _valueController = TextEditingController(
      text: widget.initialDiscountValue?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _valueController.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() => _valueError = null);

    final value = int.tryParse(_valueController.text);
    bool isValid = true;

    if (value == null || value <= 0) {
      setState(() => _valueError = 'Nilai harus > 0');
      isValid = false;
    } else if (_discountType == 'percentage' && value > 100) {
      setState(() => _valueError = 'Max 100%');
      isValid = false;
    } else if (_discountType == 'fixed' && value > widget.itemSubtotal) {
      setState(() => _valueError = 'Melebihi harga');
      isValid = false;
    }

    return isValid;
  }

  void _handleApply() {
    if (!_validate()) return;

    final value = int.parse(_valueController.text);
    widget.onApply(_discountType, value, ''); // Reason = empty
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: 380,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Title with close button
            Row(
              children: [
                Expanded(
                  child: Text(
                    widget.title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close, size: 20),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Input with inline type selector
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Input field
                Expanded(
                  child: TextField(
                    controller: _valueController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    autofocus: true,
                    style: const TextStyle(fontSize: 16),
                    decoration: InputDecoration(
                      labelText: 'Nilai Diskon',
                      errorText: _valueError,
                      border: const OutlineInputBorder(),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                    ),
                    onChanged: (_) => setState(() => _valueError = null),
                    onSubmitted: (_) => _handleApply(),
                  ),
                ),
                const SizedBox(width: 12),

                // Type selector buttons (vertical)
                Column(
                  children: [
                    // Percentage button
                    _TypeButton(
                      label: '%',
                      isSelected: _discountType == 'percentage',
                      onTap: () => setState(() => _discountType = 'percentage'),
                    ),
                    const SizedBox(height: 8),
                    // Fixed amount button
                    _TypeButton(
                      label: 'Rp',
                      isSelected: _discountType == 'fixed',
                      onTap: () => setState(() => _discountType = 'fixed'),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
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
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Terapkan'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Compact type selector button
class _TypeButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _TypeButton({
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
        width: 54,
        height: 54,
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? Colors.blue.shade700 : Colors.grey.shade300,
            width: 2,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isSelected ? Colors.white : Colors.black87,
            ),
          ),
        ),
      ),
    );
  }
}
