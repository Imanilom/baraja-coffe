import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/try/activity_model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/providers/sockets/connect_to_socket.dart';
import 'package:kasirbaraja/services/order_history_service.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

class OnlineOrder extends ConsumerWidget {
  const OnlineOrder({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final onlineOrder = ref.watch(onlineOrderProvider);

    if (onlineOrder is AsyncData && (onlineOrder.value?.isEmpty ?? true)) {
      // If there are no online orders available, show a message
      return const Center(child: Text('No online orders available'));
    }

    return onlineOrder.when(
      data: (data) {
        return RefreshIndicator(
          onRefresh: () async => ref.refresh(onlineOrderProvider.future),
          child: ListView.builder(
            itemCount: data.length,
            itemBuilder: (context, index) {
              final order = data[index];
              return ListTile(
                title: Text(
                  '${order.customerName} - ${order.orderType.toString()} - ${order.status.toString()}',
                ),
                subtitle: Text(
                  '${formatRupiah(order.totalPrice!.toInt())} - ${order.orderId} - ${order.items.first.menuItem.category!}...',
                ),
                onTap: () {
                  // Clear previous history detail
                  ref
                      .read(onlineOrderDetailProvider.notifier)
                      .clearOnlineOrderDetail();
                  // Navigate to order detail screen
                  ref
                      .read(onlineOrderDetailProvider.notifier)
                      .savedOnlineOrderDetail(order);
                },
              );
            },
          ),
        );
      },
      error: (error, stackTrace) => Text('Error: $error'),
      loading: () => const CircularProgressIndicator(),
    );
    // final activity = ref.watch(activityProvider);

    // return Scaffold(
    //   appBar: AppBar(title: const Text('Pull to refresh')),
    //   body: RefreshIndicator(
    //     // onRefresh: () async => Text('on refresh'),
    //     onRefresh: () async => ref.refresh(activityProvider.future),
    //     child: ListView(
    //       children: [
    //         // Text(activity.value?.quote ?? 'No quote yet'),
    //         switch (activity) {
    //           // If some data is available, we display it.
    //           // Note that data will still be available during a refresh.
    //           AsyncValue<Activity>(:final value?) => Center(
    //             child: Text(value.quote),
    //           ),
    //           // An error is available, so we render it.
    //           AsyncValue(:final error?) => Text('Error: $error'),
    //           // No data/error, so we're in loading state.
    //           _ => const CircularProgressIndicator(),
    //         },
    //       ],
    //     ),
    //   ),
    // );
  }
}
