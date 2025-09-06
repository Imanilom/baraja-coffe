// ignore_for_file: invalid_annotation_target

import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import 'addon.model.dart';
import 'topping.model.dart';

part 'menu_item.model.g.dart';
part 'menu_item.model.freezed.dart';

@freezed
@HiveType(typeId: 3)
abstract class MenuItemModel with _$MenuItemModel {
  factory MenuItemModel({
    @HiveField(1) @JsonKey(name: '_id') required String id,
    @HiveField(2) String? name,
    @HiveField(3) int? price,
    @HiveField(4) String? description,
    @HiveField(5) @JsonKey(name: 'category') List<String>? categories,
    @HiveField(6) String? imageURL,
    @HiveField(7) List<ToppingModel>? toppings,
    @HiveField(8) List<AddonModel>? addons,
  }) = _MenuItemModel;

  factory MenuItemModel.fromJson(Map<String, dynamic> json) =>
      _$MenuItemModelFromJson(json);
}
