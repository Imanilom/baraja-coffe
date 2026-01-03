import 'package:flutter/foundation.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/applied_promos.model.dart';
import 'package:kasirbaraja/models/affected_item.model.dart';
import 'package:kasirbaraja/models/free_item.model.dart';
import 'package:kasirbaraja/models/auto_promo.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';

class PromoEngine {
  static int _unitPrice(OrderItemModel it) {
    if (it.quantity <= 0) return 0;
    return it.subtotal ~/ it.quantity;
  }

  static bool _isReservedFor(OrderItemModel it, String promoId) =>
      it.reservedPromoId == promoId;

  /// Helper buat kamu di _recalculateAll()
  static int sumAutoDiscount(List<AppliedPromosModel>? appliedPromos) {
    return (appliedPromos ?? []).fold<int>(
      0,
      (sum, p) => sum + (p.discount ?? 0),
    );
  }

  /// allowStackingOnTotal:
  /// - true  => discount_on_total pakai invoice total
  /// - false => discount_on_total pakai remaining subtotal
  static OrderDetailModel apply(
    OrderDetailModel order,
    List<AutoPromoModel> promos,
    DateTime now,
    MenuItemModel? Function(String id) findMenuItemById, {
    bool allowStackingOnTotal = false,
  }) {
    // ✅ Tidak ada lagi “free item” di items, jadi tidak perlu cleanup marker notes.
    // Tapi kita reset appliedPromos untuk hasil baru:
    var current = order.copyWith(appliedPromos: []);

    final active =
        promos.where((p) => _isPromoActive(p, now)).toList()..sort(
          (a, b) => _priority(a.promoType).compareTo(_priority(b.promoType)),
        );

    // remaining qty per line index
    final remainingByLine = <int, int>{};
    for (int i = 0; i < current.items.length; i++) {
      final it = current.items[i];
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
    if (now.isBefore(promo.validFrom) || now.isAfter(promo.validTo))
      return false;

    final ah = promo.activeHours;
    if (ah == null || ah.isEnabled != true) return true;

    final schedules = ah.schedule ?? [];
    if (schedules.isEmpty) return false;

    // backend: 0=Sunday..6=Saturday; dart: 1=Mon..7=Sun
    final backendDow = now.weekday % 7;

    final todays = schedules.where((s) => s.dayOfWeek == backendDow).toList();
    if (todays.isEmpty) return false;

    final hhmm =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    return todays.any(
      (s) => s.startTime.compareTo(hhmm) <= 0 && s.endTime.compareTo(hhmm) >= 0,
    );
  }

  // ---------------- Helpers allocation ----------------

  /// ambil qty dari line item yang productId cocok, consume dari remainingByLine.
  /// ✅ kalau onlyPromoId != null → hanya ambil item yang reservedPromoId == onlyPromoId
  static List<_LineTake> _takeFromLines(
    OrderDetailModel order,
    Map<int, int> remainingByLine,
    String productId,
    int neededQty, {
    String? onlyPromoId,
  }) {
    if (neededQty <= 0) return [];

    final takes = <_LineTake>[];
    int left = neededQty;

    for (int i = 0; i < order.items.length; i++) {
      if (left <= 0) break;

      final it = order.items[i];
      if (it.menuItem.id != productId) continue;

      if (onlyPromoId != null && !_isReservedFor(it, onlyPromoId)) continue;

      final avail = remainingByLine[i] ?? 0;
      if (avail <= 0) continue;

      final take = avail < left ? avail : left;
      remainingByLine[i] = avail - take;
      takes.add(_LineTake(lineIndex: i, qty: take));
      left -= take;
    }

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

    // ✅ hitung berapa bundle yang bisa dibentuk hanya dari item yang reserved utk promo ini
    int bundleCount = 1 << 30;

    for (final b in bundle) {
      final id = b.product.id;
      final req = b.quantity ?? 1;
      if (req <= 0) return null;

      int avail = 0;
      for (int i = 0; i < order.items.length; i++) {
        final it = order.items[i];
        if (it.menuItem.id != id) continue;
        if (!_isReservedFor(it, promo.id)) continue; // ✅ kunci
        avail += (remainingByLine[i] ?? 0);
      }

      debugPrint('need id:$id req:$req avail:$avail');

      if (avail < req) return null;

      final possible = avail ~/ req;
      if (possible < bundleCount) bundleCount = possible;
    }

    if (bundleCount <= 0) return null;

    final snapshot = Map<int, int>.from(remainingByLine);

    // consume sesuai kebutuhan bundleCount
    final takesByProduct = <String, List<_LineTake>>{};
    for (final b in bundle) {
      final id = b.product.id;
      final need = (b.quantity ?? 1) * bundleCount;

      final takes = _takeFromLines(
        order,
        remainingByLine,
        id,
        need,
        onlyPromoId: promo.id, // ✅ hanya ambil item milik promo ini
      );

      final takenQty = takes.fold<int>(0, (s, t) => s + t.qty);
      if (takenQty < need) {
        remainingByLine
          ..clear()
          ..addAll(snapshot);
        return null;
      }

      takesByProduct[id] = takes;
    }

    // subtotal original untuk qty yang ter-consume
    int originalBundleSubtotal = 0;
    for (final entry in takesByProduct.entries) {
      for (final t in entry.value) {
        final it = order.items[t.lineIndex];
        originalBundleSubtotal += _unitPrice(it) * t.qty;
      }
    }

    final targetTotal = bundlePrice * bundleCount;
    final discount = originalBundleSubtotal - targetTotal;

    if (discount <= 0) {
      remainingByLine
        ..clear()
        ..addAll(snapshot);
      return null;
    }

    // affectedItems: agregasi per product id
    final affected = <AffectedItemModel>[];
    int allocated = 0;

    for (int i = 0; i < bundle.length; i++) {
      final b = bundle[i];
      final id = b.product.id;

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
  // ✅ FREE ITEM TIDAK DITAMBAH KE order.items
  static PromoApplyResult? _applyBuyXGetY(
    OrderDetailModel order,
    AutoPromoModel promo,
    Map<int, int> remainingByLine,
    MenuItemModel? Function(String id) findMenuItemById,
  ) {
    final buy = promo.conditions?.buyProduct;
    final get = promo.conditions?.getProduct;
    if (buy == null || get == null) return null;

    int buyRemainingQty = 0;
    for (int i = 0; i < order.items.length; i++) {
      final it = order.items[i];
      if (it.menuItem.id != buy.id) continue;
      // opsional: kalau kamu mau buy_x_get_y juga “dipilih” seperti bundling, bisa pakai reservedPromoId juga.
      buyRemainingQty += (remainingByLine[i] ?? 0);
    }
    if (buyRemainingQty <= 0) return null;

    final freeQty = buyRemainingQty; // 1:1
    if (freeQty <= 0) return null;

    _takeFromLines(order, remainingByLine, buy.id, freeQty);

    final menuGet = findMenuItemById(get.id);
    if (menuGet == null) return null;

    final appliedPromo = AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: 0,
      affectedItems: [],
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
      order: order, // ✅ tidak menambah item
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

    final ids = products.map((p) => p.id).toSet();

    int totalDiscount = 0;
    final affected = <AffectedItemModel>[];

    for (int i = 0; i < order.items.length; i++) {
      final it = order.items[i];

      final id = it.menuItem.id;
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
      freeItems: [],
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

    final discount =
        (d <= 100) ? ((subtotal * d) / 100).floor() : d.clamp(0, subtotal);

    if (discount <= 0) return null;

    remainingByLine.updateAll((_, __) => 0);

    final appliedPromo = AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: discount,
      affectedItems: [],
      freeItems: [],
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
      affectedItems: [],
      freeItems: [],
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
