// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'tax_service_detail.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$TaxServiceDetailModel {

@HiveField(0) String get type;@HiveField(1) String? get name;@HiveField(2) double get amount;
/// Create a copy of TaxServiceDetailModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TaxServiceDetailModelCopyWith<TaxServiceDetailModel> get copyWith => _$TaxServiceDetailModelCopyWithImpl<TaxServiceDetailModel>(this as TaxServiceDetailModel, _$identity);

  /// Serializes this TaxServiceDetailModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TaxServiceDetailModel&&(identical(other.type, type) || other.type == type)&&(identical(other.name, name) || other.name == name)&&(identical(other.amount, amount) || other.amount == amount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,name,amount);

@override
String toString() {
  return 'TaxServiceDetailModel(type: $type, name: $name, amount: $amount)';
}


}

/// @nodoc
abstract mixin class $TaxServiceDetailModelCopyWith<$Res>  {
  factory $TaxServiceDetailModelCopyWith(TaxServiceDetailModel value, $Res Function(TaxServiceDetailModel) _then) = _$TaxServiceDetailModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String type,@HiveField(1) String? name,@HiveField(2) double amount
});




}
/// @nodoc
class _$TaxServiceDetailModelCopyWithImpl<$Res>
    implements $TaxServiceDetailModelCopyWith<$Res> {
  _$TaxServiceDetailModelCopyWithImpl(this._self, this._then);

  final TaxServiceDetailModel _self;
  final $Res Function(TaxServiceDetailModel) _then;

/// Create a copy of TaxServiceDetailModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? type = null,Object? name = freezed,Object? amount = null,}) {
  return _then(_self.copyWith(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _TaxServiceDetailModel implements TaxServiceDetailModel {
   _TaxServiceDetailModel({@HiveField(0) required this.type, @HiveField(1) this.name, @HiveField(2) required this.amount});
  factory _TaxServiceDetailModel.fromJson(Map<String, dynamic> json) => _$TaxServiceDetailModelFromJson(json);

@override@HiveField(0) final  String type;
@override@HiveField(1) final  String? name;
@override@HiveField(2) final  double amount;

/// Create a copy of TaxServiceDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TaxServiceDetailModelCopyWith<_TaxServiceDetailModel> get copyWith => __$TaxServiceDetailModelCopyWithImpl<_TaxServiceDetailModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TaxServiceDetailModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _TaxServiceDetailModel&&(identical(other.type, type) || other.type == type)&&(identical(other.name, name) || other.name == name)&&(identical(other.amount, amount) || other.amount == amount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,name,amount);

@override
String toString() {
  return 'TaxServiceDetailModel(type: $type, name: $name, amount: $amount)';
}


}

/// @nodoc
abstract mixin class _$TaxServiceDetailModelCopyWith<$Res> implements $TaxServiceDetailModelCopyWith<$Res> {
  factory _$TaxServiceDetailModelCopyWith(_TaxServiceDetailModel value, $Res Function(_TaxServiceDetailModel) _then) = __$TaxServiceDetailModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String type,@HiveField(1) String? name,@HiveField(2) double amount
});




}
/// @nodoc
class __$TaxServiceDetailModelCopyWithImpl<$Res>
    implements _$TaxServiceDetailModelCopyWith<$Res> {
  __$TaxServiceDetailModelCopyWithImpl(this._self, this._then);

  final _TaxServiceDetailModel _self;
  final $Res Function(_TaxServiceDetailModel) _then;

/// Create a copy of TaxServiceDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? type = null,Object? name = freezed,Object? amount = null,}) {
  return _then(_TaxServiceDetailModel(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}

// dart format on
