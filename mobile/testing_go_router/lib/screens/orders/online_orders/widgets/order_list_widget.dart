import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/enums/order_status.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/enums/order_type.dart';

class OrderListWidget extends ConsumerWidget {
  final List<OrderDetailModel> orders;

  const OrderListWidget({super.key, required this.orders});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedOrder = ref.watch(onlineOrderDetailProvider);

    return orders.isEmpty
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
              color: isSelected ? Colors.blue.shade50 : Colors.white,
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: _getStatusColor(
                    OrderStatusExtension.orderStatusToJson(order.status),
                  ),
                  child: Text(
                    order.orderId!.split('-').last.substring(0, 3),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
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
                      DateFormat('dd MMM yyyy, HH:mm').format(order.createdAt!),
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
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
                        color: _getStatusColor(
                          OrderStatusExtension.orderStatusToJson(order.status),
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        OrderStatusExtension.orderStatusToJson(order.status),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
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
                      .read(onlineOrderDetailProvider.notifier)
                      .savedOnlineOrderDetail(order);
                },
              ),
            );
          },
        );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
