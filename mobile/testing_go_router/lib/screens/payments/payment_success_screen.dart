import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';

class PaymentSuccessScreen extends ConsumerWidget {
  const PaymentSuccessScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savedPrinter = ref.read(savedPrintersProvider.notifier);
    final arguments = GoRouterState.of(context).extra as Map<String, dynamic>;
    final orderDetail = arguments['orderDetail'] as OrderDetailModel?;

    // Deteksi orientasi untuk responsive design
    final isLandscape =
        MediaQuery.of(context).orientation == Orientation.landscape;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.all(isLandscape ? 16.0 : 24.0),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight:
                    screenHeight -
                    MediaQuery.of(context).padding.top -
                    MediaQuery.of(context).padding.bottom,
              ),
              child:
                  isLandscape
                      ? _buildLandscapeLayout(
                        context,
                        arguments,
                        ref,
                        orderDetail,
                      )
                      : _buildPortraitLayout(
                        context,
                        arguments,
                        ref,
                        orderDetail,
                      ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPortraitLayout(
    BuildContext context,
    Map<String, dynamic> arguments,
    WidgetRef ref,
    OrderDetailModel? orderDetail,
  ) {
    return Column(
      children: [
        // Header dengan spacing
        const SizedBox(height: 40),

        // Success Icon dengan animasi
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            color: Colors.green.shade100,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.green.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Icon(
            Icons.check_circle,
            size: 80,
            color: Colors.green.shade600,
          ),
        ),

        const SizedBox(height: 32),

        // Success Title
        Text(
          'Pembayaran Berhasil!',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 8),

        // Subtitle
        Text(
          'Terima kasih atas transaksi Anda',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 40),

        // Change Amount Card
        _buildChangeCard(context, arguments),

        const SizedBox(height: 40),

        // Action Buttons
        _buildActionButtons(context, ref, orderDetail),

        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildLandscapeLayout(
    BuildContext context,
    Map<String, dynamic> arguments,
    WidgetRef ref,
    OrderDetailModel? orderDetail,
  ) {
    return Row(
      children: [
        // Left side - Icon and Title
        Expanded(
          flex: 1,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Success Icon dengan ukuran lebih kecil untuk landscape
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.green.withOpacity(0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.check_circle,
                  size: 50,
                  color: Colors.green.shade600,
                ),
              ),

              const SizedBox(height: 16),

              // Success Title
              Text(
                'Pembayaran Berhasil!',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 4),

              // Subtitle
              Text(
                'Terima kasih atas transaksi Anda',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),

        const SizedBox(width: 24),

        // Right side - Change and Actions
        Expanded(
          flex: 1,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Change Amount Card
              _buildChangeCard(context, arguments),

              const SizedBox(height: 24),

              // Action Buttons
              _buildActionButtons(context, ref, orderDetail),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildChangeCard(
    BuildContext context,
    Map<String, dynamic> arguments,
  ) {
    final isLandscape =
        MediaQuery.of(context).orientation == Orientation.landscape;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(isLandscape ? 16 : 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            'Kembalian',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: isLandscape ? 4 : 8),
          FittedBox(
            child: Text(
              arguments['change'] == null
                  ? 'Tidak ada kembalian'
                  : arguments['change'] == 0
                  ? 'Tidak ada kembalian'
                  : arguments['change'] < 0
                  ? 'Kembalian tidak valid'
                  : 'Rp ${arguments['change']?.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.green.shade600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(
    BuildContext context,
    WidgetRef ref,
    OrderDetailModel? orderDetail,
  ) {
    final isLandscape =
        MediaQuery.of(context).orientation == Orientation.landscape;
    // final orderDetail = ref.watch(orderDetailProvider);
    final savedPrinter = ref.read(savedPrintersProvider.notifier);

    return Row(
      children: [
        // Print Receipt Button
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () {
              savedPrinter.printToPrinter(
                orderDetail: orderDetail!,
                printType: 'all',
              );
              // Implementasi print receipt
            },
            icon: const Icon(Icons.print),
            label: const Text('Print Struk'),
            style: OutlinedButton.styleFrom(
              padding: EdgeInsets.symmetric(vertical: isLandscape ? 12 : 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              side: BorderSide(color: Colors.blue.shade300),
              foregroundColor: Colors.blue.shade600,
            ),
          ),
        ),

        const SizedBox(width: 16),

        // New Transaction Button
        Expanded(
          flex: 2,
          child: ElevatedButton.icon(
            onPressed: () {
              ref.read(orderDetailProvider.notifier).clearOrder();
              context.goNamed('main');
            },
            icon: const Icon(Icons.add_shopping_cart),
            label: const Text('Transaksi Baru'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue.shade600,
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(vertical: isLandscape ? 12 : 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 2,
            ),
          ),
        ),
      ],
    );
  }

  // Widget untuk section print (optional)
  Widget _buildPrintSection(BuildContext context, savedPrinter, orderDetail) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Opsi Cetak',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          const SizedBox(height: 16),

          // Print to Bar
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                savedPrinter.printToPrinter(orderDetail!, 'bar');
              },
              icon: const Icon(Icons.local_bar),
              label: const Text('Print ke Bar'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),

          const SizedBox(height: 8),

          // Print to Kitchen
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                savedPrinter.printToPrinter(orderDetail!, 'kitchen');
              },
              icon: const Icon(Icons.restaurant),
              label: const Text('Print ke Kitchen'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),

          const SizedBox(height: 8),

          // Print to All
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                savedPrinter.printToPrinter(orderDetail!, 'all');
              },
              icon: const Icon(Icons.print),
              label: const Text('Print ke Semua'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange.shade600,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
