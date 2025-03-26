import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import 'addon.model.dart';
import 'topping.model.dart';

part 'menu_item.model.g.dart';
part 'menu_item.model.freezed.dart';

@freezed
@HiveType(typeId: 0)
class MenuItemModel with _$MenuItemModel {
  @HiveField(0)
  factory MenuItemModel({
    @HiveField(1) required String id,
    @HiveField(2) required String name,
    @HiveField(3) required double price,
    @HiveField(4) required String description,
    @HiveField(5) required List<String> categories,
    @HiveField(6) required String imageURL,
    @HiveField(7) List<ToppingModel>? toppings,
    @HiveField(8) List<AddonModel>? addons,
  }) = _MenuItemModel;

  factory MenuItemModel.fromJson(Map<String, dynamic> json) =>
      _$MenuItemModelFromJson(json);
}
