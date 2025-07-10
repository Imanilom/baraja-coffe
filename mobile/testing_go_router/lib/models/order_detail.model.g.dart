// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order_detail.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OrderDetailModelAdapter extends TypeAdapter<OrderDetailModel> {
  @override
  final typeId = 5;

  @override
  OrderDetailModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OrderDetailModel(
      customerId: fields[0] == null ? '' : fields[0] as String?,
      customerName: fields[1] == null ? '' : fields[1] as String?,
      cashierId: fields[2] == null ? '' : fields[2] as String?,
      phoneNumber: fields[3] == null ? '' : fields[3] as String?,
      items:
          fields[4] == null ? [] : (fields[4] as List).cast<OrderItemModel>(),
      orderType: fields[5] as String,
      deliveryAddress: fields[6] == null ? '' : fields[6] as String?,
      tableNumber: fields[7] == null ? '' : fields[7] as String?,
      paymentMethod: fields[8] == null ? '' : fields[8] as String?,
      status: fields[9] == null ? '' : fields[9] as String?,
      subTotalPrice: fields[10] == null ? 0 : (fields[10] as num?)?.toInt(),
      orderId: fields[11] == null ? '' : fields[11] as String?,
      tax: fields[12] == null ? 0 : (fields[12] as num?)?.toInt(),
      totalPrice: fields[13] == null ? 0 : (fields[13] as num?)?.toInt(),
      serviceFee: fields[14] == null ? 0 : (fields[14] as num?)?.toInt(),
      discounts:
          fields[15] == null ? [] : (fields[15] as Map?)?.cast<String, int>(),
    );
  }

  @override
  void write(BinaryWriter writer, OrderDetailModel obj) {
    writer
      ..writeByte(16)
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
      ..write(obj.subTotalPrice)
      ..writeByte(11)
      ..write(obj.orderId)
      ..writeByte(12)
      ..write(obj.tax)
      ..writeByte(13)
      ..write(obj.totalPrice)
      ..writeByte(14)
      ..write(obj.serviceFee)
      ..writeByte(15)
      ..write(obj.discounts);
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

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_OrderDetailModel _$OrderDetailModelFromJson(Map<String, dynamic> json) =>
    _OrderDetailModel(
      customerId: json['userId'] as String? ?? "",
      customerName: json['customerName'] as String? ?? "",
      cashierId: json['cashierId'] as String? ?? "",
      phoneNumber: json['phoneNumber'] as String? ?? "",
      items:
          (json['items'] as List<dynamic>?)
              ?.map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      orderType: json['orderType'] as String,
      deliveryAddress: json['deliveryAddress'] as String? ?? "",
      tableNumber: json['tableNumber'] as String? ?? "",
      paymentMethod: json['paymentMethod'] as String? ?? "",
      status: json['status'] as String? ?? "",
      subTotalPrice: (json['subTotalPrice'] as num?)?.toInt() ?? 0,
      orderId: json['order_id'] as String? ?? "",
      tax: (json['tax'] as num?)?.toInt() ?? 0,
      totalPrice: (json['totalPrice'] as num?)?.toInt() ?? 0,
      serviceFee: (json['serviceFee'] as num?)?.toInt() ?? 0,
      discounts:
          (json['discounts'] as Map<String, dynamic>?)?.map(
            (k, e) => MapEntry(k, (e as num).toInt()),
          ) ??
          const [],
    );

Map<String, dynamic> _$OrderDetailModelToJson(_OrderDetailModel instance) =>
    <String, dynamic>{
      'userId': instance.customerId,
      'customerName': instance.customerName,
      'cashierId': instance.cashierId,
      'phoneNumber': instance.phoneNumber,
      'items': instance.items,
      'orderType': instance.orderType,
      'deliveryAddress': instance.deliveryAddress,
      'tableNumber': instance.tableNumber,
      'paymentMethod': instance.paymentMethod,
      'status': instance.status,
      'subTotalPrice': instance.subTotalPrice,
      'order_id': instance.orderId,
      'tax': instance.tax,
      'totalPrice': instance.totalPrice,
      'serviceFee': instance.serviceFee,
      'discounts': instance.discounts,
    };
