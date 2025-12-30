import 'package:flutter/rendering.dart';
import 'package:kasirbaraja/models/promo_group.model.dart';
import 'package:kasirbaraja/services/auto_promo_service.dart';
import 'package:kasirbaraja/services/hive_service.dart';

import '../models/auto_promo.model.dart';

class AutoPromoRepository {
  final AutoPromoService _autoPromoService = AutoPromoService();

  Future<List<AutoPromoModel>> getAutoPromos() async {
    final box = HiveService.autoPromosBox;
    final promoBox = HiveService.promoGroupsBox;

    try {
      final response = await _autoPromoService.fetchAutoPromos();

      //json to model
      final data = response;
      final autoPromos =
          data.map((json) => AutoPromoModel.fromJson(json)).toList();

      await box.clear();
      await box.putAll({for (final m in autoPromos) m.id: m});

      final promoGroups = buildPromoGroups(autoPromos);

      await promoBox.clear();
      await promoBox.putAll({for (final m in promoGroups) m.promoId: m});
      debugPrint('Promo Groups: ${promoGroups.length}');

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

  List<PromoGroupModel> buildPromoGroups(List<AutoPromoModel> promos) {
    final groups = <PromoGroupModel>[];

    for (final p in promos) {
      if (p.isActive != true) continue;

      if (p.promoType == 'bundling') {
        final bundle = p.conditions?.bundleProducts ?? [];
        if (bundle.isEmpty) continue;

        groups.add(
          PromoGroupModel(
            promoId: p.id,
            title: p.name,
            subtitle: 'Bundling deal',
            promoType: p.promoType,
            lines:
                bundle
                    .map(
                      (b) => PromoGroupLine(
                        menuItemId: b.product.id,
                        qty: b.quantity ?? 1,
                      ),
                    )
                    .toList(),
          ),
        );
      }

      if (p.promoType == 'buy_x_get_y') {
        final buy = p.conditions?.buyProduct;
        final get = p.conditions?.getProduct;
        if (buy == null || get == null) continue;

        groups.add(
          PromoGroupModel(
            promoId: p.id,
            title: p.name,
            subtitle: 'Beli ${buy.name} gratis ${get.name}',
            promoType: p.promoType,
            lines: [
              PromoGroupLine(menuItemId: buy.id, qty: 1),
              // opsional: tambah get item biar “kelihatan”
              // PromoGroupLine(menuItemId: get.id, qty: 1),
            ],
          ),
        );
      }
    }

    return groups;
  }

  //get local promogroup
  Future<List<PromoGroupModel>> getLocalPromoGroups() async {
    final box = HiveService.promoGroupsBox;
    final localData = box.values.toList();

    return localData;
  }

  Future<void> deleteAutoPromo(String id) async {
    final box = HiveService.autoPromosBox;
    await box.delete(id);
  }

  Future<void> clearAllAutoPromos() async {
    final box = HiveService.autoPromosBox;
    await box.clear();
  }
}
