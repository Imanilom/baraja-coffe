// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'topping.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ToppingModel {

@HiveField(0) String? get id;@HiveField(1) String? get name;@HiveField(2) int? get price;
/// Create a copy of ToppingModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ToppingModelCopyWith<ToppingModel> get copyWith => _$ToppingModelCopyWithImpl<ToppingModel>(this as ToppingModel, _$identity);

  /// Serializes this ToppingModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ToppingModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.price, price) || other.price == price));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,price);

@override
String toString() {
  return 'ToppingModel(id: $id, name: $name, price: $price)';
}


}

/// @nodoc
abstract mixin class $ToppingModelCopyWith<$Res>  {
  factory $ToppingModelCopyWith(ToppingModel value, $Res Function(ToppingModel) _then) = _$ToppingModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String? id,@HiveField(1) String? name,@HiveField(2) int? price
});




}
/// @nodoc
class _$ToppingModelCopyWithImpl<$Res>
    implements $ToppingModelCopyWith<$Res> {
  _$ToppingModelCopyWithImpl(this._self, this._then);

  final ToppingModel _self;
  final $Res Function(ToppingModel) _then;

/// Create a copy of ToppingModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = freezed,Object? name = freezed,Object? price = freezed,}) {
  return _then(_self.copyWith(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [ToppingModel].
extension ToppingModelPatterns on ToppingModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ToppingModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ToppingModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ToppingModel value)  $default,){
final _that = this;
switch (_that) {
case _ToppingModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ToppingModel value)?  $default,){
final _that = this;
switch (_that) {
case _ToppingModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String? id, @HiveField(1)  String? name, @HiveField(2)  int? price)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ToppingModel() when $default != null:
return $default(_that.id,_that.name,_that.price);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String? id, @HiveField(1)  String? name, @HiveField(2)  int? price)  $default,) {final _that = this;
switch (_that) {
case _ToppingModel():
return $default(_that.id,_that.name,_that.price);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String? id, @HiveField(1)  String? name, @HiveField(2)  int? price)?  $default,) {final _that = this;
switch (_that) {
case _ToppingModel() when $default != null:
return $default(_that.id,_that.name,_that.price);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ToppingModel implements ToppingModel {
  const _ToppingModel({@HiveField(0) this.id, @HiveField(1) this.name, @HiveField(2) this.price});
  factory _ToppingModel.fromJson(Map<String, dynamic> json) => _$ToppingModelFromJson(json);

@override@HiveField(0) final  String? id;
@override@HiveField(1) final  String? name;
@override@HiveField(2) final  int? price;

/// Create a copy of ToppingModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ToppingModelCopyWith<_ToppingModel> get copyWith => __$ToppingModelCopyWithImpl<_ToppingModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ToppingModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ToppingModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.price, price) || other.price == price));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,price);

@override
String toString() {
  return 'ToppingModel(id: $id, name: $name, price: $price)';
}


}

/// @nodoc
abstract mixin class _$ToppingModelCopyWith<$Res> implements $ToppingModelCopyWith<$Res> {
  factory _$ToppingModelCopyWith(_ToppingModel value, $Res Function(_ToppingModel) _then) = __$ToppingModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String? id,@HiveField(1) String? name,@HiveField(2) int? price
});




}
/// @nodoc
class __$ToppingModelCopyWithImpl<$Res>
    implements _$ToppingModelCopyWith<$Res> {
  __$ToppingModelCopyWithImpl(this._self, this._then);

  final _ToppingModel _self;
  final $Res Function(_ToppingModel) _then;

/// Create a copy of ToppingModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = freezed,Object? name = freezed,Object? price = freezed,}) {
  return _then(_ToppingModel(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}

// dart format on
