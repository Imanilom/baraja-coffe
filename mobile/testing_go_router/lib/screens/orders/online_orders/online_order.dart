import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/enums/order_status.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/try/activity_model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/providers/sockets/connect_to_socket.dart';
import 'package:kasirbaraja/services/order_history_service.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

import '../../../widgets/scanner/qrscanner.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/screens/orders/online_orders/widgets/order_list_widget.dart';
import 'package:kasirbaraja/screens/orders/online_orders/widgets/order_detail_widget.dart';
import 'package:kasirbaraja/screens/orders/online_orders/widgets/order_items_widget.dart';

class OnlineOrderScreen extends ConsumerWidget {
  const OnlineOrderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(onlineOrderProvider);
    final selectedOrder = ref.watch(onlineOrderDetailProvider);

    return Row(
      children: [
        // Left Panel - Order List
        Expanded(
          flex: 3,
          child: Container(
            decoration: BoxDecoration(
              border: Border(right: BorderSide(color: Colors.grey.shade300)),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    border: Border(
                      bottom: BorderSide(color: Colors.grey.shade300),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.list_alt, color: Colors.blue),
                      const SizedBox(width: 8),
                      const Text(
                        'Order List',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      ordersAsync.when(
                        data:
                            (orders) => Text(
                              '${orders!.length} orders',
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                        loading: () => const SizedBox(),
                        error: (_, __) => const SizedBox(),
                      ),
                      IconButton(
                        icon: const Icon(Icons.refresh),
                        onPressed: () {
                          ref.read(onlineOrderProvider.notifier).refresh();
                        },
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ordersAsync.when(
                    data: (orders) => OrderListWidget(orders: orders!),
                    loading:
                        () => const Center(child: CircularProgressIndicator()),
                    error:
                        (error, _) => Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.error_outline,
                                size: 64,
                                color: Colors.red,
                              ),
                              const SizedBox(height: 16),
                              Text('Error: $error'),
                              ElevatedButton(
                                onPressed: () {
                                  ref
                                      .read(onlineOrderProvider.notifier)
                                      .refresh();
                                },
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Center Panel - Order Detail
        Expanded(
          flex: 3,
          child: Container(
            decoration: BoxDecoration(
              border: Border(right: BorderSide(color: Colors.grey.shade300)),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    border: Border(
                      bottom: BorderSide(color: Colors.grey.shade300),
                    ),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.receipt_long, color: Colors.green),
                      SizedBox(width: 8),
                      Text(
                        'Order Details',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child:
                      selectedOrder != null
                          ? OrderDetailWidget(order: selectedOrder)
                          : const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.touch_app,
                                  size: 64,
                                  color: Colors.grey,
                                ),
                                SizedBox(height: 16),
                                Text(
                                  'Select an order to view details',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ),
                ),
              ],
            ),
          ),
        ),

        // Right Panel - Order Items
        Expanded(
          flex: 3,
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  border: Border(
                    bottom: BorderSide(color: Colors.grey.shade300),
                  ),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.restaurant_menu, color: Colors.orange),
                    SizedBox(width: 8),
                    Text(
                      'Order Items',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child:
                    selectedOrder != null
                        ? OrderItemsWidget(items: selectedOrder.items)
                        : const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.shopping_cart_outlined,
                                size: 64,
                                color: Colors.grey,
                              ),
                              SizedBox(width: 16),
                              Text(
                                'No items to display',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
