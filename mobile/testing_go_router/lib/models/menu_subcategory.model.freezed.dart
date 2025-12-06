// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'menu_subcategory.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$MenuSubCategoryModel {

@HiveField(0)@JsonKey(name: '_id') String get id;@HiveField(1) String get name;
/// Create a copy of MenuSubCategoryModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MenuSubCategoryModelCopyWith<MenuSubCategoryModel> get copyWith => _$MenuSubCategoryModelCopyWithImpl<MenuSubCategoryModel>(this as MenuSubCategoryModel, _$identity);

  /// Serializes this MenuSubCategoryModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MenuSubCategoryModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'MenuSubCategoryModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class $MenuSubCategoryModelCopyWith<$Res>  {
  factory $MenuSubCategoryModelCopyWith(MenuSubCategoryModel value, $Res Function(MenuSubCategoryModel) _then) = _$MenuSubCategoryModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class _$MenuSubCategoryModelCopyWithImpl<$Res>
    implements $MenuSubCategoryModelCopyWith<$Res> {
  _$MenuSubCategoryModelCopyWithImpl(this._self, this._then);

  final MenuSubCategoryModel _self;
  final $Res Function(MenuSubCategoryModel) _then;

/// Create a copy of MenuSubCategoryModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [MenuSubCategoryModel].
extension MenuSubCategoryModelPatterns on MenuSubCategoryModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MenuSubCategoryModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MenuSubCategoryModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MenuSubCategoryModel value)  $default,){
final _that = this;
switch (_that) {
case _MenuSubCategoryModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MenuSubCategoryModel value)?  $default,){
final _that = this;
switch (_that) {
case _MenuSubCategoryModel() when $default != null:
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
case _MenuSubCategoryModel() when $default != null:
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
case _MenuSubCategoryModel():
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
case _MenuSubCategoryModel() when $default != null:
return $default(_that.id,_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MenuSubCategoryModel implements MenuSubCategoryModel {
   _MenuSubCategoryModel({@HiveField(0)@JsonKey(name: '_id') required this.id, @HiveField(1) required this.name});
  factory _MenuSubCategoryModel.fromJson(Map<String, dynamic> json) => _$MenuSubCategoryModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String id;
@override@HiveField(1) final  String name;

/// Create a copy of MenuSubCategoryModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MenuSubCategoryModelCopyWith<_MenuSubCategoryModel> get copyWith => __$MenuSubCategoryModelCopyWithImpl<_MenuSubCategoryModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MenuSubCategoryModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MenuSubCategoryModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'MenuSubCategoryModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class _$MenuSubCategoryModelCopyWith<$Res> implements $MenuSubCategoryModelCopyWith<$Res> {
  factory _$MenuSubCategoryModelCopyWith(_MenuSubCategoryModel value, $Res Function(_MenuSubCategoryModel) _then) = __$MenuSubCategoryModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class __$MenuSubCategoryModelCopyWithImpl<$Res>
    implements _$MenuSubCategoryModelCopyWith<$Res> {
  __$MenuSubCategoryModelCopyWithImpl(this._self, this._then);

  final _MenuSubCategoryModel _self;
  final $Res Function(_MenuSubCategoryModel) _then;

/// Create a copy of MenuSubCategoryModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,}) {
  return _then(_MenuSubCategoryModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
