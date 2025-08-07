import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/enums/order_type.dart';
// import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/reservation_order_detail_provider.dart';
// import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
// import 'package:kasirbaraja/providers/tax_and_service_provider.dart';
// import 'package:kasirbaraja/screens/orders/order_details/dialog_order_type.dart';
import 'package:kasirbaraja/widgets/buttons/vertical_icon_text_button.dart';
// import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/widgets/dialogs/edit_order_item_dialog.dart';

class ReservationOrderDetailScreen extends ConsumerWidget {
  const ReservationOrderDetailScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // final currentWidgetIndex = ref.watch(currentWidgetIndexProvider);
    String onNull = 'Pilih detail pesanan';
    // int subTotalPrices = 0;
    // OrderDetailModel? orderDetail;
    // final tax = ref.watch(taxProvider);
    // final savedPrinter = ref.read(savedPrintersProvider.notifier);

    final reservationOrderDetail = ref.watch(reservationOrderDetailProvider);

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
                // nomor meja,
                VerticalIconTextButton(
                  icon: Icons.table_restaurant_rounded,
                  label:
                      reservationOrderDetail?.tableNumber != "" &&
                              reservationOrderDetail?.tableNumber != null
                          ? 'Meja ${reservationOrderDetail?.tableNumber}'
                          : 'Meja',
                  onPressed: () {
                    if (reservationOrderDetail?.orderType ==
                        OrderType.takeAway) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Tidak bisa mengubah nomor meja pada pesanan Take Away',
                          ),
                        ),
                      );
                      return;
                    }

                    //initialize order detail
                    if (reservationOrderDetail == null) {
                      ref
                          .read(reservationOrderDetailProvider.notifier)
                          .initializeOrder(orderType: OrderType.dineIn);
                    }
                    // open dialog untuk submit nomor meja
                    showDialog(
                      context: context,
                      builder: (context) {
                        //controller untuk text field
                        final TextEditingController controller =
                            TextEditingController(
                              text: reservationOrderDetail?.tableNumber ?? '',
                            );
                        return SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.all(16),
                          child: AlertDialog(
                            title: const Text('Masukkan Nomor Meja'),
                            content: TextField(
                              autofocus: true,
                              decoration: const InputDecoration(
                                hintText: 'Nomor Meja',
                              ),
                              controller: controller,
                              onChanged: (value) {
                                final cursorPosition =
                                    controller.selection.base.offset;
                                controller.value = TextEditingValue(
                                  text: value.toUpperCase(),
                                  selection: TextSelection.collapsed(
                                    offset: cursorPosition,
                                  ),
                                );
                              },
                            ),
                            actions: [
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                },
                                child: const Text('Batal'),
                              ),
                              TextButton(
                                onPressed: () {
                                  //update customer name
                                  ref
                                      .read(
                                        reservationOrderDetailProvider.notifier,
                                      )
                                      .updateCustomerDetails(
                                        tableNumber: controller.text,
                                      );
                                  Navigator.pop(context);
                                },
                                child: const Text('Simpan'),
                              ),
                            ],
                          ),
                        );
                      },
                    );
                  },
                  color:
                      reservationOrderDetail?.tableNumber != "" &&
                              reservationOrderDetail?.tableNumber != null
                          ? Colors.green
                          : Colors.grey,
                ),
                //order type dine-in, take away, delivery,
                VerticalIconTextButton(
                  icon: Icons.restaurant_menu_rounded,
                  label: OrderTypeExtension.orderTypeToJson(
                    reservationOrderDetail?.orderType ?? OrderType.dineIn,
                  ),
                  onPressed: () {},
                  color:
                      reservationOrderDetail != null
                          ? Colors.green
                          : Colors.grey,
                ),
                // nama pelanggan,
                VerticalIconTextButton(
                  icon: Icons.person_rounded,
                  label:
                      (reservationOrderDetail?.user != "" &&
                              reservationOrderDetail?.user != null)
                          ? (reservationOrderDetail!.user)
                          : 'Pelanggan',
                  color:
                      reservationOrderDetail?.user != "" &&
                              reservationOrderDetail?.user != null
                          ? Colors.green
                          : Colors.grey,
                  onPressed: () {
                    //initialize order detail
                    ref
                        .read(reservationOrderDetailProvider.notifier)
                        .initializeOrder(orderType: OrderType.dineIn);
                    // input nama pelanggan
                    showDialog(
                      context: context,
                      builder: (context) {
                        //controller untuk text field
                        final TextEditingController controller =
                            TextEditingController(
                              text: reservationOrderDetail?.user ?? '',
                            );
                        return SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.all(16),
                          child: AlertDialog(
                            title: const Text('Masukkan Nama Pelanggan'),
                            content: TextField(
                              autofocus: true,
                              decoration: const InputDecoration(
                                hintText: 'Nama Pelanggan',
                              ),
                              controller: controller,
                            ),
                            actions: [
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                },
                                child: const Text('Tutup'),
                              ),
                              TextButton(
                                onPressed: () {
                                  //update customer name
                                  ref
                                      .read(
                                        reservationOrderDetailProvider.notifier,
                                      )
                                      .updateCustomerDetails(
                                        customerName: controller.text,
                                      );
                                  Navigator.pop(context);
                                },
                                child: const Text('Simpan'),
                              ),
                            ],
                          ),
                        );
                      },
                    );
                  },
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
                  reservationOrderDetail == null ||
                          reservationOrderDetail.items.isEmpty
                      ? Center(child: Text(onNull, textAlign: TextAlign.center))
                      : ListView.builder(
                        itemCount: reservationOrderDetail.items.length,
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
                          final orderItem = reservationOrderDetail.items[index];
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
                                              reservationOrderDetailProvider
                                                  .notifier,
                                            )
                                            .editOrderItem(
                                              orderItem,
                                              editedOrderItem,
                                            );
                                      },
                                      onClose: () => Navigator.pop(context),
                                      onDeleteOrderItem: () {
                                        ref
                                            .read(
                                              reservationOrderDetailProvider
                                                  .notifier,
                                            )
                                            .removeItem(orderItem);
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
          reservationOrderDetail == null || reservationOrderDetail.items.isEmpty
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
                        reservationOrderDetail.totalAfterDiscount.toInt(),
                      ),
                    ),
                    // Tax (assuming 10%)
                    _OrderSummaryRow(
                      label: 'Tax 10%',
                      value: formatRupiah(
                        reservationOrderDetail.totalTax.toInt().round(),
                      ),
                    ),
                    const Divider(),
                    // Total Harga
                    _OrderSummaryRow(
                      label: 'Total Harga',
                      value: formatRupiah(
                        reservationOrderDetail.grandTotal.toInt().round(),
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
