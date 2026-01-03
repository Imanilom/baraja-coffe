import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/auto_promo.model.dart';
import 'package:kasirbaraja/models/promo_group.model.dart';
import '../../repositories/auto_promo_repository.dart';

final autoPromoRepository = Provider<AutoPromoRepository>(
  (ref) => AutoPromoRepository(),
);

final autopromoProvider = FutureProvider<List<AutoPromoModel>>((ref) async {
  final repository = ref.read(autoPromoRepository);
  final autoPromos = await repository.getAutoPromos();
  return autoPromos;
});

// final promoGroupsProvider = FutureProvider<List<PromoGroupModel>>((ref) async {
//   final promos = await ref.watch(autopromoProvider.future);
//   // return ref.read(autoPromoRepository).buildPromoGroups(promos);
//   return [];
// });

/// Provider untuk semua promo groups
final promoGroupsProvider = FutureProvider<List<PromoGroupModel>>((ref) async {
  final allPromos = await ref.watch(autopromoProvider.future);

  // Convert promos ke groups
  return PromoGroupConverter.convertToGroups(allPromos);
});

/// Provider untuk active promo groups only
final activePromoGroupsProvider = FutureProvider<List<PromoGroupModel>>((
  ref,
) async {
  final allGroups = await ref.watch(promoGroupsProvider.future);

  return allGroups.where((group) => group.isActive).toList();
});
