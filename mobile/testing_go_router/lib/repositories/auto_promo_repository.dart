import 'package:kasirbaraja/services/auto_promo_service.dart';
import 'package:kasirbaraja/services/hive_service.dart';

import '../models/auto_promo.model.dart';

class AutoPromoRepository {
  final AutoPromoService _autoPromoService = AutoPromoService();

  Future<List<AutoPromoModel>> getAutoPromos() async {
    final box = HiveService.autoPromosBox;

    try {
      final response = await _autoPromoService.fetchAutoPromos();

      //json to model
      final data = response;
      final autoPromos =
          data.map((json) => AutoPromoModel.fromJson(json)).toList();

      await box.clear();
      await box.putAll({for (final m in autoPromos) m.id: m});

      return autoPromos;
    } catch (e) {
      final local = box.values.cast<AutoPromoModel>().toList();
      if (local.isNotEmpty) return local;
      rethrow;
    }
  }
}
