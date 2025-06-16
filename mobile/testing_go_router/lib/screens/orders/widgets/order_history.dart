import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/history_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/order_history_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

class OrderHistory extends ConsumerWidget {
  const OrderHistory({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // final cashierId = ref.read(authCashierProvider).value?.id ?? '';
    // ref.read(orderHistoryProvider.notifier).getOrderHistory(cashierId);
    print('build order history');
    final history = ref.watch(orderHistoryProvider);
    print('get build order history: $history');

    return history.when(
      data:
          (list) => ListView.builder(
            itemCount: list.length,
            itemBuilder: (context, index) {
              final order = list[index];
              print('order history: $order');
              return ListTile(
                title: Text(order.customerName ?? 'Tanpa ID'),
                subtitle: Text(formatRupiah(order.totalPrice!.toInt())),
                onTap: () {
                  // Clear previous history detail
                  ref.read(historyDetailProvider.notifier).clearHistoryDetail();
                  // Navigate to order detail screen
                  ref
                      .read(historyDetailProvider.notifier)
                      .addToHistoryDetail(order);
                },
              );
            },
          ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('Gagal memuat data: $err')),
    );

    // return history.when(
    //   data:
    //       (list) => ListView.builder(
    //         itemCount: list.length,
    //         itemBuilder: (context, index) {
    //           final order = list[index];
    //           return ListTile(
    //             title: Text(order.customerName ?? 'Tanpa ID'),
    //             subtitle: Text(formatRupiah(order.totalPrice!.toInt())),
    //             onTap: () {
    //               // Clear previous history detail
    //               ref.read(historyDetailProvider.notifier).clearHistoryDetail();
    //               // Navigate to order detail screen
    //               ref
    //                   .read(historyDetailProvider.notifier)
    //                   .addToHistoryDetail(order);
    //             },
    //           );
    //         },
    //       ),
    //   loading: () => const Center(child: CircularProgressIndicator()),
    //   error: (err, _) => Center(child: Text('Gagal memuat data: $err')),
    // );
  }
}
