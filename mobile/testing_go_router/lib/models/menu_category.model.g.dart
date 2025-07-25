// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'menu_category.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class MenuCategoryModelAdapter extends TypeAdapter<MenuCategoryModel> {
  @override
  final typeId = 15;

  @override
  MenuCategoryModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return MenuCategoryModel(
      id: fields[0] as String,
      name: fields[1] as String,
    );
  }

  @override
  void write(BinaryWriter writer, MenuCategoryModel obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MenuCategoryModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_MenuCategoryModel _$MenuCategoryModelFromJson(Map<String, dynamic> json) =>
    _MenuCategoryModel(id: json['_id'] as String, name: json['name'] as String);

Map<String, dynamic> _$MenuCategoryModelToJson(_MenuCategoryModel instance) =>
    <String, dynamic>{'_id': instance.id, 'name': instance.name};
