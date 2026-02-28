import 'package:flutter/widgets.dart';
import 'package:kasirbaraja/models/affected_item.model.dart';
import 'package:kasirbaraja/models/applied_promos.model.dart';
import 'package:kasirbaraja/models/auto_promo.model.dart';
import 'package:kasirbaraja/models/free_item.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';

class PromoEngine {
  /// Main entry point: Apply semua promo yang eligible
  static OrderDetailModel apply(
    OrderDetailModel order,
    List<AutoPromoModel> availablePromos,
    DateTime now,
    MenuItemModel? Function(String) findMenuById, {
    bool allowStackingOnTotal = false,
  }) {
    debugPrint('=== PROMO ENGINE START ===');
    debugPrint('Order ID: ${order.id}, Total Items: ${order.items.length}');
    debugPrint('Available Promos: ${availablePromos.length}');
    debugPrint('Current Time: $now');
    debugPrint('Allow Stacking on Total: $allowStackingOnTotal');

    var result = order.copyWith(appliedPromos: []);
    final appliedList = <AppliedPromosModel>[];

    debugPrint('Applying promos...');

    // Filter promo yang aktif dan valid
    final eligiblePromos =
        availablePromos.where((promo) {
          final isValid = _isPromoValid(promo, now);
          final isEligible = _isPromoEligible(promo, order, now);
          debugPrint(
            'Promo ${promo.name} (${promo.id}): isValid=$isValid, isEligible=$isEligible',
          );
          return isValid && isEligible;
        }).toList();

    debugPrint('Eligible Promos: ${eligiblePromos.length}');

    // Urutkan berdasarkan prioritas
    eligiblePromos.sort(
      (a, b) => _getPromoPriority(a).compareTo(_getPromoPriority(b)),
    );

    debugPrint('Sorted Promos by Priority:');
    for (final promo in eligiblePromos) {
      debugPrint('  - ${promo.name}: priority=${_getPromoPriority(promo)}');
    }

    for (final promo in eligiblePromos) {
      debugPrint('\n--- Processing Promo: ${promo.name} (${promo.id}) ---');
      debugPrint('Promo Type: ${promo.promoType}');

      final applied = _applySinglePromo(
        result,
        promo,
        findMenuById,
        allowStackingOnTotal: allowStackingOnTotal,
      );

      if (applied != null) {
        debugPrint('✅ Promo applied successfully');
        debugPrint('   Discount Amount: ${applied.discount}');
        debugPrint('   Affected Items: ${applied.affectedItems.length}');
        debugPrint('   Free Items: ${applied.freeItems.length}');
        appliedList.add(applied);
        result = _updateOrderWithPromo(result, applied, promo);
      } else {
        debugPrint('❌ Promo not applied');
      }
    }

    debugPrint('\n=== PROMO ENGINE FINISH ===');
    debugPrint('Total Applied Promos: ${appliedList.length}');
    debugPrint('Total Discount: ${sumAutoDiscount(appliedList)}');

    return result.copyWith(appliedPromos: appliedList);
  }

  /// Validasi apakah promo masih valid (tanggal & jam)
  static bool _isPromoValid(AutoPromoModel promo, DateTime now) {
    debugPrint('  _isPromoValid: Checking promo ${promo.name}');

    if (!promo.isActive) {
      debugPrint('    ❌ Promo is not active');
      return false;
    }

    // Check tanggal validitas
    final validFrom = promo.validFrom;
    final validTo = promo.validTo;

    if (now.isBefore(validFrom)) {
      debugPrint('    ❌ Promo not started yet (Valid From: $validFrom)');
      return false;
    }

    if (now.isAfter(validTo)) {
      debugPrint('    ❌ Promo expired (Valid To: $validTo)');
      return false;
    }

    // Check active hours jika enabled
    if (promo.activeHours.isEnabled) {
      final isWithinHours = _isWithinActiveHours(promo.activeHours, now);
      debugPrint('    Active Hours Enabled: $isWithinHours');
      return isWithinHours;
    }

    debugPrint('    ✅ Promo is valid');
    return true;
  }

  /// Check apakah waktu sekarang dalam jam aktif promo
  static bool _isWithinActiveHours(ActiveHoursModel activeHours, DateTime now) {
    debugPrint('      _isWithinActiveHours: Checking schedule');

    final currentDay = now.weekday % 7; // Convert to 0=Sunday
    final currentTime =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    debugPrint('      Current Day: $currentDay, Current Time: $currentTime');

    for (final schedule in activeHours.schedule) {
      debugPrint(
        '      Checking schedule: Day ${schedule.dayOfWeek}, ${schedule.startTime} - ${schedule.endTime}',
      );
      if (schedule.dayOfWeek == currentDay) {
        if (_isTimeBetween(currentTime, schedule.startTime, schedule.endTime)) {
          debugPrint('        ✅ Time is within schedule');
          return true;
        }
      }
    }

    debugPrint('        ❌ No matching schedule found');
    return false;
  }

  static bool _isTimeBetween(String current, String start, String end) {
    final result = current.compareTo(start) >= 0 && current.compareTo(end) <= 0;
    debugPrint(
      '        _isTimeBetween: $current between $start and $end = $result',
    );
    return result;
  }

  /// Check apakah order memenuhi syarat promo
  static bool _isPromoEligible(
    AutoPromoModel promo,
    OrderDetailModel order,
    DateTime now,
  ) {
    debugPrint(
      '  _isPromoEligible: Checking eligibility for ${promo.promoType}',
    );

    bool result;
    switch (promo.promoType) {
      case 'product_specific':
        result = _hasEligibleProducts(promo, order);
        break;
      case 'bundling':
        result = _hasBundleProducts(promo, order);
        break;
      case 'discount_on_quantity':
        result = _meetsMinQuantity(promo, order);
        break;
      case 'discount_on_total':
        result = _meetsMinTotal(promo, order);
        break;
      case 'buy_x_get_y':
        result = _hasBuyProduct(promo, order);
        break;
      default:
        debugPrint('    ❌ Unknown promo type: ${promo.promoType}');
        return false;
    }

    debugPrint('    Eligibility result: $result');
    return result;
  }

  /// Helper: Filter items that do NOT have custom discount
  static List<OrderItemModel> _getEligibleItems(OrderDetailModel order) {
    return order.items.where((item) {
      final hasCustom = item.customDiscount?.isActive == true;
      if (hasCustom) {
        debugPrint(
          '    ⚠️ Item skipped (Custom Discount): ${item.menuItem.name}',
        );
      }
      return !hasCustom;
    }).toList();
  }

  static bool _hasEligibleProducts(
    AutoPromoModel promo,
    OrderDetailModel order,
  ) {
    debugPrint('    _hasEligibleProducts: Checking product-specific promo');
    final productIds = promo.conditions.products.map((p) => p.id).toSet();
    debugPrint('    Eligible Product IDs: $productIds');

    final eligibleItems = _getEligibleItems(order);

    for (final item in eligibleItems) {
      debugPrint(
        '    Checking item: ${item.menuItem.id} - ${item.menuItem.name}',
      );
      if (productIds.contains(item.menuItem.id)) {
        debugPrint('      ✅ Found eligible product');
        return true;
      }
    }

    debugPrint('      ❌ No eligible products found');
    return false;
  }

  static bool _hasBundleProducts(AutoPromoModel promo, OrderDetailModel order) {
    debugPrint('    _hasBundleProducts: Checking bundle promo');

    if (promo.conditions.bundleProducts.isEmpty) {
      debugPrint('      ❌ No bundle products defined');
      return false;
    }

    // Check apakah semua produk bundle ada di order (exclude custom discounted items)
    final eligibleItems = _getEligibleItems(order);

    for (final bundleItem in promo.conditions.bundleProducts) {
      final found = eligibleItems.where((item) {
        return item.menuItem.id == bundleItem.product.id;
      });

      final totalQty = found.fold(0, (sum, item) => sum + item.quantity);
      debugPrint(
        '    Bundle item: ${bundleItem.product.id}, Required: ${bundleItem.quantity}, Found: $totalQty',
      );

      if (totalQty < bundleItem.quantity) {
        debugPrint('      ❌ Insufficient quantity for bundle item');
        return false;
      }
    }

    debugPrint('      ✅ All bundle requirements met');
    return true;
  }

  static bool _meetsMinQuantity(AutoPromoModel promo, OrderDetailModel order) {
    final minQty = promo.conditions.minQuantity ?? 0;
    // Only count items without custom discount
    final eligibleItems = _getEligibleItems(order);
    final totalQty = eligibleItems.fold(0, (sum, item) => sum + item.quantity);

    debugPrint('    _meetsMinQuantity: Min Qty=$minQty, Actual Qty=$totalQty');
    debugPrint('      Result: ${totalQty >= minQty}');

    return totalQty >= minQty;
  }

  static bool _meetsMinTotal(AutoPromoModel promo, OrderDetailModel order) {
    final minTotal = promo.conditions.minTotal ?? 0;
    // Only count total from eligible items??
    // Decision: If we want strict mutual exclusion, we should probably exclude custom discounted items from the "Total Spend" calculation too.
    // However, usually total spend includes everything. But let's stick to the "Item exclusion" logic for safety.
    // If an item has custom discount, it doesn't contribute to auto promo eligibility.

    final eligibleTotal = _getEligibleItems(
      order,
    ).fold<int>(0, (sum, item) => sum + item.subtotal);

    final result = eligibleTotal >= minTotal;

    debugPrint(
      '    _meetsMinTotal: Min Total=$minTotal, Eligible Total=$eligibleTotal',
    );
    debugPrint('      Result: $result');

    return result;
  }

  static bool _hasBuyProduct(AutoPromoModel promo, OrderDetailModel order) {
    final buyProductId = promo.conditions.buyProduct?.id;
    if (buyProductId == null) {
      debugPrint('    _hasBuyProduct: No buy product defined');
      return false;
    }

    debugPrint('    _hasBuyProduct: Looking for product ID: $buyProductId');

    // Only look in eligible items
    final eligibleItems = _getEligibleItems(order);

    final hasProduct = eligibleItems.any(
      (item) => item.menuItem.id == buyProductId,
    );

    if (hasProduct) {
      final totalQty = eligibleItems
          .where((item) => item.menuItem.id == buyProductId)
          .fold(0, (sum, item) => sum + item.quantity);
      debugPrint('      ✅ Found buy product, total quantity: $totalQty');
    } else {
      debugPrint('      ❌ Buy product not found in order');
    }

    return hasProduct;
  }

  /// Prioritas promo (lebih kecil = lebih prioritas)
  static int _getPromoPriority(AutoPromoModel promo) {
    final priority = switch (promo.promoType) {
      'bundling' => 1,
      'buy_x_get_y' => 2,
      'product_specific' => 3,
      'discount_on_quantity' => 4,
      'discount_on_total' => 5,
      _ => 99,
    };

    debugPrint('  _getPromoPriority: ${promo.promoType} -> $priority');
    return priority;
  }

  /// Apply promo ke order dan return AppliedPromosModel
  static AppliedPromosModel? _applySinglePromo(
    OrderDetailModel order,
    AutoPromoModel promo,
    MenuItemModel? Function(String) findMenuById, {
    bool allowStackingOnTotal = false,
  }) {
    debugPrint(
      '    _applySinglePromo: Type=${promo.promoType}, Name=${promo.name}',
    );

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
          if (hasOtherTotal) {
            debugPrint(
              '      ❌ Another total discount already applied, stacking not allowed',
            );
            return null;
          }
        }
        return _applyDiscountOnTotal(order, promo);

      case 'buy_x_get_y':
        return _applyBuyXGetY(order, promo, findMenuById);

      default:
        debugPrint('      ❌ Unknown promo type, cannot apply');
        return null;
    }
  }

  /// PRODUCT SPECIFIC: Diskon untuk produk tertentu
  static AppliedPromosModel? _applyProductSpecific(
    OrderDetailModel order,
    AutoPromoModel promo,
  ) {
    debugPrint('      _applyProductSpecific: ${promo.name}');
    debugPrint('      Discount Percentage: ${promo.discount}%');

    final affectedItems = <AffectedItemModel>[];
    final productIds = promo.conditions.products.map((p) => p.id).toSet();
    debugPrint('      Targeted Product IDs: $productIds');

    // Use eligible items
    final eligibleItems = _getEligibleItems(order);

    for (final item in eligibleItems) {
      if (productIds.contains(item.menuItem.id)) {
        debugPrint('        Processing item: ${item.menuItem.name}');
        debugPrint(
          '          Quantity: ${item.quantity}, Subtotal: ${item.subtotal}',
        );

        final originalSubtotal = item.subtotal;
        final discountAmount =
            (originalSubtotal * promo.discount / 100).round();
        final discountedSubtotal = originalSubtotal - discountAmount;

        debugPrint('          Discount Amount: $discountAmount');
        debugPrint('          Discounted Subtotal: $discountedSubtotal');

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

    if (affectedItems.isEmpty) {
      debugPrint('        ❌ No affected items found');
      return null;
    }

    final totalDiscount = affectedItems.fold(
      0,
      (sum, item) => sum + item.discountAmount!,
    );

    debugPrint('        Total Discount: $totalDiscount');
    debugPrint('        Affected Items Count: ${affectedItems.length}');

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
  /// BUNDLING: Paket produk dengan harga khusus
  static AppliedPromosModel? _applyBundling(
    OrderDetailModel order,
    AutoPromoModel promo,
  ) {
    final bundlePrice = promo.bundlePrice ?? 0;
    final affectedItems = <AffectedItemModel>[];
    var totalOriginal = 0;

    debugPrint('🎁 Checking bundling promo: ${promo.name}');
    debugPrint(
      '📦 Required items: ${promo.conditions.bundleProducts.map((b) => "${b.product.name} x${b.quantity}").join(", ")}',
    );

    // Hitung berapa set bundle yang bisa dibuat
    var minSets = 999999;

    for (final bundleItem in promo.conditions.bundleProducts) {
      // Use eligible items
      final matchingItems = _getEligibleItems(
        order,
      ).where((item) => item.menuItem.id == bundleItem.product.id);

      if (matchingItems.isEmpty) {
        debugPrint('❌ Item not found in cart: ${bundleItem.product.name}');
        return null;
      }

      final totalQty = matchingItems.fold(
        0,
        (sum, item) => sum + item.quantity,
      );
      final sets = totalQty ~/ bundleItem.quantity;

      debugPrint(
        '  - ${bundleItem.product.name}: have $totalQty, need ${bundleItem.quantity}, can make $sets sets',
      );

      if (sets < minSets) minSets = sets;
    }

    if (minSets == 0) {
      debugPrint('❌ Cannot make any bundle sets');
      return null;
    }

    debugPrint('✅ Can make $minSets set(s) of bundle');

    // Apply discount untuk items dalam bundle
    for (final bundleItem in promo.conditions.bundleProducts) {
      // Use eligible items
      final matchingItems = _getEligibleItems(
        order,
      ).where((item) => item.menuItem.id == bundleItem.product.id);

      if (matchingItems.isEmpty) continue;

      final item = matchingItems.first;
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

    debugPrint(
      '💰 Original: $totalOriginal, Bundle: $totalBundlePrice, Discount: $totalDiscount',
    );

    // Update discount amount proportionally
    for (var i = 0; i < affectedItems.length; i++) {
      final ratio = (affectedItems[i].originalSubtotal ?? 0) / totalOriginal;
      final itemDiscount = (totalDiscount * ratio).round();

      affectedItems[i] = affectedItems[i].copyWith(
        discountAmount: itemDiscount,
        discountedSubtotal:
            (affectedItems[i].originalSubtotal ?? 0) - itemDiscount,
      );
    }

    return AppliedPromosModel(
      promoId: promo.id,
      promoName: promo.name,
      promoType: promo.promoType,
      discount: totalDiscount,
      affectedItems: affectedItems,
      freeItems: [],
      appliedCount: minSets,
      bundleSets: promo.promoType.toUpperCase() == 'BUNDLING' ? minSets : 0,
    );
  }

  /// DISCOUNT ON QUANTITY: Diskon berdasarkan qty minimal
  static AppliedPromosModel? _applyDiscountOnQuantity(
    OrderDetailModel order,
    AutoPromoModel promo,
  ) {
    debugPrint('      _applyDiscountOnQuantity: ${promo.name}');

    // Use eligible items
    final eligibleItems = _getEligibleItems(order);
    final totalQty = eligibleItems.fold(0, (sum, item) => sum + item.quantity);
    final minQty = promo.conditions.minQuantity ?? 0;

    debugPrint('        Total Qty: $totalQty, Min Qty: $minQty');

    if (totalQty < minQty) {
      debugPrint('        ❌ Minimum quantity not met');
      return null;
    }

    debugPrint(
      '        ✅ Minimum quantity met, applying ${promo.discount}% discount',
    );

    final affectedItems = <AffectedItemModel>[];
    debugPrint('        Calculating discount for each item:');

    // Apply only to eligible items? Or all items?
    // Usually "Discount on Quantity" means "Buy 5 items, get 10% off".
    // Does it apply to ALL items or only eligible ones?
    // Based on mutual exclusion principle: Only items WITHOUT custom discount should get the auto promo discount.

    for (final item in eligibleItems) {
      final originalSubtotal = item.subtotal;
      final discountAmount = (originalSubtotal * promo.discount / 100).round();
      final discountedSubtotal = originalSubtotal - discountAmount;

      debugPrint('          ${item.menuItem.name}:');
      debugPrint('            Subtotal: $originalSubtotal');
      debugPrint('            Discount: $discountAmount');
      debugPrint('            Final: $discountedSubtotal');

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
      (sum, item) => sum + item.discountAmount!,
    );

    debugPrint('        Total Discount: $totalDiscount');

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
    debugPrint('      _applyDiscountOnTotal: ${promo.name}');

    final minTotal = promo.conditions.minTotal ?? 0;

    // Calculate eligible total (excluding custom discounted items)
    final eligibleTotal = _getEligibleItems(
      order,
    ).fold<int>(0, (sum, item) => sum + item.subtotal);

    debugPrint('        Eligible Total: $eligibleTotal, Min Total: $minTotal');

    if (eligibleTotal < minTotal) {
      debugPrint('        ❌ Minimum total not met');
      return null;
    }

    // Diskon flat nominal
    final discountAmount = promo.discount;
    debugPrint('        ✅ Applying discount: $discountAmount');

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
    debugPrint('      _applyBuyXGetY: ${promo.name}');

    final buyProductId = promo.conditions.buyProduct?.id;
    final getProductId = promo.conditions.getProduct?.id;

    if (buyProductId == null || getProductId == null) {
      debugPrint('        ❌ Buy or Get product not defined');
      return null;
    }

    debugPrint('        Buy Product ID: $buyProductId');
    debugPrint('        Get Product ID: $getProductId');

    debugPrint('        Get Product ID: $getProductId');

    // Cari produk yang dibeli (eligible only)
    final buyItems = _getEligibleItems(
      order,
    ).where((item) => item.menuItem.id == buyProductId);

    if (buyItems.isEmpty) {
      debugPrint('        ❌ Buy product not found in order');
      return null;
    }

    final totalBuyQty = buyItems.fold(0, (sum, item) => sum + item.quantity);
    debugPrint('        Total Buy Quantity: $totalBuyQty');

    // Free item sesuai qty yang dibeli
    final getProduct = findMenuById(getProductId);
    if (getProduct == null) {
      debugPrint('        ❌ Get product not found in menu');
      return null;
    }

    debugPrint('        Get Product: ${getProduct.name}');
    debugPrint('        Free Quantity: $totalBuyQty');

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
          debugPrint(
            '          Affected item: ${item.menuItem.name}, Qty: ${item.quantity}',
          );
          return AffectedItemModel(
            menuItem: item.menuItem.id,
            menuItemName: item.menuItem.name ?? 'Produk tidak ada',
            quantity: item.quantity,
            originalSubtotal: item.subtotal,
            discountAmount: 0,
            discountedSubtotal: item.subtotal,
          );
        }).toList();

    debugPrint('        Created ${freeItems.length} free item(s)');

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
    debugPrint('      _updateOrderWithPromo: ${promo.name}');
    debugPrint('        Applied discount: ${appliedPromo.discount}');
    debugPrint('        Free items count: ${appliedPromo.freeItems.length}');
    debugPrint('        Note: Free items are NOT added to order.items');

    // Free items TIDAK ditambahkan ke order.items
    // Hanya disimpan di appliedPromos.freeItems
    return order;
  }

  /// Helper: Sum semua discount dari appliedPromos
  static int sumAutoDiscount(List<AppliedPromosModel>? promos) {
    if (promos == null || promos.isEmpty) {
      debugPrint('sumAutoDiscount: No promos to sum');
      return 0;
    }

    final total = promos.fold(0, (sum, p) => sum + (p.discount ?? 0));
    debugPrint('sumAutoDiscount: Total discount = $total');
    return total;
  }

  /// Helper: Get daftar produk yang kena promo
  static Set<String> getAffectedProductIds(List<AppliedPromosModel>? promos) {
    if (promos == null || promos.isEmpty) {
      debugPrint('getAffectedProductIds: No promos');
      return {};
    }

    final ids =
        promos
            .expand((p) => p.affectedItems)
            .map((item) => item.menuItem)
            .toSet();

    debugPrint('getAffectedProductIds: Affected product IDs = $ids');
    return ids;
  }

  /// Helper: Check apakah item tertentu kena promo
  static bool isItemAffectedByPromo(
    String menuItemId,
    List<AppliedPromosModel>? promos,
  ) {
    if (promos == null || promos.isEmpty) {
      debugPrint(
        'isItemAffectedByPromo: No promos, item $menuItemId not affected',
      );
      return false;
    }

    final isAffected = promos.any(
      (p) => p.affectedItems.any((item) => item.menuItem == menuItemId),
    );

    debugPrint(
      'isItemAffectedByPromo: Item $menuItemId affected = $isAffected',
    );
    return isAffected;
  }

  /// Helper: Get total discount untuk item tertentu
  static int getItemDiscount(
    String menuItemId,
    List<AppliedPromosModel>? promos,
  ) {
    if (promos == null || promos.isEmpty) {
      debugPrint('getItemDiscount: No promos, discount for $menuItemId = 0');
      return 0;
    }

    final totalDiscount = promos.fold(0, (sum, promo) {
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
      return sum + (affected.discountAmount ?? 0);
    });

    debugPrint(
      'getItemDiscount: Total discount for $menuItemId = $totalDiscount',
    );
    return totalDiscount;
  }
}
