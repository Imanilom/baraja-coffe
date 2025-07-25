// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class UserModelAdapter extends TypeAdapter<UserModel> {
  @override
  final typeId = 6;

  @override
  UserModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return UserModel(
      id: fields[0] as String,
      username: fields[1] as String,
      email: fields[2] as String,
      phone: fields[3] as String,
      profilePicture: fields[4] as String,
      role: fields[5] as String,
      token: fields[6] as String,
      cashiers: (fields[7] as List?)?.cast<CashierModel>(),
      outletId: fields[8] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, UserModel obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.username)
      ..writeByte(2)
      ..write(obj.email)
      ..writeByte(3)
      ..write(obj.phone)
      ..writeByte(4)
      ..write(obj.profilePicture)
      ..writeByte(5)
      ..write(obj.role)
      ..writeByte(6)
      ..write(obj.token)
      ..writeByte(7)
      ..write(obj.cashiers)
      ..writeByte(8)
      ..write(obj.outletId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
