// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
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
