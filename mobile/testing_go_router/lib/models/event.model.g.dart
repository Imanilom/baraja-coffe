// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'event.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class EventAdapter extends TypeAdapter<Event> {
  @override
  final typeId = 24;

  @override
  Event read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Event(
      id: fields[0] as String,
      name: fields[1] as String,
      description: fields[2] == null ? null : fields[2] as String?,
      location: fields[3] == null ? null : fields[3] as String?,
      date: fields[4] == null ? null : fields[4] as DateTime?,
      price: fields[5] == null ? 0 : (fields[5] as num?)?.toInt(),
      organizer: fields[6] == null ? null : fields[6] as String?,
      contactEmail: fields[7] == null ? null : fields[7] as String?,
      imageUrl: fields[8] == null ? null : fields[8] as String?,
      category: fields[9] == null ? null : fields[9] as String?,
      tags: fields[10] == null ? [] : (fields[10] as List?)?.cast<String>(),
      status: fields[11] == null ? null : fields[11] as String?,
      capacity: fields[12] == null ? 1 : (fields[12] as num?)?.toInt(),
      attendees:
          fields[13] == null ? [] : (fields[13] as List?)?.cast<String>(),
      privacy: fields[14] == null ? null : fields[14] as String?,
      terms: fields[15] == null ? null : fields[15] as String?,
      createdAt: fields[16] == null ? null : fields[16] as DateTime?,
      updatedAt: fields[17] == null ? null : fields[17] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, Event obj) {
    writer
      ..writeByte(18)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.description)
      ..writeByte(3)
      ..write(obj.location)
      ..writeByte(4)
      ..write(obj.date)
      ..writeByte(5)
      ..write(obj.price)
      ..writeByte(6)
      ..write(obj.organizer)
      ..writeByte(7)
      ..write(obj.contactEmail)
      ..writeByte(8)
      ..write(obj.imageUrl)
      ..writeByte(9)
      ..write(obj.category)
      ..writeByte(10)
      ..write(obj.tags)
      ..writeByte(11)
      ..write(obj.status)
      ..writeByte(12)
      ..write(obj.capacity)
      ..writeByte(13)
      ..write(obj.attendees)
      ..writeByte(14)
      ..write(obj.privacy)
      ..writeByte(15)
      ..write(obj.terms)
      ..writeByte(16)
      ..write(obj.createdAt)
      ..writeByte(17)
      ..write(obj.updatedAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is EventAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Event _$EventFromJson(Map<String, dynamic> json) => _Event(
  id: json['_id'] as String,
  name: json['name'] as String,
  description: json['description'] as String? ?? null,
  location: json['location'] as String? ?? null,
  date: json['date'] == null ? null : DateTime.parse(json['date'] as String),
  price: (json['price'] as num?)?.toInt() ?? 0,
  organizer: json['organizer'] as String? ?? null,
  contactEmail: json['contactEmail'] as String? ?? null,
  imageUrl: json['imageUrl'] as String? ?? null,
  category: json['category'] as String? ?? null,
  tags:
      (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  status: json['status'] as String? ?? null,
  capacity: (json['capacity'] as num?)?.toInt() ?? 1,
  attendees:
      (json['attendees'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  privacy: json['privacy'] as String? ?? null,
  terms: json['terms'] as String? ?? null,
  createdAt:
      json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
  updatedAt:
      json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$EventToJson(_Event instance) => <String, dynamic>{
  '_id': instance.id,
  'name': instance.name,
  'description': instance.description,
  'location': instance.location,
  'date': instance.date?.toIso8601String(),
  'price': instance.price,
  'organizer': instance.organizer,
  'contactEmail': instance.contactEmail,
  'imageUrl': instance.imageUrl,
  'category': instance.category,
  'tags': instance.tags,
  'status': instance.status,
  'capacity': instance.capacity,
  'attendees': instance.attendees,
  'privacy': instance.privacy,
  'terms': instance.terms,
  'createdAt': instance.createdAt?.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
};
