import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/order_history_provider.dart';
import 'package:kasirbaraja/providers/payment_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/enums/payment_method.dart';

class PaymentMethodScreen extends ConsumerWidget {
  const PaymentMethodScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(paymentProvider);
    final notifier = ref.read(paymentProvider.notifier);
    final OrderDetailModel orderdetail =
        GoRouterState.of(context).extra as OrderDetailModel;
    final total = orderdetail.grandTotal;

    // Daftar metode pembayaran
    final paymentMethods = [
      PaymentMethods(id: 'Cash', name: 'Tunai', type: 'Cash'),
      PaymentMethods(id: 'edc', name: 'EDC', type: 'edc'),
    ];

    // Daftar bank untuk EDC
    final banks = [
      PaymentMethods(id: 'bca', name: 'BCA', type: 'edc'),
      PaymentMethods(id: 'bri', name: 'BRI', type: 'edc'),
      // PaymentMethods(id: 'mandiri', name: 'Mandiri', type: 'edc'),
      PaymentMethods(id: 'bni', name: 'BNI', type: 'edc'),
    ];

    // Daftar nominal uang untuk tunai
    final cashSuggestions = _getCashSuggestions(total.toInt());

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.white,
        toolbarHeight: 70,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.arrow_back_ios_new,
              color: Colors.black87,
              size: 20,
            ),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Metode Pembayaran',
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.w600,
            fontSize: 24,
          ),
        ),
        centerTitle: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Panel Kiri - Total & Metode Pembayaran
            Expanded(
              flex: 2,
              child: Column(
                children: [
                  // Header dengan total tagihan
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF667EEA), Color(0xFF764BA2)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF667EEA).withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'Total Tagihan',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          formatRupiah(total.toInt()),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Pilihan Metode Pembayaran - Scrollable
                  Expanded(
                    child: Container(
                      width: double.infinity,
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
                      child: _buildMethodSelection(
                        notifier,
                        paymentMethods,
                        state,
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Tombol Lanjut Pembayaran
                  if (state.selectedMethod != null &&
                      ((state.selectedMethod!.type == 'Cash' &&
                              state.selectedCashAmount != null) ||
                          (state.selectedMethod!.type == 'edc' &&
                              state.selectedBankId != null)))
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF667EEA),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                          shadowColor: Colors.transparent,
                        ),
                        onPressed: () => _processPayment(context, ref),
                        child: const Text(
                          'LANJUT PEMBAYARAN',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(width: 20),

            // Panel Kanan - Pilihan Tunai/EDC
            Expanded(
              flex: 3,
              child: Container(
                height: double.infinity,
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
                child:
                    state.selectedMethod != null
                        ? SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          child:
                              state.selectedMethod!.type == 'Cash'
                                  ? _buildCashPayment(
                                    cashSuggestions,
                                    notifier,
                                    ref,
                                    total.toInt(),
                                  )
                                  : _buildEDCPayment(banks, notifier, state),
                        )
                        : Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.payment,
                                size: 80,
                                color: Colors.grey.shade300,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Pilih metode pembayaran\nterlebih dahulu',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey.shade500,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<int> _getCashSuggestions(int totalAmount) {
    final suggestions =
        <int>{
            totalAmount,
            _roundUpToNearest(totalAmount, 1000),
            _roundUpToNearest(totalAmount, 2000),
            _roundUpToNearest(totalAmount, 5000),
            _roundUpToNearest(totalAmount, 10000),
            _roundUpToNearest(totalAmount, 20000),
            _roundUpToNearest(totalAmount, 50000),
            _roundUpToNearest(totalAmount, 100000),
          }.toList()
          ..sort();

    return suggestions.take(8).toList(); // Lebih banyak untuk landscape
  }

  int _roundUpToNearest(int number, int nearest) {
    if (nearest <= 0) {
      throw ArgumentError('Nearest must be greater than zero.');
    }
    return ((number + nearest - 1) ~/ nearest) * nearest;
  }

  Widget _buildMethodSelection(
    PaymentNotifier notifier,
    List<PaymentMethods> methods,
    PaymentState state,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Pilih Metode Pembayaran',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              children:
                  methods.map((method) {
                    final isSelected = state.selectedMethod?.id == method.id;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: GestureDetector(
                        onTap: () {
                          notifier.clearSelection();
                          notifier.selectMethod(method);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color:
                                isSelected
                                    ? const Color(0xFF667EEA)
                                    : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color:
                                  isSelected
                                      ? const Color(0xFF667EEA)
                                      : Colors.grey.shade200,
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                _getMethodIcon(method.type),
                                color:
                                    isSelected
                                        ? Colors.white
                                        : Colors.grey.shade600,
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  method.name,
                                  style: TextStyle(
                                    color:
                                        isSelected
                                            ? Colors.white
                                            : Colors.grey.shade700,
                                    fontWeight:
                                        isSelected
                                            ? FontWeight.w600
                                            : FontWeight.w500,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                              if (isSelected)
                                const Icon(
                                  Icons.check_circle,
                                  color: Colors.white,
                                  size: 18,
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  IconData _getMethodIcon(String type) {
    switch (type) {
      case 'Cash':
        return Icons.money;
      case 'edc':
        return Icons.credit_card;
      case 'qris':
        return Icons.qr_code;
      case 'ewallet':
        return Icons.account_balance_wallet;
      case 'bank_transfer':
        return Icons.account_balance;
      default:
        return Icons.payment;
    }
  }

  Widget _buildCashPayment(
    List<int> suggestions,
    PaymentNotifier notifier,
    WidgetRef ref,
    int totalAmount,
  ) {
    final state = ref.watch(paymentProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Pilih Nominal Tunai',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 20),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3, // 4 kolom untuk landscape
            childAspectRatio: 2.2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
          ),
          itemCount: suggestions.length,
          itemBuilder: (context, index) {
            final amount = suggestions[index];
            final isSelected = state.selectedCashAmount == amount;

            return GestureDetector(
              onTap: () => notifier.selectCashAmount(amount),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color:
                      isSelected
                          ? const Color(0xFF667EEA)
                          : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color:
                        isSelected
                            ? const Color(0xFF667EEA)
                            : Colors.grey.shade200,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        amount == totalAmount
                            ? 'Uang Pas'
                            : formatRupiah(amount),
                        style: TextStyle(
                          color:
                              isSelected ? Colors.white : Colors.grey.shade700,
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.w500,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildEDCPayment(
    List<PaymentMethods> banks,
    PaymentNotifier notifier,
    PaymentState state,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Pilih Bank',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 20),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3, // 3 kolom untuk bank
            childAspectRatio: 2.5,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
          ),
          itemCount: banks.length,
          itemBuilder: (context, index) {
            final bank = banks[index];
            final isSelected = state.selectedBankId == bank.id;

            return GestureDetector(
              onTap: () => notifier.selectBank(bank.id),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color:
                      isSelected
                          ? const Color(0xFF667EEA)
                          : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color:
                        isSelected
                            ? const Color(0xFF667EEA)
                            : Colors.grey.shade200,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.account_balance,
                        color: isSelected ? Colors.white : Colors.grey.shade600,
                        size: 24,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        bank.name,
                        style: TextStyle(
                          color:
                              isSelected ? Colors.white : Colors.grey.shade700,
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.w500,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  void _processPayment(BuildContext context, WidgetRef ref) async {
    final state = ref.read(paymentProvider);
    final orderDetail = ref.watch(orderDetailProvider.notifier);

    if (state.selectedMethod == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Silakan pilih metode pembayaran!'),
          backgroundColor: Colors.red.shade400,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
      return;
    }

    orderDetail.updatePaymentMethod(
      PaymentMethodExtension.fromString(state.selectedMethod!.type),
    );
    final success = await orderDetail.submitOrder();

    if (success && context.mounted) {
      ref.invalidate(orderHistoryProvider);
      context.goNamed(
        'payment-success',
        extra: {
          'payment_method': state.selectedMethod!.name,
          'amount':
              state.selectedMethod!.type == 'Cash'
                  ? state.selectedCashAmount
                  : state.totalAmount,
          'change': state.selectedMethod!.type == 'Cash' ? state.change : null,
        },
      );
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Pembayaran gagal!'),
          backgroundColor: Colors.red.shade400,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
    }
  }
}
