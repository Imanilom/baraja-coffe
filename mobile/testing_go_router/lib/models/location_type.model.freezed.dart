// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'location_type.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$LocationTypeModel {

@HiveField(0) String get id;@HiveField(1) String get name;
/// Create a copy of LocationTypeModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LocationTypeModelCopyWith<LocationTypeModel> get copyWith => _$LocationTypeModelCopyWithImpl<LocationTypeModel>(this as LocationTypeModel, _$identity);

  /// Serializes this LocationTypeModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LocationTypeModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'LocationTypeModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class $LocationTypeModelCopyWith<$Res>  {
  factory $LocationTypeModelCopyWith(LocationTypeModel value, $Res Function(LocationTypeModel) _then) = _$LocationTypeModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name
});




}
/// @nodoc
class _$LocationTypeModelCopyWithImpl<$Res>
    implements $LocationTypeModelCopyWith<$Res> {
  _$LocationTypeModelCopyWithImpl(this._self, this._then);

  final LocationTypeModel _self;
  final $Res Function(LocationTypeModel) _then;

/// Create a copy of LocationTypeModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [LocationTypeModel].
extension LocationTypeModelPatterns on LocationTypeModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LocationTypeModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LocationTypeModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LocationTypeModel value)  $default,){
final _that = this;
switch (_that) {
case _LocationTypeModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LocationTypeModel value)?  $default,){
final _that = this;
switch (_that) {
case _LocationTypeModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String name)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LocationTypeModel() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String name)  $default,) {final _that = this;
switch (_that) {
case _LocationTypeModel():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String id, @HiveField(1)  String name)?  $default,) {final _that = this;
switch (_that) {
case _LocationTypeModel() when $default != null:
return $default(_that.id,_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LocationTypeModel extends LocationTypeModel {
  const _LocationTypeModel({@HiveField(0) required this.id, @HiveField(1) required this.name}): super._();
  factory _LocationTypeModel.fromJson(Map<String, dynamic> json) => _$LocationTypeModelFromJson(json);

@override@HiveField(0) final  String id;
@override@HiveField(1) final  String name;

/// Create a copy of LocationTypeModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LocationTypeModelCopyWith<_LocationTypeModel> get copyWith => __$LocationTypeModelCopyWithImpl<_LocationTypeModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LocationTypeModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _LocationTypeModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'LocationTypeModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class _$LocationTypeModelCopyWith<$Res> implements $LocationTypeModelCopyWith<$Res> {
  factory _$LocationTypeModelCopyWith(_LocationTypeModel value, $Res Function(_LocationTypeModel) _then) = __$LocationTypeModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name
});




}
/// @nodoc
class __$LocationTypeModelCopyWithImpl<$Res>
    implements _$LocationTypeModelCopyWith<$Res> {
  __$LocationTypeModelCopyWithImpl(this._self, this._then);

  final _LocationTypeModel _self;
  final $Res Function(_LocationTypeModel) _then;

/// Create a copy of LocationTypeModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,}) {
  return _then(_LocationTypeModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
