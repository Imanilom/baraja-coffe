import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

// IMPORT provider tipe pembayaran yang sudah kamu punya
import 'package:kasirbaraja/providers/payment_provider.dart'
    show paymentTypesProvider;
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';

enum PaymentMode {
  single, // tanpa split
  split, // split payment
}

class PaymentScreen extends ConsumerStatefulWidget {
  final OrderDetailModel order;

  const PaymentScreen({super.key, required this.order});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  // === STATE LOGIKA (TETAP) ===
  PaymentMode _mode = PaymentMode.single;

  PaymentTypeModel? _selectedType;
  PaymentMethodModel? _selectedMethod;

  // untuk cash
  int? _selectedCashPreset;
  final TextEditingController _customCashController = TextEditingController();

  // untuk split payment (nominal per payment)
  final TextEditingController _splitAmountController = TextEditingController();

  // sementara: simpan payments di lokal (nanti bisa diganti ke orderDetailProvider)
  // late List<PaymentModel> _payments;

  @override
  void initState() {
    super.initState();
    // _payments = List<PaymentModel>.from(widget.order.payments);
  }

  @override
  void dispose() {
    _customCashController.dispose();
    _splitAmountController.dispose();
    super.dispose();
  }

  OrderDetailModel get _order {
    // subscribe di build pakai ref.watch, di sini cukup read
    return ref.read(orderDetailProvider) ?? widget.order;
  }

  List<PaymentModel> get _payments => _order.payments;

  int get _grandTotal => _order.grandTotal;

  int get _totalPaid {
    return _payments.fold(0, (sum, p) => sum + p.amount);
  }

  int get _remaining {
    final remaining = _grandTotal - _totalPaid;
    return remaining < 0 ? 0 : remaining;
  }

  bool get _isCashSelected =>
      _selectedType != null && _selectedType!.id == 'cash';

  int? get _effectiveTendered {
    if (!_isCashSelected) return null;

    if (_selectedCashPreset != null) {
      return _selectedCashPreset;
    }

    if (_customCashController.text.isNotEmpty) {
      final digitsOnly = _customCashController.text.replaceAll((r'[^0-9]'), '');
      final parsed = int.tryParse(digitsOnly);
      return parsed;
    }

    return null;
  }

  // TANPA SPLIT → amount = sisa tagihan
  int get _amountThisPaymentSingleMode => _remaining;

  // SPLIT → amount dari text field
  int? get _amountThisPaymentSplitMode {
    if (_splitAmountController.text.isEmpty) return null;
    final digitsOnly = _splitAmountController.text.replaceAll(
      RegExp(r'[^0-9]'),
      '',
    );
    final parsed = int.tryParse(digitsOnly);
    if (parsed == null || parsed <= 0) return null;
    return parsed;
  }

  int get _changeSingleMode {
    if (!_isCashSelected) return 0;
    final tendered = _effectiveTendered ?? 0;
    final amount = _amountThisPaymentSingleMode;
    final change = tendered - amount;
    return change > 0 ? change : 0;
  }

  int _changeSplitMode(int amountThisPayment) {
    if (!_isCashSelected) return 0;
    final tendered = _effectiveTendered ?? amountThisPayment;
    final change = tendered - amountThisPayment;
    return change > 0 ? change : 0;
  }

  bool get _canPaySingleMode {
    if (_selectedType == null) return false;
    if (_remaining <= 0) return false;

    if (_isCashSelected) {
      final tendered = _effectiveTendered;
      if (tendered == null) return false;
      return tendered >= _amountThisPaymentSingleMode;
    }

    // non cash → cukup pilih method
    if (_selectedType!.id != 'cash') {
      return _selectedMethod != null;
    }

    return false;
  }

  bool get _canAddPaymentSplitMode {
    if (_selectedType == null) return false;
    if (_remaining <= 0) return false;

    final amount = _amountThisPaymentSplitMode;
    if (amount == null) return false;
    if (amount <= 0 || amount > _remaining) return false;

    if (_isCashSelected) {
      final tendered = _effectiveTendered ?? amount;
      if (tendered < amount) return false;
      return true;
    } else {
      return _selectedMethod != null;
    }
  }

  bool get _canFinishOrderSplitMode {
    return _remaining == 0 && _payments.isNotEmpty;
  }

  @override
  Widget build(BuildContext context) {
    final paymentTypesAsync = ref.watch(paymentTypesProvider);
    ref.watch(orderDetailProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        title: const Text(
          'Pembayaran',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        centerTitle: true,
        actions: [
          // 🔘 TOGGLE SPLIT PAYMENT DI APPBAR
          TextButton.icon(
            onPressed: () {
              setState(() {
                _mode =
                    _mode == PaymentMode.single
                        ? PaymentMode.split
                        : PaymentMode.single;
                // reset input split jika dimatikan
                if (_mode == PaymentMode.single) {
                  _splitAmountController.clear();
                }
              });
            },
            icon: Icon(
              Icons.call_split,
              size: 18,
              color:
                  _mode == PaymentMode.split
                      ? const Color(0xFF2E7D4F)
                      : Colors.grey[600],
            ),
            label: Text(
              _mode == PaymentMode.split ? 'Split ON' : 'Split OFF',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color:
                    _mode == PaymentMode.split
                        ? const Color(0xFF2E7D4F)
                        : Colors.grey[700],
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: paymentTypesAsync.when(
        data:
            (types) => Row(
              children: [
                // ⬅️ PANEL KIRI: DETAIL TAGIHAN (flex 2)
                Expanded(
                  flex: 2,
                  child: Column(
                    children: [
                      _buildSummaryCard(),
                      const SizedBox(height: 8),
                      Expanded(child: _buildExistingPaymentsList()),
                    ],
                  ),
                ),

                // ➡️ PANEL KANAN: AREA PEMBAYARAN (flex 5)
                Expanded(
                  flex: 5,
                  child: Column(
                    children: [
                      const SizedBox(height: 8),
                      if (_mode == PaymentMode.split) ...[
                        const SizedBox(height: 8),
                        _buildSplitAmountInput(),
                      ],
                      const SizedBox(height: 8),
                      _buildPaymentTypes(types),
                      const SizedBox(height: 8),
                      Expanded(
                        child: Column(
                          children: [
                            // area metode / cash
                            Expanded(
                              child: _buildPaymentMethodsOrCashOptions(),
                            ),
                            _buildBottomActionBar(context),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error:
            (e, _) => Center(child: Text('Gagal memuat tipe pembayaran: $e')),
      ),
    );
  }

  // ================== SUMMARY (kiri atas) ==================

  Widget _buildSummaryCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(12),
      decoration: _boxWhite(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Detail Tagihan',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.grey[800],
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildSummaryItem(
                  label: 'Total',
                  value: formatRupiah(_grandTotal),
                  highlight: true,
                ),
              ),
              Expanded(
                child: _buildSummaryItem(
                  label: 'Sudah Bayar',
                  value: formatRupiah(_totalPaid),
                ),
              ),
              Expanded(
                child: _buildSummaryItem(
                  label: 'Sisa',
                  value: formatRupiah(_remaining),
                  highlight: _remaining > 0,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem({
    required String label,
    required String value,
    bool highlight = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: highlight ? 17 : 15,
            fontWeight: highlight ? FontWeight.bold : FontWeight.w600,
            color: highlight ? const Color(0xFF2E7D4F) : Colors.black87,
          ),
        ),
      ],
    );
  }

  // ================== PANEL KIRI BAWAH: LIST PAYMENTS ==================

  Widget _buildExistingPaymentsList() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.all(12),
      decoration: _boxWhite(),
      child:
          _payments.isEmpty
              ? Center(
                child: Text(
                  'Belum ada pembayaran',
                  style: TextStyle(color: Colors.grey[500], fontSize: 12),
                ),
              )
              : ListView.separated(
                itemCount: _payments.length,
                separatorBuilder: (_, __) => const Divider(height: 10),
                itemBuilder: (context, index) {
                  final p = _payments[index];
                  return Row(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: Colors.grey[200],
                        child: Text(
                          '${index + 1}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p.method ?? p.paymentType ?? 'Pembayaran',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Nominal: ${formatRupiah(p.amount)}',
                              style: const TextStyle(fontSize: 12),
                            ),
                            if (p.remainingAmount > 0)
                              Text(
                                'Sisa setelah ini: ${formatRupiah(p.remainingAmount)}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Colors.orange,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
    );
  }

  // ================== PANEL KANAN: PAYMENT TYPES & METHODS ==================

  Widget _buildPaymentTypes(List<PaymentTypeModel> paymentTypes) {
    final activeTypes = paymentTypes.where((t) => t.isActive).toList();

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tipe Pembayaran',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.grey[800],
            ),
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: 70,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: activeTypes.length,
              itemBuilder: (context, index) {
                final type = activeTypes[index];
                final isSelected = _selectedType?.id == type.id;

                return Container(
                  width: 100,
                  margin: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedType = type;
                        _selectedMethod = null;
                        _selectedCashPreset = null;
                        _customCashController.clear();
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      decoration: BoxDecoration(
                        color:
                            isSelected ? const Color(0xFF2E7D4F) : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color:
                              isSelected
                                  ? const Color(0xFF2E7D4F)
                                  : Colors.grey.shade300,
                          width: 1.2,
                        ),
                      ),
                      padding: const EdgeInsets.all(8),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _getPaymentTypeIcon(type.id),
                            size: 20,
                            color: isSelected ? Colors.white : Colors.grey[700],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            type.name,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color:
                                  isSelected ? Colors.white : Colors.grey[800],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
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

  Widget _buildPaymentMethodsOrCashOptions() {
    if (_selectedType == null) {
      return Center(
        child: Text(
          'Pilih tipe pembayaran terlebih dahulu',
          style: TextStyle(color: Colors.grey[500]),
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
      padding: const EdgeInsets.all(12),
      decoration: _boxWhite(),
      child:
          _selectedType!.id == 'cash'
              ? _buildCashOptions()
              : _buildNonCashMethods(),
    );
  }

  Widget _buildNonCashMethods() {
    final activeMethods =
        _selectedType!.paymentMethods.where((m) => m.isActive).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Metode ${_selectedType!.name}',
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: GridView.builder(
            itemCount: activeMethods.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 3.2,
            ),
            itemBuilder: (context, index) {
              final method = activeMethods[index];
              final isSelected = _selectedMethod?.id == method.id;

              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedMethod = method;
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  decoration: BoxDecoration(
                    color:
                        isSelected ? const Color(0xFF2E7D4F) : Colors.grey[50],
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color:
                          isSelected
                              ? const Color(0xFF2E7D4F)
                              : Colors.grey.shade300,
                      width: 1.2,
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 6,
                  ),
                  child: Center(
                    child: Text(
                      method.name,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isSelected ? Colors.white : Colors.grey[800],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCashOptions() {
    final basis =
        _mode == PaymentMode.single
            ? _amountThisPaymentSingleMode
            : (_amountThisPaymentSplitMode ?? _remaining);

    final suggestions = _getCashSuggestions(basis);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _mode == PaymentMode.single
              ? 'Uang Diterima (Tanpa Split)'
              : 'Uang Diterima (Pembayaran Ini)',
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children:
              suggestions.map((amount) {
                final isSelected = _selectedCashPreset == amount;

                return ChoiceChip(
                  label: Text(
                    amount == basis ? 'Uang Pas' : formatRupiah(amount),
                  ),
                  selected: isSelected,
                  onSelected: (_) {
                    setState(() {
                      _selectedCashPreset = amount;
                      _customCashController.clear();
                    });
                  },
                  selectedColor: const Color(0xFF2E7D4F),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : Colors.grey[800],
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                );
              }).toList(),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _customCashController,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: 'Nominal Lainnya',
            hintText: 'Masukkan nominal',
            prefixIcon: const Icon(Icons.payment),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 8,
            ),
          ),
          onTap: () {
            setState(() {
              _selectedCashPreset = null;
            });
          },
        ),
        if (_mode == PaymentMode.single) ...[
          const SizedBox(height: 4),
          Text(
            'Kembalian: ${formatRupiah(_changeSingleMode)}',
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
          ),
        ],
      ],
    );
  }

  List<int> _getCashSuggestions(int basis) {
    final rounded = ((basis / 1000).ceil()) * 1000;
    final list =
        <int>{
          basis,
          rounded + 5000,
          rounded + 10000,
          rounded + 20000,
          50000,
          100000,
        }.toList();
    list.sort();
    return list;
  }

  // ================== SPLIT INPUT (KANAN BAWAH ATAS) ==================

  Widget _buildSplitAmountInput() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 4),
      padding: const EdgeInsets.all(12),
      decoration: _boxWhite(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Nominal Pembayaran Ini (Split)',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.grey[800],
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _splitAmountController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Contoh: 20000',
                    prefixIcon: const Icon(Icons.numbers),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'Sisa saat ini:',
                    style: TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                  Text(
                    formatRupiah(_remaining),
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ================== BOTTOM ACTION BAR (KANAN PALING BAWAH) ==================

  Widget _buildBottomActionBar(BuildContext context) {
    if (_mode == PaymentMode.single) {
      return Container(
        margin: const EdgeInsets.fromLTRB(16, 4, 16, 12),
        child: SizedBox(
          width: double.infinity,
          height: 46,
          child: ElevatedButton(
            onPressed: _canPaySingleMode ? _onPaySingleMode : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2E7D4F),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Bayar',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ),
        ),
      );
    }

    // SPLIT MODE
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _canAddPaymentSplitMode ? _onAddSplitPayment : null,
              icon: const Icon(Icons.add),
              label: const Text(
                'Tambah Payment',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
              ),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                side: const BorderSide(color: Color(0xFF2E7D4F)),
                foregroundColor: const Color(0xFF2E7D4F),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ElevatedButton(
              onPressed: _canFinishOrderSplitMode ? _onFinishSplitOrder : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D4F),
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Selesaikan Order',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ================== HANDLER (LOGIKA TETAP) ==================

  String _currentMethodName() {
    if (_isCashSelected) return 'Cash';
    if (_selectedMethod != null) return _selectedMethod!.name;
    return _selectedType?.name ?? 'Payment';
  }

  void _onPaySingleMode() {
    final amount = _amountThisPaymentSingleMode;
    final tendered = _effectiveTendered ?? amount;
    final change = _changeSingleMode;

    final payment = PaymentModel(
      orderId: _order.orderId,
      method: _currentMethodName(),
      paymentType: _selectedType?.name,
      amount: amount,
      tenderedAmount: tendered,
      changeAmount: change,
      remainingAmount: 0,
      status: 'settlement',
      createdAt: DateTime.now(),
    );

    // 🚀 simpan ke orderDetailProvider
    ref.read(orderDetailProvider.notifier).addPayment(payment);

    // optional: kalau mau clear pilihan / input
    setState(() {
      _selectedCashPreset = null;
      _customCashController.clear();
    });

    debugPrint('Bayar (tanpa split): $payment');
  }

  void _onAddSplitPayment() {
    final amount = _amountThisPaymentSplitMode!;
    final tendered = _effectiveTendered ?? amount;
    final change = _changeSplitMode(amount);

    final remainingAfter = (_remaining - amount).clamp(0, _grandTotal);

    final payment = PaymentModel(
      orderId: _order.orderId,
      method: _currentMethodName(),
      paymentType: _selectedType?.name,
      amount: amount,
      tenderedAmount: tendered,
      changeAmount: change,
      remainingAmount: remainingAfter,
      status: remainingAfter > 0 ? 'partial' : 'settlement',
      createdAt: DateTime.now(),
    );

    // 🚀 simpan ke orderDetailProvider
    ref.read(orderDetailProvider.notifier).addPayment(payment);

    // reset input lokal
    setState(() {
      _splitAmountController.clear();
      _selectedCashPreset = null;
      _customCashController.clear();
    });

    debugPrint('Tambah split payment: $payment');
  }

  void _onFinishSplitOrder() {
    final order = ref.read(orderDetailProvider);

    debugPrint(
      'Selesaikan order dengan ${order?.payments.length ?? 0} payment, '
      'totalPaid=${order?.payments.fold(0, (s, p) => s + p.amount) ?? 0}',
    );

    // TODO:
    // - di sini nanti panggil OrderService.createOrder(order!)
    //   atau processPaymentOrder, dll, pakai order.payments
  }

  // ================== UTIL ==================

  BoxDecoration _boxWhite() {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.03),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }
}
