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
      orderId: fields[0] == null ? '' : fields[0] as String?,
      userId: fields[1] as String?,
      user: fields[2] == null ? '' : fields[2] as String,
      cashierId: fields[3] == null ? '' : fields[3] as String?,
      items:
          fields[4] == null ? [] : (fields[4] as List).cast<OrderItemModel>(),
      status:
          fields[5] == null ? OrderStatus.unknown : fields[5] as OrderStatus,
      paymentMethod: fields[6] as PaymentMethod?,
      orderType: fields[7] as OrderType,
      deliveryAddress: fields[8] == null ? '' : fields[8] as String,
      tableNumber: fields[9] == null ? '' : fields[9] as String?,
      type:
          fields[10] == null ? LocationType.indoor : fields[10] as LocationType,
      outlet: fields[11] as String?,
      discounts: fields[12] as DiscountModel?,
      appliedPromos: (fields[13] as List?)?.cast<String>(),
      appliedManualPromo: fields[14] as String?,
      appliedVoucher: fields[15] as String?,
      taxAndServiceDetails:
          fields[16] == null
              ? []
              : (fields[16] as List).cast<TaxServiceDetailModel>(),
      totalTax: fields[17] == null ? 0 : (fields[17] as num).toInt(),
      totalServiceFee: fields[18] == null ? 0 : (fields[18] as num).toInt(),
      totalBeforeDiscount: fields[19] == null ? 0 : (fields[19] as num).toInt(),
      totalAfterDiscount: fields[20] == null ? 0 : (fields[20] as num).toInt(),
      grandTotal: fields[21] == null ? 0 : (fields[21] as num).toInt(),
      source: fields[22] == null ? 'Cashier' : fields[22] as String,
      createdAt: fields[23] as DateTime?,
      updatedAt: fields[24] as DateTime?,
      payment: fields[25] == null ? null : fields[25] as PaymentModel?,
    );
  }

  @override
  void write(BinaryWriter writer, OrderDetailModel obj) {
    writer
      ..writeByte(26)
      ..writeByte(0)
      ..write(obj.orderId)
      ..writeByte(1)
      ..write(obj.userId)
      ..writeByte(2)
      ..write(obj.user)
      ..writeByte(3)
      ..write(obj.cashierId)
      ..writeByte(4)
      ..write(obj.items)
      ..writeByte(5)
      ..write(obj.status)
      ..writeByte(6)
      ..write(obj.paymentMethod)
      ..writeByte(7)
      ..write(obj.orderType)
      ..writeByte(8)
      ..write(obj.deliveryAddress)
      ..writeByte(9)
      ..write(obj.tableNumber)
      ..writeByte(10)
      ..write(obj.type)
      ..writeByte(11)
      ..write(obj.outlet)
      ..writeByte(12)
      ..write(obj.discounts)
      ..writeByte(13)
      ..write(obj.appliedPromos)
      ..writeByte(14)
      ..write(obj.appliedManualPromo)
      ..writeByte(15)
      ..write(obj.appliedVoucher)
      ..writeByte(16)
      ..write(obj.taxAndServiceDetails)
      ..writeByte(17)
      ..write(obj.totalTax)
      ..writeByte(18)
      ..write(obj.totalServiceFee)
      ..writeByte(19)
      ..write(obj.totalBeforeDiscount)
      ..writeByte(20)
      ..write(obj.totalAfterDiscount)
      ..writeByte(21)
      ..write(obj.grandTotal)
      ..writeByte(22)
      ..write(obj.source)
      ..writeByte(23)
      ..write(obj.createdAt)
      ..writeByte(24)
      ..write(obj.updatedAt)
      ..writeByte(25)
      ..write(obj.payment);
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

_OrderDetailModel _$OrderDetailModelFromJson(
  Map<String, dynamic> json,
) => _OrderDetailModel(
  orderId: json['order_id'] as String? ?? "",
  userId: json['user_id'] as String?,
  user: json['user'] as String? ?? '',
  cashierId: json['cashierId'] as String? ?? "",
  items:
      (json['items'] as List<dynamic>?)
          ?.map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  status:
      json['status'] == null
          ? OrderStatus.unknown
          : OrderStatusExtension.fromString(json['status'] as String),
  paymentMethod: PaymentMethodExtension.fromString(
    json['paymentMethod'] as String,
  ),
  orderType: OrderTypeExtension.fromString(json['orderType'] as String),
  deliveryAddress: json['deliveryAddress'] as String? ?? '',
  tableNumber: json['tableNumber'] as String? ?? '',
  type:
      json['type'] == null
          ? LocationType.indoor
          : LocationTypeExtension.fromString(json['type'] as String),
  outlet: json['outlet'] as String?,
  discounts:
      json['discounts'] == null
          ? null
          : DiscountModel.fromJson(json['discounts'] as Map<String, dynamic>),
  appliedPromos:
      (json['appliedPromos'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
  appliedManualPromo: json['appliedManualPromo'] as String?,
  appliedVoucher: json['appliedVoucher'] as String?,
  taxAndServiceDetails:
      (json['taxAndServiceDetails'] as List<dynamic>?)
          ?.map(
            (e) => TaxServiceDetailModel.fromJson(e as Map<String, dynamic>),
          )
          .toList() ??
      const [],
  totalTax: (json['totalTax'] as num?)?.toInt() ?? 0,
  totalServiceFee: (json['totalServiceFee'] as num?)?.toInt() ?? 0,
  totalBeforeDiscount: (json['totalBeforeDiscount'] as num?)?.toInt() ?? 0,
  totalAfterDiscount: (json['totalAfterDiscount'] as num?)?.toInt() ?? 0,
  grandTotal: (json['grandTotal'] as num?)?.toInt() ?? 0,
  source: json['source'] as String? ?? 'Cashier',
  createdAt:
      json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
  updatedAt:
      json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
  payment:
      json['payment_details'] == null
          ? null
          : PaymentModel.fromJson(
            json['payment_details'] as Map<String, dynamic>,
          ),
);

Map<String, dynamic> _$OrderDetailModelToJson(_OrderDetailModel instance) =>
    <String, dynamic>{
      'order_id': instance.orderId,
      'user_id': instance.userId,
      'user': instance.user,
      'cashierId': instance.cashierId,
      'items': instance.items,
      'status': OrderStatusExtension.orderStatusToJson(instance.status),
      'paymentMethod': PaymentMethodExtension.paymentMethodToJson(
        instance.paymentMethod,
      ),
      'orderType': OrderTypeExtension.orderTypeToJson(instance.orderType),
      'deliveryAddress': instance.deliveryAddress,
      'tableNumber': instance.tableNumber,
      'type': LocationTypeExtension.locationTypeToJson(instance.type),
      'outlet': instance.outlet,
      'discounts': instance.discounts,
      'appliedPromos': instance.appliedPromos,
      'appliedManualPromo': instance.appliedManualPromo,
      'appliedVoucher': instance.appliedVoucher,
      'taxAndServiceDetails': instance.taxAndServiceDetails,
      'totalTax': instance.totalTax,
      'totalServiceFee': instance.totalServiceFee,
      'totalBeforeDiscount': instance.totalBeforeDiscount,
      'totalAfterDiscount': instance.totalAfterDiscount,
      'grandTotal': instance.grandTotal,
      'source': instance.source,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'payment_details': instance.payment,
    };
