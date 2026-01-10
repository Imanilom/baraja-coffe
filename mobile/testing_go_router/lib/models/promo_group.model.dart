// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/auto_promo.model.dart';

part 'promo_group.model.freezed.dart';
part 'promo_group.model.g.dart';

/// Model untuk grouping promo berdasarkan menu category
@freezed
@HiveType(typeId: 35)
abstract class PromoGroupModel with _$PromoGroupModel {
  factory PromoGroupModel({
    @HiveField(0) required String id,
    @HiveField(1) required String promoId, // ID promo asli
    @HiveField(2) required String name,
    @HiveField(3) required String promoType,
    @HiveField(4) @Default(null) String? description,
    @HiveField(5)
    @Default([])
    List<PromoGroupLineModel> lines, // Items dalam group
    @HiveField(6) int? bundlePrice,
    @HiveField(7) int? discount,
    @HiveField(8) @Default(false) bool isActive,
    @HiveField(9) String? imageUrl,
    @HiveField(10) @Default([]) List<String> tags, // untuk filtering
    @HiveField(11) AutoPromoModel? sourcePromo, // reference ke promo asli
  }) = _PromoGroupModel;

  factory PromoGroupModel.fromJson(Map<String, dynamic> json) =>
      _$PromoGroupModelFromJson(json);
}

/// Line item dalam promo group
@freezed
@HiveType(typeId: 36)
abstract class PromoGroupLineModel with _$PromoGroupLineModel {
  factory PromoGroupLineModel({
    @HiveField(0) required String menuItemId,
    @HiveField(1) required String menuItemName,
    @HiveField(2) required int qty,
    @HiveField(3) int? originalPrice,
    @HiveField(4) String? categoryId,
    @HiveField(5) String? categoryName,
  }) = _PromoGroupLineModel;

  factory PromoGroupLineModel.fromJson(Map<String, dynamic> json) =>
      _$PromoGroupLineModelFromJson(json);
}

/// Extension untuk convert AutoPromoModel ke PromoGroupModel
extension AutoPromoToGroupExtension on AutoPromoModel {
  /// Convert bundling promo ke group
  PromoGroupModel? toBundleGroup() {
    if (promoType != 'bundling') return null;
    if (conditions.bundleProducts.isEmpty) return null;

    final lines =
        conditions.bundleProducts.map((bundle) {
          return PromoGroupLineModel(
            menuItemId: bundle.product.id,
            menuItemName: bundle.product.name,
            qty: bundle.quantity,
          );
        }).toList();

    return PromoGroupModel(
      id: 'group_$id',
      promoId: id,
      name: name,
      promoType: promoType,
      description: _generateDescription(),
      lines: lines,
      bundlePrice: bundlePrice,
      discount: discount,
      isActive: isActive,
      tags: ['bundling', 'paket'],
      sourcePromo: this,
    );
  }

  /// Convert product_specific promo ke group
  List<PromoGroupModel> toProductGroups() {
    if (promoType != 'product_specific') return [];
    if (conditions.products.isEmpty) return [];

    return conditions.products.map((product) {
      return PromoGroupModel(
        id: 'group_${id}_${product.id}',
        promoId: id,
        name: name,
        promoType: promoType,
        description: 'Diskon $discount% untuk ${product.name}',
        lines: [
          PromoGroupLineModel(
            menuItemId: product.id,
            menuItemName: product.name,
            qty: 1,
          ),
        ],
        discount: discount,
        isActive: isActive,
        tags: ['diskon', 'product'],
        sourcePromo: this,
      );
    }).toList();
  }

  /// Convert buy_x_get_y promo ke group
  PromoGroupModel? toBuyXGetYGroup() {
    if (promoType != 'buy_x_get_y') return null;

    final buyProduct = conditions.buyProduct;
    final getProduct = conditions.getProduct;

    if (buyProduct == null || getProduct == null) return null;

    return PromoGroupModel(
      id: 'group_$id',
      promoId: id,
      name: name,
      promoType: promoType,
      description: 'Beli ${buyProduct.name}, Gratis ${getProduct.name}',
      lines: [
        PromoGroupLineModel(
          menuItemId: buyProduct.id,
          menuItemName: buyProduct.name,
          qty: 1,
        ),
      ],
      isActive: isActive,
      tags: ['gratis', 'buy_get'],
      sourcePromo: this,
    );
  }

  String _generateDescription() {
    switch (promoType) {
      case 'bundling':
        final items = conditions.bundleProducts
            .map((b) => '${b.quantity}x ${b.product.name}')
            .join(', ');
        return 'Paket: $items';

      case 'product_specific':
        return 'Diskon $discount% untuk produk pilihan';

      case 'discount_on_quantity':
        return 'Beli ${conditions.minQuantity}+ item, diskon $discount%';

      case 'discount_on_total':
        return 'Belanja min Rp${conditions.minTotal}, diskon Rp$discount';

      case 'buy_x_get_y':
        return 'Beli ${conditions.buyProduct?.name}, gratis ${conditions.getProduct?.name}';

      default:
        return name;
    }
  }
}

/// Helper untuk convert list promo ke groups
class PromoGroupConverter {
  /// Convert semua promo ke groups berdasarkan menu items
  static List<PromoGroupModel> convertToGroups(List<AutoPromoModel> promos) {
    final groups = <PromoGroupModel>[];

    for (final promo in promos) {
      switch (promo.promoType) {
        case 'bundling':
          final group = promo.toBundleGroup();
          if (group != null) groups.add(group);
          break;

        case 'product_specific':
          groups.addAll(promo.toProductGroups());
          break;

        case 'buy_x_get_y':
          final group = promo.toBuyXGetYGroup();
          if (group != null) groups.add(group);
          break;

        // discount_on_quantity dan discount_on_total
        // tidak perlu group karena apply otomatis
        default:
          break;
      }
    }

    return groups;
  }

  // /// Get groups untuk menu item tertentu
  // static List<PromoGroupModel> getGroupsForMenuItem(
  //   String menuItemId,
  //   List<PromoGroupModel> allGroups,
  // ) {
  //   return allGroups.where((group) {
  //     return group.lines.any((line) => line.menuItemId == menuItemId);
  //   }).toList();
  // }

  // /// Get groups berdasarkan category
  // static List<PromoGroupModel> getGroupsByCategory(
  //   String categoryId,
  //   List<PromoGroupModel> allGroups,
  // ) {
  //   return allGroups.where((group) {
  //     return group.lines.any((line) => line.categoryId == categoryId);
  //   }).toList();
  // }

  // /// Filter groups berdasarkan tags
  // static List<PromoGroupModel> filterByTags(
  //   List<String> tags,
  //   List<PromoGroupModel> allGroups,
  // ) {
  //   return allGroups.where((group) {
  //     return group.tags.any((tag) => tags.contains(tag));
  //   }).toList();
  // }
}
