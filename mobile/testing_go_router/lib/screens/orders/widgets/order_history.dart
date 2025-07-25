import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/history_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/order_history_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

// class OrderHistory extends ConsumerWidget {
//   const OrderHistory({super.key});

//   @override
//   Widget build(BuildContext context, WidgetRef ref) {
//     // final cashierId = ref.read(authCashierProvider).value?.id ?? '';
//     // ref.read(orderHistoryProvider.notifier).getOrderHistory(cashierId);
//     print('build order history');
//     final history = ref.watch(orderHistoryProvider);

//     return history.when(
//       data:
//           (list) => RefreshIndicator(
//             onRefresh: () async {
//               // Refresh the order history
//               await ref.read(orderHistoryProvider.notifier).refreshHistory();
//             },
//             child: ListView.builder(
//               itemCount: list.length,
//               itemBuilder: (context, index) {
//                 final order = list[index];
//                 return ListTile(
//                   title: Text(order.customerName ?? 'Tanpa ID'),
//                   subtitle: Text(formatRupiah(order.totalPrice!.toInt())),
//                   onTap: () {
//                     // // Clear previous history detail
//                     // ref
//                     //     .read(historyDetailProvider.notifier)
//                     //     .clearHistoryDetail();
//                     // // Navigate to order detail screen
//                     // ref
//                     //     .read(historyDetailProvider.notifier)
//                     //     .addToHistoryDetail(order);
//                   },
//                 );
//               },
//             ),
//           ),
//       loading: () => const Center(child: CircularProgressIndicator()),
//       error: (err, _) => Center(child: Text('Gagal memuat data: $err')),
//     );
//   }
// },

class OrderHistory extends ConsumerWidget {
  const OrderHistory({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    print('build order history');
    final history = ref.watch(orderHistoryProvider);

    print('Order history state: $history');

    return history.when(
      data:
          (list) =>
              list.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                    onRefresh: () async {
                      await ref
                          .read(orderHistoryProvider.notifier)
                          .refreshHistory();
                    },
                    color: Colors.blue,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(8),
                      itemCount: list.length,
                      itemBuilder: (context, index) {
                        final order = list[index];
                        return _buildOrderCard(context, order, index, ref);
                      },
                    ),
                  ),
      loading: () => _buildLoadingState(),
      error: (err, _) => _buildErrorState(err.toString(), ref),
    );
  }

  Widget _buildOrderCard(
    BuildContext context,
    dynamic order,
    int index,
    WidgetRef ref,
  ) {
    return Card(
      elevation: 2,
      shadowColor: Colors.transparent,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          // Hapus komentar untuk mengaktifkan navigasi
          ref.read(historyDetailProvider.notifier).clearHistoryDetail();
          ref.read(historyDetailProvider.notifier).addToHistoryDetail(order);

          // Tambahkan feedback haptic
          HapticFeedback.lightImpact();
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.receipt_long,
                      color: Colors.blue,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.user ?? 'Pelanggan #${index + 1}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          (order.cashierId == null || order.cashierId == "")
                              ? 'cashier: -'
                              : order.cashierId,
                          style: TextStyle(fontSize: 12, color: Colors.black),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: Colors.grey[400],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green, width: 1),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Total Pembayaran',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      formatRupiah(order.grandTotal.toInt() ?? 0),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF4CAF50),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.history, size: 64, color: Colors.grey[400]),
          ),
          const SizedBox(height: 24),
          Text(
            'Belum Ada Riwayat Pesanan',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Riwayat pesanan akan muncul di sini\nsetelah Anda melakukan transaksi',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2196F3)),
          ),
          const SizedBox(height: 16),
          Text(
            'Memuat riwayat pesanan...',
            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error, WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.red[50],
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red[400],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Gagal Memuat Data',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                ref.read(orderHistoryProvider.notifier).refreshHistory();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Coba Lagi'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2196F3),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // String _formatDate(dynamic date) {
  //   if (date == null) return 'Tanggal tidak tersedia';

  //   try {
  //     DateTime dateTime;
  //     if (date is String) {
  //       dateTime = DateTime.parse(date);
  //     } else if (date is DateTime) {
  //       dateTime = date;
  //     } else {
  //       return 'Tanggal tidak valid';
  //     }

  //     // Format: 15 Jan 2024, 14:30
  //     final months = [
  //       '',
  //       'Jan',
  //       'Feb',
  //       'Mar',
  //       'Apr',
  //       'Mei',
  //       'Jun',
  //       'Jul',
  //       'Ags',
  //       'Sep',
  //       'Okt',
  //       'Nov',
  //       'Des',
  //     ];

  //     final day = dateTime.day;
  //     final month = months[dateTime.month];
  //     final year = dateTime.year;
  //     final hour = dateTime.hour.toString().padLeft(2, '0');
  //     final minute = dateTime.minute.toString().padLeft(2, '0');

  //     return '$day $month $year, $hour:$minute';
  //   } catch (e) {
  //     return 'Format tanggal tidak valid';
  //   }
  // }
}
