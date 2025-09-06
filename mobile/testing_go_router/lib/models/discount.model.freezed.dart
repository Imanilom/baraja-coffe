// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'discount.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$DiscountModel {

@HiveField(0) int get autoPromoDiscount;@HiveField(1) int get manualDiscount;@HiveField(2) int get voucherDiscount;
/// Create a copy of DiscountModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DiscountModelCopyWith<DiscountModel> get copyWith => _$DiscountModelCopyWithImpl<DiscountModel>(this as DiscountModel, _$identity);

  /// Serializes this DiscountModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DiscountModel&&(identical(other.autoPromoDiscount, autoPromoDiscount) || other.autoPromoDiscount == autoPromoDiscount)&&(identical(other.manualDiscount, manualDiscount) || other.manualDiscount == manualDiscount)&&(identical(other.voucherDiscount, voucherDiscount) || other.voucherDiscount == voucherDiscount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,autoPromoDiscount,manualDiscount,voucherDiscount);

@override
String toString() {
  return 'DiscountModel(autoPromoDiscount: $autoPromoDiscount, manualDiscount: $manualDiscount, voucherDiscount: $voucherDiscount)';
}


}

/// @nodoc
abstract mixin class $DiscountModelCopyWith<$Res>  {
  factory $DiscountModelCopyWith(DiscountModel value, $Res Function(DiscountModel) _then) = _$DiscountModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) int autoPromoDiscount,@HiveField(1) int manualDiscount,@HiveField(2) int voucherDiscount
});




}
/// @nodoc
class _$DiscountModelCopyWithImpl<$Res>
    implements $DiscountModelCopyWith<$Res> {
  _$DiscountModelCopyWithImpl(this._self, this._then);

  final DiscountModel _self;
  final $Res Function(DiscountModel) _then;

/// Create a copy of DiscountModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? autoPromoDiscount = null,Object? manualDiscount = null,Object? voucherDiscount = null,}) {
  return _then(_self.copyWith(
autoPromoDiscount: null == autoPromoDiscount ? _self.autoPromoDiscount : autoPromoDiscount // ignore: cast_nullable_to_non_nullable
as int,manualDiscount: null == manualDiscount ? _self.manualDiscount : manualDiscount // ignore: cast_nullable_to_non_nullable
as int,voucherDiscount: null == voucherDiscount ? _self.voucherDiscount : voucherDiscount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _DiscountModel implements DiscountModel {
   _DiscountModel({@HiveField(0) this.autoPromoDiscount = 0, @HiveField(1) this.manualDiscount = 0, @HiveField(2) this.voucherDiscount = 0});
  factory _DiscountModel.fromJson(Map<String, dynamic> json) => _$DiscountModelFromJson(json);

@override@JsonKey()@HiveField(0) final  int autoPromoDiscount;
@override@JsonKey()@HiveField(1) final  int manualDiscount;
@override@JsonKey()@HiveField(2) final  int voucherDiscount;

/// Create a copy of DiscountModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DiscountModelCopyWith<_DiscountModel> get copyWith => __$DiscountModelCopyWithImpl<_DiscountModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DiscountModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DiscountModel&&(identical(other.autoPromoDiscount, autoPromoDiscount) || other.autoPromoDiscount == autoPromoDiscount)&&(identical(other.manualDiscount, manualDiscount) || other.manualDiscount == manualDiscount)&&(identical(other.voucherDiscount, voucherDiscount) || other.voucherDiscount == voucherDiscount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,autoPromoDiscount,manualDiscount,voucherDiscount);

@override
String toString() {
  return 'DiscountModel(autoPromoDiscount: $autoPromoDiscount, manualDiscount: $manualDiscount, voucherDiscount: $voucherDiscount)';
}


}

/// @nodoc
abstract mixin class _$DiscountModelCopyWith<$Res> implements $DiscountModelCopyWith<$Res> {
  factory _$DiscountModelCopyWith(_DiscountModel value, $Res Function(_DiscountModel) _then) = __$DiscountModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) int autoPromoDiscount,@HiveField(1) int manualDiscount,@HiveField(2) int voucherDiscount
});




}
/// @nodoc
class __$DiscountModelCopyWithImpl<$Res>
    implements _$DiscountModelCopyWith<$Res> {
  __$DiscountModelCopyWithImpl(this._self, this._then);

  final _DiscountModel _self;
  final $Res Function(_DiscountModel) _then;

/// Create a copy of DiscountModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? autoPromoDiscount = null,Object? manualDiscount = null,Object? voucherDiscount = null,}) {
  return _then(_DiscountModel(
autoPromoDiscount: null == autoPromoDiscount ? _self.autoPromoDiscount : autoPromoDiscount // ignore: cast_nullable_to_non_nullable
as int,manualDiscount: null == manualDiscount ? _self.manualDiscount : manualDiscount // ignore: cast_nullable_to_non_nullable
as int,voucherDiscount: null == voucherDiscount ? _self.voucherDiscount : voucherDiscount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
