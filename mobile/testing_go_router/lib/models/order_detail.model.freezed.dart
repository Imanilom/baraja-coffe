// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'order_detail.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$OrderDetailModel {

// Identitas Order
@HiveField(0)@JsonKey(name: 'order_id') String? get orderId;@HiveField(1)@JsonKey(name: 'user_id') String? get userId;@HiveField(2) String get user;@HiveField(3) String? get cashierId;// Item dan Status
@HiveField(4) List<OrderItemModel> get items;@HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson) OrderStatus get status;// Pembayaran & Tipe Order
@HiveField(6) String? get paymentMethod;@HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) OrderType get orderType;// Lokasi
@HiveField(8) String get deliveryAddress;@HiveField(9) String? get tableNumber;@HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson) LocationType get type;@HiveField(11) String? get outlet;// Diskon & Promo
@HiveField(12) DiscountModel? get discounts;@HiveField(13) List<String>? get appliedPromos;@HiveField(14) String? get appliedManualPromo;@HiveField(15) String? get appliedVoucher;// Pajak & Layanan
@HiveField(16) List<TaxServiceDetailModel> get taxAndServiceDetails;@HiveField(17) int get totalTax;@HiveField(18) int get totalServiceFee;// Total Harga,
@HiveField(19) int get totalBeforeDiscount;@HiveField(20) int get totalAfterDiscount;@HiveField(21) int get grandTotal;// Metadata
@HiveField(22) String get source;@HiveField(23) DateTime? get createdAt;@HiveField(24) DateTime? get updatedAt;@HiveField(25)@JsonKey(name: 'payment_details') List<PaymentModel>? get payment;@HiveField(26) String? get paymentStatus;@HiveField(27)@JsonKey(name: '_id') String? get id;
/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OrderDetailModelCopyWith<OrderDetailModel> get copyWith => _$OrderDetailModelCopyWithImpl<OrderDetailModel>(this as OrderDetailModel, _$identity);

  /// Serializes this OrderDetailModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OrderDetailModel&&(identical(other.orderId, orderId) || other.orderId == orderId)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.user, user) || other.user == user)&&(identical(other.cashierId, cashierId) || other.cashierId == cashierId)&&const DeepCollectionEquality().equals(other.items, items)&&(identical(other.status, status) || other.status == status)&&(identical(other.paymentMethod, paymentMethod) || other.paymentMethod == paymentMethod)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.deliveryAddress, deliveryAddress) || other.deliveryAddress == deliveryAddress)&&(identical(other.tableNumber, tableNumber) || other.tableNumber == tableNumber)&&(identical(other.type, type) || other.type == type)&&(identical(other.outlet, outlet) || other.outlet == outlet)&&(identical(other.discounts, discounts) || other.discounts == discounts)&&const DeepCollectionEquality().equals(other.appliedPromos, appliedPromos)&&(identical(other.appliedManualPromo, appliedManualPromo) || other.appliedManualPromo == appliedManualPromo)&&(identical(other.appliedVoucher, appliedVoucher) || other.appliedVoucher == appliedVoucher)&&const DeepCollectionEquality().equals(other.taxAndServiceDetails, taxAndServiceDetails)&&(identical(other.totalTax, totalTax) || other.totalTax == totalTax)&&(identical(other.totalServiceFee, totalServiceFee) || other.totalServiceFee == totalServiceFee)&&(identical(other.totalBeforeDiscount, totalBeforeDiscount) || other.totalBeforeDiscount == totalBeforeDiscount)&&(identical(other.totalAfterDiscount, totalAfterDiscount) || other.totalAfterDiscount == totalAfterDiscount)&&(identical(other.grandTotal, grandTotal) || other.grandTotal == grandTotal)&&(identical(other.source, source) || other.source == source)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&const DeepCollectionEquality().equals(other.payment, payment)&&(identical(other.paymentStatus, paymentStatus) || other.paymentStatus == paymentStatus)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,orderId,userId,user,cashierId,const DeepCollectionEquality().hash(items),status,paymentMethod,orderType,deliveryAddress,tableNumber,type,outlet,discounts,const DeepCollectionEquality().hash(appliedPromos),appliedManualPromo,appliedVoucher,const DeepCollectionEquality().hash(taxAndServiceDetails),totalTax,totalServiceFee,totalBeforeDiscount,totalAfterDiscount,grandTotal,source,createdAt,updatedAt,const DeepCollectionEquality().hash(payment),paymentStatus,id]);

@override
String toString() {
  return 'OrderDetailModel(orderId: $orderId, userId: $userId, user: $user, cashierId: $cashierId, items: $items, status: $status, paymentMethod: $paymentMethod, orderType: $orderType, deliveryAddress: $deliveryAddress, tableNumber: $tableNumber, type: $type, outlet: $outlet, discounts: $discounts, appliedPromos: $appliedPromos, appliedManualPromo: $appliedManualPromo, appliedVoucher: $appliedVoucher, taxAndServiceDetails: $taxAndServiceDetails, totalTax: $totalTax, totalServiceFee: $totalServiceFee, totalBeforeDiscount: $totalBeforeDiscount, totalAfterDiscount: $totalAfterDiscount, grandTotal: $grandTotal, source: $source, createdAt: $createdAt, updatedAt: $updatedAt, payment: $payment, paymentStatus: $paymentStatus, id: $id)';
}


}

/// @nodoc
abstract mixin class $OrderDetailModelCopyWith<$Res>  {
  factory $OrderDetailModelCopyWith(OrderDetailModel value, $Res Function(OrderDetailModel) _then) = _$OrderDetailModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: 'order_id') String? orderId,@HiveField(1)@JsonKey(name: 'user_id') String? userId,@HiveField(2) String user,@HiveField(3) String? cashierId,@HiveField(4) List<OrderItemModel> items,@HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson) OrderStatus status,@HiveField(6) String? paymentMethod,@HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) OrderType orderType,@HiveField(8) String deliveryAddress,@HiveField(9) String? tableNumber,@HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson) LocationType type,@HiveField(11) String? outlet,@HiveField(12) DiscountModel? discounts,@HiveField(13) List<String>? appliedPromos,@HiveField(14) String? appliedManualPromo,@HiveField(15) String? appliedVoucher,@HiveField(16) List<TaxServiceDetailModel> taxAndServiceDetails,@HiveField(17) int totalTax,@HiveField(18) int totalServiceFee,@HiveField(19) int totalBeforeDiscount,@HiveField(20) int totalAfterDiscount,@HiveField(21) int grandTotal,@HiveField(22) String source,@HiveField(23) DateTime? createdAt,@HiveField(24) DateTime? updatedAt,@HiveField(25)@JsonKey(name: 'payment_details') List<PaymentModel>? payment,@HiveField(26) String? paymentStatus,@HiveField(27)@JsonKey(name: '_id') String? id
});


$DiscountModelCopyWith<$Res>? get discounts;

}
/// @nodoc
class _$OrderDetailModelCopyWithImpl<$Res>
    implements $OrderDetailModelCopyWith<$Res> {
  _$OrderDetailModelCopyWithImpl(this._self, this._then);

  final OrderDetailModel _self;
  final $Res Function(OrderDetailModel) _then;

/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? orderId = freezed,Object? userId = freezed,Object? user = null,Object? cashierId = freezed,Object? items = null,Object? status = null,Object? paymentMethod = freezed,Object? orderType = null,Object? deliveryAddress = null,Object? tableNumber = freezed,Object? type = null,Object? outlet = freezed,Object? discounts = freezed,Object? appliedPromos = freezed,Object? appliedManualPromo = freezed,Object? appliedVoucher = freezed,Object? taxAndServiceDetails = null,Object? totalTax = null,Object? totalServiceFee = null,Object? totalBeforeDiscount = null,Object? totalAfterDiscount = null,Object? grandTotal = null,Object? source = null,Object? createdAt = freezed,Object? updatedAt = freezed,Object? payment = freezed,Object? paymentStatus = freezed,Object? id = freezed,}) {
  return _then(_self.copyWith(
orderId: freezed == orderId ? _self.orderId : orderId // ignore: cast_nullable_to_non_nullable
as String?,userId: freezed == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String?,user: null == user ? _self.user : user // ignore: cast_nullable_to_non_nullable
as String,cashierId: freezed == cashierId ? _self.cashierId : cashierId // ignore: cast_nullable_to_non_nullable
as String?,items: null == items ? _self.items : items // ignore: cast_nullable_to_non_nullable
as List<OrderItemModel>,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as OrderStatus,paymentMethod: freezed == paymentMethod ? _self.paymentMethod : paymentMethod // ignore: cast_nullable_to_non_nullable
as String?,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as OrderType,deliveryAddress: null == deliveryAddress ? _self.deliveryAddress : deliveryAddress // ignore: cast_nullable_to_non_nullable
as String,tableNumber: freezed == tableNumber ? _self.tableNumber : tableNumber // ignore: cast_nullable_to_non_nullable
as String?,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as LocationType,outlet: freezed == outlet ? _self.outlet : outlet // ignore: cast_nullable_to_non_nullable
as String?,discounts: freezed == discounts ? _self.discounts : discounts // ignore: cast_nullable_to_non_nullable
as DiscountModel?,appliedPromos: freezed == appliedPromos ? _self.appliedPromos : appliedPromos // ignore: cast_nullable_to_non_nullable
as List<String>?,appliedManualPromo: freezed == appliedManualPromo ? _self.appliedManualPromo : appliedManualPromo // ignore: cast_nullable_to_non_nullable
as String?,appliedVoucher: freezed == appliedVoucher ? _self.appliedVoucher : appliedVoucher // ignore: cast_nullable_to_non_nullable
as String?,taxAndServiceDetails: null == taxAndServiceDetails ? _self.taxAndServiceDetails : taxAndServiceDetails // ignore: cast_nullable_to_non_nullable
as List<TaxServiceDetailModel>,totalTax: null == totalTax ? _self.totalTax : totalTax // ignore: cast_nullable_to_non_nullable
as int,totalServiceFee: null == totalServiceFee ? _self.totalServiceFee : totalServiceFee // ignore: cast_nullable_to_non_nullable
as int,totalBeforeDiscount: null == totalBeforeDiscount ? _self.totalBeforeDiscount : totalBeforeDiscount // ignore: cast_nullable_to_non_nullable
as int,totalAfterDiscount: null == totalAfterDiscount ? _self.totalAfterDiscount : totalAfterDiscount // ignore: cast_nullable_to_non_nullable
as int,grandTotal: null == grandTotal ? _self.grandTotal : grandTotal // ignore: cast_nullable_to_non_nullable
as int,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,payment: freezed == payment ? _self.payment : payment // ignore: cast_nullable_to_non_nullable
as List<PaymentModel>?,paymentStatus: freezed == paymentStatus ? _self.paymentStatus : paymentStatus // ignore: cast_nullable_to_non_nullable
as String?,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DiscountModelCopyWith<$Res>? get discounts {
    if (_self.discounts == null) {
    return null;
  }

  return $DiscountModelCopyWith<$Res>(_self.discounts!, (value) {
    return _then(_self.copyWith(discounts: value));
  });
}
}


/// @nodoc
@JsonSerializable()

class _OrderDetailModel implements OrderDetailModel {
   _OrderDetailModel({@HiveField(0)@JsonKey(name: 'order_id') this.orderId = "", @HiveField(1)@JsonKey(name: 'user_id') this.userId, @HiveField(2) this.user = '', @HiveField(3) this.cashierId = "", @HiveField(4) final  List<OrderItemModel> items = const [], @HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson) this.status = OrderStatus.unknown, @HiveField(6) this.paymentMethod = null, @HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) required this.orderType, @HiveField(8) this.deliveryAddress = '', @HiveField(9) this.tableNumber = '', @HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson) this.type = LocationType.indoor, @HiveField(11) this.outlet, @HiveField(12) this.discounts, @HiveField(13) final  List<String>? appliedPromos, @HiveField(14) this.appliedManualPromo, @HiveField(15) this.appliedVoucher, @HiveField(16) final  List<TaxServiceDetailModel> taxAndServiceDetails = const [], @HiveField(17) this.totalTax = 0, @HiveField(18) this.totalServiceFee = 0, @HiveField(19) this.totalBeforeDiscount = 0, @HiveField(20) this.totalAfterDiscount = 0, @HiveField(21) this.grandTotal = 0, @HiveField(22) this.source = 'Cashier', @HiveField(23) this.createdAt, @HiveField(24) this.updatedAt, @HiveField(25)@JsonKey(name: 'payment_details') final  List<PaymentModel>? payment = null, @HiveField(26) this.paymentStatus = '', @HiveField(27)@JsonKey(name: '_id') this.id = null}): _items = items,_appliedPromos = appliedPromos,_taxAndServiceDetails = taxAndServiceDetails,_payment = payment;
  factory _OrderDetailModel.fromJson(Map<String, dynamic> json) => _$OrderDetailModelFromJson(json);

// Identitas Order
@override@HiveField(0)@JsonKey(name: 'order_id') final  String? orderId;
@override@HiveField(1)@JsonKey(name: 'user_id') final  String? userId;
@override@JsonKey()@HiveField(2) final  String user;
@override@JsonKey()@HiveField(3) final  String? cashierId;
// Item dan Status
 final  List<OrderItemModel> _items;
// Item dan Status
@override@JsonKey()@HiveField(4) List<OrderItemModel> get items {
  if (_items is EqualUnmodifiableListView) return _items;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_items);
}

@override@HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson) final  OrderStatus status;
// Pembayaran & Tipe Order
@override@JsonKey()@HiveField(6) final  String? paymentMethod;
@override@HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) final  OrderType orderType;
// Lokasi
@override@JsonKey()@HiveField(8) final  String deliveryAddress;
@override@JsonKey()@HiveField(9) final  String? tableNumber;
@override@HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson) final  LocationType type;
@override@HiveField(11) final  String? outlet;
// Diskon & Promo
@override@HiveField(12) final  DiscountModel? discounts;
 final  List<String>? _appliedPromos;
@override@HiveField(13) List<String>? get appliedPromos {
  final value = _appliedPromos;
  if (value == null) return null;
  if (_appliedPromos is EqualUnmodifiableListView) return _appliedPromos;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override@HiveField(14) final  String? appliedManualPromo;
@override@HiveField(15) final  String? appliedVoucher;
// Pajak & Layanan
 final  List<TaxServiceDetailModel> _taxAndServiceDetails;
// Pajak & Layanan
@override@JsonKey()@HiveField(16) List<TaxServiceDetailModel> get taxAndServiceDetails {
  if (_taxAndServiceDetails is EqualUnmodifiableListView) return _taxAndServiceDetails;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_taxAndServiceDetails);
}

@override@JsonKey()@HiveField(17) final  int totalTax;
@override@JsonKey()@HiveField(18) final  int totalServiceFee;
// Total Harga,
@override@JsonKey()@HiveField(19) final  int totalBeforeDiscount;
@override@JsonKey()@HiveField(20) final  int totalAfterDiscount;
@override@JsonKey()@HiveField(21) final  int grandTotal;
// Metadata
@override@JsonKey()@HiveField(22) final  String source;
@override@HiveField(23) final  DateTime? createdAt;
@override@HiveField(24) final  DateTime? updatedAt;
 final  List<PaymentModel>? _payment;
@override@HiveField(25)@JsonKey(name: 'payment_details') List<PaymentModel>? get payment {
  final value = _payment;
  if (value == null) return null;
  if (_payment is EqualUnmodifiableListView) return _payment;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override@JsonKey()@HiveField(26) final  String? paymentStatus;
@override@HiveField(27)@JsonKey(name: '_id') final  String? id;

/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OrderDetailModelCopyWith<_OrderDetailModel> get copyWith => __$OrderDetailModelCopyWithImpl<_OrderDetailModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OrderDetailModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OrderDetailModel&&(identical(other.orderId, orderId) || other.orderId == orderId)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.user, user) || other.user == user)&&(identical(other.cashierId, cashierId) || other.cashierId == cashierId)&&const DeepCollectionEquality().equals(other._items, _items)&&(identical(other.status, status) || other.status == status)&&(identical(other.paymentMethod, paymentMethod) || other.paymentMethod == paymentMethod)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.deliveryAddress, deliveryAddress) || other.deliveryAddress == deliveryAddress)&&(identical(other.tableNumber, tableNumber) || other.tableNumber == tableNumber)&&(identical(other.type, type) || other.type == type)&&(identical(other.outlet, outlet) || other.outlet == outlet)&&(identical(other.discounts, discounts) || other.discounts == discounts)&&const DeepCollectionEquality().equals(other._appliedPromos, _appliedPromos)&&(identical(other.appliedManualPromo, appliedManualPromo) || other.appliedManualPromo == appliedManualPromo)&&(identical(other.appliedVoucher, appliedVoucher) || other.appliedVoucher == appliedVoucher)&&const DeepCollectionEquality().equals(other._taxAndServiceDetails, _taxAndServiceDetails)&&(identical(other.totalTax, totalTax) || other.totalTax == totalTax)&&(identical(other.totalServiceFee, totalServiceFee) || other.totalServiceFee == totalServiceFee)&&(identical(other.totalBeforeDiscount, totalBeforeDiscount) || other.totalBeforeDiscount == totalBeforeDiscount)&&(identical(other.totalAfterDiscount, totalAfterDiscount) || other.totalAfterDiscount == totalAfterDiscount)&&(identical(other.grandTotal, grandTotal) || other.grandTotal == grandTotal)&&(identical(other.source, source) || other.source == source)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&const DeepCollectionEquality().equals(other._payment, _payment)&&(identical(other.paymentStatus, paymentStatus) || other.paymentStatus == paymentStatus)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,orderId,userId,user,cashierId,const DeepCollectionEquality().hash(_items),status,paymentMethod,orderType,deliveryAddress,tableNumber,type,outlet,discounts,const DeepCollectionEquality().hash(_appliedPromos),appliedManualPromo,appliedVoucher,const DeepCollectionEquality().hash(_taxAndServiceDetails),totalTax,totalServiceFee,totalBeforeDiscount,totalAfterDiscount,grandTotal,source,createdAt,updatedAt,const DeepCollectionEquality().hash(_payment),paymentStatus,id]);

@override
String toString() {
  return 'OrderDetailModel(orderId: $orderId, userId: $userId, user: $user, cashierId: $cashierId, items: $items, status: $status, paymentMethod: $paymentMethod, orderType: $orderType, deliveryAddress: $deliveryAddress, tableNumber: $tableNumber, type: $type, outlet: $outlet, discounts: $discounts, appliedPromos: $appliedPromos, appliedManualPromo: $appliedManualPromo, appliedVoucher: $appliedVoucher, taxAndServiceDetails: $taxAndServiceDetails, totalTax: $totalTax, totalServiceFee: $totalServiceFee, totalBeforeDiscount: $totalBeforeDiscount, totalAfterDiscount: $totalAfterDiscount, grandTotal: $grandTotal, source: $source, createdAt: $createdAt, updatedAt: $updatedAt, payment: $payment, paymentStatus: $paymentStatus, id: $id)';
}


}

/// @nodoc
abstract mixin class _$OrderDetailModelCopyWith<$Res> implements $OrderDetailModelCopyWith<$Res> {
  factory _$OrderDetailModelCopyWith(_OrderDetailModel value, $Res Function(_OrderDetailModel) _then) = __$OrderDetailModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: 'order_id') String? orderId,@HiveField(1)@JsonKey(name: 'user_id') String? userId,@HiveField(2) String user,@HiveField(3) String? cashierId,@HiveField(4) List<OrderItemModel> items,@HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson) OrderStatus status,@HiveField(6) String? paymentMethod,@HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) OrderType orderType,@HiveField(8) String deliveryAddress,@HiveField(9) String? tableNumber,@HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson) LocationType type,@HiveField(11) String? outlet,@HiveField(12) DiscountModel? discounts,@HiveField(13) List<String>? appliedPromos,@HiveField(14) String? appliedManualPromo,@HiveField(15) String? appliedVoucher,@HiveField(16) List<TaxServiceDetailModel> taxAndServiceDetails,@HiveField(17) int totalTax,@HiveField(18) int totalServiceFee,@HiveField(19) int totalBeforeDiscount,@HiveField(20) int totalAfterDiscount,@HiveField(21) int grandTotal,@HiveField(22) String source,@HiveField(23) DateTime? createdAt,@HiveField(24) DateTime? updatedAt,@HiveField(25)@JsonKey(name: 'payment_details') List<PaymentModel>? payment,@HiveField(26) String? paymentStatus,@HiveField(27)@JsonKey(name: '_id') String? id
});


@override $DiscountModelCopyWith<$Res>? get discounts;

}
/// @nodoc
class __$OrderDetailModelCopyWithImpl<$Res>
    implements _$OrderDetailModelCopyWith<$Res> {
  __$OrderDetailModelCopyWithImpl(this._self, this._then);

  final _OrderDetailModel _self;
  final $Res Function(_OrderDetailModel) _then;

/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? orderId = freezed,Object? userId = freezed,Object? user = null,Object? cashierId = freezed,Object? items = null,Object? status = null,Object? paymentMethod = freezed,Object? orderType = null,Object? deliveryAddress = null,Object? tableNumber = freezed,Object? type = null,Object? outlet = freezed,Object? discounts = freezed,Object? appliedPromos = freezed,Object? appliedManualPromo = freezed,Object? appliedVoucher = freezed,Object? taxAndServiceDetails = null,Object? totalTax = null,Object? totalServiceFee = null,Object? totalBeforeDiscount = null,Object? totalAfterDiscount = null,Object? grandTotal = null,Object? source = null,Object? createdAt = freezed,Object? updatedAt = freezed,Object? payment = freezed,Object? paymentStatus = freezed,Object? id = freezed,}) {
  return _then(_OrderDetailModel(
orderId: freezed == orderId ? _self.orderId : orderId // ignore: cast_nullable_to_non_nullable
as String?,userId: freezed == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String?,user: null == user ? _self.user : user // ignore: cast_nullable_to_non_nullable
as String,cashierId: freezed == cashierId ? _self.cashierId : cashierId // ignore: cast_nullable_to_non_nullable
as String?,items: null == items ? _self._items : items // ignore: cast_nullable_to_non_nullable
as List<OrderItemModel>,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as OrderStatus,paymentMethod: freezed == paymentMethod ? _self.paymentMethod : paymentMethod // ignore: cast_nullable_to_non_nullable
as String?,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as OrderType,deliveryAddress: null == deliveryAddress ? _self.deliveryAddress : deliveryAddress // ignore: cast_nullable_to_non_nullable
as String,tableNumber: freezed == tableNumber ? _self.tableNumber : tableNumber // ignore: cast_nullable_to_non_nullable
as String?,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as LocationType,outlet: freezed == outlet ? _self.outlet : outlet // ignore: cast_nullable_to_non_nullable
as String?,discounts: freezed == discounts ? _self.discounts : discounts // ignore: cast_nullable_to_non_nullable
as DiscountModel?,appliedPromos: freezed == appliedPromos ? _self._appliedPromos : appliedPromos // ignore: cast_nullable_to_non_nullable
as List<String>?,appliedManualPromo: freezed == appliedManualPromo ? _self.appliedManualPromo : appliedManualPromo // ignore: cast_nullable_to_non_nullable
as String?,appliedVoucher: freezed == appliedVoucher ? _self.appliedVoucher : appliedVoucher // ignore: cast_nullable_to_non_nullable
as String?,taxAndServiceDetails: null == taxAndServiceDetails ? _self._taxAndServiceDetails : taxAndServiceDetails // ignore: cast_nullable_to_non_nullable
as List<TaxServiceDetailModel>,totalTax: null == totalTax ? _self.totalTax : totalTax // ignore: cast_nullable_to_non_nullable
as int,totalServiceFee: null == totalServiceFee ? _self.totalServiceFee : totalServiceFee // ignore: cast_nullable_to_non_nullable
as int,totalBeforeDiscount: null == totalBeforeDiscount ? _self.totalBeforeDiscount : totalBeforeDiscount // ignore: cast_nullable_to_non_nullable
as int,totalAfterDiscount: null == totalAfterDiscount ? _self.totalAfterDiscount : totalAfterDiscount // ignore: cast_nullable_to_non_nullable
as int,grandTotal: null == grandTotal ? _self.grandTotal : grandTotal // ignore: cast_nullable_to_non_nullable
as int,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,payment: freezed == payment ? _self._payment : payment // ignore: cast_nullable_to_non_nullable
as List<PaymentModel>?,paymentStatus: freezed == paymentStatus ? _self.paymentStatus : paymentStatus // ignore: cast_nullable_to_non_nullable
as String?,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DiscountModelCopyWith<$Res>? get discounts {
    if (_self.discounts == null) {
    return null;
  }

  return $DiscountModelCopyWith<$Res>(_self.discounts!, (value) {
    return _then(_self.copyWith(discounts: value));
  });
}
}

// dart format on
