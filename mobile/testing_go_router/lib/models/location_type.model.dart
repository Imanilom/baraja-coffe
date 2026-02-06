import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'location_type.model.freezed.dart';
part 'location_type.model.g.dart';

@freezed
@HiveType(typeId: 208)
abstract class LocationTypeModel with _$LocationTypeModel {
  const LocationTypeModel._();

  const factory LocationTypeModel({
    @HiveField(0) required String id,
    @HiveField(1) required String name,
  }) = _LocationTypeModel;

  factory LocationTypeModel.fromJson(Map<String, dynamic> json) =>
      _$LocationTypeModelFromJson(json);

  // Static instances to mimic enum behavior
  static const indoor = LocationTypeModel(id: 'indoor', name: 'Indoor');
  static const outdoor = LocationTypeModel(id: 'outdoor', name: 'Outdoor');
  static const unknown = LocationTypeModel(id: 'unknown', name: 'Unknown');

  static List<LocationTypeModel> get values => [indoor, outdoor, unknown];

  static LocationTypeModel fromString(String type) {
    return values.firstWhere(
      (e) =>
          e.id.toLowerCase() == type.toLowerCase() ||
          e.name.toLowerCase() == type.toLowerCase(),
      orElse: () => unknown,
    );
  }

  static String toJsonString(LocationTypeModel? type) =>
      type?.name ?? unknown.name;

  // Helper to maintain compatibility if needed (value was used in extension)
  String get value => name;
}
