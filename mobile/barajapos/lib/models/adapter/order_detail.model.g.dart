// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order_detail.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OrderDetailModelAdapter extends TypeAdapter<OrderDetailModel> {
  @override
  final int typeId = 7;

  @override
  OrderDetailModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OrderDetailModel(
      customerId: fields[0] as String?,
      customerName: fields[1] as String?,
      cashierId: fields[2] as String?,
      phoneNumber: fields[3] as String?,
      items: (fields[4] as List).cast<OrderItemModel>(),
      orderType: fields[5] as String,
      deliveryAddress: fields[6] as String?,
      tableNumber: (fields[7] as num?)?.toInt(),
      paymentMethod: fields[8] as String?,
      status: fields[9] as String?,
      totalPrice: (fields[10] as num?)?.toDouble(),
    );
  }

  @override
  void write(BinaryWriter writer, OrderDetailModel obj) {
    writer
      ..writeByte(11)
      ..writeByte(0)
      ..write(obj.customerId)
      ..writeByte(1)
      ..write(obj.customerName)
      ..writeByte(2)
      ..write(obj.cashierId)
      ..writeByte(3)
      ..write(obj.phoneNumber)
      ..writeByte(4)
      ..write(obj.items)
      ..writeByte(5)
      ..write(obj.orderType)
      ..writeByte(6)
      ..write(obj.deliveryAddress)
      ..writeByte(7)
      ..write(obj.tableNumber)
      ..writeByte(8)
      ..write(obj.paymentMethod)
      ..writeByte(9)
      ..write(obj.status)
      ..writeByte(10)
      ..write(obj.totalPrice);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrderDetailModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
