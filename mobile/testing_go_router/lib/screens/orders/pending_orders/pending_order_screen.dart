import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/order_detail_providers/pending_order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/saved_order_provider.dart';
import 'package:kasirbaraja/screens/orders/pending_orders/widgets/order_detail_widget.dart';
import 'package:kasirbaraja/screens/orders/pending_orders/widgets/order_list_widget.dart';
import 'package:kasirbaraja/screens/orders/pending_orders/widgets/payment_details_widget.dart';

class PendingOrderScreen extends ConsumerWidget {
  const PendingOrderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // USE SAVED ORDER PROVIDER (LOCAL OPEN BILLS)
    final ordersAsync = ref.watch(savedOrderProvider);
    final selectedOrder = ref.watch(pendingOrderDetailProvider);

    return Row(
      children: [
        // Modern Left Panel - Order List
        Expanded(
          flex: 3,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.grey.shade50, Colors.white],
              ),
              border: Border(
                right: BorderSide(color: Colors.grey.shade200, width: 1),
              ),
            ),
            child: Column(
              children: [
                // Modern Header
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(
                      bottom: BorderSide(color: Colors.grey.shade200, width: 1),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ordersAsync.when(
                    data:
                        (orders) =>
                            _buildStatisticsRow(context, orders.length, ref),
                    loading: () => _buildStatisticsLoadingSkeleton(),
                    error: (_, __) => const SizedBox(),
                  ),
                ),

                // Order List Content
                Expanded(
                  child: ordersAsync.when(
                    data:
                        (orders) =>
                            orders.isEmpty
                                ? _buildEmptyOrdersState()
                                : OrderListWidget(orders: orders),
                    loading: () => _buildLoadingState(),
                    error: (error, _) => _buildErrorState(error, ref),
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
            decoration: BoxDecoration(color: Colors.grey[50]),
            child:
                selectedOrder != null
                    ? OrderDetailWidget(order: selectedOrder)
                    : Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.touch_app,
                            size: 64,
                            color: Colors.grey[300],
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Select an order to view details',
                            style: TextStyle(fontSize: 16, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
          ),
        ),

        // Right Panel - Order Items
        Expanded(
          flex: 3,
          child: Container(
            decoration: BoxDecoration(color: Colors.grey[50]),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: const Row(
                    children: [
                      Icon(Icons.receipt_long, color: Colors.orange),
                      SizedBox(width: 8),
                      Text(
                        'Payment details',
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
                          ? const PaymentDetailsWidget()
                          : const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.receipt_long,
                                  size: 64,
                                  color: Colors.grey,
                                ),
                                SizedBox(width: 16),
                                Text(
                                  'No details to display',
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
      ],
    );
  }
}

Widget _buildStatisticsRow(
  BuildContext context,
  int orderCount,
  WidgetRef ref,
) {
  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      gradient: LinearGradient(
        colors: [
          Colors.blue.withValues(alpha: 0.08),
          Colors.blue.withValues(alpha: 0.04),
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.blue.withValues(alpha: 0.2)),
    ),
    child: Row(
      children: [
        // Total Orders
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.receipt_long_rounded,
                    size: 16,
                    color: Colors.blue.shade600,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Saved Orders',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.blue.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                orderCount.toString(),
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade700,
                ),
              ),
            ],
          ),
        ),

        // Divider
        Container(
          width: 1,
          height: 40,
          color: Colors.blue.withValues(alpha: 0.2),
        ),

        const SizedBox(width: 8),
        Padding(
          padding: const EdgeInsets.only(left: 0),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: IconButton(
              icon: const Icon(Icons.refresh_rounded, color: Colors.grey),
              onPressed: () {
                ref.read(savedOrderProvider.notifier).refresh();
                ref
                    .read(pendingOrderDetailProvider.notifier)
                    .clearPendingOrderDetail();
              },
              tooltip: 'Refresh Orders',
            ),
          ),
        ),
      ],
    ),
  );
}

// Unused scan handler logic kept for reference or re-enable if needed
// void _handleScannedData(...)

Widget _buildStatisticsLoadingSkeleton() {
  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.grey.shade100,
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 80,
                height: 12,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 20,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

Widget _buildEmptyOrdersState() {
  return Container(
    padding: const EdgeInsets.all(8),
    child: SingleChildScrollView(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.blue.withValues(alpha: 0.1),
                  Colors.blue.withValues(alpha: 0.05),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.shopping_cart_rounded,
              size: 60,
              color: Colors.blue.shade300,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No saved orders',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your saved Open Bills will appear here',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}

Widget _buildLoadingState() {
  return Container(
    padding: const EdgeInsets.all(20),
    child: const Center(child: CircularProgressIndicator()),
  );
}

Widget _buildErrorState(dynamic error, WidgetRef ref) {
  return Container(
    padding: const EdgeInsets.all(32),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.error_outline, size: 48, color: Colors.red),
        const SizedBox(height: 16),
        Text('Error: $error'),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: () => ref.read(savedOrderProvider.notifier).refresh(),
          child: const Text('Retry'),
        ),
      ],
    ),
  );
}
