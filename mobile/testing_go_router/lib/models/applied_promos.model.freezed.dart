// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'applied_promos.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AppliedPromosModel {

@HiveField(0) String get promoId;@HiveField(1) String get promoName;@HiveField(2) String get promoType;@HiveField(3) int get discount;@HiveField(4) List<AffectedItem> get affectedItems;@HiveField(5) List<FreeItem> get freeItems;@HiveField(6) String get id;
/// Create a copy of AppliedPromosModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AppliedPromosModelCopyWith<AppliedPromosModel> get copyWith => _$AppliedPromosModelCopyWithImpl<AppliedPromosModel>(this as AppliedPromosModel, _$identity);

  /// Serializes this AppliedPromosModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AppliedPromosModel&&(identical(other.promoId, promoId) || other.promoId == promoId)&&(identical(other.promoName, promoName) || other.promoName == promoName)&&(identical(other.promoType, promoType) || other.promoType == promoType)&&(identical(other.discount, discount) || other.discount == discount)&&const DeepCollectionEquality().equals(other.affectedItems, affectedItems)&&const DeepCollectionEquality().equals(other.freeItems, freeItems)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,promoId,promoName,promoType,discount,const DeepCollectionEquality().hash(affectedItems),const DeepCollectionEquality().hash(freeItems),id);

@override
String toString() {
  return 'AppliedPromosModel(promoId: $promoId, promoName: $promoName, promoType: $promoType, discount: $discount, affectedItems: $affectedItems, freeItems: $freeItems, id: $id)';
}


}

/// @nodoc
abstract mixin class $AppliedPromosModelCopyWith<$Res>  {
  factory $AppliedPromosModelCopyWith(AppliedPromosModel value, $Res Function(AppliedPromosModel) _then) = _$AppliedPromosModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String promoId,@HiveField(1) String promoName,@HiveField(2) String promoType,@HiveField(3) int discount,@HiveField(4) List<AffectedItem> affectedItems,@HiveField(5) List<FreeItem> freeItems,@HiveField(6) String id
});




}
/// @nodoc
class _$AppliedPromosModelCopyWithImpl<$Res>
    implements $AppliedPromosModelCopyWith<$Res> {
  _$AppliedPromosModelCopyWithImpl(this._self, this._then);

  final AppliedPromosModel _self;
  final $Res Function(AppliedPromosModel) _then;

/// Create a copy of AppliedPromosModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? promoId = null,Object? promoName = null,Object? promoType = null,Object? discount = null,Object? affectedItems = null,Object? freeItems = null,Object? id = null,}) {
  return _then(_self.copyWith(
promoId: null == promoId ? _self.promoId : promoId // ignore: cast_nullable_to_non_nullable
as String,promoName: null == promoName ? _self.promoName : promoName // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,discount: null == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int,affectedItems: null == affectedItems ? _self.affectedItems : affectedItems // ignore: cast_nullable_to_non_nullable
as List<AffectedItem>,freeItems: null == freeItems ? _self.freeItems : freeItems // ignore: cast_nullable_to_non_nullable
as List<FreeItem>,id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _AppliedPromosModel implements AppliedPromosModel {
   _AppliedPromosModel({@HiveField(0) required this.promoId, @HiveField(1) required this.promoName, @HiveField(2) required this.promoType, @HiveField(3) required this.discount, @HiveField(4) final  List<AffectedItem> affectedItems = const [], @HiveField(5) final  List<FreeItem> freeItems = const [], @HiveField(6) required this.id}): _affectedItems = affectedItems,_freeItems = freeItems;
  factory _AppliedPromosModel.fromJson(Map<String, dynamic> json) => _$AppliedPromosModelFromJson(json);

@override@HiveField(0) final  String promoId;
@override@HiveField(1) final  String promoName;
@override@HiveField(2) final  String promoType;
@override@HiveField(3) final  int discount;
 final  List<AffectedItem> _affectedItems;
@override@JsonKey()@HiveField(4) List<AffectedItem> get affectedItems {
  if (_affectedItems is EqualUnmodifiableListView) return _affectedItems;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_affectedItems);
}

 final  List<FreeItem> _freeItems;
@override@JsonKey()@HiveField(5) List<FreeItem> get freeItems {
  if (_freeItems is EqualUnmodifiableListView) return _freeItems;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_freeItems);
}

@override@HiveField(6) final  String id;

/// Create a copy of AppliedPromosModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AppliedPromosModelCopyWith<_AppliedPromosModel> get copyWith => __$AppliedPromosModelCopyWithImpl<_AppliedPromosModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AppliedPromosModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AppliedPromosModel&&(identical(other.promoId, promoId) || other.promoId == promoId)&&(identical(other.promoName, promoName) || other.promoName == promoName)&&(identical(other.promoType, promoType) || other.promoType == promoType)&&(identical(other.discount, discount) || other.discount == discount)&&const DeepCollectionEquality().equals(other._affectedItems, _affectedItems)&&const DeepCollectionEquality().equals(other._freeItems, _freeItems)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,promoId,promoName,promoType,discount,const DeepCollectionEquality().hash(_affectedItems),const DeepCollectionEquality().hash(_freeItems),id);

@override
String toString() {
  return 'AppliedPromosModel(promoId: $promoId, promoName: $promoName, promoType: $promoType, discount: $discount, affectedItems: $affectedItems, freeItems: $freeItems, id: $id)';
}


}

/// @nodoc
abstract mixin class _$AppliedPromosModelCopyWith<$Res> implements $AppliedPromosModelCopyWith<$Res> {
  factory _$AppliedPromosModelCopyWith(_AppliedPromosModel value, $Res Function(_AppliedPromosModel) _then) = __$AppliedPromosModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String promoId,@HiveField(1) String promoName,@HiveField(2) String promoType,@HiveField(3) int discount,@HiveField(4) List<AffectedItem> affectedItems,@HiveField(5) List<FreeItem> freeItems,@HiveField(6) String id
});




}
/// @nodoc
class __$AppliedPromosModelCopyWithImpl<$Res>
    implements _$AppliedPromosModelCopyWith<$Res> {
  __$AppliedPromosModelCopyWithImpl(this._self, this._then);

  final _AppliedPromosModel _self;
  final $Res Function(_AppliedPromosModel) _then;

/// Create a copy of AppliedPromosModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? promoId = null,Object? promoName = null,Object? promoType = null,Object? discount = null,Object? affectedItems = null,Object? freeItems = null,Object? id = null,}) {
  return _then(_AppliedPromosModel(
promoId: null == promoId ? _self.promoId : promoId // ignore: cast_nullable_to_non_nullable
as String,promoName: null == promoName ? _self.promoName : promoName // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,discount: null == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int,affectedItems: null == affectedItems ? _self._affectedItems : affectedItems // ignore: cast_nullable_to_non_nullable
as List<AffectedItem>,freeItems: null == freeItems ? _self._freeItems : freeItems // ignore: cast_nullable_to_non_nullable
as List<FreeItem>,id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$AffectedItem {

@HiveField(0) String get menuItem;@HiveField(1) String get menuItemName;@HiveField(2) int get quantity;@HiveField(3) int get originalSubtotal;@HiveField(4) int get discountAmount;@HiveField(5) int get discountedSubtotal;@HiveField(6) int get discountPercentage;@HiveField(7) String get id;
/// Create a copy of AffectedItem
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AffectedItemCopyWith<AffectedItem> get copyWith => _$AffectedItemCopyWithImpl<AffectedItem>(this as AffectedItem, _$identity);

  /// Serializes this AffectedItem to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AffectedItem&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.menuItemName, menuItemName) || other.menuItemName == menuItemName)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.originalSubtotal, originalSubtotal) || other.originalSubtotal == originalSubtotal)&&(identical(other.discountAmount, discountAmount) || other.discountAmount == discountAmount)&&(identical(other.discountedSubtotal, discountedSubtotal) || other.discountedSubtotal == discountedSubtotal)&&(identical(other.discountPercentage, discountPercentage) || other.discountPercentage == discountPercentage)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,menuItemName,quantity,originalSubtotal,discountAmount,discountedSubtotal,discountPercentage,id);

@override
String toString() {
  return 'AffectedItem(menuItem: $menuItem, menuItemName: $menuItemName, quantity: $quantity, originalSubtotal: $originalSubtotal, discountAmount: $discountAmount, discountedSubtotal: $discountedSubtotal, discountPercentage: $discountPercentage, id: $id)';
}


}

/// @nodoc
abstract mixin class $AffectedItemCopyWith<$Res>  {
  factory $AffectedItemCopyWith(AffectedItem value, $Res Function(AffectedItem) _then) = _$AffectedItemCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String menuItem,@HiveField(1) String menuItemName,@HiveField(2) int quantity,@HiveField(3) int originalSubtotal,@HiveField(4) int discountAmount,@HiveField(5) int discountedSubtotal,@HiveField(6) int discountPercentage,@HiveField(7) String id
});




}
/// @nodoc
class _$AffectedItemCopyWithImpl<$Res>
    implements $AffectedItemCopyWith<$Res> {
  _$AffectedItemCopyWithImpl(this._self, this._then);

  final AffectedItem _self;
  final $Res Function(AffectedItem) _then;

/// Create a copy of AffectedItem
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? menuItem = null,Object? menuItemName = null,Object? quantity = null,Object? originalSubtotal = null,Object? discountAmount = null,Object? discountedSubtotal = null,Object? discountPercentage = null,Object? id = null,}) {
  return _then(_self.copyWith(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,menuItemName: null == menuItemName ? _self.menuItemName : menuItemName // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,originalSubtotal: null == originalSubtotal ? _self.originalSubtotal : originalSubtotal // ignore: cast_nullable_to_non_nullable
as int,discountAmount: null == discountAmount ? _self.discountAmount : discountAmount // ignore: cast_nullable_to_non_nullable
as int,discountedSubtotal: null == discountedSubtotal ? _self.discountedSubtotal : discountedSubtotal // ignore: cast_nullable_to_non_nullable
as int,discountPercentage: null == discountPercentage ? _self.discountPercentage : discountPercentage // ignore: cast_nullable_to_non_nullable
as int,id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _AffectedItem implements AffectedItem {
   _AffectedItem({@HiveField(0) required this.menuItem, @HiveField(1) required this.menuItemName, @HiveField(2) required this.quantity, @HiveField(3) required this.originalSubtotal, @HiveField(4) required this.discountAmount, @HiveField(5) required this.discountedSubtotal, @HiveField(6) required this.discountPercentage, @HiveField(7) required this.id});
  factory _AffectedItem.fromJson(Map<String, dynamic> json) => _$AffectedItemFromJson(json);

@override@HiveField(0) final  String menuItem;
@override@HiveField(1) final  String menuItemName;
@override@HiveField(2) final  int quantity;
@override@HiveField(3) final  int originalSubtotal;
@override@HiveField(4) final  int discountAmount;
@override@HiveField(5) final  int discountedSubtotal;
@override@HiveField(6) final  int discountPercentage;
@override@HiveField(7) final  String id;

/// Create a copy of AffectedItem
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AffectedItemCopyWith<_AffectedItem> get copyWith => __$AffectedItemCopyWithImpl<_AffectedItem>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AffectedItemToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AffectedItem&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.menuItemName, menuItemName) || other.menuItemName == menuItemName)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.originalSubtotal, originalSubtotal) || other.originalSubtotal == originalSubtotal)&&(identical(other.discountAmount, discountAmount) || other.discountAmount == discountAmount)&&(identical(other.discountedSubtotal, discountedSubtotal) || other.discountedSubtotal == discountedSubtotal)&&(identical(other.discountPercentage, discountPercentage) || other.discountPercentage == discountPercentage)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,menuItemName,quantity,originalSubtotal,discountAmount,discountedSubtotal,discountPercentage,id);

@override
String toString() {
  return 'AffectedItem(menuItem: $menuItem, menuItemName: $menuItemName, quantity: $quantity, originalSubtotal: $originalSubtotal, discountAmount: $discountAmount, discountedSubtotal: $discountedSubtotal, discountPercentage: $discountPercentage, id: $id)';
}


}

/// @nodoc
abstract mixin class _$AffectedItemCopyWith<$Res> implements $AffectedItemCopyWith<$Res> {
  factory _$AffectedItemCopyWith(_AffectedItem value, $Res Function(_AffectedItem) _then) = __$AffectedItemCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String menuItem,@HiveField(1) String menuItemName,@HiveField(2) int quantity,@HiveField(3) int originalSubtotal,@HiveField(4) int discountAmount,@HiveField(5) int discountedSubtotal,@HiveField(6) int discountPercentage,@HiveField(7) String id
});




}
/// @nodoc
class __$AffectedItemCopyWithImpl<$Res>
    implements _$AffectedItemCopyWith<$Res> {
  __$AffectedItemCopyWithImpl(this._self, this._then);

  final _AffectedItem _self;
  final $Res Function(_AffectedItem) _then;

/// Create a copy of AffectedItem
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? menuItem = null,Object? menuItemName = null,Object? quantity = null,Object? originalSubtotal = null,Object? discountAmount = null,Object? discountedSubtotal = null,Object? discountPercentage = null,Object? id = null,}) {
  return _then(_AffectedItem(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,menuItemName: null == menuItemName ? _self.menuItemName : menuItemName // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,originalSubtotal: null == originalSubtotal ? _self.originalSubtotal : originalSubtotal // ignore: cast_nullable_to_non_nullable
as int,discountAmount: null == discountAmount ? _self.discountAmount : discountAmount // ignore: cast_nullable_to_non_nullable
as int,discountedSubtotal: null == discountedSubtotal ? _self.discountedSubtotal : discountedSubtotal // ignore: cast_nullable_to_non_nullable
as int,discountPercentage: null == discountPercentage ? _self.discountPercentage : discountPercentage // ignore: cast_nullable_to_non_nullable
as int,id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$FreeItem {

// Sesuaikan fields sesuai dengan struktur freeItems yang sebenarnya
@HiveField(0) String get menuItem;@HiveField(1) String get menuItemName;@HiveField(2) int get quantity;@HiveField(3) String get id;
/// Create a copy of FreeItem
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FreeItemCopyWith<FreeItem> get copyWith => _$FreeItemCopyWithImpl<FreeItem>(this as FreeItem, _$identity);

  /// Serializes this FreeItem to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FreeItem&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.menuItemName, menuItemName) || other.menuItemName == menuItemName)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,menuItemName,quantity,id);

@override
String toString() {
  return 'FreeItem(menuItem: $menuItem, menuItemName: $menuItemName, quantity: $quantity, id: $id)';
}


}

/// @nodoc
abstract mixin class $FreeItemCopyWith<$Res>  {
  factory $FreeItemCopyWith(FreeItem value, $Res Function(FreeItem) _then) = _$FreeItemCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String menuItem,@HiveField(1) String menuItemName,@HiveField(2) int quantity,@HiveField(3) String id
});




}
/// @nodoc
class _$FreeItemCopyWithImpl<$Res>
    implements $FreeItemCopyWith<$Res> {
  _$FreeItemCopyWithImpl(this._self, this._then);

  final FreeItem _self;
  final $Res Function(FreeItem) _then;

/// Create a copy of FreeItem
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? menuItem = null,Object? menuItemName = null,Object? quantity = null,Object? id = null,}) {
  return _then(_self.copyWith(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,menuItemName: null == menuItemName ? _self.menuItemName : menuItemName // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _FreeItem implements FreeItem {
   _FreeItem({@HiveField(0) required this.menuItem, @HiveField(1) required this.menuItemName, @HiveField(2) required this.quantity, @HiveField(3) required this.id});
  factory _FreeItem.fromJson(Map<String, dynamic> json) => _$FreeItemFromJson(json);

// Sesuaikan fields sesuai dengan struktur freeItems yang sebenarnya
@override@HiveField(0) final  String menuItem;
@override@HiveField(1) final  String menuItemName;
@override@HiveField(2) final  int quantity;
@override@HiveField(3) final  String id;

/// Create a copy of FreeItem
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FreeItemCopyWith<_FreeItem> get copyWith => __$FreeItemCopyWithImpl<_FreeItem>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FreeItemToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _FreeItem&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.menuItemName, menuItemName) || other.menuItemName == menuItemName)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,menuItemName,quantity,id);

@override
String toString() {
  return 'FreeItem(menuItem: $menuItem, menuItemName: $menuItemName, quantity: $quantity, id: $id)';
}


}

/// @nodoc
abstract mixin class _$FreeItemCopyWith<$Res> implements $FreeItemCopyWith<$Res> {
  factory _$FreeItemCopyWith(_FreeItem value, $Res Function(_FreeItem) _then) = __$FreeItemCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String menuItem,@HiveField(1) String menuItemName,@HiveField(2) int quantity,@HiveField(3) String id
});




}
/// @nodoc
class __$FreeItemCopyWithImpl<$Res>
    implements _$FreeItemCopyWith<$Res> {
  __$FreeItemCopyWithImpl(this._self, this._then);

  final _FreeItem _self;
  final $Res Function(_FreeItem) _then;

/// Create a copy of FreeItem
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? menuItem = null,Object? menuItemName = null,Object? quantity = null,Object? id = null,}) {
  return _then(_FreeItem(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,menuItemName: null == menuItemName ? _self.menuItemName : menuItemName // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
