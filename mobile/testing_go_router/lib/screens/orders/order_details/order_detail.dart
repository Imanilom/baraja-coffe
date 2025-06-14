import 'package:assorted_layout_widgets/assorted_layout_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/navigation_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/history_detail_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/saved_order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/saved_order_provider.dart';
import 'package:kasirbaraja/providers/payment_provider.dart';
import 'package:kasirbaraja/widgets/buttons/vertical_icon_text_button.dart';
import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/widgets/dialogs/edit_order_item_dialog.dart';

class OrderDetail extends ConsumerWidget {
  const OrderDetail({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentWidgetIndex = ref.watch(currentWidgetIndexProvider);
    String onNull = 'Pilih detail pesanan';
    int subTotalPrices = 0;
    OrderDetailModel? orderDetail;
    // orderDetailNotifier = ref.read(orderDetailProvider.notifier);

    switch (currentWidgetIndex) {
      case 0:
        orderDetail = ref.watch(orderDetailProvider);
        final orderDetailNotifier = ref.read(orderDetailProvider.notifier);
        subTotalPrices = ref.watch(orderDetailProvider.notifier).subTotalPrice;
        onNull = 'Pilih menu untuk memulai pesanan';
        break;
      case 1:
        orderDetail = ref.watch(onlineOrderDetailProvider);
        final orderDetailNotifier = ref.read(
          onlineOrderDetailProvider.notifier,
        );
        subTotalPrices =
            ref.watch(onlineOrderDetailProvider.notifier).subTotalPrice;
        onNull = 'Pilih pesanan untuk konfirmasi';
        break;
      case 2:
        orderDetail = ref.watch(historyDetailProvider);
        final orderDetailNotifier = ref.read(historyDetailProvider.notifier);
        subTotalPrices =
            ref.watch(historyDetailProvider.notifier).subTotalPrice;
        onNull = 'Pilih detail history pesanan';
        break;
      case 3:
        orderDetail = ref.watch(savedOrderDetailProvider);
        final orderDetailNotifier = ref.read(savedOrderDetailProvider.notifier);
        subTotalPrices =
            ref.watch(savedOrderDetailProvider.notifier).subTotalPrice;
        onNull = 'Pilih pesanan tersimpan';
        break;
      default:
    }

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
                // VerticalIconTextButton(
                //   icon: Icons.table_bar,
                //   label: 'Meja 1',
                //   onPressed: () {},
                //   color: Colors.grey,
                // ),
                //order type dine-in, take away, delivery,
                VerticalIconTextButton(
                  icon: Icons.restaurant,
                  label: orderDetail?.orderType ?? 'Dine-In',
                  onPressed: () {
                    if (orderDetail != null) {
                      // open dialog untuk memilih order type menggunakan material
                      showDialog(
                        context: context,
                        builder: (context) {
                          return AlertDialog(
                            scrollable: true,
                            title: const Text('Pilih Tipe Pesanan'),
                            content: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                ListTile(
                                  title: const Text('Dine-In'),
                                  selected: orderDetail?.orderType == 'Dine-In',
                                  selectedColor: Colors.white,
                                  selectedTileColor: Colors.green,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  onTap: () {
                                    ref
                                        .read(orderDetailProvider.notifier)
                                        .updateOrderType('Dine-In');
                                    Navigator.pop(context);
                                  },
                                ),
                                SizedBox(height: 4),
                                ListTile(
                                  title: const Text('Take Away'),
                                  selected:
                                      orderDetail?.orderType == 'Take Away',
                                  selectedColor: Colors.white,
                                  selectedTileColor: Colors.green,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  onTap: () {
                                    ref
                                        .read(orderDetailProvider.notifier)
                                        .updateOrderType('Take Away');
                                    Navigator.pop(context);
                                  },
                                ),
                              ],
                            ),
                            actions: [
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                },
                                child: const Text('Tutup'),
                              ),
                            ],
                          );
                        },
                      );
                    }
                  },
                  color: orderDetail != null ? Colors.green : Colors.grey,
                ),
                // nama pelanggan,
                VerticalIconTextButton(
                  icon: Icons.person,
                  label: orderDetail?.customerName ?? 'Pelanggan',
                  color:
                      orderDetail?.customerName != null
                          ? Colors.green
                          : Colors.grey,
                  onPressed: () {
                    //initialize order detail
                    if (orderDetail == null) {
                      ref
                          .read(orderDetailProvider.notifier)
                          .initializeOrder(orderType: 'Dine-In');
                    }
                    // input nama pelanggan
                    showDialog(
                      context: context,
                      builder: (context) {
                        //controller untuk text field
                        final TextEditingController controller =
                            TextEditingController(
                              text: orderDetail?.customerName,
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
                                      .read(orderDetailProvider.notifier)
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
                //hapus order detail,
                VerticalIconTextButton(
                  icon: Icons.delete,
                  label: 'Clear',
                  color: orderDetail != null ? Colors.redAccent : Colors.grey,
                  onPressed: () {
                    //konfirmasi delete
                    showDialog(
                      context: context,
                      builder: (context) {
                        return AlertDialog(
                          title: const Text('Hapus Pesanan'),
                          content: const Text(
                            'Apakah Anda yakin ingin menghapus pesanan ini?',
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
                                //hapus order detail
                                ref
                                    .read(orderDetailProvider.notifier)
                                    .clearOrder();
                                Navigator.pop(context);
                              },
                              child: const Text('Hapus'),
                            ),
                          ],
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
              child:
                  orderDetail == null || orderDetail.items.isEmpty
                      ? Center(child: Text(onNull, textAlign: TextAlign.center))
                      : ListView.builder(
                        itemCount: orderDetail.items.length,
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
                          final orderItem = orderDetail!.items[index];
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
                              ],
                            ),
                            trailing: Text(
                              formatRupiah(orderItem.calculateSubTotalPrice()),
                            ),
                            onTap: () {
                              if (currentWidgetIndex != 0) return;
                              //membuka drawer untuk edit order item
                              showModalBottomSheet(
                                context: context,
                                builder:
                                    (context) => EditOrderItemDialog(
                                      orderItem: orderItem,
                                      onEditOrder: (editedOrderItem) {
                                        ref
                                            .read(orderDetailProvider.notifier)
                                            .editOrderItem(
                                              orderItem,
                                              editedOrderItem,
                                            );
                                      },
                                      onClose: () => Navigator.pop(context),
                                    ),
                              );
                            },
                          );
                        },
                      ),
            ),
          ),
          const SizedBox(height: 4),
          orderDetail == null || orderDetail.items.isEmpty
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
                      value: formatRupiah(orderDetail.subTotalPrice!.toInt()),
                    ),
                    // Tax (assuming 10%)
                    _OrderSummaryRow(
                      label: 'Tax 10%',
                      value: formatRupiah(orderDetail.tax!.toInt().round()),
                    ),
                    const Divider(),
                    // Total Harga
                    _OrderSummaryRow(
                      label: 'Total Harga',
                      value: formatRupiah(
                        orderDetail.totalPrice!.toInt().round(),
                      ),
                      isBold: true,
                    ),
                    const SizedBox(height: 8),
                    currentWidgetIndex == 3
                        ? ElevatedButton(
                          onPressed: () {
                            // hapus data order detail yang lama
                            ref.read(orderDetailProvider.notifier).clearOrder();
                            // hapus data order detail yang lama
                            ref
                                .read(savedOrderProvider.notifier)
                                .deleteOrderDetail(orderDetail!);
                            ref
                                .read(savedOrderDetailProvider.notifier)
                                .moveToOrderDetail(orderDetail, ref);
                            ref
                                .read(currentWidgetIndexProvider.notifier)
                                .setIndex(0);
                          },
                          child: const Text('Lanjutkan Pesanan'),
                        )
                        : currentWidgetIndex == 2
                        ? SizedBox.shrink()
                        : currentWidgetIndex == 1
                        ? SizedBox.shrink()
                        : Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                onPressed:
                                    orderDetail.items.isEmpty
                                        ? null
                                        : () {
                                          if (orderDetail != null &&
                                              orderDetail.items.isNotEmpty) {
                                            // print('mau disimpan');

                                            if (orderDetail.customerName ==
                                                null) {
                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                const SnackBar(
                                                  duration: Duration(
                                                    seconds: 1,
                                                  ),
                                                  content: Text(
                                                    'Nama pelanggan tidak boleh kosong',
                                                  ),
                                                ),
                                              );
                                              return;
                                            }
                                            ref
                                                .read(
                                                  savedOrderProvider.notifier,
                                                )
                                                .savedOrder(ref);

                                            ref
                                                .read(
                                                  orderDetailProvider.notifier,
                                                )
                                                .clearOrder();
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              const SnackBar(
                                                duration: Duration(seconds: 1),
                                                content: Text(
                                                  'Pesanan berhasil disimpan',
                                                ),
                                              ),
                                            );
                                          }
                                        },
                                child: const Text('Simpan'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton(
                                onPressed:
                                    orderDetail.items.isEmpty
                                        ? null
                                        : () {
                                          if (orderDetail != null &&
                                              orderDetail.items.isNotEmpty) {
                                            // print('mau dibayar');
                                            if (orderDetail.customerName ==
                                                null) {
                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                const SnackBar(
                                                  duration: Duration(
                                                    seconds: 1,
                                                  ),
                                                  content: Text(
                                                    'Nama pelanggan tidak boleh kosong',
                                                  ),
                                                ),
                                              );
                                              return;
                                            }
                                            print('order detail: $orderDetail');
                                            context.push(
                                              '/payment-method',
                                              extra: orderDetail,
                                            );
                                          }
                                        },
                                child: const Text('Bayar'),
                              ),
                            ),
                          ],
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
