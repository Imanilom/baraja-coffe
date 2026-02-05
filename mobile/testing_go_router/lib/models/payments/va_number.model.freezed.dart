// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'va_number.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$VANumberModel {

@HiveField(0) String? get bank;@HiveField(1)@JsonKey(name: 'va_number') String? get vaNumber;
/// Create a copy of VANumberModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$VANumberModelCopyWith<VANumberModel> get copyWith => _$VANumberModelCopyWithImpl<VANumberModel>(this as VANumberModel, _$identity);

  /// Serializes this VANumberModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is VANumberModel&&(identical(other.bank, bank) || other.bank == bank)&&(identical(other.vaNumber, vaNumber) || other.vaNumber == vaNumber));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,bank,vaNumber);

@override
String toString() {
  return 'VANumberModel(bank: $bank, vaNumber: $vaNumber)';
}


}

/// @nodoc
abstract mixin class $VANumberModelCopyWith<$Res>  {
  factory $VANumberModelCopyWith(VANumberModel value, $Res Function(VANumberModel) _then) = _$VANumberModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String? bank,@HiveField(1)@JsonKey(name: 'va_number') String? vaNumber
});




}
/// @nodoc
class _$VANumberModelCopyWithImpl<$Res>
    implements $VANumberModelCopyWith<$Res> {
  _$VANumberModelCopyWithImpl(this._self, this._then);

  final VANumberModel _self;
  final $Res Function(VANumberModel) _then;

/// Create a copy of VANumberModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? bank = freezed,Object? vaNumber = freezed,}) {
  return _then(_self.copyWith(
bank: freezed == bank ? _self.bank : bank // ignore: cast_nullable_to_non_nullable
as String?,vaNumber: freezed == vaNumber ? _self.vaNumber : vaNumber // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [VANumberModel].
extension VANumberModelPatterns on VANumberModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _VANumberModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _VANumberModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _VANumberModel value)  $default,){
final _that = this;
switch (_that) {
case _VANumberModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _VANumberModel value)?  $default,){
final _that = this;
switch (_that) {
case _VANumberModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String? bank, @HiveField(1)@JsonKey(name: 'va_number')  String? vaNumber)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _VANumberModel() when $default != null:
return $default(_that.bank,_that.vaNumber);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String? bank, @HiveField(1)@JsonKey(name: 'va_number')  String? vaNumber)  $default,) {final _that = this;
switch (_that) {
case _VANumberModel():
return $default(_that.bank,_that.vaNumber);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String? bank, @HiveField(1)@JsonKey(name: 'va_number')  String? vaNumber)?  $default,) {final _that = this;
switch (_that) {
case _VANumberModel() when $default != null:
return $default(_that.bank,_that.vaNumber);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _VANumberModel implements VANumberModel {
   _VANumberModel({@HiveField(0) this.bank = null, @HiveField(1)@JsonKey(name: 'va_number') this.vaNumber = null});
  factory _VANumberModel.fromJson(Map<String, dynamic> json) => _$VANumberModelFromJson(json);

@override@JsonKey()@HiveField(0) final  String? bank;
@override@HiveField(1)@JsonKey(name: 'va_number') final  String? vaNumber;

/// Create a copy of VANumberModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$VANumberModelCopyWith<_VANumberModel> get copyWith => __$VANumberModelCopyWithImpl<_VANumberModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$VANumberModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _VANumberModel&&(identical(other.bank, bank) || other.bank == bank)&&(identical(other.vaNumber, vaNumber) || other.vaNumber == vaNumber));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,bank,vaNumber);

@override
String toString() {
  return 'VANumberModel(bank: $bank, vaNumber: $vaNumber)';
}


}

/// @nodoc
abstract mixin class _$VANumberModelCopyWith<$Res> implements $VANumberModelCopyWith<$Res> {
  factory _$VANumberModelCopyWith(_VANumberModel value, $Res Function(_VANumberModel) _then) = __$VANumberModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String? bank,@HiveField(1)@JsonKey(name: 'va_number') String? vaNumber
});




}
/// @nodoc
class __$VANumberModelCopyWithImpl<$Res>
    implements _$VANumberModelCopyWith<$Res> {
  __$VANumberModelCopyWithImpl(this._self, this._then);

  final _VANumberModel _self;
  final $Res Function(_VANumberModel) _then;

/// Create a copy of VANumberModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? bank = freezed,Object? vaNumber = freezed,}) {
  return _then(_VANumberModel(
bank: freezed == bank ? _self.bank : bank // ignore: cast_nullable_to_non_nullable
as String?,vaNumber: freezed == vaNumber ? _self.vaNumber : vaNumber // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
