// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'menu_stock.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$MenuStockModel {

@HiveField(0) int? get calculatedStock;@HiveField(1) int? get manualStock;@HiveField(2) int? get effectiveStock;@HiveField(3) int? get currentStock;@HiveField(4) bool? get isAvailable;@HiveField(5) String? get lastCalculatedAt;@HiveField(6) String? get lastAdjustedAt;
/// Create a copy of MenuStockModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MenuStockModelCopyWith<MenuStockModel> get copyWith => _$MenuStockModelCopyWithImpl<MenuStockModel>(this as MenuStockModel, _$identity);

  /// Serializes this MenuStockModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MenuStockModel&&(identical(other.calculatedStock, calculatedStock) || other.calculatedStock == calculatedStock)&&(identical(other.manualStock, manualStock) || other.manualStock == manualStock)&&(identical(other.effectiveStock, effectiveStock) || other.effectiveStock == effectiveStock)&&(identical(other.currentStock, currentStock) || other.currentStock == currentStock)&&(identical(other.isAvailable, isAvailable) || other.isAvailable == isAvailable)&&(identical(other.lastCalculatedAt, lastCalculatedAt) || other.lastCalculatedAt == lastCalculatedAt)&&(identical(other.lastAdjustedAt, lastAdjustedAt) || other.lastAdjustedAt == lastAdjustedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,calculatedStock,manualStock,effectiveStock,currentStock,isAvailable,lastCalculatedAt,lastAdjustedAt);

@override
String toString() {
  return 'MenuStockModel(calculatedStock: $calculatedStock, manualStock: $manualStock, effectiveStock: $effectiveStock, currentStock: $currentStock, isAvailable: $isAvailable, lastCalculatedAt: $lastCalculatedAt, lastAdjustedAt: $lastAdjustedAt)';
}


}

/// @nodoc
abstract mixin class $MenuStockModelCopyWith<$Res>  {
  factory $MenuStockModelCopyWith(MenuStockModel value, $Res Function(MenuStockModel) _then) = _$MenuStockModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) int? calculatedStock,@HiveField(1) int? manualStock,@HiveField(2) int? effectiveStock,@HiveField(3) int? currentStock,@HiveField(4) bool? isAvailable,@HiveField(5) String? lastCalculatedAt,@HiveField(6) String? lastAdjustedAt
});




}
/// @nodoc
class _$MenuStockModelCopyWithImpl<$Res>
    implements $MenuStockModelCopyWith<$Res> {
  _$MenuStockModelCopyWithImpl(this._self, this._then);

  final MenuStockModel _self;
  final $Res Function(MenuStockModel) _then;

/// Create a copy of MenuStockModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? calculatedStock = freezed,Object? manualStock = freezed,Object? effectiveStock = freezed,Object? currentStock = freezed,Object? isAvailable = freezed,Object? lastCalculatedAt = freezed,Object? lastAdjustedAt = freezed,}) {
  return _then(_self.copyWith(
calculatedStock: freezed == calculatedStock ? _self.calculatedStock : calculatedStock // ignore: cast_nullable_to_non_nullable
as int?,manualStock: freezed == manualStock ? _self.manualStock : manualStock // ignore: cast_nullable_to_non_nullable
as int?,effectiveStock: freezed == effectiveStock ? _self.effectiveStock : effectiveStock // ignore: cast_nullable_to_non_nullable
as int?,currentStock: freezed == currentStock ? _self.currentStock : currentStock // ignore: cast_nullable_to_non_nullable
as int?,isAvailable: freezed == isAvailable ? _self.isAvailable : isAvailable // ignore: cast_nullable_to_non_nullable
as bool?,lastCalculatedAt: freezed == lastCalculatedAt ? _self.lastCalculatedAt : lastCalculatedAt // ignore: cast_nullable_to_non_nullable
as String?,lastAdjustedAt: freezed == lastAdjustedAt ? _self.lastAdjustedAt : lastAdjustedAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [MenuStockModel].
extension MenuStockModelPatterns on MenuStockModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MenuStockModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MenuStockModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MenuStockModel value)  $default,){
final _that = this;
switch (_that) {
case _MenuStockModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MenuStockModel value)?  $default,){
final _that = this;
switch (_that) {
case _MenuStockModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  int? calculatedStock, @HiveField(1)  int? manualStock, @HiveField(2)  int? effectiveStock, @HiveField(3)  int? currentStock, @HiveField(4)  bool? isAvailable, @HiveField(5)  String? lastCalculatedAt, @HiveField(6)  String? lastAdjustedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MenuStockModel() when $default != null:
return $default(_that.calculatedStock,_that.manualStock,_that.effectiveStock,_that.currentStock,_that.isAvailable,_that.lastCalculatedAt,_that.lastAdjustedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  int? calculatedStock, @HiveField(1)  int? manualStock, @HiveField(2)  int? effectiveStock, @HiveField(3)  int? currentStock, @HiveField(4)  bool? isAvailable, @HiveField(5)  String? lastCalculatedAt, @HiveField(6)  String? lastAdjustedAt)  $default,) {final _that = this;
switch (_that) {
case _MenuStockModel():
return $default(_that.calculatedStock,_that.manualStock,_that.effectiveStock,_that.currentStock,_that.isAvailable,_that.lastCalculatedAt,_that.lastAdjustedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  int? calculatedStock, @HiveField(1)  int? manualStock, @HiveField(2)  int? effectiveStock, @HiveField(3)  int? currentStock, @HiveField(4)  bool? isAvailable, @HiveField(5)  String? lastCalculatedAt, @HiveField(6)  String? lastAdjustedAt)?  $default,) {final _that = this;
switch (_that) {
case _MenuStockModel() when $default != null:
return $default(_that.calculatedStock,_that.manualStock,_that.effectiveStock,_that.currentStock,_that.isAvailable,_that.lastCalculatedAt,_that.lastAdjustedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MenuStockModel implements MenuStockModel {
   _MenuStockModel({@HiveField(0) this.calculatedStock = 0, @HiveField(1) this.manualStock = 0, @HiveField(2) this.effectiveStock = 0, @HiveField(3) this.currentStock = 0, @HiveField(4) this.isAvailable = false, @HiveField(5) this.lastCalculatedAt = null, @HiveField(6) this.lastAdjustedAt = null});
  factory _MenuStockModel.fromJson(Map<String, dynamic> json) => _$MenuStockModelFromJson(json);

@override@JsonKey()@HiveField(0) final  int? calculatedStock;
@override@JsonKey()@HiveField(1) final  int? manualStock;
@override@JsonKey()@HiveField(2) final  int? effectiveStock;
@override@JsonKey()@HiveField(3) final  int? currentStock;
@override@JsonKey()@HiveField(4) final  bool? isAvailable;
@override@JsonKey()@HiveField(5) final  String? lastCalculatedAt;
@override@JsonKey()@HiveField(6) final  String? lastAdjustedAt;

/// Create a copy of MenuStockModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MenuStockModelCopyWith<_MenuStockModel> get copyWith => __$MenuStockModelCopyWithImpl<_MenuStockModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MenuStockModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MenuStockModel&&(identical(other.calculatedStock, calculatedStock) || other.calculatedStock == calculatedStock)&&(identical(other.manualStock, manualStock) || other.manualStock == manualStock)&&(identical(other.effectiveStock, effectiveStock) || other.effectiveStock == effectiveStock)&&(identical(other.currentStock, currentStock) || other.currentStock == currentStock)&&(identical(other.isAvailable, isAvailable) || other.isAvailable == isAvailable)&&(identical(other.lastCalculatedAt, lastCalculatedAt) || other.lastCalculatedAt == lastCalculatedAt)&&(identical(other.lastAdjustedAt, lastAdjustedAt) || other.lastAdjustedAt == lastAdjustedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,calculatedStock,manualStock,effectiveStock,currentStock,isAvailable,lastCalculatedAt,lastAdjustedAt);

@override
String toString() {
  return 'MenuStockModel(calculatedStock: $calculatedStock, manualStock: $manualStock, effectiveStock: $effectiveStock, currentStock: $currentStock, isAvailable: $isAvailable, lastCalculatedAt: $lastCalculatedAt, lastAdjustedAt: $lastAdjustedAt)';
}


}

/// @nodoc
abstract mixin class _$MenuStockModelCopyWith<$Res> implements $MenuStockModelCopyWith<$Res> {
  factory _$MenuStockModelCopyWith(_MenuStockModel value, $Res Function(_MenuStockModel) _then) = __$MenuStockModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) int? calculatedStock,@HiveField(1) int? manualStock,@HiveField(2) int? effectiveStock,@HiveField(3) int? currentStock,@HiveField(4) bool? isAvailable,@HiveField(5) String? lastCalculatedAt,@HiveField(6) String? lastAdjustedAt
});




}
/// @nodoc
class __$MenuStockModelCopyWithImpl<$Res>
    implements _$MenuStockModelCopyWith<$Res> {
  __$MenuStockModelCopyWithImpl(this._self, this._then);

  final _MenuStockModel _self;
  final $Res Function(_MenuStockModel) _then;

/// Create a copy of MenuStockModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? calculatedStock = freezed,Object? manualStock = freezed,Object? effectiveStock = freezed,Object? currentStock = freezed,Object? isAvailable = freezed,Object? lastCalculatedAt = freezed,Object? lastAdjustedAt = freezed,}) {
  return _then(_MenuStockModel(
calculatedStock: freezed == calculatedStock ? _self.calculatedStock : calculatedStock // ignore: cast_nullable_to_non_nullable
as int?,manualStock: freezed == manualStock ? _self.manualStock : manualStock // ignore: cast_nullable_to_non_nullable
as int?,effectiveStock: freezed == effectiveStock ? _self.effectiveStock : effectiveStock // ignore: cast_nullable_to_non_nullable
as int?,currentStock: freezed == currentStock ? _self.currentStock : currentStock // ignore: cast_nullable_to_non_nullable
as int?,isAvailable: freezed == isAvailable ? _self.isAvailable : isAvailable // ignore: cast_nullable_to_non_nullable
as bool?,lastCalculatedAt: freezed == lastCalculatedAt ? _self.lastCalculatedAt : lastCalculatedAt // ignore: cast_nullable_to_non_nullable
as String?,lastAdjustedAt: freezed == lastAdjustedAt ? _self.lastAdjustedAt : lastAdjustedAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
