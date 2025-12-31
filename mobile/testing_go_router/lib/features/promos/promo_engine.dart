import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/applied_promos.model.dart';
import 'package:kasirbaraja/models/affected_item.model.dart';
import 'package:kasirbaraja/models/free_item.model.dart';
import 'package:kasirbaraja/models/auto_promo.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';

class PromoEngine {
  static const freeItemMarker = '__FREE_ITEM__';

  static bool _isFreeItem(OrderItemModel it) =>
      (it.notes ?? '').contains(freeItemMarker);

  static int _unitPrice(OrderItemModel it) {
    if (it.quantity <= 0) return 0;
    // subtotal line sudah include addon/topping
    return it.subtotal ~/ it.quantity;
  }

  /// Helper buat _recalculateAll()
  static int sumAutoDiscount(List<AppliedPromosModel>? appliedPromos) {
    return (appliedPromos ?? []).fold<int>(
      0,
      (sum, p) => sum + (p.discount ?? 0),
    );
  }

  /// allowStackingOnTotal:
  /// - true  => discount_on_total dihitung dari invoice total (tetap jalan walau item sudah kepake promo lain)
  /// - false => discount_on_total hanya dihitung dari sisa item (remaining)
  static OrderDetailModel apply(
    OrderDetailModel order,
    List<AutoPromoModel> promos,
    DateTime now,
    MenuItemModel? Function(String id) findMenuItemById, {
    bool allowStackingOnTotal = false,
  }) {
    // 0) bersihkan free item lama biar ga numpuk
    final cleanedItems = order.items.where((it) => !_isFreeItem(it)).toList();
    var current = order.copyWith(items: cleanedItems, appliedPromos: []);

    // 1) promo aktif + sort priority
    final active =
        promos.where((p) => _isPromoActive(p, now)).toList()..sort(
          (a, b) => _priority(a.promoType).compareTo(_priority(b.promoType)),
        );

    debugPrint(
      'incoming promos: ${active.map((p) => "${p.name}(${p.id}) from:${p.validFrom} to:${p.validTo} active:${p.isActive}").toList()}',
    );
    debugPrint('active promos count: ${active.length}');

    // 2) remaining qty per LINE (biar aman untuk addon/topping)
    final remainingByLine = <int, int>{};
    for (int i = 0; i < current.items.length; i++) {
      final it = current.items[i];
      if (_isFreeItem(it)) continue;
      remainingByLine[i] = it.quantity;
    }

    final applied = <AppliedPromosModel>[];

    for (final promo in active) {
      PromoApplyResult? res;

      switch (promo.promoType) {
        case 'bundling':
          res = _applyBundling(current, promo, remainingByLine);
          break;
        case 'buy_x_get_y':
          res = _applyBuyXGetY(
            current,
            promo,
            remainingByLine,
            findMenuItemById,
          );
          break;
        case 'product_specific':
          res = _applyProductSpecific(current, promo, remainingByLine);
          break;
        case 'discount_on_quantity':
          res = _applyDiscountOnQuantity(current, promo, remainingByLine);
          break;
        case 'discount_on_total':
          res = _applyDiscountOnTotal(
            current,
            promo,
            remainingByLine,
            allowStackingOnTotal: allowStackingOnTotal,
          );
          break;
        default:
          res = null;
      }

      if (res == null) continue;

      current = res.order;
      applied.add(res.appliedPromo);
    }

    return current.copyWith(appliedPromos: applied);
  }

  // ---------------- Priority ----------------

  static int _priority(String promoType) {
    switch (promoType) {
      case 'bundling':
        return 10;
      case 'buy_x_get_y':
        return 20;
      case 'product_specific':
        return 30;
      case 'discount_on_quantity':
        return 40;
      case 'discount_on_total':
        return 50;
      default:
        return 999;
    }
  }

  // ---------------- Active check ----------------

  static bool _isPromoActive(AutoPromoModel promo, DateTime now) {
    if (promo.isActive != true) return false;

    // validFrom/validTo: pastikan bukan null di model kamu
    if (now.isBefore(promo.validFrom) || now.isAfter(promo.validTo))
      return false;

    final ah = promo.activeHours;
    if (ah == null || ah.isEnabled != true) return true;

    final schedules = ah.schedule ?? [];
    if (schedules.isEmpty) return false;

    // backend: 0=Sunday..6=Saturday; dart: 1=Mon..7=Sun
    final backendDow = now.weekday % 7; // Sunday(7)->0

    final todays = schedules.where((s) => s.dayOfWeek == backendDow).toList();
    if (todays.isEmpty) return false;

    final hhmm =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    return todays.any(
      (s) => s.startTime.compareTo(hhmm) <= 0 && s.endTime.compareTo(hhmm) >= 0,
    );
  }

  // ---------------- Helpers allocation ----------------

  /// ambil qty dari line item yang productId cocok, consume dari remainingByLine,
  /// return list konsumsi: (lineIndex, takeQty)
  static List<_LineTake> _takeFromLines(
    OrderDetailModel order,
    Map<int, int> remainingByLine,
    String productId,
    int neededQty,
  ) {
    if (neededQty <= 0) return [];

    final pid = productId.toString().trim();
    final takes = <_LineTake>[];
    int left = neededQty;

    debugPrint('TAKE START pid=$pid need=$neededQty');

    for (int i = 0; i < order.items.length; i++) {
      if (left <= 0) break;

      final it = order.items[i];
      if (_isFreeItem(it)) continue;

      final mid = it.menuItem.id.toString().trim();
      if (mid != pid) continue;

      final avail = remainingByLine[i] ?? 0;

      debugPrint(
        'TAKE CHECK i=$i mid=$mid qty=${it.quantity} avail=$avail name=${it.menuItem.name}',
      );

      if (avail <= 0) continue;

      final take = avail < left ? avail : left;
      remainingByLine[i] = avail - take;
      takes.add(_LineTake(lineIndex: i, qty: take));
      left -= take;

      debugPrint('TAKE HIT i=$i take=$take left=$left');
    }

    final taken = takes.fold<int>(0, (s, t) => s + t.qty);
    debugPrint('TAKE END pid=$pid taken=$taken');

    return takes;
  }

  static int _remainingTotalQty(Map<int, int> remainingByLine) {
    return remainingByLine.values.fold<int>(0, (s, q) => s + (q < 0 ? 0 : q));
  }

  static int _remainingSubtotal(
    OrderDetailModel order,
    Map<int, int> remainingByLine,
  ) {
    int total = 0;
    for (final e in remainingByLine.entries) {
      final idx = e.key;
      final qty = e.value;
      if (qty <= 0) continue;
      final it = order.items[idx];
      total += _unitPrice(it) * qty;
    }
    return total;
  }

  // ---------------- Promo: Bundling ----------------

  static PromoApplyResult? _applyBundling(
    OrderDetailModel order,
    AutoPromoModel promo,
    Map<int, int> remainingByLine,
  ) {
    final bundle = promo.conditions?.bundleProducts ?? [];
    if (bundle.isEmpty) return null;

    final bundlePrice = promo.bundlePrice ?? 0;
    if (bundlePrice <= 0) return null;

    debugPrint('applyBundling promo:${promo.name} bundlePrice:$bundlePrice');
    debugPrint(
      'bundle lines: ${bundle.map((b) => "${b.product.id} qty:${b.quantity ?? 1}").toList()}',
    );

    // ✅ FIX: bundleCount dihitung pakai MIN, bukan sentinel 1<<30 yang bisa kebablasan
    int bundleCount = -1;

    for (final b in bundle) {
      final id = b.product.id.toString().trim();
      final req = (b.quantity ?? 1);
      if (req <= 0) return null;

      int avail = 0;
      for (int i = 0; i < order.items.length; i++) {
        final it = order.items[i];
        if (_isFreeItem(it)) continue;

        final mid = it.menuItem.id.toString().trim();
        if (mid != id) continue;

        avail += (remainingByLine[i] ?? 0);
      }

      debugPrint('need id:$id req:$req avail:$avail');

      if (avail < req) return null;

      final possible = avail ~/ req;
      bundleCount =
          (bundleCount == -1) ? possible : math.min(bundleCount, possible);
    }

    if (bundleCount <= 0) return null;

    debugPrint('BUNDLE bundleCount=$bundleCount');

    // snapshot remaining sebelum consume (buat rollback)
    final snapshot = Map<int, int>.from(remainingByLine);

    // consume sesuai kebutuhan bundleCount
    final takesByProduct = <String, List<_LineTake>>{};
    for (final b in bundle) {
      final id = b.product.id.toString().trim();
      final need = (b.quantity ?? 1) * bundleCount;

      debugPrint('BUNDLE CONSUME id=$id need=$need bundleCount=$bundleCount');

      final takes = _takeFromLines(order, remainingByLine, id, need);
      final takenQty = takes.fold<int>(0, (s, t) => s + t.qty);

      if (takenQty < need) {
        // rollback remaining dan batal
        remainingByLine
          ..clear()
          ..addAll(snapshot);
        debugPrint('BUNDLE FAIL id=$id need=$need taken=$takenQty -> rollback');
        return null;
      }

      takesByProduct[id] = takes;
    }

    // hitung subtotal original untuk qty yang ter-consume (per line, addon aman)
    int originalBundleSubtotal = 0;
    for (final entry in takesByProduct.entries) {
      for (final t in entry.value) {
        final it = order.items[t.lineIndex];
        originalBundleSubtotal += _unitPrice(it) * t.qty;
      }
    }

    final targetTotal = bundlePrice * bundleCount;
    final discount = originalBundleSubtotal - targetTotal;

    debugPrint(
      'BUNDLE originalSubtotal=$originalBundleSubtotal targetTotal=$targetTotal discount=$discount',
    );

    if (discount <= 0) {
      // rollback kalau diskon <=0 (deal tidak menguntungkan)
      remainingByLine
        ..clear()
        ..addAll(snapshot);
      return null;
    }

    // affectedItems: agregasi per product id (bukan per line)
    final affected = <AffectedItemModel>[];
    int allocated = 0;

    for (int i = 0; i < bundle.length; i++) {
      final b = bundle[i];
      final id = b.product.id.toString().trim();

      int qty = 0;
      int sub = 0;

      final takes = takesByProduct[id] ?? const <_LineTake>[];
      for (final t in takes) {
        qty += t.qty;
        final it = order.items[t.lineIndex];
        sub += _unitPrice(it) * t.qty;
      }

      int itemDiscount;
      if (i == bundle.length - 1) {
        itemDiscount = discount - allocated;
      } else {
        itemDiscount =
            originalBundleSubtotal == 0
                ? 0
                : ((sub * discount) / originalBundleSubtotal).floor();
        allocated += itemDiscount;
      }

      affected.add(
        AffectedItemModel(
          menuItem: id,
          menuItemName: b.product.name,
          quantity: qty,
          originalSubtotal: sub,
          discountAmount: itemDiscount,
          discountedSubtotal: sub - itemDiscount,
        ),
      );
    }

    final appliedPromo = AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: discount,
      affectedItems: affected,
      freeItems: [],
    );

    return PromoApplyResult(
      order: order,
      appliedPromo: appliedPromo,
      totalDiscount: discount,
    );
  }

  // ---------------- Promo: Buy X Get Y ----------------
  // versi sekarang: 1:1 (buyQty == freeQty) dari remaining "buy" item.
  static PromoApplyResult? _applyBuyXGetY(
    OrderDetailModel order,
    AutoPromoModel promo,
    Map<int, int> remainingByLine,
    MenuItemModel? Function(String id) findMenuItemById,
  ) {
    final buy = promo.conditions?.buyProduct;
    final get = promo.conditions?.getProduct;
    if (buy == null || get == null) return null;

    final buyId = buy.id.toString().trim();

    // total remaining buy qty
    int buyRemainingQty = 0;
    for (int i = 0; i < order.items.length; i++) {
      final it = order.items[i];
      if (_isFreeItem(it)) continue;

      final mid = it.menuItem.id.toString().trim();
      if (mid != buyId) continue;

      buyRemainingQty += (remainingByLine[i] ?? 0);
    }
    if (buyRemainingQty <= 0) return null;

    final freeQty = buyRemainingQty; // 1:1
    if (freeQty <= 0) return null;

    // consume buy qty dari line
    _takeFromLines(order, remainingByLine, buyId, freeQty);

    final menuGet = findMenuItemById(get.id);
    if (menuGet == null) return null;

    final freeItem = OrderItemModel(
      menuItem: menuGet.copyWith(originalPrice: 0),
      quantity: freeQty,
      subtotal: 0,
      notes: '$freeItemMarker:${promo.id}',
    );

    final updatedOrder = order.copyWith(items: [...order.items, freeItem]);

    final appliedPromo = AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: 0,
      affectedItems: const [],
      freeItems: [
        FreeItemModel(
          menuItem: get.id,
          menuItemName: get.name,
          quantity: freeQty,
          id: get.id,
        ),
      ],
    );

    return PromoApplyResult(
      order: updatedOrder,
      appliedPromo: appliedPromo,
      totalDiscount: 0,
    );
  }

  // ---------------- Promo: Product specific ----------------
  static PromoApplyResult? _applyProductSpecific(
    OrderDetailModel order,
    AutoPromoModel promo,
    Map<int, int> remainingByLine,
  ) {
    final products = promo.conditions?.products ?? [];
    if (products.isEmpty) return null;

    final d = promo.discount ?? 0;
    if (d <= 0) return null;

    final ids = products.map((p) => p.id.toString().trim()).toSet();

    int totalDiscount = 0;
    final affected = <AffectedItemModel>[];

    // consume per line agar addon/topping aman
    for (int i = 0; i < order.items.length; i++) {
      final it = order.items[i];
      if (_isFreeItem(it)) continue;

      final id = it.menuItem.id.toString().trim();
      if (!ids.contains(id)) continue;

      final avail = remainingByLine[i] ?? 0;
      if (avail <= 0) continue;

      final unit = _unitPrice(it);
      final sub = unit * avail;
      if (sub <= 0) continue;

      final lineDiscount =
          (d <= 100) ? ((sub * d) / 100).floor() : d.clamp(0, sub);
      if (lineDiscount <= 0) continue;

      totalDiscount += lineDiscount;
      remainingByLine[i] = 0;

      affected.add(
        AffectedItemModel(
          menuItem: id,
          menuItemName: it.menuItem.name ?? '',
          quantity: avail,
          originalSubtotal: sub,
          discountAmount: lineDiscount,
          discountedSubtotal: sub - lineDiscount,
          discountPercentage: (d <= 100) ? d : null,
        ),
      );
    }

    if (totalDiscount <= 0) return null;

    final appliedPromo = AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: totalDiscount,
      affectedItems: affected,
      freeItems: const [],
    );

    return PromoApplyResult(
      order: order,
      appliedPromo: appliedPromo,
      totalDiscount: totalDiscount,
    );
  }

  // ---------------- Promo: Discount on quantity ----------------
  static PromoApplyResult? _applyDiscountOnQuantity(
    OrderDetailModel order,
    AutoPromoModel promo,
    Map<int, int> remainingByLine,
  ) {
    final minQty = promo.conditions?.minQuantity ?? 0;
    final totalQty = _remainingTotalQty(remainingByLine);
    if (totalQty < minQty) return null;

    final d = promo.discount ?? 0;
    if (d <= 0) return null;

    final subtotal = _remainingSubtotal(order, remainingByLine);
    if (subtotal <= 0) return null;

    // persen/nominal
    final discount =
        (d <= 100) ? ((subtotal * d) / 100).floor() : d.clamp(0, subtotal);
    if (discount <= 0) return null;

    // consume semua remaining
    remainingByLine.updateAll((_, __) => 0);

    final appliedPromo = AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: discount,
      affectedItems: const [],
      freeItems: const [],
    );

    return PromoApplyResult(
      order: order,
      appliedPromo: appliedPromo,
      totalDiscount: discount,
    );
  }

  // ---------------- Promo: Discount on total ----------------
  static PromoApplyResult? _applyDiscountOnTotal(
    OrderDetailModel order,
    AutoPromoModel promo,
    Map<int, int> remainingByLine, {
    required bool allowStackingOnTotal,
  }) {
    final minTotal = promo.conditions?.minTotal ?? 0;

    final baseTotal =
        allowStackingOnTotal
            ? order.totalBeforeDiscount
            : _remainingSubtotal(order, remainingByLine);

    if (baseTotal < minTotal) return null;

    final d = promo.discount ?? 0;
    if (d <= 0) return null;

    final discount =
        (d <= 100) ? ((baseTotal * d) / 100).floor() : d.clamp(0, baseTotal);
    if (discount <= 0) return null;

    if (!allowStackingOnTotal) {
      remainingByLine.updateAll((_, __) => 0);
    }

    final appliedPromo = AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: discount,
      affectedItems: const [],
      freeItems: const [],
    );

    return PromoApplyResult(
      order: order,
      appliedPromo: appliedPromo,
      totalDiscount: discount,
    );
  }
}

class PromoApplyResult {
  final OrderDetailModel order;
  final AppliedPromosModel appliedPromo;
  final int totalDiscount;

  PromoApplyResult({
    required this.order,
    required this.appliedPromo,
    required this.totalDiscount,
  });
}

class _LineTake {
  final int lineIndex;
  final int qty;
  _LineTake({required this.lineIndex, required this.qty});
}
