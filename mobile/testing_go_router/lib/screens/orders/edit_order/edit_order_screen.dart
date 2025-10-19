//edit_order_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/screens/orders/edit_order/list_menu.dart';
import 'package:kasirbaraja/screens/orders/edit_order/order_detail_edit.dart';

class EditOrderScreen extends ConsumerStatefulWidget {
  const EditOrderScreen({super.key});

  @override
  ConsumerState<EditOrderScreen> createState() => _EditOrderScreenState();
}

class _EditOrderScreenState extends ConsumerState<EditOrderScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Order')),
      body: Row(
        children: const [
          Expanded(flex: 3, child: ListMenu()),
          Expanded(flex: 2, child: OrderDetailEdit()),
        ],
      ),
    );
  }
}
