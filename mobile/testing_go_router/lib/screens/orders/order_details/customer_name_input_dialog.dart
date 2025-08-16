import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/widgets/buttons/vertical_icon_text_button.dart';

class CustomerNameInputDialog extends ConsumerStatefulWidget {
  final String? initialName;
  final Function(String) onNameSaved;
  final String? title;
  final String? hintText;

  const CustomerNameInputDialog({
    super.key,
    this.initialName,
    required this.onNameSaved,
    this.title,
    this.hintText,
  });

  @override
  ConsumerState<CustomerNameInputDialog> createState() =>
      _CustomerNameInputDialogState();
}

class _CustomerNameInputDialogState
    extends ConsumerState<CustomerNameInputDialog> {
  late TextEditingController _controller;
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialName ?? '');
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleSave() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() {
        _isLoading = true;
      });

      try {
        widget.onNameSaved(_controller.text.trim());
        Navigator.pop(context);
      } catch (e) {
        // Handle error jika diperlukan
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400),
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.person_outline,
                      color: Theme.of(context).primaryColor,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      widget.title ?? 'Masukkan Nama Pelanggan',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Input Field
              TextFormField(
                controller: _controller,
                autofocus: true,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(
                  hintText: widget.hintText ?? 'Masukkan nama pelanggan',
                  prefixIcon: const Icon(Icons.person_outline),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey[300]!),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey[300]!),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                      color: Theme.of(context).primaryColor,
                      width: 2,
                    ),
                  ),
                  errorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Colors.red),
                  ),
                  focusedErrorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Colors.red, width: 2),
                  ),
                  filled: true,
                  fillColor: Colors.grey[50],
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Nama pelanggan tidak boleh kosong';
                  }
                  if (value.trim().length < 2) {
                    return 'Nama pelanggan minimal 2 karakter';
                  }
                  return null;
                },
                onFieldSubmitted: (_) => _handleSave(),
              ),

              const SizedBox(height: 24),

              // Action Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: _isLoading ? null : () => Navigator.pop(context),
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.grey[600],
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                    ),
                    child: const Text('Batal'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _handleSave,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child:
                        _isLoading
                            ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                            : const Text(
                              'Simpan',
                              style: TextStyle(fontWeight: FontWeight.w500),
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

  // Static method untuk menampilkan dialog
  static Future<void> show({
    required BuildContext context,
    String? initialName,
    required Function(String) onNameSaved,
    String? title,
    String? hintText,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: false, // Mencegah dismiss dengan tap di luar
      builder:
          (context) => CustomerNameInputDialog(
            initialName: initialName,
            onNameSaved: onNameSaved,
            title: title,
            hintText: hintText,
          ),
    );
  }
}

// Alternative: Dialog dengan tampilan yang lebih simple
class SimpleCustomerNameDialog extends StatefulWidget {
  final String? initialName;
  final Function(String) onNameSaved;

  const SimpleCustomerNameDialog({
    super.key,
    this.initialName,
    required this.onNameSaved,
  });

  @override
  State<SimpleCustomerNameDialog> createState() =>
      _SimpleCustomerNameDialogState();
}

class _SimpleCustomerNameDialogState extends State<SimpleCustomerNameDialog> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialName ?? '');
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.person_outline, size: 24),
          SizedBox(width: 8),
          Text('Nama Pelanggan'),
        ],
      ),
      content: TextField(
        controller: _controller,
        autofocus: true,
        textCapitalization: TextCapitalization.words,
        decoration: InputDecoration(
          hintText: 'Masukkan nama pelanggan',
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        ),
        onSubmitted: (value) {
          if (value.trim().isNotEmpty) {
            widget.onNameSaved(value.trim());
            Navigator.pop(context);
          }
        },
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Batal'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_controller.text.trim().isNotEmpty) {
              widget.onNameSaved(_controller.text.trim());
              Navigator.pop(context);
            }
          },
          child: const Text('Simpan'),
        ),
      ],
    );
  }

  static Future<void> show({
    required BuildContext context,
    String? initialName,
    required Function(String) onNameSaved,
  }) {
    return showDialog(
      context: context,
      builder:
          (context) => SimpleCustomerNameDialog(
            initialName: initialName,
            onNameSaved: onNameSaved,
          ),
    );
  }
}
