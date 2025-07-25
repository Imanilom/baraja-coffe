// ignore_for_file: invalid_annotation_target
import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:kasirbaraja/models/menu_category.model.dart';
import 'package:kasirbaraja/models/menu_subcategory.model.dart';

import 'addon.model.dart';
import 'topping.model.dart';

part 'menu_item.model.g.dart';
part 'menu_item.model.freezed.dart';

@freezed
@HiveType(typeId: 3)
abstract class MenuItemModel with _$MenuItemModel {
  factory MenuItemModel({
    @HiveField(1) required String id,
    @HiveField(2) @Default("") String? name,
    @HiveField(3) @Default(0) int? originalPrice, // Ubah menjadi int
    @HiveField(4) @Default(0) int? discountedPrice, // Tambahkan field baru
    @HiveField(5) @Default("") String? description,
    @HiveField(6) @Default("") String? mainCategory, // Ubah tipe data
    @HiveField(7) @Default("") String? subCategory, // Ubah tipe data
    // @HiveField(6) MenuCategoryModel? category, // Ubah tipe data
    // @HiveField(7) MenuSubCategoryModel? subCategory, // Ubah tipe data
    @HiveField(8)
    @Default("")
    @JsonKey(name: 'imageUrl')
    String? imageURL, // Sesuaikan key JSON
    @HiveField(9) @Default([]) List<ToppingModel>? toppings,
    @HiveField(10) @Default([]) List<AddonModel>? addons,
    @HiveField(11) @Default(0) int? discountPercentage, // Tambahkan fiel,d baru
    @HiveField(12) @Default(0) int? averageRating, // Tambahkan field baru
    @HiveField(13) @Default(0) int? reviewCount, // Tambahkan field baru
    @HiveField(14) @Default(true) bool? isAvailable, // Tambahkan field baru
    @HiveField(15) @Default("") String? workstation,
  }) = _MenuItemModel;

  MenuItemModel._();

  int displayPrice() {
    if (discountedPrice != null && discountedPrice! < originalPrice!) {
      return discountedPrice!;
    }
    return originalPrice ?? 0;
  }

  factory MenuItemModel.fromJson(Map<String, dynamic> json) =>
  // _$MenuItemModelFromJson(json);
  MenuItemModel(
    id: json['id'] ?? json['id'].toString(),
    name: json['name'] ?? json['name'].toString(),
    originalPrice: json['originalPrice'],
    discountedPrice: json['discountedPrice'],
    description: json['description'] ?? "",
    mainCategory: json['mainCategory'] ?? "",
    // category: json['category']['name'] ?? "tidak ada kategori",
    subCategory: json['subCategory']['name'] ?? "",
    imageURL: json['imageUrl'] ?? "",
    toppings:
        json['toppings'] == null
            ? []
            : (json['toppings'] as List)
                .map((e) => ToppingModel.fromJson(e))
                .toList(),
    addons:
        json['addons'] == null
            ? []
            : (json['addons'] as List)
                .map((e) => AddonModel.fromJson(e))
                .toList(),
    discountPercentage:
        json['discountPercentage'] == null
            ? 0
            : (json['discountPercentage'] as num).toInt(),
    averageRating:
        json['averageRating'] == null
            ? 0
            : (json['averageRating'] as num?)?.toInt(),
    reviewCount: json['reviewCount'] as int? ?? 0,
    isAvailable: json['isAvailable'] ?? true,
    workstation: json['workstation'] ?? "",
  );
}
