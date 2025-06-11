import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/sockets/connect_to_socket.dart';

class OnlineOrder extends ConsumerWidget {
  const OnlineOrder({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final realtimeOrder = ref.watch(realtimeOrderProvider);

    return realtimeOrder.when(
      data: (order) {
        return ListTile(
          title: Text("Order dari ${order.customerName}"),
          subtitle: Text("Total: ${order.totalPrice}"),
        );
      },
      loading: () => Center(child: const Text("Menunggu order...")),
      error: (e, _) => Text("Error: $e"),
    );
  }
}
