// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cashier.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class CashierModelAdapter extends TypeAdapter<CashierModel> {
  @override
  final int typeId = 5;

  @override
  CashierModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return CashierModel(
      id: fields[0] as String?,
      username: fields[1] as String?,
      role: fields[2] as String?,
      cashierType: fields[3] as String?,
      password: fields[4] as String?,
      profilePicture: fields[5] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, CashierModel obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.username)
      ..writeByte(2)
      ..write(obj.role)
      ..writeByte(3)
      ..write(obj.cashierType)
      ..writeByte(4)
      ..write(obj.password)
      ..writeByte(5)
      ..write(obj.profilePicture);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CashierModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
