// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'payment_action.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PaymentActionModel {

@HiveField(0) String? get name;@HiveField(1) String? get method;@HiveField(2) String? get url;
/// Create a copy of PaymentActionModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaymentActionModelCopyWith<PaymentActionModel> get copyWith => _$PaymentActionModelCopyWithImpl<PaymentActionModel>(this as PaymentActionModel, _$identity);

  /// Serializes this PaymentActionModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaymentActionModel&&(identical(other.name, name) || other.name == name)&&(identical(other.method, method) || other.method == method)&&(identical(other.url, url) || other.url == url));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,method,url);

@override
String toString() {
  return 'PaymentActionModel(name: $name, method: $method, url: $url)';
}


}

/// @nodoc
abstract mixin class $PaymentActionModelCopyWith<$Res>  {
  factory $PaymentActionModelCopyWith(PaymentActionModel value, $Res Function(PaymentActionModel) _then) = _$PaymentActionModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String? name,@HiveField(1) String? method,@HiveField(2) String? url
});




}
/// @nodoc
class _$PaymentActionModelCopyWithImpl<$Res>
    implements $PaymentActionModelCopyWith<$Res> {
  _$PaymentActionModelCopyWithImpl(this._self, this._then);

  final PaymentActionModel _self;
  final $Res Function(PaymentActionModel) _then;

/// Create a copy of PaymentActionModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? name = freezed,Object? method = freezed,Object? url = freezed,}) {
  return _then(_self.copyWith(
name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,method: freezed == method ? _self.method : method // ignore: cast_nullable_to_non_nullable
as String?,url: freezed == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [PaymentActionModel].
extension PaymentActionModelPatterns on PaymentActionModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaymentActionModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaymentActionModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaymentActionModel value)  $default,){
final _that = this;
switch (_that) {
case _PaymentActionModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaymentActionModel value)?  $default,){
final _that = this;
switch (_that) {
case _PaymentActionModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String? name, @HiveField(1)  String? method, @HiveField(2)  String? url)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaymentActionModel() when $default != null:
return $default(_that.name,_that.method,_that.url);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String? name, @HiveField(1)  String? method, @HiveField(2)  String? url)  $default,) {final _that = this;
switch (_that) {
case _PaymentActionModel():
return $default(_that.name,_that.method,_that.url);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String? name, @HiveField(1)  String? method, @HiveField(2)  String? url)?  $default,) {final _that = this;
switch (_that) {
case _PaymentActionModel() when $default != null:
return $default(_that.name,_that.method,_that.url);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaymentActionModel implements PaymentActionModel {
   _PaymentActionModel({@HiveField(0) this.name = null, @HiveField(1) this.method = null, @HiveField(2) this.url = null});
  factory _PaymentActionModel.fromJson(Map<String, dynamic> json) => _$PaymentActionModelFromJson(json);

@override@JsonKey()@HiveField(0) final  String? name;
@override@JsonKey()@HiveField(1) final  String? method;
@override@JsonKey()@HiveField(2) final  String? url;

/// Create a copy of PaymentActionModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaymentActionModelCopyWith<_PaymentActionModel> get copyWith => __$PaymentActionModelCopyWithImpl<_PaymentActionModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaymentActionModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaymentActionModel&&(identical(other.name, name) || other.name == name)&&(identical(other.method, method) || other.method == method)&&(identical(other.url, url) || other.url == url));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,method,url);

@override
String toString() {
  return 'PaymentActionModel(name: $name, method: $method, url: $url)';
}


}

/// @nodoc
abstract mixin class _$PaymentActionModelCopyWith<$Res> implements $PaymentActionModelCopyWith<$Res> {
  factory _$PaymentActionModelCopyWith(_PaymentActionModel value, $Res Function(_PaymentActionModel) _then) = __$PaymentActionModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String? name,@HiveField(1) String? method,@HiveField(2) String? url
});




}
/// @nodoc
class __$PaymentActionModelCopyWithImpl<$Res>
    implements _$PaymentActionModelCopyWith<$Res> {
  __$PaymentActionModelCopyWithImpl(this._self, this._then);

  final _PaymentActionModel _self;
  final $Res Function(_PaymentActionModel) _then;

/// Create a copy of PaymentActionModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? name = freezed,Object? method = freezed,Object? url = freezed,}) {
  return _then(_PaymentActionModel(
name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,method: freezed == method ? _self.method : method // ignore: cast_nullable_to_non_nullable
as String?,url: freezed == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
