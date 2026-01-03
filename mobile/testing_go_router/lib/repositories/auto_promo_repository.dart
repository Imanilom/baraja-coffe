import 'package:flutter/rendering.dart';
import 'package:kasirbaraja/models/promo_group.model.dart';
import 'package:kasirbaraja/services/auto_promo_service.dart';
import 'package:kasirbaraja/services/hive_service.dart';

import '../models/auto_promo.model.dart';

class AutoPromoRepository {
  final AutoPromoService _autoPromoService = AutoPromoService();

  Future<List<AutoPromoModel>> getAutoPromos() async {
    final box = HiveService.autoPromosBox;
    // final promoBox = HiveService.promoGroupsBox;

    try {
      final response = await _autoPromoService.fetchAutoPromos();

      //json to model
      final data = response;
      final autoPromos =
          data.map((json) => AutoPromoModel.fromJson(json)).toList();

      await box.clear();

      // Save new data
      for (var i = 0; i < autoPromos.length; i++) {
        await box.put('promo_$i', autoPromos[i]);
      }

      return autoPromos;
    } catch (e) {
      final local = box.values.cast<AutoPromoModel>().toList();
      if (local.isNotEmpty) return local;
      rethrow;
    }
  }

  //get local autopromo
  Future<List<AutoPromoModel>> getLocalAutoPromos() async {
    final box = HiveService.autoPromosBox;
    final localData = box.values.toList();

    return localData;
  }

  Future<List<AutoPromoModel>> _getPromosFromLocal() async {
    try {
      final box = HiveService.autoPromosBox;
      final promos = box.values.toList();

      debugPrint('Loaded ${promos.length} promos from local storage');
      return promos;
    } catch (e) {
      debugPrint('Error loading promos from local: $e');
      return [];
    }
  }

  /// Get active promos (yang valid untuk sekarang)
  Future<List<AutoPromoModel>> getActivePromos() async {
    final allPromos = await _getPromosFromLocal();
    final now = DateTime.now();

    return allPromos.where((promo) {
      if (!promo.isActive) return false;

      final validFrom = DateTime.parse(promo.validFrom);
      final validTo = DateTime.parse(promo.validTo);

      return now.isAfter(validFrom) && now.isBefore(validTo);
    }).toList();
  }

  // List<PromoGroupModel> buildPromoGroups(List<AutoPromoModel> promos) {
  //   final groups = <PromoGroupModel>[];

  //   for (final p in promos) {
  //     if (p.isActive != true) continue;

  //     if (p.promoType == 'bundling') {
  //       final bundle = p.conditions.bundleProducts ?? [];
  //       if (bundle.isEmpty) continue;

  //       groups.add(
  //         PromoGroupModel(
  //           promoId: p.id,
  //           title: p.name,
  //           subtitle: 'Bundling deal',
  //           promoType: p.promoType,
  //           lines:
  //               bundle
  //                   .map(
  //                     (b) => PromoGroupLine(
  //                       menuItemId: b.product.id,
  //                       qty: b.quantity ?? 1,
  //                     ),
  //                   )
  //                   .toList(),
  //         ),
  //       );
  //     }

  //     if (p.promoType == 'buy_x_get_y') {
  //       final buy = p.conditions.buyProduct;
  //       final get = p.conditions.getProduct;
  //       if (buy == null || get == null) continue;

  //       groups.add(
  //         PromoGroupModel(
  //           promoId: p.id,
  //           title: p.name,
  //           subtitle: 'Beli ${buy.name} gratis ${get.name}',
  //           promoType: p.promoType,
  //           lines: [
  //             PromoGroupLine(menuItemId: buy.id, qty: 1),
  //             // opsional: tambah get item biar “kelihatan”
  //             // PromoGroupLine(menuItemId: get.id, qty: 1),
  //           ],
  //         ),
  //       );
  //     }
  //   }

  //   return groups;
  // }

  //get local promogroup
  Future<List<PromoGroupModel>> getLocalPromoGroups() async {
    final box = HiveService.promoGroupsBox;
    final localData = box.values.toList();

    return localData;
  }

  Future<List<AutoPromoModel>> refreshPromos() async {
    return await getAutoPromos();
  }
}
