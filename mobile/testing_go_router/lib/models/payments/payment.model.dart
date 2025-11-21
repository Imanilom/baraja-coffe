// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/payments/payment_action.model.dart';
import 'package:kasirbaraja/models/payments/va_number.model.dart';

part 'payment.model.freezed.dart';
part 'payment.model.g.dart';

@freezed
@HiveType(typeId: 20) // Pastikan typeId unik
abstract class PaymentModel with _$PaymentModel {
  @JsonSerializable(explicitToJson: true)
  factory PaymentModel({
    // Basic payment info
    @HiveField(0) @Default(null) @JsonKey(name: 'order_id') String? orderId,
    @HiveField(1)
    @Default(null)
    @JsonKey(name: 'transaction_id')
    String? transactionId,
    @HiveField(2) @Default(null) String? method,
    @HiveField(3) @Default(null) String? status,
    @HiveField(4) @Default(null) String? paymentType,
    @HiveField(5) required int amount,
    @HiveField(6) @Default(0) int remainingAmount,
    @HiveField(7) @Default(null) String? phone,
    @HiveField(8) @Default(0) int discount,
    @HiveField(9) @Default(null) String? midtransRedirectUrl,
    @HiveField(10)
    @JsonKey(name: 'fraud_status')
    @Default(null)
    String? fraudStatus,
    @HiveField(11)
    @JsonKey(name: 'transaction_time')
    @Default(null)
    String? transactionTime,
    @HiveField(12)
    @JsonKey(name: 'expiry_time')
    @Default(null)
    String? expiryTime,
    @HiveField(13)
    @JsonKey(name: 'settlement_time')
    @Default(null)
    String? settlementTime,
    @HiveField(14) @JsonKey(name: 'paid_at') @Default(null) String? paidAt,
    // Virtual account numbers
    @HiveField(15)
    @JsonKey(name: 'va_numbers')
    @Default([])
    List<VANumberModel>? vaNumbers,

    @HiveField(16)
    @JsonKey(name: 'permata_va_number')
    @Default([])
    List<VANumberModel>? permataVaNumber,

    @HiveField(17) @JsonKey(name: 'bill_key') @Default(null) String? billKey,

    @HiveField(18)
    @JsonKey(name: 'biller_code')
    @Default(null)
    String? billerCode,

    @HiveField(19) @JsonKey(name: 'pdf_url') @Default(null) String? pdfUrl,

    @HiveField(20) @Default("IDR") String currency,

    @HiveField(21)
    @JsonKey(name: 'merchant_id')
    @Default(null)
    String? merchantId,

    @HiveField(22)
    @JsonKey(name: 'signature_key')
    @Default(null)
    String? signatureKey,

    // Payment actions
    @HiveField(23) @Default([]) List<PaymentActionModel>? actions,

    // Raw response
    @HiveField(24)
    @JsonKey(name: 'raw_response')
    @Default({})
    Map<String, dynamic>? rawResponse,

    // Timestamps
    @HiveField(25) DateTime? createdAt,
    @HiveField(26) DateTime? updatedAt,
    //untuk kasir
    @HiveField(27)
    @JsonKey(name: 'tendered_amount')
    @Default(null)
    int? tenderedAmount,
    @HiveField(28)
    @JsonKey(name: 'change_amount')
    @Default(null)
    int? changeAmount,
  }) = _PaymentModel;

  factory PaymentModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentModelFromJson(json);
}
