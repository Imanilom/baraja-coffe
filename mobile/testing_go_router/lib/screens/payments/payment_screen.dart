import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

// Provider tipe pembayaran yang sudah kamu punya
import 'package:kasirbaraja/providers/payment_provider.dart'
    show paymentMethodsProvider;

// 🔹 Helper saran cash
import 'package:kasirbaraja/helper/payment_helper.dart';

/// Mode pembayaran:
/// - single: tanpa split, 1x bayar langsung lunas
/// - split : beberapa pembayaran (multi card)
enum PaymentMode { single, split }

/// Representasi 1 card split payment di UI
class SplitCard {
  final String id;
  int amount;
  PaymentMethodModel? method;
  PaymentTypeModel? type;
  bool isPaid;

  /// true = nominal ini di-set manual oleh user (tidak di-overwrite otomatis)
  bool isManual;

  SplitCard({
    required this.id,
    required this.amount,
    this.method,
    this.type,
    this.isPaid = false,
    this.isManual = false,
  });

  SplitCard copyWith({
    String? id,
    int? amount,
    PaymentTypeModel? type,
    PaymentMethodModel? method,
    bool? isPaid,
    bool? isManual,
  }) {
    return SplitCard(
      id: id ?? this.id,
      amount: amount ?? this.amount,
      type: type ?? this.type,
      method: method ?? this.method,
      isPaid: isPaid ?? this.isPaid,
      isManual: isManual ?? this.isManual,
    );
  }
}

class PaymentScreen extends ConsumerStatefulWidget {
  final OrderDetailModel order;

  const PaymentScreen({super.key, required this.order});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  // ======= MODE =======
  PaymentMode _mode = PaymentMode.single;

  // ======= SINGLE PAYMENT STATE =======
  PaymentMethodModel? _selectedMethod;
  PaymentTypeModel? _selectedType;

  int? _selectedCashPreset;
  final TextEditingController _customCashController = TextEditingController();

  // ======= SPLIT PAYMENT STATE =======
  final List<SplitCard> _splitCards = [];
  final Map<String, TextEditingController> _splitAmountControllers = {};

  // 🔹 cash per split card (baru)
  final Map<String, TextEditingController> _splitCashControllers = {};
  final Map<String, int?> _splitCashPresetSelected = {};

  // ======= PAYMENTS TERSIMPAN DI ORDER =======
  late List<PaymentModel> _payments;

  @override
  void initState() {
    super.initState();

    // Ambil payments awal dari order (kalau belum ada, pakai list kosong)
    _payments = List<PaymentModel>.from(
      (widget.order.payments ?? <PaymentModel>[]),
    );
  }

  @override
  void dispose() {
    _customCashController.dispose();
    for (final c in _splitAmountControllers.values) {
      c.dispose();
    }
    for (final c in _splitCashControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  // ======= HITUNGAN DASAR GLOBAL =======

  int get _grandTotal => widget.order.grandTotal;

  int get _totalPaid {
    return _payments.fold<int>(0, (sum, p) => sum + p.amount);
  }

  int get _remaining {
    final remaining = _grandTotal - _totalPaid;
    return remaining < 0 ? 0 : remaining;
  }

  // ======= SINGLE PAYMENT: CASH LOGIC =======

  bool get _isCashSelectedSingle =>
      _selectedMethod != null && _selectedMethod!.id == 'cash';

  int? get _effectiveTenderedSingle {
    if (!_isCashSelectedSingle) return null;

    if (_selectedCashPreset != null) {
      return _selectedCashPreset;
    }

    if (_customCashController.text.isNotEmpty) {
      final digitsOnly = _customCashController.text.replaceAll(
        RegExp(r'[^0-9]'),
        '',
      );
      final parsed = int.tryParse(digitsOnly);
      return parsed;
    }

    return null;
  }

  int get _amountThisPaymentSingleMode => _remaining;

  int get _changeSingleMode {
    if (!_isCashSelectedSingle) return 0;
    final tendered = _effectiveTenderedSingle ?? 0;
    final amount = _amountThisPaymentSingleMode;
    final change = tendered - amount;
    return change > 0 ? change : 0;
  }

  bool get _canPaySingleMode {
    if (_selectedMethod == null) return false;
    if (_remaining <= 0) return false;

    if (_isCashSelectedSingle) {
      final tendered = _effectiveTenderedSingle;
      if (tendered == null) return false;
      return tendered >= _amountThisPaymentSingleMode;
    }

    // non cash → cukup pilih method
    if (_selectedMethod!.id != 'cash') {
      return _selectedType != null;
    }

    return false;
  }

  // ======= SPLIT PAYMENT: HELPER =======

  List<SplitCard> get _unpaidSplitCards =>
      _splitCards.where((c) => !c.isPaid).toList();

  bool get _isSplitPlanValid {
    if (_unpaidSplitCards.isEmpty) {
      // kalau semua paid, valid hanya jika sisa global 0
      return _remaining == 0;
    }

    final plannedTotal = _unpaidSplitCards.fold<int>(
      0,
      (sum, c) => sum + c.amount,
    );

    return plannedTotal == _remaining;
  }

  String? get _splitPlanError {
    if (_unpaidSplitCards.isEmpty) return null;

    final plannedTotal = _unpaidSplitCards.fold<int>(
      0,
      (sum, c) => sum + c.amount,
    );

    if (plannedTotal < _remaining) {
      return 'Total nominal split masih kurang dari sisa tagihan.';
    }

    if (plannedTotal > _remaining) {
      return 'Total nominal split melebihi sisa tagihan.';
    }

    return null;
  }

  // Rebalance kartu split yang belum dibayar, perhatikan mana yang manual
  void _rebalanceUnpaidCards() {
    final remaining = _remaining;
    final unpaid = _unpaidSplitCards;

    if (unpaid.isEmpty) {
      setState(() {});
      return;
    }

    // Pisahkan manual dan auto
    final manualCards = unpaid.where((c) => c.isManual).toList();
    final autoCards = unpaid.where((c) => !c.isManual).toList();

    final manualTotal = manualCards.fold<int>(0, (sum, c) => sum + c.amount);
    final remainingForAuto = remaining - manualTotal;

    // Kalau manualTotal > remaining → plan invalid, biarkan saja
    if (remainingForAuto < 0) {
      setState(() {});
      return;
    }

    if (autoCards.isEmpty) {
      setState(() {});
      return;
    }

    final count = autoCards.length;
    final base = count == 0 ? 0 : remainingForAuto ~/ count;
    var extra = count == 0 ? 0 : remainingForAuto % count;

    autoCards.sort((a, b) => a.id.compareTo(b.id));

    for (final card in autoCards) {
      var amt = base;
      if (extra > 0) {
        amt += 1;
        extra -= 1;
      }
      card.amount = amt;
    }

    _syncSplitControllers();
    setState(() {});
  }

  void _syncSplitControllers() {
    for (final card in _splitCards) {
      // nominal tagihan per card
      final amountCtrl =
          _splitAmountControllers[card.id] ??
          TextEditingController(text: card.amount.toString());
      amountCtrl.text = card.amount.toString();
      _splitAmountControllers[card.id] = amountCtrl;

      // cash/tender per card: kalau belum ada, kosongkan
      _splitCashControllers.putIfAbsent(card.id, () => TextEditingController());
    }
  }

  void _initSplitCardsIfNeeded() {
    if (_splitCards.isNotEmpty) return;

    final remaining = _remaining;
    if (remaining <= 0) return;

    // Default 2 kartu split, dibagi rata
    final half = remaining ~/ 2;
    final other = remaining - half;

    _splitCards.addAll([
      SplitCard(id: 'split-1', amount: half),
      SplitCard(id: 'split-2', amount: other),
    ]);

    _syncSplitControllers();
  }

  void _addSplitCard() {
    final remaining = _remaining;
    if (remaining <= 0) return;

    final newId = 'split-${_splitCards.length + 1}';
    _splitCards.add(SplitCard(id: newId, amount: 0));
    _syncSplitControllers();

    // semua unpaid auto dulu
    for (var i = 0; i < _splitCards.length; i++) {
      if (!_splitCards[i].isPaid) {
        _splitCards[i] = _splitCards[i].copyWith(isManual: false);
      }
    }

    _rebalanceUnpaidCards();
  }

  void _removeSplitCard(SplitCard card) {
    // 1. hanya card yang belum dibayar
    if (card.isPaid) return;

    // 2. total card harus > 2
    if (_splitCards.length <= 2) return;

    // 3. jumlah card yang belum dibayar harus > 1
    final unpaid = _unpaidSplitCards;
    if (unpaid.length <= 1) return;

    // benar-benar hapus
    _splitCards.removeWhere((c) => c.id == card.id);

    final amountCtrl = _splitAmountControllers.remove(card.id);
    amountCtrl?.dispose();

    final cashCtrl = _splitCashControllers.remove(card.id);
    cashCtrl?.dispose();

    _splitCashPresetSelected.remove(card.id);

    // reset manual dan rebalance
    for (var i = 0; i < _splitCards.length; i++) {
      if (!_splitCards[i].isPaid) {
        _splitCards[i] = _splitCards[i].copyWith(isManual: false);
      }
    }
    _rebalanceUnpaidCards();
  }

  void _onSplitAmountChanged(SplitCard card, String value) {
    if (card.isPaid) return;

    final digitsOnly = value.replaceAll(RegExp(r'[^0-9]'), '');
    final parsed = int.tryParse(digitsOnly) ?? 0;
    final newAmount = parsed < 0 ? 0 : parsed;

    final idx = _splitCards.indexOf(card);
    if (idx == -1) return;

    _splitCards[idx] = _splitCards[idx].copyWith(
      amount: newAmount,
      isManual: true,
    );

    _rebalanceUnpaidCards();
  }

  // 🔹 tendered per split card (cash)
  int? _getTenderedForCard(SplitCard card) {
    if (card.type?.id != 'cash') return null;
    final preset = _splitCashPresetSelected[card.id];
    if (preset != null) return preset;

    final ctrl = _splitCashControllers[card.id];
    if (ctrl == null || ctrl.text.isEmpty) return null;

    final digitsOnly = ctrl.text.replaceAll(RegExp(r'[^0-9]'), '');
    final parsed = int.tryParse(digitsOnly);
    return parsed;
  }

  int _getChangeForCard(SplitCard card) {
    if (card.type?.id != 'cash') return 0;
    final tendered = _getTenderedForCard(card) ?? 0;
    final change = tendered - card.amount;
    return change > 0 ? change : 0;
  }

  bool _canPaySplitCard(SplitCard card) {
    if (!_isSplitPlanValid) return false;
    if (card.isPaid) return false;
    if (card.amount <= 0) return false;
    if (card.amount > _remaining) return false;

    if (card.type == null) return false;

    if (card.type!.id == 'cash') {
      final tendered = _getTenderedForCard(card);
      if (tendered == null) return false;
      if (tendered < card.amount) return false;
      return true;
    } else {
      return card.method != null;
    }
  }

  void _onPaySplitCard(SplitCard card) {
    if (!_canPaySplitCard(card)) return;

    final amount = card.amount;
    final tendered = _getTenderedForCard(card) ?? amount;
    final change = _getChangeForCard(card);

    final remainingAfter = (_remaining - amount).clamp(0, _grandTotal);

    final payment = PaymentHelper.buildPaymentModelForCard(
      orderId: widget.order.orderId,
      methodModel: _selectedMethod!,
      typeModel: _selectedType,
      amount: amount,
      remainingAfter: remainingAfter,
      tendered: tendered,
      change: change,
    );

    setState(() {
      _payments = [..._payments, payment];

      final idx = _splitCards.indexOf(card);
      if (idx != -1) {
        _splitCards[idx] = card.copyWith(isPaid: true, isManual: true);
      }

      // sisa kartu unpaid → auto lagi
      for (var i = 0; i < _splitCards.length; i++) {
        if (!_splitCards[i].isPaid) {
          _splitCards[i] = _splitCards[i].copyWith(isManual: false);
        }
      }

      _rebalanceUnpaidCards();
    });

    // Jika setelah bayar ini sisa tagihan 0 → kirim ke backend
    if (_remaining == 0) {
      _finishOrderToBackend();
    }
  }

  void _finishOrderToBackend() {
    //TODO: kirim ke backend
    final orderDetailNotifier = ref.read(orderDetailProvider.notifier);
    // 1. Sync _payments ke OrderDetailProvider / OrderDetailModel
    orderDetailNotifier.setPayments(_payments);
    // 2. Panggil service utk kirim ke backend (unified-order / process-payment)
    orderDetailNotifier.submitOrder(ref);
    debugPrint(
      'Selesaikan order. TotalPaid=$_totalPaid, Payments=${_payments.length}',
    );
  }

  // ======= UI BUILD =======

  @override
  Widget build(BuildContext context) {
    final methodsAsync = ref.watch(paymentMethodsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        title: const Text(
          'Pembayaran',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        centerTitle: true,
        actions: [
          TextButton.icon(
            onPressed: () {
              setState(() {
                if (_mode == PaymentMode.single) {
                  _mode = PaymentMode.split;
                  _initSplitCardsIfNeeded();
                } else {
                  _mode = PaymentMode.single;
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
      body: methodsAsync.when(
        data: (methods) {
          final activeMethods = methods.where((m) => m.isActive).toList();
          return Row(
            children: [
              // ========= PANEL KIRI: DETAIL TAGIHAN + RIWAYAT PAYMENT =========
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

              // ========= PANEL KANAN: AREA PEMBAYARAN =========
              Expanded(
                flex: 5,
                child: Column(
                  children: [
                    const SizedBox(height: 8),
                    Expanded(
                      child:
                          _mode == PaymentMode.single
                              ? _buildSinglePaymentPanel(activeMethods)
                              : _buildSplitPaymentPanel(activeMethods),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error:
            (e, _) => Center(child: Text('Gagal memuat tipe pembayaran: $e')),
      ),
    );
  }

  // ======= PANEL KIRI =======

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
                              '-$p',
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
                            if (p.changeAmount != null &&
                                (p.changeAmount ?? 0) > 0)
                              Text(
                                'Kembalian: ${formatRupiah(p.changeAmount!)}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Colors.blueGrey,
                                ),
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

  // ======= PANEL KANAN: SINGLE PAYMENT =======

  Widget _buildSinglePaymentPanel(List<PaymentMethodModel> activeMethods) {
    return Column(
      children: [
        _buildPaymentMethodsSingle(activeMethods),
        const SizedBox(height: 8),
        Expanded(
          child: Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            padding: const EdgeInsets.all(12),
            decoration: _boxWhite(),
            child:
                _selectedMethod == null
                    ? Center(
                      child: Text(
                        'Pilih tipe pembayaran terlebih dahulu',
                        style: TextStyle(color: Colors.grey[500]),
                      ),
                    )
                    : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_isCashSelectedSingle)
                          _buildCashOptionsSingle()
                        else
                          Expanded(
                            child: _buildNonCashTypesSingle(_selectedMethod!),
                          ),
                        const SizedBox(height: 8),
                        _buildBottomActionBarSingle(),
                      ],
                    ),
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentMethodsSingle(List<PaymentMethodModel> methods) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Metode Pembayaran',
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
              itemCount: methods.length,
              itemBuilder: (context, index) {
                final method = methods[index];
                final isSelected = _selectedMethod?.id == method.id;

                return Container(
                  width: 100,
                  margin: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedMethod = method;
                        _selectedType = null;
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
                            _getPaymentMethodIcon(method.id),
                            size: 20,
                            color: isSelected ? Colors.white : Colors.grey[700],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            method.name,
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

  Widget _buildCashOptionsSingle() {
    final basis = _amountThisPaymentSingleMode;
    final suggestions = PaymentHelper.getCashSuggestions(basis);

    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Uang Diterima',
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
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
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
          const SizedBox(height: 4),
          Text(
            'Kembalian: ${formatRupiah(_changeSingleMode)}',
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildNonCashTypesSingle(PaymentMethodModel method) {
    final activeTypes =
        method.paymentTypes
            .where((t) => t.isActive && !t.isDigital == false || true)
            .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Channel ${method.name}',
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: GridView.builder(
            itemCount: activeTypes.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 3.2,
            ),
            itemBuilder: (context, index) {
              final type = activeTypes[index];
              final isSelected = _selectedType?.id == type.id;

              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedType = type;
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
                      type.name,
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

  Widget _buildBottomActionBarSingle() {
    return SizedBox(
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
    );
  }

  void _onPaySingleMode() {
    if (_selectedMethod == null) return;
    final amount = _amountThisPaymentSingleMode;
    final tendered = _effectiveTenderedSingle ?? amount;
    final change = _changeSingleMode;

    // final payment = PaymentModel(
    //   orderId: widget.order.orderId,
    //   method: _currentMethodNameSingle(),
    //   paymentType: _selectedType?.typeCode,
    //   amount: amount,
    //   tenderedAmount: tendered,
    //   changeAmount: change,
    //   remainingAmount: 0,
    //   status: 'settlement',
    //   createdAt: DateTime.now(),
    // );
    final payment = PaymentHelper.buildPaymentModelForCard(
      orderId: widget.order.orderId,
      methodModel: _selectedMethod!,
      typeModel: _selectedType, // bisa null kalau Cash polos
      amount: amount,
      remainingAfter: _remaining,
      tendered: tendered,
      change: change,
    );

    setState(() {
      _payments = [..._payments, payment];
    });

    // Jika setelah bayar sisa tagihan 0 → kirim ke backend
    if (_remaining == 0) {
      _finishOrderToBackend();
    }
  }

  String _currentMethodNameSingle() {
    if (_isCashSelectedSingle) return 'Cash';
    if (_selectedMethod != null) return _selectedMethod!.name;
    return _selectedType?.name ?? 'Payment';
  }

  // ======= PANEL KANAN: SPLIT PAYMENT =======

  Widget _buildSplitPaymentPanel(List<PaymentMethodModel> activeMethods) {
    return Column(
      children: [
        // Header + tombol tambah split
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
          child: Row(
            children: [
              Text(
                'Split Payment',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: _addSplitCard,
                icon: const Icon(Icons.add, size: 16),
                label: const Text(
                  'Tambah Split',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  side: const BorderSide(color: Color(0xFF2E7D4F)),
                  foregroundColor: const Color(0xFF2E7D4F),
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ],
          ),
        ),

        // List card split
        Expanded(
          child:
              _splitCards.isEmpty
                  ? Center(
                    child: Text(
                      'Belum ada card split.\nTekan "Tambah Split" untuk mulai.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey[500]),
                    ),
                  )
                  : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    itemCount: _splitCards.length,
                    itemBuilder: (context, index) {
                      final card = _splitCards[index];
                      return _buildSplitCardItem(card, index, activeMethods);
                    },
                  ),
        ),

        if (_splitPlanError != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
            child: Text(
              _splitPlanError!,
              style: const TextStyle(
                fontSize: 11,
                color: Colors.red,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildSplitCardItem(
    SplitCard card,
    int index,
    List<PaymentMethodModel> activeMethods,
  ) {
    final amountCtrl =
        _splitAmountControllers[card.id] ??
        TextEditingController(text: card.amount.toString());
    _splitAmountControllers[card.id] = amountCtrl;

    final cashCtrl = _splitCashControllers[card.id] ?? TextEditingController();
    _splitCashControllers[card.id] = cashCtrl;

    final canDelete =
        !card.isPaid && _splitCards.length > 2 && _unpaidSplitCards.length > 1;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: _boxWhite(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Text(
                'Split #${index + 1}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 8),
              if (card.isPaid)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green[50],
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    'Paid',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: Colors.green[700],
                    ),
                  ),
                ),
              const Spacer(),
              if (canDelete)
                IconButton(
                  onPressed: () => _removeSplitCard(card),
                  icon: const Icon(Icons.close, size: 16),
                  splashRadius: 20,
                  color: Colors.red[400],
                ),
            ],
          ),
          const SizedBox(height: 8),
          // Nominal
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: amountCtrl,
                  readOnly: card.isPaid,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Nominal',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    prefixText: 'Rp ',
                  ),
                  onChanged: (val) => _onSplitAmountChanged(card, val),
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'Sisa global:',
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
          const SizedBox(height: 8),
          // Pilih tipe bayar
          SizedBox(
            height: 60,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: activeMethods.length,
              itemBuilder: (context, idx) {
                final method = activeMethods[idx];
                final isSelected = card.method?.id == method.id;

                return Container(
                  width: 90,
                  margin: const EdgeInsets.only(right: 6),
                  child: GestureDetector(
                    onTap:
                        card.isPaid
                            ? null
                            : () {
                              setState(() {
                                final i = _splitCards.indexOf(card);
                                if (i == -1) return;
                                _splitCards[i] = _splitCards[i].copyWith(
                                  method: method,
                                  type: null,
                                );
                                // kalau bukan cash, reset cash UI
                                if (method.id != 'cash') {
                                  _splitCashPresetSelected[card.id] = null;
                                  cashCtrl.clear();
                                }
                              });
                            },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      decoration: BoxDecoration(
                        color:
                            isSelected ? const Color(0xFF2E7D4F) : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color:
                              isSelected
                                  ? const Color(0xFF2E7D4F)
                                  : Colors.grey.shade300,
                          width: 1.1,
                        ),
                      ),
                      padding: const EdgeInsets.all(6),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _getPaymentMethodIcon(method.id),
                            size: 18,
                            color: isSelected ? Colors.white : Colors.grey[700],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            method.name,
                            style: TextStyle(
                              fontSize: 10,
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
          const SizedBox(height: 8),
          // Metode / cash per card
          if (card.method != null) _buildSplitCardTypeSection(card),
          const SizedBox(height: 8),
          // Tombol bayar
          SizedBox(
            width: double.infinity,
            height: 40,
            child: ElevatedButton(
              onPressed:
                  _canPaySplitCard(card) && !card.isPaid
                      ? () => _onPaySplitCard(card)
                      : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D4F),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                card.isPaid ? 'Sudah Dibayar' : 'Bayar Split Ini',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSplitCardTypeSection(SplitCard card) {
    if (card.method == null) {
      return const SizedBox.shrink();
    }

    if (card.method!.id == 'cash') {
      return _buildSplitCardCashOptions(card);
    }

    final types = card.method!.paymentTypes.where((m) => m.isActive).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Metode ${card.method!.name}',
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 4),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children:
              types.map((type) {
                final isSelected = card.type?.id == type.id;
                return ChoiceChip(
                  label: Text(type.name, style: const TextStyle(fontSize: 11)),
                  selected: isSelected,
                  onSelected:
                      card.isPaid
                          ? null
                          : (_) {
                            setState(() {
                              final idx = _splitCards.indexOf(card);
                              if (idx == -1) return;
                              _splitCards[idx] = _splitCards[idx].copyWith(
                                type: type,
                              );
                            });
                          },
                  selectedColor: const Color(0xFF2E7D4F),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : Colors.grey[800],
                    fontWeight: FontWeight.w600,
                  ),
                );
              }).toList(),
        ),
      ],
    );
  }

  // 🔹 Cash per split card
  Widget _buildSplitCardCashOptions(SplitCard card) {
    final basis = card.amount <= 0 ? 1000 : card.amount;
    final suggestions = PaymentHelper.getCashSuggestions(basis);
    final selectedPreset = _splitCashPresetSelected[card.id];
    final cashCtrl = _splitCashControllers[card.id]!;

    final change = _getChangeForCard(card);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Uang Diterima (Split #${_splitCards.indexOf(card) + 1})',
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children:
              suggestions.map((amount) {
                final isSelected = selectedPreset == amount;
                return ChoiceChip(
                  label: Text(
                    amount == card.amount ? 'Uang Pas' : formatRupiah(amount),
                  ),
                  selected: isSelected,
                  onSelected:
                      card.isPaid
                          ? null
                          : (_) {
                            setState(() {
                              _splitCashPresetSelected[card.id] = amount;
                              cashCtrl.clear();
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
        const SizedBox(height: 6),
        TextField(
          controller: cashCtrl,
          readOnly: card.isPaid,
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
            if (card.isPaid) return;
            setState(() {
              _splitCashPresetSelected[card.id] = null;
            });
          },
          onChanged: (_) {
            setState(() {});
          },
        ),
        const SizedBox(height: 4),
        Text(
          'Kembalian: ${formatRupiah(change)}',
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  // ======= UTIL =======

  IconData _getPaymentMethodIcon(String methodId) {
    switch (methodId) {
      case 'cash':
        return Icons.money;
      case 'ewallet':
        return Icons.account_balance_wallet;
      case 'debit':
        return Icons.credit_card;
      case 'banktransfer':
        return Icons.account_balance;
      case 'qris':
        return Icons.qr_code_2;
      default:
        return Icons.payment;
    }
  }

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
