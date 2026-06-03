// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'addon_option.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AddonOptionModel {

@HiveField(0) String? get id;@HiveField(1) String? get label;@HiveField(2) bool? get isDefault;@HiveField(3) int? get price;
/// Create a copy of AddonOptionModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AddonOptionModelCopyWith<AddonOptionModel> get copyWith => _$AddonOptionModelCopyWithImpl<AddonOptionModel>(this as AddonOptionModel, _$identity);

  /// Serializes this AddonOptionModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AddonOptionModel&&(identical(other.id, id) || other.id == id)&&(identical(other.label, label) || other.label == label)&&(identical(other.isDefault, isDefault) || other.isDefault == isDefault)&&(identical(other.price, price) || other.price == price));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,label,isDefault,price);

@override
String toString() {
  return 'AddonOptionModel(id: $id, label: $label, isDefault: $isDefault, price: $price)';
}


}

/// @nodoc
abstract mixin class $AddonOptionModelCopyWith<$Res>  {
  factory $AddonOptionModelCopyWith(AddonOptionModel value, $Res Function(AddonOptionModel) _then) = _$AddonOptionModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String? id,@HiveField(1) String? label,@HiveField(2) bool? isDefault,@HiveField(3) int? price
});




}
/// @nodoc
class _$AddonOptionModelCopyWithImpl<$Res>
    implements $AddonOptionModelCopyWith<$Res> {
  _$AddonOptionModelCopyWithImpl(this._self, this._then);

  final AddonOptionModel _self;
  final $Res Function(AddonOptionModel) _then;

/// Create a copy of AddonOptionModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = freezed,Object? label = freezed,Object? isDefault = freezed,Object? price = freezed,}) {
  return _then(_self.copyWith(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,label: freezed == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String?,isDefault: freezed == isDefault ? _self.isDefault : isDefault // ignore: cast_nullable_to_non_nullable
as bool?,price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [AddonOptionModel].
extension AddonOptionModelPatterns on AddonOptionModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AddonOptionModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AddonOptionModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AddonOptionModel value)  $default,){
final _that = this;
switch (_that) {
case _AddonOptionModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AddonOptionModel value)?  $default,){
final _that = this;
switch (_that) {
case _AddonOptionModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String? id, @HiveField(1)  String? label, @HiveField(2)  bool? isDefault, @HiveField(3)  int? price)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AddonOptionModel() when $default != null:
return $default(_that.id,_that.label,_that.isDefault,_that.price);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String? id, @HiveField(1)  String? label, @HiveField(2)  bool? isDefault, @HiveField(3)  int? price)  $default,) {final _that = this;
switch (_that) {
case _AddonOptionModel():
return $default(_that.id,_that.label,_that.isDefault,_that.price);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String? id, @HiveField(1)  String? label, @HiveField(2)  bool? isDefault, @HiveField(3)  int? price)?  $default,) {final _that = this;
switch (_that) {
case _AddonOptionModel() when $default != null:
return $default(_that.id,_that.label,_that.isDefault,_that.price);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AddonOptionModel implements AddonOptionModel {
   _AddonOptionModel({@HiveField(0) this.id, @HiveField(1) this.label, @HiveField(2) this.isDefault, @HiveField(3) this.price});
  factory _AddonOptionModel.fromJson(Map<String, dynamic> json) => _$AddonOptionModelFromJson(json);

@override@HiveField(0) final  String? id;
@override@HiveField(1) final  String? label;
@override@HiveField(2) final  bool? isDefault;
@override@HiveField(3) final  int? price;

/// Create a copy of AddonOptionModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AddonOptionModelCopyWith<_AddonOptionModel> get copyWith => __$AddonOptionModelCopyWithImpl<_AddonOptionModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AddonOptionModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AddonOptionModel&&(identical(other.id, id) || other.id == id)&&(identical(other.label, label) || other.label == label)&&(identical(other.isDefault, isDefault) || other.isDefault == isDefault)&&(identical(other.price, price) || other.price == price));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,label,isDefault,price);

@override
String toString() {
  return 'AddonOptionModel(id: $id, label: $label, isDefault: $isDefault, price: $price)';
}


}

/// @nodoc
abstract mixin class _$AddonOptionModelCopyWith<$Res> implements $AddonOptionModelCopyWith<$Res> {
  factory _$AddonOptionModelCopyWith(_AddonOptionModel value, $Res Function(_AddonOptionModel) _then) = __$AddonOptionModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String? id,@HiveField(1) String? label,@HiveField(2) bool? isDefault,@HiveField(3) int? price
});




}
/// @nodoc
class __$AddonOptionModelCopyWithImpl<$Res>
    implements _$AddonOptionModelCopyWith<$Res> {
  __$AddonOptionModelCopyWithImpl(this._self, this._then);

  final _AddonOptionModel _self;
  final $Res Function(_AddonOptionModel) _then;

/// Create a copy of AddonOptionModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = freezed,Object? label = freezed,Object? isDefault = freezed,Object? price = freezed,}) {
  return _then(_AddonOptionModel(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,label: freezed == label ? _self.label : label // ignore: cast_nullable_to_non_nullable
as String?,isDefault: freezed == isDefault ? _self.isDefault : isDefault // ignore: cast_nullable_to_non_nullable
as bool?,price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}

// dart format on
