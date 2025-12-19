import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/custom_amount_items.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
// import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/screens/orders/order_details/dialog_order_type.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/widgets/buttons/vertical_icon_text_button.dart';
import 'package:kasirbaraja/widgets/dialogs/edit_order_item_dialog.dart';

class OrderDetail extends ConsumerWidget {
  const OrderDetail({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final OrderDetailModel? orderDetail = ref.watch(orderDetailProvider);
    final openBillLoadingProvider = StateProvider<bool>((ref) => false);
    final isLoading = ref.watch(openBillLoadingProvider);

    // final savedPrinter = ref.read(savedPrintersProvider.notifier);

    const String onNull = 'Pilih menu untuk memulai pesanan';

    Future<void> handleOpenBill() async {
      if (orderDetail == null) return;

      final ok = await _ensureRequiredFields(context, ref, orderDetail);
      if (!ok) return;

      ref.read(openBillLoadingProvider.notifier).state = true;

      try {
        // ini harus method yang bener-bener call backend dan throw kalau gagal
        await ref.read(orderDetailProvider.notifier).submitOrder(ref);

        if (!context.mounted) return;

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Open Bill berhasil')));

        // sukses: clear order
        ref.read(orderDetailProvider.notifier).clearOrder();
      } catch (e) {
        ref.read(orderDetailProvider.notifier).updateIsOpenBill(false);
        if (!context.mounted) return;

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Open Bill gagal: $e')));

        // gagal: jangan clear
      } finally {
        ref.read(openBillLoadingProvider.notifier).state = false;
      }
    }

    return Stack(
      children: [
        AbsorbPointer(
          absorbing: isLoading,
          child: Padding(
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
                                        .updateCustomerDetails(
                                          tableNumber: null,
                                        );
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
                                    (orderDetail.customAmountItems?.isEmpty ??
                                        true)))
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
                                      orderDetail
                                          .customAmountItems![customIndex];

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
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
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
                                  trailing: Text(
                                    formatRupiah(orderItem.subtotal),
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
                                                  .read(
                                                    orderDetailProvider
                                                        .notifier,
                                                  )
                                                  .editOrderItem(
                                                    orderItem,
                                                    editedOrderItem,
                                                  );
                                            },
                                            onClose:
                                                () => Navigator.pop(context),
                                            onDeleteOrderItem: () {
                                              ref
                                                  .read(
                                                    orderDetailProvider
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
                          _OrderSummaryRow(
                            label: 'Subtotal',
                            value: formatRupiah(
                              orderDetail.totalAfterDiscount.toInt(),
                            ),
                          ),
                          _OrderSummaryRow(
                            label: 'Tax',
                            value: formatRupiah(
                              orderDetail.totalTax.toInt().round(),
                            ),
                          ),
                          const Divider(),
                          _OrderSummaryRow(
                            label: 'Total Harga',
                            value: formatRupiah(
                              orderDetail.grandTotal.toInt().round(),
                            ),
                            isBold: true,
                          ),
                          const SizedBox(height: 8),

                          Row(
                            children: [
                              // Hapus
                              IconButton(
                                onPressed: () {
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
                                            onPressed:
                                                () => Navigator.pop(context),
                                            child: const Text('Batal'),
                                          ),
                                          TextButton(
                                            onPressed: () {
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

                              const SizedBox(width: 8),

                              // openbill
                              Expanded(
                                child: TextButton(
                                  // onPressed: () => handleOpenBill(),
                                  onPressed: () async {
                                    final ok = await _ensureRequiredFields(
                                      context,
                                      ref,
                                      orderDetail,
                                    );
                                    if (!ok) return;

                                    //update orderdetail isOpenbill=true
                                    ref
                                        .read(orderDetailProvider.notifier)
                                        .updateIsOpenBill(true);

                                    handleOpenBill();
                                  },
                                  style: TextButton.styleFrom(
                                    backgroundColor: Colors.green[50],
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  child: const Text('Open Bill'),
                                ),
                              ),

                              const SizedBox(width: 8),

                              // Bayar
                              Expanded(
                                child: TextButton(
                                  onPressed: () async {
                                    final ok = await _ensureRequiredFields(
                                      context,
                                      ref,
                                      orderDetail,
                                    );
                                    if (!ok) return;
                                    ref
                                        .read(orderDetailProvider.notifier)
                                        .updateIsOpenBill(false);

                                    if (!context.mounted) return;
                                    context.push(
                                      '/payment-method',
                                      extra: ref.read(orderDetailProvider),
                                    );
                                  },
                                  style: TextButton.styleFrom(
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
                          ),
                        ],
                      ),
                    ),
              ],
            ),
          ),
        ),

        if (isLoading) ...[
          const ModalBarrier(dismissible: false, color: Colors.black38),
          const Center(child: CircularProgressIndicator()),
        ],
      ],
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
      if (name == null || name.trim().isEmpty) return false;

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
          (context) => AlertDialog(
            title: const Text('Nama Pelanggan (wajib)'),
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
          (context) => AlertDialog(
            title: const Text('Nomor Meja (wajib untuk Dine-in)'),
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
    );
  }

  bool _validateBeforeAction(
    BuildContext context,
    OrderDetailModel orderDetail,
  ) {
    if (orderDetail.items.isEmpty) return false;

    if (orderDetail.user == null || orderDetail.user!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          duration: Duration(seconds: 1),
          content: Text('Nama pelanggan tidak boleh kosong'),
        ),
      );
      return false;
    }

    // take away: table boleh kosong
    final mustHaveTable = orderDetail.orderType != OrderType.takeAway;

    if (mustHaveTable &&
        (orderDetail.tableNumber == null || orderDetail.tableNumber!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          duration: Duration(seconds: 1),
          content: Text('Nomor meja tidak boleh kosong'),
        ),
      );
      return false;
    }

    return true;
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
