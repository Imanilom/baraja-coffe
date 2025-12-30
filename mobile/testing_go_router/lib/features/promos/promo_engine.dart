import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/applied_promos.model.dart';
import 'package:kasirbaraja/models/affected_item.model.dart';
import 'package:kasirbaraja/models/free_item.model.dart';
import 'package:kasirbaraja/models/auto_promo.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';

class PromoEngine {
  static const freeItemMarker = '__FREE_ITEM__'; // notes marker

  static OrderDetailModel apply(
    OrderDetailModel order,
    List<AutoPromoModel> promos,
    DateTime now,
    MenuItemModel? Function(String id) findMenuItemById,
  ) {
    // 0) hapus free items lama biar tidak numpuk
    final cleanedItems =
        order.items
            .where((it) => !(it.notes ?? '').contains(freeItemMarker))
            .toList();

    var current = order.copyWith(items: cleanedItems, appliedPromos: []);

    // 1) filter promo aktif
    final activePromos = promos.where((p) => _isPromoActive(p, now)).toList();

    final applied = <AppliedPromosModel>[];
    int totalAutoDiscount = 0;

    // 2) apply satu-satu (urutan matters, kita mulai dari bundling dulu)
    for (final promo in activePromos) {
      PromoApplyResult? res;

      switch (promo.promoType) {
        case 'bundling':
          res = _applyBundling(current, promo);
          break;
        case 'buy_x_get_y':
          res = _applyBuyXGetY(current, promo, findMenuItemById);
          break;
        case 'discount_on_total':
          res = _applyDiscountOnTotal(current, promo);
          break;
        case 'discount_on_quantity':
          res = _applyDiscountOnQuantity(current, promo);
          break;
        case 'product_specific':
          res = _applyProductSpecific(current, promo);
          break;
      }

      if (res == null) continue;

      current = res.order;
      applied.add(res.appliedPromo);
      totalAutoDiscount += res.totalDiscount;
    }

    // NOTE: diskon promo kita simpan di appliedPromos,
    // perhitungan totalAfterDiscount dilakukan di notifier (biar nyatu sama manual discount & customAmount)

    return current.copyWith(appliedPromos: applied);
  }

  static int sumAutoDiscount(List<AppliedPromosModel>? appliedPromos) {
    return (appliedPromos ?? []).fold(0, (sum, p) => sum + (p.discount ?? 0));
  }

  static bool _isPromoActive(AutoPromoModel promo, DateTime now) {
    if (promo.isActive != true) return false;
    if (now.isBefore(promo.validFrom) || now.isAfter(promo.validTo))
      return false;

    final ah = promo.activeHours;
    if (ah == null || ah.isEnabled != true) return true;

    final schedules = ah.schedule ?? [];
    if (schedules.isEmpty) return false;

    // backend: 0=Sunday..6=Saturday
    // dart: 1=Mon..7=Sun
    final backendDow = now.weekday % 7; // Sunday(7)->0

    final todays = schedules.where((s) => s.dayOfWeek == backendDow).toList();
    if (todays.isEmpty) return false;

    final hhmm =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    return todays.any(
      (s) => s.startTime.compareTo(hhmm) <= 0 && s.endTime.compareTo(hhmm) >= 0,
    );
  }

  // -------------------- PROMO TYPES --------------------

  static PromoApplyResult? _applyBundling(
    OrderDetailModel order,
    AutoPromoModel promo,
  ) {
    final bundle = promo.conditions?.bundleProducts ?? [];
    if (bundle.isEmpty) return null;
    final bundlePrice = promo.bundlePrice;
    if (bundlePrice == null || bundlePrice <= 0) return null;

    // qty per product di cart
    final qtyById = <String, int>{};
    final unitPriceById = <String, int>{};

    for (final it in order.items) {
      final id = it.menuItem.id;
      qtyById[id] = (qtyById[id] ?? 0) + it.quantity;
      final unit = it.quantity == 0 ? 0 : (it.subtotal ~/ it.quantity);
      unitPriceById[id] = unit;
    }

    // bundleCount = min(available/required)
    int bundleCount = 1 << 30;
    for (final b in bundle) {
      final id = b.product.id;
      final req = b.quantity ?? 1;
      final available = qtyById[id] ?? 0;
      if (available < req) return null;
      final possible = available ~/ req;
      if (possible < bundleCount) bundleCount = possible;
    }
    if (bundleCount <= 0) return null;

    // subtotal normal untuk item yang terlibat bundle
    int originalBundleSubtotal = 0;
    for (final b in bundle) {
      final id = b.product.id;
      final req = (b.quantity ?? 1) * bundleCount;
      final unit = unitPriceById[id] ?? 0;
      originalBundleSubtotal += unit * req;
    }

    final targetBundleTotal = bundlePrice * bundleCount;
    final discount = originalBundleSubtotal - targetBundleTotal;
    if (discount <= 0) return null;

    // Catat affectedItems (diskon dibagi proporsional)
    final affected = <AffectedItemModel>[];
    int allocated = 0;

    for (int i = 0; i < bundle.length; i++) {
      final b = bundle[i];
      final id = b.product.id;
      final qty = (b.quantity ?? 1) * bundleCount;
      final unit = unitPriceById[id] ?? 0;
      final sub = unit * qty;

      int itemDiscount;
      if (i == bundle.length - 1) {
        itemDiscount = discount - allocated;
      } else {
        itemDiscount = ((sub * discount) / originalBundleSubtotal).floor();
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

  static PromoApplyResult? _applyBuyXGetY(
    OrderDetailModel order,
    AutoPromoModel promo,
    MenuItemModel? Function(String id) findMenuItemById,
  ) {
    final buy = promo.conditions?.buyProduct;
    final get = promo.conditions?.getProduct;
    if (buy == null || get == null) return null;

    int buyQty = 0;
    for (final it in order.items) {
      if (it.menuItem.id == buy.id) buyQty += it.quantity;
    }
    if (buyQty <= 0) return null;

    // sementara: 1:1
    final freeQty = buyQty;
    if (freeQty <= 0) return null;

    final menuGet = findMenuItemById(get.id);
    if (menuGet == null) return null;

    final freeItem = OrderItemModel(
      menuItem: menuGet.copyWith(originalPrice: 0),
      quantity: freeQty,
      subtotal: 0,
      notes: '$freeItemMarker:${promo.id}',
    );

    final updated = order.copyWith(items: [...order.items, freeItem]);

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
      order: updated,
      appliedPromo: appliedPromo,
      totalDiscount: 0,
    );
  }

  static PromoApplyResult? _applyDiscountOnTotal(
    OrderDetailModel order,
    AutoPromoModel promo,
  ) {
    final minTotal = promo.conditions?.minTotal ?? 0;
    if (order.totalBeforeDiscount < minTotal) return null;

    final discount = promo.discount ?? 0;
    if (discount <= 0) return null;

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

  static PromoApplyResult? _applyDiscountOnQuantity(
    OrderDetailModel order,
    AutoPromoModel promo,
  ) {
    final minQty = promo.conditions?.minQuantity ?? 0;
    final totalQty = order.items.fold<int>(0, (sum, it) => sum + it.quantity);
    if (totalQty < minQty) return null;

    final pct = promo.discount ?? 0;
    if (pct <= 0) return null;

    final subtotal = order.totalBeforeDiscount;
    final discount = ((subtotal * pct) / 100).floor();
    if (discount <= 0) return null;

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

  static PromoApplyResult? _applyProductSpecific(
    OrderDetailModel order,
    AutoPromoModel promo,
  ) {
    final products = promo.conditions?.products ?? [];
    if (products.isEmpty) return null;

    // sementara: heuristik -> kalau discount <= 100 = persen, else nominal per item subtotal (jelek, tapi workable)
    final d = promo.discount ?? 0;
    if (d <= 0) return null;

    final ids = products.map((p) => p.id).toSet();

    int totalDiscount = 0;
    final affected = <AffectedItemModel>[];

    for (final it in order.items) {
      final id = it.menuItem.id;
      if (!ids.contains(id)) continue;

      final sub = it.subtotal;
      if (sub <= 0) continue;

      final itemDiscount =
          (d <= 100) ? ((sub * d) / 100).floor() : d.clamp(0, sub);
      if (itemDiscount <= 0) continue;

      totalDiscount += itemDiscount;

      affected.add(
        AffectedItemModel(
          menuItem: id,
          menuItemName: it.menuItem.name ?? '',
          quantity: it.quantity,
          originalSubtotal: sub,
          discountAmount: itemDiscount,
          discountedSubtotal: sub - itemDiscount,
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
