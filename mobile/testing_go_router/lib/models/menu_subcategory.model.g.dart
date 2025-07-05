// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'menu_subcategory.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class MenuSubCategoryModelAdapter extends TypeAdapter<MenuSubCategoryModel> {
  @override
  final typeId = 16;

  @override
  MenuSubCategoryModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return MenuSubCategoryModel(
      id: fields[0] as String,
      name: fields[1] as String,
    );
  }

  @override
  void write(BinaryWriter writer, MenuSubCategoryModel obj) {
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
      other is MenuSubCategoryModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_MenuSubCategoryModel _$MenuSubCategoryModelFromJson(
  Map<String, dynamic> json,
) => _MenuSubCategoryModel(
  id: json['_id'] as String,
  name: json['name'] as String,
);

Map<String, dynamic> _$MenuSubCategoryModelToJson(
  _MenuSubCategoryModel instance,
) => <String, dynamic>{'_id': instance.id, 'name': instance.name};
