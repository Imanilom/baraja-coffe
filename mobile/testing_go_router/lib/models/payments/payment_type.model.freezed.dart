// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
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

@HiveField(0) String get id;@HiveField(1) String get name;@HiveField(2) String get icon;@HiveField(3) bool get isActive;@HiveField(4) List<PaymentMethodModel> get paymentMethods;
/// Create a copy of PaymentTypeModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PaymentTypeModelCopyWith<PaymentTypeModel> get copyWith => _$PaymentTypeModelCopyWithImpl<PaymentTypeModel>(this as PaymentTypeModel, _$identity);

  /// Serializes this PaymentTypeModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PaymentTypeModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.icon, icon) || other.icon == icon)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&const DeepCollectionEquality().equals(other.paymentMethods, paymentMethods));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,icon,isActive,const DeepCollectionEquality().hash(paymentMethods));

@override
String toString() {
  return 'PaymentTypeModel(id: $id, name: $name, icon: $icon, isActive: $isActive, paymentMethods: $paymentMethods)';
}


}

/// @nodoc
abstract mixin class $PaymentTypeModelCopyWith<$Res>  {
  factory $PaymentTypeModelCopyWith(PaymentTypeModel value, $Res Function(PaymentTypeModel) _then) = _$PaymentTypeModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name,@HiveField(2) String icon,@HiveField(3) bool isActive,@HiveField(4) List<PaymentMethodModel> paymentMethods
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
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? icon = null,Object? isActive = null,Object? paymentMethods = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,icon: null == icon ? _self.icon : icon // ignore: cast_nullable_to_non_nullable
as String,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,paymentMethods: null == paymentMethods ? _self.paymentMethods : paymentMethods // ignore: cast_nullable_to_non_nullable
as List<PaymentMethodModel>,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _PaymentTypeModel implements PaymentTypeModel {
  const _PaymentTypeModel({@HiveField(0) required this.id, @HiveField(1) required this.name, @HiveField(2) required this.icon, @HiveField(3) required this.isActive, @HiveField(4) required final  List<PaymentMethodModel> paymentMethods}): _paymentMethods = paymentMethods;
  factory _PaymentTypeModel.fromJson(Map<String, dynamic> json) => _$PaymentTypeModelFromJson(json);

@override@HiveField(0) final  String id;
@override@HiveField(1) final  String name;
@override@HiveField(2) final  String icon;
@override@HiveField(3) final  bool isActive;
 final  List<PaymentMethodModel> _paymentMethods;
@override@HiveField(4) List<PaymentMethodModel> get paymentMethods {
  if (_paymentMethods is EqualUnmodifiableListView) return _paymentMethods;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_paymentMethods);
}


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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PaymentTypeModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.icon, icon) || other.icon == icon)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&const DeepCollectionEquality().equals(other._paymentMethods, _paymentMethods));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,icon,isActive,const DeepCollectionEquality().hash(_paymentMethods));

@override
String toString() {
  return 'PaymentTypeModel(id: $id, name: $name, icon: $icon, isActive: $isActive, paymentMethods: $paymentMethods)';
}


}

/// @nodoc
abstract mixin class _$PaymentTypeModelCopyWith<$Res> implements $PaymentTypeModelCopyWith<$Res> {
  factory _$PaymentTypeModelCopyWith(_PaymentTypeModel value, $Res Function(_PaymentTypeModel) _then) = __$PaymentTypeModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String name,@HiveField(2) String icon,@HiveField(3) bool isActive,@HiveField(4) List<PaymentMethodModel> paymentMethods
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
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? icon = null,Object? isActive = null,Object? paymentMethods = null,}) {
  return _then(_PaymentTypeModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,icon: null == icon ? _self.icon : icon // ignore: cast_nullable_to_non_nullable
as String,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,paymentMethods: null == paymentMethods ? _self._paymentMethods : paymentMethods // ignore: cast_nullable_to_non_nullable
as List<PaymentMethodModel>,
  ));
}


}

// dart format on
