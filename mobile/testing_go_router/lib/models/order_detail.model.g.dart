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
      orderId: fields[0] == null ? null : fields[0] as String?,
      userId: fields[1] as String?,
      user: fields[2] == null ? null : fields[2] as String?,
      cashier: fields[3] == null ? null : fields[3] as CashierModel?,
      items:
          fields[4] == null ? [] : (fields[4] as List).cast<OrderItemModel>(),
      status:
          fields[5] == null ? OrderStatus.unknown : fields[5] as OrderStatus,
      paymentMethod: fields[6] == null ? null : fields[6] as String?,
      orderType: fields[7] as OrderType,
      deliveryAddress: fields[8] == null ? '' : fields[8] as String,
      tableNumber: fields[9] == null ? '' : fields[9] as String?,
      type:
          fields[10] == null ? LocationType.indoor : fields[10] as LocationType,
      outlet: fields[11] as String?,
      discounts: fields[12] as DiscountModel?,
      appliedPromos:
          fields[13] == null
              ? []
              : (fields[13] as List?)?.cast<AppliedPromosModel>(),
      appliedManualPromo: fields[14] == null ? null : fields[14] as String?,
      appliedVoucher: fields[15] == null ? null : fields[15] as String?,
      taxAndServiceDetails:
          fields[16] == null
              ? []
              : (fields[16] as List).cast<TaxServiceDetailModel>(),
      totalTax: fields[17] == null ? 0 : (fields[17] as num).toInt(),
      totalServiceFee: fields[18] == null ? 0 : (fields[18] as num).toInt(),
      totalBeforeDiscount: fields[19] == null ? 0 : (fields[19] as num).toInt(),
      totalAfterDiscount: fields[20] == null ? 0 : (fields[20] as num).toInt(),
      grandTotal: fields[21] == null ? 0 : (fields[21] as num).toInt(),
      source: fields[22] == null ? null : fields[22] as String?,
      createdAt: fields[23] as DateTime?,
      updatedAt: fields[24] as DateTime?,
      payments:
          fields[25] == null ? [] : (fields[25] as List).cast<PaymentModel>(),
      paymentStatus: fields[26] == null ? null : fields[26] as String?,
      id: fields[27] == null ? null : fields[27] as String?,
      isOpenBill: fields[28] == null ? false : fields[28] as bool,
      paymentAmount: fields[29] == null ? 0 : (fields[29] as num).toInt(),
      changeAmount: fields[30] == null ? 0 : (fields[30] as num).toInt(),
      paymentType: fields[31] == null ? null : fields[31] as String?,
      isSplitPayment: fields[32] == null ? false : fields[32] as bool,
      printSequence: fields[33] == null ? 0 : (fields[33] as num).toInt(),
      printHistory:
          fields[34] == null ? [] : (fields[34] as List).cast<String>(),
      customAmountItems:
          fields[35] == null
              ? null
              : (fields[35] as List?)?.cast<CustomAmountItemsModel>(),
      totalCustomAmount: fields[36] == null ? 0 : (fields[36] as num).toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, OrderDetailModel obj) {
    writer
      ..writeByte(37)
      ..writeByte(0)
      ..write(obj.orderId)
      ..writeByte(1)
      ..write(obj.userId)
      ..writeByte(2)
      ..write(obj.user)
      ..writeByte(3)
      ..write(obj.cashier)
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
      ..write(obj.payments)
      ..writeByte(26)
      ..write(obj.paymentStatus)
      ..writeByte(27)
      ..write(obj.id)
      ..writeByte(28)
      ..write(obj.isOpenBill)
      ..writeByte(29)
      ..write(obj.paymentAmount)
      ..writeByte(30)
      ..write(obj.changeAmount)
      ..writeByte(31)
      ..write(obj.paymentType)
      ..writeByte(32)
      ..write(obj.isSplitPayment)
      ..writeByte(33)
      ..write(obj.printSequence)
      ..writeByte(34)
      ..write(obj.printHistory)
      ..writeByte(35)
      ..write(obj.customAmountItems)
      ..writeByte(36)
      ..write(obj.totalCustomAmount);
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
  orderId: json['order_id'] as String? ?? null,
  userId: json['user_id'] as String?,
  user: json['user'] as String? ?? null,
  cashier:
      json['cashier'] == null
          ? null
          : CashierModel.fromJson(json['cashier'] as Map<String, dynamic>),
  items:
      (json['items'] as List<dynamic>?)
          ?.map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  status:
      json['status'] == null
          ? OrderStatus.unknown
          : OrderStatusExtension.fromString(json['status'] as String),
  paymentMethod: json['paymentMethod'] as String? ?? null,
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
          ?.map((e) => AppliedPromosModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  appliedManualPromo: json['appliedManualPromo'] as String? ?? null,
  appliedVoucher: json['appliedVoucher'] as String? ?? null,
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
  source: json['source'] as String? ?? null,
  createdAt:
      json['createdAtWIB'] == null
          ? null
          : DateTime.parse(json['createdAtWIB'] as String),
  updatedAt:
      json['updatedAtWIB'] == null
          ? null
          : DateTime.parse(json['updatedAtWIB'] as String),
  payments:
      (json['payment_details'] as List<dynamic>?)
          ?.map((e) => PaymentModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const <PaymentModel>[],
  paymentStatus: json['paymentStatus'] as String? ?? null,
  id: json['_id'] as String? ?? null,
  isOpenBill: json['isOpenBill'] as bool? ?? false,
  paymentAmount: (json['paymentAmount'] as num?)?.toInt() ?? 0,
  changeAmount: (json['changeAmount'] as num?)?.toInt() ?? 0,
  paymentType: json['paymentType'] as String? ?? null,
  isSplitPayment: json['isSplitPayment'] as bool? ?? false,
  printSequence: (json['printSequence'] as num?)?.toInt() ?? 0,
  printHistory:
      (json['printHistory'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const [],
  customAmountItems:
      (json['customAmountItems'] as List<dynamic>?)
          ?.map(
            (e) => CustomAmountItemsModel.fromJson(e as Map<String, dynamic>),
          )
          .toList() ??
      null,
  totalCustomAmount: (json['totalCustomAmount'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$OrderDetailModelToJson(_OrderDetailModel instance) =>
    <String, dynamic>{
      'order_id': instance.orderId,
      'user_id': instance.userId,
      'user': instance.user,
      'cashier': instance.cashier,
      'items': instance.items,
      'status': OrderStatusExtension.orderStatusToJson(instance.status),
      'paymentMethod': instance.paymentMethod,
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
      'createdAtWIB': instance.createdAt?.toIso8601String(),
      'updatedAtWIB': instance.updatedAt?.toIso8601String(),
      'payment_details': instance.payments,
      'paymentStatus': instance.paymentStatus,
      '_id': instance.id,
      'isOpenBill': instance.isOpenBill,
      'paymentAmount': instance.paymentAmount,
      'changeAmount': instance.changeAmount,
      'paymentType': instance.paymentType,
      'isSplitPayment': instance.isSplitPayment,
      'printSequence': instance.printSequence,
      'printHistory': instance.printHistory,
      'customAmountItems': instance.customAmountItems,
      'totalCustomAmount': instance.totalCustomAmount,
    };
