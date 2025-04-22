import 'package:barajapos/models/order_detail_model.dart';
import 'package:barajapos/providers/auth_provider.dart';
import 'package:barajapos/providers/navigation_provider.dart';
import 'package:barajapos/providers/order_detail_providers/saved_order_detail_provider.dart';
import 'package:barajapos/providers/orders/order_type_provider.dart';
import 'package:barajapos/providers/orders/saved_order_provider.dart';
import 'package:barajapos/utils/format_rupiah.dart';
import 'package:barajapos/widgets/dialogs/edit_order_item_dialog.dart';
import 'package:barajapos/widgets/payment/payment_method.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart' as riverpod;
import 'package:barajapos/providers/order_detail_providers/order_detail_provider.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';

class OrderDetailScreen extends riverpod.ConsumerWidget {
  const OrderDetailScreen({super.key});

  @override
  Widget build(BuildContext context, riverpod.WidgetRef ref) {
    final currenIndex = ref.watch(navigationProvider);
    double totalPrices = 0;
    OrderDetailModel? orderDetail;
    String onNull = 'Pilih detail pesanan';

    switch (currenIndex) {
      case 0:
        orderDetail = ref.watch(orderDetailProvider);
        totalPrices = ref.watch(orderDetailProvider.notifier).totalPrice;
        onNull = 'Pilih menu untuk memulai pesanan';
        break;
      case 3:
        orderDetail = ref.watch(savedOrderDetailProvider);
        totalPrices = ref.watch(savedOrderDetailProvider.notifier).totalPrice;
        onNull = 'Pilih menu untuk memulai pesanan';
        break;
      default:
    }

    // final totalPrices = ref.watch(orderDetailProvider.notifier).totalPrice;
    // final orderDetail = ref.watch(orderDetailProvider);

    return Scaffold(
      headers: [
        AppBar(
          title: const Text('Pesanan'),
          trailing: [
            //logout
            Button(
              style: ButtonVariance.secondary,
              child: const Icon(RadixIcons.exit),
              onPressed: () => ref.read(authProvider.notifier).logout(),
            ),
          ],
        ),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          //profile cashier
          const Padding(
            padding: EdgeInsets.all(8.0),
            child: Text(
              'Cashier : Imanuel',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
          ),
          //memilih tipe order dine-in atau take away,
          //menggunakan radio button group.
          if (currenIndex == 0) const SelectOrderType(),
          //nama customer
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: riverpod.Consumer(
              builder: (context, ref, child) {
                final customerNameController = TextEditingController(
                  text: orderDetail?.customerName ?? '',
                );

                // Ensure the cursor stays at the end of the text
                customerNameController.selection = TextSelection.fromPosition(
                  TextPosition(offset: customerNameController.text.length),
                );

                return TextField(
                  maxLines: 1,
                  style: const TextStyle(fontSize: 14),
                  readOnly: currenIndex != 0,
                  controller: customerNameController,
                  onChanged: (value) {
                    if (currenIndex == 0) {
                      print('Customer Name: ${orderDetail?.customerName}');
                      print(value);
                      if (value.isEmpty) {
                        return;
                      }
                      if (orderDetail == null) {
                        ref
                            .read(orderDetailProvider.notifier)
                            .initializeOrder(orderType: 'dine-in');
                      }
                      ref
                          .read(orderDetailProvider.notifier)
                          .updateCustomerDetails(
                            customerName: value,
                          );
                    }
                  },
                );
              },
            ),
          ),
          //detail pesanan
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                const Text(
                  'Detail Pesanan',
                  style: TextStyle(
                    fontSize: 18,
                  ),
                ),
                const Spacer(),
                if (currenIndex == 0)
                  Button(
                    style: ButtonVariance.primary,
                    onPressed: () {
                      ref.read(orderDetailProvider.notifier).clearOrder();
                    },
                    child: const Text('Hapus'),
                  ),
              ],
            ),
          ),
          Expanded(
            child: orderDetail == null || orderDetail.items.isEmpty
                ? Container(
                    //gray
                    color: const Color(0xFFE5E7EB),
                    alignment: Alignment.center,
                    child: Text(
                      onNull,
                      textAlign: TextAlign.center,
                    ),
                  )
                : ListView.builder(
                    itemCount: orderDetail.items.length,
                    itemBuilder: (context, index) {
                      final orderItem = orderDetail!.items[index];
                      return GestureDetector(
                        onTap: () {
                          if (currenIndex != 0) return;
                          openSheet(
                            context: context,
                            position: OverlayPosition.bottom,
                            alignment: Alignment.bottomCenter,
                            builder: (context) => EditOrderItemDialog(
                              orderItem: orderItem,
                              onEditOrder: (editedOrderItem) {
                                ref
                                    .read(orderDetailProvider.notifier)
                                    .editOrderItem(orderItem, editedOrderItem);
                              },
                            ),
                          );
                        },
                        child: Basic(
                          title: Text(
                              '${orderItem.menuItem.name} (x${orderItem.quantity})'),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (orderItem.selectedToppings.isNotEmpty)
                                Text(
                                    'Topping: ${orderItem.selectedToppings.map((t) => t.name).join(', ')}'),
                              if (orderItem.selectedAddons.isNotEmpty)
                                //mengambil nama addons dan lable pada opsions
                                if (orderItem
                                    .selectedAddons.first.options.isNotEmpty)
                                  Text(
                                      'Addons: ${orderItem.selectedAddons.map((a) => a.options.map((o) => o.label).join(', ')).join(', ')}'),
                              Text(
                                  'Sub total: ${formatRupiah(orderItem.subTotalPrice)}'),
                            ],
                          ),
                          trailing: currenIndex == 0
                              ? Button(
                                  style: ButtonVariance.outline,
                                  child: const Icon(
                                    Icons.delete_outline_rounded,
                                    color: Color(0xFFD32F2F),
                                  ),
                                  onPressed: () {
                                    ref
                                        .read(orderDetailProvider.notifier)
                                        .removeItem(orderItem);
                                  },
                                )
                              : null,
                        ),
                      );
                    },
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              'Total: ${formatRupiah(totalPrices)}, payment: ${orderDetail?.paymentMethod}',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          //tombol untuk melanjutkan pesanan.
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: currenIndex == 3
                ? Button(
                    style: ButtonVariance.primary,
                    onPressed: () {
                      // hapus data order detail yang lama
                      ref.read(orderDetailProvider.notifier).clearOrder();
                      // hapus data order detail yang lama
                      ref
                          .read(savedOrderProvider.notifier)
                          .deleteOrderDetail(orderDetail!);
                      ref
                          .read(savedOrderDetailProvider.notifier)
                          .moveToOrderDetail(
                            orderDetail,
                            ref,
                          );
                      ref.read(navigationProvider.notifier).setIndex(0);
                    },
                    child: const Text('Lanjutkan Pesanan'),
                  )
                : Row(
                    children: [
                      Expanded(
                        child: Button(
                          style: ButtonVariance.primary,
                          onPressed: () {
                            if (orderDetail != null &&
                                orderDetail.items.isNotEmpty) {
                              print('mau disimpan');
                              ref
                                  .read(savedOrderProvider.notifier)
                                  .savedOrder(ref);

                              ref
                                  .read(orderDetailProvider.notifier)
                                  .clearOrder();
                            }
                          },
                          child: const Text('Save Order'),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Button(
                          style: ButtonVariance.primary,
                          onPressed: () {
                            if (orderDetail != null &&
                                orderDetail.items.isNotEmpty) {
                              openSheet(
                                context: context,
                                position: OverlayPosition.bottom,
                                builder: (context) => const PaymentMethod(),
                              );
                            }
                          },
                          child: const Text('Bayar'),
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

class SelectOrderType extends riverpod.ConsumerWidget {
  const SelectOrderType({super.key});

  @override
  Widget build(BuildContext context, riverpod.WidgetRef ref) {
    final orderType = ref.watch(orderTypeProvider);
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: RadioGroup(
        value: orderType,
        onChanged: (value) =>
            ref.read(orderTypeProvider.notifier).state = value,
        child: const Row(
          children: [
            RadioCard(
              value: 'dine-in',
              child: Text('Dine-in'),
            ),
            RadioCard(
              value: 'take-away',
              child: Text('Take-away'),
            ),
          ],
        ),
      ),
    );
  }
}
