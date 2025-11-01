// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'edit_order_item.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$EditOrderItemModel {

@HiveField(0) String? get reason;@HiveField(1) OrderDetailModel? get order;@HiveField(2) List<OrderItemModel>? get originalItems;@HiveField(3) bool get isSubmitting;@HiveField(4) String? get error;
/// Create a copy of EditOrderItemModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EditOrderItemModelCopyWith<EditOrderItemModel> get copyWith => _$EditOrderItemModelCopyWithImpl<EditOrderItemModel>(this as EditOrderItemModel, _$identity);

  /// Serializes this EditOrderItemModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EditOrderItemModel&&(identical(other.reason, reason) || other.reason == reason)&&(identical(other.order, order) || other.order == order)&&const DeepCollectionEquality().equals(other.originalItems, originalItems)&&(identical(other.isSubmitting, isSubmitting) || other.isSubmitting == isSubmitting)&&(identical(other.error, error) || other.error == error));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,reason,order,const DeepCollectionEquality().hash(originalItems),isSubmitting,error);

@override
String toString() {
  return 'EditOrderItemModel(reason: $reason, order: $order, originalItems: $originalItems, isSubmitting: $isSubmitting, error: $error)';
}


}

/// @nodoc
abstract mixin class $EditOrderItemModelCopyWith<$Res>  {
  factory $EditOrderItemModelCopyWith(EditOrderItemModel value, $Res Function(EditOrderItemModel) _then) = _$EditOrderItemModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String? reason,@HiveField(1) OrderDetailModel? order,@HiveField(2) List<OrderItemModel>? originalItems,@HiveField(3) bool isSubmitting,@HiveField(4) String? error
});


$OrderDetailModelCopyWith<$Res>? get order;

}
/// @nodoc
class _$EditOrderItemModelCopyWithImpl<$Res>
    implements $EditOrderItemModelCopyWith<$Res> {
  _$EditOrderItemModelCopyWithImpl(this._self, this._then);

  final EditOrderItemModel _self;
  final $Res Function(EditOrderItemModel) _then;

/// Create a copy of EditOrderItemModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reason = freezed,Object? order = freezed,Object? originalItems = freezed,Object? isSubmitting = null,Object? error = freezed,}) {
  return _then(_self.copyWith(
reason: freezed == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String?,order: freezed == order ? _self.order : order // ignore: cast_nullable_to_non_nullable
as OrderDetailModel?,originalItems: freezed == originalItems ? _self.originalItems : originalItems // ignore: cast_nullable_to_non_nullable
as List<OrderItemModel>?,isSubmitting: null == isSubmitting ? _self.isSubmitting : isSubmitting // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of EditOrderItemModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OrderDetailModelCopyWith<$Res>? get order {
    if (_self.order == null) {
    return null;
  }

  return $OrderDetailModelCopyWith<$Res>(_self.order!, (value) {
    return _then(_self.copyWith(order: value));
  });
}
}


/// @nodoc
@JsonSerializable()

class _EditOrderItemModel implements EditOrderItemModel {
   _EditOrderItemModel({@HiveField(0) this.reason = null, @HiveField(1) this.order = null, @HiveField(2) final  List<OrderItemModel>? originalItems = const [], @HiveField(3) this.isSubmitting = false, @HiveField(4) this.error = null}): _originalItems = originalItems;
  factory _EditOrderItemModel.fromJson(Map<String, dynamic> json) => _$EditOrderItemModelFromJson(json);

@override@JsonKey()@HiveField(0) final  String? reason;
@override@JsonKey()@HiveField(1) final  OrderDetailModel? order;
 final  List<OrderItemModel>? _originalItems;
@override@JsonKey()@HiveField(2) List<OrderItemModel>? get originalItems {
  final value = _originalItems;
  if (value == null) return null;
  if (_originalItems is EqualUnmodifiableListView) return _originalItems;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override@JsonKey()@HiveField(3) final  bool isSubmitting;
@override@JsonKey()@HiveField(4) final  String? error;

/// Create a copy of EditOrderItemModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EditOrderItemModelCopyWith<_EditOrderItemModel> get copyWith => __$EditOrderItemModelCopyWithImpl<_EditOrderItemModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EditOrderItemModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EditOrderItemModel&&(identical(other.reason, reason) || other.reason == reason)&&(identical(other.order, order) || other.order == order)&&const DeepCollectionEquality().equals(other._originalItems, _originalItems)&&(identical(other.isSubmitting, isSubmitting) || other.isSubmitting == isSubmitting)&&(identical(other.error, error) || other.error == error));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,reason,order,const DeepCollectionEquality().hash(_originalItems),isSubmitting,error);

@override
String toString() {
  return 'EditOrderItemModel(reason: $reason, order: $order, originalItems: $originalItems, isSubmitting: $isSubmitting, error: $error)';
}


}

/// @nodoc
abstract mixin class _$EditOrderItemModelCopyWith<$Res> implements $EditOrderItemModelCopyWith<$Res> {
  factory _$EditOrderItemModelCopyWith(_EditOrderItemModel value, $Res Function(_EditOrderItemModel) _then) = __$EditOrderItemModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String? reason,@HiveField(1) OrderDetailModel? order,@HiveField(2) List<OrderItemModel>? originalItems,@HiveField(3) bool isSubmitting,@HiveField(4) String? error
});


@override $OrderDetailModelCopyWith<$Res>? get order;

}
/// @nodoc
class __$EditOrderItemModelCopyWithImpl<$Res>
    implements _$EditOrderItemModelCopyWith<$Res> {
  __$EditOrderItemModelCopyWithImpl(this._self, this._then);

  final _EditOrderItemModel _self;
  final $Res Function(_EditOrderItemModel) _then;

/// Create a copy of EditOrderItemModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reason = freezed,Object? order = freezed,Object? originalItems = freezed,Object? isSubmitting = null,Object? error = freezed,}) {
  return _then(_EditOrderItemModel(
reason: freezed == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String?,order: freezed == order ? _self.order : order // ignore: cast_nullable_to_non_nullable
as OrderDetailModel?,originalItems: freezed == originalItems ? _self._originalItems : originalItems // ignore: cast_nullable_to_non_nullable
as List<OrderItemModel>?,isSubmitting: null == isSubmitting ? _self.isSubmitting : isSubmitting // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of EditOrderItemModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OrderDetailModelCopyWith<$Res>? get order {
    if (_self.order == null) {
    return null;
  }

  return $OrderDetailModelCopyWith<$Res>(_self.order!, (value) {
    return _then(_self.copyWith(order: value));
  });
}
}

// dart format on
