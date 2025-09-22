import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/enums/payment_status.dart';
import 'package:kasirbaraja/helper/payment_helper.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/order_history_provider.dart';
import 'package:kasirbaraja/providers/payment_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

//provider type pelunasan enum
final choosePaymentTypesProvider = StateProvider<PaymentTypes>((ref) {
  return PaymentTypes.fullPayment;
});

class PaymentMethodScreen extends ConsumerWidget {
  const PaymentMethodScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(paymentProvider);
    final notifier = ref.read(paymentProvider.notifier);
    final paymentTypesAsync = ref.watch(paymentTypesProvider);

    // ✅ PERBAIKAN: Tambahkan null check untuk extra
    final extra = GoRouterState.of(context).extra;
    if (extra == null || extra is! OrderDetailModel) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: const Center(child: Text('Order detail tidak ditemukan')),
      );
    }

    final OrderDetailModel orderdetail = extra;
    final total = orderdetail.grandTotal;

    print('Total amount: $total');
    print('state: $state');
    print('notifier: $notifier');
    print('paymentTypesAsync: $paymentTypesAsync');

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            //clear selection di payment provider
            context.pop();
            notifier.clearOnBack();
            ref.read(choosePaymentTypesProvider.notifier).state =
                PaymentTypes.fullPayment;
          },
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        title: const Text(
          'Pilih Pembayaran',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        centerTitle: true,
      ),
      // ✅ PERBAIKAN: Hapus Expanded dari body
      body: paymentTypesAsync.when(
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
                  Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
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
    );
  }

  Widget _buildTotalCard(int total, PaymentState state) {
    final isDP = state.isDownPayment;
    final dp = isDP ? (state.selectedDownPayment ?? 0) : 0;
    final remaining = (total - dp).clamp(0, total);

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
          if (isDP) ...[
            const SizedBox(height: 12),
            Text(
              'Down Payment',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 6),
            Container(
              decoration: BoxDecoration(
                color: Colors.blue[50],
                border: Border.all(color: Colors.blue),
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: Text(
                formatRupiah(dp),
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.blue[600],
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Sisa Tagihan',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              formatRupiah(remaining),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
          ],
          SizedBox(height: 8),
          //state,
          Text('payment type: ${state.selectedPaymentType?.name ?? '-'}'),
          Text('payment method: ${state.selectedPaymentMethod?.name ?? '-'}'),
          Text('cash amount: ${state.selectedCashAmount}'),
          Text('total amount: ${state.totalAmount}'),
          Text('down payment: ${state.selectedDownPayment}'),
          Text('is down payment: ${state.isDownPayment}'),
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
    final choosePaymentType = ref.watch(choosePaymentTypesProvider);

    return Row(
      children: [
        Expanded(flex: 2, child: _buildTotalCard(total.toInt(), state)),
        Expanded(
          flex: 5,
          child: Column(
            children: [
              Flexible(
                child: Row(
                  children: [
                    _buildSettlementTypes(ref),
                    // if payment types full payment show payment types,
                    if (choosePaymentType == PaymentTypes.fullPayment)
                      Expanded(
                        child: _buildPaymentTypes(
                          paymentTypes,
                          state,
                          notifier,
                        ),
                      ),

                    // if payment types down payment show cash options
                    if (choosePaymentType == PaymentTypes.downPayment)
                      //menampilkan textfield untuk menentukan nominal downpayment
                      Expanded(
                        child: _buildDownPayment(total, state, notifier),
                      ),
                  ],
                ),
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
                        Expanded(
                          child: _buildPaymentMethodsSection(
                            state,
                            notifier,
                            total,
                          ),
                        ),
                      ] else ...[
                        const Expanded(child: _EmptyStateWidget()),
                      ],

                      // Continue Button
                      if (_canProceedToPayment(state, total))
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: _buildContinueButton(
                            context,
                            ref,
                            orderdetail,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDownPayment(
    int total,
    PaymentState state,
    PaymentNotifier notifier,
  ) {
    final minDP = PaymentHelper.minDownPayment(total);
    final suggestions = PaymentHelper.getDownPaymentSuggestions(total);
    final current = state.selectedDownPayment ?? minDP;

    String format(int v) => formatRupiah(v);

    void applyDP(int raw) {
      int clamped = raw;
      if (clamped < minDP) clamped = minDP;
      if (clamped > total) clamped = total;
      notifier.selectDownPayment(PaymentHelper.roundToThousand(clamped));
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      constraints: const BoxConstraints(maxWidth: 360),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 12),
            child: Text(
              'Nominal Down Payment (Min: ${format(minDP)})',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
          ),
          TextFormField(
            key: ValueKey(
              'dp-field-$current',
            ), // biar initialValue refresh saat state berubah
            initialValue: current > 0 ? current.toString() : '',
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              hintText: 'Masukkan nominal DP',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFF2E7D4F)),
              ),
              prefixIcon: const Icon(Icons.payments, color: Color(0xFF2E7D4F)),
              helperText:
                  'Sisa: ${format((total - (state.selectedDownPayment ?? 0)).clamp(0, total))}',
            ),
            onChanged: (value) {
              final digitsOnly = value.replaceAll(RegExp(r'[^0-9]'), '');
              final parsed = int.tryParse(digitsOnly) ?? 0;
              applyDP(parsed);
            },
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children:
                suggestions.map((s) {
                  final selected = s == current;
                  return ChoiceChip(
                    label: Text(format(s)),
                    selected: selected,
                    onSelected: (_) => applyDP(s),
                    selectedColor: const Color(0xFF2E7D4F),
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : Colors.black87,
                    ),
                  );
                }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSettlementTypes(WidgetRef ref) {
    final paymentType = ref.watch(choosePaymentTypesProvider);
    final notifier = ref.read(choosePaymentTypesProvider.notifier);
    final paymentNotifier = ref.read(paymentProvider.notifier);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      constraints: const BoxConstraints(maxWidth: 200),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 12),
            child: Text(
              'Tipe Pelunasan',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
          ),
          Column(
            children: [
              ChoiceChip(
                checkmarkColor: Colors.white,
                label: const Text('Full Payment'),
                selected: paymentType == PaymentTypes.fullPayment,
                onSelected: (selected) {
                  if (selected) {
                    notifier.state = PaymentTypes.fullPayment;
                    paymentNotifier.setSettlementMode(false);
                    paymentNotifier.clearDownPayment();
                  }
                },
                selectedColor: const Color(0xFF2E7D4F),
                backgroundColor: Colors.grey[200],
                labelStyle: TextStyle(
                  color:
                      paymentType == PaymentTypes.fullPayment
                          ? Colors.white
                          : Colors.grey[800],
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 12),
              ChoiceChip(
                checkmarkColor: Colors.white,
                label: const Text('Down Payment'),
                selected: paymentType == PaymentTypes.downPayment,
                onSelected: (selected) {
                  if (selected) {
                    notifier.state = PaymentTypes.downPayment;
                    paymentNotifier.setSettlementMode(true);
                  }
                },
                selectedColor: const Color(0xFF2E7D4F),
                backgroundColor: Colors.grey[200],
                labelStyle: TextStyle(
                  color:
                      paymentType == PaymentTypes.downPayment
                          ? Colors.white
                          : Colors.grey[800],
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
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
          // ✅ PERBAIKAN: Bungkus dengan Flexible untuk mencegah overflow
          Flexible(
            child: SizedBox(
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
                              isSelected
                                  ? const Color(0xFF2E7D4F)
                                  : Colors.white,
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
                              color:
                                  isSelected ? Colors.white : Colors.grey[600],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              paymentType.name,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color:
                                    isSelected
                                        ? Colors.white
                                        : Colors.grey[700],
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

    return Column(
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
    );
  }

  Widget _buildCashOptions(
    int total,
    PaymentNotifier notifier,
    PaymentState state,
  ) {
    final basis =
        state.isDownPayment
            ? (state.selectedDownPayment ?? PaymentHelper.minDownPayment(total))
            : total;
    final cashSuggestions = _getCashSuggestions(basis);

    // ✅ PERBAIKAN: Gunakan LayoutBuilder untuk responsive grid
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 600 ? 6 : 4;

        return GridView.builder(
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
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
                        isSelected
                            ? const Color(0xFF2E7D4F)
                            : Colors.grey.shade300,
                    width: 1.5,
                  ),
                ),
                child: Center(
                  child: Text(
                    amount == total ? 'Uang Pas' : formatRupiah(amount),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isSelected ? Colors.white : Colors.grey[700],
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            );
          },
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

    // ✅ PERBAIKAN: Responsive grid dan text handling
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 600 ? 6 : 4;

        return GridView.builder(
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
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
                        isSelected
                            ? const Color(0xFF2E7D4F)
                            : Colors.grey.shade300,
                    width: 1.5,
                  ),
                ),
                child: Center(
                  child: Text(
                    method.name,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isSelected ? Colors.white : Colors.grey[700],
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            );
          },
        );
      },
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

  bool _canProceedToPayment(PaymentState state, int total) {
    if (state.selectedPaymentType == null) return false;

    if (!state.isDownPayment) {
      // FULL
      if (state.selectedPaymentType!.id == 'cash') {
        return state.selectedCashAmount != null &&
            state.selectedCashAmount! >= total;
      }
      return state.selectedPaymentMethod != null;
    }

    // DP
    final dp = state.selectedDownPayment ?? 0;
    if (dp <= 0) return false;

    if (state.selectedPaymentType!.id == 'cash') {
      return state.selectedCashAmount != null &&
          state.selectedCashAmount! >= dp;
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

    final total = orderDetail.grandTotal.toInt();

    // Ambil komputasi final dari Notifier (sesuai saran sebelumnya)
    final info = ref
        .read(paymentProvider.notifier)
        .getPaymentInfoComputed(total);
    final isDP = info['isDownPayment'] == true;
    final amountNow = info['amount'] as int; // dibayar sekarang (full/DP)
    final tendered =
        info['tendered']
            as int; // uang diserahkan (cash) / sama dg amount utk non-cash
    final change = info['change'] as int;
    final outstanding = info['outstanding'] as int;
    final typeId =
        (info['type'] as String?) ?? ''; // cash/ewallet/debit/banktransfer

    // Tentukan status enum -> string
    final statusEnum =
        (isDP || amountNow < total)
            ? PaymentStatus.partial
            : PaymentStatus.settlement;
    final statusStr = PaymentStatusExtension.paymentStatusToJson(statusEnum);

    // Nama metode untuk layar sukses
    final paymentMethodName =
        typeId == 'cash' ? 'Tunai' : (state.selectedPaymentMethod?.name ?? '');

    // Siapkan entry payment_details
    // ⚠️ Sesuaikan field PaymentModel di proyekmu jika namanya berbeda.
    // final PaymentModel paymentEntry = PaymentModel(
    //   type: typeId,
    //   methodId: state.selectedPaymentMethod?.id, // ex: 'qris'
    //   methodName: state.selectedPaymentMethod?.name,
    //   amount: amountNow,
    //   tendered: tendered,
    //   change: change,
    //   isDownPayment: isDP,
    //   remainingAmount: outstanding,
    //   createdAt: DateTime.now(),
    // );

    // Gabungkan dengan payment_details lama (kalau ada)
    // final List<PaymentModel> newPaymentList = [
    //   ...(orderDetail.payment ?? <PaymentModel>[]),
    //   paymentEntry,
    // ];

    // final paymentData = PaymentState(
    //   selectedPaymentType: state.selectedPaymentType,
    //   selectedPaymentMethod: state.selectedPaymentMethod,
    //   selectedCashAmount: state.selectedCashAmount,
    //   totalAmount: orderDetail.grandTotal.toInt(),
    //   selectedDownPayment: state.selectedDownPayment,
    //   isDownPayment: state.isDownPayment,
    // );

    final updatedOrder = orderDetail.copyWith(
      paymentMethod: typeId, // untuk ringkasannya (id tipe)
      paymentStatus: statusStr, // detail transaksi pembayaran saat ini
    );

    if (orderDetail.source == 'App') {
      onlineOrderDetailNotifier.savedOnlineOrderDetail(updatedOrder);
    } else {
      // Jika ada method spesifik, silakan pakai itu; jika tidak, set langsung detailnya
      // orderDetailNotifier.setOrderDetail(updatedOrder);
    }

    // Loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final success =
          orderDetail.source == 'App'
              ? await onlineOrderDetailNotifier.submitOnlineOrder()
              : await orderDetailNotifier.submitOrder();

      if (context.mounted) Navigator.pop(context);

      if (success && context.mounted) {
        ref.invalidate(orderHistoryProvider);

        context.goNamed(
          'payment-success',
          extra: {
            'orderDetail': updatedOrder,
            'payment_method': paymentMethodName,
            'amount': amountNow,
            'change': change,
            'outstanding': outstanding,
            'is_down_payment': isDP,
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
    } catch (e) {
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

// ✅ PERBAIKAN: Extract empty state ke widget terpisah
class _EmptyStateWidget extends StatelessWidget {
  const _EmptyStateWidget();

  @override
  Widget build(BuildContext context) {
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
}
