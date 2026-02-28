// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'custom_discount.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$CustomDiscountModel {

/// Status aktif discount
@HiveField(0) bool get isActive;/// Tipe discount: 'percentage' atau 'fixed'
@HiveField(1) String? get discountType;/// Nilai discount (percentage number atau nominal rupiah)
@HiveField(2) int get discountValue;/// Jumlah discount dalam rupiah (hasil kalkulasi)
@HiveField(3) int get discountAmount;/// ID kasir yang menerapkan discount
@HiveField(4) String? get appliedBy;/// Waktu discount diterapkan
@HiveField(5) DateTime? get appliedAt;/// Alasan pemberian discount
@HiveField(6) String get reason;
/// Create a copy of CustomDiscountModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CustomDiscountModelCopyWith<CustomDiscountModel> get copyWith => _$CustomDiscountModelCopyWithImpl<CustomDiscountModel>(this as CustomDiscountModel, _$identity);

  /// Serializes this CustomDiscountModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CustomDiscountModel&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.discountType, discountType) || other.discountType == discountType)&&(identical(other.discountValue, discountValue) || other.discountValue == discountValue)&&(identical(other.discountAmount, discountAmount) || other.discountAmount == discountAmount)&&(identical(other.appliedBy, appliedBy) || other.appliedBy == appliedBy)&&(identical(other.appliedAt, appliedAt) || other.appliedAt == appliedAt)&&(identical(other.reason, reason) || other.reason == reason));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,isActive,discountType,discountValue,discountAmount,appliedBy,appliedAt,reason);

@override
String toString() {
  return 'CustomDiscountModel(isActive: $isActive, discountType: $discountType, discountValue: $discountValue, discountAmount: $discountAmount, appliedBy: $appliedBy, appliedAt: $appliedAt, reason: $reason)';
}


}

/// @nodoc
abstract mixin class $CustomDiscountModelCopyWith<$Res>  {
  factory $CustomDiscountModelCopyWith(CustomDiscountModel value, $Res Function(CustomDiscountModel) _then) = _$CustomDiscountModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) bool isActive,@HiveField(1) String? discountType,@HiveField(2) int discountValue,@HiveField(3) int discountAmount,@HiveField(4) String? appliedBy,@HiveField(5) DateTime? appliedAt,@HiveField(6) String reason
});




}
/// @nodoc
class _$CustomDiscountModelCopyWithImpl<$Res>
    implements $CustomDiscountModelCopyWith<$Res> {
  _$CustomDiscountModelCopyWithImpl(this._self, this._then);

  final CustomDiscountModel _self;
  final $Res Function(CustomDiscountModel) _then;

/// Create a copy of CustomDiscountModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? isActive = null,Object? discountType = freezed,Object? discountValue = null,Object? discountAmount = null,Object? appliedBy = freezed,Object? appliedAt = freezed,Object? reason = null,}) {
  return _then(_self.copyWith(
isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,discountType: freezed == discountType ? _self.discountType : discountType // ignore: cast_nullable_to_non_nullable
as String?,discountValue: null == discountValue ? _self.discountValue : discountValue // ignore: cast_nullable_to_non_nullable
as int,discountAmount: null == discountAmount ? _self.discountAmount : discountAmount // ignore: cast_nullable_to_non_nullable
as int,appliedBy: freezed == appliedBy ? _self.appliedBy : appliedBy // ignore: cast_nullable_to_non_nullable
as String?,appliedAt: freezed == appliedAt ? _self.appliedAt : appliedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [CustomDiscountModel].
extension CustomDiscountModelPatterns on CustomDiscountModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CustomDiscountModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CustomDiscountModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CustomDiscountModel value)  $default,){
final _that = this;
switch (_that) {
case _CustomDiscountModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CustomDiscountModel value)?  $default,){
final _that = this;
switch (_that) {
case _CustomDiscountModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  bool isActive, @HiveField(1)  String? discountType, @HiveField(2)  int discountValue, @HiveField(3)  int discountAmount, @HiveField(4)  String? appliedBy, @HiveField(5)  DateTime? appliedAt, @HiveField(6)  String reason)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CustomDiscountModel() when $default != null:
return $default(_that.isActive,_that.discountType,_that.discountValue,_that.discountAmount,_that.appliedBy,_that.appliedAt,_that.reason);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  bool isActive, @HiveField(1)  String? discountType, @HiveField(2)  int discountValue, @HiveField(3)  int discountAmount, @HiveField(4)  String? appliedBy, @HiveField(5)  DateTime? appliedAt, @HiveField(6)  String reason)  $default,) {final _that = this;
switch (_that) {
case _CustomDiscountModel():
return $default(_that.isActive,_that.discountType,_that.discountValue,_that.discountAmount,_that.appliedBy,_that.appliedAt,_that.reason);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  bool isActive, @HiveField(1)  String? discountType, @HiveField(2)  int discountValue, @HiveField(3)  int discountAmount, @HiveField(4)  String? appliedBy, @HiveField(5)  DateTime? appliedAt, @HiveField(6)  String reason)?  $default,) {final _that = this;
switch (_that) {
case _CustomDiscountModel() when $default != null:
return $default(_that.isActive,_that.discountType,_that.discountValue,_that.discountAmount,_that.appliedBy,_that.appliedAt,_that.reason);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CustomDiscountModel implements CustomDiscountModel {
  const _CustomDiscountModel({@HiveField(0) this.isActive = false, @HiveField(1) this.discountType, @HiveField(2) this.discountValue = 0, @HiveField(3) this.discountAmount = 0, @HiveField(4) this.appliedBy, @HiveField(5) this.appliedAt, @HiveField(6) this.reason = ''});
  factory _CustomDiscountModel.fromJson(Map<String, dynamic> json) => _$CustomDiscountModelFromJson(json);

/// Status aktif discount
@override@JsonKey()@HiveField(0) final  bool isActive;
/// Tipe discount: 'percentage' atau 'fixed'
@override@HiveField(1) final  String? discountType;
/// Nilai discount (percentage number atau nominal rupiah)
@override@JsonKey()@HiveField(2) final  int discountValue;
/// Jumlah discount dalam rupiah (hasil kalkulasi)
@override@JsonKey()@HiveField(3) final  int discountAmount;
/// ID kasir yang menerapkan discount
@override@HiveField(4) final  String? appliedBy;
/// Waktu discount diterapkan
@override@HiveField(5) final  DateTime? appliedAt;
/// Alasan pemberian discount
@override@JsonKey()@HiveField(6) final  String reason;

/// Create a copy of CustomDiscountModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CustomDiscountModelCopyWith<_CustomDiscountModel> get copyWith => __$CustomDiscountModelCopyWithImpl<_CustomDiscountModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CustomDiscountModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CustomDiscountModel&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.discountType, discountType) || other.discountType == discountType)&&(identical(other.discountValue, discountValue) || other.discountValue == discountValue)&&(identical(other.discountAmount, discountAmount) || other.discountAmount == discountAmount)&&(identical(other.appliedBy, appliedBy) || other.appliedBy == appliedBy)&&(identical(other.appliedAt, appliedAt) || other.appliedAt == appliedAt)&&(identical(other.reason, reason) || other.reason == reason));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,isActive,discountType,discountValue,discountAmount,appliedBy,appliedAt,reason);

@override
String toString() {
  return 'CustomDiscountModel(isActive: $isActive, discountType: $discountType, discountValue: $discountValue, discountAmount: $discountAmount, appliedBy: $appliedBy, appliedAt: $appliedAt, reason: $reason)';
}


}

/// @nodoc
abstract mixin class _$CustomDiscountModelCopyWith<$Res> implements $CustomDiscountModelCopyWith<$Res> {
  factory _$CustomDiscountModelCopyWith(_CustomDiscountModel value, $Res Function(_CustomDiscountModel) _then) = __$CustomDiscountModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) bool isActive,@HiveField(1) String? discountType,@HiveField(2) int discountValue,@HiveField(3) int discountAmount,@HiveField(4) String? appliedBy,@HiveField(5) DateTime? appliedAt,@HiveField(6) String reason
});




}
/// @nodoc
class __$CustomDiscountModelCopyWithImpl<$Res>
    implements _$CustomDiscountModelCopyWith<$Res> {
  __$CustomDiscountModelCopyWithImpl(this._self, this._then);

  final _CustomDiscountModel _self;
  final $Res Function(_CustomDiscountModel) _then;

/// Create a copy of CustomDiscountModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? isActive = null,Object? discountType = freezed,Object? discountValue = null,Object? discountAmount = null,Object? appliedBy = freezed,Object? appliedAt = freezed,Object? reason = null,}) {
  return _then(_CustomDiscountModel(
isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,discountType: freezed == discountType ? _self.discountType : discountType // ignore: cast_nullable_to_non_nullable
as String?,discountValue: null == discountValue ? _self.discountValue : discountValue // ignore: cast_nullable_to_non_nullable
as int,discountAmount: null == discountAmount ? _self.discountAmount : discountAmount // ignore: cast_nullable_to_non_nullable
as int,appliedBy: freezed == appliedBy ? _self.appliedBy : appliedBy // ignore: cast_nullable_to_non_nullable
as String?,appliedAt: freezed == appliedAt ? _self.appliedAt : appliedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
