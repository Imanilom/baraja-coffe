import 'package:kasirbaraja/models/affected_item.model.dart';
import 'package:kasirbaraja/models/applied_promos.model.dart';
import 'package:kasirbaraja/models/auto_promo.model.dart';
import 'package:kasirbaraja/models/free_item.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';

class PromoEngine {
  /// Main entry point: Apply semua promo yang eligible
  static OrderDetailModel apply(
    OrderDetailModel order,
    List<AutoPromoModel> availablePromos,
    DateTime now,
    MenuItemModel? Function(String) findMenuById, {
    bool allowStackingOnTotal = false,
  }) {
    var result = order.copyWith(appliedPromos: []);
    final appliedList = <AppliedPromosModel>[];

    // Filter promo yang aktif dan valid
    final eligiblePromos =
        availablePromos.where((promo) {
          return _isPromoValid(promo, now) &&
              _isPromoEligible(promo, order, now);
        }).toList();

    // Urutkan berdasarkan prioritas
    eligiblePromos.sort(
      (a, b) => _getPromoPriority(a).compareTo(_getPromoPriority(b)),
    );

    for (final promo in eligiblePromos) {
      final applied = _applySinglePromo(
        result,
        promo,
        findMenuById,
        allowStackingOnTotal: allowStackingOnTotal,
      );

      if (applied != null) {
        appliedList.add(applied);
        result = _updateOrderWithPromo(result, applied, promo);
      }
    }

    return result.copyWith(appliedPromos: appliedList);
  }

  /// Validasi apakah promo masih valid (tanggal & jam)
  static bool _isPromoValid(AutoPromoModel promo, DateTime now) {
    if (!promo.isActive) return false;

    // Check tanggal validitas
    final validFrom = DateTime.parse(promo.validFrom);
    final validTo = DateTime.parse(promo.validTo);

    if (now.isBefore(validFrom) || now.isAfter(validTo)) {
      return false;
    }

    // Check active hours jika enabled
    if (promo.activeHours.isEnabled) {
      return _isWithinActiveHours(promo.activeHours, now);
    }

    return true;
  }

  /// Check apakah waktu sekarang dalam jam aktif promo
  static bool _isWithinActiveHours(ActiveHoursModel activeHours, DateTime now) {
    final currentDay = now.weekday % 7; // Convert to 0=Sunday
    final currentTime =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    for (final schedule in activeHours.schedule) {
      if (schedule.dayOfWeek == currentDay) {
        if (_isTimeBetween(currentTime, schedule.startTime, schedule.endTime)) {
          return true;
        }
      }
    }

    return false;
  }

  static bool _isTimeBetween(String current, String start, String end) {
    return current.compareTo(start) >= 0 && current.compareTo(end) <= 0;
  }

  /// Check apakah order memenuhi syarat promo
  static bool _isPromoEligible(
    AutoPromoModel promo,
    OrderDetailModel order,
    DateTime now,
  ) {
    switch (promo.promoType) {
      case 'product_specific':
        return _hasEligibleProducts(promo, order);

      case 'bundling':
        return _hasBundleProducts(promo, order);

      case 'discount_on_quantity':
        return _meetsMinQuantity(promo, order);

      case 'discount_on_total':
        return _meetsMinTotal(promo, order);

      case 'buy_x_get_y':
        return _hasBuyProduct(promo, order);

      default:
        return false;
    }
  }

  static bool _hasEligibleProducts(
    AutoPromoModel promo,
    OrderDetailModel order,
  ) {
    final productIds = promo.conditions.products.map((p) => p.id).toSet();
    return order.items.any((item) => productIds.contains(item.menuItem.id));
  }

  static bool _hasBundleProducts(AutoPromoModel promo, OrderDetailModel order) {
    // Check apakah semua produk bundle ada di order
    for (final bundleItem in promo.conditions.bundleProducts) {
      final found = order.items.where((item) {
        return item.menuItem.id == bundleItem.product.id;
      });

      final totalQty = found.fold(0, (sum, item) => sum + item.quantity);
      if (totalQty < bundleItem.quantity) return false;
    }

    return promo.conditions.bundleProducts.isNotEmpty;
  }

  static bool _meetsMinQuantity(AutoPromoModel promo, OrderDetailModel order) {
    final minQty = promo.conditions.minQuantity ?? 0;
    final totalQty = order.items.fold(0, (sum, item) => sum + item.quantity);
    return totalQty >= minQty;
  }

  static bool _meetsMinTotal(AutoPromoModel promo, OrderDetailModel order) {
    final minTotal = promo.conditions.minTotal ?? 0;
    return order.totalBeforeDiscount >= minTotal;
  }

  static bool _hasBuyProduct(AutoPromoModel promo, OrderDetailModel order) {
    final buyProductId = promo.conditions.buyProduct?.id;
    if (buyProductId == null) return false;

    return order.items.any((item) => item.menuItem.id == buyProductId);
  }

  /// Prioritas promo (lebih kecil = lebih prioritas)
  static int _getPromoPriority(AutoPromoModel promo) {
    switch (promo.promoType) {
      case 'bundling':
        return 1; // Paling prioritas
      case 'buy_x_get_y':
        return 2;
      case 'product_specific':
        return 3;
      case 'discount_on_quantity':
        return 4;
      case 'discount_on_total':
        return 5; // Paling akhir
      default:
        return 99;
    }
  }

  /// Apply promo ke order dan return AppliedPromosModel
  static AppliedPromosModel? _applySinglePromo(
    OrderDetailModel order,
    AutoPromoModel promo,
    MenuItemModel? Function(String) findMenuById, {
    bool allowStackingOnTotal = false,
  }) {
    switch (promo.promoType) {
      case 'product_specific':
        return _applyProductSpecific(order, promo);

      case 'bundling':
        return _applyBundling(order, promo);

      case 'discount_on_quantity':
        return _applyDiscountOnQuantity(order, promo);

      case 'discount_on_total':
        // Cek apakah sudah ada promo total lain
        if (!allowStackingOnTotal) {
          final hasOtherTotal =
              order.appliedPromos?.any(
                (p) => p.promoType == 'discount_on_total',
              ) ??
              false;
          if (hasOtherTotal) return null;
        }
        return _applyDiscountOnTotal(order, promo);

      case 'buy_x_get_y':
        return _applyBuyXGetY(order, promo, findMenuById);

      default:
        return null;
    }
  }

  /// PRODUCT SPECIFIC: Diskon untuk produk tertentu
  static AppliedPromosModel? _applyProductSpecific(
    OrderDetailModel order,
    AutoPromoModel promo,
  ) {
    final affectedItems = <AffectedItemModel>[];
    final productIds = promo.conditions.products.map((p) => p.id).toSet();

    for (final item in order.items) {
      if (productIds.contains(item.menuItem.id)) {
        final originalSubtotal = item.subtotal;
        final discountAmount =
            (originalSubtotal * promo.discount / 100).round();
        final discountedSubtotal = originalSubtotal - discountAmount;

        affectedItems.add(
          AffectedItemModel(
            menuItem: item.menuItem.id,
            menuItemName: item.menuItem.name ?? 'Produk tidak ada',
            quantity: item.quantity,
            originalSubtotal: originalSubtotal,
            discountAmount: discountAmount,
            discountedSubtotal: discountedSubtotal,
            discountPercentage: promo.discount,
          ),
        );
      }
    }

    if (affectedItems.isEmpty) return null;

    final totalDiscount = affectedItems.fold(
      0,
      (sum, item) => sum + item.discountAmount,
    );

    return AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: totalDiscount,
      affectedItems: affectedItems,
      freeItems: [],
    );
  }

  /// BUNDLING: Paket produk dengan harga khusus
  static AppliedPromosModel? _applyBundling(
    OrderDetailModel order,
    AutoPromoModel promo,
  ) {
    final bundlePrice = promo.bundlePrice ?? 0;
    final affectedItems = <AffectedItemModel>[];
    var totalOriginal = 0;

    // Hitung berapa set bundle yang bisa dibuat
    var minSets = 999999;
    for (final bundleItem in promo.conditions.bundleProducts) {
      final matchingItems = order.items.where(
        (item) => item.menuItem.id == bundleItem.product.id,
      );
      final totalQty = matchingItems.fold(
        0,
        (sum, item) => sum + item.quantity,
      );
      final sets = totalQty ~/ bundleItem.quantity;
      if (sets < minSets) minSets = sets;
    }

    if (minSets == 0) return null;

    // Apply discount untuk items dalam bundle
    for (final bundleItem in promo.conditions.bundleProducts) {
      final item = order.items.firstWhere(
        (item) => item.menuItem.id == bundleItem.product.id,
      );

      final qtyInBundle = bundleItem.quantity * minSets;
      final pricePerItem = item.subtotal ~/ item.quantity;
      final originalSubtotal = pricePerItem * qtyInBundle;
      totalOriginal += originalSubtotal;

      affectedItems.add(
        AffectedItemModel(
          menuItem: item.menuItem.id,
          menuItemName: item.menuItem.name ?? 'Produk tidak ada',
          quantity: qtyInBundle,
          originalSubtotal: originalSubtotal,
          discountAmount: 0, // Akan dihitung total
          discountedSubtotal: 0,
        ),
      );
    }

    final totalBundlePrice = bundlePrice * minSets;
    final totalDiscount = totalOriginal - totalBundlePrice;

    // Update discount amount
    for (var i = 0; i < affectedItems.length; i++) {
      final ratio = affectedItems[i].originalSubtotal / totalOriginal;
      final itemDiscount = (totalDiscount * ratio).round();

      affectedItems[i] = affectedItems[i].copyWith(
        discountAmount: itemDiscount,
        discountedSubtotal: affectedItems[i].originalSubtotal - itemDiscount,
      );
    }

    return AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: totalDiscount,
      affectedItems: affectedItems,
      freeItems: [],
    );
  }

  /// DISCOUNT ON QUANTITY: Diskon berdasarkan qty minimal
  static AppliedPromosModel? _applyDiscountOnQuantity(
    OrderDetailModel order,
    AutoPromoModel promo,
  ) {
    final totalQty = order.items.fold(0, (sum, item) => sum + item.quantity);
    final minQty = promo.conditions.minQuantity ?? 0;

    if (totalQty < minQty) return null;

    final affectedItems = <AffectedItemModel>[];

    for (final item in order.items) {
      final originalSubtotal = item.subtotal;
      final discountAmount = (originalSubtotal * promo.discount / 100).round();
      final discountedSubtotal = originalSubtotal - discountAmount;

      affectedItems.add(
        AffectedItemModel(
          menuItem: item.menuItem.id,
          menuItemName: item.menuItem.name ?? 'Produk tidak ada',
          quantity: item.quantity,
          originalSubtotal: originalSubtotal,
          discountAmount: discountAmount,
          discountedSubtotal: discountedSubtotal,
          discountPercentage: promo.discount,
        ),
      );
    }

    final totalDiscount = affectedItems.fold(
      0,
      (sum, item) => sum + item.discountAmount,
    );

    return AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: totalDiscount,
      affectedItems: affectedItems,
      freeItems: [],
    );
  }

  /// DISCOUNT ON TOTAL: Diskon berdasarkan total belanja
  static AppliedPromosModel? _applyDiscountOnTotal(
    OrderDetailModel order,
    AutoPromoModel promo,
  ) {
    final minTotal = promo.conditions.minTotal ?? 0;
    if (order.totalBeforeDiscount < minTotal) return null;

    // Diskon flat nominal
    final discountAmount = promo.discount;

    return AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: discountAmount,
      affectedItems: [], // Tidak spesifik ke item
      freeItems: [],
    );
  }

  /// BUY X GET Y: Beli produk X gratis produk Y
  /// ✅ FREE ITEMS DISIMPAN DI appliedPromos.freeItems
  /// ❌ TIDAK ditambahkan ke order.items
  static AppliedPromosModel? _applyBuyXGetY(
    OrderDetailModel order,
    AutoPromoModel promo,
    MenuItemModel? Function(String) findMenuById,
  ) {
    final buyProductId = promo.conditions.buyProduct?.id;
    final getProductId = promo.conditions.getProduct?.id;

    if (buyProductId == null || getProductId == null) return null;

    // Cari produk yang dibeli
    final buyItems = order.items.where(
      (item) => item.menuItem.id == buyProductId,
    );
    if (buyItems.isEmpty) return null;

    final totalBuyQty = buyItems.fold(0, (sum, item) => sum + item.quantity);

    // Free item sesuai qty yang dibeli
    final getProduct = findMenuById(getProductId);
    if (getProduct == null) return null;

    final freeItems = [
      FreeItemModel(
        menuItem: getProductId,
        menuItemName: getProduct.name ?? 'Produk tidak ada',
        quantity: totalBuyQty,
        id: promo.id,
      ),
    ];

    // Affected items (produk yang dibeli)
    final affectedItems =
        buyItems.map((item) {
          return AffectedItemModel(
            menuItem: item.menuItem.id,
            menuItemName: item.menuItem.name ?? 'Produk tidak ada',
            quantity: item.quantity,
            originalSubtotal: item.subtotal,
            discountAmount: 0,
            discountedSubtotal: item.subtotal,
          );
        }).toList();

    return AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: 0, // Tidak ada discount, hanya free item
      affectedItems: affectedItems,
      freeItems: freeItems,
    );
  }

  /// Update order dengan promo yang sudah diapply
  /// ✅ TIDAK lagi menambahkan free items ke order.items
  /// Free items hanya ada di appliedPromos.freeItems
  static OrderDetailModel _updateOrderWithPromo(
    OrderDetailModel order,
    AppliedPromosModel appliedPromo,
    AutoPromoModel promo,
  ) {
    // Free items TIDAK ditambahkan ke order.items
    // Hanya disimpan di appliedPromos.freeItems
    return order;
  }

  /// Helper: Sum semua discount dari appliedPromos
  static int sumAutoDiscount(List<AppliedPromosModel>? promos) {
    if (promos == null || promos.isEmpty) return 0;
    return promos.fold(0, (sum, p) => sum + (p.discount ?? 0));
  }

  /// Helper: Get daftar produk yang kena promo
  static Set<String> getAffectedProductIds(List<AppliedPromosModel>? promos) {
    if (promos == null || promos.isEmpty) return {};
    return promos
        .expand((p) => p.affectedItems)
        .map((item) => item.menuItem)
        .toSet();
  }

  /// Helper: Check apakah item tertentu kena promo
  static bool isItemAffectedByPromo(
    String menuItemId,
    List<AppliedPromosModel>? promos,
  ) {
    if (promos == null || promos.isEmpty) return false;
    return promos.any(
      (p) => p.affectedItems.any((item) => item.menuItem == menuItemId),
    );
  }

  /// Helper: Get total discount untuk item tertentu
  static int getItemDiscount(
    String menuItemId,
    List<AppliedPromosModel>? promos,
  ) {
    if (promos == null || promos.isEmpty) return 0;

    return promos.fold(0, (sum, promo) {
      final affected = promo.affectedItems.firstWhere(
        (item) => item.menuItem == menuItemId,
        orElse:
            () => AffectedItemModel(
              menuItem: '',
              menuItemName: '',
              quantity: 0,
              originalSubtotal: 0,
              discountAmount: 0,
              discountedSubtotal: 0,
            ),
      );
      return sum + affected.discountAmount;
    });
  }
}
