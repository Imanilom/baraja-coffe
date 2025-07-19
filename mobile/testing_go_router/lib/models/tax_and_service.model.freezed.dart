// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'tax_and_service.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$TaxAndServiceModel {

@HiveField(0)@JsonKey(name: '_id') String? get id;@HiveField(1) String? get type;//example: "PPN" or "PPh"
@HiveField(2) String? get name;@HiveField(3) String? get description;@HiveField(4) int? get percentage;//example: 10 for 10%
@HiveField(5) int? get fixedFee;@HiveField(6) bool? get isActive;
/// Create a copy of TaxAndServiceModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TaxAndServiceModelCopyWith<TaxAndServiceModel> get copyWith => _$TaxAndServiceModelCopyWithImpl<TaxAndServiceModel>(this as TaxAndServiceModel, _$identity);

  /// Serializes this TaxAndServiceModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TaxAndServiceModel&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&(identical(other.percentage, percentage) || other.percentage == percentage)&&(identical(other.fixedFee, fixedFee) || other.fixedFee == fixedFee)&&(identical(other.isActive, isActive) || other.isActive == isActive));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,type,name,description,percentage,fixedFee,isActive);

@override
String toString() {
  return 'TaxAndServiceModel(id: $id, type: $type, name: $name, description: $description, percentage: $percentage, fixedFee: $fixedFee, isActive: $isActive)';
}


}

/// @nodoc
abstract mixin class $TaxAndServiceModelCopyWith<$Res>  {
  factory $TaxAndServiceModelCopyWith(TaxAndServiceModel value, $Res Function(TaxAndServiceModel) _then) = _$TaxAndServiceModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String? id,@HiveField(1) String? type,@HiveField(2) String? name,@HiveField(3) String? description,@HiveField(4) int? percentage,@HiveField(5) int? fixedFee,@HiveField(6) bool? isActive
});




}
/// @nodoc
class _$TaxAndServiceModelCopyWithImpl<$Res>
    implements $TaxAndServiceModelCopyWith<$Res> {
  _$TaxAndServiceModelCopyWithImpl(this._self, this._then);

  final TaxAndServiceModel _self;
  final $Res Function(TaxAndServiceModel) _then;

/// Create a copy of TaxAndServiceModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = freezed,Object? type = freezed,Object? name = freezed,Object? description = freezed,Object? percentage = freezed,Object? fixedFee = freezed,Object? isActive = freezed,}) {
  return _then(_self.copyWith(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,type: freezed == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,percentage: freezed == percentage ? _self.percentage : percentage // ignore: cast_nullable_to_non_nullable
as int?,fixedFee: freezed == fixedFee ? _self.fixedFee : fixedFee // ignore: cast_nullable_to_non_nullable
as int?,isActive: freezed == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool?,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _TaxAndServiceModel implements TaxAndServiceModel {
  const _TaxAndServiceModel({@HiveField(0)@JsonKey(name: '_id') this.id, @HiveField(1) this.type, @HiveField(2) this.name, @HiveField(3) this.description = '', @HiveField(4) this.percentage = 0, @HiveField(5) this.fixedFee = 0, @HiveField(6) this.isActive});
  factory _TaxAndServiceModel.fromJson(Map<String, dynamic> json) => _$TaxAndServiceModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String? id;
@override@HiveField(1) final  String? type;
//example: "PPN" or "PPh"
@override@HiveField(2) final  String? name;
@override@JsonKey()@HiveField(3) final  String? description;
@override@JsonKey()@HiveField(4) final  int? percentage;
//example: 10 for 10%
@override@JsonKey()@HiveField(5) final  int? fixedFee;
@override@HiveField(6) final  bool? isActive;

/// Create a copy of TaxAndServiceModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TaxAndServiceModelCopyWith<_TaxAndServiceModel> get copyWith => __$TaxAndServiceModelCopyWithImpl<_TaxAndServiceModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TaxAndServiceModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _TaxAndServiceModel&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&(identical(other.percentage, percentage) || other.percentage == percentage)&&(identical(other.fixedFee, fixedFee) || other.fixedFee == fixedFee)&&(identical(other.isActive, isActive) || other.isActive == isActive));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,type,name,description,percentage,fixedFee,isActive);

@override
String toString() {
  return 'TaxAndServiceModel(id: $id, type: $type, name: $name, description: $description, percentage: $percentage, fixedFee: $fixedFee, isActive: $isActive)';
}


}

/// @nodoc
abstract mixin class _$TaxAndServiceModelCopyWith<$Res> implements $TaxAndServiceModelCopyWith<$Res> {
  factory _$TaxAndServiceModelCopyWith(_TaxAndServiceModel value, $Res Function(_TaxAndServiceModel) _then) = __$TaxAndServiceModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String? id,@HiveField(1) String? type,@HiveField(2) String? name,@HiveField(3) String? description,@HiveField(4) int? percentage,@HiveField(5) int? fixedFee,@HiveField(6) bool? isActive
});




}
/// @nodoc
class __$TaxAndServiceModelCopyWithImpl<$Res>
    implements _$TaxAndServiceModelCopyWith<$Res> {
  __$TaxAndServiceModelCopyWithImpl(this._self, this._then);

  final _TaxAndServiceModel _self;
  final $Res Function(_TaxAndServiceModel) _then;

/// Create a copy of TaxAndServiceModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = freezed,Object? type = freezed,Object? name = freezed,Object? description = freezed,Object? percentage = freezed,Object? fixedFee = freezed,Object? isActive = freezed,}) {
  return _then(_TaxAndServiceModel(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,type: freezed == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,percentage: freezed == percentage ? _self.percentage : percentage // ignore: cast_nullable_to_non_nullable
as int?,fixedFee: freezed == fixedFee ? _self.fixedFee : fixedFee // ignore: cast_nullable_to_non_nullable
as int?,isActive: freezed == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool?,
  ));
}


}

// dart format on
