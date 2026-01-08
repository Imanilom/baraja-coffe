import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_editor_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/providers/orders/pending_order_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/pending_order_detail_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/widgets/dialogs/edit_order_item_dialog.dart';

class OrderDetailEdit extends ConsumerWidget {
  const OrderDetailEdit({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const onNull = 'Pilih Pesanan';
    final editState = ref.watch(orderEditorProvider);
    final notifier = ref.read(orderEditorProvider.notifier);

    final order = editState.order;
    final items = order?.items ?? const [];

    final hasChanges = notifier.hasItemChanges; // <- ini kuncinya
    final isSubmitting = editState.isSubmitting;

    return Padding(
      padding: const EdgeInsets.only(right: 8, left: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // header
          Container(
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.receipt_long),
                  label: Text(
                    order?.orderId?.isNotEmpty == true
                        ? 'Order ID: ${order!.orderId}'
                        : 'No Order Selected',
                  ),
                ),
                if ((editState.reason ?? '').isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: Text(
                      'Alasan: ${editState.reason}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 4),

          // daftar item
          Expanded(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.only(right: 4),
              child:
                  items.isEmpty
                      ? const Center(
                        child: Text(onNull, textAlign: TextAlign.center),
                      )
                      : ListView.builder(
                        itemCount: items.length,
                        physics: const BouncingScrollPhysics(),
                        itemBuilder: (context, index) {
                          final orderItem = items[index];
                          final isLocked =
                              orderItem.orderItemid != null &&
                              orderItem.orderItemid!.isNotEmpty;
                          return ListTile(
                            horizontalTitleGap: 4,
                            visualDensity: const VisualDensity(
                              vertical: -4,
                              horizontal: 0,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: 0,
                              horizontal: 4,
                            ),
                            dense: true,
                            leading: CircleAvatar(
                              child: Text(orderItem.quantity.toString()),
                            ),
                            title: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    orderItem.menuItem.name ?? '-',
                                    style: TextStyle(
                                      color:
                                          isLocked ? Colors.grey : Colors.black,
                                    ),
                                  ),
                                ),
                                if (isLocked)
                                  const Icon(
                                    Icons.lock,
                                    size: 16,
                                    color: Colors.grey,
                                  ),
                              ],
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'workstation: ${orderItem.menuItem.workstation ?? '-'}',
                                  style: TextStyle(
                                    color: isLocked ? Colors.grey : null,
                                  ),
                                ),
                                if (orderItem.selectedToppings.isNotEmpty)
                                  Text(
                                    'Topping: ${orderItem.selectedToppings.map((t) => t.name).join(', ')}',
                                    style: TextStyle(
                                      color: isLocked ? Colors.grey : null,
                                    ),
                                  ),
                                if (orderItem.selectedAddons.isNotEmpty)
                                  if (orderItem.selectedAddons.first.options !=
                                          null &&
                                      orderItem
                                          .selectedAddons
                                          .first
                                          .options!
                                          .isNotEmpty)
                                    Text(
                                      'Addons: ${orderItem.selectedAddons.map((a) => a.options!.map((o) => o.label).join(', ')).join(', ')}',
                                      style: TextStyle(
                                        color: isLocked ? Colors.grey : null,
                                      ),
                                    ),
                                if ((orderItem.notes ?? '').isNotEmpty)
                                  Text(
                                    'Catatan: ${orderItem.notes}',
                                    style: TextStyle(
                                      fontStyle: FontStyle.italic,
                                      color:
                                          isLocked ? Colors.grey : Colors.grey,
                                    ),
                                  ),
                              ],
                            ),
                            trailing: Text(
                              formatRupiah(orderItem.subtotal),
                              style: TextStyle(
                                color: isLocked ? Colors.grey : null,
                              ),
                            ),
                            onTap:
                                isLocked
                                    ? null
                                    : () {
                                      showModalBottomSheet(
                                        context: context,
                                        isScrollControlled: true,
                                        backgroundColor: Colors.transparent,
                                        builder:
                                            (context) => EditOrderItemDialog(
                                              orderItem: orderItem,
                                              onEditOrder: (editedOrderItem) {
                                                notifier.editOrderItem(
                                                  orderItem,
                                                  editedOrderItem,
                                                );
                                              },
                                              onDeleteOrderItem: () {
                                                notifier.removeItem(orderItem);
                                              },
                                              onClose:
                                                  () => Navigator.pop(context),
                                            ),
                                      );
                                    },
                          );
                        },
                      ),
            ),
          ),

          const SizedBox(height: 4),

          // ringkasan
          if (order != null && items.isNotEmpty)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _OrderSummaryRow(
                    label: 'Subtotal',
                    value: formatRupiah(order.totalAfterDiscount),
                  ),
                  _OrderSummaryRow(
                    label: 'Tax',
                    value: formatRupiah(order.totalTax),
                  ),
                  const Divider(),
                  _OrderSummaryRow(
                    label: 'Total Harga',
                    value: formatRupiah(order.grandTotal),
                    isBold: true,
                  ),
                ],
              ),
            ),

          // tombol update (selalu tampil tapi disable kalau belum ada perubahan)
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed:
                        (!hasChanges || isSubmitting)
                            ? null
                            : () async {
                              final ok = await showDialog<bool>(
                                context: context,
                                barrierDismissible: false,
                                builder:
                                    (ctx) => AlertDialog(
                                      title: const Text('Konfirmasi'),
                                      content: const Text(
                                        'Apakah kamu yakin ingin mengupdate pesanan ini?',
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed:
                                              () => Navigator.pop(ctx, false),
                                          child: const Text('Batal'),
                                        ),
                                        ElevatedButton(
                                          onPressed:
                                              () => Navigator.pop(ctx, true),
                                          child: const Text('Lanjut'),
                                        ),
                                      ],
                                    ),
                              );

                              if (ok != true) return;

                              // jalankan submit
                              final success =
                                  await notifier.submitEditedOrder();

                              if (context.mounted) {
                                if (success) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Order berhasil diupdate'),
                                    ),
                                  );
                                  Navigator.pop(context);

                                  final orderSource = order?.source;

                                  if (orderSource == 'Cashier') {
                                    ref.invalidate(pendingOrderProvider);
                                    ref
                                        .read(
                                          pendingOrderDetailProvider.notifier,
                                        )
                                        .clearPendingOrderDetail();
                                  } else {
                                    ref.invalidate(onlineOrderProvider);
                                    ref
                                        .read(
                                          onlineOrderDetailProvider.notifier,
                                        )
                                        .clearOnlineOrderDetail();
                                  }
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        editState.error ?? 'Gagal update order',
                                      ),
                                    ),
                                  );
                                }
                              }
                            },
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          isSubmitting
                              ? Colors.grey[300]
                              : hasChanges
                              ? Colors.green
                              : Colors.grey[300],
                      foregroundColor:
                          isSubmitting
                              ? Colors.grey[700]
                              : hasChanges
                              ? Colors.white
                              : Colors.grey[700],
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      minimumSize: const Size.fromHeight(40),
                      elevation: 0,
                    ),
                    child: Text(
                      isSubmitting
                          ? 'Process...'
                          : hasChanges
                          ? 'Update'
                          : 'Tidak ada perubahan',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderSummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;

  const _OrderSummaryRow({
    required this.label,
    required this.value,
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    final textStyle =
        isBold
            ? const TextStyle(fontWeight: FontWeight.bold)
            : const TextStyle();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: textStyle),
          Text(value, style: textStyle),
        ],
      ),
    );
  }
}
