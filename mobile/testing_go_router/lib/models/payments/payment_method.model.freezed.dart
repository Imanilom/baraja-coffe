// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'payment_method.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PaymentMethodModel {

@HiveField(0) String get id;@HiveField(1) String get name;@HiveField(2)@JsonKey(name: 'payment_method') String get methodCode;@HiveField(3) List<String> get typeId;@HiveField(4) bool get isDigital;@HiveField(5) bool get isActive;
/// Create a copy of PaymentMethodModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaymentMethodModelCopyWith<PaymentMethodModel> get copyWith => _$PaymentMethodModelCopyWithImpl<PaymentMethodModel>(this as PaymentMethodModel, _$identity);

  /// Serializes this PaymentMethodModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaymentMethodModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.methodCode, methodCode) || other.methodCode == methodCode)&&const DeepCollectionEquality().equals(other.typeId, typeId)&&(identical(other.isDigital, isDigital) || other.isDigital == isDigital)&&(identical(other.isActive, isActive) || other.isActive == isActive));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,methodCode,const DeepCollectionEquality().hash(typeId),isDigital,isActive);

@override
String toString() {
  return 'PaymentMethodModel(id: $id, name: $name, methodCode: $methodCode, typeId: $typeId, isDigital: $isDigital, isActive: $isActive)';
}


}

/// @nodoc
abstract mixin class $PaymentMethodModelCopyWith<$Res>  {
  factory $PaymentMethodModelCopyWith(PaymentMethodModel value, $Res Function(PaymentMethodModel) _then) = _$PaymentMethodModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name,@HiveField(2)@JsonKey(name: 'payment_method') String methodCode,@HiveField(3) List<String> typeId,@HiveField(4) bool isDigital,@HiveField(5) bool isActive
});




}
/// @nodoc
class _$PaymentMethodModelCopyWithImpl<$Res>
    implements $PaymentMethodModelCopyWith<$Res> {
  _$PaymentMethodModelCopyWithImpl(this._self, this._then);

  final PaymentMethodModel _self;
  final $Res Function(PaymentMethodModel) _then;

/// Create a copy of PaymentMethodModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? methodCode = null,Object? typeId = null,Object? isDigital = null,Object? isActive = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,methodCode: null == methodCode ? _self.methodCode : methodCode // ignore: cast_nullable_to_non_nullable
as String,typeId: null == typeId ? _self.typeId : typeId // ignore: cast_nullable_to_non_nullable
as List<String>,isDigital: null == isDigital ? _self.isDigital : isDigital // ignore: cast_nullable_to_non_nullable
as bool,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [PaymentMethodModel].
extension PaymentMethodModelPatterns on PaymentMethodModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaymentMethodModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaymentMethodModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaymentMethodModel value)  $default,){
final _that = this;
switch (_that) {
case _PaymentMethodModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaymentMethodModel value)?  $default,){
final _that = this;
switch (_that) {
case _PaymentMethodModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)@JsonKey(name: 'payment_method')  String methodCode, @HiveField(3)  List<String> typeId, @HiveField(4)  bool isDigital, @HiveField(5)  bool isActive)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaymentMethodModel() when $default != null:
return $default(_that.id,_that.name,_that.methodCode,_that.typeId,_that.isDigital,_that.isActive);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)@JsonKey(name: 'payment_method')  String methodCode, @HiveField(3)  List<String> typeId, @HiveField(4)  bool isDigital, @HiveField(5)  bool isActive)  $default,) {final _that = this;
switch (_that) {
case _PaymentMethodModel():
return $default(_that.id,_that.name,_that.methodCode,_that.typeId,_that.isDigital,_that.isActive);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)@JsonKey(name: 'payment_method')  String methodCode, @HiveField(3)  List<String> typeId, @HiveField(4)  bool isDigital, @HiveField(5)  bool isActive)?  $default,) {final _that = this;
switch (_that) {
case _PaymentMethodModel() when $default != null:
return $default(_that.id,_that.name,_that.methodCode,_that.typeId,_that.isDigital,_that.isActive);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaymentMethodModel implements PaymentMethodModel {
  const _PaymentMethodModel({@HiveField(0) required this.id, @HiveField(1) required this.name, @HiveField(2)@JsonKey(name: 'payment_method') required this.methodCode, @HiveField(3) required final  List<String> typeId, @HiveField(4) required this.isDigital, @HiveField(5) required this.isActive}): _typeId = typeId;
  factory _PaymentMethodModel.fromJson(Map<String, dynamic> json) => _$PaymentMethodModelFromJson(json);

@override@HiveField(0) final  String id;
@override@HiveField(1) final  String name;
@override@HiveField(2)@JsonKey(name: 'payment_method') final  String methodCode;
 final  List<String> _typeId;
@override@HiveField(3) List<String> get typeId {
  if (_typeId is EqualUnmodifiableListView) return _typeId;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_typeId);
}

@override@HiveField(4) final  bool isDigital;
@override@HiveField(5) final  bool isActive;

/// Create a copy of PaymentMethodModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaymentMethodModelCopyWith<_PaymentMethodModel> get copyWith => __$PaymentMethodModelCopyWithImpl<_PaymentMethodModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaymentMethodModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaymentMethodModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.methodCode, methodCode) || other.methodCode == methodCode)&&const DeepCollectionEquality().equals(other._typeId, _typeId)&&(identical(other.isDigital, isDigital) || other.isDigital == isDigital)&&(identical(other.isActive, isActive) || other.isActive == isActive));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,methodCode,const DeepCollectionEquality().hash(_typeId),isDigital,isActive);

@override
String toString() {
  return 'PaymentMethodModel(id: $id, name: $name, methodCode: $methodCode, typeId: $typeId, isDigital: $isDigital, isActive: $isActive)';
}


}

/// @nodoc
abstract mixin class _$PaymentMethodModelCopyWith<$Res> implements $PaymentMethodModelCopyWith<$Res> {
  factory _$PaymentMethodModelCopyWith(_PaymentMethodModel value, $Res Function(_PaymentMethodModel) _then) = __$PaymentMethodModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name,@HiveField(2)@JsonKey(name: 'payment_method') String methodCode,@HiveField(3) List<String> typeId,@HiveField(4) bool isDigital,@HiveField(5) bool isActive
});




}
/// @nodoc
class __$PaymentMethodModelCopyWithImpl<$Res>
    implements _$PaymentMethodModelCopyWith<$Res> {
  __$PaymentMethodModelCopyWithImpl(this._self, this._then);

  final _PaymentMethodModel _self;
  final $Res Function(_PaymentMethodModel) _then;

/// Create a copy of PaymentMethodModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? methodCode = null,Object? typeId = null,Object? isDigital = null,Object? isActive = null,}) {
  return _then(_PaymentMethodModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,methodCode: null == methodCode ? _self.methodCode : methodCode // ignore: cast_nullable_to_non_nullable
as String,typeId: null == typeId ? _self._typeId : typeId // ignore: cast_nullable_to_non_nullable
as List<String>,isDigital: null == isDigital ? _self.isDigital : isDigital // ignore: cast_nullable_to_non_nullable
as bool,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
