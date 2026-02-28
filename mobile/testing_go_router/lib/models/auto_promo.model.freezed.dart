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

@HiveField(0)@JsonKey(name: '_id') String get id;@HiveField(1) String get name;@HiveField(2) String get promoType;@HiveField(3) int get discount;@HiveField(4) int? get bundlePrice;@HiveField(5) PromoConditionsModel get conditions;@HiveField(6) ActiveHoursModel get activeHours;@HiveField(7) DateTime get validFrom;@HiveField(8) DateTime get validTo;@HiveField(9) bool get isActive;@HiveField(10) String? get consumerType;@HiveField(11) OutletModel? get outlet;
/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AutoPromoModelCopyWith<AutoPromoModel> get copyWith => _$AutoPromoModelCopyWithImpl<AutoPromoModel>(this as AutoPromoModel, _$identity);

  /// Serializes this AutoPromoModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AutoPromoModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.promoType, promoType) || other.promoType == promoType)&&(identical(other.discount, discount) || other.discount == discount)&&(identical(other.bundlePrice, bundlePrice) || other.bundlePrice == bundlePrice)&&(identical(other.conditions, conditions) || other.conditions == conditions)&&(identical(other.activeHours, activeHours) || other.activeHours == activeHours)&&(identical(other.validFrom, validFrom) || other.validFrom == validFrom)&&(identical(other.validTo, validTo) || other.validTo == validTo)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.consumerType, consumerType) || other.consumerType == consumerType)&&(identical(other.outlet, outlet) || other.outlet == outlet));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,promoType,discount,bundlePrice,conditions,activeHours,validFrom,validTo,isActive,consumerType,outlet);

@override
String toString() {
  return 'AutoPromoModel(id: $id, name: $name, promoType: $promoType, discount: $discount, bundlePrice: $bundlePrice, conditions: $conditions, activeHours: $activeHours, validFrom: $validFrom, validTo: $validTo, isActive: $isActive, consumerType: $consumerType, outlet: $outlet)';
}


}

/// @nodoc
abstract mixin class $AutoPromoModelCopyWith<$Res>  {
  factory $AutoPromoModelCopyWith(AutoPromoModel value, $Res Function(AutoPromoModel) _then) = _$AutoPromoModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name,@HiveField(2) String promoType,@HiveField(3) int discount,@HiveField(4) int? bundlePrice,@HiveField(5) PromoConditionsModel conditions,@HiveField(6) ActiveHoursModel activeHours,@HiveField(7) DateTime validFrom,@HiveField(8) DateTime validTo,@HiveField(9) bool isActive,@HiveField(10) String? consumerType,@HiveField(11) OutletModel? outlet
});


$PromoConditionsModelCopyWith<$Res> get conditions;$ActiveHoursModelCopyWith<$Res> get activeHours;$OutletModelCopyWith<$Res>? get outlet;

}
/// @nodoc
class _$AutoPromoModelCopyWithImpl<$Res>
    implements $AutoPromoModelCopyWith<$Res> {
  _$AutoPromoModelCopyWithImpl(this._self, this._then);

  final AutoPromoModel _self;
  final $Res Function(AutoPromoModel) _then;

/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? promoType = null,Object? discount = null,Object? bundlePrice = freezed,Object? conditions = null,Object? activeHours = null,Object? validFrom = null,Object? validTo = null,Object? isActive = null,Object? consumerType = freezed,Object? outlet = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,discount: null == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int,bundlePrice: freezed == bundlePrice ? _self.bundlePrice : bundlePrice // ignore: cast_nullable_to_non_nullable
as int?,conditions: null == conditions ? _self.conditions : conditions // ignore: cast_nullable_to_non_nullable
as PromoConditionsModel,activeHours: null == activeHours ? _self.activeHours : activeHours // ignore: cast_nullable_to_non_nullable
as ActiveHoursModel,validFrom: null == validFrom ? _self.validFrom : validFrom // ignore: cast_nullable_to_non_nullable
as DateTime,validTo: null == validTo ? _self.validTo : validTo // ignore: cast_nullable_to_non_nullable
as DateTime,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,consumerType: freezed == consumerType ? _self.consumerType : consumerType // ignore: cast_nullable_to_non_nullable
as String?,outlet: freezed == outlet ? _self.outlet : outlet // ignore: cast_nullable_to_non_nullable
as OutletModel?,
  ));
}
/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PromoConditionsModelCopyWith<$Res> get conditions {
  
  return $PromoConditionsModelCopyWith<$Res>(_self.conditions, (value) {
    return _then(_self.copyWith(conditions: value));
  });
}/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ActiveHoursModelCopyWith<$Res> get activeHours {
  
  return $ActiveHoursModelCopyWith<$Res>(_self.activeHours, (value) {
    return _then(_self.copyWith(activeHours: value));
  });
}/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OutletModelCopyWith<$Res>? get outlet {
    if (_self.outlet == null) {
    return null;
  }

  return $OutletModelCopyWith<$Res>(_self.outlet!, (value) {
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name, @HiveField(2)  String promoType, @HiveField(3)  int discount, @HiveField(4)  int? bundlePrice, @HiveField(5)  PromoConditionsModel conditions, @HiveField(6)  ActiveHoursModel activeHours, @HiveField(7)  DateTime validFrom, @HiveField(8)  DateTime validTo, @HiveField(9)  bool isActive, @HiveField(10)  String? consumerType, @HiveField(11)  OutletModel? outlet)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AutoPromoModel() when $default != null:
return $default(_that.id,_that.name,_that.promoType,_that.discount,_that.bundlePrice,_that.conditions,_that.activeHours,_that.validFrom,_that.validTo,_that.isActive,_that.consumerType,_that.outlet);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name, @HiveField(2)  String promoType, @HiveField(3)  int discount, @HiveField(4)  int? bundlePrice, @HiveField(5)  PromoConditionsModel conditions, @HiveField(6)  ActiveHoursModel activeHours, @HiveField(7)  DateTime validFrom, @HiveField(8)  DateTime validTo, @HiveField(9)  bool isActive, @HiveField(10)  String? consumerType, @HiveField(11)  OutletModel? outlet)  $default,) {final _that = this;
switch (_that) {
case _AutoPromoModel():
return $default(_that.id,_that.name,_that.promoType,_that.discount,_that.bundlePrice,_that.conditions,_that.activeHours,_that.validFrom,_that.validTo,_that.isActive,_that.consumerType,_that.outlet);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)@JsonKey(name: '_id')  String id, @HiveField(1)  String name, @HiveField(2)  String promoType, @HiveField(3)  int discount, @HiveField(4)  int? bundlePrice, @HiveField(5)  PromoConditionsModel conditions, @HiveField(6)  ActiveHoursModel activeHours, @HiveField(7)  DateTime validFrom, @HiveField(8)  DateTime validTo, @HiveField(9)  bool isActive, @HiveField(10)  String? consumerType, @HiveField(11)  OutletModel? outlet)?  $default,) {final _that = this;
switch (_that) {
case _AutoPromoModel() when $default != null:
return $default(_that.id,_that.name,_that.promoType,_that.discount,_that.bundlePrice,_that.conditions,_that.activeHours,_that.validFrom,_that.validTo,_that.isActive,_that.consumerType,_that.outlet);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AutoPromoModel implements AutoPromoModel {
   _AutoPromoModel({@HiveField(0)@JsonKey(name: '_id') required this.id, @HiveField(1) required this.name, @HiveField(2) required this.promoType, @HiveField(3) this.discount = 0, @HiveField(4) this.bundlePrice, @HiveField(5) required this.conditions, @HiveField(6) required this.activeHours, @HiveField(7) required this.validFrom, @HiveField(8) required this.validTo, @HiveField(9) this.isActive = false, @HiveField(10) this.consumerType, @HiveField(11) this.outlet});
  factory _AutoPromoModel.fromJson(Map<String, dynamic> json) => _$AutoPromoModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String id;
@override@HiveField(1) final  String name;
@override@HiveField(2) final  String promoType;
@override@JsonKey()@HiveField(3) final  int discount;
@override@HiveField(4) final  int? bundlePrice;
@override@HiveField(5) final  PromoConditionsModel conditions;
@override@HiveField(6) final  ActiveHoursModel activeHours;
@override@HiveField(7) final  DateTime validFrom;
@override@HiveField(8) final  DateTime validTo;
@override@JsonKey()@HiveField(9) final  bool isActive;
@override@HiveField(10) final  String? consumerType;
@override@HiveField(11) final  OutletModel? outlet;

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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AutoPromoModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.promoType, promoType) || other.promoType == promoType)&&(identical(other.discount, discount) || other.discount == discount)&&(identical(other.bundlePrice, bundlePrice) || other.bundlePrice == bundlePrice)&&(identical(other.conditions, conditions) || other.conditions == conditions)&&(identical(other.activeHours, activeHours) || other.activeHours == activeHours)&&(identical(other.validFrom, validFrom) || other.validFrom == validFrom)&&(identical(other.validTo, validTo) || other.validTo == validTo)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.consumerType, consumerType) || other.consumerType == consumerType)&&(identical(other.outlet, outlet) || other.outlet == outlet));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,promoType,discount,bundlePrice,conditions,activeHours,validFrom,validTo,isActive,consumerType,outlet);

@override
String toString() {
  return 'AutoPromoModel(id: $id, name: $name, promoType: $promoType, discount: $discount, bundlePrice: $bundlePrice, conditions: $conditions, activeHours: $activeHours, validFrom: $validFrom, validTo: $validTo, isActive: $isActive, consumerType: $consumerType, outlet: $outlet)';
}


}

/// @nodoc
abstract mixin class _$AutoPromoModelCopyWith<$Res> implements $AutoPromoModelCopyWith<$Res> {
  factory _$AutoPromoModelCopyWith(_AutoPromoModel value, $Res Function(_AutoPromoModel) _then) = __$AutoPromoModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name,@HiveField(2) String promoType,@HiveField(3) int discount,@HiveField(4) int? bundlePrice,@HiveField(5) PromoConditionsModel conditions,@HiveField(6) ActiveHoursModel activeHours,@HiveField(7) DateTime validFrom,@HiveField(8) DateTime validTo,@HiveField(9) bool isActive,@HiveField(10) String? consumerType,@HiveField(11) OutletModel? outlet
});


@override $PromoConditionsModelCopyWith<$Res> get conditions;@override $ActiveHoursModelCopyWith<$Res> get activeHours;@override $OutletModelCopyWith<$Res>? get outlet;

}
/// @nodoc
class __$AutoPromoModelCopyWithImpl<$Res>
    implements _$AutoPromoModelCopyWith<$Res> {
  __$AutoPromoModelCopyWithImpl(this._self, this._then);

  final _AutoPromoModel _self;
  final $Res Function(_AutoPromoModel) _then;

/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? promoType = null,Object? discount = null,Object? bundlePrice = freezed,Object? conditions = null,Object? activeHours = null,Object? validFrom = null,Object? validTo = null,Object? isActive = null,Object? consumerType = freezed,Object? outlet = freezed,}) {
  return _then(_AutoPromoModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,discount: null == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int,bundlePrice: freezed == bundlePrice ? _self.bundlePrice : bundlePrice // ignore: cast_nullable_to_non_nullable
as int?,conditions: null == conditions ? _self.conditions : conditions // ignore: cast_nullable_to_non_nullable
as PromoConditionsModel,activeHours: null == activeHours ? _self.activeHours : activeHours // ignore: cast_nullable_to_non_nullable
as ActiveHoursModel,validFrom: null == validFrom ? _self.validFrom : validFrom // ignore: cast_nullable_to_non_nullable
as DateTime,validTo: null == validTo ? _self.validTo : validTo // ignore: cast_nullable_to_non_nullable
as DateTime,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,consumerType: freezed == consumerType ? _self.consumerType : consumerType // ignore: cast_nullable_to_non_nullable
as String?,outlet: freezed == outlet ? _self.outlet : outlet // ignore: cast_nullable_to_non_nullable
as OutletModel?,
  ));
}

/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PromoConditionsModelCopyWith<$Res> get conditions {
  
  return $PromoConditionsModelCopyWith<$Res>(_self.conditions, (value) {
    return _then(_self.copyWith(conditions: value));
  });
}/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ActiveHoursModelCopyWith<$Res> get activeHours {
  
  return $ActiveHoursModelCopyWith<$Res>(_self.activeHours, (value) {
    return _then(_self.copyWith(activeHours: value));
  });
}/// Create a copy of AutoPromoModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OutletModelCopyWith<$Res>? get outlet {
    if (_self.outlet == null) {
    return null;
  }

  return $OutletModelCopyWith<$Res>(_self.outlet!, (value) {
    return _then(_self.copyWith(outlet: value));
  });
}
}


/// @nodoc
mixin _$PromoConditionsModel {

@HiveField(0) List<PromoProductModel> get products;@HiveField(1) List<BundleProductModel> get bundleProducts;@HiveField(2) int? get minQuantity;// untuk discount_on_quantity
@HiveField(3) int? get minTotal;// untuk discount_on_total
@HiveField(4) PromoProductModel? get buyProduct;// untuk buy_x_get_y
@HiveField(5) PromoProductModel? get getProduct;
/// Create a copy of PromoConditionsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PromoConditionsModelCopyWith<PromoConditionsModel> get copyWith => _$PromoConditionsModelCopyWithImpl<PromoConditionsModel>(this as PromoConditionsModel, _$identity);

  /// Serializes this PromoConditionsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PromoConditionsModel&&const DeepCollectionEquality().equals(other.products, products)&&const DeepCollectionEquality().equals(other.bundleProducts, bundleProducts)&&(identical(other.minQuantity, minQuantity) || other.minQuantity == minQuantity)&&(identical(other.minTotal, minTotal) || other.minTotal == minTotal)&&(identical(other.buyProduct, buyProduct) || other.buyProduct == buyProduct)&&(identical(other.getProduct, getProduct) || other.getProduct == getProduct));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(products),const DeepCollectionEquality().hash(bundleProducts),minQuantity,minTotal,buyProduct,getProduct);

@override
String toString() {
  return 'PromoConditionsModel(products: $products, bundleProducts: $bundleProducts, minQuantity: $minQuantity, minTotal: $minTotal, buyProduct: $buyProduct, getProduct: $getProduct)';
}


}

/// @nodoc
abstract mixin class $PromoConditionsModelCopyWith<$Res>  {
  factory $PromoConditionsModelCopyWith(PromoConditionsModel value, $Res Function(PromoConditionsModel) _then) = _$PromoConditionsModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) List<PromoProductModel> products,@HiveField(1) List<BundleProductModel> bundleProducts,@HiveField(2) int? minQuantity,@HiveField(3) int? minTotal,@HiveField(4) PromoProductModel? buyProduct,@HiveField(5) PromoProductModel? getProduct
});


$PromoProductModelCopyWith<$Res>? get buyProduct;$PromoProductModelCopyWith<$Res>? get getProduct;

}
/// @nodoc
class _$PromoConditionsModelCopyWithImpl<$Res>
    implements $PromoConditionsModelCopyWith<$Res> {
  _$PromoConditionsModelCopyWithImpl(this._self, this._then);

  final PromoConditionsModel _self;
  final $Res Function(PromoConditionsModel) _then;

/// Create a copy of PromoConditionsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? products = null,Object? bundleProducts = null,Object? minQuantity = freezed,Object? minTotal = freezed,Object? buyProduct = freezed,Object? getProduct = freezed,}) {
  return _then(_self.copyWith(
products: null == products ? _self.products : products // ignore: cast_nullable_to_non_nullable
as List<PromoProductModel>,bundleProducts: null == bundleProducts ? _self.bundleProducts : bundleProducts // ignore: cast_nullable_to_non_nullable
as List<BundleProductModel>,minQuantity: freezed == minQuantity ? _self.minQuantity : minQuantity // ignore: cast_nullable_to_non_nullable
as int?,minTotal: freezed == minTotal ? _self.minTotal : minTotal // ignore: cast_nullable_to_non_nullable
as int?,buyProduct: freezed == buyProduct ? _self.buyProduct : buyProduct // ignore: cast_nullable_to_non_nullable
as PromoProductModel?,getProduct: freezed == getProduct ? _self.getProduct : getProduct // ignore: cast_nullable_to_non_nullable
as PromoProductModel?,
  ));
}
/// Create a copy of PromoConditionsModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PromoProductModelCopyWith<$Res>? get buyProduct {
    if (_self.buyProduct == null) {
    return null;
  }

  return $PromoProductModelCopyWith<$Res>(_self.buyProduct!, (value) {
    return _then(_self.copyWith(buyProduct: value));
  });
}/// Create a copy of PromoConditionsModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PromoProductModelCopyWith<$Res>? get getProduct {
    if (_self.getProduct == null) {
    return null;
  }

  return $PromoProductModelCopyWith<$Res>(_self.getProduct!, (value) {
    return _then(_self.copyWith(getProduct: value));
  });
}
}


/// Adds pattern-matching-related methods to [PromoConditionsModel].
extension PromoConditionsModelPatterns on PromoConditionsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PromoConditionsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PromoConditionsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PromoConditionsModel value)  $default,){
final _that = this;
switch (_that) {
case _PromoConditionsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PromoConditionsModel value)?  $default,){
final _that = this;
switch (_that) {
case _PromoConditionsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  List<PromoProductModel> products, @HiveField(1)  List<BundleProductModel> bundleProducts, @HiveField(2)  int? minQuantity, @HiveField(3)  int? minTotal, @HiveField(4)  PromoProductModel? buyProduct, @HiveField(5)  PromoProductModel? getProduct)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PromoConditionsModel() when $default != null:
return $default(_that.products,_that.bundleProducts,_that.minQuantity,_that.minTotal,_that.buyProduct,_that.getProduct);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  List<PromoProductModel> products, @HiveField(1)  List<BundleProductModel> bundleProducts, @HiveField(2)  int? minQuantity, @HiveField(3)  int? minTotal, @HiveField(4)  PromoProductModel? buyProduct, @HiveField(5)  PromoProductModel? getProduct)  $default,) {final _that = this;
switch (_that) {
case _PromoConditionsModel():
return $default(_that.products,_that.bundleProducts,_that.minQuantity,_that.minTotal,_that.buyProduct,_that.getProduct);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  List<PromoProductModel> products, @HiveField(1)  List<BundleProductModel> bundleProducts, @HiveField(2)  int? minQuantity, @HiveField(3)  int? minTotal, @HiveField(4)  PromoProductModel? buyProduct, @HiveField(5)  PromoProductModel? getProduct)?  $default,) {final _that = this;
switch (_that) {
case _PromoConditionsModel() when $default != null:
return $default(_that.products,_that.bundleProducts,_that.minQuantity,_that.minTotal,_that.buyProduct,_that.getProduct);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PromoConditionsModel implements PromoConditionsModel {
   _PromoConditionsModel({@HiveField(0) final  List<PromoProductModel> products = const [], @HiveField(1) final  List<BundleProductModel> bundleProducts = const [], @HiveField(2) this.minQuantity, @HiveField(3) this.minTotal, @HiveField(4) this.buyProduct, @HiveField(5) this.getProduct}): _products = products,_bundleProducts = bundleProducts;
  factory _PromoConditionsModel.fromJson(Map<String, dynamic> json) => _$PromoConditionsModelFromJson(json);

 final  List<PromoProductModel> _products;
@override@JsonKey()@HiveField(0) List<PromoProductModel> get products {
  if (_products is EqualUnmodifiableListView) return _products;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_products);
}

 final  List<BundleProductModel> _bundleProducts;
@override@JsonKey()@HiveField(1) List<BundleProductModel> get bundleProducts {
  if (_bundleProducts is EqualUnmodifiableListView) return _bundleProducts;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_bundleProducts);
}

@override@HiveField(2) final  int? minQuantity;
// untuk discount_on_quantity
@override@HiveField(3) final  int? minTotal;
// untuk discount_on_total
@override@HiveField(4) final  PromoProductModel? buyProduct;
// untuk buy_x_get_y
@override@HiveField(5) final  PromoProductModel? getProduct;

/// Create a copy of PromoConditionsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PromoConditionsModelCopyWith<_PromoConditionsModel> get copyWith => __$PromoConditionsModelCopyWithImpl<_PromoConditionsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PromoConditionsModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PromoConditionsModel&&const DeepCollectionEquality().equals(other._products, _products)&&const DeepCollectionEquality().equals(other._bundleProducts, _bundleProducts)&&(identical(other.minQuantity, minQuantity) || other.minQuantity == minQuantity)&&(identical(other.minTotal, minTotal) || other.minTotal == minTotal)&&(identical(other.buyProduct, buyProduct) || other.buyProduct == buyProduct)&&(identical(other.getProduct, getProduct) || other.getProduct == getProduct));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_products),const DeepCollectionEquality().hash(_bundleProducts),minQuantity,minTotal,buyProduct,getProduct);

@override
String toString() {
  return 'PromoConditionsModel(products: $products, bundleProducts: $bundleProducts, minQuantity: $minQuantity, minTotal: $minTotal, buyProduct: $buyProduct, getProduct: $getProduct)';
}


}

/// @nodoc
abstract mixin class _$PromoConditionsModelCopyWith<$Res> implements $PromoConditionsModelCopyWith<$Res> {
  factory _$PromoConditionsModelCopyWith(_PromoConditionsModel value, $Res Function(_PromoConditionsModel) _then) = __$PromoConditionsModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) List<PromoProductModel> products,@HiveField(1) List<BundleProductModel> bundleProducts,@HiveField(2) int? minQuantity,@HiveField(3) int? minTotal,@HiveField(4) PromoProductModel? buyProduct,@HiveField(5) PromoProductModel? getProduct
});


@override $PromoProductModelCopyWith<$Res>? get buyProduct;@override $PromoProductModelCopyWith<$Res>? get getProduct;

}
/// @nodoc
class __$PromoConditionsModelCopyWithImpl<$Res>
    implements _$PromoConditionsModelCopyWith<$Res> {
  __$PromoConditionsModelCopyWithImpl(this._self, this._then);

  final _PromoConditionsModel _self;
  final $Res Function(_PromoConditionsModel) _then;

/// Create a copy of PromoConditionsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? products = null,Object? bundleProducts = null,Object? minQuantity = freezed,Object? minTotal = freezed,Object? buyProduct = freezed,Object? getProduct = freezed,}) {
  return _then(_PromoConditionsModel(
products: null == products ? _self._products : products // ignore: cast_nullable_to_non_nullable
as List<PromoProductModel>,bundleProducts: null == bundleProducts ? _self._bundleProducts : bundleProducts // ignore: cast_nullable_to_non_nullable
as List<BundleProductModel>,minQuantity: freezed == minQuantity ? _self.minQuantity : minQuantity // ignore: cast_nullable_to_non_nullable
as int?,minTotal: freezed == minTotal ? _self.minTotal : minTotal // ignore: cast_nullable_to_non_nullable
as int?,buyProduct: freezed == buyProduct ? _self.buyProduct : buyProduct // ignore: cast_nullable_to_non_nullable
as PromoProductModel?,getProduct: freezed == getProduct ? _self.getProduct : getProduct // ignore: cast_nullable_to_non_nullable
as PromoProductModel?,
  ));
}

/// Create a copy of PromoConditionsModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PromoProductModelCopyWith<$Res>? get buyProduct {
    if (_self.buyProduct == null) {
    return null;
  }

  return $PromoProductModelCopyWith<$Res>(_self.buyProduct!, (value) {
    return _then(_self.copyWith(buyProduct: value));
  });
}/// Create a copy of PromoConditionsModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PromoProductModelCopyWith<$Res>? get getProduct {
    if (_self.getProduct == null) {
    return null;
  }

  return $PromoProductModelCopyWith<$Res>(_self.getProduct!, (value) {
    return _then(_self.copyWith(getProduct: value));
  });
}
}


/// @nodoc
mixin _$BundleProductModel {

@HiveField(0)@JsonKey(name: '_id') String? get id;@HiveField(1) PromoProductModel get product;@HiveField(2) int get quantity;
/// Create a copy of BundleProductModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BundleProductModelCopyWith<BundleProductModel> get copyWith => _$BundleProductModelCopyWithImpl<BundleProductModel>(this as BundleProductModel, _$identity);

  /// Serializes this BundleProductModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BundleProductModel&&(identical(other.id, id) || other.id == id)&&(identical(other.product, product) || other.product == product)&&(identical(other.quantity, quantity) || other.quantity == quantity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,product,quantity);

@override
String toString() {
  return 'BundleProductModel(id: $id, product: $product, quantity: $quantity)';
}


}

/// @nodoc
abstract mixin class $BundleProductModelCopyWith<$Res>  {
  factory $BundleProductModelCopyWith(BundleProductModel value, $Res Function(BundleProductModel) _then) = _$BundleProductModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String? id,@HiveField(1) PromoProductModel product,@HiveField(2) int quantity
});


$PromoProductModelCopyWith<$Res> get product;

}
/// @nodoc
class _$BundleProductModelCopyWithImpl<$Res>
    implements $BundleProductModelCopyWith<$Res> {
  _$BundleProductModelCopyWithImpl(this._self, this._then);

  final BundleProductModel _self;
  final $Res Function(BundleProductModel) _then;

/// Create a copy of BundleProductModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = freezed,Object? product = null,Object? quantity = null,}) {
  return _then(_self.copyWith(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,product: null == product ? _self.product : product // ignore: cast_nullable_to_non_nullable
as PromoProductModel,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,
  ));
}
/// Create a copy of BundleProductModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PromoProductModelCopyWith<$Res> get product {
  
  return $PromoProductModelCopyWith<$Res>(_self.product, (value) {
    return _then(_self.copyWith(product: value));
  });
}
}


/// Adds pattern-matching-related methods to [BundleProductModel].
extension BundleProductModelPatterns on BundleProductModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _BundleProductModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _BundleProductModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _BundleProductModel value)  $default,){
final _that = this;
switch (_that) {
case _BundleProductModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _BundleProductModel value)?  $default,){
final _that = this;
switch (_that) {
case _BundleProductModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String? id, @HiveField(1)  PromoProductModel product, @HiveField(2)  int quantity)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BundleProductModel() when $default != null:
return $default(_that.id,_that.product,_that.quantity);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String? id, @HiveField(1)  PromoProductModel product, @HiveField(2)  int quantity)  $default,) {final _that = this;
switch (_that) {
case _BundleProductModel():
return $default(_that.id,_that.product,_that.quantity);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)@JsonKey(name: '_id')  String? id, @HiveField(1)  PromoProductModel product, @HiveField(2)  int quantity)?  $default,) {final _that = this;
switch (_that) {
case _BundleProductModel() when $default != null:
return $default(_that.id,_that.product,_that.quantity);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _BundleProductModel implements BundleProductModel {
   _BundleProductModel({@HiveField(0)@JsonKey(name: '_id') this.id, @HiveField(1) required this.product, @HiveField(2) required this.quantity});
  factory _BundleProductModel.fromJson(Map<String, dynamic> json) => _$BundleProductModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String? id;
@override@HiveField(1) final  PromoProductModel product;
@override@HiveField(2) final  int quantity;

/// Create a copy of BundleProductModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BundleProductModelCopyWith<_BundleProductModel> get copyWith => __$BundleProductModelCopyWithImpl<_BundleProductModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$BundleProductModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _BundleProductModel&&(identical(other.id, id) || other.id == id)&&(identical(other.product, product) || other.product == product)&&(identical(other.quantity, quantity) || other.quantity == quantity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,product,quantity);

@override
String toString() {
  return 'BundleProductModel(id: $id, product: $product, quantity: $quantity)';
}


}

/// @nodoc
abstract mixin class _$BundleProductModelCopyWith<$Res> implements $BundleProductModelCopyWith<$Res> {
  factory _$BundleProductModelCopyWith(_BundleProductModel value, $Res Function(_BundleProductModel) _then) = __$BundleProductModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String? id,@HiveField(1) PromoProductModel product,@HiveField(2) int quantity
});


@override $PromoProductModelCopyWith<$Res> get product;

}
/// @nodoc
class __$BundleProductModelCopyWithImpl<$Res>
    implements _$BundleProductModelCopyWith<$Res> {
  __$BundleProductModelCopyWithImpl(this._self, this._then);

  final _BundleProductModel _self;
  final $Res Function(_BundleProductModel) _then;

/// Create a copy of BundleProductModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = freezed,Object? product = null,Object? quantity = null,}) {
  return _then(_BundleProductModel(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,product: null == product ? _self.product : product // ignore: cast_nullable_to_non_nullable
as PromoProductModel,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

/// Create a copy of BundleProductModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$PromoProductModelCopyWith<$Res> get product {
  
  return $PromoProductModelCopyWith<$Res>(_self.product, (value) {
    return _then(_self.copyWith(product: value));
  });
}
}


/// @nodoc
mixin _$PromoProductModel {

@HiveField(0)@JsonKey(name: '_id') String get id;@HiveField(1) String get name;
/// Create a copy of PromoProductModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PromoProductModelCopyWith<PromoProductModel> get copyWith => _$PromoProductModelCopyWithImpl<PromoProductModel>(this as PromoProductModel, _$identity);

  /// Serializes this PromoProductModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PromoProductModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'PromoProductModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class $PromoProductModelCopyWith<$Res>  {
  factory $PromoProductModelCopyWith(PromoProductModel value, $Res Function(PromoProductModel) _then) = _$PromoProductModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class _$PromoProductModelCopyWithImpl<$Res>
    implements $PromoProductModelCopyWith<$Res> {
  _$PromoProductModelCopyWithImpl(this._self, this._then);

  final PromoProductModel _self;
  final $Res Function(PromoProductModel) _then;

/// Create a copy of PromoProductModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [PromoProductModel].
extension PromoProductModelPatterns on PromoProductModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PromoProductModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PromoProductModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PromoProductModel value)  $default,){
final _that = this;
switch (_that) {
case _PromoProductModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PromoProductModel value)?  $default,){
final _that = this;
switch (_that) {
case _PromoProductModel() when $default != null:
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
case _PromoProductModel() when $default != null:
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
case _PromoProductModel():
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
case _PromoProductModel() when $default != null:
return $default(_that.id,_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PromoProductModel implements PromoProductModel {
   _PromoProductModel({@HiveField(0)@JsonKey(name: '_id') required this.id, @HiveField(1) required this.name});
  factory _PromoProductModel.fromJson(Map<String, dynamic> json) => _$PromoProductModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String id;
@override@HiveField(1) final  String name;

/// Create a copy of PromoProductModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PromoProductModelCopyWith<_PromoProductModel> get copyWith => __$PromoProductModelCopyWithImpl<_PromoProductModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PromoProductModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PromoProductModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'PromoProductModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class _$PromoProductModelCopyWith<$Res> implements $PromoProductModelCopyWith<$Res> {
  factory _$PromoProductModelCopyWith(_PromoProductModel value, $Res Function(_PromoProductModel) _then) = __$PromoProductModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class __$PromoProductModelCopyWithImpl<$Res>
    implements _$PromoProductModelCopyWith<$Res> {
  __$PromoProductModelCopyWithImpl(this._self, this._then);

  final _PromoProductModel _self;
  final $Res Function(_PromoProductModel) _then;

/// Create a copy of PromoProductModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,}) {
  return _then(_PromoProductModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$ActiveHoursModel {

@HiveField(0) bool get isEnabled;@HiveField(1) List<ScheduleModel> get schedule;
/// Create a copy of ActiveHoursModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ActiveHoursModelCopyWith<ActiveHoursModel> get copyWith => _$ActiveHoursModelCopyWithImpl<ActiveHoursModel>(this as ActiveHoursModel, _$identity);

  /// Serializes this ActiveHoursModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ActiveHoursModel&&(identical(other.isEnabled, isEnabled) || other.isEnabled == isEnabled)&&const DeepCollectionEquality().equals(other.schedule, schedule));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,isEnabled,const DeepCollectionEquality().hash(schedule));

@override
String toString() {
  return 'ActiveHoursModel(isEnabled: $isEnabled, schedule: $schedule)';
}


}

/// @nodoc
abstract mixin class $ActiveHoursModelCopyWith<$Res>  {
  factory $ActiveHoursModelCopyWith(ActiveHoursModel value, $Res Function(ActiveHoursModel) _then) = _$ActiveHoursModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) bool isEnabled,@HiveField(1) List<ScheduleModel> schedule
});




}
/// @nodoc
class _$ActiveHoursModelCopyWithImpl<$Res>
    implements $ActiveHoursModelCopyWith<$Res> {
  _$ActiveHoursModelCopyWithImpl(this._self, this._then);

  final ActiveHoursModel _self;
  final $Res Function(ActiveHoursModel) _then;

/// Create a copy of ActiveHoursModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? isEnabled = null,Object? schedule = null,}) {
  return _then(_self.copyWith(
isEnabled: null == isEnabled ? _self.isEnabled : isEnabled // ignore: cast_nullable_to_non_nullable
as bool,schedule: null == schedule ? _self.schedule : schedule // ignore: cast_nullable_to_non_nullable
as List<ScheduleModel>,
  ));
}

}


/// Adds pattern-matching-related methods to [ActiveHoursModel].
extension ActiveHoursModelPatterns on ActiveHoursModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ActiveHoursModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ActiveHoursModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ActiveHoursModel value)  $default,){
final _that = this;
switch (_that) {
case _ActiveHoursModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ActiveHoursModel value)?  $default,){
final _that = this;
switch (_that) {
case _ActiveHoursModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  bool isEnabled, @HiveField(1)  List<ScheduleModel> schedule)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ActiveHoursModel() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  bool isEnabled, @HiveField(1)  List<ScheduleModel> schedule)  $default,) {final _that = this;
switch (_that) {
case _ActiveHoursModel():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  bool isEnabled, @HiveField(1)  List<ScheduleModel> schedule)?  $default,) {final _that = this;
switch (_that) {
case _ActiveHoursModel() when $default != null:
return $default(_that.isEnabled,_that.schedule);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ActiveHoursModel implements ActiveHoursModel {
   _ActiveHoursModel({@HiveField(0) this.isEnabled = false, @HiveField(1) final  List<ScheduleModel> schedule = const []}): _schedule = schedule;
  factory _ActiveHoursModel.fromJson(Map<String, dynamic> json) => _$ActiveHoursModelFromJson(json);

@override@JsonKey()@HiveField(0) final  bool isEnabled;
 final  List<ScheduleModel> _schedule;
@override@JsonKey()@HiveField(1) List<ScheduleModel> get schedule {
  if (_schedule is EqualUnmodifiableListView) return _schedule;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_schedule);
}


/// Create a copy of ActiveHoursModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ActiveHoursModelCopyWith<_ActiveHoursModel> get copyWith => __$ActiveHoursModelCopyWithImpl<_ActiveHoursModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ActiveHoursModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ActiveHoursModel&&(identical(other.isEnabled, isEnabled) || other.isEnabled == isEnabled)&&const DeepCollectionEquality().equals(other._schedule, _schedule));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,isEnabled,const DeepCollectionEquality().hash(_schedule));

@override
String toString() {
  return 'ActiveHoursModel(isEnabled: $isEnabled, schedule: $schedule)';
}


}

/// @nodoc
abstract mixin class _$ActiveHoursModelCopyWith<$Res> implements $ActiveHoursModelCopyWith<$Res> {
  factory _$ActiveHoursModelCopyWith(_ActiveHoursModel value, $Res Function(_ActiveHoursModel) _then) = __$ActiveHoursModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) bool isEnabled,@HiveField(1) List<ScheduleModel> schedule
});




}
/// @nodoc
class __$ActiveHoursModelCopyWithImpl<$Res>
    implements _$ActiveHoursModelCopyWith<$Res> {
  __$ActiveHoursModelCopyWithImpl(this._self, this._then);

  final _ActiveHoursModel _self;
  final $Res Function(_ActiveHoursModel) _then;

/// Create a copy of ActiveHoursModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? isEnabled = null,Object? schedule = null,}) {
  return _then(_ActiveHoursModel(
isEnabled: null == isEnabled ? _self.isEnabled : isEnabled // ignore: cast_nullable_to_non_nullable
as bool,schedule: null == schedule ? _self._schedule : schedule // ignore: cast_nullable_to_non_nullable
as List<ScheduleModel>,
  ));
}


}


/// @nodoc
mixin _$ScheduleModel {

@HiveField(0)@JsonKey(name: '_id') String? get id;@HiveField(1) int get dayOfWeek;// 0=Minggu, 6=Sabtu
@HiveField(2) String get startTime;// format "HH:mm"
@HiveField(3) String get endTime;
/// Create a copy of ScheduleModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ScheduleModelCopyWith<ScheduleModel> get copyWith => _$ScheduleModelCopyWithImpl<ScheduleModel>(this as ScheduleModel, _$identity);

  /// Serializes this ScheduleModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ScheduleModel&&(identical(other.id, id) || other.id == id)&&(identical(other.dayOfWeek, dayOfWeek) || other.dayOfWeek == dayOfWeek)&&(identical(other.startTime, startTime) || other.startTime == startTime)&&(identical(other.endTime, endTime) || other.endTime == endTime));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,dayOfWeek,startTime,endTime);

@override
String toString() {
  return 'ScheduleModel(id: $id, dayOfWeek: $dayOfWeek, startTime: $startTime, endTime: $endTime)';
}


}

/// @nodoc
abstract mixin class $ScheduleModelCopyWith<$Res>  {
  factory $ScheduleModelCopyWith(ScheduleModel value, $Res Function(ScheduleModel) _then) = _$ScheduleModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String? id,@HiveField(1) int dayOfWeek,@HiveField(2) String startTime,@HiveField(3) String endTime
});




}
/// @nodoc
class _$ScheduleModelCopyWithImpl<$Res>
    implements $ScheduleModelCopyWith<$Res> {
  _$ScheduleModelCopyWithImpl(this._self, this._then);

  final ScheduleModel _self;
  final $Res Function(ScheduleModel) _then;

/// Create a copy of ScheduleModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = freezed,Object? dayOfWeek = null,Object? startTime = null,Object? endTime = null,}) {
  return _then(_self.copyWith(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,dayOfWeek: null == dayOfWeek ? _self.dayOfWeek : dayOfWeek // ignore: cast_nullable_to_non_nullable
as int,startTime: null == startTime ? _self.startTime : startTime // ignore: cast_nullable_to_non_nullable
as String,endTime: null == endTime ? _self.endTime : endTime // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ScheduleModel].
extension ScheduleModelPatterns on ScheduleModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ScheduleModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ScheduleModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ScheduleModel value)  $default,){
final _that = this;
switch (_that) {
case _ScheduleModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ScheduleModel value)?  $default,){
final _that = this;
switch (_that) {
case _ScheduleModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String? id, @HiveField(1)  int dayOfWeek, @HiveField(2)  String startTime, @HiveField(3)  String endTime)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ScheduleModel() when $default != null:
return $default(_that.id,_that.dayOfWeek,_that.startTime,_that.endTime);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String? id, @HiveField(1)  int dayOfWeek, @HiveField(2)  String startTime, @HiveField(3)  String endTime)  $default,) {final _that = this;
switch (_that) {
case _ScheduleModel():
return $default(_that.id,_that.dayOfWeek,_that.startTime,_that.endTime);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)@JsonKey(name: '_id')  String? id, @HiveField(1)  int dayOfWeek, @HiveField(2)  String startTime, @HiveField(3)  String endTime)?  $default,) {final _that = this;
switch (_that) {
case _ScheduleModel() when $default != null:
return $default(_that.id,_that.dayOfWeek,_that.startTime,_that.endTime);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ScheduleModel implements ScheduleModel {
   _ScheduleModel({@HiveField(0)@JsonKey(name: '_id') this.id, @HiveField(1) required this.dayOfWeek, @HiveField(2) required this.startTime, @HiveField(3) required this.endTime});
  factory _ScheduleModel.fromJson(Map<String, dynamic> json) => _$ScheduleModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String? id;
@override@HiveField(1) final  int dayOfWeek;
// 0=Minggu, 6=Sabtu
@override@HiveField(2) final  String startTime;
// format "HH:mm"
@override@HiveField(3) final  String endTime;

/// Create a copy of ScheduleModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ScheduleModelCopyWith<_ScheduleModel> get copyWith => __$ScheduleModelCopyWithImpl<_ScheduleModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ScheduleModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ScheduleModel&&(identical(other.id, id) || other.id == id)&&(identical(other.dayOfWeek, dayOfWeek) || other.dayOfWeek == dayOfWeek)&&(identical(other.startTime, startTime) || other.startTime == startTime)&&(identical(other.endTime, endTime) || other.endTime == endTime));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,dayOfWeek,startTime,endTime);

@override
String toString() {
  return 'ScheduleModel(id: $id, dayOfWeek: $dayOfWeek, startTime: $startTime, endTime: $endTime)';
}


}

/// @nodoc
abstract mixin class _$ScheduleModelCopyWith<$Res> implements $ScheduleModelCopyWith<$Res> {
  factory _$ScheduleModelCopyWith(_ScheduleModel value, $Res Function(_ScheduleModel) _then) = __$ScheduleModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String? id,@HiveField(1) int dayOfWeek,@HiveField(2) String startTime,@HiveField(3) String endTime
});




}
/// @nodoc
class __$ScheduleModelCopyWithImpl<$Res>
    implements _$ScheduleModelCopyWith<$Res> {
  __$ScheduleModelCopyWithImpl(this._self, this._then);

  final _ScheduleModel _self;
  final $Res Function(_ScheduleModel) _then;

/// Create a copy of ScheduleModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = freezed,Object? dayOfWeek = null,Object? startTime = null,Object? endTime = null,}) {
  return _then(_ScheduleModel(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,dayOfWeek: null == dayOfWeek ? _self.dayOfWeek : dayOfWeek // ignore: cast_nullable_to_non_nullable
as int,startTime: null == startTime ? _self.startTime : startTime // ignore: cast_nullable_to_non_nullable
as String,endTime: null == endTime ? _self.endTime : endTime // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$OutletModel {

@HiveField(0)@JsonKey(name: '_id') String get id;@HiveField(1) String get name;
/// Create a copy of OutletModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OutletModelCopyWith<OutletModel> get copyWith => _$OutletModelCopyWithImpl<OutletModel>(this as OutletModel, _$identity);

  /// Serializes this OutletModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OutletModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'OutletModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class $OutletModelCopyWith<$Res>  {
  factory $OutletModelCopyWith(OutletModel value, $Res Function(OutletModel) _then) = _$OutletModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class _$OutletModelCopyWithImpl<$Res>
    implements $OutletModelCopyWith<$Res> {
  _$OutletModelCopyWithImpl(this._self, this._then);

  final OutletModel _self;
  final $Res Function(OutletModel) _then;

/// Create a copy of OutletModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [OutletModel].
extension OutletModelPatterns on OutletModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OutletModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OutletModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OutletModel value)  $default,){
final _that = this;
switch (_that) {
case _OutletModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OutletModel value)?  $default,){
final _that = this;
switch (_that) {
case _OutletModel() when $default != null:
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
case _OutletModel() when $default != null:
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
case _OutletModel():
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
case _OutletModel() when $default != null:
return $default(_that.id,_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OutletModel implements OutletModel {
   _OutletModel({@HiveField(0)@JsonKey(name: '_id') required this.id, @HiveField(1) required this.name});
  factory _OutletModel.fromJson(Map<String, dynamic> json) => _$OutletModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String id;
@override@HiveField(1) final  String name;

/// Create a copy of OutletModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OutletModelCopyWith<_OutletModel> get copyWith => __$OutletModelCopyWithImpl<_OutletModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OutletModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OutletModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'OutletModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class _$OutletModelCopyWith<$Res> implements $OutletModelCopyWith<$Res> {
  factory _$OutletModelCopyWith(_OutletModel value, $Res Function(_OutletModel) _then) = __$OutletModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class __$OutletModelCopyWithImpl<$Res>
    implements _$OutletModelCopyWith<$Res> {
  __$OutletModelCopyWithImpl(this._self, this._then);

  final _OutletModel _self;
  final $Res Function(_OutletModel) _then;

/// Create a copy of OutletModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,}) {
  return _then(_OutletModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
