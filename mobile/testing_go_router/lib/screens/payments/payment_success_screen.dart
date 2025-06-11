import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';

class PaymentSuccessScreen extends ConsumerWidget {
  const PaymentSuccessScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    //order detail provider
    final orderDetail = ref.watch(orderDetailProvider);
    final savedPrinter = ref.read(savedPrintersProvider.notifier);

    //menerima extra
    final arguments = GoRouterState.of(context).extra as Map<String, dynamic>;

    return Scaffold(
      body: Center(
        child: Column(
          children: [
            Text('PaymentSuccessScreen'),
            Text('Kembalian : ${arguments['change']}'),
            ElevatedButton(
              onPressed: () {
                savedPrinter.printToPrinter(orderDetail!, 'bar');
              },
              child: const Text('Print to Bar Printer'),
            ),
            ElevatedButton(
              onPressed: () {
                savedPrinter.printToPrinter(orderDetail!, 'kitchen');
              },
              child: const Text('Print to Kitchen Printer'),
            ),
            ElevatedButton(
              onPressed: () {
                savedPrinter.printToPrinter(orderDetail!, 'all');
              },
              child: const Text('Print to Bar and Kitchen Printer'),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ref.read(orderDetailProvider.notifier).clearOrder();
          context.goNamed('main');
        },
        child: const Icon(Icons.home),
      ),
    );
  }
}
