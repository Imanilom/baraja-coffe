import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/global_provider/provider.dart';
import 'package:kasirbaraja/screens/orders/order_details/order_detail.dart';
import 'package:kasirbaraja/screens/orders/widgets/list_menu.dart';
import 'package:kasirbaraja/screens/orders/widgets/online_order.dart';
import 'package:kasirbaraja/screens/orders/widgets/order_history.dart';
import 'package:kasirbaraja/screens/orders/widgets/saved_order.dart';

class OrderScreen extends ConsumerWidget {
  const OrderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentWidgetIndex = ref.watch(currentWidgetIndexProvider);

    return Row(
      children: <Widget>[
        Expanded(
          flex: 2,
          child: IndexedStack(
            index: currentWidgetIndex,
            children: [
              Container(color: Colors.grey[200], child: ListMenu()),
              Container(color: Colors.grey[200], child: OnlineOrder()),
              Container(
                color: Colors.grey[200],
                child: Center(child: OrderHistory()),
              ),
              Container(
                color: Colors.grey[200],
                child: Center(child: SavedOrder()),
              ),
            ],
          ),
        ),
        Expanded(flex: 1, child: OrderDetail()),
      ],
    );
  }
}
