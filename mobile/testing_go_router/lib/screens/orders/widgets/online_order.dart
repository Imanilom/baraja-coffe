import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/try/activity_model.dart';
import 'package:kasirbaraja/providers/sockets/connect_to_socket.dart';
import 'package:kasirbaraja/services/order_history_service.dart';

class OnlineOrder extends ConsumerWidget {
  const OnlineOrder({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // final realtimeOrder = ref.watch(realtimeOrderProvider);
    // final testSockets = ref.watch(testSocket);

    // return testSockets.when(
    //   data: (data) => ListTile(title: Text(data)),
    //   loading: () => Center(child: const Text("Menunggu...")),
    //   error: (error, stackTrace) => Text("error: $error"),
    // );
    final activity = ref.watch(activityProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Pull to refresh')),
      body: RefreshIndicator(
        // onRefresh: () async => Text('on refresh'),
        onRefresh: () async => ref.refresh(activityProvider.future),
        child: ListView(
          children: [
            // Text(activity.value?.quote ?? 'No quote yet'),
            switch (activity) {
              // If some data is available, we display it.
              // Note that data will still be available during a refresh.
              AsyncValue<Activity>(:final value?) => Center(
                child: Text(value.quote),
              ),
              // An error is available, so we render it.
              AsyncValue(:final error?) => Text('Error: $error'),
              // No data/error, so we're in loading state.
              _ => const CircularProgressIndicator(),
            },
          ],
        ),
      ),
    );

    // return realtimeOrder.when(
    //   data: (order) {
    //     return ListTile(
    //       title: Text("Order dari ${order.customerName}"),
    //       subtitle: Text("Total: ${order.totalPrice}"),
    //     );
    //   },
    //   loading: () => Center(child: const Text("Menunggu order...")),
    //   error: (e, _) => Text("Error: $e"),
    // );
  }
}
