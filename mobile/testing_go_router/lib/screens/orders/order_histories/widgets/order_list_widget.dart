import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/history_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/order_history_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/enums/order_type.dart';

class OrderListWidget extends ConsumerWidget {
  final List<OrderDetailModel> orders;

  const OrderListWidget({super.key, required this.orders});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedOrder = ref.watch(historyDetailProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          color: Colors.grey[50],
          child: Row(
            children: [
              Text(
                'Order History (${orders.length})',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Spacer(),
              IconButton(
                icon: Icon(Icons.refresh, color: Colors.blue[700]),
                onPressed: () {
                  ref.invalidate(orderHistoryProvider);
                },
              ),
            ],
          ),
        ),
        Expanded(
          child:
              orders.isEmpty
                  ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'No orders found',
                          style: TextStyle(fontSize: 16, color: Colors.grey),
                        ),
                      ],
                    ),
                  )
                  : ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: orders.length,
                    itemBuilder: (context, index) {
                      final order = orders[index];
                      final isSelected = selectedOrder?.id == order.id;

                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        elevation: isSelected ? 4 : 1,
                        color: isSelected ? Colors.blue[50] : Colors.white,
                        child: ListTile(
                          leading: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: _getStatusColor(order.paymentStatus!),
                              borderRadius: BorderRadius.circular(24),
                            ),
                            child: Icon(
                              _getStatusIcon(order.paymentStatus!),
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                          title: Text(
                            order.orderId!,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${order.user} • ${OrderTypeExtension.orderTypeToJson(order.orderType)}',
                                style: TextStyle(color: Colors.grey[600]),
                              ),
                              Text(
                                DateFormat(
                                  'dd MMM yyyy, HH:mm',
                                ).format(order.createdAt!),
                                style: TextStyle(
                                  color: Colors.grey[500],
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _getStatusColor(order.paymentStatus!),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  order.status.name.toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                formatRupiah(order.grandTotal),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.green,
                                ),
                              ),
                            ],
                          ),
                          onTap: () {
                            ref
                                .read(historyDetailProvider.notifier)
                                .addToHistoryDetail(order);
                          },
                        ),
                      );
                    },
                  ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Icons.check_circle;
      case 'pending':
        return Icons.access_time;
      case 'cancelled':
        return Icons.cancel;
      default:
        return Icons.receipt;
    }
  }
}
