import 'package:assorted_layout_widgets/assorted_layout_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/history_detail_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/saved_order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/providers/orders/saved_order_provider.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/providers/tax_and_service_provider.dart';
import 'package:kasirbaraja/repositories/online_order_repository.dart';
import 'package:kasirbaraja/screens/orders/order_details/dialog_order_type.dart';
import 'package:kasirbaraja/widgets/buttons/vertical_icon_text_button.dart';
import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/widgets/dialogs/edit_order_item_dialog.dart';
import 'package:kasirbaraja/enums/order_type.dart';

class OrderDetail extends ConsumerWidget {
  const OrderDetail({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentWidgetIndex = ref.watch(currentWidgetIndexProvider);
    String onNull = 'Pilih detail pesanan';
    int subTotalPrices = 0;
    OrderDetailModel? orderDetail;
    final tax = ref.watch(taxProvider);
    final OnlineOrderRepository repository = OnlineOrderRepository();
    final savedPrinter = ref.read(savedPrintersProvider.notifier);

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

    void confirmOrder(WidgetRef ref, OrderDetailModel orderDetail) async {
      try {
        await repository.confirmOrder(ref, orderDetail);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Order berhasil dikonfirmasi")),
          );
        }
        // hapus data order detail yang lama
        ref.read(onlineOrderDetailProvider.notifier).clearOnlineOrderDetail();
        ref.invalidate(onlineOrderProvider);
        //melakukan print struk order
        savedPrinter.printToPrinter(orderDetail: orderDetail, printType: 'all');
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Gagal konfirmasi order: ${e.toString()}")),
          );
        }
      }
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
                VerticalIconTextButton(
                  icon: Icons.table_restaurant_rounded,
                  label:
                      orderDetail?.tableNumber != "" &&
                              orderDetail?.tableNumber != null
                          ? 'Meja ${orderDetail?.tableNumber}'
                          : 'Meja',
                  onPressed: () {
                    if (orderDetail?.orderType == OrderType.takeAway) {
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
                    if (orderDetail == null) {
                      ref
                          .read(orderDetailProvider.notifier)
                          .initializeOrder(orderType: OrderType.dineIn);
                    }
                    // open dialog untuk submit nomor meja
                    showDialog(
                      context: context,
                      builder: (context) {
                        //controller untuk text field
                        final TextEditingController controller =
                            TextEditingController(
                              text: orderDetail?.tableNumber ?? '',
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
                              // inputFormatters: [
                              //   // deny spaces,
                              //   FilteringTextInputFormatter.deny(
                              //     RegExp(r'\s'),
                              //     replacementString: '',
                              //   ),
                              //   UpperCaseTextFormatter(),
                              // ],
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
                                      .read(orderDetailProvider.notifier)
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
                      orderDetail?.tableNumber != "" &&
                              orderDetail?.tableNumber != null
                          ? Colors.green
                          : Colors.grey,
                ),
                //order type dine-in, take away, delivery,
                VerticalIconTextButton(
                  icon: Icons.restaurant_menu_rounded,
                  label: OrderTypeExtension.orderTypeToJson(
                    orderDetail?.orderType ?? OrderType.dineIn,
                  ),
                  onPressed: () {
                    if (orderDetail != null) {
                      // open dialog untuk memilih order type menggunakan material
                      showDialog(
                        context: context,
                        builder:
                            (context) => OrderTypeSelectionDialog(
                              currentOrderType: orderDetail!.orderType,
                              onOrderTypeSelected: (selectedOrderType) {
                                ref
                                    .read(orderDetailProvider.notifier)
                                    .updateOrderType(selectedOrderType);
                              },
                              onTakeAwaySelected: () {
                                // jika order type take away, set table number to null
                                ref
                                    .read(orderDetailProvider.notifier)
                                    .updateCustomerDetails(tableNumber: null);
                              },
                            ),
                      );
                    }
                  },
                  color: orderDetail != null ? Colors.green : Colors.grey,
                ),
                // nama pelanggan,
                VerticalIconTextButton(
                  icon: Icons.person_rounded,
                  label:
                      (orderDetail?.user != "" && orderDetail?.user != null)
                          ? (orderDetail!.user)
                          : 'Pelanggan',
                  color:
                      orderDetail?.user != "" && orderDetail?.user != null
                          ? Colors.green
                          : Colors.grey,
                  onPressed: () {
                    //initialize order detail
                    if (orderDetail == null) {
                      ref
                          .read(orderDetailProvider.notifier)
                          .initializeOrder(orderType: OrderType.dineIn);
                    }
                    // input nama pelanggan
                    showDialog(
                      context: context,
                      builder: (context) {
                        //controller untuk text field
                        final TextEditingController controller =
                            TextEditingController(
                              text: orderDetail?.user ?? '',
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
              ],
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.only(right: 4),
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
                                // Text(
                                //   'workstation: ${orderItem.menuItem.workstation}',
                                // ),
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
                              if (currentWidgetIndex != 0) return;
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
                                            .read(orderDetailProvider.notifier)
                                            .editOrderItem(
                                              orderItem,
                                              editedOrderItem,
                                            );
                                      },
                                      onClose: () => Navigator.pop(context),
                                      onDeleteOrderItem: () {
                                        ref
                                            .read(orderDetailProvider.notifier)
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
                      value: formatRupiah(
                        orderDetail.totalAfterDiscount.toInt(),
                      ),
                    ),
                    // Tax (assuming 10%)
                    _OrderSummaryRow(
                      label: 'Tax 10%',
                      value: formatRupiah(orderDetail.totalTax.toInt().round()),
                    ),
                    const Divider(),
                    // Total Harga
                    _OrderSummaryRow(
                      label: 'Total Harga',
                      value: formatRupiah(
                        orderDetail.grandTotal.toInt().round(),
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
                        ? Row(
                          children: [
                            Expanded(
                              child: TextButton(
                                onPressed: () {
                                  ref
                                      .read(historyDetailProvider.notifier)
                                      .clearHistoryDetail();
                                },
                                child: const Text('cancel'),
                              ),
                            ),
                            Expanded(
                              child: TextButton(
                                onPressed: () {
                                  if (orderDetail != null &&
                                      orderDetail.items.isNotEmpty) {
                                    //refund order
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          "Fitur refund belum tersedia",
                                        ),
                                      ),
                                    );
                                  }
                                },
                                style: TextButton.styleFrom(
                                  backgroundColor: Colors.red,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: const Text('Refund'),
                              ),
                            ),
                          ],
                        )
                        : currentWidgetIndex == 1
                        ? Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Status Pembayaran',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  orderDetail.paymentStatus ?? 'Pending',
                                  style: TextStyle(
                                    color:
                                        orderDetail.paymentStatus == 'Paid'
                                            ? Colors.green
                                            : Colors.orangeAccent,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              spacing: 8,
                              children: [
                                TextButton(
                                  onPressed: () {
                                    ref
                                        .read(
                                          onlineOrderDetailProvider.notifier,
                                        )
                                        .clearOnlineOrderDetail();
                                  },
                                  style: TextButton.styleFrom(
                                    backgroundColor: Colors.red[50],
                                    foregroundColor: Colors.red,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  child: Text('Kembali'),
                                ),
                                Expanded(
                                  child: TextButton(
                                    onPressed: () {
                                      print(
                                        'payment status: ${orderDetail!.paymentStatus}',
                                      );
                                      if (orderDetail.items.isNotEmpty &&
                                          orderDetail.paymentStatus
                                                  ?.toLowerCase() !=
                                              'pending') {
                                        //confirm order
                                        print('order dikonfirmasi bohongan');
                                        // context.push(
                                        //   '/payment-method',
                                        //   extra: orderDetail,
                                        // );
                                        // confirmOrder(ref, orderDetail);
                                      } else if (orderDetail.items.isNotEmpty &&
                                          orderDetail.paymentStatus
                                                  ?.toLowerCase() ==
                                              'pending') {
                                        //lanjut ke metode pembayaran
                                        print('lanjut ke metode pembayaran');
                                        print('order detail: $orderDetail');
                                        context.push(
                                          '/payment-method',
                                          extra: orderDetail,
                                        );
                                      } else {
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          const SnackBar(
                                            content: Text(
                                              "Tidak ada item yang dipesan",
                                            ),
                                          ),
                                        );
                                      }
                                    },
                                    style: TextButton.styleFrom(
                                      backgroundColor: Colors.green,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: Text(
                                      orderDetail.paymentStatus
                                                      ?.toLowerCase() ==
                                                  'pending' ||
                                              orderDetail.paymentStatus
                                                      ?.toLowerCase() ==
                                                  'partial'
                                          ? 'Lanjut Bayar'
                                          : 'Konfirmasi',
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        )
                        : orderDetail.items.isNotEmpty
                        ? orderDetail.user == ''
                            ? Row(
                              children: [
                                IconButton(
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
                                                    .read(
                                                      orderDetailProvider
                                                          .notifier,
                                                    )
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
                                  icon: const Icon(Icons.clear_rounded),
                                  color: Colors.redAccent,
                                  style: IconButton.styleFrom(
                                    backgroundColor: Colors.red[50],
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: TextButton(
                                    onPressed: () {
                                      // open dialog untuk input nama pelanggan
                                      showDialog(
                                        context: context,
                                        builder: (context) {
                                          //controller untuk text field
                                          final TextEditingController
                                          controller = TextEditingController(
                                            text: orderDetail?.user ?? '',
                                          );
                                          return SingleChildScrollView(
                                            physics:
                                                const BouncingScrollPhysics(),
                                            padding: const EdgeInsets.all(16),
                                            child: AlertDialog(
                                              title: const Text(
                                                'Masukkan Nama Pelanggan',
                                              ),
                                              content: TextField(
                                                autofocus: true,
                                                decoration:
                                                    const InputDecoration(
                                                      hintText:
                                                          'Nama Pelanggan',
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
                                                          orderDetailProvider
                                                              .notifier,
                                                        )
                                                        .updateCustomerDetails(
                                                          customerName:
                                                              controller.text,
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
                                    //persegi panjang dan outline stroke,
                                    style: TextButton.styleFrom(
                                      foregroundColor: Colors.blue,
                                      backgroundColor: Colors.blue[50],
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: const Text('Isi Nama Pelanggan'),
                                  ),
                                ),
                              ],
                            )
                            : orderDetail.tableNumber == null ||
                                orderDetail.tableNumber == '' &&
                                    orderDetail.orderType != OrderType.takeAway
                            ? Row(
                              children: [
                                IconButton(
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
                                                    .read(
                                                      orderDetailProvider
                                                          .notifier,
                                                    )
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
                                  icon: const Icon(Icons.clear_rounded),
                                  color: Colors.redAccent,
                                  style: IconButton.styleFrom(
                                    backgroundColor: Colors.red[50],
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: TextButton(
                                    onPressed: () {
                                      // open dialog untuk input nomor meja
                                      showDialog(
                                        context: context,
                                        builder: (context) {
                                          //controller untuk text field
                                          final TextEditingController
                                          controller = TextEditingController(
                                            text:
                                                orderDetail?.tableNumber ?? '',
                                          );
                                          return SingleChildScrollView(
                                            physics:
                                                const BouncingScrollPhysics(),
                                            padding: const EdgeInsets.all(16),
                                            child: AlertDialog(
                                              title: const Text(
                                                'Masukkan Nomor Meja',
                                              ),
                                              content: TextField(
                                                autofocus: true,
                                                decoration:
                                                    const InputDecoration(
                                                      hintText: 'Nomor Meja',
                                                    ),
                                                controller: controller,
                                                onChanged: (value) {
                                                  final cursorPosition =
                                                      controller
                                                          .selection
                                                          .base
                                                          .offset;
                                                  controller
                                                      .value = TextEditingValue(
                                                    text: value.toUpperCase(),
                                                    selection:
                                                        TextSelection.collapsed(
                                                          offset:
                                                              cursorPosition,
                                                        ),
                                                  );
                                                },
                                                // inputFormatters: [
                                                //   // deny spaces,
                                                //   FilteringTextInputFormatter.deny(
                                                //     RegExp(r'\s'),
                                                //     replacementString: '',
                                                //   ),
                                                //   UpperCaseTextFormatter(),
                                                // ],
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
                                                          orderDetailProvider
                                                              .notifier,
                                                        )
                                                        .updateCustomerDetails(
                                                          tableNumber:
                                                              controller.text,
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
                                    //persegi panjang dan outline stroke,
                                    style: TextButton.styleFrom(
                                      foregroundColor: Colors.orange,
                                      backgroundColor: Colors.orange[50],
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: const Text('Isi Nomor Meja'),
                                  ),
                                ),
                              ],
                            )
                            : Row(
                              children: [
                                IconButton(
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
                                                    .read(
                                                      orderDetailProvider
                                                          .notifier,
                                                    )
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
                                  icon: const Icon(Icons.clear_rounded),
                                  color: Colors.redAccent,
                                  style: IconButton.styleFrom(
                                    backgroundColor: Colors.red[50],
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: TextButton(
                                    onPressed:
                                        orderDetail.items.isEmpty
                                            ? null
                                            : () {
                                              if (orderDetail != null &&
                                                  orderDetail
                                                      .items
                                                      .isNotEmpty) {
                                                // print('mau disimpan');

                                                if (orderDetail.user == '') {
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
                                                } else if (orderDetail
                                                        .tableNumber ==
                                                    null) {
                                                  print(
                                                    'nomor meja tidak boleh kosong',
                                                  );
                                                  ScaffoldMessenger.of(
                                                    context,
                                                  ).showSnackBar(
                                                    const SnackBar(
                                                      duration: Duration(
                                                        seconds: 1,
                                                      ),
                                                      content: Text(
                                                        'Nomor meja tidak boleh kosong',
                                                      ),
                                                    ),
                                                  );
                                                  return;
                                                }
                                                ref
                                                    .read(
                                                      savedOrderProvider
                                                          .notifier,
                                                    )
                                                    .savedOrder(ref);

                                                ref
                                                    .read(
                                                      orderDetailProvider
                                                          .notifier,
                                                    )
                                                    .clearOrder();
                                                ScaffoldMessenger.of(
                                                  context,
                                                ).showSnackBar(
                                                  const SnackBar(
                                                    duration: Duration(
                                                      seconds: 1,
                                                    ),
                                                    content: Text(
                                                      'Pesanan berhasil disimpan',
                                                    ),
                                                  ),
                                                );
                                              }
                                            },
                                    style: IconButton.styleFrom(
                                      backgroundColor: Colors.green[50],
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: const Text('Simpan'),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextButton(
                                    onPressed:
                                        orderDetail.items.isEmpty
                                            ? null
                                            : () {
                                              if (orderDetail != null &&
                                                  orderDetail
                                                      .items
                                                      .isNotEmpty) {
                                                // print('mau dibayar');
                                                if (orderDetail.user == "") {
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
                                                } else if (orderDetail
                                                            .tableNumber ==
                                                        "" &&
                                                    orderDetail.orderType !=
                                                        OrderType.takeAway) {
                                                  ScaffoldMessenger.of(
                                                    context,
                                                  ).showSnackBar(
                                                    const SnackBar(
                                                      duration: Duration(
                                                        seconds: 1,
                                                      ),
                                                      content: Text(
                                                        'Nomor meja tidak boleh kosong',
                                                      ),
                                                    ),
                                                  );
                                                  return;
                                                }
                                                print(
                                                  'order detail: $orderDetail',
                                                );
                                                context.push(
                                                  '/payment-method',
                                                  extra: orderDetail,
                                                );
                                              }
                                            },
                                    style: IconButton.styleFrom(
                                      backgroundColor: Colors.green,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: const Text(
                                      'Bayar',
                                      style: TextStyle(color: Colors.white),
                                    ),
                                  ),
                                ),
                              ],
                            )
                        : const SizedBox.shrink(),
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
