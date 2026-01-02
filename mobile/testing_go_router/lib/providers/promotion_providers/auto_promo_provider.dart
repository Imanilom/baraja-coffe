import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/auto_promo.model.dart';
import '../../repositories/auto_promo_repository.dart';

final autoPromoRepository = Provider<AutoPromoRepository>(
  (ref) => AutoPromoRepository(),
);

final autopromoProvider = FutureProvider<List<AutoPromoModel>>((ref) async {
  final repository = ref.read(autoPromoRepository);
  final autoPromos = await repository.getAutoPromos();
  return autoPromos;
});
