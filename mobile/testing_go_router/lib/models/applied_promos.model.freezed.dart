// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
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

@HiveField(0) String get promoId;@HiveField(1) String get promoName;@HiveField(2) String get promoType;@HiveField(3) int? get discount;@HiveField(4) List<AffectedItemModel> get affectedItems;@HiveField(5) List<FreeItemModel> get freeItems;@HiveField(6)@JsonKey(name: '_id') String? get id;
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
@HiveField(0) String promoId,@HiveField(1) String promoName,@HiveField(2) String promoType,@HiveField(3) int? discount,@HiveField(4) List<AffectedItemModel> affectedItems,@HiveField(5) List<FreeItemModel> freeItems,@HiveField(6)@JsonKey(name: '_id') String? id
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
@pragma('vm:prefer-inline') @override $Res call({Object? promoId = null,Object? promoName = null,Object? promoType = null,Object? discount = freezed,Object? affectedItems = null,Object? freeItems = null,Object? id = freezed,}) {
  return _then(_self.copyWith(
promoId: null == promoId ? _self.promoId : promoId // ignore: cast_nullable_to_non_nullable
as String,promoName: null == promoName ? _self.promoName : promoName // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,discount: freezed == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int?,affectedItems: null == affectedItems ? _self.affectedItems : affectedItems // ignore: cast_nullable_to_non_nullable
as List<AffectedItemModel>,freeItems: null == freeItems ? _self.freeItems : freeItems // ignore: cast_nullable_to_non_nullable
as List<FreeItemModel>,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [AppliedPromosModel].
extension AppliedPromosModelPatterns on AppliedPromosModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AppliedPromosModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AppliedPromosModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AppliedPromosModel value)  $default,){
final _that = this;
switch (_that) {
case _AppliedPromosModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AppliedPromosModel value)?  $default,){
final _that = this;
switch (_that) {
case _AppliedPromosModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String promoId, @HiveField(1)  String promoName, @HiveField(2)  String promoType, @HiveField(3)  int? discount, @HiveField(4)  List<AffectedItemModel> affectedItems, @HiveField(5)  List<FreeItemModel> freeItems, @HiveField(6)@JsonKey(name: '_id')  String? id)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AppliedPromosModel() when $default != null:
return $default(_that.promoId,_that.promoName,_that.promoType,_that.discount,_that.affectedItems,_that.freeItems,_that.id);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String promoId, @HiveField(1)  String promoName, @HiveField(2)  String promoType, @HiveField(3)  int? discount, @HiveField(4)  List<AffectedItemModel> affectedItems, @HiveField(5)  List<FreeItemModel> freeItems, @HiveField(6)@JsonKey(name: '_id')  String? id)  $default,) {final _that = this;
switch (_that) {
case _AppliedPromosModel():
return $default(_that.promoId,_that.promoName,_that.promoType,_that.discount,_that.affectedItems,_that.freeItems,_that.id);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String promoId, @HiveField(1)  String promoName, @HiveField(2)  String promoType, @HiveField(3)  int? discount, @HiveField(4)  List<AffectedItemModel> affectedItems, @HiveField(5)  List<FreeItemModel> freeItems, @HiveField(6)@JsonKey(name: '_id')  String? id)?  $default,) {final _that = this;
switch (_that) {
case _AppliedPromosModel() when $default != null:
return $default(_that.promoId,_that.promoName,_that.promoType,_that.discount,_that.affectedItems,_that.freeItems,_that.id);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AppliedPromosModel implements AppliedPromosModel {
   _AppliedPromosModel({@HiveField(0) required this.promoId, @HiveField(1) required this.promoName, @HiveField(2) required this.promoType, @HiveField(3) this.discount = 0, @HiveField(4) final  List<AffectedItemModel> affectedItems = const [], @HiveField(5) final  List<FreeItemModel> freeItems = const [], @HiveField(6)@JsonKey(name: '_id') this.id = null}): _affectedItems = affectedItems,_freeItems = freeItems;
  factory _AppliedPromosModel.fromJson(Map<String, dynamic> json) => _$AppliedPromosModelFromJson(json);

@override@HiveField(0) final  String promoId;
@override@HiveField(1) final  String promoName;
@override@HiveField(2) final  String promoType;
@override@JsonKey()@HiveField(3) final  int? discount;
 final  List<AffectedItemModel> _affectedItems;
@override@JsonKey()@HiveField(4) List<AffectedItemModel> get affectedItems {
  if (_affectedItems is EqualUnmodifiableListView) return _affectedItems;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_affectedItems);
}

 final  List<FreeItemModel> _freeItems;
@override@JsonKey()@HiveField(5) List<FreeItemModel> get freeItems {
  if (_freeItems is EqualUnmodifiableListView) return _freeItems;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_freeItems);
}

@override@HiveField(6)@JsonKey(name: '_id') final  String? id;

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
@HiveField(0) String promoId,@HiveField(1) String promoName,@HiveField(2) String promoType,@HiveField(3) int? discount,@HiveField(4) List<AffectedItemModel> affectedItems,@HiveField(5) List<FreeItemModel> freeItems,@HiveField(6)@JsonKey(name: '_id') String? id
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
@override @pragma('vm:prefer-inline') $Res call({Object? promoId = null,Object? promoName = null,Object? promoType = null,Object? discount = freezed,Object? affectedItems = null,Object? freeItems = null,Object? id = freezed,}) {
  return _then(_AppliedPromosModel(
promoId: null == promoId ? _self.promoId : promoId // ignore: cast_nullable_to_non_nullable
as String,promoName: null == promoName ? _self.promoName : promoName // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,discount: freezed == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int?,affectedItems: null == affectedItems ? _self._affectedItems : affectedItems // ignore: cast_nullable_to_non_nullable
as List<AffectedItemModel>,freeItems: null == freeItems ? _self._freeItems : freeItems // ignore: cast_nullable_to_non_nullable
as List<FreeItemModel>,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
