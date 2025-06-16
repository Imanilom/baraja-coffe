import 'package:hive_ce/hive.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'adapter/topping.model.g.dart';
part 'adapter/topping.model.freezed.dart';

@freezed
@HiveType(typeId: 2)
abstract class ToppingModel with _$ToppingModel {
  const factory ToppingModel({
    @HiveField(0) String? id,
    @HiveField(1) String? name,
    @HiveField(2) int? price,
  }) = _ToppingModel;

  factory ToppingModel.fromJson(Map<String, dynamic> json) =>
      _$ToppingModelFromJson(json);
}
