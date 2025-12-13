// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'auto_promo.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AutoPromoModel {

@HiveField(0)@JsonKey(name: '_id') String get id;@HiveField(1) String get name;@HiveField(2) String get promoType;@HiveField(3) int? get discount;@HiveField(4) int? get bundlePrice;@HiveField(5) Conditions? get conditions;@HiveField(6) ActiveHours? get activeHours;@HiveField(7) Outlet get outlet;@HiveField(8) String get createdBy;@HiveField(9) DateTime get validFrom;@HiveField(10) DateTime get validTo;@HiveField(11) bool? get isActive;@HiveField(12) DateTime get createdAt;@HiveField(13) DateTime get updatedAt;
/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AutoPromoModelCopyWith<AutoPromoModel> get copyWith => _$AutoPromoModelCopyWithImpl<AutoPromoModel>(this as AutoPromoModel, _$identity);

  /// Serializes this AutoPromoModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AutoPromoModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.promoType, promoType) || other.promoType == promoType)&&(identical(other.discount, discount) || other.discount == discount)&&(identical(other.bundlePrice, bundlePrice) || other.bundlePrice == bundlePrice)&&(identical(other.conditions, conditions) || other.conditions == conditions)&&(identical(other.activeHours, activeHours) || other.activeHours == activeHours)&&(identical(other.outlet, outlet) || other.outlet == outlet)&&(identical(other.createdBy, createdBy) || other.createdBy == createdBy)&&(identical(other.validFrom, validFrom) || other.validFrom == validFrom)&&(identical(other.validTo, validTo) || other.validTo == validTo)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,promoType,discount,bundlePrice,conditions,activeHours,outlet,createdBy,validFrom,validTo,isActive,createdAt,updatedAt);

@override
String toString() {
  return 'AutoPromoModel(id: $id, name: $name, promoType: $promoType, discount: $discount, bundlePrice: $bundlePrice, conditions: $conditions, activeHours: $activeHours, outlet: $outlet, createdBy: $createdBy, validFrom: $validFrom, validTo: $validTo, isActive: $isActive, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $AutoPromoModelCopyWith<$Res>  {
  factory $AutoPromoModelCopyWith(AutoPromoModel value, $Res Function(AutoPromoModel) _then) = _$AutoPromoModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name,@HiveField(2) String promoType,@HiveField(3) int? discount,@HiveField(4) int? bundlePrice,@HiveField(5) Conditions? conditions,@HiveField(6) ActiveHours? activeHours,@HiveField(7) Outlet outlet,@HiveField(8) String createdBy,@HiveField(9) DateTime validFrom,@HiveField(10) DateTime validTo,@HiveField(11) bool? isActive,@HiveField(12) DateTime createdAt,@HiveField(13) DateTime updatedAt
});


$ConditionsCopyWith<$Res>? get conditions;$ActiveHoursCopyWith<$Res>? get activeHours;$OutletCopyWith<$Res> get outlet;

}
/// @nodoc
class _$AutoPromoModelCopyWithImpl<$Res>
    implements $AutoPromoModelCopyWith<$Res> {
  _$AutoPromoModelCopyWithImpl(this._self, this._then);

  final AutoPromoModel _self;
  final $Res Function(AutoPromoModel) _then;

/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? promoType = null,Object? discount = freezed,Object? bundlePrice = freezed,Object? conditions = freezed,Object? activeHours = freezed,Object? outlet = null,Object? createdBy = null,Object? validFrom = null,Object? validTo = null,Object? isActive = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,discount: freezed == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int?,bundlePrice: freezed == bundlePrice ? _self.bundlePrice : bundlePrice // ignore: cast_nullable_to_non_nullable
as int?,conditions: freezed == conditions ? _self.conditions : conditions // ignore: cast_nullable_to_non_nullable
as Conditions?,activeHours: freezed == activeHours ? _self.activeHours : activeHours // ignore: cast_nullable_to_non_nullable
as ActiveHours?,outlet: null == outlet ? _self.outlet : outlet // ignore: cast_nullable_to_non_nullable
as Outlet,createdBy: null == createdBy ? _self.createdBy : createdBy // ignore: cast_nullable_to_non_nullable
as String,validFrom: null == validFrom ? _self.validFrom : validFrom // ignore: cast_nullable_to_non_nullable
as DateTime,validTo: null == validTo ? _self.validTo : validTo // ignore: cast_nullable_to_non_nullable
as DateTime,isActive: freezed == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}
/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ConditionsCopyWith<$Res>? get conditions {
    if (_self.conditions == null) {
    return null;
  }

  return $ConditionsCopyWith<$Res>(_self.conditions!, (value) {
    return _then(_self.copyWith(conditions: value));
  });
}/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ActiveHoursCopyWith<$Res>? get activeHours {
    if (_self.activeHours == null) {
    return null;
  }

  return $ActiveHoursCopyWith<$Res>(_self.activeHours!, (value) {
    return _then(_self.copyWith(activeHours: value));
  });
}/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OutletCopyWith<$Res> get outlet {
  
  return $OutletCopyWith<$Res>(_self.outlet, (value) {
    return _then(_self.copyWith(outlet: value));
  });
}
}


/// Adds pattern-matching-related methods to [AutoPromoModel].
extension AutoPromoModelPatterns on AutoPromoModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AutoPromoModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AutoPromoModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AutoPromoModel value)  $default,){
final _that = this;
switch (_that) {
case _AutoPromoModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AutoPromoModel value)?  $default,){
final _that = this;
switch (_that) {
case _AutoPromoModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name, @HiveField(2)  String promoType, @HiveField(3)  int? discount, @HiveField(4)  int? bundlePrice, @HiveField(5)  Conditions? conditions, @HiveField(6)  ActiveHours? activeHours, @HiveField(7)  Outlet outlet, @HiveField(8)  String createdBy, @HiveField(9)  DateTime validFrom, @HiveField(10)  DateTime validTo, @HiveField(11)  bool? isActive, @HiveField(12)  DateTime createdAt, @HiveField(13)  DateTime updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AutoPromoModel() when $default != null:
return $default(_that.id,_that.name,_that.promoType,_that.discount,_that.bundlePrice,_that.conditions,_that.activeHours,_that.outlet,_that.createdBy,_that.validFrom,_that.validTo,_that.isActive,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name, @HiveField(2)  String promoType, @HiveField(3)  int? discount, @HiveField(4)  int? bundlePrice, @HiveField(5)  Conditions? conditions, @HiveField(6)  ActiveHours? activeHours, @HiveField(7)  Outlet outlet, @HiveField(8)  String createdBy, @HiveField(9)  DateTime validFrom, @HiveField(10)  DateTime validTo, @HiveField(11)  bool? isActive, @HiveField(12)  DateTime createdAt, @HiveField(13)  DateTime updatedAt)  $default,) {final _that = this;
switch (_that) {
case _AutoPromoModel():
return $default(_that.id,_that.name,_that.promoType,_that.discount,_that.bundlePrice,_that.conditions,_that.activeHours,_that.outlet,_that.createdBy,_that.validFrom,_that.validTo,_that.isActive,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name, @HiveField(2)  String promoType, @HiveField(3)  int? discount, @HiveField(4)  int? bundlePrice, @HiveField(5)  Conditions? conditions, @HiveField(6)  ActiveHours? activeHours, @HiveField(7)  Outlet outlet, @HiveField(8)  String createdBy, @HiveField(9)  DateTime validFrom, @HiveField(10)  DateTime validTo, @HiveField(11)  bool? isActive, @HiveField(12)  DateTime createdAt, @HiveField(13)  DateTime updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _AutoPromoModel() when $default != null:
return $default(_that.id,_that.name,_that.promoType,_that.discount,_that.bundlePrice,_that.conditions,_that.activeHours,_that.outlet,_that.createdBy,_that.validFrom,_that.validTo,_that.isActive,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AutoPromoModel implements AutoPromoModel {
  const _AutoPromoModel({@HiveField(0)@JsonKey(name: '_id') required this.id, @HiveField(1) required this.name, @HiveField(2) required this.promoType, @HiveField(3) this.discount = 0, @HiveField(4) this.bundlePrice = 0, @HiveField(5) this.conditions = null, @HiveField(6) this.activeHours = null, @HiveField(7) required this.outlet, @HiveField(8) required this.createdBy, @HiveField(9) required this.validFrom, @HiveField(10) required this.validTo, @HiveField(11) this.isActive = false, @HiveField(12) required this.createdAt, @HiveField(13) required this.updatedAt});
  factory _AutoPromoModel.fromJson(Map<String, dynamic> json) => _$AutoPromoModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String id;
@override@HiveField(1) final  String name;
@override@HiveField(2) final  String promoType;
@override@JsonKey()@HiveField(3) final  int? discount;
@override@JsonKey()@HiveField(4) final  int? bundlePrice;
@override@JsonKey()@HiveField(5) final  Conditions? conditions;
@override@JsonKey()@HiveField(6) final  ActiveHours? activeHours;
@override@HiveField(7) final  Outlet outlet;
@override@HiveField(8) final  String createdBy;
@override@HiveField(9) final  DateTime validFrom;
@override@HiveField(10) final  DateTime validTo;
@override@JsonKey()@HiveField(11) final  bool? isActive;
@override@HiveField(12) final  DateTime createdAt;
@override@HiveField(13) final  DateTime updatedAt;

/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AutoPromoModelCopyWith<_AutoPromoModel> get copyWith => __$AutoPromoModelCopyWithImpl<_AutoPromoModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AutoPromoModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AutoPromoModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.promoType, promoType) || other.promoType == promoType)&&(identical(other.discount, discount) || other.discount == discount)&&(identical(other.bundlePrice, bundlePrice) || other.bundlePrice == bundlePrice)&&(identical(other.conditions, conditions) || other.conditions == conditions)&&(identical(other.activeHours, activeHours) || other.activeHours == activeHours)&&(identical(other.outlet, outlet) || other.outlet == outlet)&&(identical(other.createdBy, createdBy) || other.createdBy == createdBy)&&(identical(other.validFrom, validFrom) || other.validFrom == validFrom)&&(identical(other.validTo, validTo) || other.validTo == validTo)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,promoType,discount,bundlePrice,conditions,activeHours,outlet,createdBy,validFrom,validTo,isActive,createdAt,updatedAt);

@override
String toString() {
  return 'AutoPromoModel(id: $id, name: $name, promoType: $promoType, discount: $discount, bundlePrice: $bundlePrice, conditions: $conditions, activeHours: $activeHours, outlet: $outlet, createdBy: $createdBy, validFrom: $validFrom, validTo: $validTo, isActive: $isActive, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$AutoPromoModelCopyWith<$Res> implements $AutoPromoModelCopyWith<$Res> {
  factory _$AutoPromoModelCopyWith(_AutoPromoModel value, $Res Function(_AutoPromoModel) _then) = __$AutoPromoModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name,@HiveField(2) String promoType,@HiveField(3) int? discount,@HiveField(4) int? bundlePrice,@HiveField(5) Conditions? conditions,@HiveField(6) ActiveHours? activeHours,@HiveField(7) Outlet outlet,@HiveField(8) String createdBy,@HiveField(9) DateTime validFrom,@HiveField(10) DateTime validTo,@HiveField(11) bool? isActive,@HiveField(12) DateTime createdAt,@HiveField(13) DateTime updatedAt
});


@override $ConditionsCopyWith<$Res>? get conditions;@override $ActiveHoursCopyWith<$Res>? get activeHours;@override $OutletCopyWith<$Res> get outlet;

}
/// @nodoc
class __$AutoPromoModelCopyWithImpl<$Res>
    implements _$AutoPromoModelCopyWith<$Res> {
  __$AutoPromoModelCopyWithImpl(this._self, this._then);

  final _AutoPromoModel _self;
  final $Res Function(_AutoPromoModel) _then;

/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? promoType = null,Object? discount = freezed,Object? bundlePrice = freezed,Object? conditions = freezed,Object? activeHours = freezed,Object? outlet = null,Object? createdBy = null,Object? validFrom = null,Object? validTo = null,Object? isActive = freezed,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_AutoPromoModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,discount: freezed == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int?,bundlePrice: freezed == bundlePrice ? _self.bundlePrice : bundlePrice // ignore: cast_nullable_to_non_nullable
as int?,conditions: freezed == conditions ? _self.conditions : conditions // ignore: cast_nullable_to_non_nullable
as Conditions?,activeHours: freezed == activeHours ? _self.activeHours : activeHours // ignore: cast_nullable_to_non_nullable
as ActiveHours?,outlet: null == outlet ? _self.outlet : outlet // ignore: cast_nullable_to_non_nullable
as Outlet,createdBy: null == createdBy ? _self.createdBy : createdBy // ignore: cast_nullable_to_non_nullable
as String,validFrom: null == validFrom ? _self.validFrom : validFrom // ignore: cast_nullable_to_non_nullable
as DateTime,validTo: null == validTo ? _self.validTo : validTo // ignore: cast_nullable_to_non_nullable
as DateTime,isActive: freezed == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ConditionsCopyWith<$Res>? get conditions {
    if (_self.conditions == null) {
    return null;
  }

  return $ConditionsCopyWith<$Res>(_self.conditions!, (value) {
    return _then(_self.copyWith(conditions: value));
  });
}/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ActiveHoursCopyWith<$Res>? get activeHours {
    if (_self.activeHours == null) {
    return null;
  }

  return $ActiveHoursCopyWith<$Res>(_self.activeHours!, (value) {
    return _then(_self.copyWith(activeHours: value));
  });
}/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OutletCopyWith<$Res> get outlet {
  
  return $OutletCopyWith<$Res>(_self.outlet, (value) {
    return _then(_self.copyWith(outlet: value));
  });
}
}


/// @nodoc
mixin _$Conditions {

@HiveField(0) List<BundleProduct>? get bundleProducts;@HiveField(1) List<ProductCondition>? get products;@HiveField(2) int? get minQuantity;@HiveField(3) int? get minTotal;@HiveField(4) ProductCondition? get buyProduct;@HiveField(5) ProductCondition? get getProduct;
/// Create a copy of Conditions
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ConditionsCopyWith<Conditions> get copyWith => _$ConditionsCopyWithImpl<Conditions>(this as Conditions, _$identity);

  /// Serializes this Conditions to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Conditions&&const DeepCollectionEquality().equals(other.bundleProducts, bundleProducts)&&const DeepCollectionEquality().equals(other.products, products)&&(identical(other.minQuantity, minQuantity) || other.minQuantity == minQuantity)&&(identical(other.minTotal, minTotal) || other.minTotal == minTotal)&&(identical(other.buyProduct, buyProduct) || other.buyProduct == buyProduct)&&(identical(other.getProduct, getProduct) || other.getProduct == getProduct));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(bundleProducts),const DeepCollectionEquality().hash(products),minQuantity,minTotal,buyProduct,getProduct);

@override
String toString() {
  return 'Conditions(bundleProducts: $bundleProducts, products: $products, minQuantity: $minQuantity, minTotal: $minTotal, buyProduct: $buyProduct, getProduct: $getProduct)';
}


}

/// @nodoc
abstract mixin class $ConditionsCopyWith<$Res>  {
  factory $ConditionsCopyWith(Conditions value, $Res Function(Conditions) _then) = _$ConditionsCopyWithImpl;
@useResult
$Res call({
@HiveField(0) List<BundleProduct>? bundleProducts,@HiveField(1) List<ProductCondition>? products,@HiveField(2) int? minQuantity,@HiveField(3) int? minTotal,@HiveField(4) ProductCondition? buyProduct,@HiveField(5) ProductCondition? getProduct
});


$ProductConditionCopyWith<$Res>? get buyProduct;$ProductConditionCopyWith<$Res>? get getProduct;

}
/// @nodoc
class _$ConditionsCopyWithImpl<$Res>
    implements $ConditionsCopyWith<$Res> {
  _$ConditionsCopyWithImpl(this._self, this._then);

  final Conditions _self;
  final $Res Function(Conditions) _then;

/// Create a copy of Conditions
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? bundleProducts = freezed,Object? products = freezed,Object? minQuantity = freezed,Object? minTotal = freezed,Object? buyProduct = freezed,Object? getProduct = freezed,}) {
  return _then(_self.copyWith(
bundleProducts: freezed == bundleProducts ? _self.bundleProducts : bundleProducts // ignore: cast_nullable_to_non_nullable
as List<BundleProduct>?,products: freezed == products ? _self.products : products // ignore: cast_nullable_to_non_nullable
as List<ProductCondition>?,minQuantity: freezed == minQuantity ? _self.minQuantity : minQuantity // ignore: cast_nullable_to_non_nullable
as int?,minTotal: freezed == minTotal ? _self.minTotal : minTotal // ignore: cast_nullable_to_non_nullable
as int?,buyProduct: freezed == buyProduct ? _self.buyProduct : buyProduct // ignore: cast_nullable_to_non_nullable
as ProductCondition?,getProduct: freezed == getProduct ? _self.getProduct : getProduct // ignore: cast_nullable_to_non_nullable
as ProductCondition?,
  ));
}
/// Create a copy of Conditions
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProductConditionCopyWith<$Res>? get buyProduct {
    if (_self.buyProduct == null) {
    return null;
  }

  return $ProductConditionCopyWith<$Res>(_self.buyProduct!, (value) {
    return _then(_self.copyWith(buyProduct: value));
  });
}/// Create a copy of Conditions
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProductConditionCopyWith<$Res>? get getProduct {
    if (_self.getProduct == null) {
    return null;
  }

  return $ProductConditionCopyWith<$Res>(_self.getProduct!, (value) {
    return _then(_self.copyWith(getProduct: value));
  });
}
}


/// Adds pattern-matching-related methods to [Conditions].
extension ConditionsPatterns on Conditions {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Conditions value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Conditions() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Conditions value)  $default,){
final _that = this;
switch (_that) {
case _Conditions():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Conditions value)?  $default,){
final _that = this;
switch (_that) {
case _Conditions() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  List<BundleProduct>? bundleProducts, @HiveField(1)  List<ProductCondition>? products, @HiveField(2)  int? minQuantity, @HiveField(3)  int? minTotal, @HiveField(4)  ProductCondition? buyProduct, @HiveField(5)  ProductCondition? getProduct)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Conditions() when $default != null:
return $default(_that.bundleProducts,_that.products,_that.minQuantity,_that.minTotal,_that.buyProduct,_that.getProduct);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  List<BundleProduct>? bundleProducts, @HiveField(1)  List<ProductCondition>? products, @HiveField(2)  int? minQuantity, @HiveField(3)  int? minTotal, @HiveField(4)  ProductCondition? buyProduct, @HiveField(5)  ProductCondition? getProduct)  $default,) {final _that = this;
switch (_that) {
case _Conditions():
return $default(_that.bundleProducts,_that.products,_that.minQuantity,_that.minTotal,_that.buyProduct,_that.getProduct);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  List<BundleProduct>? bundleProducts, @HiveField(1)  List<ProductCondition>? products, @HiveField(2)  int? minQuantity, @HiveField(3)  int? minTotal, @HiveField(4)  ProductCondition? buyProduct, @HiveField(5)  ProductCondition? getProduct)?  $default,) {final _that = this;
switch (_that) {
case _Conditions() when $default != null:
return $default(_that.bundleProducts,_that.products,_that.minQuantity,_that.minTotal,_that.buyProduct,_that.getProduct);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Conditions implements Conditions {
  const _Conditions({@HiveField(0) final  List<BundleProduct>? bundleProducts = const [], @HiveField(1) final  List<ProductCondition>? products = const [], @HiveField(2) this.minQuantity = 0, @HiveField(3) this.minTotal = 0, @HiveField(4) this.buyProduct, @HiveField(5) this.getProduct}): _bundleProducts = bundleProducts,_products = products;
  factory _Conditions.fromJson(Map<String, dynamic> json) => _$ConditionsFromJson(json);

 final  List<BundleProduct>? _bundleProducts;
@override@JsonKey()@HiveField(0) List<BundleProduct>? get bundleProducts {
  final value = _bundleProducts;
  if (value == null) return null;
  if (_bundleProducts is EqualUnmodifiableListView) return _bundleProducts;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

 final  List<ProductCondition>? _products;
@override@JsonKey()@HiveField(1) List<ProductCondition>? get products {
  final value = _products;
  if (value == null) return null;
  if (_products is EqualUnmodifiableListView) return _products;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override@JsonKey()@HiveField(2) final  int? minQuantity;
@override@JsonKey()@HiveField(3) final  int? minTotal;
@override@HiveField(4) final  ProductCondition? buyProduct;
@override@HiveField(5) final  ProductCondition? getProduct;

/// Create a copy of Conditions
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ConditionsCopyWith<_Conditions> get copyWith => __$ConditionsCopyWithImpl<_Conditions>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ConditionsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Conditions&&const DeepCollectionEquality().equals(other._bundleProducts, _bundleProducts)&&const DeepCollectionEquality().equals(other._products, _products)&&(identical(other.minQuantity, minQuantity) || other.minQuantity == minQuantity)&&(identical(other.minTotal, minTotal) || other.minTotal == minTotal)&&(identical(other.buyProduct, buyProduct) || other.buyProduct == buyProduct)&&(identical(other.getProduct, getProduct) || other.getProduct == getProduct));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_bundleProducts),const DeepCollectionEquality().hash(_products),minQuantity,minTotal,buyProduct,getProduct);

@override
String toString() {
  return 'Conditions(bundleProducts: $bundleProducts, products: $products, minQuantity: $minQuantity, minTotal: $minTotal, buyProduct: $buyProduct, getProduct: $getProduct)';
}


}

/// @nodoc
abstract mixin class _$ConditionsCopyWith<$Res> implements $ConditionsCopyWith<$Res> {
  factory _$ConditionsCopyWith(_Conditions value, $Res Function(_Conditions) _then) = __$ConditionsCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) List<BundleProduct>? bundleProducts,@HiveField(1) List<ProductCondition>? products,@HiveField(2) int? minQuantity,@HiveField(3) int? minTotal,@HiveField(4) ProductCondition? buyProduct,@HiveField(5) ProductCondition? getProduct
});


@override $ProductConditionCopyWith<$Res>? get buyProduct;@override $ProductConditionCopyWith<$Res>? get getProduct;

}
/// @nodoc
class __$ConditionsCopyWithImpl<$Res>
    implements _$ConditionsCopyWith<$Res> {
  __$ConditionsCopyWithImpl(this._self, this._then);

  final _Conditions _self;
  final $Res Function(_Conditions) _then;

/// Create a copy of Conditions
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? bundleProducts = freezed,Object? products = freezed,Object? minQuantity = freezed,Object? minTotal = freezed,Object? buyProduct = freezed,Object? getProduct = freezed,}) {
  return _then(_Conditions(
bundleProducts: freezed == bundleProducts ? _self._bundleProducts : bundleProducts // ignore: cast_nullable_to_non_nullable
as List<BundleProduct>?,products: freezed == products ? _self._products : products // ignore: cast_nullable_to_non_nullable
as List<ProductCondition>?,minQuantity: freezed == minQuantity ? _self.minQuantity : minQuantity // ignore: cast_nullable_to_non_nullable
as int?,minTotal: freezed == minTotal ? _self.minTotal : minTotal // ignore: cast_nullable_to_non_nullable
as int?,buyProduct: freezed == buyProduct ? _self.buyProduct : buyProduct // ignore: cast_nullable_to_non_nullable
as ProductCondition?,getProduct: freezed == getProduct ? _self.getProduct : getProduct // ignore: cast_nullable_to_non_nullable
as ProductCondition?,
  ));
}

/// Create a copy of Conditions
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProductConditionCopyWith<$Res>? get buyProduct {
    if (_self.buyProduct == null) {
    return null;
  }

  return $ProductConditionCopyWith<$Res>(_self.buyProduct!, (value) {
    return _then(_self.copyWith(buyProduct: value));
  });
}/// Create a copy of Conditions
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProductConditionCopyWith<$Res>? get getProduct {
    if (_self.getProduct == null) {
    return null;
  }

  return $ProductConditionCopyWith<$Res>(_self.getProduct!, (value) {
    return _then(_self.copyWith(getProduct: value));
  });
}
}


/// @nodoc
mixin _$BundleProduct {

@HiveField(0) ProductCondition get product;@HiveField(1) int? get quantity;@HiveField(2)@JsonKey(name: '_id') String? get id;
/// Create a copy of BundleProduct
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BundleProductCopyWith<BundleProduct> get copyWith => _$BundleProductCopyWithImpl<BundleProduct>(this as BundleProduct, _$identity);

  /// Serializes this BundleProduct to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BundleProduct&&(identical(other.product, product) || other.product == product)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,product,quantity,id);

@override
String toString() {
  return 'BundleProduct(product: $product, quantity: $quantity, id: $id)';
}


}

/// @nodoc
abstract mixin class $BundleProductCopyWith<$Res>  {
  factory $BundleProductCopyWith(BundleProduct value, $Res Function(BundleProduct) _then) = _$BundleProductCopyWithImpl;
@useResult
$Res call({
@HiveField(0) ProductCondition product,@HiveField(1) int? quantity,@HiveField(2)@JsonKey(name: '_id') String? id
});


$ProductConditionCopyWith<$Res> get product;

}
/// @nodoc
class _$BundleProductCopyWithImpl<$Res>
    implements $BundleProductCopyWith<$Res> {
  _$BundleProductCopyWithImpl(this._self, this._then);

  final BundleProduct _self;
  final $Res Function(BundleProduct) _then;

/// Create a copy of BundleProduct
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? product = null,Object? quantity = freezed,Object? id = freezed,}) {
  return _then(_self.copyWith(
product: null == product ? _self.product : product // ignore: cast_nullable_to_non_nullable
as ProductCondition,quantity: freezed == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int?,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of BundleProduct
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProductConditionCopyWith<$Res> get product {
  
  return $ProductConditionCopyWith<$Res>(_self.product, (value) {
    return _then(_self.copyWith(product: value));
  });
}
}


/// Adds pattern-matching-related methods to [BundleProduct].
extension BundleProductPatterns on BundleProduct {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _BundleProduct value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _BundleProduct() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _BundleProduct value)  $default,){
final _that = this;
switch (_that) {
case _BundleProduct():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _BundleProduct value)?  $default,){
final _that = this;
switch (_that) {
case _BundleProduct() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  ProductCondition product, @HiveField(1)  int? quantity, @HiveField(2)@JsonKey(name: '_id')  String? id)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BundleProduct() when $default != null:
return $default(_that.product,_that.quantity,_that.id);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  ProductCondition product, @HiveField(1)  int? quantity, @HiveField(2)@JsonKey(name: '_id')  String? id)  $default,) {final _that = this;
switch (_that) {
case _BundleProduct():
return $default(_that.product,_that.quantity,_that.id);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  ProductCondition product, @HiveField(1)  int? quantity, @HiveField(2)@JsonKey(name: '_id')  String? id)?  $default,) {final _that = this;
switch (_that) {
case _BundleProduct() when $default != null:
return $default(_that.product,_that.quantity,_that.id);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _BundleProduct implements BundleProduct {
  const _BundleProduct({@HiveField(0) required this.product, @HiveField(1) this.quantity = 1, @HiveField(2)@JsonKey(name: '_id') this.id});
  factory _BundleProduct.fromJson(Map<String, dynamic> json) => _$BundleProductFromJson(json);

@override@HiveField(0) final  ProductCondition product;
@override@JsonKey()@HiveField(1) final  int? quantity;
@override@HiveField(2)@JsonKey(name: '_id') final  String? id;

/// Create a copy of BundleProduct
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BundleProductCopyWith<_BundleProduct> get copyWith => __$BundleProductCopyWithImpl<_BundleProduct>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$BundleProductToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _BundleProduct&&(identical(other.product, product) || other.product == product)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,product,quantity,id);

@override
String toString() {
  return 'BundleProduct(product: $product, quantity: $quantity, id: $id)';
}


}

/// @nodoc
abstract mixin class _$BundleProductCopyWith<$Res> implements $BundleProductCopyWith<$Res> {
  factory _$BundleProductCopyWith(_BundleProduct value, $Res Function(_BundleProduct) _then) = __$BundleProductCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) ProductCondition product,@HiveField(1) int? quantity,@HiveField(2)@JsonKey(name: '_id') String? id
});


@override $ProductConditionCopyWith<$Res> get product;

}
/// @nodoc
class __$BundleProductCopyWithImpl<$Res>
    implements _$BundleProductCopyWith<$Res> {
  __$BundleProductCopyWithImpl(this._self, this._then);

  final _BundleProduct _self;
  final $Res Function(_BundleProduct) _then;

/// Create a copy of BundleProduct
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? product = null,Object? quantity = freezed,Object? id = freezed,}) {
  return _then(_BundleProduct(
product: null == product ? _self.product : product // ignore: cast_nullable_to_non_nullable
as ProductCondition,quantity: freezed == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int?,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of BundleProduct
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProductConditionCopyWith<$Res> get product {
  
  return $ProductConditionCopyWith<$Res>(_self.product, (value) {
    return _then(_self.copyWith(product: value));
  });
}
}


/// @nodoc
mixin _$ProductCondition {

@HiveField(0)@JsonKey(name: '_id') String get id;@HiveField(1) String get name;
/// Create a copy of ProductCondition
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProductConditionCopyWith<ProductCondition> get copyWith => _$ProductConditionCopyWithImpl<ProductCondition>(this as ProductCondition, _$identity);

  /// Serializes this ProductCondition to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProductCondition&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'ProductCondition(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class $ProductConditionCopyWith<$Res>  {
  factory $ProductConditionCopyWith(ProductCondition value, $Res Function(ProductCondition) _then) = _$ProductConditionCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class _$ProductConditionCopyWithImpl<$Res>
    implements $ProductConditionCopyWith<$Res> {
  _$ProductConditionCopyWithImpl(this._self, this._then);

  final ProductCondition _self;
  final $Res Function(ProductCondition) _then;

/// Create a copy of ProductCondition
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ProductCondition].
extension ProductConditionPatterns on ProductCondition {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProductCondition value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProductCondition() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProductCondition value)  $default,){
final _that = this;
switch (_that) {
case _ProductCondition():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProductCondition value)?  $default,){
final _that = this;
switch (_that) {
case _ProductCondition() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProductCondition() when $default != null:
return $default(_that.id,_that.name);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name)  $default,) {final _that = this;
switch (_that) {
case _ProductCondition():
return $default(_that.id,_that.name);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name)?  $default,) {final _that = this;
switch (_that) {
case _ProductCondition() when $default != null:
return $default(_that.id,_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ProductCondition implements ProductCondition {
  const _ProductCondition({@HiveField(0)@JsonKey(name: '_id') required this.id, @HiveField(1) required this.name});
  factory _ProductCondition.fromJson(Map<String, dynamic> json) => _$ProductConditionFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String id;
@override@HiveField(1) final  String name;

/// Create a copy of ProductCondition
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProductConditionCopyWith<_ProductCondition> get copyWith => __$ProductConditionCopyWithImpl<_ProductCondition>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProductConditionToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProductCondition&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'ProductCondition(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class _$ProductConditionCopyWith<$Res> implements $ProductConditionCopyWith<$Res> {
  factory _$ProductConditionCopyWith(_ProductCondition value, $Res Function(_ProductCondition) _then) = __$ProductConditionCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class __$ProductConditionCopyWithImpl<$Res>
    implements _$ProductConditionCopyWith<$Res> {
  __$ProductConditionCopyWithImpl(this._self, this._then);

  final _ProductCondition _self;
  final $Res Function(_ProductCondition) _then;

/// Create a copy of ProductCondition
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,}) {
  return _then(_ProductCondition(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$ActiveHours {

@HiveField(0) bool? get isEnabled;@HiveField(1) List<Schedule>? get schedule;
/// Create a copy of ActiveHours
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ActiveHoursCopyWith<ActiveHours> get copyWith => _$ActiveHoursCopyWithImpl<ActiveHours>(this as ActiveHours, _$identity);

  /// Serializes this ActiveHours to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ActiveHours&&(identical(other.isEnabled, isEnabled) || other.isEnabled == isEnabled)&&const DeepCollectionEquality().equals(other.schedule, schedule));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,isEnabled,const DeepCollectionEquality().hash(schedule));

@override
String toString() {
  return 'ActiveHours(isEnabled: $isEnabled, schedule: $schedule)';
}


}

/// @nodoc
abstract mixin class $ActiveHoursCopyWith<$Res>  {
  factory $ActiveHoursCopyWith(ActiveHours value, $Res Function(ActiveHours) _then) = _$ActiveHoursCopyWithImpl;
@useResult
$Res call({
@HiveField(0) bool? isEnabled,@HiveField(1) List<Schedule>? schedule
});




}
/// @nodoc
class _$ActiveHoursCopyWithImpl<$Res>
    implements $ActiveHoursCopyWith<$Res> {
  _$ActiveHoursCopyWithImpl(this._self, this._then);

  final ActiveHours _self;
  final $Res Function(ActiveHours) _then;

/// Create a copy of ActiveHours
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? isEnabled = freezed,Object? schedule = freezed,}) {
  return _then(_self.copyWith(
isEnabled: freezed == isEnabled ? _self.isEnabled : isEnabled // ignore: cast_nullable_to_non_nullable
as bool?,schedule: freezed == schedule ? _self.schedule : schedule // ignore: cast_nullable_to_non_nullable
as List<Schedule>?,
  ));
}

}


/// Adds pattern-matching-related methods to [ActiveHours].
extension ActiveHoursPatterns on ActiveHours {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ActiveHours value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ActiveHours() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ActiveHours value)  $default,){
final _that = this;
switch (_that) {
case _ActiveHours():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ActiveHours value)?  $default,){
final _that = this;
switch (_that) {
case _ActiveHours() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  bool? isEnabled, @HiveField(1)  List<Schedule>? schedule)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ActiveHours() when $default != null:
return $default(_that.isEnabled,_that.schedule);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  bool? isEnabled, @HiveField(1)  List<Schedule>? schedule)  $default,) {final _that = this;
switch (_that) {
case _ActiveHours():
return $default(_that.isEnabled,_that.schedule);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  bool? isEnabled, @HiveField(1)  List<Schedule>? schedule)?  $default,) {final _that = this;
switch (_that) {
case _ActiveHours() when $default != null:
return $default(_that.isEnabled,_that.schedule);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ActiveHours implements ActiveHours {
  const _ActiveHours({@HiveField(0) this.isEnabled = false, @HiveField(1) final  List<Schedule>? schedule = const []}): _schedule = schedule;
  factory _ActiveHours.fromJson(Map<String, dynamic> json) => _$ActiveHoursFromJson(json);

@override@JsonKey()@HiveField(0) final  bool? isEnabled;
 final  List<Schedule>? _schedule;
@override@JsonKey()@HiveField(1) List<Schedule>? get schedule {
  final value = _schedule;
  if (value == null) return null;
  if (_schedule is EqualUnmodifiableListView) return _schedule;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}


/// Create a copy of ActiveHours
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ActiveHoursCopyWith<_ActiveHours> get copyWith => __$ActiveHoursCopyWithImpl<_ActiveHours>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ActiveHoursToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ActiveHours&&(identical(other.isEnabled, isEnabled) || other.isEnabled == isEnabled)&&const DeepCollectionEquality().equals(other._schedule, _schedule));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,isEnabled,const DeepCollectionEquality().hash(_schedule));

@override
String toString() {
  return 'ActiveHours(isEnabled: $isEnabled, schedule: $schedule)';
}


}

/// @nodoc
abstract mixin class _$ActiveHoursCopyWith<$Res> implements $ActiveHoursCopyWith<$Res> {
  factory _$ActiveHoursCopyWith(_ActiveHours value, $Res Function(_ActiveHours) _then) = __$ActiveHoursCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) bool? isEnabled,@HiveField(1) List<Schedule>? schedule
});




}
/// @nodoc
class __$ActiveHoursCopyWithImpl<$Res>
    implements _$ActiveHoursCopyWith<$Res> {
  __$ActiveHoursCopyWithImpl(this._self, this._then);

  final _ActiveHours _self;
  final $Res Function(_ActiveHours) _then;

/// Create a copy of ActiveHours
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? isEnabled = freezed,Object? schedule = freezed,}) {
  return _then(_ActiveHours(
isEnabled: freezed == isEnabled ? _self.isEnabled : isEnabled // ignore: cast_nullable_to_non_nullable
as bool?,schedule: freezed == schedule ? _self._schedule : schedule // ignore: cast_nullable_to_non_nullable
as List<Schedule>?,
  ));
}


}


/// @nodoc
mixin _$Schedule {

@HiveField(0) int get dayOfWeek;@HiveField(1) String get startTime;@HiveField(2) String get endTime;@HiveField(3)@JsonKey(name: '_id') String? get id;
/// Create a copy of Schedule
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ScheduleCopyWith<Schedule> get copyWith => _$ScheduleCopyWithImpl<Schedule>(this as Schedule, _$identity);

  /// Serializes this Schedule to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Schedule&&(identical(other.dayOfWeek, dayOfWeek) || other.dayOfWeek == dayOfWeek)&&(identical(other.startTime, startTime) || other.startTime == startTime)&&(identical(other.endTime, endTime) || other.endTime == endTime)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,dayOfWeek,startTime,endTime,id);

@override
String toString() {
  return 'Schedule(dayOfWeek: $dayOfWeek, startTime: $startTime, endTime: $endTime, id: $id)';
}


}

/// @nodoc
abstract mixin class $ScheduleCopyWith<$Res>  {
  factory $ScheduleCopyWith(Schedule value, $Res Function(Schedule) _then) = _$ScheduleCopyWithImpl;
@useResult
$Res call({
@HiveField(0) int dayOfWeek,@HiveField(1) String startTime,@HiveField(2) String endTime,@HiveField(3)@JsonKey(name: '_id') String? id
});




}
/// @nodoc
class _$ScheduleCopyWithImpl<$Res>
    implements $ScheduleCopyWith<$Res> {
  _$ScheduleCopyWithImpl(this._self, this._then);

  final Schedule _self;
  final $Res Function(Schedule) _then;

/// Create a copy of Schedule
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? dayOfWeek = null,Object? startTime = null,Object? endTime = null,Object? id = freezed,}) {
  return _then(_self.copyWith(
dayOfWeek: null == dayOfWeek ? _self.dayOfWeek : dayOfWeek // ignore: cast_nullable_to_non_nullable
as int,startTime: null == startTime ? _self.startTime : startTime // ignore: cast_nullable_to_non_nullable
as String,endTime: null == endTime ? _self.endTime : endTime // ignore: cast_nullable_to_non_nullable
as String,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [Schedule].
extension SchedulePatterns on Schedule {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Schedule value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Schedule() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Schedule value)  $default,){
final _that = this;
switch (_that) {
case _Schedule():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Schedule value)?  $default,){
final _that = this;
switch (_that) {
case _Schedule() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  int dayOfWeek, @HiveField(1)  String startTime, @HiveField(2)  String endTime, @HiveField(3)@JsonKey(name: '_id')  String? id)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Schedule() when $default != null:
return $default(_that.dayOfWeek,_that.startTime,_that.endTime,_that.id);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  int dayOfWeek, @HiveField(1)  String startTime, @HiveField(2)  String endTime, @HiveField(3)@JsonKey(name: '_id')  String? id)  $default,) {final _that = this;
switch (_that) {
case _Schedule():
return $default(_that.dayOfWeek,_that.startTime,_that.endTime,_that.id);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  int dayOfWeek, @HiveField(1)  String startTime, @HiveField(2)  String endTime, @HiveField(3)@JsonKey(name: '_id')  String? id)?  $default,) {final _that = this;
switch (_that) {
case _Schedule() when $default != null:
return $default(_that.dayOfWeek,_that.startTime,_that.endTime,_that.id);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Schedule implements Schedule {
  const _Schedule({@HiveField(0) required this.dayOfWeek, @HiveField(1) required this.startTime, @HiveField(2) required this.endTime, @HiveField(3)@JsonKey(name: '_id') this.id});
  factory _Schedule.fromJson(Map<String, dynamic> json) => _$ScheduleFromJson(json);

@override@HiveField(0) final  int dayOfWeek;
@override@HiveField(1) final  String startTime;
@override@HiveField(2) final  String endTime;
@override@HiveField(3)@JsonKey(name: '_id') final  String? id;

/// Create a copy of Schedule
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ScheduleCopyWith<_Schedule> get copyWith => __$ScheduleCopyWithImpl<_Schedule>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ScheduleToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Schedule&&(identical(other.dayOfWeek, dayOfWeek) || other.dayOfWeek == dayOfWeek)&&(identical(other.startTime, startTime) || other.startTime == startTime)&&(identical(other.endTime, endTime) || other.endTime == endTime)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,dayOfWeek,startTime,endTime,id);

@override
String toString() {
  return 'Schedule(dayOfWeek: $dayOfWeek, startTime: $startTime, endTime: $endTime, id: $id)';
}


}

/// @nodoc
abstract mixin class _$ScheduleCopyWith<$Res> implements $ScheduleCopyWith<$Res> {
  factory _$ScheduleCopyWith(_Schedule value, $Res Function(_Schedule) _then) = __$ScheduleCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) int dayOfWeek,@HiveField(1) String startTime,@HiveField(2) String endTime,@HiveField(3)@JsonKey(name: '_id') String? id
});




}
/// @nodoc
class __$ScheduleCopyWithImpl<$Res>
    implements _$ScheduleCopyWith<$Res> {
  __$ScheduleCopyWithImpl(this._self, this._then);

  final _Schedule _self;
  final $Res Function(_Schedule) _then;

/// Create a copy of Schedule
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? dayOfWeek = null,Object? startTime = null,Object? endTime = null,Object? id = freezed,}) {
  return _then(_Schedule(
dayOfWeek: null == dayOfWeek ? _self.dayOfWeek : dayOfWeek // ignore: cast_nullable_to_non_nullable
as int,startTime: null == startTime ? _self.startTime : startTime // ignore: cast_nullable_to_non_nullable
as String,endTime: null == endTime ? _self.endTime : endTime // ignore: cast_nullable_to_non_nullable
as String,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$Outlet {

@HiveField(0)@JsonKey(name: '_id') String get id;@HiveField(1) String get name;
/// Create a copy of Outlet
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OutletCopyWith<Outlet> get copyWith => _$OutletCopyWithImpl<Outlet>(this as Outlet, _$identity);

  /// Serializes this Outlet to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Outlet&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'Outlet(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class $OutletCopyWith<$Res>  {
  factory $OutletCopyWith(Outlet value, $Res Function(Outlet) _then) = _$OutletCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class _$OutletCopyWithImpl<$Res>
    implements $OutletCopyWith<$Res> {
  _$OutletCopyWithImpl(this._self, this._then);

  final Outlet _self;
  final $Res Function(Outlet) _then;

/// Create a copy of Outlet
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [Outlet].
extension OutletPatterns on Outlet {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Outlet value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Outlet() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Outlet value)  $default,){
final _that = this;
switch (_that) {
case _Outlet():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Outlet value)?  $default,){
final _that = this;
switch (_that) {
case _Outlet() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Outlet() when $default != null:
return $default(_that.id,_that.name);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name)  $default,) {final _that = this;
switch (_that) {
case _Outlet():
return $default(_that.id,_that.name);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name)?  $default,) {final _that = this;
switch (_that) {
case _Outlet() when $default != null:
return $default(_that.id,_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Outlet implements Outlet {
  const _Outlet({@HiveField(0)@JsonKey(name: '_id') required this.id, @HiveField(1) required this.name});
  factory _Outlet.fromJson(Map<String, dynamic> json) => _$OutletFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String id;
@override@HiveField(1) final  String name;

/// Create a copy of Outlet
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OutletCopyWith<_Outlet> get copyWith => __$OutletCopyWithImpl<_Outlet>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OutletToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Outlet&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'Outlet(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class _$OutletCopyWith<$Res> implements $OutletCopyWith<$Res> {
  factory _$OutletCopyWith(_Outlet value, $Res Function(_Outlet) _then) = __$OutletCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class __$OutletCopyWithImpl<$Res>
    implements _$OutletCopyWith<$Res> {
  __$OutletCopyWithImpl(this._self, this._then);

  final _Outlet _self;
  final $Res Function(_Outlet) _then;

/// Create a copy of Outlet
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,}) {
  return _then(_Outlet(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
