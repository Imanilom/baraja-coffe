// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'custom_amount_items.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$CustomAmountItemsModel {

@HiveField(0) int get amount;@HiveField(1) String? get name;@HiveField(2) String? get description;@HiveField(3)@JsonKey(fromJson: OrderTypeModel.fromString, toJson: OrderTypeModel.toJsonString) OrderTypeModel? get orderType;
/// Create a copy of CustomAmountItemsModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CustomAmountItemsModelCopyWith<CustomAmountItemsModel> get copyWith => _$CustomAmountItemsModelCopyWithImpl<CustomAmountItemsModel>(this as CustomAmountItemsModel, _$identity);

  /// Serializes this CustomAmountItemsModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CustomAmountItemsModel&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&(identical(other.orderType, orderType) || other.orderType == orderType));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,amount,name,description,orderType);

@override
String toString() {
  return 'CustomAmountItemsModel(amount: $amount, name: $name, description: $description, orderType: $orderType)';
}


}

/// @nodoc
abstract mixin class $CustomAmountItemsModelCopyWith<$Res>  {
  factory $CustomAmountItemsModelCopyWith(CustomAmountItemsModel value, $Res Function(CustomAmountItemsModel) _then) = _$CustomAmountItemsModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) int amount,@HiveField(1) String? name,@HiveField(2) String? description,@HiveField(3)@JsonKey(fromJson: OrderTypeModel.fromString, toJson: OrderTypeModel.toJsonString) OrderTypeModel? orderType
});


$OrderTypeModelCopyWith<$Res>? get orderType;

}
/// @nodoc
class _$CustomAmountItemsModelCopyWithImpl<$Res>
    implements $CustomAmountItemsModelCopyWith<$Res> {
  _$CustomAmountItemsModelCopyWithImpl(this._self, this._then);

  final CustomAmountItemsModel _self;
  final $Res Function(CustomAmountItemsModel) _then;

/// Create a copy of CustomAmountItemsModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? amount = null,Object? name = freezed,Object? description = freezed,Object? orderType = freezed,}) {
  return _then(_self.copyWith(
amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,orderType: freezed == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as OrderTypeModel?,
  ));
}
/// Create a copy of CustomAmountItemsModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OrderTypeModelCopyWith<$Res>? get orderType {
    if (_self.orderType == null) {
    return null;
  }

  return $OrderTypeModelCopyWith<$Res>(_self.orderType!, (value) {
    return _then(_self.copyWith(orderType: value));
  });
}
}


/// Adds pattern-matching-related methods to [CustomAmountItemsModel].
extension CustomAmountItemsModelPatterns on CustomAmountItemsModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CustomAmountItemsModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CustomAmountItemsModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CustomAmountItemsModel value)  $default,){
final _that = this;
switch (_that) {
case _CustomAmountItemsModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CustomAmountItemsModel value)?  $default,){
final _that = this;
switch (_that) {
case _CustomAmountItemsModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  int amount, @HiveField(1)  String? name, @HiveField(2)  String? description, @HiveField(3)@JsonKey(fromJson: OrderTypeModel.fromString, toJson: OrderTypeModel.toJsonString)  OrderTypeModel? orderType)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CustomAmountItemsModel() when $default != null:
return $default(_that.amount,_that.name,_that.description,_that.orderType);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  int amount, @HiveField(1)  String? name, @HiveField(2)  String? description, @HiveField(3)@JsonKey(fromJson: OrderTypeModel.fromString, toJson: OrderTypeModel.toJsonString)  OrderTypeModel? orderType)  $default,) {final _that = this;
switch (_that) {
case _CustomAmountItemsModel():
return $default(_that.amount,_that.name,_that.description,_that.orderType);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  int amount, @HiveField(1)  String? name, @HiveField(2)  String? description, @HiveField(3)@JsonKey(fromJson: OrderTypeModel.fromString, toJson: OrderTypeModel.toJsonString)  OrderTypeModel? orderType)?  $default,) {final _that = this;
switch (_that) {
case _CustomAmountItemsModel() when $default != null:
return $default(_that.amount,_that.name,_that.description,_that.orderType);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CustomAmountItemsModel extends CustomAmountItemsModel {
   _CustomAmountItemsModel({@HiveField(0) this.amount = 0, @HiveField(1) this.name = 'Custom Amount', @HiveField(2) this.description = null, @HiveField(3)@JsonKey(fromJson: OrderTypeModel.fromString, toJson: OrderTypeModel.toJsonString) this.orderType = OrderTypeModel.dineIn}): super._();
  factory _CustomAmountItemsModel.fromJson(Map<String, dynamic> json) => _$CustomAmountItemsModelFromJson(json);

@override@JsonKey()@HiveField(0) final  int amount;
@override@JsonKey()@HiveField(1) final  String? name;
@override@JsonKey()@HiveField(2) final  String? description;
@override@HiveField(3)@JsonKey(fromJson: OrderTypeModel.fromString, toJson: OrderTypeModel.toJsonString) final  OrderTypeModel? orderType;

/// Create a copy of CustomAmountItemsModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CustomAmountItemsModelCopyWith<_CustomAmountItemsModel> get copyWith => __$CustomAmountItemsModelCopyWithImpl<_CustomAmountItemsModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CustomAmountItemsModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CustomAmountItemsModel&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&(identical(other.orderType, orderType) || other.orderType == orderType));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,amount,name,description,orderType);

@override
String toString() {
  return 'CustomAmountItemsModel(amount: $amount, name: $name, description: $description, orderType: $orderType)';
}


}

/// @nodoc
abstract mixin class _$CustomAmountItemsModelCopyWith<$Res> implements $CustomAmountItemsModelCopyWith<$Res> {
  factory _$CustomAmountItemsModelCopyWith(_CustomAmountItemsModel value, $Res Function(_CustomAmountItemsModel) _then) = __$CustomAmountItemsModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) int amount,@HiveField(1) String? name,@HiveField(2) String? description,@HiveField(3)@JsonKey(fromJson: OrderTypeModel.fromString, toJson: OrderTypeModel.toJsonString) OrderTypeModel? orderType
});


@override $OrderTypeModelCopyWith<$Res>? get orderType;

}
/// @nodoc
class __$CustomAmountItemsModelCopyWithImpl<$Res>
    implements _$CustomAmountItemsModelCopyWith<$Res> {
  __$CustomAmountItemsModelCopyWithImpl(this._self, this._then);

  final _CustomAmountItemsModel _self;
  final $Res Function(_CustomAmountItemsModel) _then;

/// Create a copy of CustomAmountItemsModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? amount = null,Object? name = freezed,Object? description = freezed,Object? orderType = freezed,}) {
  return _then(_CustomAmountItemsModel(
amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as int,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,orderType: freezed == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as OrderTypeModel?,
  ));
}

/// Create a copy of CustomAmountItemsModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OrderTypeModelCopyWith<$Res>? get orderType {
    if (_self.orderType == null) {
    return null;
  }

  return $OrderTypeModelCopyWith<$Res>(_self.orderType!, (value) {
    return _then(_self.copyWith(orderType: value));
  });
}
}

// dart format on
