// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PaymentModelAdapter extends TypeAdapter<PaymentModel> {
  @override
  final typeId = 20;

  @override
  PaymentModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PaymentModel(
      orderId: fields[0] == null ? null : fields[0] as String?,
      transactionId: fields[1] == null ? null : fields[1] as String?,
      method: fields[2] == null ? null : fields[2] as String?,
      status: fields[3] == null ? null : fields[3] as String?,
      paymentType: fields[4] == null ? null : fields[4] as String?,
      amount: (fields[5] as num).toInt(),
      remainingAmount: fields[6] == null ? 0 : (fields[6] as num).toInt(),
      phone: fields[7] == null ? null : fields[7] as String?,
      discount: fields[8] == null ? 0 : (fields[8] as num).toInt(),
      midtransRedirectUrl: fields[9] == null ? null : fields[9] as String?,
      fraudStatus: fields[10] == null ? null : fields[10] as String?,
      transactionTime: fields[11] == null ? null : fields[11] as String?,
      expiryTime: fields[12] == null ? null : fields[12] as String?,
      settlementTime: fields[13] == null ? null : fields[13] as String?,
      paidAt: fields[14] == null ? null : fields[14] as String?,
      vaNumbers:
          fields[15] == null
              ? []
              : (fields[15] as List?)?.cast<VANumberModel>(),
      permataVaNumber:
          fields[16] == null
              ? []
              : (fields[16] as List?)?.cast<VANumberModel>(),
      billKey: fields[17] == null ? null : fields[17] as String?,
      billerCode: fields[18] == null ? null : fields[18] as String?,
      pdfUrl: fields[19] == null ? null : fields[19] as String?,
      currency: fields[20] == null ? 'IDR' : fields[20] as String,
      merchantId: fields[21] == null ? null : fields[21] as String?,
      signatureKey: fields[22] == null ? null : fields[22] as String?,
      actions:
          fields[23] == null
              ? []
              : (fields[23] as List?)?.cast<PaymentActionModel>(),
      rawResponse:
          fields[24] == null
              ? {}
              : (fields[24] as Map?)?.cast<String, dynamic>(),
      createdAt: fields[25] as DateTime?,
      updatedAt: fields[26] as DateTime?,
      tenderedAmount: fields[27] == null ? null : (fields[27] as num?)?.toInt(),
      changeAmount: fields[28] == null ? null : (fields[28] as num?)?.toInt(),
      selectedPaymentType:
          fields[29] == null ? null : fields[29] as PaymentTypeModel?,
      selectedPaymentMethod:
          fields[30] == null ? null : fields[30] as PaymentMethodModel?,
    );
  }

  @override
  void write(BinaryWriter writer, PaymentModel obj) {
    writer
      ..writeByte(31)
      ..writeByte(0)
      ..write(obj.orderId)
      ..writeByte(1)
      ..write(obj.transactionId)
      ..writeByte(2)
      ..write(obj.method)
      ..writeByte(3)
      ..write(obj.status)
      ..writeByte(4)
      ..write(obj.paymentType)
      ..writeByte(5)
      ..write(obj.amount)
      ..writeByte(6)
      ..write(obj.remainingAmount)
      ..writeByte(7)
      ..write(obj.phone)
      ..writeByte(8)
      ..write(obj.discount)
      ..writeByte(9)
      ..write(obj.midtransRedirectUrl)
      ..writeByte(10)
      ..write(obj.fraudStatus)
      ..writeByte(11)
      ..write(obj.transactionTime)
      ..writeByte(12)
      ..write(obj.expiryTime)
      ..writeByte(13)
      ..write(obj.settlementTime)
      ..writeByte(14)
      ..write(obj.paidAt)
      ..writeByte(15)
      ..write(obj.vaNumbers)
      ..writeByte(16)
      ..write(obj.permataVaNumber)
      ..writeByte(17)
      ..write(obj.billKey)
      ..writeByte(18)
      ..write(obj.billerCode)
      ..writeByte(19)
      ..write(obj.pdfUrl)
      ..writeByte(20)
      ..write(obj.currency)
      ..writeByte(21)
      ..write(obj.merchantId)
      ..writeByte(22)
      ..write(obj.signatureKey)
      ..writeByte(23)
      ..write(obj.actions)
      ..writeByte(24)
      ..write(obj.rawResponse)
      ..writeByte(25)
      ..write(obj.createdAt)
      ..writeByte(26)
      ..write(obj.updatedAt)
      ..writeByte(27)
      ..write(obj.tenderedAmount)
      ..writeByte(28)
      ..write(obj.changeAmount)
      ..writeByte(29)
      ..write(obj.selectedPaymentType)
      ..writeByte(30)
      ..write(obj.selectedPaymentMethod);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PaymentModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_PaymentModel _$PaymentModelFromJson(Map<String, dynamic> json) =>
    _PaymentModel(
      orderId: json['order_id'] as String? ?? null,
      transactionId: json['transaction_id'] as String? ?? null,
      method: json['method'] as String? ?? null,
      status: json['status'] as String? ?? null,
      paymentType: json['paymentType'] as String? ?? null,
      amount: (json['amount'] as num).toInt(),
      remainingAmount: (json['remainingAmount'] as num?)?.toInt() ?? 0,
      phone: json['phone'] as String? ?? null,
      discount: (json['discount'] as num?)?.toInt() ?? 0,
      midtransRedirectUrl: json['midtransRedirectUrl'] as String? ?? null,
      fraudStatus: json['fraud_status'] as String? ?? null,
      transactionTime: json['transaction_time'] as String? ?? null,
      expiryTime: json['expiry_time'] as String? ?? null,
      settlementTime: json['settlement_time'] as String? ?? null,
      paidAt: json['paid_at'] as String? ?? null,
      vaNumbers:
          (json['va_numbers'] as List<dynamic>?)
              ?.map((e) => VANumberModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      permataVaNumber:
          (json['permata_va_number'] as List<dynamic>?)
              ?.map((e) => VANumberModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      billKey: json['bill_key'] as String? ?? null,
      billerCode: json['biller_code'] as String? ?? null,
      pdfUrl: json['pdf_url'] as String? ?? null,
      currency: json['currency'] as String? ?? "IDR",
      merchantId: json['merchant_id'] as String? ?? null,
      signatureKey: json['signature_key'] as String? ?? null,
      actions:
          (json['actions'] as List<dynamic>?)
              ?.map(
                (e) => PaymentActionModel.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const [],
      rawResponse: json['raw_response'] as Map<String, dynamic>? ?? const {},
      createdAt:
          json['createdAt'] == null
              ? null
              : DateTime.parse(json['createdAt'] as String),
      updatedAt:
          json['updatedAt'] == null
              ? null
              : DateTime.parse(json['updatedAt'] as String),
      tenderedAmount: (json['tendered_amount'] as num?)?.toInt() ?? null,
      changeAmount: (json['change_amount'] as num?)?.toInt() ?? null,
      selectedPaymentType:
          json['selectedPaymentType'] == null
              ? null
              : PaymentTypeModel.fromJson(
                json['selectedPaymentType'] as Map<String, dynamic>,
              ),
      selectedPaymentMethod:
          json['selectedPaymentMethod'] == null
              ? null
              : PaymentMethodModel.fromJson(
                json['selectedPaymentMethod'] as Map<String, dynamic>,
              ),
    );

Map<String, dynamic> _$PaymentModelToJson(_PaymentModel instance) =>
    <String, dynamic>{
      'order_id': instance.orderId,
      'transaction_id': instance.transactionId,
      'method': instance.method,
      'status': instance.status,
      'paymentType': instance.paymentType,
      'amount': instance.amount,
      'remainingAmount': instance.remainingAmount,
      'phone': instance.phone,
      'discount': instance.discount,
      'midtransRedirectUrl': instance.midtransRedirectUrl,
      'fraud_status': instance.fraudStatus,
      'transaction_time': instance.transactionTime,
      'expiry_time': instance.expiryTime,
      'settlement_time': instance.settlementTime,
      'paid_at': instance.paidAt,
      'va_numbers': instance.vaNumbers?.map((e) => e.toJson()).toList(),
      'permata_va_number':
          instance.permataVaNumber?.map((e) => e.toJson()).toList(),
      'bill_key': instance.billKey,
      'biller_code': instance.billerCode,
      'pdf_url': instance.pdfUrl,
      'currency': instance.currency,
      'merchant_id': instance.merchantId,
      'signature_key': instance.signatureKey,
      'actions': instance.actions?.map((e) => e.toJson()).toList(),
      'raw_response': instance.rawResponse,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'tendered_amount': instance.tenderedAmount,
      'change_amount': instance.changeAmount,
      'selectedPaymentType': instance.selectedPaymentType?.toJson(),
      'selectedPaymentMethod': instance.selectedPaymentMethod?.toJson(),
    };
