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

@HiveField(0)@JsonKey(name: 'userId') String? get customerId;@HiveField(1) String? get customerName;//
@HiveField(2) String? get cashierId;//
@HiveField(3) String? get phoneNumber;@HiveField(4) List<OrderItemModel> get items;//
@HiveField(5) String get orderType;//
@HiveField(6) String? get deliveryAddress;@HiveField(7) String? get tableNumber;@HiveField(8) String? get paymentMethod;@HiveField(9) String? get status;@HiveField(10) int? get subTotalPrice;@HiveField(11)@JsonKey(name: 'order_id') String? get orderId;//
@HiveField(12) int? get tax;@HiveField(13) int? get totalPrice;@HiveField(14) int? get serviceFee;@HiveField(15) Map<String, int>? get discounts;
/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OrderDetailModelCopyWith<OrderDetailModel> get copyWith => _$OrderDetailModelCopyWithImpl<OrderDetailModel>(this as OrderDetailModel, _$identity);

  /// Serializes this OrderDetailModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OrderDetailModel&&(identical(other.customerId, customerId) || other.customerId == customerId)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.cashierId, cashierId) || other.cashierId == cashierId)&&(identical(other.phoneNumber, phoneNumber) || other.phoneNumber == phoneNumber)&&const DeepCollectionEquality().equals(other.items, items)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.deliveryAddress, deliveryAddress) || other.deliveryAddress == deliveryAddress)&&(identical(other.tableNumber, tableNumber) || other.tableNumber == tableNumber)&&(identical(other.paymentMethod, paymentMethod) || other.paymentMethod == paymentMethod)&&(identical(other.status, status) || other.status == status)&&(identical(other.subTotalPrice, subTotalPrice) || other.subTotalPrice == subTotalPrice)&&(identical(other.orderId, orderId) || other.orderId == orderId)&&(identical(other.tax, tax) || other.tax == tax)&&(identical(other.totalPrice, totalPrice) || other.totalPrice == totalPrice)&&(identical(other.serviceFee, serviceFee) || other.serviceFee == serviceFee)&&const DeepCollectionEquality().equals(other.discounts, discounts));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,customerId,customerName,cashierId,phoneNumber,const DeepCollectionEquality().hash(items),orderType,deliveryAddress,tableNumber,paymentMethod,status,subTotalPrice,orderId,tax,totalPrice,serviceFee,const DeepCollectionEquality().hash(discounts));

@override
String toString() {
  return 'OrderDetailModel(customerId: $customerId, customerName: $customerName, cashierId: $cashierId, phoneNumber: $phoneNumber, items: $items, orderType: $orderType, deliveryAddress: $deliveryAddress, tableNumber: $tableNumber, paymentMethod: $paymentMethod, status: $status, subTotalPrice: $subTotalPrice, orderId: $orderId, tax: $tax, totalPrice: $totalPrice, serviceFee: $serviceFee, discounts: $discounts)';
}


}

/// @nodoc
abstract mixin class $OrderDetailModelCopyWith<$Res>  {
  factory $OrderDetailModelCopyWith(OrderDetailModel value, $Res Function(OrderDetailModel) _then) = _$OrderDetailModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: 'userId') String? customerId,@HiveField(1) String? customerName,@HiveField(2) String? cashierId,@HiveField(3) String? phoneNumber,@HiveField(4) List<OrderItemModel> items,@HiveField(5) String orderType,@HiveField(6) String? deliveryAddress,@HiveField(7) String? tableNumber,@HiveField(8) String? paymentMethod,@HiveField(9) String? status,@HiveField(10) int? subTotalPrice,@HiveField(11)@JsonKey(name: 'order_id') String? orderId,@HiveField(12) int? tax,@HiveField(13) int? totalPrice,@HiveField(14) int? serviceFee,@HiveField(15) Map<String, int>? discounts
});




}
/// @nodoc
class _$OrderDetailModelCopyWithImpl<$Res>
    implements $OrderDetailModelCopyWith<$Res> {
  _$OrderDetailModelCopyWithImpl(this._self, this._then);

  final OrderDetailModel _self;
  final $Res Function(OrderDetailModel) _then;

/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? customerId = freezed,Object? customerName = freezed,Object? cashierId = freezed,Object? phoneNumber = freezed,Object? items = null,Object? orderType = null,Object? deliveryAddress = freezed,Object? tableNumber = freezed,Object? paymentMethod = freezed,Object? status = freezed,Object? subTotalPrice = freezed,Object? orderId = freezed,Object? tax = freezed,Object? totalPrice = freezed,Object? serviceFee = freezed,Object? discounts = freezed,}) {
  return _then(_self.copyWith(
customerId: freezed == customerId ? _self.customerId : customerId // ignore: cast_nullable_to_non_nullable
as String?,customerName: freezed == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String?,cashierId: freezed == cashierId ? _self.cashierId : cashierId // ignore: cast_nullable_to_non_nullable
as String?,phoneNumber: freezed == phoneNumber ? _self.phoneNumber : phoneNumber // ignore: cast_nullable_to_non_nullable
as String?,items: null == items ? _self.items : items // ignore: cast_nullable_to_non_nullable
as List<OrderItemModel>,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as String,deliveryAddress: freezed == deliveryAddress ? _self.deliveryAddress : deliveryAddress // ignore: cast_nullable_to_non_nullable
as String?,tableNumber: freezed == tableNumber ? _self.tableNumber : tableNumber // ignore: cast_nullable_to_non_nullable
as String?,paymentMethod: freezed == paymentMethod ? _self.paymentMethod : paymentMethod // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,subTotalPrice: freezed == subTotalPrice ? _self.subTotalPrice : subTotalPrice // ignore: cast_nullable_to_non_nullable
as int?,orderId: freezed == orderId ? _self.orderId : orderId // ignore: cast_nullable_to_non_nullable
as String?,tax: freezed == tax ? _self.tax : tax // ignore: cast_nullable_to_non_nullable
as int?,totalPrice: freezed == totalPrice ? _self.totalPrice : totalPrice // ignore: cast_nullable_to_non_nullable
as int?,serviceFee: freezed == serviceFee ? _self.serviceFee : serviceFee // ignore: cast_nullable_to_non_nullable
as int?,discounts: freezed == discounts ? _self.discounts : discounts // ignore: cast_nullable_to_non_nullable
as Map<String, int>?,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _OrderDetailModel implements OrderDetailModel {
   _OrderDetailModel({@HiveField(0)@JsonKey(name: 'userId') this.customerId = "", @HiveField(1) this.customerName = "", @HiveField(2) this.cashierId = "", @HiveField(3) this.phoneNumber = "", @HiveField(4) final  List<OrderItemModel> items = const [], @HiveField(5) required this.orderType, @HiveField(6) this.deliveryAddress = "", @HiveField(7) this.tableNumber = "", @HiveField(8) this.paymentMethod = "", @HiveField(9) this.status = "", @HiveField(10) this.subTotalPrice = 0, @HiveField(11)@JsonKey(name: 'order_id') this.orderId = "", @HiveField(12) this.tax = 0, @HiveField(13) this.totalPrice = 0, @HiveField(14) this.serviceFee = 0, @HiveField(15) final  Map<String, int>? discounts}): _items = items,_discounts = discounts;
  factory _OrderDetailModel.fromJson(Map<String, dynamic> json) => _$OrderDetailModelFromJson(json);

@override@HiveField(0)@JsonKey(name: 'userId') final  String? customerId;
@override@JsonKey()@HiveField(1) final  String? customerName;
//
@override@JsonKey()@HiveField(2) final  String? cashierId;
//
@override@JsonKey()@HiveField(3) final  String? phoneNumber;
 final  List<OrderItemModel> _items;
@override@JsonKey()@HiveField(4) List<OrderItemModel> get items {
  if (_items is EqualUnmodifiableListView) return _items;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_items);
}

//
@override@HiveField(5) final  String orderType;
//
@override@JsonKey()@HiveField(6) final  String? deliveryAddress;
@override@JsonKey()@HiveField(7) final  String? tableNumber;
@override@JsonKey()@HiveField(8) final  String? paymentMethod;
@override@JsonKey()@HiveField(9) final  String? status;
@override@JsonKey()@HiveField(10) final  int? subTotalPrice;
@override@HiveField(11)@JsonKey(name: 'order_id') final  String? orderId;
//
@override@JsonKey()@HiveField(12) final  int? tax;
@override@JsonKey()@HiveField(13) final  int? totalPrice;
@override@JsonKey()@HiveField(14) final  int? serviceFee;
 final  Map<String, int>? _discounts;
@override@HiveField(15) Map<String, int>? get discounts {
  final value = _discounts;
  if (value == null) return null;
  if (_discounts is EqualUnmodifiableMapView) return _discounts;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}


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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OrderDetailModel&&(identical(other.customerId, customerId) || other.customerId == customerId)&&(identical(other.customerName, customerName) || other.customerName == customerName)&&(identical(other.cashierId, cashierId) || other.cashierId == cashierId)&&(identical(other.phoneNumber, phoneNumber) || other.phoneNumber == phoneNumber)&&const DeepCollectionEquality().equals(other._items, _items)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.deliveryAddress, deliveryAddress) || other.deliveryAddress == deliveryAddress)&&(identical(other.tableNumber, tableNumber) || other.tableNumber == tableNumber)&&(identical(other.paymentMethod, paymentMethod) || other.paymentMethod == paymentMethod)&&(identical(other.status, status) || other.status == status)&&(identical(other.subTotalPrice, subTotalPrice) || other.subTotalPrice == subTotalPrice)&&(identical(other.orderId, orderId) || other.orderId == orderId)&&(identical(other.tax, tax) || other.tax == tax)&&(identical(other.totalPrice, totalPrice) || other.totalPrice == totalPrice)&&(identical(other.serviceFee, serviceFee) || other.serviceFee == serviceFee)&&const DeepCollectionEquality().equals(other._discounts, _discounts));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,customerId,customerName,cashierId,phoneNumber,const DeepCollectionEquality().hash(_items),orderType,deliveryAddress,tableNumber,paymentMethod,status,subTotalPrice,orderId,tax,totalPrice,serviceFee,const DeepCollectionEquality().hash(_discounts));

@override
String toString() {
  return 'OrderDetailModel(customerId: $customerId, customerName: $customerName, cashierId: $cashierId, phoneNumber: $phoneNumber, items: $items, orderType: $orderType, deliveryAddress: $deliveryAddress, tableNumber: $tableNumber, paymentMethod: $paymentMethod, status: $status, subTotalPrice: $subTotalPrice, orderId: $orderId, tax: $tax, totalPrice: $totalPrice, serviceFee: $serviceFee, discounts: $discounts)';
}


}

/// @nodoc
abstract mixin class _$OrderDetailModelCopyWith<$Res> implements $OrderDetailModelCopyWith<$Res> {
  factory _$OrderDetailModelCopyWith(_OrderDetailModel value, $Res Function(_OrderDetailModel) _then) = __$OrderDetailModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: 'userId') String? customerId,@HiveField(1) String? customerName,@HiveField(2) String? cashierId,@HiveField(3) String? phoneNumber,@HiveField(4) List<OrderItemModel> items,@HiveField(5) String orderType,@HiveField(6) String? deliveryAddress,@HiveField(7) String? tableNumber,@HiveField(8) String? paymentMethod,@HiveField(9) String? status,@HiveField(10) int? subTotalPrice,@HiveField(11)@JsonKey(name: 'order_id') String? orderId,@HiveField(12) int? tax,@HiveField(13) int? totalPrice,@HiveField(14) int? serviceFee,@HiveField(15) Map<String, int>? discounts
});




}
/// @nodoc
class __$OrderDetailModelCopyWithImpl<$Res>
    implements _$OrderDetailModelCopyWith<$Res> {
  __$OrderDetailModelCopyWithImpl(this._self, this._then);

  final _OrderDetailModel _self;
  final $Res Function(_OrderDetailModel) _then;

/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? customerId = freezed,Object? customerName = freezed,Object? cashierId = freezed,Object? phoneNumber = freezed,Object? items = null,Object? orderType = null,Object? deliveryAddress = freezed,Object? tableNumber = freezed,Object? paymentMethod = freezed,Object? status = freezed,Object? subTotalPrice = freezed,Object? orderId = freezed,Object? tax = freezed,Object? totalPrice = freezed,Object? serviceFee = freezed,Object? discounts = freezed,}) {
  return _then(_OrderDetailModel(
customerId: freezed == customerId ? _self.customerId : customerId // ignore: cast_nullable_to_non_nullable
as String?,customerName: freezed == customerName ? _self.customerName : customerName // ignore: cast_nullable_to_non_nullable
as String?,cashierId: freezed == cashierId ? _self.cashierId : cashierId // ignore: cast_nullable_to_non_nullable
as String?,phoneNumber: freezed == phoneNumber ? _self.phoneNumber : phoneNumber // ignore: cast_nullable_to_non_nullable
as String?,items: null == items ? _self._items : items // ignore: cast_nullable_to_non_nullable
as List<OrderItemModel>,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as String,deliveryAddress: freezed == deliveryAddress ? _self.deliveryAddress : deliveryAddress // ignore: cast_nullable_to_non_nullable
as String?,tableNumber: freezed == tableNumber ? _self.tableNumber : tableNumber // ignore: cast_nullable_to_non_nullable
as String?,paymentMethod: freezed == paymentMethod ? _self.paymentMethod : paymentMethod // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,subTotalPrice: freezed == subTotalPrice ? _self.subTotalPrice : subTotalPrice // ignore: cast_nullable_to_non_nullable
as int?,orderId: freezed == orderId ? _self.orderId : orderId // ignore: cast_nullable_to_non_nullable
as String?,tax: freezed == tax ? _self.tax : tax // ignore: cast_nullable_to_non_nullable
as int?,totalPrice: freezed == totalPrice ? _self.totalPrice : totalPrice // ignore: cast_nullable_to_non_nullable
as int?,serviceFee: freezed == serviceFee ? _self.serviceFee : serviceFee // ignore: cast_nullable_to_non_nullable
as int?,discounts: freezed == discounts ? _self._discounts : discounts // ignore: cast_nullable_to_non_nullable
as Map<String, int>?,
  ));
}


}

// dart format on
