import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/payments/payment_action.model.dart';
import 'package:kasirbaraja/models/payments/va_number.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/utils/payment_details_utils.dart';

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
                color: Colors.green.withValues(alpha: 0.3),
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
          arguments['isCloseBill'] == true
              ? 'Bill Berhasil Ditutup!'
              : 'Pembayaran Berhasil!',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 8),

        // Subtitle
        Text(
          arguments['isCloseBill'] == true
              ? 'Open bill telah ditutup dan dibayar'
              : 'Terima kasih atas transaksi Anda',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 40),

        // Change Amount Card
        _buildChangeCard(context, orderDetail),

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
                      color: Colors.green.withValues(alpha: 0.3),
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
                arguments['isCloseBill'] == true
                    ? 'Bill Berhasil Ditutup!'
                    : 'Pembayaran Berhasil!',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 4),

              // Subtitle
              Text(
                arguments['isCloseBill'] == true
                    ? 'Open bill telah ditutup dan dibayar'
                    : 'Terima kasih atas transaksi Anda',
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
              _buildChangeCard(context, orderDetail),

              const SizedBox(height: 24),

              // Action Buttons
              _buildActionButtons(context, ref, orderDetail),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildChangeCard(BuildContext context, OrderDetailModel? orderDetail) {
    final isLandscape =
        MediaQuery.of(context).orientation == Orientation.landscape;

    // Ambil list payments dari orderDetail
    // TODO: sesuaikan dengan field di OrderDetailModel kamu
    final payments = orderDetail?.payments ?? [];

    // Hitung kembalian
    double changeValue = 0;
    for (var payment in payments) {
      changeValue += payment.changeAmount ?? 0;
    }

    String changeText;
    if (changeValue == 0) {
      changeText = 'Tidak ada kembalian';
    } else if (changeValue < 0) {
      changeText = 'Kembalian tidak valid';
    } else {
      changeText = formatRupiah(changeValue.toInt());
    }

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(isLandscape ? 16 : 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade200,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Detail metode pembayaran
          if (payments.isNotEmpty) ...[
            Text(
              'Detail Pembayaran',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 8),
            Column(
              children:
                  payments.map<Widget>((p) {
                    final String methodLabel =
                        PaymentDetails.buildPaymentMethodLabel(p);

                    final num paidAmount =
                        p.amount; // misal: p.amount / p.paidAmount
                    final num? paymentChange =
                        p.changeAmount; // kalau tidak ada, hapus saja logika ini

                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Label metode (sudah diatur logikanya di helper)
                                Text(
                                  methodLabel,
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Dibayar: ${formatRupiah(paidAmount.toInt())}',
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(color: Colors.grey[600]),
                                ),
                                if (paymentChange != null &&
                                    paymentChange > 0) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    'Kembalian: ${formatRupiah(paymentChange.toInt())}',
                                    style: Theme.of(
                                      context,
                                    ).textTheme.bodySmall?.copyWith(
                                      color: Colors.green[700],
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
            ),
          ] else
            Text(
              'Tidak ada data pembayaran',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.grey[500]),
            ),

          const SizedBox(height: 16),
          const Divider(),
          // Title kembalian
          Center(
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
                    changeText,
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.green.shade600,
                    ),
                  ),
                ),
              ],
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

    return Row(
      children: [
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
}
