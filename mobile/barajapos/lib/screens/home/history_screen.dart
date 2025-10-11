import 'package:barajapos/providers/auth_provider.dart';
import 'package:barajapos/providers/order_detail_providers/history_detail_provider.dart';
import 'package:barajapos/utils/format_rupiah.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:barajapos/providers/orders/order_history_provider.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    final cashierId = ref.read(authCashierProvider).value?.id ?? '';
    if (cashierId.isNotEmpty) {
      Future.microtask(() {
        ref.read(orderHistoryProvider.notifier).getOrderHistory(cashierId);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final history = ref.watch(orderHistoryProvider);

    return history.when(
      data: (list) => ListView.builder(
        itemCount: list.length,
        itemBuilder: (context, index) {
          final order = list[index];
          return ListTile(
            title: Text(order.customerName ?? 'Tanpa ID'),
            subtitle: Text(formatRupiah(order.totalPrice!.toInt())),
            onTap: () {
              // Clear previous history detail
              ref.read(historyDetailProvider.notifier).clearHistoryDetail();
              // Navigate to order detail screen
              ref
                  .read(historyDetailProvider.notifier)
                  .addToHistoryDetail(order);
            },
          );
        },
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('Gagal memuat data: $err')),
    );
  }
}
