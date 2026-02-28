import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/utils/payment_details_utils.dart';

class OrderListWidget extends StatelessWidget {
  final List<OrderDetailModel> orders;
  final OrderDetailModel? selectedOrder;
  final Function(OrderDetailModel) onSelect;
  final VoidCallback? onRefresh;

  const OrderListWidget({
    super.key,
    required this.orders,
    this.selectedOrder,
    required this.onSelect,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    // 1) Sort DESC by updatedAt
    final sorted = [...orders]..sort(
      (a, b) => (b.updatedAt ?? DateTime(1970)).compareTo(
        a.updatedAt ?? DateTime(1970),
      ),
    );

    String keyOf(DateTime? d) =>
        DateFormat('yyyy-MM-dd').format(d ?? DateTime(1970));

    // 2) Precompute stats per day (count + total grandTotal)
    final Map<String, _DayStat> stats = {};
    for (final o in sorted) {
      final k = keyOf(o.updatedAt);
      stats.putIfAbsent(k, () => _DayStat());
      stats[k]!.count += 1;
      stats[k]!.total += (o.grandTotal);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          color: Colors.grey[50],
          child: Row(
            children: [
              Text(
                'Orders (${sorted.length})',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              if (onRefresh != null)
                IconButton(
                  icon: Icon(Icons.refresh, color: Colors.blue[700]),
                  onPressed: onRefresh,
                ),
            ],
          ),
        ),
        // List
        Expanded(
          child:
              sorted.isEmpty
                  ? const _EmptyState()
                  : ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: sorted.length,
                    itemBuilder: (context, index) {
                      final order = sorted[index];
                      final isSelected = selectedOrder?.id == order.id;

                      final currKey = keyOf(order.updatedAt);
                      final prevKey =
                          index == 0
                              ? null
                              : keyOf(sorted[index - 1].updatedAt);
                      final isFirstOfDay = index == 0 || currKey != prevKey;

                      final dayStat = stats[currKey]!; // sudah dipastikan ada

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (isFirstOfDay)
                            _DateHeader(
                              date: order.updatedAt,
                              count: dayStat.count,
                              total: dayStat.total,
                            ),
                          Card(
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            elevation: isSelected ? 4 : 1,
                            color: isSelected ? Colors.blue[50] : Colors.white,
                            child: ListTile(
                              title: Text(
                                order.payments.isNotEmpty
                                    ? order.payments
                                        .map(
                                          (p) =>
                                              PaymentDetails.buildPaymentMethodLabel(
                                                p,
                                              ),
                                        )
                                        .join(', ')
                                    : (order.paymentMethod ??
                                        'No Payment Method'),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              subtitle: Text(
                                formatRupiah(order.grandTotal),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
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
                                        order.status.name,
                                      ), // Updated to use enum name
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
                                    DateFormat(
                                      'dd MMM yyyy, HH:mm',
                                    ).format(order.updatedAt ?? DateTime.now()),
                                    style: TextStyle(
                                      color: Colors.grey[500],
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              onTap: () => onSelect(order),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
        ),
      ],
    );
  }
}

/// Model statistik per hari
class _DayStat {
  int count = 0;
  int total = 0; // akumulasi grandTotal (Rp)
}

/// Header tanggal + ringkasan hari
class _DateHeader extends StatelessWidget {
  final DateTime? date;
  final int count;
  final int total;

  const _DateHeader({
    required this.date,
    required this.count,
    required this.total,
  });

  String _prettyDate(DateTime d) {
    final now = DateTime.now();
    bool sameDay(DateTime a, DateTime b) =>
        a.year == b.year && a.month == b.month && a.day == b.day;

    if (sameDay(d, now)) return 'Hari ini';
    if (sameDay(d, now.subtract(const Duration(days: 1)))) return 'Kemarin';
    return DateFormat(
      'EEEE, dd MMM yyyy',
      'id_ID',
    ).format(d); // e.g. Senin, 04 Nov 2025
  }

  @override
  Widget build(BuildContext context) {
    final d = date ?? DateTime.now();
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 12, 4, 6),
      child: Row(
        children: [
          Text(
            _prettyDate(d),
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: Colors.grey[800],
            ),
          ),
          const SizedBox(width: 4),
          Expanded(child: Divider(color: Colors.grey[300], thickness: 1)),
          const SizedBox(width: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green[50],
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.green.shade100),
            ),
            child: Text(
              '$count pesanan',
              style: TextStyle(
                color: Colors.green[800],
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) {
    return const Center(
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
    );
  }
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
