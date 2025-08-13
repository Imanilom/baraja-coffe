import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/helper/payment_helper.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/order_history_provider.dart';
import 'package:kasirbaraja/providers/payment_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

class PaymentMethodScreen extends ConsumerWidget {
  const PaymentMethodScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(paymentProvider);
    final notifier = ref.read(paymentProvider.notifier);
    final paymentTypesAsync = ref.watch(paymentTypesProvider);

    final OrderDetailModel orderdetail =
        GoRouterState.of(context).extra as OrderDetailModel;
    final total = orderdetail.grandTotal;

    print('Total amount: $total');
    print('state: $state');
    print('notifier: $notifier');
    print('paymentTypesAsync: $paymentTypesAsync');

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        title: const Text(
          'Pilih Pembayaran',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: Expanded(
        child: paymentTypesAsync.when(
          data:
              (paymentTypes) => _buildPaymentContent(
                context,
                ref,
                paymentTypes,
                state,
                notifier,
                total.toInt(),
                orderdetail,
              ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error:
              (error, stack) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Gagal memuat metode pembayaran',
                      style: TextStyle(color: Colors.grey[600], fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () => ref.refresh(paymentTypesProvider),
                      child: const Text('Coba Lagi'),
                    ),
                  ],
                ),
              ),
        ),
      ),
    );
  }

  Widget _buildTotalCard(int total) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            'Total Tagihan',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            formatRupiah(total),
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2E7D4F),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentContent(
    BuildContext context,
    WidgetRef ref,
    List<PaymentTypeModel> paymentTypes,
    PaymentState state,
    PaymentNotifier notifier,
    int total,
    OrderDetailModel orderdetail,
  ) {
    return Column(
      children: [
        // Payment Types Selection,
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Total Amount Card
            _buildTotalCard(total.toInt()),

            Expanded(child: _buildPaymentTypes(paymentTypes, state, notifier)),
          ],
        ),
        // Payment Methods Content
        Expanded(
          child: Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                if (state.selectedPaymentType != null) ...[
                  _buildPaymentMethodsSection(state, notifier, total),
                ] else ...[
                  _buildEmptyState(),
                ],

                // const Spacer(),

                // Continue Button
                if (_canProceedToPayment(state))
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: _buildContinueButton(context, ref, orderdetail),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentTypes(
    List<PaymentTypeModel> paymentTypes,
    PaymentState state,
    PaymentNotifier notifier,
  ) {
    final activeTypes = paymentTypes.where((type) => type.isActive).toList();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 12),
            child: Text(
              'Metode Pembayaran',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
          ),
          SizedBox(
            height: 80,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 4),
              itemCount: activeTypes.length,
              itemBuilder: (context, index) {
                final paymentType = activeTypes[index];
                final isSelected =
                    state.selectedPaymentType?.id == paymentType.id;

                return Container(
                  margin: const EdgeInsets.only(right: 12),
                  child: GestureDetector(
                    onTap: () {
                      notifier.clearSelection();
                      notifier.selectPaymentType(paymentType);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 100,
                      decoration: BoxDecoration(
                        color:
                            isSelected ? const Color(0xFF2E7D4F) : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color:
                              isSelected
                                  ? const Color(0xFF2E7D4F)
                                  : Colors.grey.shade300,
                          width: 1.5,
                        ),
                        boxShadow:
                            isSelected
                                ? [
                                  BoxShadow(
                                    color: const Color(
                                      0xFF2E7D4F,
                                    ).withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                                : [],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _getPaymentTypeIcon(paymentType.id),
                            size: 24,
                            color: isSelected ? Colors.white : Colors.grey[600],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            paymentType.name,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color:
                                  isSelected ? Colors.white : Colors.grey[700],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  IconData _getPaymentTypeIcon(String typeId) {
    switch (typeId) {
      case 'cash':
        return Icons.money;
      case 'ewallet':
        return Icons.account_balance_wallet;
      case 'debit':
        return Icons.credit_card;
      case 'banktransfer':
        return Icons.account_balance;
      default:
        return Icons.payment;
    }
  }

  Widget _buildPaymentMethodsSection(
    PaymentState state,
    PaymentNotifier notifier,
    int total,
  ) {
    final paymentType = state.selectedPaymentType!;

    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            paymentType.id == 'cash'
                ? 'Pilih Jumlah Tunai'
                : 'Pilih ${paymentType.name}',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2E2E2E),
            ),
          ),
          const SizedBox(height: 16),

          Expanded(
            child:
                paymentType.id == 'cash'
                    ? _buildCashOptions(total, notifier, state)
                    : _buildPaymentMethodOptions(paymentType, notifier, state),
          ),
        ],
      ),
    );
  }

  Widget _buildCashOptions(
    int total,
    PaymentNotifier notifier,
    PaymentState state,
  ) {
    final cashSuggestions = _getCashSuggestions(total);

    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        childAspectRatio: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: cashSuggestions.length,
      itemBuilder: (context, index) {
        final amount = cashSuggestions[index];
        final isSelected = state.selectedCashAmount == amount;

        return GestureDetector(
          onTap: () => notifier.selectCashAmount(amount),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF2E7D4F) : Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color:
                    isSelected ? const Color(0xFF2E7D4F) : Colors.grey.shade300,
                width: 1.5,
              ),
            ),
            child: Center(
              child: Text(
                amount == total ? 'Uang Pas' : formatRupiah(amount),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? Colors.white : Colors.grey[700],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildPaymentMethodOptions(
    PaymentTypeModel paymentType,
    PaymentNotifier notifier,
    PaymentState state,
  ) {
    final activeMethods =
        paymentType.paymentMethods.where((method) => method.isActive).toList();

    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        childAspectRatio: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: activeMethods.length,
      itemBuilder: (context, index) {
        final method = activeMethods[index];
        final isSelected = state.selectedPaymentMethod?.id == method.id;

        return GestureDetector(
          onTap: () => notifier.selectPaymentMethod(method),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF2E7D4F) : Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color:
                    isSelected ? const Color(0xFF2E7D4F) : Colors.grey.shade300,
                width: 1.5,
              ),
            ),
            child: Center(
              child: Text(
                method.name,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? Colors.white : Colors.grey[700],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.payment, size: 64, color: Colors.grey[300]),
        const SizedBox(height: 16),
        Text(
          'Pilih metode pembayaran\nterlebih dahulu',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 16, color: Colors.grey[500]),
        ),
      ],
    );
  }

  Widget _buildContinueButton(
    BuildContext context,
    WidgetRef ref,
    OrderDetailModel orderDetail,
  ) {
    return Container(
      width: double.infinity,
      height: 50,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2E7D4F), Color(0xFF4CAF50)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2E7D4F).withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: () => _processPayment(context, ref, orderDetail),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          'Bayar',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  bool _canProceedToPayment(PaymentState state) {
    if (state.selectedPaymentType == null) return false;

    if (state.selectedPaymentType!.id == 'cash') {
      return state.selectedCashAmount != null;
    }

    return state.selectedPaymentMethod != null;
  }

  List<int> _getCashSuggestions(int totalAmount) {
    return PaymentHelper.getCashSuggestions(totalAmount);
  }

  void _processPayment(
    BuildContext context,
    WidgetRef ref,
    OrderDetailModel orderDetail,
  ) async {
    final state = ref.read(paymentProvider);
    final orderDetailNotifier = ref.watch(orderDetailProvider.notifier);
    final onlineOrderDetailNotifier = ref.watch(
      onlineOrderDetailProvider.notifier,
    );

    if (state.selectedPaymentType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Silakan pilih metode pembayaran!'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Update payment method based on selection
    final paymentInfo = state.getPaymentInfo();
    final paymentMethod = paymentInfo['type'] as String;
    final paymentType = paymentInfo['method'] as String;

    if (orderDetail.source == 'App') {
      onlineOrderDetailNotifier.savedOnlineOrderDetail(
        orderDetail.copyWith(
          paymentMethod: paymentMethod,
          paymentStatus: paymentType,
        ),
      );
    } else {
      orderDetailNotifier.updatePaymentMethod(paymentMethod, paymentType);
    }

    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      if (orderDetail.source == 'App') {
        final success = await onlineOrderDetailNotifier.submitOnlineOrder();
        if (context.mounted) Navigator.pop(context);

        if (success && context.mounted) {
          ref.invalidate(orderHistoryProvider);

          context.goNamed(
            'payment-success',
            extra: {
              'orderDetail': orderDetail,
              'payment_method':
                  paymentInfo['type'] == 'cash'
                      ? 'Tunai'
                      : state.selectedPaymentMethod?.name ?? '',
              'amount': paymentInfo['amount'],
              'change': paymentInfo['change'],
            },
          );
        } else if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Pembayaran gagal!'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } else {
        print('Submitting create order...');
        final success = await orderDetailNotifier.submitOrder();
        // Hide loading
        if (context.mounted) Navigator.pop(context);

        if (success && context.mounted) {
          ref.invalidate(orderHistoryProvider);

          context.goNamed(
            'payment-success',
            extra: {
              'orderDetail': orderDetail,
              'payment_method':
                  paymentInfo['type'] == 'cash'
                      ? 'Tunai'
                      : state.selectedPaymentMethod?.name ?? '',
              'amount': paymentInfo['amount'],
              'change': paymentInfo['change'],
            },
          );
        } else if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Pembayaran gagal!'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      // Hide loading
      if (context.mounted) Navigator.pop(context);

      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
