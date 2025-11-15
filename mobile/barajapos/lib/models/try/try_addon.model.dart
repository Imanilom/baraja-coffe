import 'package:barajapos/models/adapter/addon_option.model.dart';
import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

// import 'addon_option.model.dart';

part 'try_addon.model.freezed.dart';
part 'try_addon.model.g.dart';

@freezed
@HiveType(typeId: 12)
abstract class TryAddonModel with _$TryAddonModel {
  factory TryAddonModel({
    @HiveField(0) @Default('') String? id,
    @HiveField(1) @Default('') String? name,
    @HiveField(2) @Default('') String? type,
    @HiveField(3) List<AddonOptionModel>? options,
  }) = _TryAddonModel;

  factory TryAddonModel.fromJson(Map<String, dynamic> json) =>
      _$TryAddonModelFromJson(json);
}
