// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'va_number.model.freezed.dart';
part 'va_number.model.g.dart';

@freezed
@HiveType(typeId: 19) // Pastikan typeId unik
abstract class VANumberModel with _$VANumberModel {
  factory VANumberModel({
    @HiveField(0) required String bank,
    @HiveField(1) @JsonKey(name: 'va_number') required String vaNumber,
  }) = _VANumberModel;

  factory VANumberModel.fromJson(Map<String, dynamic> json) =>
      _$VANumberModelFromJson(json);
}
