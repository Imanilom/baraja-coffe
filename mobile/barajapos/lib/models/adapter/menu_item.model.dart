import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import 'addon.model.dart';
import 'topping.model.dart';

part 'menu_item.model.g.dart';
part 'menu_item.model.freezed.dart';

@freezed
@HiveType(typeId: 0)
abstract class MenuItemModel with _$MenuItemModel {
  factory MenuItemModel({
    @HiveField(1) required String id,
    @HiveField(2) required String name,
    @HiveField(3) required int price,
    @HiveField(4) required String description,
    @HiveField(5) required List<String> categories,
    @HiveField(6) required String imageURL,
    @HiveField(7) List<ToppingModel>? toppings,
    @HiveField(8) List<AddonModel>? addons,
  }) = _MenuItemModel;

  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    final List<ToppingModel> toppings = json['toppings'] != null
        ? List<ToppingModel>.from(
            json['toppings'].map((x) => ToppingModel.fromJson(x)))
        : [];

    final List<AddonModel> addons = json['addons'] != null
        ? List<AddonModel>.from(
            json['addons'].map((x) => AddonModel.fromJson(x)))
        : [];

    return MenuItemModel(
      id: json['_id'],
      name: json['name'],
      price: json['price'],
      description: json['description'],
      categories: List<String>.from(json['category']),
      imageURL: json['imageURL'],
      toppings: toppings,
      addons: addons,
      // availableAt: List<AvailableAt>.from(
      //     json['availableAt'].map((x) => AvailableAt.fromJson(x))),
    );
  }
}
