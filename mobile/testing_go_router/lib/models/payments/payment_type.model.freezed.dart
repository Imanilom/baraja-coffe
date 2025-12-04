// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'payment_type.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PaymentTypeModel {

@HiveField(0) String get id;@HiveField(1) String get name;/// Kode method aslinya, misal: "Cash", "Gopay", "BNI"
@HiveField(2) String get typeCode;/// Method mana saja yang boleh pakai type ini
@HiveField(3) List<String> get methodIds;@HiveField(4) bool get isDigital;@HiveField(5) bool get isActive;
/// Create a copy of PaymentTypeModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaymentTypeModelCopyWith<PaymentTypeModel> get copyWith => _$PaymentTypeModelCopyWithImpl<PaymentTypeModel>(this as PaymentTypeModel, _$identity);

  /// Serializes this PaymentTypeModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaymentTypeModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.typeCode, typeCode) || other.typeCode == typeCode)&&const DeepCollectionEquality().equals(other.methodIds, methodIds)&&(identical(other.isDigital, isDigital) || other.isDigital == isDigital)&&(identical(other.isActive, isActive) || other.isActive == isActive));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,typeCode,const DeepCollectionEquality().hash(methodIds),isDigital,isActive);

@override
String toString() {
  return 'PaymentTypeModel(id: $id, name: $name, typeCode: $typeCode, methodIds: $methodIds, isDigital: $isDigital, isActive: $isActive)';
}


}

/// @nodoc
abstract mixin class $PaymentTypeModelCopyWith<$Res>  {
  factory $PaymentTypeModelCopyWith(PaymentTypeModel value, $Res Function(PaymentTypeModel) _then) = _$PaymentTypeModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name,@HiveField(2) String typeCode,@HiveField(3) List<String> methodIds,@HiveField(4) bool isDigital,@HiveField(5) bool isActive
});




}
/// @nodoc
class _$PaymentTypeModelCopyWithImpl<$Res>
    implements $PaymentTypeModelCopyWith<$Res> {
  _$PaymentTypeModelCopyWithImpl(this._self, this._then);

  final PaymentTypeModel _self;
  final $Res Function(PaymentTypeModel) _then;

/// Create a copy of PaymentTypeModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? typeCode = null,Object? methodIds = null,Object? isDigital = null,Object? isActive = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,typeCode: null == typeCode ? _self.typeCode : typeCode // ignore: cast_nullable_to_non_nullable
as String,methodIds: null == methodIds ? _self.methodIds : methodIds // ignore: cast_nullable_to_non_nullable
as List<String>,isDigital: null == isDigital ? _self.isDigital : isDigital // ignore: cast_nullable_to_non_nullable
as bool,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [PaymentTypeModel].
extension PaymentTypeModelPatterns on PaymentTypeModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PaymentTypeModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PaymentTypeModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PaymentTypeModel value)  $default,){
final _that = this;
switch (_that) {
case _PaymentTypeModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PaymentTypeModel value)?  $default,){
final _that = this;
switch (_that) {
case _PaymentTypeModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)  String typeCode, @HiveField(3)  List<String> methodIds, @HiveField(4)  bool isDigital, @HiveField(5)  bool isActive)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PaymentTypeModel() when $default != null:
return $default(_that.id,_that.name,_that.typeCode,_that.methodIds,_that.isDigital,_that.isActive);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)  String typeCode, @HiveField(3)  List<String> methodIds, @HiveField(4)  bool isDigital, @HiveField(5)  bool isActive)  $default,) {final _that = this;
switch (_that) {
case _PaymentTypeModel():
return $default(_that.id,_that.name,_that.typeCode,_that.methodIds,_that.isDigital,_that.isActive);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String id, @HiveField(1)  String name, @HiveField(2)  String typeCode, @HiveField(3)  List<String> methodIds, @HiveField(4)  bool isDigital, @HiveField(5)  bool isActive)?  $default,) {final _that = this;
switch (_that) {
case _PaymentTypeModel() when $default != null:
return $default(_that.id,_that.name,_that.typeCode,_that.methodIds,_that.isDigital,_that.isActive);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PaymentTypeModel implements PaymentTypeModel {
  const _PaymentTypeModel({@HiveField(0) required this.id, @HiveField(1) required this.name, @HiveField(2) required this.typeCode, @HiveField(3) required final  List<String> methodIds, @HiveField(4) required this.isDigital, @HiveField(5) required this.isActive}): _methodIds = methodIds;
  factory _PaymentTypeModel.fromJson(Map<String, dynamic> json) => _$PaymentTypeModelFromJson(json);

@override@HiveField(0) final  String id;
@override@HiveField(1) final  String name;
/// Kode method aslinya, misal: "Cash", "Gopay", "BNI"
@override@HiveField(2) final  String typeCode;
/// Method mana saja yang boleh pakai type ini
 final  List<String> _methodIds;
/// Method mana saja yang boleh pakai type ini
@override@HiveField(3) List<String> get methodIds {
  if (_methodIds is EqualUnmodifiableListView) return _methodIds;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_methodIds);
}

@override@HiveField(4) final  bool isDigital;
@override@HiveField(5) final  bool isActive;

/// Create a copy of PaymentTypeModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PaymentTypeModelCopyWith<_PaymentTypeModel> get copyWith => __$PaymentTypeModelCopyWithImpl<_PaymentTypeModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PaymentTypeModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaymentTypeModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.typeCode, typeCode) || other.typeCode == typeCode)&&const DeepCollectionEquality().equals(other._methodIds, _methodIds)&&(identical(other.isDigital, isDigital) || other.isDigital == isDigital)&&(identical(other.isActive, isActive) || other.isActive == isActive));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,typeCode,const DeepCollectionEquality().hash(_methodIds),isDigital,isActive);

@override
String toString() {
  return 'PaymentTypeModel(id: $id, name: $name, typeCode: $typeCode, methodIds: $methodIds, isDigital: $isDigital, isActive: $isActive)';
}


}

/// @nodoc
abstract mixin class _$PaymentTypeModelCopyWith<$Res> implements $PaymentTypeModelCopyWith<$Res> {
  factory _$PaymentTypeModelCopyWith(_PaymentTypeModel value, $Res Function(_PaymentTypeModel) _then) = __$PaymentTypeModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name,@HiveField(2) String typeCode,@HiveField(3) List<String> methodIds,@HiveField(4) bool isDigital,@HiveField(5) bool isActive
});




}
/// @nodoc
class __$PaymentTypeModelCopyWithImpl<$Res>
    implements _$PaymentTypeModelCopyWith<$Res> {
  __$PaymentTypeModelCopyWithImpl(this._self, this._then);

  final _PaymentTypeModel _self;
  final $Res Function(_PaymentTypeModel) _then;

/// Create a copy of PaymentTypeModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? typeCode = null,Object? methodIds = null,Object? isDigital = null,Object? isActive = null,}) {
  return _then(_PaymentTypeModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,typeCode: null == typeCode ? _self.typeCode : typeCode // ignore: cast_nullable_to_non_nullable
as String,methodIds: null == methodIds ? _self._methodIds : methodIds // ignore: cast_nullable_to_non_nullable
as List<String>,isDigital: null == isDigital ? _self.isDigital : isDigital // ignore: cast_nullable_to_non_nullable
as bool,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
