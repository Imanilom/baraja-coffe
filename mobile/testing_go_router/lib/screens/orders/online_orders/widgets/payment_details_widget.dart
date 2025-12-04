import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:go_router/go_router.dart';
import 'buttons/confirm_order_button.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';

// Provider untuk menyimpan tagihan yang dipilih
final selectedPaymentProvider = StateProvider<PaymentModel?>((ref) => null);
final isProcessingConfirmProvider = StateProvider<bool>((ref) => false);

enum _PaymentKind { pending, settlement, refund }

class PaymentDetailsWidget extends ConsumerWidget {
  const PaymentDetailsWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(onlineOrderDetailProvider);
    final selectedPayment = ref.watch(selectedPaymentProvider);
    final isProcessingConfirm = ref.watch(isProcessingConfirmProvider);

    final payments = orders?.payments ?? const <PaymentModel>[];

    String statusOf(PaymentModel p) => (p.status ?? '').toLowerCase();

    final List<PaymentModel> pendingPayments =
        payments.where((p) => statusOf(p) == 'pending').toList();

    final List<PaymentModel> settledPayments =
        payments.where((p) => statusOf(p) == 'settlement').toList();

    final List<PaymentModel> refundPayments =
        payments.where((p) => statusOf(p) == 'refund').toList();

    if (pendingPayments.isEmpty &&
        settledPayments.isEmpty &&
        refundPayments.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No Payment details found',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Pending — bisa dipilih
                if (pendingPayments.isNotEmpty) ...[
                  const Text(
                    'Pilih Tagihan yang Ingin Dibayar:',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...pendingPayments.map(
                    (payment) => _buildPaymentCard(
                      payment: payment,
                      isSelected:
                          selectedPayment?.transactionId ==
                          payment.transactionId,
                      onTap: () {
                        ref.read(selectedPaymentProvider.notifier).state =
                            payment;
                        ref
                            .read(processPaymentRequestProvider.notifier)
                            .selectedPayment(
                              payment.orderId!,
                              payment.transactionId!,
                            );
                      },
                      kind: _PaymentKind.pending, // <<— ubah param
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Settlement (history)
                if (settledPayments.isNotEmpty) ...[
                  const Text(
                    'Riwayat Pembayaran (Lunas):',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...settledPayments.map(
                    (payment) => _buildPaymentCard(
                      payment: payment,
                      isSelected: false,
                      onTap: null,
                      kind: _PaymentKind.settlement,
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Refund (history)
                if (refundPayments.isNotEmpty) ...[
                  const Text(
                    'Riwayat Refund:',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.red,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...refundPayments.map(
                    (payment) => _buildPaymentCard(
                      payment: payment,
                      isSelected: false,
                      onTap: null,
                      kind: _PaymentKind.refund,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        // Tombol Confirmation jika semua tagihan sudah dibayar
        if (pendingPayments.isEmpty &&
            settledPayments.isNotEmpty &&
            settledPayments.any((p) => p.status?.toLowerCase() == 'settlement'))
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  spreadRadius: 1,
                  blurRadius: 5,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ConfirmOrderButton(
                    orderDetail: orders,
                    orderId: orders!.id ?? '',
                    cashierId: '',
                    source: orders.source ?? 'Unknown',
                  ),
                ),
              ],
            ),
          ),

        // Tombol Lanjut Bayar
        if (pendingPayments.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  spreadRadius: 1,
                  blurRadius: 5,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Column(
              children: [
                if (selectedPayment != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.orange.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getPaymentTitle(selectedPayment),
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Total: ${formatRupiah(selectedPayment.amount)}',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.orange,
                              ),
                            ),
                          ],
                        ),
                        const Icon(Icons.check_circle, color: Colors.orange),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed:
                        selectedPayment != null
                            ? () => _processPayment(
                              context,
                              selectedPayment,
                              orders!,
                            )
                            : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey[300],
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      selectedPayment != null
                          ? 'Lanjut Bayar - ${formatRupiah(selectedPayment.amount)}'
                          : 'Pilih Tagihan Terlebih Dahulu',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildPaymentCard({
    required PaymentModel payment,
    required bool isSelected,
    VoidCallback? onTap,
    required _PaymentKind kind,
  }) {
    final Color primaryColor = switch (kind) {
      _PaymentKind.pending => Colors.orange,
      _PaymentKind.settlement => Colors.green,
      _PaymentKind.refund => Colors.red,
    };
    final bool isPending = kind == _PaymentKind.pending;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primaryColor, width: isSelected ? 2.5 : 1),
        boxShadow: [
          BoxShadow(
            color:
                isSelected
                    ? primaryColor.withOpacity(0.15)
                    : Colors.black.withOpacity(0.05),
            blurRadius: isSelected ? 12 : 6,
            offset: const Offset(0, 4),
            spreadRadius: isSelected ? 1 : 0,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          splashColor: primaryColor.withOpacity(0.1),
          highlightColor: primaryColor.withOpacity(0.05),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header dengan icon dan status
                Row(
                  children: [
                    // Payment Icon
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: primaryColor.withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                      child: Icon(
                        _getPaymentIcon(payment, kind),
                        color: primaryColor,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),

                    // Title and Status
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _getPaymentTitle(payment),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color:
                                  isPending ? Colors.black87 : Colors.grey[700],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color:
                                      isPending
                                          ? Colors.orange.withOpacity(0.1)
                                          : Colors.green.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color:
                                        isPending
                                            ? Colors.orange.withOpacity(0.3)
                                            : Colors.green.withOpacity(0.3),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      isPending
                                          ? Icons.schedule_rounded
                                          : Icons.check_circle_rounded,
                                      size: 12,
                                      color: primaryColor,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      isPending ? 'MENUNGGU' : 'LUNAS',
                                      style: TextStyle(
                                        color: primaryColor,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Selection indicator,
                    isPending
                        ? AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color:
                                isSelected ? primaryColor : Colors.transparent,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color:
                                  isSelected
                                      ? primaryColor
                                      : Colors.grey.withOpacity(0.4),
                              width: 2,
                            ),
                          ),
                          child:
                              isSelected
                                  ? const Icon(
                                    Icons.check_rounded,
                                    color: Colors.white,
                                    size: 16,
                                  )
                                  : null,
                        )
                        : const SizedBox.shrink(),
                  ],
                ),

                const SizedBox(height: 20),

                //downpayment amount from amount,
                if (payment.paymentType != null &&
                    payment.paymentType!.toLowerCase() == 'down payment' &&
                    payment.remainingAmount != 0) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.green),
                    ),
                    child: Text(
                      'Jumlah DP: ${formatRupiah(payment.amount)}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[700],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],

                // Amount Section
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: primaryColor.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: primaryColor.withOpacity(0.2)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total Tagihan',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[700],
                        ),
                      ),
                      Text(
                        formatRupiah(
                          payment.remainingAmount == 0
                              ? payment.amount
                              : payment.remainingAmount,
                        ),
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: primaryColor,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Details Section
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.withOpacity(0.1)),
                  ),
                  child: Column(
                    children: [
                      if (payment.paymentType != null &&
                          payment.paymentType!.isNotEmpty)
                        _buildDetailRow(
                          icon: Icons.category_rounded,
                          label: 'Kategori',
                          value: payment.paymentType!,
                        ),
                      if (payment.method != null &&
                          payment.method!.isNotEmpty) ...[
                        if (payment.paymentType != null &&
                            payment.paymentType!.isNotEmpty)
                          const SizedBox(height: 12),
                        _buildDetailRow(
                          icon: Icons.payment_rounded,
                          label: 'Metode',
                          value: payment.method!,
                        ),
                      ],
                      const SizedBox(height: 12),
                      _buildDetailRow(
                        icon: Icons.access_time_rounded,
                        label: 'Tanggal',
                        value: DateFormat(
                          'dd MMM yyyy, HH:mm',
                        ).format(payment.createdAt!),
                      ),
                      if (payment.transactionId != null &&
                          payment.transactionId!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        _buildDetailRow(
                          icon: Icons.receipt_long_rounded,
                          label: 'Transaction ID',
                          value: payment.transactionId!,
                          isMonospace: true,
                        ),
                      ],
                    ],
                  ),
                ),

                // Call to action for pending payments
                if (isPending && onTap != null) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(
                        Icons.touch_app_rounded,
                        size: 16,
                        color: Colors.grey[500],
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isSelected
                            ? 'Tagihan terpilih'
                            : 'Tap untuk memilih tagihan ini',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
    bool isMonospace = false,
  }) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 12),
        Expanded(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              Flexible(
                child: Text(
                  value,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[800],
                    fontWeight: FontWeight.w600,
                    fontFamily: isMonospace ? 'monospace' : null,
                  ),
                  textAlign: TextAlign.end,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  IconData _getPaymentIcon(PaymentModel p, _PaymentKind kind) {
    if (kind == _PaymentKind.refund) return Icons.undo_rounded;
    // sisanya seperti punyamu:
    if (p.paymentType != null) {
      switch (p.paymentType!.toLowerCase()) {
        case 'dp':
          return Icons.savings_rounded;
        case 'pelunasan':
          return Icons.paid_rounded;
        case 'full':
          return Icons.account_balance_wallet_rounded;
      }
    }
    return Icons.receipt_rounded;
  }

  String _getPaymentTitle(PaymentModel p) {
    final s = (p.status ?? '').toLowerCase();
    if (s == 'refund') return 'Pengembalian Dana';
    // sisanya seperti punyamu...
    if (p.paymentType != null) {
      switch (p.paymentType!.toLowerCase()) {
        case 'dp':
          return 'Tagihan DP (Down Payment)';
        case 'pelunasan':
          return 'Tagihan Pelunasan';
        case 'full':
          return 'Pembayaran Penuh';
        default:
          return 'Tagihan ${p.paymentType}';
      }
    }
    return 'Tagihan Pembayaran';
  }

  void _confirmOrder(BuildContext context, WidgetRef ref) {
    // Tampilkan dialog konfirmasi
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Konfirmasi Order'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text('Anda akan mengonfirmasi order ini.'),
              SizedBox(height: 8),
              Text(
                'Apakah Anda yakin ingin melanjutkan?',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Batal'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _processConfirmOrder(context, ref);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
              ),
              child: const Text('Ya, Lanjutkan'),
            ),
          ],
        );
      },
    );
  }

  void _processConfirmOrder(BuildContext context, WidgetRef ref) async {
    try {
      ref.read(isProcessingConfirmProvider.notifier).state = true;
      // await ref.read(onlineOrderDetailProvider.notifier).confirmOrder(ref);

      //delay
      await Future.delayed(const Duration(seconds: 5));

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Order berhasil dikonfirmasi!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal konfirmasi order: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      ref.read(isProcessingConfirmProvider.notifier).state = false;
    }
  }

  void _processPayment(
    BuildContext context,
    PaymentModel payment,
    OrderDetailModel orderDetail,
  ) {
    // Tampilkan dialog konfirmasi
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Konfirmasi Pembayaran'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Anda akan melakukan pembayaran untuk:'),
              const SizedBox(height: 8),
              Text(
                _getPaymentTitle(payment),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                'Jumlah: ${formatRupiah(payment.amount)}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.orange,
                ),
              ),
              const SizedBox(height: 16),
              const Text('Apakah Anda yakin ingin melanjutkan?'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Batal'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _navigateToPaymentProcess(context, payment, orderDetail);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
              ),
              child: const Text('Ya, Lanjutkan'),
            ),
          ],
        );
      },
    );
  }

  void _navigateToPaymentProcess(
    BuildContext context,
    PaymentModel payment,
    OrderDetailModel orders,
  ) {
    // Navigasi ke halaman proses pembayaran dengan membawa data payment
    GoRouter.of(context).pushNamed(
      'payment-process',
      extra: {'payment': payment, 'order': orders},
    );
  }
}
