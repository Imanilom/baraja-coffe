import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import 'addon_option.model.dart';

part 'addon.model.freezed.dart';
part 'addon.model.g.dart';

@freezed
@HiveType(typeId: 2)
abstract class AddonModel with _$AddonModel {
  factory AddonModel({
    @HiveField(1) String? id,
    @HiveField(2) required String name,
    @HiveField(3) String? type,
    @HiveField(4) required List<AddonOptionModel> options,
  }) = _AddonModel;
}
