// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
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
@HiveField(0)@JsonKey(name: 'order_id') String? get orderId;@HiveField(1)@JsonKey(name: 'user_id') String? get userId;@HiveField(2) String? get user;@HiveField(3) CashierModel? get cashier;// Item dan Status
@HiveField(4) List<OrderItemModel> get items;@HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson) OrderStatus get status;// Pembayaran & Tipe Order
@HiveField(6) String? get paymentMethod;@HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) OrderType get orderType;// Lokasi
@HiveField(8) String get deliveryAddress;@HiveField(9) String? get tableNumber;@HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson) LocationType get type;@HiveField(11) String? get outlet;// Diskon & Promo
@HiveField(12) DiscountModel? get discounts;@HiveField(13) List<AppliedPromosModel>? get appliedPromos;@HiveField(14) String? get appliedManualPromo;@HiveField(15) String? get appliedVoucher;// Pajak & Layanan
@HiveField(16) List<TaxServiceDetailModel> get taxAndServiceDetails;@HiveField(17) int get totalTax;@HiveField(18) int get totalServiceFee;// Total Harga,
@HiveField(19) int get totalBeforeDiscount;@HiveField(20) int get totalAfterDiscount;@HiveField(21) int get grandTotal;// Metadata
@HiveField(22) String? get source;@HiveField(23)@JsonKey(name: 'createdAtWIB') DateTime? get createdAt;@HiveField(24)@JsonKey(name: 'updatedAtWIB') DateTime? get updatedAt;@HiveField(25)@JsonKey(name: 'payment_details') List<PaymentModel> get payments;@HiveField(26) String? get paymentStatus;@HiveField(27)@JsonKey(name: '_id') String? get id;@HiveField(28) bool get isOpenBill;//nominal pembayaran,
@HiveField(29) int get paymentAmount;@HiveField(30) int get changeAmount;@HiveField(31) String? get paymentType;@HiveField(32) bool get isSplitPayment;@HiveField(33) int get printSequence;@HiveField(34) List<String> get printHistory;@HiveField(35) List<CustomAmountItemsModel>? get customAmountItems;@HiveField(36) int get totalCustomAmount;@HiveField(37) List<String> get selectedPromoIds;// Custom discount untuk order-level
@HiveField(38) CustomDiscountModel? get customDiscountDetails;
/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OrderDetailModelCopyWith<OrderDetailModel> get copyWith => _$OrderDetailModelCopyWithImpl<OrderDetailModel>(this as OrderDetailModel, _$identity);

  /// Serializes this OrderDetailModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OrderDetailModel&&(identical(other.orderId, orderId) || other.orderId == orderId)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.user, user) || other.user == user)&&(identical(other.cashier, cashier) || other.cashier == cashier)&&const DeepCollectionEquality().equals(other.items, items)&&(identical(other.status, status) || other.status == status)&&(identical(other.paymentMethod, paymentMethod) || other.paymentMethod == paymentMethod)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.deliveryAddress, deliveryAddress) || other.deliveryAddress == deliveryAddress)&&(identical(other.tableNumber, tableNumber) || other.tableNumber == tableNumber)&&(identical(other.type, type) || other.type == type)&&(identical(other.outlet, outlet) || other.outlet == outlet)&&(identical(other.discounts, discounts) || other.discounts == discounts)&&const DeepCollectionEquality().equals(other.appliedPromos, appliedPromos)&&(identical(other.appliedManualPromo, appliedManualPromo) || other.appliedManualPromo == appliedManualPromo)&&(identical(other.appliedVoucher, appliedVoucher) || other.appliedVoucher == appliedVoucher)&&const DeepCollectionEquality().equals(other.taxAndServiceDetails, taxAndServiceDetails)&&(identical(other.totalTax, totalTax) || other.totalTax == totalTax)&&(identical(other.totalServiceFee, totalServiceFee) || other.totalServiceFee == totalServiceFee)&&(identical(other.totalBeforeDiscount, totalBeforeDiscount) || other.totalBeforeDiscount == totalBeforeDiscount)&&(identical(other.totalAfterDiscount, totalAfterDiscount) || other.totalAfterDiscount == totalAfterDiscount)&&(identical(other.grandTotal, grandTotal) || other.grandTotal == grandTotal)&&(identical(other.source, source) || other.source == source)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&const DeepCollectionEquality().equals(other.payments, payments)&&(identical(other.paymentStatus, paymentStatus) || other.paymentStatus == paymentStatus)&&(identical(other.id, id) || other.id == id)&&(identical(other.isOpenBill, isOpenBill) || other.isOpenBill == isOpenBill)&&(identical(other.paymentAmount, paymentAmount) || other.paymentAmount == paymentAmount)&&(identical(other.changeAmount, changeAmount) || other.changeAmount == changeAmount)&&(identical(other.paymentType, paymentType) || other.paymentType == paymentType)&&(identical(other.isSplitPayment, isSplitPayment) || other.isSplitPayment == isSplitPayment)&&(identical(other.printSequence, printSequence) || other.printSequence == printSequence)&&const DeepCollectionEquality().equals(other.printHistory, printHistory)&&const DeepCollectionEquality().equals(other.customAmountItems, customAmountItems)&&(identical(other.totalCustomAmount, totalCustomAmount) || other.totalCustomAmount == totalCustomAmount)&&const DeepCollectionEquality().equals(other.selectedPromoIds, selectedPromoIds)&&(identical(other.customDiscountDetails, customDiscountDetails) || other.customDiscountDetails == customDiscountDetails));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,orderId,userId,user,cashier,const DeepCollectionEquality().hash(items),status,paymentMethod,orderType,deliveryAddress,tableNumber,type,outlet,discounts,const DeepCollectionEquality().hash(appliedPromos),appliedManualPromo,appliedVoucher,const DeepCollectionEquality().hash(taxAndServiceDetails),totalTax,totalServiceFee,totalBeforeDiscount,totalAfterDiscount,grandTotal,source,createdAt,updatedAt,const DeepCollectionEquality().hash(payments),paymentStatus,id,isOpenBill,paymentAmount,changeAmount,paymentType,isSplitPayment,printSequence,const DeepCollectionEquality().hash(printHistory),const DeepCollectionEquality().hash(customAmountItems),totalCustomAmount,const DeepCollectionEquality().hash(selectedPromoIds),customDiscountDetails]);

@override
String toString() {
  return 'OrderDetailModel(orderId: $orderId, userId: $userId, user: $user, cashier: $cashier, items: $items, status: $status, paymentMethod: $paymentMethod, orderType: $orderType, deliveryAddress: $deliveryAddress, tableNumber: $tableNumber, type: $type, outlet: $outlet, discounts: $discounts, appliedPromos: $appliedPromos, appliedManualPromo: $appliedManualPromo, appliedVoucher: $appliedVoucher, taxAndServiceDetails: $taxAndServiceDetails, totalTax: $totalTax, totalServiceFee: $totalServiceFee, totalBeforeDiscount: $totalBeforeDiscount, totalAfterDiscount: $totalAfterDiscount, grandTotal: $grandTotal, source: $source, createdAt: $createdAt, updatedAt: $updatedAt, payments: $payments, paymentStatus: $paymentStatus, id: $id, isOpenBill: $isOpenBill, paymentAmount: $paymentAmount, changeAmount: $changeAmount, paymentType: $paymentType, isSplitPayment: $isSplitPayment, printSequence: $printSequence, printHistory: $printHistory, customAmountItems: $customAmountItems, totalCustomAmount: $totalCustomAmount, selectedPromoIds: $selectedPromoIds, customDiscountDetails: $customDiscountDetails)';
}


}

/// @nodoc
abstract mixin class $OrderDetailModelCopyWith<$Res>  {
  factory $OrderDetailModelCopyWith(OrderDetailModel value, $Res Function(OrderDetailModel) _then) = _$OrderDetailModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: 'order_id') String? orderId,@HiveField(1)@JsonKey(name: 'user_id') String? userId,@HiveField(2) String? user,@HiveField(3) CashierModel? cashier,@HiveField(4) List<OrderItemModel> items,@HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson) OrderStatus status,@HiveField(6) String? paymentMethod,@HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) OrderType orderType,@HiveField(8) String deliveryAddress,@HiveField(9) String? tableNumber,@HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson) LocationType type,@HiveField(11) String? outlet,@HiveField(12) DiscountModel? discounts,@HiveField(13) List<AppliedPromosModel>? appliedPromos,@HiveField(14) String? appliedManualPromo,@HiveField(15) String? appliedVoucher,@HiveField(16) List<TaxServiceDetailModel> taxAndServiceDetails,@HiveField(17) int totalTax,@HiveField(18) int totalServiceFee,@HiveField(19) int totalBeforeDiscount,@HiveField(20) int totalAfterDiscount,@HiveField(21) int grandTotal,@HiveField(22) String? source,@HiveField(23)@JsonKey(name: 'createdAtWIB') DateTime? createdAt,@HiveField(24)@JsonKey(name: 'updatedAtWIB') DateTime? updatedAt,@HiveField(25)@JsonKey(name: 'payment_details') List<PaymentModel> payments,@HiveField(26) String? paymentStatus,@HiveField(27)@JsonKey(name: '_id') String? id,@HiveField(28) bool isOpenBill,@HiveField(29) int paymentAmount,@HiveField(30) int changeAmount,@HiveField(31) String? paymentType,@HiveField(32) bool isSplitPayment,@HiveField(33) int printSequence,@HiveField(34) List<String> printHistory,@HiveField(35) List<CustomAmountItemsModel>? customAmountItems,@HiveField(36) int totalCustomAmount,@HiveField(37) List<String> selectedPromoIds,@HiveField(38) CustomDiscountModel? customDiscountDetails
});


$DiscountModelCopyWith<$Res>? get discounts;$CustomDiscountModelCopyWith<$Res>? get customDiscountDetails;

}
/// @nodoc
class _$OrderDetailModelCopyWithImpl<$Res>
    implements $OrderDetailModelCopyWith<$Res> {
  _$OrderDetailModelCopyWithImpl(this._self, this._then);

  final OrderDetailModel _self;
  final $Res Function(OrderDetailModel) _then;

/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? orderId = freezed,Object? userId = freezed,Object? user = freezed,Object? cashier = freezed,Object? items = null,Object? status = null,Object? paymentMethod = freezed,Object? orderType = null,Object? deliveryAddress = null,Object? tableNumber = freezed,Object? type = null,Object? outlet = freezed,Object? discounts = freezed,Object? appliedPromos = freezed,Object? appliedManualPromo = freezed,Object? appliedVoucher = freezed,Object? taxAndServiceDetails = null,Object? totalTax = null,Object? totalServiceFee = null,Object? totalBeforeDiscount = null,Object? totalAfterDiscount = null,Object? grandTotal = null,Object? source = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,Object? payments = null,Object? paymentStatus = freezed,Object? id = freezed,Object? isOpenBill = null,Object? paymentAmount = null,Object? changeAmount = null,Object? paymentType = freezed,Object? isSplitPayment = null,Object? printSequence = null,Object? printHistory = null,Object? customAmountItems = freezed,Object? totalCustomAmount = null,Object? selectedPromoIds = null,Object? customDiscountDetails = freezed,}) {
  return _then(_self.copyWith(
orderId: freezed == orderId ? _self.orderId : orderId // ignore: cast_nullable_to_non_nullable
as String?,userId: freezed == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String?,user: freezed == user ? _self.user : user // ignore: cast_nullable_to_non_nullable
as String?,cashier: freezed == cashier ? _self.cashier : cashier // ignore: cast_nullable_to_non_nullable
as CashierModel?,items: null == items ? _self.items : items // ignore: cast_nullable_to_non_nullable
as List<OrderItemModel>,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as OrderStatus,paymentMethod: freezed == paymentMethod ? _self.paymentMethod : paymentMethod // ignore: cast_nullable_to_non_nullable
as String?,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as OrderType,deliveryAddress: null == deliveryAddress ? _self.deliveryAddress : deliveryAddress // ignore: cast_nullable_to_non_nullable
as String,tableNumber: freezed == tableNumber ? _self.tableNumber : tableNumber // ignore: cast_nullable_to_non_nullable
as String?,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as LocationType,outlet: freezed == outlet ? _self.outlet : outlet // ignore: cast_nullable_to_non_nullable
as String?,discounts: freezed == discounts ? _self.discounts : discounts // ignore: cast_nullable_to_non_nullable
as DiscountModel?,appliedPromos: freezed == appliedPromos ? _self.appliedPromos : appliedPromos // ignore: cast_nullable_to_non_nullable
as List<AppliedPromosModel>?,appliedManualPromo: freezed == appliedManualPromo ? _self.appliedManualPromo : appliedManualPromo // ignore: cast_nullable_to_non_nullable
as String?,appliedVoucher: freezed == appliedVoucher ? _self.appliedVoucher : appliedVoucher // ignore: cast_nullable_to_non_nullable
as String?,taxAndServiceDetails: null == taxAndServiceDetails ? _self.taxAndServiceDetails : taxAndServiceDetails // ignore: cast_nullable_to_non_nullable
as List<TaxServiceDetailModel>,totalTax: null == totalTax ? _self.totalTax : totalTax // ignore: cast_nullable_to_non_nullable
as int,totalServiceFee: null == totalServiceFee ? _self.totalServiceFee : totalServiceFee // ignore: cast_nullable_to_non_nullable
as int,totalBeforeDiscount: null == totalBeforeDiscount ? _self.totalBeforeDiscount : totalBeforeDiscount // ignore: cast_nullable_to_non_nullable
as int,totalAfterDiscount: null == totalAfterDiscount ? _self.totalAfterDiscount : totalAfterDiscount // ignore: cast_nullable_to_non_nullable
as int,grandTotal: null == grandTotal ? _self.grandTotal : grandTotal // ignore: cast_nullable_to_non_nullable
as int,source: freezed == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,payments: null == payments ? _self.payments : payments // ignore: cast_nullable_to_non_nullable
as List<PaymentModel>,paymentStatus: freezed == paymentStatus ? _self.paymentStatus : paymentStatus // ignore: cast_nullable_to_non_nullable
as String?,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,isOpenBill: null == isOpenBill ? _self.isOpenBill : isOpenBill // ignore: cast_nullable_to_non_nullable
as bool,paymentAmount: null == paymentAmount ? _self.paymentAmount : paymentAmount // ignore: cast_nullable_to_non_nullable
as int,changeAmount: null == changeAmount ? _self.changeAmount : changeAmount // ignore: cast_nullable_to_non_nullable
as int,paymentType: freezed == paymentType ? _self.paymentType : paymentType // ignore: cast_nullable_to_non_nullable
as String?,isSplitPayment: null == isSplitPayment ? _self.isSplitPayment : isSplitPayment // ignore: cast_nullable_to_non_nullable
as bool,printSequence: null == printSequence ? _self.printSequence : printSequence // ignore: cast_nullable_to_non_nullable
as int,printHistory: null == printHistory ? _self.printHistory : printHistory // ignore: cast_nullable_to_non_nullable
as List<String>,customAmountItems: freezed == customAmountItems ? _self.customAmountItems : customAmountItems // ignore: cast_nullable_to_non_nullable
as List<CustomAmountItemsModel>?,totalCustomAmount: null == totalCustomAmount ? _self.totalCustomAmount : totalCustomAmount // ignore: cast_nullable_to_non_nullable
as int,selectedPromoIds: null == selectedPromoIds ? _self.selectedPromoIds : selectedPromoIds // ignore: cast_nullable_to_non_nullable
as List<String>,customDiscountDetails: freezed == customDiscountDetails ? _self.customDiscountDetails : customDiscountDetails // ignore: cast_nullable_to_non_nullable
as CustomDiscountModel?,
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
}/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CustomDiscountModelCopyWith<$Res>? get customDiscountDetails {
    if (_self.customDiscountDetails == null) {
    return null;
  }

  return $CustomDiscountModelCopyWith<$Res>(_self.customDiscountDetails!, (value) {
    return _then(_self.copyWith(customDiscountDetails: value));
  });
}
}


/// Adds pattern-matching-related methods to [OrderDetailModel].
extension OrderDetailModelPatterns on OrderDetailModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OrderDetailModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OrderDetailModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OrderDetailModel value)  $default,){
final _that = this;
switch (_that) {
case _OrderDetailModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OrderDetailModel value)?  $default,){
final _that = this;
switch (_that) {
case _OrderDetailModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: 'order_id')  String? orderId, @HiveField(1)@JsonKey(name: 'user_id')  String? userId, @HiveField(2)  String? user, @HiveField(3)  CashierModel? cashier, @HiveField(4)  List<OrderItemModel> items, @HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson)  OrderStatus status, @HiveField(6)  String? paymentMethod, @HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson)  OrderType orderType, @HiveField(8)  String deliveryAddress, @HiveField(9)  String? tableNumber, @HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson)  LocationType type, @HiveField(11)  String? outlet, @HiveField(12)  DiscountModel? discounts, @HiveField(13)  List<AppliedPromosModel>? appliedPromos, @HiveField(14)  String? appliedManualPromo, @HiveField(15)  String? appliedVoucher, @HiveField(16)  List<TaxServiceDetailModel> taxAndServiceDetails, @HiveField(17)  int totalTax, @HiveField(18)  int totalServiceFee, @HiveField(19)  int totalBeforeDiscount, @HiveField(20)  int totalAfterDiscount, @HiveField(21)  int grandTotal, @HiveField(22)  String? source, @HiveField(23)@JsonKey(name: 'createdAtWIB')  DateTime? createdAt, @HiveField(24)@JsonKey(name: 'updatedAtWIB')  DateTime? updatedAt, @HiveField(25)@JsonKey(name: 'payment_details')  List<PaymentModel> payments, @HiveField(26)  String? paymentStatus, @HiveField(27)@JsonKey(name: '_id')  String? id, @HiveField(28)  bool isOpenBill, @HiveField(29)  int paymentAmount, @HiveField(30)  int changeAmount, @HiveField(31)  String? paymentType, @HiveField(32)  bool isSplitPayment, @HiveField(33)  int printSequence, @HiveField(34)  List<String> printHistory, @HiveField(35)  List<CustomAmountItemsModel>? customAmountItems, @HiveField(36)  int totalCustomAmount, @HiveField(37)  List<String> selectedPromoIds, @HiveField(38)  CustomDiscountModel? customDiscountDetails)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OrderDetailModel() when $default != null:
return $default(_that.orderId,_that.userId,_that.user,_that.cashier,_that.items,_that.status,_that.paymentMethod,_that.orderType,_that.deliveryAddress,_that.tableNumber,_that.type,_that.outlet,_that.discounts,_that.appliedPromos,_that.appliedManualPromo,_that.appliedVoucher,_that.taxAndServiceDetails,_that.totalTax,_that.totalServiceFee,_that.totalBeforeDiscount,_that.totalAfterDiscount,_that.grandTotal,_that.source,_that.createdAt,_that.updatedAt,_that.payments,_that.paymentStatus,_that.id,_that.isOpenBill,_that.paymentAmount,_that.changeAmount,_that.paymentType,_that.isSplitPayment,_that.printSequence,_that.printHistory,_that.customAmountItems,_that.totalCustomAmount,_that.selectedPromoIds,_that.customDiscountDetails);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: 'order_id')  String? orderId, @HiveField(1)@JsonKey(name: 'user_id')  String? userId, @HiveField(2)  String? user, @HiveField(3)  CashierModel? cashier, @HiveField(4)  List<OrderItemModel> items, @HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson)  OrderStatus status, @HiveField(6)  String? paymentMethod, @HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson)  OrderType orderType, @HiveField(8)  String deliveryAddress, @HiveField(9)  String? tableNumber, @HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson)  LocationType type, @HiveField(11)  String? outlet, @HiveField(12)  DiscountModel? discounts, @HiveField(13)  List<AppliedPromosModel>? appliedPromos, @HiveField(14)  String? appliedManualPromo, @HiveField(15)  String? appliedVoucher, @HiveField(16)  List<TaxServiceDetailModel> taxAndServiceDetails, @HiveField(17)  int totalTax, @HiveField(18)  int totalServiceFee, @HiveField(19)  int totalBeforeDiscount, @HiveField(20)  int totalAfterDiscount, @HiveField(21)  int grandTotal, @HiveField(22)  String? source, @HiveField(23)@JsonKey(name: 'createdAtWIB')  DateTime? createdAt, @HiveField(24)@JsonKey(name: 'updatedAtWIB')  DateTime? updatedAt, @HiveField(25)@JsonKey(name: 'payment_details')  List<PaymentModel> payments, @HiveField(26)  String? paymentStatus, @HiveField(27)@JsonKey(name: '_id')  String? id, @HiveField(28)  bool isOpenBill, @HiveField(29)  int paymentAmount, @HiveField(30)  int changeAmount, @HiveField(31)  String? paymentType, @HiveField(32)  bool isSplitPayment, @HiveField(33)  int printSequence, @HiveField(34)  List<String> printHistory, @HiveField(35)  List<CustomAmountItemsModel>? customAmountItems, @HiveField(36)  int totalCustomAmount, @HiveField(37)  List<String> selectedPromoIds, @HiveField(38)  CustomDiscountModel? customDiscountDetails)  $default,) {final _that = this;
switch (_that) {
case _OrderDetailModel():
return $default(_that.orderId,_that.userId,_that.user,_that.cashier,_that.items,_that.status,_that.paymentMethod,_that.orderType,_that.deliveryAddress,_that.tableNumber,_that.type,_that.outlet,_that.discounts,_that.appliedPromos,_that.appliedManualPromo,_that.appliedVoucher,_that.taxAndServiceDetails,_that.totalTax,_that.totalServiceFee,_that.totalBeforeDiscount,_that.totalAfterDiscount,_that.grandTotal,_that.source,_that.createdAt,_that.updatedAt,_that.payments,_that.paymentStatus,_that.id,_that.isOpenBill,_that.paymentAmount,_that.changeAmount,_that.paymentType,_that.isSplitPayment,_that.printSequence,_that.printHistory,_that.customAmountItems,_that.totalCustomAmount,_that.selectedPromoIds,_that.customDiscountDetails);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)@JsonKey(name: 'order_id')  String? orderId, @HiveField(1)@JsonKey(name: 'user_id')  String? userId, @HiveField(2)  String? user, @HiveField(3)  CashierModel? cashier, @HiveField(4)  List<OrderItemModel> items, @HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson)  OrderStatus status, @HiveField(6)  String? paymentMethod, @HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson)  OrderType orderType, @HiveField(8)  String deliveryAddress, @HiveField(9)  String? tableNumber, @HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson)  LocationType type, @HiveField(11)  String? outlet, @HiveField(12)  DiscountModel? discounts, @HiveField(13)  List<AppliedPromosModel>? appliedPromos, @HiveField(14)  String? appliedManualPromo, @HiveField(15)  String? appliedVoucher, @HiveField(16)  List<TaxServiceDetailModel> taxAndServiceDetails, @HiveField(17)  int totalTax, @HiveField(18)  int totalServiceFee, @HiveField(19)  int totalBeforeDiscount, @HiveField(20)  int totalAfterDiscount, @HiveField(21)  int grandTotal, @HiveField(22)  String? source, @HiveField(23)@JsonKey(name: 'createdAtWIB')  DateTime? createdAt, @HiveField(24)@JsonKey(name: 'updatedAtWIB')  DateTime? updatedAt, @HiveField(25)@JsonKey(name: 'payment_details')  List<PaymentModel> payments, @HiveField(26)  String? paymentStatus, @HiveField(27)@JsonKey(name: '_id')  String? id, @HiveField(28)  bool isOpenBill, @HiveField(29)  int paymentAmount, @HiveField(30)  int changeAmount, @HiveField(31)  String? paymentType, @HiveField(32)  bool isSplitPayment, @HiveField(33)  int printSequence, @HiveField(34)  List<String> printHistory, @HiveField(35)  List<CustomAmountItemsModel>? customAmountItems, @HiveField(36)  int totalCustomAmount, @HiveField(37)  List<String> selectedPromoIds, @HiveField(38)  CustomDiscountModel? customDiscountDetails)?  $default,) {final _that = this;
switch (_that) {
case _OrderDetailModel() when $default != null:
return $default(_that.orderId,_that.userId,_that.user,_that.cashier,_that.items,_that.status,_that.paymentMethod,_that.orderType,_that.deliveryAddress,_that.tableNumber,_that.type,_that.outlet,_that.discounts,_that.appliedPromos,_that.appliedManualPromo,_that.appliedVoucher,_that.taxAndServiceDetails,_that.totalTax,_that.totalServiceFee,_that.totalBeforeDiscount,_that.totalAfterDiscount,_that.grandTotal,_that.source,_that.createdAt,_that.updatedAt,_that.payments,_that.paymentStatus,_that.id,_that.isOpenBill,_that.paymentAmount,_that.changeAmount,_that.paymentType,_that.isSplitPayment,_that.printSequence,_that.printHistory,_that.customAmountItems,_that.totalCustomAmount,_that.selectedPromoIds,_that.customDiscountDetails);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OrderDetailModel implements OrderDetailModel {
   _OrderDetailModel({@HiveField(0)@JsonKey(name: 'order_id') this.orderId = null, @HiveField(1)@JsonKey(name: 'user_id') this.userId, @HiveField(2) this.user = null, @HiveField(3) this.cashier = null, @HiveField(4) final  List<OrderItemModel> items = const [], @HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson) this.status = OrderStatus.unknown, @HiveField(6) this.paymentMethod = null, @HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) required this.orderType, @HiveField(8) this.deliveryAddress = '', @HiveField(9) this.tableNumber = '', @HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson) this.type = LocationType.indoor, @HiveField(11) this.outlet, @HiveField(12) this.discounts, @HiveField(13) final  List<AppliedPromosModel>? appliedPromos = const [], @HiveField(14) this.appliedManualPromo = null, @HiveField(15) this.appliedVoucher = null, @HiveField(16) final  List<TaxServiceDetailModel> taxAndServiceDetails = const [], @HiveField(17) this.totalTax = 0, @HiveField(18) this.totalServiceFee = 0, @HiveField(19) this.totalBeforeDiscount = 0, @HiveField(20) this.totalAfterDiscount = 0, @HiveField(21) this.grandTotal = 0, @HiveField(22) this.source = null, @HiveField(23)@JsonKey(name: 'createdAtWIB') this.createdAt, @HiveField(24)@JsonKey(name: 'updatedAtWIB') this.updatedAt, @HiveField(25)@JsonKey(name: 'payment_details') final  List<PaymentModel> payments = const <PaymentModel>[], @HiveField(26) this.paymentStatus = null, @HiveField(27)@JsonKey(name: '_id') this.id = null, @HiveField(28) this.isOpenBill = false, @HiveField(29) this.paymentAmount = 0, @HiveField(30) this.changeAmount = 0, @HiveField(31) this.paymentType = null, @HiveField(32) this.isSplitPayment = false, @HiveField(33) this.printSequence = 0, @HiveField(34) final  List<String> printHistory = const [], @HiveField(35) final  List<CustomAmountItemsModel>? customAmountItems = null, @HiveField(36) this.totalCustomAmount = 0, @HiveField(37) final  List<String> selectedPromoIds = const <String>[], @HiveField(38) this.customDiscountDetails = null}): _items = items,_appliedPromos = appliedPromos,_taxAndServiceDetails = taxAndServiceDetails,_payments = payments,_printHistory = printHistory,_customAmountItems = customAmountItems,_selectedPromoIds = selectedPromoIds;
  factory _OrderDetailModel.fromJson(Map<String, dynamic> json) => _$OrderDetailModelFromJson(json);

// Identitas Order
@override@HiveField(0)@JsonKey(name: 'order_id') final  String? orderId;
@override@HiveField(1)@JsonKey(name: 'user_id') final  String? userId;
@override@JsonKey()@HiveField(2) final  String? user;
@override@JsonKey()@HiveField(3) final  CashierModel? cashier;
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
 final  List<AppliedPromosModel>? _appliedPromos;
@override@JsonKey()@HiveField(13) List<AppliedPromosModel>? get appliedPromos {
  final value = _appliedPromos;
  if (value == null) return null;
  if (_appliedPromos is EqualUnmodifiableListView) return _appliedPromos;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override@JsonKey()@HiveField(14) final  String? appliedManualPromo;
@override@JsonKey()@HiveField(15) final  String? appliedVoucher;
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
@override@JsonKey()@HiveField(22) final  String? source;
@override@HiveField(23)@JsonKey(name: 'createdAtWIB') final  DateTime? createdAt;
@override@HiveField(24)@JsonKey(name: 'updatedAtWIB') final  DateTime? updatedAt;
 final  List<PaymentModel> _payments;
@override@HiveField(25)@JsonKey(name: 'payment_details') List<PaymentModel> get payments {
  if (_payments is EqualUnmodifiableListView) return _payments;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_payments);
}

@override@JsonKey()@HiveField(26) final  String? paymentStatus;
@override@HiveField(27)@JsonKey(name: '_id') final  String? id;
@override@JsonKey()@HiveField(28) final  bool isOpenBill;
//nominal pembayaran,
@override@JsonKey()@HiveField(29) final  int paymentAmount;
@override@JsonKey()@HiveField(30) final  int changeAmount;
@override@JsonKey()@HiveField(31) final  String? paymentType;
@override@JsonKey()@HiveField(32) final  bool isSplitPayment;
@override@JsonKey()@HiveField(33) final  int printSequence;
 final  List<String> _printHistory;
@override@JsonKey()@HiveField(34) List<String> get printHistory {
  if (_printHistory is EqualUnmodifiableListView) return _printHistory;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_printHistory);
}

 final  List<CustomAmountItemsModel>? _customAmountItems;
@override@JsonKey()@HiveField(35) List<CustomAmountItemsModel>? get customAmountItems {
  final value = _customAmountItems;
  if (value == null) return null;
  if (_customAmountItems is EqualUnmodifiableListView) return _customAmountItems;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override@JsonKey()@HiveField(36) final  int totalCustomAmount;
 final  List<String> _selectedPromoIds;
@override@JsonKey()@HiveField(37) List<String> get selectedPromoIds {
  if (_selectedPromoIds is EqualUnmodifiableListView) return _selectedPromoIds;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_selectedPromoIds);
}

// Custom discount untuk order-level
@override@JsonKey()@HiveField(38) final  CustomDiscountModel? customDiscountDetails;

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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OrderDetailModel&&(identical(other.orderId, orderId) || other.orderId == orderId)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.user, user) || other.user == user)&&(identical(other.cashier, cashier) || other.cashier == cashier)&&const DeepCollectionEquality().equals(other._items, _items)&&(identical(other.status, status) || other.status == status)&&(identical(other.paymentMethod, paymentMethod) || other.paymentMethod == paymentMethod)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.deliveryAddress, deliveryAddress) || other.deliveryAddress == deliveryAddress)&&(identical(other.tableNumber, tableNumber) || other.tableNumber == tableNumber)&&(identical(other.type, type) || other.type == type)&&(identical(other.outlet, outlet) || other.outlet == outlet)&&(identical(other.discounts, discounts) || other.discounts == discounts)&&const DeepCollectionEquality().equals(other._appliedPromos, _appliedPromos)&&(identical(other.appliedManualPromo, appliedManualPromo) || other.appliedManualPromo == appliedManualPromo)&&(identical(other.appliedVoucher, appliedVoucher) || other.appliedVoucher == appliedVoucher)&&const DeepCollectionEquality().equals(other._taxAndServiceDetails, _taxAndServiceDetails)&&(identical(other.totalTax, totalTax) || other.totalTax == totalTax)&&(identical(other.totalServiceFee, totalServiceFee) || other.totalServiceFee == totalServiceFee)&&(identical(other.totalBeforeDiscount, totalBeforeDiscount) || other.totalBeforeDiscount == totalBeforeDiscount)&&(identical(other.totalAfterDiscount, totalAfterDiscount) || other.totalAfterDiscount == totalAfterDiscount)&&(identical(other.grandTotal, grandTotal) || other.grandTotal == grandTotal)&&(identical(other.source, source) || other.source == source)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&const DeepCollectionEquality().equals(other._payments, _payments)&&(identical(other.paymentStatus, paymentStatus) || other.paymentStatus == paymentStatus)&&(identical(other.id, id) || other.id == id)&&(identical(other.isOpenBill, isOpenBill) || other.isOpenBill == isOpenBill)&&(identical(other.paymentAmount, paymentAmount) || other.paymentAmount == paymentAmount)&&(identical(other.changeAmount, changeAmount) || other.changeAmount == changeAmount)&&(identical(other.paymentType, paymentType) || other.paymentType == paymentType)&&(identical(other.isSplitPayment, isSplitPayment) || other.isSplitPayment == isSplitPayment)&&(identical(other.printSequence, printSequence) || other.printSequence == printSequence)&&const DeepCollectionEquality().equals(other._printHistory, _printHistory)&&const DeepCollectionEquality().equals(other._customAmountItems, _customAmountItems)&&(identical(other.totalCustomAmount, totalCustomAmount) || other.totalCustomAmount == totalCustomAmount)&&const DeepCollectionEquality().equals(other._selectedPromoIds, _selectedPromoIds)&&(identical(other.customDiscountDetails, customDiscountDetails) || other.customDiscountDetails == customDiscountDetails));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,orderId,userId,user,cashier,const DeepCollectionEquality().hash(_items),status,paymentMethod,orderType,deliveryAddress,tableNumber,type,outlet,discounts,const DeepCollectionEquality().hash(_appliedPromos),appliedManualPromo,appliedVoucher,const DeepCollectionEquality().hash(_taxAndServiceDetails),totalTax,totalServiceFee,totalBeforeDiscount,totalAfterDiscount,grandTotal,source,createdAt,updatedAt,const DeepCollectionEquality().hash(_payments),paymentStatus,id,isOpenBill,paymentAmount,changeAmount,paymentType,isSplitPayment,printSequence,const DeepCollectionEquality().hash(_printHistory),const DeepCollectionEquality().hash(_customAmountItems),totalCustomAmount,const DeepCollectionEquality().hash(_selectedPromoIds),customDiscountDetails]);

@override
String toString() {
  return 'OrderDetailModel(orderId: $orderId, userId: $userId, user: $user, cashier: $cashier, items: $items, status: $status, paymentMethod: $paymentMethod, orderType: $orderType, deliveryAddress: $deliveryAddress, tableNumber: $tableNumber, type: $type, outlet: $outlet, discounts: $discounts, appliedPromos: $appliedPromos, appliedManualPromo: $appliedManualPromo, appliedVoucher: $appliedVoucher, taxAndServiceDetails: $taxAndServiceDetails, totalTax: $totalTax, totalServiceFee: $totalServiceFee, totalBeforeDiscount: $totalBeforeDiscount, totalAfterDiscount: $totalAfterDiscount, grandTotal: $grandTotal, source: $source, createdAt: $createdAt, updatedAt: $updatedAt, payments: $payments, paymentStatus: $paymentStatus, id: $id, isOpenBill: $isOpenBill, paymentAmount: $paymentAmount, changeAmount: $changeAmount, paymentType: $paymentType, isSplitPayment: $isSplitPayment, printSequence: $printSequence, printHistory: $printHistory, customAmountItems: $customAmountItems, totalCustomAmount: $totalCustomAmount, selectedPromoIds: $selectedPromoIds, customDiscountDetails: $customDiscountDetails)';
}


}

/// @nodoc
abstract mixin class _$OrderDetailModelCopyWith<$Res> implements $OrderDetailModelCopyWith<$Res> {
  factory _$OrderDetailModelCopyWith(_OrderDetailModel value, $Res Function(_OrderDetailModel) _then) = __$OrderDetailModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: 'order_id') String? orderId,@HiveField(1)@JsonKey(name: 'user_id') String? userId,@HiveField(2) String? user,@HiveField(3) CashierModel? cashier,@HiveField(4) List<OrderItemModel> items,@HiveField(5)@JsonKey(fromJson: OrderStatusExtension.fromString, toJson: OrderStatusExtension.orderStatusToJson) OrderStatus status,@HiveField(6) String? paymentMethod,@HiveField(7)@JsonKey(fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) OrderType orderType,@HiveField(8) String deliveryAddress,@HiveField(9) String? tableNumber,@HiveField(10)@JsonKey(fromJson: LocationTypeExtension.fromString, toJson: LocationTypeExtension.locationTypeToJson) LocationType type,@HiveField(11) String? outlet,@HiveField(12) DiscountModel? discounts,@HiveField(13) List<AppliedPromosModel>? appliedPromos,@HiveField(14) String? appliedManualPromo,@HiveField(15) String? appliedVoucher,@HiveField(16) List<TaxServiceDetailModel> taxAndServiceDetails,@HiveField(17) int totalTax,@HiveField(18) int totalServiceFee,@HiveField(19) int totalBeforeDiscount,@HiveField(20) int totalAfterDiscount,@HiveField(21) int grandTotal,@HiveField(22) String? source,@HiveField(23)@JsonKey(name: 'createdAtWIB') DateTime? createdAt,@HiveField(24)@JsonKey(name: 'updatedAtWIB') DateTime? updatedAt,@HiveField(25)@JsonKey(name: 'payment_details') List<PaymentModel> payments,@HiveField(26) String? paymentStatus,@HiveField(27)@JsonKey(name: '_id') String? id,@HiveField(28) bool isOpenBill,@HiveField(29) int paymentAmount,@HiveField(30) int changeAmount,@HiveField(31) String? paymentType,@HiveField(32) bool isSplitPayment,@HiveField(33) int printSequence,@HiveField(34) List<String> printHistory,@HiveField(35) List<CustomAmountItemsModel>? customAmountItems,@HiveField(36) int totalCustomAmount,@HiveField(37) List<String> selectedPromoIds,@HiveField(38) CustomDiscountModel? customDiscountDetails
});


@override $DiscountModelCopyWith<$Res>? get discounts;@override $CustomDiscountModelCopyWith<$Res>? get customDiscountDetails;

}
/// @nodoc
class __$OrderDetailModelCopyWithImpl<$Res>
    implements _$OrderDetailModelCopyWith<$Res> {
  __$OrderDetailModelCopyWithImpl(this._self, this._then);

  final _OrderDetailModel _self;
  final $Res Function(_OrderDetailModel) _then;

/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? orderId = freezed,Object? userId = freezed,Object? user = freezed,Object? cashier = freezed,Object? items = null,Object? status = null,Object? paymentMethod = freezed,Object? orderType = null,Object? deliveryAddress = null,Object? tableNumber = freezed,Object? type = null,Object? outlet = freezed,Object? discounts = freezed,Object? appliedPromos = freezed,Object? appliedManualPromo = freezed,Object? appliedVoucher = freezed,Object? taxAndServiceDetails = null,Object? totalTax = null,Object? totalServiceFee = null,Object? totalBeforeDiscount = null,Object? totalAfterDiscount = null,Object? grandTotal = null,Object? source = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,Object? payments = null,Object? paymentStatus = freezed,Object? id = freezed,Object? isOpenBill = null,Object? paymentAmount = null,Object? changeAmount = null,Object? paymentType = freezed,Object? isSplitPayment = null,Object? printSequence = null,Object? printHistory = null,Object? customAmountItems = freezed,Object? totalCustomAmount = null,Object? selectedPromoIds = null,Object? customDiscountDetails = freezed,}) {
  return _then(_OrderDetailModel(
orderId: freezed == orderId ? _self.orderId : orderId // ignore: cast_nullable_to_non_nullable
as String?,userId: freezed == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String?,user: freezed == user ? _self.user : user // ignore: cast_nullable_to_non_nullable
as String?,cashier: freezed == cashier ? _self.cashier : cashier // ignore: cast_nullable_to_non_nullable
as CashierModel?,items: null == items ? _self._items : items // ignore: cast_nullable_to_non_nullable
as List<OrderItemModel>,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as OrderStatus,paymentMethod: freezed == paymentMethod ? _self.paymentMethod : paymentMethod // ignore: cast_nullable_to_non_nullable
as String?,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as OrderType,deliveryAddress: null == deliveryAddress ? _self.deliveryAddress : deliveryAddress // ignore: cast_nullable_to_non_nullable
as String,tableNumber: freezed == tableNumber ? _self.tableNumber : tableNumber // ignore: cast_nullable_to_non_nullable
as String?,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as LocationType,outlet: freezed == outlet ? _self.outlet : outlet // ignore: cast_nullable_to_non_nullable
as String?,discounts: freezed == discounts ? _self.discounts : discounts // ignore: cast_nullable_to_non_nullable
as DiscountModel?,appliedPromos: freezed == appliedPromos ? _self._appliedPromos : appliedPromos // ignore: cast_nullable_to_non_nullable
as List<AppliedPromosModel>?,appliedManualPromo: freezed == appliedManualPromo ? _self.appliedManualPromo : appliedManualPromo // ignore: cast_nullable_to_non_nullable
as String?,appliedVoucher: freezed == appliedVoucher ? _self.appliedVoucher : appliedVoucher // ignore: cast_nullable_to_non_nullable
as String?,taxAndServiceDetails: null == taxAndServiceDetails ? _self._taxAndServiceDetails : taxAndServiceDetails // ignore: cast_nullable_to_non_nullable
as List<TaxServiceDetailModel>,totalTax: null == totalTax ? _self.totalTax : totalTax // ignore: cast_nullable_to_non_nullable
as int,totalServiceFee: null == totalServiceFee ? _self.totalServiceFee : totalServiceFee // ignore: cast_nullable_to_non_nullable
as int,totalBeforeDiscount: null == totalBeforeDiscount ? _self.totalBeforeDiscount : totalBeforeDiscount // ignore: cast_nullable_to_non_nullable
as int,totalAfterDiscount: null == totalAfterDiscount ? _self.totalAfterDiscount : totalAfterDiscount // ignore: cast_nullable_to_non_nullable
as int,grandTotal: null == grandTotal ? _self.grandTotal : grandTotal // ignore: cast_nullable_to_non_nullable
as int,source: freezed == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,payments: null == payments ? _self._payments : payments // ignore: cast_nullable_to_non_nullable
as List<PaymentModel>,paymentStatus: freezed == paymentStatus ? _self.paymentStatus : paymentStatus // ignore: cast_nullable_to_non_nullable
as String?,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,isOpenBill: null == isOpenBill ? _self.isOpenBill : isOpenBill // ignore: cast_nullable_to_non_nullable
as bool,paymentAmount: null == paymentAmount ? _self.paymentAmount : paymentAmount // ignore: cast_nullable_to_non_nullable
as int,changeAmount: null == changeAmount ? _self.changeAmount : changeAmount // ignore: cast_nullable_to_non_nullable
as int,paymentType: freezed == paymentType ? _self.paymentType : paymentType // ignore: cast_nullable_to_non_nullable
as String?,isSplitPayment: null == isSplitPayment ? _self.isSplitPayment : isSplitPayment // ignore: cast_nullable_to_non_nullable
as bool,printSequence: null == printSequence ? _self.printSequence : printSequence // ignore: cast_nullable_to_non_nullable
as int,printHistory: null == printHistory ? _self._printHistory : printHistory // ignore: cast_nullable_to_non_nullable
as List<String>,customAmountItems: freezed == customAmountItems ? _self._customAmountItems : customAmountItems // ignore: cast_nullable_to_non_nullable
as List<CustomAmountItemsModel>?,totalCustomAmount: null == totalCustomAmount ? _self.totalCustomAmount : totalCustomAmount // ignore: cast_nullable_to_non_nullable
as int,selectedPromoIds: null == selectedPromoIds ? _self._selectedPromoIds : selectedPromoIds // ignore: cast_nullable_to_non_nullable
as List<String>,customDiscountDetails: freezed == customDiscountDetails ? _self.customDiscountDetails : customDiscountDetails // ignore: cast_nullable_to_non_nullable
as CustomDiscountModel?,
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
}/// Create a copy of OrderDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CustomDiscountModelCopyWith<$Res>? get customDiscountDetails {
    if (_self.customDiscountDetails == null) {
    return null;
  }

  return $CustomDiscountModelCopyWith<$Res>(_self.customDiscountDetails!, (value) {
    return _then(_self.copyWith(customDiscountDetails: value));
  });
}
}

// dart format on
