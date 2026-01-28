// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'event.model.freezed.dart';
part 'event.model.g.dart';

@freezed
@HiveType(typeId: 24) // Pastikan typeId unik untuk setiap model
abstract class Event with _$Event {
  factory Event({
    @HiveField(0) @JsonKey(name: '_id') required String id,
    @HiveField(1) required String name,
    @HiveField(2) @Default(null) String? description,
    @HiveField(3) @Default(null) String? location,
    @HiveField(4) @Default(null) DateTime? date,
    @HiveField(5) @Default(0) int? price,
    @HiveField(6) @Default(null) String? organizer,
    @HiveField(7) @Default(null) String? contactEmail,
    @HiveField(8) @Default(null) String? imageUrl,
    @HiveField(9) @Default(null) String? category,
    @HiveField(10) @Default([]) List<String>? tags,
    @HiveField(11) @Default(null) String? status,
    @HiveField(12) @Default(1) int? capacity,
    @HiveField(13) @Default([]) List<String>? attendees,
    @HiveField(14) @Default(null) String? privacy,
    @HiveField(15) @Default(null) String? terms,
    @HiveField(16) @Default(null) DateTime? createdAt,
    @HiveField(17) @Default(null) DateTime? updatedAt,
  }) = _Event;

  factory Event.fromJson(Map<String, dynamic> json) => _$EventFromJson(json);
}
