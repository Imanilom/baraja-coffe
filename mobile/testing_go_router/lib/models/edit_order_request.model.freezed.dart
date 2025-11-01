// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'edit_order_request.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$EditOrderRequest {

 String get reason; List<Operation> get operations;
/// Create a copy of EditOrderRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EditOrderRequestCopyWith<EditOrderRequest> get copyWith => _$EditOrderRequestCopyWithImpl<EditOrderRequest>(this as EditOrderRequest, _$identity);

  /// Serializes this EditOrderRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EditOrderRequest&&(identical(other.reason, reason) || other.reason == reason)&&const DeepCollectionEquality().equals(other.operations, operations));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,reason,const DeepCollectionEquality().hash(operations));

@override
String toString() {
  return 'EditOrderRequest(reason: $reason, operations: $operations)';
}


}

/// @nodoc
abstract mixin class $EditOrderRequestCopyWith<$Res>  {
  factory $EditOrderRequestCopyWith(EditOrderRequest value, $Res Function(EditOrderRequest) _then) = _$EditOrderRequestCopyWithImpl;
@useResult
$Res call({
 String reason, List<Operation> operations
});




}
/// @nodoc
class _$EditOrderRequestCopyWithImpl<$Res>
    implements $EditOrderRequestCopyWith<$Res> {
  _$EditOrderRequestCopyWithImpl(this._self, this._then);

  final EditOrderRequest _self;
  final $Res Function(EditOrderRequest) _then;

/// Create a copy of EditOrderRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reason = null,Object? operations = null,}) {
  return _then(_self.copyWith(
reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,operations: null == operations ? _self.operations : operations // ignore: cast_nullable_to_non_nullable
as List<Operation>,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _EditOrderRequest implements EditOrderRequest {
  const _EditOrderRequest({required this.reason, required final  List<Operation> operations}): _operations = operations;
  factory _EditOrderRequest.fromJson(Map<String, dynamic> json) => _$EditOrderRequestFromJson(json);

@override final  String reason;
 final  List<Operation> _operations;
@override List<Operation> get operations {
  if (_operations is EqualUnmodifiableListView) return _operations;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_operations);
}


/// Create a copy of EditOrderRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EditOrderRequestCopyWith<_EditOrderRequest> get copyWith => __$EditOrderRequestCopyWithImpl<_EditOrderRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EditOrderRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EditOrderRequest&&(identical(other.reason, reason) || other.reason == reason)&&const DeepCollectionEquality().equals(other._operations, _operations));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,reason,const DeepCollectionEquality().hash(_operations));

@override
String toString() {
  return 'EditOrderRequest(reason: $reason, operations: $operations)';
}


}

/// @nodoc
abstract mixin class _$EditOrderRequestCopyWith<$Res> implements $EditOrderRequestCopyWith<$Res> {
  factory _$EditOrderRequestCopyWith(_EditOrderRequest value, $Res Function(_EditOrderRequest) _then) = __$EditOrderRequestCopyWithImpl;
@override @useResult
$Res call({
 String reason, List<Operation> operations
});




}
/// @nodoc
class __$EditOrderRequestCopyWithImpl<$Res>
    implements _$EditOrderRequestCopyWith<$Res> {
  __$EditOrderRequestCopyWithImpl(this._self, this._then);

  final _EditOrderRequest _self;
  final $Res Function(_EditOrderRequest) _then;

/// Create a copy of EditOrderRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reason = null,Object? operations = null,}) {
  return _then(_EditOrderRequest(
reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,operations: null == operations ? _self._operations : operations // ignore: cast_nullable_to_non_nullable
as List<Operation>,
  ));
}


}

Operation _$OperationFromJson(
  Map<String, dynamic> json
) {
        switch (json['runtimeType']) {
                  case 'add':
          return AddOperation.fromJson(
            json
          );
                case 'update':
          return UpdateOperation.fromJson(
            json
          );
                case 'remove':
          return RemoveOperation.fromJson(
            json
          );
        
          default:
            throw CheckedFromJsonException(
  json,
  'runtimeType',
  'Operation',
  'Invalid union type "${json['runtimeType']}"!'
);
        }
      
}

/// @nodoc
mixin _$Operation {



  /// Serializes this Operation to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Operation);
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'Operation()';
}


}

/// @nodoc
class $OperationCopyWith<$Res>  {
$OperationCopyWith(Operation _, $Res Function(Operation) __);
}


/// @nodoc
@JsonSerializable()

class AddOperation implements Operation {
  const AddOperation({required this.item, final  String? $type}): $type = $type ?? 'add';
  factory AddOperation.fromJson(Map<String, dynamic> json) => _$AddOperationFromJson(json);

 final  OrderItemModel item;

@JsonKey(name: 'runtimeType')
final String $type;


/// Create a copy of Operation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AddOperationCopyWith<AddOperation> get copyWith => _$AddOperationCopyWithImpl<AddOperation>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AddOperationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AddOperation&&(identical(other.item, item) || other.item == item));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,item);

@override
String toString() {
  return 'Operation.add(item: $item)';
}


}

/// @nodoc
abstract mixin class $AddOperationCopyWith<$Res> implements $OperationCopyWith<$Res> {
  factory $AddOperationCopyWith(AddOperation value, $Res Function(AddOperation) _then) = _$AddOperationCopyWithImpl;
@useResult
$Res call({
 OrderItemModel item
});


$OrderItemModelCopyWith<$Res> get item;

}
/// @nodoc
class _$AddOperationCopyWithImpl<$Res>
    implements $AddOperationCopyWith<$Res> {
  _$AddOperationCopyWithImpl(this._self, this._then);

  final AddOperation _self;
  final $Res Function(AddOperation) _then;

/// Create a copy of Operation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? item = null,}) {
  return _then(AddOperation(
item: null == item ? _self.item : item // ignore: cast_nullable_to_non_nullable
as OrderItemModel,
  ));
}

/// Create a copy of Operation
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OrderItemModelCopyWith<$Res> get item {
  
  return $OrderItemModelCopyWith<$Res>(_self.item, (value) {
    return _then(_self.copyWith(item: value));
  });
}
}

/// @nodoc
@JsonSerializable()

class UpdateOperation implements Operation {
  const UpdateOperation({required this.itemId, required final  Map<String, dynamic> patch, this.oos = false, final  String? $type}): _patch = patch,$type = $type ?? 'update';
  factory UpdateOperation.fromJson(Map<String, dynamic> json) => _$UpdateOperationFromJson(json);

 final  String itemId;
 final  Map<String, dynamic> _patch;
 Map<String, dynamic> get patch {
  if (_patch is EqualUnmodifiableMapView) return _patch;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_patch);
}

@JsonKey() final  bool oos;

@JsonKey(name: 'runtimeType')
final String $type;


/// Create a copy of Operation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$UpdateOperationCopyWith<UpdateOperation> get copyWith => _$UpdateOperationCopyWithImpl<UpdateOperation>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$UpdateOperationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is UpdateOperation&&(identical(other.itemId, itemId) || other.itemId == itemId)&&const DeepCollectionEquality().equals(other._patch, _patch)&&(identical(other.oos, oos) || other.oos == oos));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,itemId,const DeepCollectionEquality().hash(_patch),oos);

@override
String toString() {
  return 'Operation.update(itemId: $itemId, patch: $patch, oos: $oos)';
}


}

/// @nodoc
abstract mixin class $UpdateOperationCopyWith<$Res> implements $OperationCopyWith<$Res> {
  factory $UpdateOperationCopyWith(UpdateOperation value, $Res Function(UpdateOperation) _then) = _$UpdateOperationCopyWithImpl;
@useResult
$Res call({
 String itemId, Map<String, dynamic> patch, bool oos
});




}
/// @nodoc
class _$UpdateOperationCopyWithImpl<$Res>
    implements $UpdateOperationCopyWith<$Res> {
  _$UpdateOperationCopyWithImpl(this._self, this._then);

  final UpdateOperation _self;
  final $Res Function(UpdateOperation) _then;

/// Create a copy of Operation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? itemId = null,Object? patch = null,Object? oos = null,}) {
  return _then(UpdateOperation(
itemId: null == itemId ? _self.itemId : itemId // ignore: cast_nullable_to_non_nullable
as String,patch: null == patch ? _self._patch : patch // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>,oos: null == oos ? _self.oos : oos // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

/// @nodoc
@JsonSerializable()

class RemoveOperation implements Operation {
  const RemoveOperation({required this.itemId, this.oos = false, final  String? $type}): $type = $type ?? 'remove';
  factory RemoveOperation.fromJson(Map<String, dynamic> json) => _$RemoveOperationFromJson(json);

 final  String itemId;
@JsonKey() final  bool oos;

@JsonKey(name: 'runtimeType')
final String $type;


/// Create a copy of Operation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RemoveOperationCopyWith<RemoveOperation> get copyWith => _$RemoveOperationCopyWithImpl<RemoveOperation>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RemoveOperationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RemoveOperation&&(identical(other.itemId, itemId) || other.itemId == itemId)&&(identical(other.oos, oos) || other.oos == oos));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,itemId,oos);

@override
String toString() {
  return 'Operation.remove(itemId: $itemId, oos: $oos)';
}


}

/// @nodoc
abstract mixin class $RemoveOperationCopyWith<$Res> implements $OperationCopyWith<$Res> {
  factory $RemoveOperationCopyWith(RemoveOperation value, $Res Function(RemoveOperation) _then) = _$RemoveOperationCopyWithImpl;
@useResult
$Res call({
 String itemId, bool oos
});




}
/// @nodoc
class _$RemoveOperationCopyWithImpl<$Res>
    implements $RemoveOperationCopyWith<$Res> {
  _$RemoveOperationCopyWithImpl(this._self, this._then);

  final RemoveOperation _self;
  final $Res Function(RemoveOperation) _then;

/// Create a copy of Operation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? itemId = null,Object? oos = null,}) {
  return _then(RemoveOperation(
itemId: null == itemId ? _self.itemId : itemId // ignore: cast_nullable_to_non_nullable
as String,oos: null == oos ? _self.oos : oos // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
