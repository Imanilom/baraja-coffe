import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/custom_amount_items.model.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/providers/menu_item_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/pending_order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/providers/orders/pending_order_provider.dart';
import 'package:kasirbaraja/repositories/menu_item_repository.dart';
// import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/screens/orders/order_details/custom_discount_dialog.dart';
import 'package:kasirbaraja/screens/orders/order_details/dialog_order_type.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/widgets/buttons/vertical_icon_text_button.dart';
import 'package:kasirbaraja/widgets/dialogs/edit_order_item_dialog.dart';

class OrderDetail extends ConsumerWidget {
  const OrderDetail({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final OrderDetailModel? orderDetail = ref.watch(orderDetailProvider);
    final isLoading = ref.watch(openBillLoadingProvider);

    final hasName = (orderDetail?.user ?? '').trim().isNotEmpty;
    final isTakeAway =
        (orderDetail?.orderType ?? OrderType.dineIn) == OrderType.takeAway;
    final hasTable = (orderDetail?.tableNumber ?? '').trim().isNotEmpty;
    final needTable = !isTakeAway;

    // final manualDiscount = orderDetail?.discounts?.totalDiscount ?? 0;
    // final autoDiscount = (orderDetail?.appliedPromos ?? []).fold<int>(
    //   0,
    //   (sum, p) =>
    //       sum + p.affectedItems.fold(0, (s, it) => s + it.discountAmount),
    // );
    // final totalDiscount = manualDiscount + autoDiscount;
    final totalDiscount = orderDetail?.discounts?.totalDiscount ?? 0;

    // final savedPrinter = ref.read(savedPrintersProvider.notifier);

    const String onNull = 'Pilih menu untuk memulai pesanan';

    Future<void> handleOpenBill() async {
      final sw = Stopwatch()..start();

      if (orderDetail == null) return;

      final ok = await _ensureRequiredFields(context, ref, orderDetail);
      if (!ok) return;

      // tanda openbill dulu (opsional, tapi oke)
      ref.read(orderDetailProvider.notifier).updateIsOpenBill(true);

      // nyalakan loading
      ref.read(openBillLoadingProvider.notifier).state = true;

      final menuRepo = MenuItemRepository();

      try {
        // 1) critical path: submit backend
        await ref.read(orderDetailProvider.notifier).submitOrder();
        debugPrint('handleOpenBill took: ${sw.elapsedMilliseconds} ms');

        if (!context.mounted) return;

        // 2) matikan loading SECEPATNYA setelah backend sukses
        ref.read(openBillLoadingProvider.notifier).state = false;

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Open Bill berhasil')));

        // 3) refresh pending order (kalau harus langsung tampil)
        // kalau ini berat dan gak harus langsung, jadikan fire-and-forget juga
        ref.read(pendingOrderProvider.notifier).refresh().catchError((e) {
          debugPrint('refresh pending order gagal: $e');
        });

        // 4) post-processing lokal (JANGAN bikin user nunggu)
        // kurangi stok lokal hanya jika sukses
        menuRepo.decreaseLocalStockFromOrderItems(orderDetail.items).catchError(
          (e) {
            debugPrint('decreaseLocalStockFromOrderItems gagal: $e');
          },
        );

        // refresh menu badge stok
        ref.invalidate(reservationMenuItemProvider);

        // 5) clear order paling akhir (sukses)
        ref.read(orderDetailProvider.notifier).clearOrder();
        ref.read(pendingOrderDetailProvider.notifier).clearPendingOrderDetail();
      } catch (e) {
        // gagal: revert flag openbill
        ref.read(orderDetailProvider.notifier).updateIsOpenBill(false);

        // matikan loading
        ref.read(openBillLoadingProvider.notifier).state = false;

        if (!context.mounted) return;
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Open Bill gagal: $e')));

        // gagal: jangan clear order, jangan kurangi stok
      } finally {
        sw.stop();
        debugPrint('refresh took: ${sw.elapsedMilliseconds} ms');
      }
    }

    Widget buildRightActions({
      required BuildContext context,
      required WidgetRef ref,
      required OrderDetailModel orderDetail,
      required bool hasName,
      required bool hasTable,
      required bool needTable,
      required bool isLoading,
    }) {
      // 1) Nama pelanggan wajib
      if (!hasName) {
        return TextButton(
          onPressed:
              isLoading
                  ? null
                  : () {
                    _showCustomerNameDialog(context, ref, orderDetail);
                  },
          style: TextButton.styleFrom(
            backgroundColor: Colors.orange[50],
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: const Text('Isi Nama Pelanggan'),
        );
      }

      // 2) Nomor meja wajib jika dine-in
      if (needTable && !hasTable) {
        return TextButton(
          onPressed:
              isLoading
                  ? null
                  : () {
                    _showTableNumberDialog(context, ref, orderDetail);
                  },
          style: TextButton.styleFrom(
            backgroundColor: Colors.orange[50],
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: const Text('Isi Nomor Meja'),
        );
      }

      // 3) Semua lengkap → Open Bill + Bayar
      return Row(
        children: [
          Expanded(
            child: TextButton(
              onPressed: isLoading ? null : () => handleOpenBill(),
              // onPressed: () {
              //   //alert dialog fitur belum jadi
              //   showDialog(
              //     context: context,
              //     builder:
              //         (context) => AlertDialog(
              //           title: const Text('Fitur belum jadi'),
              //           content: const Text(
              //             'Fitur ini belum jadi, silahkan tunggu beberapa hari lagi',
              //           ),
              //           actions: [
              //             TextButton(
              //               child: const Text('OK'),
              //               onPressed: () => Navigator.pop(context),
              //             ),
              //           ],
              //         ),
              //   );
              // },
              style: TextButton.styleFrom(
                backgroundColor: Colors.grey[50],
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Open Bill',
                style: TextStyle(color: Colors.grey),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: TextButton(
              onPressed:
                  isLoading
                      ? null
                      : () {
                        ref
                            .read(orderDetailProvider.notifier)
                            .updateIsOpenBill(false);
                        context.push('/payment-method', extra: orderDetail);
                      },
              style: TextButton.styleFrom(
                backgroundColor: Colors.green,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Bayar', style: TextStyle(color: Colors.white)),
            ),
          ),
        ],
      );
    }

    Widget buildBottomActions({
      required BuildContext context,
      required WidgetRef ref,
      required OrderDetailModel orderDetail,
    }) {
      return Row(
        children: [
          // =======================
          // HAPUS (selalu ada)
          // =======================
          IconButton(
            onPressed:
                isLoading
                    ? null
                    : () {
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
                                onPressed: () => Navigator.pop(context),
                                child: const Text('Batal'),
                              ),
                              TextButton(
                                onPressed: () {
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
            icon: const Icon(Icons.clear_rounded),
            color: Colors.redAccent,
            style: IconButton.styleFrom(
              backgroundColor: Colors.red[50],
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // =======================
          // KANAN (dinamis)
          // =======================
          Expanded(
            child: buildRightActions(
              context: context,
              ref: ref,
              orderDetail: orderDetail,
              hasName: hasName,
              hasTable: hasTable,
              needTable: needTable,
              isLoading: isLoading,
            ),
          ),
        ],
      );
    }

    return Padding(
      padding: const EdgeInsets.only(right: 8, left: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top actions (Meja, Order Type, Pelanggan)
          Container(
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                // Meja
                VerticalIconTextButton(
                  icon: Icons.table_restaurant_rounded,
                  label:
                      (orderDetail?.tableNumber != null &&
                              (orderDetail?.tableNumber ?? '').isNotEmpty)
                          ? 'Meja ${orderDetail?.tableNumber}'
                          : 'Meja',
                  color:
                      (orderDetail?.tableNumber != null &&
                              (orderDetail?.tableNumber ?? '').isNotEmpty)
                          ? Colors.green
                          : Colors.grey,
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

                    if (orderDetail == null) {
                      ref
                          .read(orderDetailProvider.notifier)
                          .initializeOrder(orderType: OrderType.dineIn);
                    }

                    showDialog(
                      context: context,
                      builder: (context) {
                        final controller = TextEditingController(
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
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: const Text('Batal'),
                              ),
                              TextButton(
                                onPressed: () {
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
                ),

                // Order Type
                VerticalIconTextButton(
                  icon: Icons.restaurant_menu_rounded,
                  label: OrderTypeExtension.orderTypeToJson(
                    orderDetail?.orderType ?? OrderType.dineIn,
                  ),
                  color: orderDetail != null ? Colors.green : Colors.grey,
                  onPressed: () {
                    if (orderDetail == null) return;

                    showDialog(
                      context: context,
                      builder:
                          (context) => OrderTypeSelectionDialog(
                            currentOrderType: orderDetail.orderType,
                            onOrderTypeSelected: (selectedOrderType) {
                              ref
                                  .read(orderDetailProvider.notifier)
                                  .updateOrderType(selectedOrderType);
                            },
                            onTakeAwaySelected: () {
                              ref
                                  .read(orderDetailProvider.notifier)
                                  .updateCustomerDetails(tableNumber: null);
                            },
                          ),
                    );
                  },
                ),

                // Pelanggan
                VerticalIconTextButton(
                  icon: Icons.person_rounded,
                  label:
                      (orderDetail?.user != null &&
                              orderDetail!.user!.isNotEmpty)
                          ? orderDetail.user!
                          : 'Pelanggan',
                  color:
                      (orderDetail?.user != null &&
                              orderDetail!.user!.isNotEmpty)
                          ? Colors.green
                          : Colors.grey,
                  onPressed: () {
                    if (orderDetail == null) {
                      ref
                          .read(orderDetailProvider.notifier)
                          .initializeOrder(orderType: OrderType.dineIn);
                    }

                    showDialog(
                      context: context,
                      builder: (context) {
                        final controller = TextEditingController(
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
                                onPressed: () => Navigator.pop(context),
                                child: const Text('Tutup'),
                              ),
                              TextButton(
                                onPressed: () {
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

          // List items
          Expanded(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.only(right: 4),
              child:
                  (orderDetail == null ||
                          (orderDetail.items.isEmpty &&
                              (orderDetail.customAmountItems?.isEmpty ?? true)))
                      ? const Center(
                        child: Text(onNull, textAlign: TextAlign.center),
                      )
                      : ListView.builder(
                        physics: const BouncingScrollPhysics(),
                        itemCount:
                            orderDetail.items.length +
                            (orderDetail.customAmountItems?.length ?? 0),
                        itemBuilder: (context, index) {
                          final isCustomAmount =
                              index >= orderDetail.items.length;

                          if (isCustomAmount) {
                            final customIndex =
                                index - orderDetail.items.length;
                            final customAmount =
                                orderDetail.customAmountItems![customIndex];

                            return _buildCustomAmountListTile(
                              customAmount,
                              context,
                              ref,
                            );
                          }

                          final orderItem = orderDetail.items[index];

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
                            title: Text(
                              '(${OrderTypeExtension.orderTypeToShortJson(orderItem.orderType)}) ${orderItem.menuItem.name.toString()}',
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (orderItem.selectedToppings.isNotEmpty)
                                  Text(
                                    'Topping: ${orderItem.selectedToppings.map((t) => t.name).join(', ')}',
                                  ),
                                if (orderItem.selectedAddons.isNotEmpty)
                                  if (orderItem
                                          .selectedAddons
                                          .first
                                          .options
                                          ?.isNotEmpty ??
                                      false)
                                    ...orderItem.selectedAddons.map(
                                      (addon) => Text(
                                        '${addon.name!}: ${addon.options == null ? '' : addon.options!.map((e) => e.label!).join(', ')}',
                                      ),
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
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // Custom discount badge
                                if (orderItem.customDiscount?.isActive == true)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    margin: const EdgeInsets.only(right: 8),
                                    decoration: BoxDecoration(
                                      color: Colors.green.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: Colors.green),
                                    ),
                                    child: Text(
                                      orderItem.customDiscount!.discountType ==
                                              'percentage'
                                          ? '${orderItem.customDiscount!.discountValue}%'
                                          : formatRupiah(
                                            orderItem
                                                .customDiscount!
                                                .discountValue,
                                          ),
                                      style: const TextStyle(
                                        fontSize: 10,
                                        color: Colors.green,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),

                                // Price display
                                Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    // Original price (strikethrough if discounted)
                                    if (orderItem.customDiscount?.isActive ==
                                        true)
                                      Text(
                                        formatRupiah(orderItem.subtotal),
                                        style: const TextStyle(
                                          decoration:
                                              TextDecoration.lineThrough,
                                          fontSize: 11,
                                          color: Colors.grey,
                                        ),
                                      ),
                                    // Final price
                                    Text(
                                      formatRupiah(
                                        orderItem.subtotal -
                                            (orderItem
                                                    .customDiscount
                                                    ?.discountAmount ??
                                                0),
                                      ),
                                      style: TextStyle(
                                        color:
                                            orderItem
                                                        .customDiscount
                                                        ?.isActive ==
                                                    true
                                                ? Colors.green
                                                : Colors.black,
                                        fontWeight:
                                            orderItem
                                                        .customDiscount
                                                        ?.isActive ==
                                                    true
                                                ? FontWeight.bold
                                                : FontWeight.normal,
                                      ),
                                    ),
                                  ],
                                ),

                                const SizedBox(width: 4),

                                // Discount icon button
                                IconButton(
                                  icon: Icon(
                                    orderItem.customDiscount?.isActive == true
                                        ? Icons.discount
                                        : Icons.discount_outlined,
                                    size: 18,
                                    color:
                                        orderItem.customDiscount?.isActive ==
                                                true
                                            ? Colors.green
                                            : Colors.grey,
                                  ),
                                  onPressed: () {
                                    if (orderItem.customDiscount?.isActive ==
                                        true) {
                                      // Remove existing discount
                                      ref
                                          .read(orderDetailProvider.notifier)
                                          .removeItemCustomDiscount(orderItem);
                                    } else {
                                      // Show dialog to add discount
                                      _showItemDiscountDialog(
                                        context,
                                        ref,
                                        orderItem,
                                      );
                                    }
                                  },
                                  padding: const EdgeInsets.all(4),
                                  constraints: const BoxConstraints(
                                    minWidth: 32,
                                    minHeight: 32,
                                  ),
                                ),
                              ],
                            ),
                            onTap: () {
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

          // Di dalam widget OrderDetail, setelah list regular items

          // FREE ITEMS SECTION (dari appliedPromos)
          if ((orderDetail?.appliedPromos ?? []).any(
            (p) => p.freeItems.isNotEmpty,
          )) ...[
            const SizedBox(height: 4),
            // List Free Items
            ...orderDetail!.appliedPromos!
                .expand((promo) => promo.freeItems)
                .map((freeItem) {
                  return Container(
                    color: Colors.white,
                    padding: const EdgeInsets.only(right: 4),
                    child: ListTile(
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
                        child: Text(freeItem.quantity.toString()),
                      ),
                      title: Text(freeItem.menuItemName),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.green.shade400,
                              Colors.green.shade600,
                            ],
                          ),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'GRATIS',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
          ],
          const SizedBox(height: 4),

          // Bottom summary + actions
          (orderDetail == null || orderDetail.items.isEmpty)
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
                    // =======================
                    // PROMO TERPAKAI (appliedPromos)
                    // =======================
                    //daftar promo terpakai dengan row scroll
                    if ((orderDetail.appliedPromos ?? []).isNotEmpty) ...[
                      const Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Promo Terpakai',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(height: 6),
                      ...orderDetail.appliedPromos!.map((p) {
                        final promoDiscount = p.affectedItems.fold(
                          0,
                          (s, it) => s + it.discountAmount!,
                        );

                        final freebies = p.freeItems;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      p.promoName,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (freebies.isNotEmpty)
                                      Text(
                                        'Gratis: ${freebies.map((f) => '${f.menuItemName} x${f.quantity}').join(', ')}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[700],
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                      const Divider(),
                    ],
                    _OrderSummaryRow(
                      label: 'Sub Total Harga',
                      value: formatRupiah(orderDetail.totalBeforeDiscount),
                    ),

                    // Show regular discount (auto promo + manual + voucher)
                    if (totalDiscount > 0)
                      _OrderSummaryRow(
                        label: 'Diskon',
                        value: '- ${formatRupiah(totalDiscount)}',
                      ),

                    // Show item custom discounts separately
                    if ((orderDetail.discounts?.customDiscount ?? 0) > 0)
                      _OrderSummaryRow(
                        label: 'Diskon Items',
                        value:
                            '- ${formatRupiah(orderDetail.discounts!.customDiscount)}',
                        valueColor: Colors.green,
                      ),

                    // Show order-level custom discount separately
                    if (orderDetail.customDiscountDetails?.isActive == true)
                      _OrderSummaryRow(
                        label: 'Diskon Order',
                        value:
                            '- ${formatRupiah(orderDetail.customDiscountDetails!.discountAmount)}',
                        valueColor: Colors.green,
                        subtitle:
                            orderDetail.customDiscountDetails!.reason.isNotEmpty
                                ? orderDetail.customDiscountDetails!.reason
                                : null,
                      ),

                    _OrderSummaryRow(
                      label: 'Tax',
                      value: formatRupiah(orderDetail.totalTax),
                    ),
                    if (orderDetail.totalServiceFee > 0)
                      _OrderSummaryRow(
                        label: 'Service',
                        value: formatRupiah(orderDetail.totalServiceFee),
                      ),
                    const Divider(),
                    _OrderSummaryRow(
                      label: 'Total Harga',
                      value: formatRupiah(orderDetail.grandTotal),
                      isBold: true,
                    ),

                    const SizedBox(height: 8),

                    // Order discount button
                    if (orderDetail.customDiscountDetails?.isActive != true)
                      OutlinedButton.icon(
                        onPressed: () => _showOrderDiscountDialog(context, ref),
                        icon: const Icon(Icons.local_offer, size: 18),
                        label: const Text('Tambah Diskon Order'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.blue,
                        ),
                      )
                    else
                      OutlinedButton.icon(
                        onPressed: () {
                          ref
                              .read(orderDetailProvider.notifier)
                              .removeOrderCustomDiscount();
                        },
                        icon: const Icon(Icons.remove_circle_outline, size: 18),
                        label: const Text('Hapus Diskon Order'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                        ),
                      ),

                    const SizedBox(height: 8),
                    buildBottomActions(
                      context: context,
                      ref: ref,
                      orderDetail: orderDetail,
                    ),
                  ],
                ),
              ),
        ],
      ),
    );
  }

  // ============================================================================
  // CUSTOM DISCOUNT DIALOG HELPERS
  // ============================================================================

  void _showItemDiscountDialog(
    BuildContext context,
    WidgetRef ref,
    OrderItemModel item,
  ) {
    showDialog(
      context: context,
      builder:
          (context) => CustomDiscountDialog(
            title: 'Diskon Item: ${item.menuItem.name}',
            itemSubtotal: item.subtotal,
            onApply: (discountType, discountValue, reason) {
              ref
                  .read(orderDetailProvider.notifier)
                  .applyItemCustomDiscount(
                    item: item,
                    discountType: discountType,
                    discountValue: discountValue,
                    reason: reason,
                  );
            },
          ),
    );
  }

  void _showOrderDiscountDialog(BuildContext context, WidgetRef ref) {
    final orderDetail = ref.read(orderDetailProvider);
    if (orderDetail == null) return;

    showDialog(
      context: context,
      builder:
          (context) => CustomDiscountDialog(
            title: 'Diskon Order',
            itemSubtotal: orderDetail.totalAfterDiscount,
            onApply: (discountType, discountValue, reason) {
              ref
                  .read(orderDetailProvider.notifier)
                  .applyOrderCustomDiscount(
                    discountType: discountType,
                    discountValue: discountValue,
                    reason: reason,
                  );
            },
          ),
    );
  }

  Future<bool> _ensureRequiredFields(
    BuildContext context,
    WidgetRef ref,
    OrderDetailModel orderDetail,
  ) async {
    // 1) Nama wajib selalu
    if (orderDetail.user == null || orderDetail.user!.trim().isEmpty) {
      final name = await _promptName(context, initial: orderDetail.user ?? '');
      if (name == null || name.trim().isEmpty || name == '') return false;

      ref
          .read(orderDetailProvider.notifier)
          .updateCustomerDetails(customerName: name.trim());
    }

    // refresh snapshot (biar rule berikutnya pakai data terbaru)
    final latest = ref.read(orderDetailProvider);
    if (latest == null) return false;

    // 2) Meja wajib jika dine-in
    final mustHaveTable = latest.orderType != OrderType.takeAway;
    if (mustHaveTable &&
        (latest.tableNumber == null || latest.tableNumber!.trim().isEmpty)) {
      final table = await _promptTable(
        context,
        initial: latest.tableNumber ?? '',
      );
      if (table == null || table.trim().isEmpty) return false;

      ref
          .read(orderDetailProvider.notifier)
          .updateCustomerDetails(tableNumber: table.trim().toUpperCase());
    }

    return true;
  }

  Future<String?> _promptName(BuildContext context, {required String initial}) {
    final controller = TextEditingController(text: initial);
    return showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: AlertDialog(
              title: const Text('Nama Pelanggan'),
              content: TextField(
                controller: controller,
                autofocus: true,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => Navigator.pop(context, controller.text),
                decoration: const InputDecoration(hintText: 'Contoh: Budi'),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, null),
                  child: const Text('Batal'),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context, controller.text),
                  child: const Text('Simpan'),
                ),
              ],
            ),
          ),
    );
  }

  void _showCustomerNameDialog(
    BuildContext context,
    WidgetRef ref,
    OrderDetailModel orderDetail,
  ) {
    final controller = TextEditingController(text: orderDetail.user ?? '');

    showDialog(
      context: context,
      builder:
          (context) => SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: AlertDialog(
              title: const Text('Nama Pelanggan'),
              content: TextField(
                controller: controller,
                autofocus: true,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) {
                  ref
                      .read(orderDetailProvider.notifier)
                      .updateCustomerDetails(
                        customerName: controller.text.trim(),
                      );
                  Navigator.pop(context);
                },
                decoration: const InputDecoration(hintText: 'Contoh: Budi'),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Batal'),
                ),
                TextButton(
                  onPressed: () {
                    ref
                        .read(orderDetailProvider.notifier)
                        .updateCustomerDetails(
                          customerName: controller.text.trim(),
                        );
                    Navigator.pop(context);
                  },
                  child: const Text('Simpan'),
                ),
              ],
            ),
          ),
    );
  }

  void _showTableNumberDialog(
    BuildContext context,
    WidgetRef ref,
    OrderDetailModel orderDetail,
  ) {
    final controller = TextEditingController(
      text: orderDetail.tableNumber ?? '',
    );

    showDialog(
      context: context,
      builder:
          (context) => SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: AlertDialog(
              title: const Text('Nomor Meja'),
              content: TextField(
                controller: controller,
                autofocus: true,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) {
                  ref
                      .read(orderDetailProvider.notifier)
                      .updateCustomerDetails(
                        tableNumber: controller.text.trim(),
                      );
                  Navigator.pop(context);
                },
                decoration: const InputDecoration(hintText: 'Contoh: A12'),
                onChanged: (value) {
                  final cursor = controller.selection.baseOffset;
                  controller.value = TextEditingValue(
                    text: value.toUpperCase(),
                    selection: TextSelection.collapsed(offset: cursor),
                  );
                },
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Batal'),
                ),
                TextButton(
                  onPressed: () {
                    ref
                        .read(orderDetailProvider.notifier)
                        .updateCustomerDetails(
                          tableNumber: controller.text.trim(),
                        );
                    Navigator.pop(context);
                  },
                  child: const Text('Simpan'),
                ),
              ],
            ),
          ),
    );
  }

  Future<String?> _promptTable(
    BuildContext context, {
    required String initial,
  }) {
    final controller = TextEditingController(text: initial);
    return showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: AlertDialog(
              title: const Text('Masukkan Nomor Meja'),
              content: TextField(
                controller: controller,
                autofocus: true,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => Navigator.pop(context, controller.text),
                decoration: const InputDecoration(hintText: 'Contoh: A12'),
                onChanged: (value) {
                  final cursor = controller.selection.baseOffset;
                  controller.value = TextEditingValue(
                    text: value.toUpperCase(),
                    selection: TextSelection.collapsed(offset: cursor),
                  );
                },
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, null),
                  child: const Text('Batal'),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context, controller.text),
                  child: const Text('Simpan'),
                ),
              ],
            ),
          ),
    );
  }

  Widget _buildCustomAmountListTile(
    CustomAmountItemsModel customAmount,
    BuildContext context,
    WidgetRef ref,
  ) {
    return ListTile(
      horizontalTitleGap: 4,
      visualDensity: const VisualDensity(vertical: -4, horizontal: 0),
      contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 4),
      dense: true,
      tileColor: Colors.blue[50],
      leading: CircleAvatar(
        backgroundColor: Colors.blue[100],
        child: Icon(Icons.attach_money, color: Colors.blue[700], size: 20),
      ),
      title: Text(
        '(${OrderTypeExtension.orderTypeToShortJson(customAmount.orderType ?? OrderType.dineIn)}) ${customAmount.name ?? "Custom Amount"}',
      ),
      subtitle:
          (customAmount.description != null &&
                  customAmount.description!.isNotEmpty)
              ? Text(
                'Deskripsi: ${customAmount.description!}',
                style: const TextStyle(
                  fontStyle: FontStyle.italic,
                  color: Colors.grey,
                ),
              )
              : null,
      trailing: Text(
        formatRupiah(customAmount.amount),
        style: TextStyle(color: Colors.blue[700], fontWeight: FontWeight.w600),
      ),
      onTap: () => _showCustomAmountOptions(context, ref, customAmount),
    );
  }

  void _showCustomAmountOptions(
    BuildContext context,
    WidgetRef ref,
    CustomAmountItemsModel customAmount,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (context) => Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 20),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        customAmount.name ?? 'Custom Amount',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        formatRupiah(customAmount.amount),
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.blue[700],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (customAmount.description?.isNotEmpty ?? false) ...[
                        const SizedBox(height: 8),
                        Text(
                          customAmount.description!,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.delete_outline, color: Colors.red),
                  title: const Text(
                    'Hapus Item',
                    style: TextStyle(color: Colors.red),
                  ),
                  onTap: () {
                    ref
                        .read(orderDetailProvider.notifier)
                        .removeCustomAmountItem(customAmount);
                    Navigator.pop(context);

                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          '${customAmount.name ?? "Custom amount"} berhasil dihapus',
                        ),
                        backgroundColor: Colors.red[400],
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
    );
  }
}

class _OrderSummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;
  final String? subtitle;

  const _OrderSummaryRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.valueColor,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: isBold ? 16 : 14,
                  fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: isBold ? 16 : 14,
                  fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
                  color: valueColor,
                ),
              ),
            ],
          ),
          if (subtitle != null && subtitle!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 8, top: 2),
              child: Text(
                subtitle!,
                style: const TextStyle(
                  fontSize: 11,
                  fontStyle: FontStyle.italic,
                  color: Colors.grey,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
