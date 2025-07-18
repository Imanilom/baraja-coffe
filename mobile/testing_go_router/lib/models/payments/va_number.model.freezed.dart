// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
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

@HiveField(0) String get bank;@HiveField(1)@JsonKey(name: 'va_number') String get vaNumber;
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
@HiveField(0) String bank,@HiveField(1)@JsonKey(name: 'va_number') String vaNumber
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
@pragma('vm:prefer-inline') @override $Res call({Object? bank = null,Object? vaNumber = null,}) {
  return _then(_self.copyWith(
bank: null == bank ? _self.bank : bank // ignore: cast_nullable_to_non_nullable
as String,vaNumber: null == vaNumber ? _self.vaNumber : vaNumber // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _VANumberModel implements VANumberModel {
   _VANumberModel({@HiveField(0) required this.bank, @HiveField(1)@JsonKey(name: 'va_number') required this.vaNumber});
  factory _VANumberModel.fromJson(Map<String, dynamic> json) => _$VANumberModelFromJson(json);

@override@HiveField(0) final  String bank;
@override@HiveField(1)@JsonKey(name: 'va_number') final  String vaNumber;

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
@HiveField(0) String bank,@HiveField(1)@JsonKey(name: 'va_number') String vaNumber
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
@override @pragma('vm:prefer-inline') $Res call({Object? bank = null,Object? vaNumber = null,}) {
  return _then(_VANumberModel(
bank: null == bank ? _self.bank : bank // ignore: cast_nullable_to_non_nullable
as String,vaNumber: null == vaNumber ? _self.vaNumber : vaNumber // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
