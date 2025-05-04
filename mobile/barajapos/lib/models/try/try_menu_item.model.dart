// ignore_for_file: invalid_annotation_target

import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

// import 'addon.model.dart';
// import 'topping.model.dart';

part 'try_menu_item.model.g.dart';
part 'try_menu_item.model.freezed.dart';

@freezed
@HiveType(typeId: 11)
abstract class TryMenuItemModel with _$TryMenuItemModel {
  factory TryMenuItemModel({
    @HiveField(1) @JsonKey(name: '_id') required String id,
    @HiveField(2) @Default('') String? name,
    @HiveField(3) @Default(0) int? price,
    @HiveField(4) @Default('') String? description,
    @HiveField(5)
    @Default([])
    @JsonKey(name: 'category')
    List<String>? categories,
    @HiveField(6) @Default('') String? imageURL,
    // @HiveField(7) List<ToppingModel>? toppings,
    // @HiveField(8) List<AddonModel>? addons,
  }) = _TryMenuItemModel;

  factory TryMenuItemModel.fromJson(Map<String, dynamic> json) =>
      _$TryMenuItemModelFromJson(json);
}
