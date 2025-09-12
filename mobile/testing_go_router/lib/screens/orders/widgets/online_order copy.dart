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

class OnlineOrder extends ConsumerStatefulWidget {
  const OnlineOrder({super.key});

  @override
  ConsumerState<OnlineOrder> createState() => _OnlineOrderState();
}

class _OnlineOrderState extends ConsumerState<OnlineOrder> {
  bool _showQRScanner = false;

  @override
  Widget build(BuildContext context) {
    final onlineOrder = ref.watch(onlineOrderProvider);

    print('Online order state: $onlineOrder');

    return Scaffold(
      body: Stack(
        children: [
          // Main content
          _buildBody(context, ref, onlineOrder),

          // QR Scanner overlay
          if (_showQRScanner)
            Positioned(
              top: 10, // Position below the top navigation
              left: 20,
              right: 20,
              bottom: 10,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: QRScannerOverlay(
                  onScanned: (scannedData) {
                    _handleScannedData(context, ref, scannedData);
                  },
                  // onClose: () {
                  //   setState(() {
                  //     _showQRScanner = false;
                  //   });
                  // },
                ),
              ),
            ),
        ],
      ),
      floatingActionButton: _buildQRFloatingButton(context, ref),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    AsyncValue onlineOrder,
  ) {
    if (onlineOrder is AsyncData && (onlineOrder.value?.isEmpty ?? true)) {
      return _buildEmptyState();
    }

    return onlineOrder.when(
      data: (data) => _buildOrdersList(context, ref, data),
      error: (error, stackTrace) => _buildErrorState(error),
      loading: () => _buildLoadingState(),
    );
  }

  Widget _buildQRFloatingButton(BuildContext context, WidgetRef ref) {
    return FloatingActionButton(
      onPressed: () {
        setState(() {
          _showQRScanner = !_showQRScanner;
        });
      },
      backgroundColor: _showQRScanner ? Colors.red : Colors.blue,
      foregroundColor: Colors.white,
      child: Icon(_showQRScanner ? Icons.close : Icons.qr_code_scanner),
    );
  }

  void _handleScannedData(
    BuildContext context,
    WidgetRef ref,
    String scannedData,
  ) {
    try {
      final orderId = scannedData.trim();

      final currentOrders = ref.read(onlineOrderProvider).value;
      if (currentOrders != null) {
        final foundOrder =
            currentOrders
                .where((order) => order.orderId == orderId)
                .firstOrNull;

        if (foundOrder != null) {
          ref.read(onlineOrderDetailProvider.notifier).clearOnlineOrderDetail();
          ref
              .read(onlineOrderDetailProvider.notifier)
              .savedOnlineOrderDetail(foundOrder);

          setState(() {
            _showQRScanner = false;
          });

          _showSuccessSnackBar(context, 'Order ditemukan: $orderId');
        } else {
          _showErrorSnackBar(
            context,
            'Order dengan ID $orderId tidak ditemukan',
          );
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

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Belum ada pesanan online',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Pesanan online akan muncul di sini',
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Memuat pesanan...'),
        ],
      ),
    );
  }

  Widget _buildErrorState(dynamic error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
          const SizedBox(height: 16),
          Text(
            'Terjadi kesalahan',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Colors.red[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Error: $error',
            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildOrdersList(
    BuildContext context,
    WidgetRef ref,
    List<dynamic> data,
  ) {
    return RefreshIndicator(
      onRefresh: () async => ref.refresh(onlineOrderProvider.future),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: data.length,
        itemBuilder: (context, index) {
          final order = data[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _buildOrderCard(context, ref, order),
          );
        },
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, WidgetRef ref, dynamic order) {
    final orderStatus = OrderStatusExtension.orderStatusToJson(order.status);
    final orderType = OrderTypeExtension.orderTypeToJson(order.orderType);
    return Card(
      elevation: 2,
      shadowColor: Colors.black.withOpacity(0.1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          // print(order?.paymentStatus);
          ref.read(onlineOrderDetailProvider.notifier).clearOnlineOrderDetail();
          ref
              .read(onlineOrderDetailProvider.notifier)
              .savedOnlineOrderDetail(order);
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              // Status indicator
              Container(
                width: 4,
                height: 80,
                decoration: BoxDecoration(
                  color: _getStatusColor(orderStatus),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 20),
              // Order icon
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: _getStatusColor(orderStatus).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _getOrderIcon(orderType),
                  color: _getStatusColor(orderStatus),
                  size: 28,
                ),
              ),
              const SizedBox(width: 20),
              // Order details - Left column
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            order.user ?? 'Customer',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 18,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        _buildStatusChip(orderStatus),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _getOrderTypeText(orderType),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.receipt_outlined,
                          size: 16,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            order.orderId ?? '',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              // Order details - Right column
              Expanded(
                flex: 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      formatRupiah(order.grandTotal!.toInt()),
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 20,
                        color: Colors.green[600],
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (order.items.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          order.items.first.menuItem.mainCategory ?? '',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[700],
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),
                    Text(
                      '${order.items.length} item${order.items.length > 1 ? 's' : ''}',
                      style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Arrow icon
              Icon(Icons.chevron_right, color: Colors.grey[400], size: 28),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        _getStatusText(status),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: _getStatusColor(status),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'processing':
        return Colors.blue;
      case 'ready':
        return Colors.green;
      case 'completed':
        return Colors.teal;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Menunggu';
      case 'processing':
        return 'Diproses';
      case 'ready':
        return 'Siap';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  }

  String _getOrderTypeText(String orderType) {
    switch (orderType.toLowerCase()) {
      case 'delivery':
        return 'Delivery';
      case 'pickup':
        return 'Pickup';
      case 'dinein':
        return 'Dine In';
      default:
        return orderType;
    }
  }

  IconData _getOrderIcon(String orderType) {
    switch (orderType.toLowerCase()) {
      case 'delivery':
        return Icons.delivery_dining;
      case 'pickup':
        return Icons.store;
      case 'dinein':
        return Icons.restaurant;
      default:
        return Icons.receipt;
    }
  }
}
