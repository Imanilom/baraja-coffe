// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'payment.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PaymentModel {

// Basic payment info
@HiveField(0)@JsonKey(name: 'order_id') String? get orderId;@HiveField(1)@JsonKey(name: 'transaction_id') String? get transactionId;@HiveField(2) String? get method;@HiveField(3) String? get status;@HiveField(4) String? get paymentType;@HiveField(5) int get amount;@HiveField(6) int get remainingAmount;@HiveField(7) String? get phone;@HiveField(8) int get discount;@HiveField(9) String? get midtransRedirectUrl;@HiveField(10)@JsonKey(name: 'fraud_status') String? get fraudStatus;@HiveField(11)@JsonKey(name: 'transaction_time') String? get transactionTime;@HiveField(12)@JsonKey(name: 'expiry_time') String? get expiryTime;@HiveField(13)@JsonKey(name: 'settlement_time') String? get settlementTime;@HiveField(14)@JsonKey(name: 'paid_at') String? get paidAt;// Virtual account nu,mbers
@HiveField(15)@JsonKey(name: 'va_numbers') List<VANumberModel>? get vaNumbers;@HiveField(16)@JsonKey(name: 'permata_va_number') String? get permataVaNumber;@HiveField(17)@JsonKey(name: 'bill_key') String? get billKey;@HiveField(18)@JsonKey(name: 'biller_code') String? get billerCode;@HiveField(19)@JsonKey(name: 'pdf_url') String? get pdfUrl;@HiveField(20) String get currency;@HiveField(21)@JsonKey(name: 'merchant_id') String? get merchantId;@HiveField(22)@JsonKey(name: 'signature_key') String? get signatureKey;// Payment actions
@HiveField(23) List<PaymentActionModel>? get actions;// Raw response
@HiveField(24)@JsonKey(name: 'raw_response') Map<String, dynamic>? get rawResponse;// Timestamps
@HiveField(25) DateTime? get createdAt;@HiveField(26) DateTime? get updatedAt;
/// Create a copy of PaymentModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaymentModelCopyWith<PaymentModel> get copyWith => _$PaymentModelCopyWithImpl<PaymentModel>(this as PaymentModel, _$identity);

  /// Serializes this PaymentModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaymentModel&&(identical(other.orderId, orderId) || other.orderId == orderId)&&(identical(other.transactionId, transactionId) || other.transactionId == transactionId)&&(identical(other.method, method) || other.method == method)&&(identical(other.status, status) || other.status == status)&&(identical(other.paymentType, paymentType) || other.paymentType == paymentType)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.remainingAmount, remainingAmount) || other.remainingAmount == remainingAmount)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.discount, discount) || other.discount == discount)&&(identical(other.midtransRedirectUrl, midtransRedirectUrl) || other.midtransRedirectUrl == midtransRedirectUrl)&&(identical(other.fraudStatus, fraudStatus) || other.fraudStatus == fraudStatus)&&(identical(other.transactionTime, transactionTime) || other.transactionTime == transactionTime)&&(identical(other.expiryTime, expiryTime) || other.expiryTime == expiryTime)&&(identical(other.settlementTime, settlementTime) || other.settlementTime == settlementTime)&&(identical(other.paidAt, paidAt) || other.paidAt == paidAt)&&const DeepCollectionEquality().equals(other.vaNumbers, vaNumbers)&&(identical(other.permataVaNumber, permataVaNumber) || other.permataVaNumber == permataVaNumber)&&(identical(other.billKey, billKey) || other.billKey == billKey)&&(identical(other.billerCode, billerCode) || other.billerCode == billerCode)&&(identical(other.pdfUrl, pdfUrl) || other.pdfUrl == pdfUrl)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.merchantId, merchantId) || other.merchantId == merchantId)&&(identical(other.signatureKey, signatureKey) || other.signatureKey == signatureKey)&&const DeepCollectionEquality().equals(other.actions, actions)&&const DeepCollectionEquality().equals(other.rawResponse, rawResponse)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,orderId,transactionId,method,status,paymentType,amount,remainingAmount,phone,discount,midtransRedirectUrl,fraudStatus,transactionTime,expiryTime,settlementTime,paidAt,const DeepCollectionEquality().hash(vaNumbers),permataVaNumber,billKey,billerCode,pdfUrl,currency,merchantId,signatureKey,const DeepCollectionEquality().hash(actions),const DeepCollectionEquality().hash(rawResponse),createdAt,updatedAt]);

@override
String toString() {
  return 'PaymentModel(orderId: $orderId, transactionId: $transactionId, method: $method, status: $status, paymentType: $paymentType, amount: $amount, remainingAmount: $remainingAmount, phone: $phone, discount: $discount, midtransRedirectUrl: $midtransRedirectUrl, fraudStatus: $fraudStatus, transactionTime: $transactionTime, expiryTime: $expiryTime, settlementTime: $settlementTime, paidAt: $paidAt, vaNumbers: $vaNumbers, permataVaNumber: $permataVaNumber, billKey: $billKey, billerCode: $billerCode, pdfUrl: $pdfUrl, currency: $currency, merchantId: $merchantId, signatureKey: $signatureKey, actions: $actions, rawResponse: $rawResponse, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $PaymentModelCopyWith<$Res>  {
  factory $PaymentModelCopyWith(PaymentModel value, $Res Function(PaymentModel) _then) = _$PaymentModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: 'order_id') String? orderId,@HiveField(1)@JsonKey(name: 'transaction_id') String? transactionId,@HiveField(2) String? method,@HiveField(3) String? status,@HiveField(4) String? paymentType,@HiveField(5) int amount,@HiveField(6) int remainingAmount,@HiveField(7) String? phone,@HiveField(8) int discount,@HiveField(9) String? midtransRedirectUrl,@HiveField(10)@JsonKey(name: 'fraud_status') String? fraudStatus,@HiveField(11)@JsonKey(name: 'transaction_time') String? transactionTime,@HiveField(12)@JsonKey(name: 'expiry_time') String? expiryTime,@HiveField(13)@JsonKey(name: 'settlement_time') String? settlementTime,@HiveField(14)@JsonKey(name: 'paid_at') String? paidAt,@HiveField(15)@JsonKey(name: 'va_numbers') List<VANumberModel>? vaNumbers,@HiveField(16)@JsonKey(name: 'permata_va_number') String? permataVaNumber,@HiveField(17)@JsonKey(name: 'bill_key') String? billKey,@HiveField(18)@JsonKey(name: 'biller_code') String? billerCode,@HiveField(19)@JsonKey(name: 'pdf_url') String? pdfUrl,@HiveField(20) String currency,@HiveField(21)@JsonKey(name: 'merchant_id') String? merchantId,@HiveField(22)@JsonKey(name: 'signature_key') String? signatureKey,@HiveField(23) List<PaymentActionModel>? actions,@HiveField(24)@JsonKey(name: 'raw_response') Map<String, dynamic>? rawResponse,@HiveField(25) DateTime? createdAt,@HiveField(26) DateTime? updatedAt
});




}
/// @nodoc
class _$PaymentModelCopyWithImpl<$Res>
    implements $PaymentModelCopyWith<$Res> {
  _$PaymentModelCopyWithImpl(this._self, this._then);

  final PaymentModel _self;
  final $Res Function(PaymentModel) _then;

/// Create a copy of PaymentModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? orderId = freezed,Object? transactionId = freezed,Object? method = freezed,Object? status = freezed,Object? paymentType = freezed,Object? amount = null,Object? remainingAmount = null,Object? phone = freezed,Object? discount = null,Object? midtransRedirectUrl = freezed,Object? fraudStatus = freezed,Object? transactionTime = freezed,Object? expiryTime = freezed,Object? settlementTime = freezed,Object? paidAt = freezed,Object? vaNumbers = freezed,Object? permataVaNumber = freezed,Object? billKey = freezed,Object? billerCode = freezed,Object? pdfUrl = freezed,Object? currency = null,Object? merchantId = freezed,Object? signatureKey = freezed,Object? actions = freezed,Object? rawResponse = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,}) {
  return _then(_self.copyWith(
orderId: freezed == orderId ? _self.orderId : orderId // ignore: cast_nullable_to_non_nullable
as String?,transactionId: freezed == transactionId ? _self.transactionId : transactionId // ignore: cast_nullable_to_non_nullable
as String?,method: freezed == method ? _self.method : method // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,paymentType: freezed == paymentType ? _self.paymentType : paymentType // ignore: cast_nullable_to_non_nullable
as String?,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,remainingAmount: null == remainingAmount ? _self.remainingAmount : remainingAmount // ignore: cast_nullable_to_non_nullable
as int,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,discount: null == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int,midtransRedirectUrl: freezed == midtransRedirectUrl ? _self.midtransRedirectUrl : midtransRedirectUrl // ignore: cast_nullable_to_non_nullable
as String?,fraudStatus: freezed == fraudStatus ? _self.fraudStatus : fraudStatus // ignore: cast_nullable_to_non_nullable
as String?,transactionTime: freezed == transactionTime ? _self.transactionTime : transactionTime // ignore: cast_nullable_to_non_nullable
as String?,expiryTime: freezed == expiryTime ? _self.expiryTime : expiryTime // ignore: cast_nullable_to_non_nullable
as String?,settlementTime: freezed == settlementTime ? _self.settlementTime : settlementTime // ignore: cast_nullable_to_non_nullable
as String?,paidAt: freezed == paidAt ? _self.paidAt : paidAt // ignore: cast_nullable_to_non_nullable
as String?,vaNumbers: freezed == vaNumbers ? _self.vaNumbers : vaNumbers // ignore: cast_nullable_to_non_nullable
as List<VANumberModel>?,permataVaNumber: freezed == permataVaNumber ? _self.permataVaNumber : permataVaNumber // ignore: cast_nullable_to_non_nullable
as String?,billKey: freezed == billKey ? _self.billKey : billKey // ignore: cast_nullable_to_non_nullable
as String?,billerCode: freezed == billerCode ? _self.billerCode : billerCode // ignore: cast_nullable_to_non_nullable
as String?,pdfUrl: freezed == pdfUrl ? _self.pdfUrl : pdfUrl // ignore: cast_nullable_to_non_nullable
as String?,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,merchantId: freezed == merchantId ? _self.merchantId : merchantId // ignore: cast_nullable_to_non_nullable
as String?,signatureKey: freezed == signatureKey ? _self.signatureKey : signatureKey // ignore: cast_nullable_to_non_nullable
as String?,actions: freezed == actions ? _self.actions : actions // ignore: cast_nullable_to_non_nullable
as List<PaymentActionModel>?,rawResponse: freezed == rawResponse ? _self.rawResponse : rawResponse // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// @nodoc

@JsonSerializable(explicitToJson: true)
class _PaymentModel implements PaymentModel {
   _PaymentModel({@HiveField(0)@JsonKey(name: 'order_id') this.orderId = null, @HiveField(1)@JsonKey(name: 'transaction_id') this.transactionId, @HiveField(2) this.method = '', @HiveField(3) this.status = '', @HiveField(4) this.paymentType = '', @HiveField(5) required this.amount, @HiveField(6) this.remainingAmount = 0, @HiveField(7) this.phone = '', @HiveField(8) this.discount = 0, @HiveField(9) this.midtransRedirectUrl = '', @HiveField(10)@JsonKey(name: 'fraud_status') this.fraudStatus = '', @HiveField(11)@JsonKey(name: 'transaction_time') this.transactionTime = '', @HiveField(12)@JsonKey(name: 'expiry_time') this.expiryTime = '', @HiveField(13)@JsonKey(name: 'settlement_time') this.settlementTime = '', @HiveField(14)@JsonKey(name: 'paid_at') this.paidAt = '', @HiveField(15)@JsonKey(name: 'va_numbers') final  List<VANumberModel>? vaNumbers = const [], @HiveField(16)@JsonKey(name: 'permata_va_number') this.permataVaNumber = '', @HiveField(17)@JsonKey(name: 'bill_key') this.billKey = '', @HiveField(18)@JsonKey(name: 'biller_code') this.billerCode = '', @HiveField(19)@JsonKey(name: 'pdf_url') this.pdfUrl = '', @HiveField(20) this.currency = "IDR", @HiveField(21)@JsonKey(name: 'merchant_id') this.merchantId = '', @HiveField(22)@JsonKey(name: 'signature_key') this.signatureKey = '', @HiveField(23) final  List<PaymentActionModel>? actions = const [], @HiveField(24)@JsonKey(name: 'raw_response') final  Map<String, dynamic>? rawResponse = const {}, @HiveField(25) this.createdAt, @HiveField(26) this.updatedAt}): _vaNumbers = vaNumbers,_actions = actions,_rawResponse = rawResponse;
  factory _PaymentModel.fromJson(Map<String, dynamic> json) => _$PaymentModelFromJson(json);

// Basic payment info
@override@HiveField(0)@JsonKey(name: 'order_id') final  String? orderId;
@override@HiveField(1)@JsonKey(name: 'transaction_id') final  String? transactionId;
@override@JsonKey()@HiveField(2) final  String? method;
@override@JsonKey()@HiveField(3) final  String? status;
@override@JsonKey()@HiveField(4) final  String? paymentType;
@override@HiveField(5) final  int amount;
@override@JsonKey()@HiveField(6) final  int remainingAmount;
@override@JsonKey()@HiveField(7) final  String? phone;
@override@JsonKey()@HiveField(8) final  int discount;
@override@JsonKey()@HiveField(9) final  String? midtransRedirectUrl;
@override@HiveField(10)@JsonKey(name: 'fraud_status') final  String? fraudStatus;
@override@HiveField(11)@JsonKey(name: 'transaction_time') final  String? transactionTime;
@override@HiveField(12)@JsonKey(name: 'expiry_time') final  String? expiryTime;
@override@HiveField(13)@JsonKey(name: 'settlement_time') final  String? settlementTime;
@override@HiveField(14)@JsonKey(name: 'paid_at') final  String? paidAt;
// Virtual account nu,mbers
 final  List<VANumberModel>? _vaNumbers;
// Virtual account nu,mbers
@override@HiveField(15)@JsonKey(name: 'va_numbers') List<VANumberModel>? get vaNumbers {
  final value = _vaNumbers;
  if (value == null) return null;
  if (_vaNumbers is EqualUnmodifiableListView) return _vaNumbers;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override@HiveField(16)@JsonKey(name: 'permata_va_number') final  String? permataVaNumber;
@override@HiveField(17)@JsonKey(name: 'bill_key') final  String? billKey;
@override@HiveField(18)@JsonKey(name: 'biller_code') final  String? billerCode;
@override@HiveField(19)@JsonKey(name: 'pdf_url') final  String? pdfUrl;
@override@JsonKey()@HiveField(20) final  String currency;
@override@HiveField(21)@JsonKey(name: 'merchant_id') final  String? merchantId;
@override@HiveField(22)@JsonKey(name: 'signature_key') final  String? signatureKey;
// Payment actions
 final  List<PaymentActionModel>? _actions;
// Payment actions
@override@JsonKey()@HiveField(23) List<PaymentActionModel>? get actions {
  final value = _actions;
  if (value == null) return null;
  if (_actions is EqualUnmodifiableListView) return _actions;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

// Raw response
 final  Map<String, dynamic>? _rawResponse;
// Raw response
@override@HiveField(24)@JsonKey(name: 'raw_response') Map<String, dynamic>? get rawResponse {
  final value = _rawResponse;
  if (value == null) return null;
  if (_rawResponse is EqualUnmodifiableMapView) return _rawResponse;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

// Timestamps
@override@HiveField(25) final  DateTime? createdAt;
@override@HiveField(26) final  DateTime? updatedAt;

/// Create a copy of PaymentModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaymentModelCopyWith<_PaymentModel> get copyWith => __$PaymentModelCopyWithImpl<_PaymentModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaymentModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaymentModel&&(identical(other.orderId, orderId) || other.orderId == orderId)&&(identical(other.transactionId, transactionId) || other.transactionId == transactionId)&&(identical(other.method, method) || other.method == method)&&(identical(other.status, status) || other.status == status)&&(identical(other.paymentType, paymentType) || other.paymentType == paymentType)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.remainingAmount, remainingAmount) || other.remainingAmount == remainingAmount)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.discount, discount) || other.discount == discount)&&(identical(other.midtransRedirectUrl, midtransRedirectUrl) || other.midtransRedirectUrl == midtransRedirectUrl)&&(identical(other.fraudStatus, fraudStatus) || other.fraudStatus == fraudStatus)&&(identical(other.transactionTime, transactionTime) || other.transactionTime == transactionTime)&&(identical(other.expiryTime, expiryTime) || other.expiryTime == expiryTime)&&(identical(other.settlementTime, settlementTime) || other.settlementTime == settlementTime)&&(identical(other.paidAt, paidAt) || other.paidAt == paidAt)&&const DeepCollectionEquality().equals(other._vaNumbers, _vaNumbers)&&(identical(other.permataVaNumber, permataVaNumber) || other.permataVaNumber == permataVaNumber)&&(identical(other.billKey, billKey) || other.billKey == billKey)&&(identical(other.billerCode, billerCode) || other.billerCode == billerCode)&&(identical(other.pdfUrl, pdfUrl) || other.pdfUrl == pdfUrl)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.merchantId, merchantId) || other.merchantId == merchantId)&&(identical(other.signatureKey, signatureKey) || other.signatureKey == signatureKey)&&const DeepCollectionEquality().equals(other._actions, _actions)&&const DeepCollectionEquality().equals(other._rawResponse, _rawResponse)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,orderId,transactionId,method,status,paymentType,amount,remainingAmount,phone,discount,midtransRedirectUrl,fraudStatus,transactionTime,expiryTime,settlementTime,paidAt,const DeepCollectionEquality().hash(_vaNumbers),permataVaNumber,billKey,billerCode,pdfUrl,currency,merchantId,signatureKey,const DeepCollectionEquality().hash(_actions),const DeepCollectionEquality().hash(_rawResponse),createdAt,updatedAt]);

@override
String toString() {
  return 'PaymentModel(orderId: $orderId, transactionId: $transactionId, method: $method, status: $status, paymentType: $paymentType, amount: $amount, remainingAmount: $remainingAmount, phone: $phone, discount: $discount, midtransRedirectUrl: $midtransRedirectUrl, fraudStatus: $fraudStatus, transactionTime: $transactionTime, expiryTime: $expiryTime, settlementTime: $settlementTime, paidAt: $paidAt, vaNumbers: $vaNumbers, permataVaNumber: $permataVaNumber, billKey: $billKey, billerCode: $billerCode, pdfUrl: $pdfUrl, currency: $currency, merchantId: $merchantId, signatureKey: $signatureKey, actions: $actions, rawResponse: $rawResponse, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$PaymentModelCopyWith<$Res> implements $PaymentModelCopyWith<$Res> {
  factory _$PaymentModelCopyWith(_PaymentModel value, $Res Function(_PaymentModel) _then) = __$PaymentModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: 'order_id') String? orderId,@HiveField(1)@JsonKey(name: 'transaction_id') String? transactionId,@HiveField(2) String? method,@HiveField(3) String? status,@HiveField(4) String? paymentType,@HiveField(5) int amount,@HiveField(6) int remainingAmount,@HiveField(7) String? phone,@HiveField(8) int discount,@HiveField(9) String? midtransRedirectUrl,@HiveField(10)@JsonKey(name: 'fraud_status') String? fraudStatus,@HiveField(11)@JsonKey(name: 'transaction_time') String? transactionTime,@HiveField(12)@JsonKey(name: 'expiry_time') String? expiryTime,@HiveField(13)@JsonKey(name: 'settlement_time') String? settlementTime,@HiveField(14)@JsonKey(name: 'paid_at') String? paidAt,@HiveField(15)@JsonKey(name: 'va_numbers') List<VANumberModel>? vaNumbers,@HiveField(16)@JsonKey(name: 'permata_va_number') String? permataVaNumber,@HiveField(17)@JsonKey(name: 'bill_key') String? billKey,@HiveField(18)@JsonKey(name: 'biller_code') String? billerCode,@HiveField(19)@JsonKey(name: 'pdf_url') String? pdfUrl,@HiveField(20) String currency,@HiveField(21)@JsonKey(name: 'merchant_id') String? merchantId,@HiveField(22)@JsonKey(name: 'signature_key') String? signatureKey,@HiveField(23) List<PaymentActionModel>? actions,@HiveField(24)@JsonKey(name: 'raw_response') Map<String, dynamic>? rawResponse,@HiveField(25) DateTime? createdAt,@HiveField(26) DateTime? updatedAt
});




}
/// @nodoc
class __$PaymentModelCopyWithImpl<$Res>
    implements _$PaymentModelCopyWith<$Res> {
  __$PaymentModelCopyWithImpl(this._self, this._then);

  final _PaymentModel _self;
  final $Res Function(_PaymentModel) _then;

/// Create a copy of PaymentModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? orderId = freezed,Object? transactionId = freezed,Object? method = freezed,Object? status = freezed,Object? paymentType = freezed,Object? amount = null,Object? remainingAmount = null,Object? phone = freezed,Object? discount = null,Object? midtransRedirectUrl = freezed,Object? fraudStatus = freezed,Object? transactionTime = freezed,Object? expiryTime = freezed,Object? settlementTime = freezed,Object? paidAt = freezed,Object? vaNumbers = freezed,Object? permataVaNumber = freezed,Object? billKey = freezed,Object? billerCode = freezed,Object? pdfUrl = freezed,Object? currency = null,Object? merchantId = freezed,Object? signatureKey = freezed,Object? actions = freezed,Object? rawResponse = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,}) {
  return _then(_PaymentModel(
orderId: freezed == orderId ? _self.orderId : orderId // ignore: cast_nullable_to_non_nullable
as String?,transactionId: freezed == transactionId ? _self.transactionId : transactionId // ignore: cast_nullable_to_non_nullable
as String?,method: freezed == method ? _self.method : method // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,paymentType: freezed == paymentType ? _self.paymentType : paymentType // ignore: cast_nullable_to_non_nullable
as String?,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,remainingAmount: null == remainingAmount ? _self.remainingAmount : remainingAmount // ignore: cast_nullable_to_non_nullable
as int,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,discount: null == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int,midtransRedirectUrl: freezed == midtransRedirectUrl ? _self.midtransRedirectUrl : midtransRedirectUrl // ignore: cast_nullable_to_non_nullable
as String?,fraudStatus: freezed == fraudStatus ? _self.fraudStatus : fraudStatus // ignore: cast_nullable_to_non_nullable
as String?,transactionTime: freezed == transactionTime ? _self.transactionTime : transactionTime // ignore: cast_nullable_to_non_nullable
as String?,expiryTime: freezed == expiryTime ? _self.expiryTime : expiryTime // ignore: cast_nullable_to_non_nullable
as String?,settlementTime: freezed == settlementTime ? _self.settlementTime : settlementTime // ignore: cast_nullable_to_non_nullable
as String?,paidAt: freezed == paidAt ? _self.paidAt : paidAt // ignore: cast_nullable_to_non_nullable
as String?,vaNumbers: freezed == vaNumbers ? _self._vaNumbers : vaNumbers // ignore: cast_nullable_to_non_nullable
as List<VANumberModel>?,permataVaNumber: freezed == permataVaNumber ? _self.permataVaNumber : permataVaNumber // ignore: cast_nullable_to_non_nullable
as String?,billKey: freezed == billKey ? _self.billKey : billKey // ignore: cast_nullable_to_non_nullable
as String?,billerCode: freezed == billerCode ? _self.billerCode : billerCode // ignore: cast_nullable_to_non_nullable
as String?,pdfUrl: freezed == pdfUrl ? _self.pdfUrl : pdfUrl // ignore: cast_nullable_to_non_nullable
as String?,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,merchantId: freezed == merchantId ? _self.merchantId : merchantId // ignore: cast_nullable_to_non_nullable
as String?,signatureKey: freezed == signatureKey ? _self.signatureKey : signatureKey // ignore: cast_nullable_to_non_nullable
as String?,actions: freezed == actions ? _self._actions : actions // ignore: cast_nullable_to_non_nullable
as List<PaymentActionModel>?,rawResponse: freezed == rawResponse ? _self._rawResponse : rawResponse // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}

// dart format on
