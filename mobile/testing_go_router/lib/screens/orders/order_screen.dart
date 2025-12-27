import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/screens/orders/order_details/order_detail.dart';
import 'package:kasirbaraja/screens/orders/widgets/list_menu.dart';

class OrderScreen extends ConsumerWidget {
  const OrderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoading = ref.watch(openBillLoadingProvider);

    return Stack(
      children: [
        Row(
          children: <Widget>[
            Expanded(flex: 2, child: ListMenu()),
            const Expanded(flex: 1, child: OrderDetail()),
          ],
        ),

        if (isLoading) ...[
          // blok semua input di OrderScreen
          const Positioned.fill(
            child: AbsorbPointer(absorbing: true, child: SizedBox.shrink()),
          ),

          // layer gelap
          Positioned.fill(child: Container(color: Colors.black38)),

          // loader
          const Center(
            child: SizedBox(
              width: 48,
              height: 48,
              child: CircularProgressIndicator(),
            ),
          ),
        ],
      ],
    );
  }
}
