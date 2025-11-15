import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/enums/order_status.dart';
import 'package:kasirbaraja/enums/order_type.dart';
import 'package:kasirbaraja/models/try/activity_model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/pending_order_detail_provider.dart';
import 'package:kasirbaraja/providers/sockets/connect_to_socket.dart';
import 'package:kasirbaraja/services/order_history_service.dart';
import 'package:kasirbaraja/providers/orders/pending_order_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

import '../../../widgets/scanner/qrscanner.dart';
import 'package:kasirbaraja/screens/orders/pending_orders/widgets/order_list_widget.dart';
import 'package:kasirbaraja/screens/orders/pending_orders/widgets/order_detail_widget.dart';
import 'package:kasirbaraja/screens/orders/pending_orders/widgets/payment_details_widget.dart';

class PendingOrderScreen extends ConsumerWidget {
  const PendingOrderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(pendingOrderProvider);
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
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ordersAsync.when(
                    data:
                        (orders) => _buildStatisticsRow(
                          context,
                          orders?.length ?? 0,
                          ref,
                        ),
                    loading: () => _buildStatisticsLoadingSkeleton(),
                    error: (_, __) => const SizedBox(),
                  ),
                ),

                // Order List Content
                Expanded(
                  child: ordersAsync.when(
                    data:
                        (orders) =>
                            orders == null || orders.isEmpty
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
                          SizedBox(height: 16),
                          Text(
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
                          ? PaymentDetailsWidget()
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

// Helper Methods (add these as static methods in your class or as separate functions)

Widget _buildStatisticsRow(
  BuildContext context,
  int orderCount,
  WidgetRef ref,
) {
  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      gradient: LinearGradient(
        colors: [Colors.blue.withOpacity(0.08), Colors.blue.withOpacity(0.04)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.blue.withOpacity(0.2)),
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
                    'Total Orders',
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
        Container(width: 1, height: 40, color: Colors.blue.withOpacity(0.2)),

        // Scan Qr code button,
        // Padding(
        //   padding: const EdgeInsets.only(left: 16),
        //   child: IconButton(
        //     style: IconButton.styleFrom(
        //       backgroundColor: Colors.blue.withOpacity(0.1),
        //       padding: const EdgeInsets.all(12),
        //       shape: RoundedRectangleBorder(
        //         borderRadius: BorderRadius.circular(10),
        //       ),
        //     ),
        //     icon: Icon(
        //       Icons.qr_code_scanner_rounded,
        //       size: 24,
        //       color: Colors.blue.shade600,
        //     ),
        //     onPressed: () {
        //       showDialog(
        //         context: context,
        //         builder:
        //             (context) => QRScannerOverlay(
        //               onScanned: (scannedData) {
        //                 _handleScannedData(context, ref, scannedData);
        //               },
        //             ),
        //       );
        //     },
        //     tooltip: 'Scan QR Code',
        //   ),
        // ),
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
                ref.read(pendingOrderProvider.notifier).refresh();
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

void _handleScannedData(
  BuildContext context,
  WidgetRef ref,
  String scannedData,
) {
  try {
    final orderId = scannedData.trim();

    final currentOrders = ref.read(pendingOrderProvider).value;
    if (currentOrders != null) {
      final foundOrder =
          currentOrders.where((order) => order.orderId == orderId).firstOrNull;

      if (foundOrder != null) {
        ref.read(pendingOrderDetailProvider.notifier).clearPendingOrderDetail();
        ref
            .read(pendingOrderDetailProvider.notifier)
            .savedPendingOrderDetail(foundOrder);

        _showSuccessSnackBar(context, 'Order ditemukan: $orderId');
      } else {
        _showErrorSnackBar(context, 'Order dengan ID $orderId tidak ditemukan');
      }
    } else {
      _showErrorSnackBar(context, 'Data order tidak tersedia');
    }
  } catch (e) {
    _showErrorSnackBar(context, 'Gagal memproses data QR: $e');
  }
}

void _showSuccessSnackBar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: Colors.green,
      behavior: SnackBarBehavior.floating,
    ),
  );
}

void _showErrorSnackBar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: Colors.red,
      behavior: SnackBarBehavior.floating,
    ),
  );
}

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
        Container(width: 1, height: 40, color: Colors.grey.shade300),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(left: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 60,
                  height: 12,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 30,
                  height: 16,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
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
                  Colors.blue.withOpacity(0.1),
                  Colors.blue.withOpacity(0.05),
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
            'No orders yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'New orders will appear here automatically',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.blue.withOpacity(0.1),
                  Colors.blue.withOpacity(0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.blue.withOpacity(0.2)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  size: 16,
                  color: Colors.blue.shade600,
                ),
                const SizedBox(width: 8),
                Text(
                  'Orders update in real-time',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.blue.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

Widget _buildLoadingState() {
  return Container(
    padding: const EdgeInsets.all(20),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.blue.withOpacity(0.1),
                Colors.blue.withOpacity(0.05),
              ],
            ),
            shape: BoxShape.circle,
          ),
          child: const Padding(
            padding: EdgeInsets.all(20),
            child: CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
            ),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Loading orders...',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Please wait while we fetch the latest data',
          style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
        ),
      ],
    ),
  );
}

Widget _buildErrorState(dynamic error, WidgetRef ref) {
  return Container(
    padding: const EdgeInsets.all(32),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.red.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.error_outline_rounded,
            size: 48,
            color: Colors.red,
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Something went wrong',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Unable to load orders. Please try again.',
          style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: () {
            ref.read(pendingOrderProvider.notifier).refresh();
          },
          icon: const Icon(Icons.refresh_rounded, size: 18),
          label: const Text('Try Again'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 4,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Error: ${error.toString()}',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade500,
            fontFamily: 'monospace',
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    ),
  );
}
