import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

class DeleteOrderItemSheet extends ConsumerStatefulWidget {
  final OrderDetailModel order;

  const DeleteOrderItemSheet({super.key, required this.order});

  @override
  ConsumerState<DeleteOrderItemSheet> createState() =>
      DeleteOrderItemSheetState();
}

class DeleteOrderItemSheetState extends ConsumerState<DeleteOrderItemSheet> {
  String? selectedMenuItemId;
  bool submitting = false;

  /// ✅ NEW: Check if order is finalized (Completed, Paid, etc)
  /// Prevents deletion from paid orders
  bool _isOrderFinalizedOrPaid(OrderDetailModel order) {
    final finalStatuses = [
      'Completed',
      'completed', // in case backend has inconsistency
      'Paid',
      'paid',
      'Settled',
      'settled',
      'Closed',
      'closed',
    ];

    final isFinalized = finalStatuses.contains(order.status);
    final hasPaid = order.payments.isNotEmpty;

    // If EITHER status is finalized OR has payments, block deletion
    return isFinalized || hasPaid;
  }

  /// ✅ NEW: Show reason dialog before delete
  Future<String?> _showReasonDialog(BuildContext context) async {
    return showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Alasan Penghapusan Item'),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Pilih alasan untuk menghapus item ini:',
                  style: TextStyle(fontSize: 13, color: Colors.grey),
                ),
                const SizedBox(height: 16),
                ...[
                  ('stock_issue', '📦 Stok Habis / Item Tidak Tersedia'),
                  ('duplicate', '🔄 Duplikasi Pesanan'),
                  ('customer_request', '👤 Permintaan Pelanggan'),
                  ('menu_mistake', '❌ Kesalahan Menu'),
                  ('quality_issue', '⚠️ Masalah Kualitas'),
                  ('other', '📝 Lainnya'),
                ].map((e) => Container(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  child: ListTile(
                    title: Text(e.$2),
                    dense: true,
                    tileColor: Colors.grey[100],
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    onTap: () => Navigator.pop(context, e.$1),
                  ),
                )),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;

    // ✅ NEW: Check if order is paid/completed
    final isPaidOrComplete = _isOrderFinalizedOrPaid(order);

    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      builder: (_, controller) {
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 12,
              ),
            ],
          ),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
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
              const Text(
                'Pilih Item yang Dihapus (Stok Habis)',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: ListView.builder(
                  controller: controller,
                  itemCount: order.items.length,
                  itemBuilder: (_, i) {
                    final it = order.items[i];
                    final id = it.menuItem.id;

                    final subtitle = [
                      if (it.selectedAddons.isNotEmpty)
                        'Options: ${it.selectedAddons.map((a) => a.name).join(', ')}',
                      if (it.selectedToppings.isNotEmpty)
                        'Toppings: ${it.selectedToppings.map((t) => t.name).join(', ')}',
                    ].where((e) => e.isNotEmpty).join(' • ');

                    return Card(
                      elevation: 0,
                      margin: const EdgeInsets.symmetric(vertical: 6),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: RadioListTile<String>(
                        value: id,
                        groupValue: selectedMenuItemId,
                        onChanged:
                            (val) => setState(() => selectedMenuItemId = val),
                        title: Row(
                          children: [
                            Expanded(
                              child: Text(
                                '${it.menuItem.name}  ×${it.quantity}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            Text(
                              formatRupiah(it.subtotal),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        subtitle:
                            subtitle.isEmpty
                                ? null
                                : Padding(
                                  padding: const EdgeInsets.only(top: 4.0),
                                  child: Text(
                                    subtitle,
                                    style: TextStyle(color: Colors.grey[600]),
                                  ),
                                ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed:
                          submitting ? null : () => Navigator.pop(context),
                      child: const Text('Batal'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      icon:
                          submitting
                              ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                              : const Icon(Icons.delete_forever),
                      label: const Text('Hapus'),
                      onPressed:
                          (selectedMenuItemId == null || submitting || isPaidOrComplete)
                              ? null
                              : () async {
                                // ✅ NEW: Check if order is paid/completed
                                if (isPaidOrComplete) {
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          '❌ Tidak bisa menghapus item dari order yang sudah dibayar',
                                        ),
                                        backgroundColor: Colors.red,
                              duration: Duration(seconds: 3),
                                      ),
                                    );
                                  }
                                  return;
                                }

                                // ✅ NEW: Show reason dialog
                                final reason = await _showReasonDialog(context);
                                if (reason == null || !context.mounted) return;

                                setState(() => submitting = true);
                                try {
                                  await ref
                                      .read(onlineOrderProvider.notifier)
                                      .deleteItemFromOrder(
                                        orderId: order.orderId!,
                                        menuItemId: selectedMenuItemId!,
                                        reason: reason, // ✅ Pass reason to backend
                                      );

                                  if (context.mounted) {
                                    Navigator.pop(context);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Item berhasil dihapus dari order',
                                        ),
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          'Gagal menghapus item: $e',
                                        ),
                                      ),
                                    );
                                  }
                                } finally {
                                  if (mounted) {
                                    setState(() => submitting = false);
                                  }
                                }
                              },
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
