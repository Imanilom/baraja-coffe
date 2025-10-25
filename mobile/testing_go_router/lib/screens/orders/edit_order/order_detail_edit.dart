import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/reservation_order_detail_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/widgets/dialogs/edit_order_item_dialog.dart';

class OrderDetailEdit extends ConsumerWidget {
  const OrderDetailEdit({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    String onNull = 'Pilih detail pesanan';
    final onlineOrderEditDetail = ref.watch(onlineOrderEditorProvider);

    return Padding(
      padding: const EdgeInsets.only(right: 8, left: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                TextButton.icon(
                  onPressed: () {},
                  label:
                      onlineOrderEditDetail.order != null
                          ? Text(
                            'Order id: ${onlineOrderEditDetail.order!.orderId}',
                          )
                          : const Text('No Order Selected'),
                  icon: const Icon(Icons.receipt_long),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.only(right: 4),
              child:
                  onlineOrderEditDetail.order == null ||
                          onlineOrderEditDetail.order!.items.isEmpty
                      ? Center(child: Text(onNull, textAlign: TextAlign.center))
                      : ListView.builder(
                        itemCount: onlineOrderEditDetail.order!.items.length,
                        // urutan terbalik
                        // reverse: true,
                        physics: const BouncingScrollPhysics(),
                        //selalu scroll ke atas,
                        // controller: ScrollController(),
                        controller: ScrollController(
                          initialScrollOffset: 0,
                          keepScrollOffset: true,
                          debugLabel: 'ScrollController',
                          onAttach:
                              (position) => debugPrint(
                                'ScrollController attached to $position',
                              ),
                        ),

                        itemBuilder: (context, index) {
                          final orderItem =
                              onlineOrderEditDetail.order!.items[index];
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
                            title: Text(orderItem.menuItem.name.toString()),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'workstation: ${orderItem.menuItem.workstation}',
                                ),
                                if (orderItem.selectedToppings.isNotEmpty)
                                  Text(
                                    'Topping: ${orderItem.selectedToppings.map((t) => t.name).join(', ')}',
                                  ),
                                if (orderItem.selectedAddons.isNotEmpty)
                                  //mengambil nama addons dan lable pada opsions
                                  if (orderItem
                                      .selectedAddons
                                      .first
                                      .options!
                                      .isNotEmpty)
                                    Text(
                                      'Addons: ${orderItem.selectedAddons.map((a) => a.options!.map((o) => o.label).join(', ')).join(', ')}',
                                    ),
                                if (orderItem.notes != null &&
                                    orderItem.notes!.isNotEmpty)
                                  Text(
                                    'Catatan: ${orderItem.notes!}',
                                    style: const TextStyle(
                                      fontStyle: FontStyle.italic,
                                      color: Colors.grey,
                                    ),
                                  ),
                              ],
                            ),
                            trailing: Text(formatRupiah(orderItem.subtotal)),
                            onTap: () {
                              //membuka drawer untuk edit order item
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder:
                                    (context) => EditOrderItemDialog(
                                      orderItem: orderItem,
                                      onEditOrder: (editedOrderItem) {
                                        ref
                                            .read(
                                              onlineOrderEditorProvider
                                                  .notifier,
                                            )
                                            .editOrderItem(
                                              orderItem,
                                              editedOrderItem,
                                            );
                                      },
                                      onClose: () => Navigator.pop(context),
                                      onDeleteOrderItem: () {
                                        // ref
                                        //     .read(
                                        //       onlineOrderEditorProvider
                                        //           .notifier,
                                        //     )
                                        //     .removeItem(orderItem);
                                      },
                                    ),
                              );
                            },
                          );
                        },
                      ),
            ),
          ),
          const SizedBox(height: 4),
          onlineOrderEditDetail.order == null ||
                  onlineOrderEditDetail.order!.items.isEmpty
              ? const SizedBox.shrink()
              : Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(
                  vertical: 12,
                  horizontal: 16,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Subtotal
                    _OrderSummaryRow(
                      label: 'Subtotal',
                      value: formatRupiah(
                        onlineOrderEditDetail.order!.totalAfterDiscount.toInt(),
                      ),
                    ),
                    // Tax (assuming 10%)
                    _OrderSummaryRow(
                      label: 'Tax 10%',
                      value: formatRupiah(
                        onlineOrderEditDetail.order!.totalTax.toInt().round(),
                      ),
                    ),
                    const Divider(),
                    // Total Harga
                    _OrderSummaryRow(
                      label: 'Total Harga',
                      value: formatRupiah(
                        onlineOrderEditDetail.order!.grandTotal.toInt().round(),
                      ),
                      isBold: true,
                    ),
                    const SizedBox(height: 8),
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
