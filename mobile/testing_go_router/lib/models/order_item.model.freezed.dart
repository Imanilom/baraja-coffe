// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'order_item.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$OrderItemModel {

@HiveField(0) MenuItemModel get menuItem;@HiveField(1) List<ToppingModel> get selectedToppings;@HiveField(2) List<AddonModel> get selectedAddons;@HiveField(3) int get quantity;@HiveField(4) String? get notes;@HiveField(5) int get subtotal;@HiveField(6)@JsonKey(name: 'dineType', fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) OrderType get orderType;@HiveField(7) String? get orderItemid;@HiveField(8) bool get isPrinted;@HiveField(9) int get printedQuantity;@HiveField(10) List<String> get printBatchIds;@HiveField(11) String? get reservedPromoId;
/// Create a copy of OrderItemModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OrderItemModelCopyWith<OrderItemModel> get copyWith => _$OrderItemModelCopyWithImpl<OrderItemModel>(this as OrderItemModel, _$identity);

  /// Serializes this OrderItemModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OrderItemModel&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&const DeepCollectionEquality().equals(other.selectedToppings, selectedToppings)&&const DeepCollectionEquality().equals(other.selectedAddons, selectedAddons)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.subtotal, subtotal) || other.subtotal == subtotal)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.orderItemid, orderItemid) || other.orderItemid == orderItemid)&&(identical(other.isPrinted, isPrinted) || other.isPrinted == isPrinted)&&(identical(other.printedQuantity, printedQuantity) || other.printedQuantity == printedQuantity)&&const DeepCollectionEquality().equals(other.printBatchIds, printBatchIds)&&(identical(other.reservedPromoId, reservedPromoId) || other.reservedPromoId == reservedPromoId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,const DeepCollectionEquality().hash(selectedToppings),const DeepCollectionEquality().hash(selectedAddons),quantity,notes,subtotal,orderType,orderItemid,isPrinted,printedQuantity,const DeepCollectionEquality().hash(printBatchIds),reservedPromoId);

@override
String toString() {
  return 'OrderItemModel(menuItem: $menuItem, selectedToppings: $selectedToppings, selectedAddons: $selectedAddons, quantity: $quantity, notes: $notes, subtotal: $subtotal, orderType: $orderType, orderItemid: $orderItemid, isPrinted: $isPrinted, printedQuantity: $printedQuantity, printBatchIds: $printBatchIds, reservedPromoId: $reservedPromoId)';
}


}

/// @nodoc
abstract mixin class $OrderItemModelCopyWith<$Res>  {
  factory $OrderItemModelCopyWith(OrderItemModel value, $Res Function(OrderItemModel) _then) = _$OrderItemModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) MenuItemModel menuItem,@HiveField(1) List<ToppingModel> selectedToppings,@HiveField(2) List<AddonModel> selectedAddons,@HiveField(3) int quantity,@HiveField(4) String? notes,@HiveField(5) int subtotal,@HiveField(6)@JsonKey(name: 'dineType', fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) OrderType orderType,@HiveField(7) String? orderItemid,@HiveField(8) bool isPrinted,@HiveField(9) int printedQuantity,@HiveField(10) List<String> printBatchIds,@HiveField(11) String? reservedPromoId
});


$MenuItemModelCopyWith<$Res> get menuItem;

}
/// @nodoc
class _$OrderItemModelCopyWithImpl<$Res>
    implements $OrderItemModelCopyWith<$Res> {
  _$OrderItemModelCopyWithImpl(this._self, this._then);

  final OrderItemModel _self;
  final $Res Function(OrderItemModel) _then;

/// Create a copy of OrderItemModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? menuItem = null,Object? selectedToppings = null,Object? selectedAddons = null,Object? quantity = null,Object? notes = freezed,Object? subtotal = null,Object? orderType = null,Object? orderItemid = freezed,Object? isPrinted = null,Object? printedQuantity = null,Object? printBatchIds = null,Object? reservedPromoId = freezed,}) {
  return _then(_self.copyWith(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as MenuItemModel,selectedToppings: null == selectedToppings ? _self.selectedToppings : selectedToppings // ignore: cast_nullable_to_non_nullable
as List<ToppingModel>,selectedAddons: null == selectedAddons ? _self.selectedAddons : selectedAddons // ignore: cast_nullable_to_non_nullable
as List<AddonModel>,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,subtotal: null == subtotal ? _self.subtotal : subtotal // ignore: cast_nullable_to_non_nullable
as int,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as OrderType,orderItemid: freezed == orderItemid ? _self.orderItemid : orderItemid // ignore: cast_nullable_to_non_nullable
as String?,isPrinted: null == isPrinted ? _self.isPrinted : isPrinted // ignore: cast_nullable_to_non_nullable
as bool,printedQuantity: null == printedQuantity ? _self.printedQuantity : printedQuantity // ignore: cast_nullable_to_non_nullable
as int,printBatchIds: null == printBatchIds ? _self.printBatchIds : printBatchIds // ignore: cast_nullable_to_non_nullable
as List<String>,reservedPromoId: freezed == reservedPromoId ? _self.reservedPromoId : reservedPromoId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of OrderItemModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MenuItemModelCopyWith<$Res> get menuItem {
  
  return $MenuItemModelCopyWith<$Res>(_self.menuItem, (value) {
    return _then(_self.copyWith(menuItem: value));
  });
}
}


/// Adds pattern-matching-related methods to [OrderItemModel].
extension OrderItemModelPatterns on OrderItemModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OrderItemModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OrderItemModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OrderItemModel value)  $default,){
final _that = this;
switch (_that) {
case _OrderItemModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OrderItemModel value)?  $default,){
final _that = this;
switch (_that) {
case _OrderItemModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  MenuItemModel menuItem, @HiveField(1)  List<ToppingModel> selectedToppings, @HiveField(2)  List<AddonModel> selectedAddons, @HiveField(3)  int quantity, @HiveField(4)  String? notes, @HiveField(5)  int subtotal, @HiveField(6)@JsonKey(name: 'dineType', fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson)  OrderType orderType, @HiveField(7)  String? orderItemid, @HiveField(8)  bool isPrinted, @HiveField(9)  int printedQuantity, @HiveField(10)  List<String> printBatchIds, @HiveField(11)  String? reservedPromoId)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OrderItemModel() when $default != null:
return $default(_that.menuItem,_that.selectedToppings,_that.selectedAddons,_that.quantity,_that.notes,_that.subtotal,_that.orderType,_that.orderItemid,_that.isPrinted,_that.printedQuantity,_that.printBatchIds,_that.reservedPromoId);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  MenuItemModel menuItem, @HiveField(1)  List<ToppingModel> selectedToppings, @HiveField(2)  List<AddonModel> selectedAddons, @HiveField(3)  int quantity, @HiveField(4)  String? notes, @HiveField(5)  int subtotal, @HiveField(6)@JsonKey(name: 'dineType', fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson)  OrderType orderType, @HiveField(7)  String? orderItemid, @HiveField(8)  bool isPrinted, @HiveField(9)  int printedQuantity, @HiveField(10)  List<String> printBatchIds, @HiveField(11)  String? reservedPromoId)  $default,) {final _that = this;
switch (_that) {
case _OrderItemModel():
return $default(_that.menuItem,_that.selectedToppings,_that.selectedAddons,_that.quantity,_that.notes,_that.subtotal,_that.orderType,_that.orderItemid,_that.isPrinted,_that.printedQuantity,_that.printBatchIds,_that.reservedPromoId);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  MenuItemModel menuItem, @HiveField(1)  List<ToppingModel> selectedToppings, @HiveField(2)  List<AddonModel> selectedAddons, @HiveField(3)  int quantity, @HiveField(4)  String? notes, @HiveField(5)  int subtotal, @HiveField(6)@JsonKey(name: 'dineType', fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson)  OrderType orderType, @HiveField(7)  String? orderItemid, @HiveField(8)  bool isPrinted, @HiveField(9)  int printedQuantity, @HiveField(10)  List<String> printBatchIds, @HiveField(11)  String? reservedPromoId)?  $default,) {final _that = this;
switch (_that) {
case _OrderItemModel() when $default != null:
return $default(_that.menuItem,_that.selectedToppings,_that.selectedAddons,_that.quantity,_that.notes,_that.subtotal,_that.orderType,_that.orderItemid,_that.isPrinted,_that.printedQuantity,_that.printBatchIds,_that.reservedPromoId);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OrderItemModel extends OrderItemModel {
   _OrderItemModel({@HiveField(0) required this.menuItem, @HiveField(1) final  List<ToppingModel> selectedToppings = const [], @HiveField(2) final  List<AddonModel> selectedAddons = const [], @HiveField(3) this.quantity = 1, @HiveField(4) this.notes = "", @HiveField(5) this.subtotal = 0, @HiveField(6)@JsonKey(name: 'dineType', fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) this.orderType = OrderType.dineIn, @HiveField(7) this.orderItemid = null, @HiveField(8) this.isPrinted = false, @HiveField(9) this.printedQuantity = 0, @HiveField(10) final  List<String> printBatchIds = const [], @HiveField(11) this.reservedPromoId = null}): _selectedToppings = selectedToppings,_selectedAddons = selectedAddons,_printBatchIds = printBatchIds,super._();
  factory _OrderItemModel.fromJson(Map<String, dynamic> json) => _$OrderItemModelFromJson(json);

@override@HiveField(0) final  MenuItemModel menuItem;
 final  List<ToppingModel> _selectedToppings;
@override@JsonKey()@HiveField(1) List<ToppingModel> get selectedToppings {
  if (_selectedToppings is EqualUnmodifiableListView) return _selectedToppings;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_selectedToppings);
}

 final  List<AddonModel> _selectedAddons;
@override@JsonKey()@HiveField(2) List<AddonModel> get selectedAddons {
  if (_selectedAddons is EqualUnmodifiableListView) return _selectedAddons;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_selectedAddons);
}

@override@JsonKey()@HiveField(3) final  int quantity;
@override@JsonKey()@HiveField(4) final  String? notes;
@override@JsonKey()@HiveField(5) final  int subtotal;
@override@HiveField(6)@JsonKey(name: 'dineType', fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) final  OrderType orderType;
@override@JsonKey()@HiveField(7) final  String? orderItemid;
@override@JsonKey()@HiveField(8) final  bool isPrinted;
@override@JsonKey()@HiveField(9) final  int printedQuantity;
 final  List<String> _printBatchIds;
@override@JsonKey()@HiveField(10) List<String> get printBatchIds {
  if (_printBatchIds is EqualUnmodifiableListView) return _printBatchIds;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_printBatchIds);
}

@override@JsonKey()@HiveField(11) final  String? reservedPromoId;

/// Create a copy of OrderItemModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OrderItemModelCopyWith<_OrderItemModel> get copyWith => __$OrderItemModelCopyWithImpl<_OrderItemModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OrderItemModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OrderItemModel&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&const DeepCollectionEquality().equals(other._selectedToppings, _selectedToppings)&&const DeepCollectionEquality().equals(other._selectedAddons, _selectedAddons)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.subtotal, subtotal) || other.subtotal == subtotal)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.orderItemid, orderItemid) || other.orderItemid == orderItemid)&&(identical(other.isPrinted, isPrinted) || other.isPrinted == isPrinted)&&(identical(other.printedQuantity, printedQuantity) || other.printedQuantity == printedQuantity)&&const DeepCollectionEquality().equals(other._printBatchIds, _printBatchIds)&&(identical(other.reservedPromoId, reservedPromoId) || other.reservedPromoId == reservedPromoId));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,const DeepCollectionEquality().hash(_selectedToppings),const DeepCollectionEquality().hash(_selectedAddons),quantity,notes,subtotal,orderType,orderItemid,isPrinted,printedQuantity,const DeepCollectionEquality().hash(_printBatchIds),reservedPromoId);

@override
String toString() {
  return 'OrderItemModel(menuItem: $menuItem, selectedToppings: $selectedToppings, selectedAddons: $selectedAddons, quantity: $quantity, notes: $notes, subtotal: $subtotal, orderType: $orderType, orderItemid: $orderItemid, isPrinted: $isPrinted, printedQuantity: $printedQuantity, printBatchIds: $printBatchIds, reservedPromoId: $reservedPromoId)';
}


}

/// @nodoc
abstract mixin class _$OrderItemModelCopyWith<$Res> implements $OrderItemModelCopyWith<$Res> {
  factory _$OrderItemModelCopyWith(_OrderItemModel value, $Res Function(_OrderItemModel) _then) = __$OrderItemModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) MenuItemModel menuItem,@HiveField(1) List<ToppingModel> selectedToppings,@HiveField(2) List<AddonModel> selectedAddons,@HiveField(3) int quantity,@HiveField(4) String? notes,@HiveField(5) int subtotal,@HiveField(6)@JsonKey(name: 'dineType', fromJson: OrderTypeExtension.fromString, toJson: OrderTypeExtension.orderTypeToJson) OrderType orderType,@HiveField(7) String? orderItemid,@HiveField(8) bool isPrinted,@HiveField(9) int printedQuantity,@HiveField(10) List<String> printBatchIds,@HiveField(11) String? reservedPromoId
});


@override $MenuItemModelCopyWith<$Res> get menuItem;

}
/// @nodoc
class __$OrderItemModelCopyWithImpl<$Res>
    implements _$OrderItemModelCopyWith<$Res> {
  __$OrderItemModelCopyWithImpl(this._self, this._then);

  final _OrderItemModel _self;
  final $Res Function(_OrderItemModel) _then;

/// Create a copy of OrderItemModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? menuItem = null,Object? selectedToppings = null,Object? selectedAddons = null,Object? quantity = null,Object? notes = freezed,Object? subtotal = null,Object? orderType = null,Object? orderItemid = freezed,Object? isPrinted = null,Object? printedQuantity = null,Object? printBatchIds = null,Object? reservedPromoId = freezed,}) {
  return _then(_OrderItemModel(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as MenuItemModel,selectedToppings: null == selectedToppings ? _self._selectedToppings : selectedToppings // ignore: cast_nullable_to_non_nullable
as List<ToppingModel>,selectedAddons: null == selectedAddons ? _self._selectedAddons : selectedAddons // ignore: cast_nullable_to_non_nullable
as List<AddonModel>,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,subtotal: null == subtotal ? _self.subtotal : subtotal // ignore: cast_nullable_to_non_nullable
as int,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as OrderType,orderItemid: freezed == orderItemid ? _self.orderItemid : orderItemid // ignore: cast_nullable_to_non_nullable
as String?,isPrinted: null == isPrinted ? _self.isPrinted : isPrinted // ignore: cast_nullable_to_non_nullable
as bool,printedQuantity: null == printedQuantity ? _self.printedQuantity : printedQuantity // ignore: cast_nullable_to_non_nullable
as int,printBatchIds: null == printBatchIds ? _self._printBatchIds : printBatchIds // ignore: cast_nullable_to_non_nullable
as List<String>,reservedPromoId: freezed == reservedPromoId ? _self.reservedPromoId : reservedPromoId // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of OrderItemModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MenuItemModelCopyWith<$Res> get menuItem {
  
  return $MenuItemModelCopyWith<$Res>(_self.menuItem, (value) {
    return _then(_self.copyWith(menuItem: value));
  });
}
}

// dart format on
