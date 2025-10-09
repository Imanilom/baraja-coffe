// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'device.model.freezed.dart';
part 'device.model.g.dart';

@freezed
@HiveType(typeId: 25) // Pastikan typeId unik
abstract class DeviceModel with _$DeviceModel {
  factory DeviceModel({
    @HiveField(0) @JsonKey(name: '_id') required String id,
    @HiveField(1) required String outlet,
    @HiveField(2) required String deviceId,
    @HiveField(3) required String deviceName,
    @HiveField(4) required String deviceType,
    @HiveField(5) required String location,
    @HiveField(6) @Default([]) List<String> assignedAreas,
    @HiveField(7) @Default([]) List<String> assignedTables,
    @HiveField(8) @Default([]) List<String> orderTypes,
    @HiveField(9) @Default(false) bool isOnline,
    @HiveField(10) @Default(null) String? currentUser,
    @HiveField(11) @Default(true) bool isAvailable,
  }) = _DeviceModel;

  factory DeviceModel.fromJson(Map<String, dynamic> json) =>
      _$DeviceModelFromJson(json);
}
