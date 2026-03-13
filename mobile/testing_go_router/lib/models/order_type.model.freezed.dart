// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'order_type.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$OrderTypeModel {

@HiveField(0) String get id;@HiveField(1) String get name;@HiveField(2) String get shortName;
/// Create a copy of OrderTypeModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OrderTypeModelCopyWith<OrderTypeModel> get copyWith => _$OrderTypeModelCopyWithImpl<OrderTypeModel>(this as OrderTypeModel, _$identity);

  /// Serializes this OrderTypeModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OrderTypeModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.shortName, shortName) || other.shortName == shortName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,shortName);

@override
String toString() {
  return 'OrderTypeModel(id: $id, name: $name, shortName: $shortName)';
}


}

/// @nodoc
abstract mixin class $OrderTypeModelCopyWith<$Res>  {
  factory $OrderTypeModelCopyWith(OrderTypeModel value, $Res Function(OrderTypeModel) _then) = _$OrderTypeModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name,@HiveField(2) String shortName
});




}
/// @nodoc
class _$OrderTypeModelCopyWithImpl<$Res>
    implements $OrderTypeModelCopyWith<$Res> {
  _$OrderTypeModelCopyWithImpl(this._self, this._then);

  final OrderTypeModel _self;
  final $Res Function(OrderTypeModel) _then;

/// Create a copy of OrderTypeModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? shortName = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,shortName: null == shortName ? _self.shortName : shortName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [OrderTypeModel].
extension OrderTypeModelPatterns on OrderTypeModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OrderTypeModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OrderTypeModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OrderTypeModel value)  $default,){
final _that = this;
switch (_that) {
case _OrderTypeModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OrderTypeModel value)?  $default,){
final _that = this;
switch (_that) {
case _OrderTypeModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)  String shortName)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OrderTypeModel() when $default != null:
return $default(_that.id,_that.name,_that.shortName);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)  String shortName)  $default,) {final _that = this;
switch (_that) {
case _OrderTypeModel():
return $default(_that.id,_that.name,_that.shortName);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)  String shortName)?  $default,) {final _that = this;
switch (_that) {
case _OrderTypeModel() when $default != null:
return $default(_that.id,_that.name,_that.shortName);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OrderTypeModel extends OrderTypeModel {
  const _OrderTypeModel({@HiveField(0) required this.id, @HiveField(1) required this.name, @HiveField(2) required this.shortName}): super._();
  factory _OrderTypeModel.fromJson(Map<String, dynamic> json) => _$OrderTypeModelFromJson(json);

@override@HiveField(0) final  String id;
@override@HiveField(1) final  String name;
@override@HiveField(2) final  String shortName;

/// Create a copy of OrderTypeModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OrderTypeModelCopyWith<_OrderTypeModel> get copyWith => __$OrderTypeModelCopyWithImpl<_OrderTypeModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OrderTypeModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OrderTypeModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.shortName, shortName) || other.shortName == shortName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,shortName);

@override
String toString() {
  return 'OrderTypeModel(id: $id, name: $name, shortName: $shortName)';
}


}

/// @nodoc
abstract mixin class _$OrderTypeModelCopyWith<$Res> implements $OrderTypeModelCopyWith<$Res> {
  factory _$OrderTypeModelCopyWith(_OrderTypeModel value, $Res Function(_OrderTypeModel) _then) = __$OrderTypeModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name,@HiveField(2) String shortName
});




}
/// @nodoc
class __$OrderTypeModelCopyWithImpl<$Res>
    implements _$OrderTypeModelCopyWith<$Res> {
  __$OrderTypeModelCopyWithImpl(this._self, this._then);

  final _OrderTypeModel _self;
  final $Res Function(_OrderTypeModel) _then;

/// Create a copy of OrderTypeModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? shortName = null,}) {
  return _then(_OrderTypeModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,shortName: null == shortName ? _self.shortName : shortName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$ItemOrderTypeModel {

@HiveField(0) String get id;@HiveField(1) String get name;@HiveField(2) String get shortName;
/// Create a copy of ItemOrderTypeModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ItemOrderTypeModelCopyWith<ItemOrderTypeModel> get copyWith => _$ItemOrderTypeModelCopyWithImpl<ItemOrderTypeModel>(this as ItemOrderTypeModel, _$identity);

  /// Serializes this ItemOrderTypeModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ItemOrderTypeModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.shortName, shortName) || other.shortName == shortName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,shortName);

@override
String toString() {
  return 'ItemOrderTypeModel(id: $id, name: $name, shortName: $shortName)';
}


}

/// @nodoc
abstract mixin class $ItemOrderTypeModelCopyWith<$Res>  {
  factory $ItemOrderTypeModelCopyWith(ItemOrderTypeModel value, $Res Function(ItemOrderTypeModel) _then) = _$ItemOrderTypeModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name,@HiveField(2) String shortName
});




}
/// @nodoc
class _$ItemOrderTypeModelCopyWithImpl<$Res>
    implements $ItemOrderTypeModelCopyWith<$Res> {
  _$ItemOrderTypeModelCopyWithImpl(this._self, this._then);

  final ItemOrderTypeModel _self;
  final $Res Function(ItemOrderTypeModel) _then;

/// Create a copy of ItemOrderTypeModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? shortName = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,shortName: null == shortName ? _self.shortName : shortName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ItemOrderTypeModel].
extension ItemOrderTypeModelPatterns on ItemOrderTypeModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ItemOrderTypeModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ItemOrderTypeModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ItemOrderTypeModel value)  $default,){
final _that = this;
switch (_that) {
case _ItemOrderTypeModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ItemOrderTypeModel value)?  $default,){
final _that = this;
switch (_that) {
case _ItemOrderTypeModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)  String shortName)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ItemOrderTypeModel() when $default != null:
return $default(_that.id,_that.name,_that.shortName);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)  String shortName)  $default,) {final _that = this;
switch (_that) {
case _ItemOrderTypeModel():
return $default(_that.id,_that.name,_that.shortName);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)  String shortName)?  $default,) {final _that = this;
switch (_that) {
case _ItemOrderTypeModel() when $default != null:
return $default(_that.id,_that.name,_that.shortName);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ItemOrderTypeModel extends ItemOrderTypeModel {
  const _ItemOrderTypeModel({@HiveField(0) required this.id, @HiveField(1) required this.name, @HiveField(2) required this.shortName}): super._();
  factory _ItemOrderTypeModel.fromJson(Map<String, dynamic> json) => _$ItemOrderTypeModelFromJson(json);

@override@HiveField(0) final  String id;
@override@HiveField(1) final  String name;
@override@HiveField(2) final  String shortName;

/// Create a copy of ItemOrderTypeModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ItemOrderTypeModelCopyWith<_ItemOrderTypeModel> get copyWith => __$ItemOrderTypeModelCopyWithImpl<_ItemOrderTypeModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ItemOrderTypeModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ItemOrderTypeModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.shortName, shortName) || other.shortName == shortName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,shortName);

@override
String toString() {
  return 'ItemOrderTypeModel(id: $id, name: $name, shortName: $shortName)';
}


}

/// @nodoc
abstract mixin class _$ItemOrderTypeModelCopyWith<$Res> implements $ItemOrderTypeModelCopyWith<$Res> {
  factory _$ItemOrderTypeModelCopyWith(_ItemOrderTypeModel value, $Res Function(_ItemOrderTypeModel) _then) = __$ItemOrderTypeModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name,@HiveField(2) String shortName
});




}
/// @nodoc
class __$ItemOrderTypeModelCopyWithImpl<$Res>
    implements _$ItemOrderTypeModelCopyWith<$Res> {
  __$ItemOrderTypeModelCopyWithImpl(this._self, this._then);

  final _ItemOrderTypeModel _self;
  final $Res Function(_ItemOrderTypeModel) _then;

/// Create a copy of ItemOrderTypeModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? shortName = null,}) {
  return _then(_ItemOrderTypeModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,shortName: null == shortName ? _self.shortName : shortName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
