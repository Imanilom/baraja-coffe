import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/helper/offline_order_id_generator.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/providers/menu_item_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/order_history_provider.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:kasirbaraja/repositories/menu_item_repository.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/services/order_service.dart'; // ✅ NEW
import 'package:kasirbaraja/providers/orders/pending_order_provider.dart'; // ✅ NEW
import 'package:kasirbaraja/providers/order_detail_providers/pending_order_detail_provider.dart';
import 'package:kasirbaraja/services/printer_service.dart'; // ✅ NEW
import 'package:kasirbaraja/providers/orders/saved_order_provider.dart'; // ✅ NEW
// ✅ NEW: Import UUID

// Provider tipe pembayaran yang sudah kamu punya
import 'package:kasirbaraja/providers/payment_provider.dart'
    show paymentMethodsProvider;

// 🔹 Helper saran cash
import 'package:kasirbaraja/helper/payment_helper.dart';
import 'package:kasirbaraja/utils/payment_details_utils.dart';
import 'package:kasirbaraja/models/order_status.model.dart'; // ✅ NEW: Import OrderStatus model

/// Mode pembayaran:
/// - single: tanpa split, 1x bayar langsung lunas
/// - split : beberapa pembayaran (multi card)
enum PaymentMode { single, split }

enum SubmitStatus { idle, submitting, success, failed }

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
  // ======= AUTO-DETECT CLOSE BILL =======
  /// Auto-detect if this is close bill operation from order properties
  /// Close bill = order with isOpenBill flag set to true
  bool get _isCloseBill {
    return widget.order.isOpenBill == true;
  }

  // ======= MODE =======
  PaymentMode _mode = PaymentMode.single;

  // ======= SINGLE PAYMENT STATE =======
  PaymentMethodModel? _selectedMethod;
  PaymentTypeModel? _selectedType;
  SubmitStatus _submitStatus = SubmitStatus.idle;
  String? _submitErrorMessage;

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
      (widget.order.payments.isNotEmpty
          ? widget.order.payments
          : <PaymentModel>[]),
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

  bool _isCardCash(SplitCard card) {
    return card.method?.id.toLowerCase() == 'cash';
  }

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
    if (!_isCardCash(card)) return null;

    final preset = _splitCashPresetSelected[card.id];
    if (preset != null) return preset;

    final ctrl = _splitCashControllers[card.id];
    if (ctrl == null || ctrl.text.isEmpty) return null;

    final digitsOnly = ctrl.text.replaceAll(RegExp(r'[^0-9]'), '');
    final parsed = int.tryParse(digitsOnly);
    return parsed;
  }

  int _getChangeForCard(SplitCard card) {
    if (!_isCardCash(card)) return 0;
    final tendered = _getTenderedForCard(card) ?? 0;
    final change = tendered - card.amount;
    return change > 0 ? change : 0;
  }

  bool _canPaySplitCard(SplitCard card) {
    debugPrint('--- canPaySplitCard #${card.id} ---');
    debugPrint(
      'amount=${card.amount}, remaining=$_remaining, isPaid=${card.isPaid}',
    );
    debugPrint('method=${card.method?.id}, type=${card.type?.id}');
    debugPrint('isCash=${_isCardCash(card)}');
    debugPrint('plannedValid=$_isSplitPlanValid');

    if (!_isSplitPlanValid) return false;
    if (card.isPaid) return false;
    if (card.amount <= 0) return false;
    if (card.amount > _remaining) return false;

    if (_isCardCash(card)) {
      final tendered = _getTenderedForCard(card);
      if (tendered == null) return false;
      if (tendered < card.amount) return false;
      return true;
    } else {
      // non-cash: butuh method + type (channel bank/etc)
      return card.method != null && card.type != null;
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
      methodModel: card.method!,
      typeModel: _isCardCash(card) ? null : card.type,
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

  Future<void> _finishOrderToBackend() async {
    final sw = Stopwatch()..start();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );
    if (_submitStatus == SubmitStatus.submitting) return;

    setState(() {
      _submitStatus = SubmitStatus.submitting;
      _submitErrorMessage = null;
    });

    try {
      // ✅ Auto-detect: Check if this is close bill operation
      if (_isCloseBill) {
        await _submitCloseBill();
      } else {
        // Existing regular order submit
        final notifier = ref.read(orderDetailProvider.notifier);
        notifier.setPayments(_payments);

        final result = await notifier.submitOrder();
        debugPrint('submitOrder took: ${sw.elapsedMilliseconds}ms');

        debugPrint('result submitOrder: $result');
        if (result && context.mounted) {
          setState(() {
            _submitStatus = SubmitStatus.success;
          });
          ref.invalidate(orderHistoryProvider);
          final savedPrinter = ref.read(savedPrintersProvider.notifier);
          savedPrinter.printToPrinter(
            orderDetail: ref.read(orderDetailProvider) ?? widget.order,
            printType: 'all',
          );
          try {
            final menuRepo = MenuItemRepository();

            // Kurangi stok di Hive sesuai qty yang dibeli
            menuRepo
                .decreaseLocalStockFromOrderItems(widget.order.items)
                .catchError((e) {
                  debugPrint('decreaseLocalStockFromOrderItems gagal: $e');
                });

            // refresh menu badge stok
            ref.invalidate(reservationMenuItemProvider);

            debugPrint('✅ Stok lokal berhasil dikurangi setelah transaksi');
          } catch (e) {
            debugPrint('⚠️ Gagal mengurangi stok lokal: $e');
          }
          if (mounted) {
            context.goNamed(
              'payment-success',
              extra: {'orderDetail': ref.read(orderDetailProvider)},
            );
          }
        }
      }
    } on DioException catch (e) {
      // ERROR dari backend / jaringan
      if (mounted) Navigator.pop(context);
      final msg = _mapDioErrorToMessage(e);
      _showSubmitFailedDialog(msg);
      setState(() {
        _submitStatus = SubmitStatus.failed;
        _submitErrorMessage = e.toString();
      });
    } catch (e) {
      //pop context
      if (mounted) Navigator.pop(context);
      _showSubmitFailedDialog('Terjadi kesalahan tak terduga: $e');
      setState(() {
        _submitStatus = SubmitStatus.failed;
        _submitErrorMessage = e.toString();
      });
    } finally {
      //pop context
      // if (mounted) Navigator.pop(context);
      sw.stop();
      debugPrint('refresh took: ${sw.elapsedMilliseconds}ms');
    }
  }

  // ✅ NEW: Submit close bill with payment details via Unified Order
  Future<void> _submitCloseBill() async {
    try {
      final cashier = await Hive.box('userBox').get('cashier');
      if (cashier == null || cashier.id == null) {
        throw Exception('Cashier not authenticated');
      }

      // 1. Prepare Payment Models locally (untuk update UI & Receipt)
      final List<PaymentModel> payments = [];
      if (_mode == PaymentMode.split) {
        // Multiple payments
        for (var p in _payments) {
          payments.add(p);
        }
      } else {
        // Single payment
        if (_payments.isNotEmpty) {
          payments.add(_payments.first);
        }
      }

      // 2. Adjust total payment to match exact grand total
      // (Logic adjustment payment amount existing di payment_screen sudah handle ini via _payments management biasanya,
      // tapi kita pastikan lagi jika backend butuh exact match)

      // 3. Prepare Cloned Order for Submission
      // ⚠️ PENTING: Set Order ID ke empty agar backend generate ID baru
      // Logic ID generation dipindah ke backend (order.controller.js)

      // Simpan ID lama untuk hapus data lokal nanti
      final oldOrderId = widget.order.orderId;
      final idempotencyKey =
          '${oldOrderId}_${DateTime.now().millisecondsSinceEpoch}';

      debugPrint(
        '🔀 Switching Order ID for submission: $oldOrderId -> Backend Generated',
      );

      final orderToSubmit = widget.order.copyWith(
        orderId: '', // Empty string to trigger backend generation
        status: OrderStatusModel.completed,
        paymentStatus: 'settlement',
        payments: payments,
        // Ensure creation/update time is fresh for this transaction
        updatedAt: DateTime.now(),
        isSplitPayment: _payments.length > 1,
        // Kirim original createdAt sebagai openBillStartedAt?
        // Tidak ada field khusus di model, tapi backend controller bisa baca dari created_at open bill asli jika kita kirim.
        // Tapi createOrderRequest pakai order detail ini.
        // Kita bisa pass original date via field lain atau biarkan backend handle.
        cashier: widget.order.cashier ?? cashier,
      );

      // 4. Submit via Unified Order Endpoint (createOrder)
      // Ini akan trigger logic backend: isOpenBill=true + hasPayment -> processCashierOrderDirect
      final orderService = OrderService();

      debugPrint('🚀 Submitting Open Bill as Unified Order...');
      final result = await orderService.createOrder(
        orderToSubmit,
        idempotencyKey: idempotencyKey, // Use generated key
      );

      // 5. Success Handling
      // Cek result valid. Backend return { success: true, data: orderObject, ... }
      // atau langsung orderObject tergantung implementasi service.
      // Kita assumsikan result adalah Map dari JSON response.
      final responseData = result['data'] ?? result['order'] ?? result;
      final newBackendId = responseData['order_id'] ?? responseData['orderId'];

      if (newBackendId != null) {
        setState(() {
          _submitStatus = SubmitStatus.success;
        });

        // Update orderToSubmit dengan ID dari backend untuk keperluan print & navigasi
        final finalOrder = orderToSubmit.copyWith(
          orderId: newBackendId,
          // Update timestamps jika perlu, tapi backend mungkin kirim format string Date yang perlu diparse.
          // Untuk aman, kita pakai timestamp lokal untuk UI, atau parse dari response jika kritikal.
          // Kita pakai newBackendId saja sudah cukup untuk struk.
        );

        // Refresh providers
        ref.invalidate(pendingOrderProvider);
        ref.read(pendingOrderDetailProvider.notifier).clearPendingOrderDetail();
        ref.invalidate(orderHistoryProvider);
        ref.invalidate(savedOrderProvider); // Refresh list saved orders

        // 6. Delete OLD Local Order (Open Bill Local)
        if (oldOrderId != null) {
          try {
            await ref.read(savedOrderProvider.notifier).deleteOrder(oldOrderId);
            debugPrint('🗑️ Deleted local open bill: $oldOrderId');
          } catch (e) {
            debugPrint('⚠️ Gagal hapus lokal open bill lama: $e');
          }
        }

        // 7. Print Receipt
        final printers = ref.read(savedPrintersProvider);
        if (printers.isNotEmpty) {
          await PrinterService.printDocuments(
            orderDetail: finalOrder, // ✅ Use order with Backend ID
            printType: 'customer',
            printers: printers,
          );
        }

        // 8. Navigate Success
        if (mounted) {
          Navigator.pop(context); // Close loading dialog
          context.goNamed(
            'payment-success',
            extra: {
              'orderDetail': finalOrder,
              'isCloseBill': true,
            }, // ✅ Use order with Backend ID
          );
        }
      } else {
        throw Exception('Failed to create order: Valid response missing');
      }
    } catch (e) {
      debugPrint('❌ Error submitting open bill: $e');
      rethrow; // Akan ditangkap catch di _finishOrderToBackend
    }
  }

  Future<void> _createOfflineOrder({
    required int tableNumber,
    required String deviceName,
    required OrderDetailModel draftOrder,
  }) async {
    // buka box untuk order offline (sesuaikan nama box kamu)
    final box = Hive.box<OrderDetailModel>('offlineOrdersBox');

    // kumpulkan order_id yang sudah ada di lokal
    final existingIds =
        box.values
            .where((o) => o.orderId != null)
            .map((o) => o.orderId!)
            .toList();

    // generate ID offline
    final orderId = await OfflineOrderIdGenerator.generate(
      tableNumber: tableNumber,
      deviceName: deviceName,
      existingOrderIds: existingIds,
    );

    final offlineOrder = draftOrder.copyWith(
      orderId: orderId,
      // misal kamu punya flag isOffline / isSynced
      // isOffline: true,
      // isSynced: false,
    );

    // simpan ke Hive
    await box.put(orderId, offlineOrder);

    // lanjut:
    // - print struk pakai orderId ini
    // - kirim ke kitchen/bar (kalau kamu mau local-only pas offline)
  }

  String _mapDioErrorToMessage(DioException e) {
    final status = e.response?.statusCode;
    if (status != null && status >= 400 && status < 500) {
      return 'Gagal menyimpan transaksi. Data tidak valid atau sudah diproses sebelumnya.';
    }
    return 'Gagal mengirim transaksi ke server. Periksa koneksi dan coba lagi.';
  }

  void _showSubmitFailedDialog(String message) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Gagal Menyelesaikan Transaksi'),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Tutup'),
            ),
          ],
        );
      },
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
        title: Text(
          _isCloseBill ? 'Close Bill - Pembayaran' : 'Pembayaran',
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        centerTitle: true,
        actions: [
          TextButton.icon(
            onPressed: () {
              final orderDetailNotifier = ref.read(
                orderDetailProvider.notifier,
              );
              setState(() {
                if (_mode == PaymentMode.single) {
                  _mode = PaymentMode.split;
                  _initSplitCardsIfNeeded();
                  orderDetailNotifier.updateIsSplitPayment(
                    true,
                  ); // ✅ Set split payment flag
                } else {
                  _mode = PaymentMode.single;
                  orderDetailNotifier.updateIsSplitPayment(
                    false,
                  ); // ✅ Clear split payment flag
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
              Expanded(flex: 2, child: _buildSummaryCard()),

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
                    if (_submitStatus == SubmitStatus.failed)
                      Container(
                        margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red[200]!),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              Icons.error_outline,
                              color: Colors.red,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Gagal mengirim order ke server',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.red,
                                    ),
                                  ),
                                  if (_submitErrorMessage != null)
                                    Text(
                                      _submitErrorMessage!,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.black87,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            TextButton(
                              onPressed:
                                  _submitStatus == SubmitStatus.submitting
                                      ? null
                                      : _finishOrderToBackend,
                              child: const Text(
                                'Try Again',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
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
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green[600]!, Colors.green[800]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.1),
              ),
            ),
          ),
          Positioned(
            left: -30,
            bottom: -30,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.05),
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.receipt_long,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Detail Tagihan',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      _buildModernSummaryItem(
                        icon: Icons.account_balance_wallet,
                        label: 'Total Tagihan',
                        value: formatRupiah(_grandTotal),
                        iconColor: Colors.green[700]!,
                        isHighlight: true,
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Row(
                          children: [
                            Expanded(
                              child: Container(
                                height: 1,
                                color: Colors.grey[200],
                              ),
                            ),
                          ],
                        ),
                      ),
                      _buildModernSummaryItem(
                        icon: Icons.check_circle,
                        label: 'Sudah Bayar',
                        value: formatRupiah(_totalPaid),
                        iconColor: Colors.green[600]!,
                        compact: true,
                      ),
                      SizedBox(height: 4),
                      _buildModernSummaryItem(
                        icon: Icons.pending,
                        label: 'Sisa Tagihan',
                        value: formatRupiah(_remaining),
                        iconColor:
                            _remaining > 0
                                ? Colors.orange[600]!
                                : Colors.grey[400]!,
                        compact: true,
                        isHighlight: _remaining > 0,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(child: _buildExistingPaymentsList()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModernSummaryItem({
    required IconData icon,
    required String label,
    required String value,
    required Color iconColor,
    bool isHighlight = false,
    bool compact = false,
  }) {
    return Column(
      crossAxisAlignment:
          compact ? CrossAxisAlignment.center : CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment:
              compact ? MainAxisAlignment.center : MainAxisAlignment.start,
          children: [
            Icon(icon, size: compact ? 16 : 18, color: iconColor),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: compact ? 11 : 12,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        SizedBox(height: compact ? 6 : 8),
        Text(
          value,
          style: TextStyle(
            fontSize: compact ? 15 : 20,
            fontWeight: FontWeight.w700,
            color: isHighlight ? iconColor : Colors.grey[800],
            letterSpacing: 0.3,
          ),
          textAlign: compact ? TextAlign.center : TextAlign.left,
        ),
      ],
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
      padding: const EdgeInsets.all(16),
      decoration: _boxWhite(),
      child:
          _payments.isEmpty
              ? Center(
                child: Text(
                  'Belum ada pembayaran',
                  style: TextStyle(color: Colors.grey[500], fontSize: 12),
                ),
              )
              : Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                // mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Tombol Hapus Payment Terakhir
                  Container(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        ElevatedButton(
                          onPressed:
                              _payments.isNotEmpty
                                  ? () => _showDeletePaymentDialog()
                                  : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red[100],
                            foregroundColor: Colors.red[800],
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                              side: BorderSide(
                                color: Colors.red[300]!,
                                width: 1,
                              ),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.delete_outline, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                'Hapus Payment',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Daftar Payments
                  Expanded(
                    child: ListView.separated(
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
                                    PaymentDetails.buildPaymentMethodLabel(p),
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
                            // Tombol hapus per item (opsional)
                            // IconButton(
                            //   onPressed:
                            //       () => _showDeleteSinglePaymentDialog(index),
                            //   icon: const Icon(Icons.close, size: 16),
                            //   color: Colors.grey[500],
                            //   padding: EdgeInsets.zero,
                            //   constraints: const BoxConstraints(),
                            // ),
                          ],
                        );
                      },
                    ),
                  ),
                ],
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
    final activeTypes = method.paymentTypes.where((t) => t.isActive).toList();

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

  void _showDeletePaymentDialog() {
    if (_payments.isEmpty) return;

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Hapus Payment'),
          content: const Text(
            'Apakah Anda yakin ingin menghapus semua payment?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Batal'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _deleteAllPayments();
              },
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Hapus Semua'),
            ),
          ],
        );
      },
    );
  }

  void _showDeleteSinglePaymentDialog(int index) {
    if (index < 0 || index >= _payments.length) return;

    final payment = _payments[index];

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Hapus Payment'),
          content: Text(
            'Apakah Anda yakin ingin menghapus payment:\n${PaymentDetails.buildPaymentMethodLabel(payment)}\n${formatRupiah(payment.amount)}?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Batal'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _deleteSinglePayment(index);
              },
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Hapus'),
            ),
          ],
        );
      },
    );
  }

  void _deleteAllPayments() {
    setState(() {
      _payments.clear();

      // Jika dalam mode split, reset status semua kartu split
      if (_mode == PaymentMode.split) {
        for (var i = 0; i < _splitCards.length; i++) {
          _splitCards[i] = _splitCards[i].copyWith(
            isPaid: false,
            isManual: false,
          );
        }
        _rebalanceUnpaidCards();
      }
    });
  }

  void _deleteSinglePayment(int index) {
    if (index < 0 || index >= _payments.length) return;

    final deletedPayment = _payments[index];

    setState(() {
      _payments.removeAt(index);

      // Jika dalam mode split, cari dan reset kartu split yang sesuai
      if (_mode == PaymentMode.split) {
        // Cari kartu split yang sesuai dengan payment yang dihapus
        // Berdasarkan amount, method, dan type
        for (var i = 0; i < _splitCards.length; i++) {
          final card = _splitCards[i];
          if (card.isPaid &&
              card.amount == deletedPayment.amount &&
              card.method?.id == deletedPayment.method) {
            _splitCards[i] = card.copyWith(isPaid: false, isManual: false);
            break;
          }
        }
        _rebalanceUnpaidCards();
      }
    });
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
          color: Colors.black.withValues(alpha: 0.03),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ],
    );
  }
}
