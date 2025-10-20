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


/// @nodoc
mixin _$OrderItemModelForRequest {

 String get menuItem; int get quantity; List<SelectedAddonForRequest> get selectedAddons; List<SelectedToppingForRequest> get selectedToppings; String get notes; String get dineType;
/// Create a copy of OrderItemModelForRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OrderItemModelForRequestCopyWith<OrderItemModelForRequest> get copyWith => _$OrderItemModelForRequestCopyWithImpl<OrderItemModelForRequest>(this as OrderItemModelForRequest, _$identity);

  /// Serializes this OrderItemModelForRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OrderItemModelForRequest&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&const DeepCollectionEquality().equals(other.selectedAddons, selectedAddons)&&const DeepCollectionEquality().equals(other.selectedToppings, selectedToppings)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.dineType, dineType) || other.dineType == dineType));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,quantity,const DeepCollectionEquality().hash(selectedAddons),const DeepCollectionEquality().hash(selectedToppings),notes,dineType);

@override
String toString() {
  return 'OrderItemModelForRequest(menuItem: $menuItem, quantity: $quantity, selectedAddons: $selectedAddons, selectedToppings: $selectedToppings, notes: $notes, dineType: $dineType)';
}


}

/// @nodoc
abstract mixin class $OrderItemModelForRequestCopyWith<$Res>  {
  factory $OrderItemModelForRequestCopyWith(OrderItemModelForRequest value, $Res Function(OrderItemModelForRequest) _then) = _$OrderItemModelForRequestCopyWithImpl;
@useResult
$Res call({
 String menuItem, int quantity, List<SelectedAddonForRequest> selectedAddons, List<SelectedToppingForRequest> selectedToppings, String notes, String dineType
});




}
/// @nodoc
class _$OrderItemModelForRequestCopyWithImpl<$Res>
    implements $OrderItemModelForRequestCopyWith<$Res> {
  _$OrderItemModelForRequestCopyWithImpl(this._self, this._then);

  final OrderItemModelForRequest _self;
  final $Res Function(OrderItemModelForRequest) _then;

/// Create a copy of OrderItemModelForRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? menuItem = null,Object? quantity = null,Object? selectedAddons = null,Object? selectedToppings = null,Object? notes = null,Object? dineType = null,}) {
  return _then(_self.copyWith(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,selectedAddons: null == selectedAddons ? _self.selectedAddons : selectedAddons // ignore: cast_nullable_to_non_nullable
as List<SelectedAddonForRequest>,selectedToppings: null == selectedToppings ? _self.selectedToppings : selectedToppings // ignore: cast_nullable_to_non_nullable
as List<SelectedToppingForRequest>,notes: null == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String,dineType: null == dineType ? _self.dineType : dineType // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _OrderItemModelForRequest implements OrderItemModelForRequest {
  const _OrderItemModelForRequest({required this.menuItem, this.quantity = 1, final  List<SelectedAddonForRequest> selectedAddons = const [], final  List<SelectedToppingForRequest> selectedToppings = const [], this.notes = '', this.dineType = 'Dine-In'}): _selectedAddons = selectedAddons,_selectedToppings = selectedToppings;
  factory _OrderItemModelForRequest.fromJson(Map<String, dynamic> json) => _$OrderItemModelForRequestFromJson(json);

@override final  String menuItem;
@override@JsonKey() final  int quantity;
 final  List<SelectedAddonForRequest> _selectedAddons;
@override@JsonKey() List<SelectedAddonForRequest> get selectedAddons {
  if (_selectedAddons is EqualUnmodifiableListView) return _selectedAddons;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_selectedAddons);
}

 final  List<SelectedToppingForRequest> _selectedToppings;
@override@JsonKey() List<SelectedToppingForRequest> get selectedToppings {
  if (_selectedToppings is EqualUnmodifiableListView) return _selectedToppings;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_selectedToppings);
}

@override@JsonKey() final  String notes;
@override@JsonKey() final  String dineType;

/// Create a copy of OrderItemModelForRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OrderItemModelForRequestCopyWith<_OrderItemModelForRequest> get copyWith => __$OrderItemModelForRequestCopyWithImpl<_OrderItemModelForRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OrderItemModelForRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OrderItemModelForRequest&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&const DeepCollectionEquality().equals(other._selectedAddons, _selectedAddons)&&const DeepCollectionEquality().equals(other._selectedToppings, _selectedToppings)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.dineType, dineType) || other.dineType == dineType));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,quantity,const DeepCollectionEquality().hash(_selectedAddons),const DeepCollectionEquality().hash(_selectedToppings),notes,dineType);

@override
String toString() {
  return 'OrderItemModelForRequest(menuItem: $menuItem, quantity: $quantity, selectedAddons: $selectedAddons, selectedToppings: $selectedToppings, notes: $notes, dineType: $dineType)';
}


}

/// @nodoc
abstract mixin class _$OrderItemModelForRequestCopyWith<$Res> implements $OrderItemModelForRequestCopyWith<$Res> {
  factory _$OrderItemModelForRequestCopyWith(_OrderItemModelForRequest value, $Res Function(_OrderItemModelForRequest) _then) = __$OrderItemModelForRequestCopyWithImpl;
@override @useResult
$Res call({
 String menuItem, int quantity, List<SelectedAddonForRequest> selectedAddons, List<SelectedToppingForRequest> selectedToppings, String notes, String dineType
});




}
/// @nodoc
class __$OrderItemModelForRequestCopyWithImpl<$Res>
    implements _$OrderItemModelForRequestCopyWith<$Res> {
  __$OrderItemModelForRequestCopyWithImpl(this._self, this._then);

  final _OrderItemModelForRequest _self;
  final $Res Function(_OrderItemModelForRequest) _then;

/// Create a copy of OrderItemModelForRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? menuItem = null,Object? quantity = null,Object? selectedAddons = null,Object? selectedToppings = null,Object? notes = null,Object? dineType = null,}) {
  return _then(_OrderItemModelForRequest(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,selectedAddons: null == selectedAddons ? _self._selectedAddons : selectedAddons // ignore: cast_nullable_to_non_nullable
as List<SelectedAddonForRequest>,selectedToppings: null == selectedToppings ? _self._selectedToppings : selectedToppings // ignore: cast_nullable_to_non_nullable
as List<SelectedToppingForRequest>,notes: null == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String,dineType: null == dineType ? _self.dineType : dineType // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$SelectedAddonForRequest {

 String get id; List<SelectedOptionForRequest> get options;
/// Create a copy of SelectedAddonForRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SelectedAddonForRequestCopyWith<SelectedAddonForRequest> get copyWith => _$SelectedAddonForRequestCopyWithImpl<SelectedAddonForRequest>(this as SelectedAddonForRequest, _$identity);

  /// Serializes this SelectedAddonForRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SelectedAddonForRequest&&(identical(other.id, id) || other.id == id)&&const DeepCollectionEquality().equals(other.options, options));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,const DeepCollectionEquality().hash(options));

@override
String toString() {
  return 'SelectedAddonForRequest(id: $id, options: $options)';
}


}

/// @nodoc
abstract mixin class $SelectedAddonForRequestCopyWith<$Res>  {
  factory $SelectedAddonForRequestCopyWith(SelectedAddonForRequest value, $Res Function(SelectedAddonForRequest) _then) = _$SelectedAddonForRequestCopyWithImpl;
@useResult
$Res call({
 String id, List<SelectedOptionForRequest> options
});




}
/// @nodoc
class _$SelectedAddonForRequestCopyWithImpl<$Res>
    implements $SelectedAddonForRequestCopyWith<$Res> {
  _$SelectedAddonForRequestCopyWithImpl(this._self, this._then);

  final SelectedAddonForRequest _self;
  final $Res Function(SelectedAddonForRequest) _then;

/// Create a copy of SelectedAddonForRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? options = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,options: null == options ? _self.options : options // ignore: cast_nullable_to_non_nullable
as List<SelectedOptionForRequest>,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _SelectedAddonForRequest implements SelectedAddonForRequest {
  const _SelectedAddonForRequest({required this.id, final  List<SelectedOptionForRequest> options = const []}): _options = options;
  factory _SelectedAddonForRequest.fromJson(Map<String, dynamic> json) => _$SelectedAddonForRequestFromJson(json);

@override final  String id;
 final  List<SelectedOptionForRequest> _options;
@override@JsonKey() List<SelectedOptionForRequest> get options {
  if (_options is EqualUnmodifiableListView) return _options;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_options);
}


/// Create a copy of SelectedAddonForRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SelectedAddonForRequestCopyWith<_SelectedAddonForRequest> get copyWith => __$SelectedAddonForRequestCopyWithImpl<_SelectedAddonForRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SelectedAddonForRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SelectedAddonForRequest&&(identical(other.id, id) || other.id == id)&&const DeepCollectionEquality().equals(other._options, _options));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,const DeepCollectionEquality().hash(_options));

@override
String toString() {
  return 'SelectedAddonForRequest(id: $id, options: $options)';
}


}

/// @nodoc
abstract mixin class _$SelectedAddonForRequestCopyWith<$Res> implements $SelectedAddonForRequestCopyWith<$Res> {
  factory _$SelectedAddonForRequestCopyWith(_SelectedAddonForRequest value, $Res Function(_SelectedAddonForRequest) _then) = __$SelectedAddonForRequestCopyWithImpl;
@override @useResult
$Res call({
 String id, List<SelectedOptionForRequest> options
});




}
/// @nodoc
class __$SelectedAddonForRequestCopyWithImpl<$Res>
    implements _$SelectedAddonForRequestCopyWith<$Res> {
  __$SelectedAddonForRequestCopyWithImpl(this._self, this._then);

  final _SelectedAddonForRequest _self;
  final $Res Function(_SelectedAddonForRequest) _then;

/// Create a copy of SelectedAddonForRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? options = null,}) {
  return _then(_SelectedAddonForRequest(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,options: null == options ? _self._options : options // ignore: cast_nullable_to_non_nullable
as List<SelectedOptionForRequest>,
  ));
}


}


/// @nodoc
mixin _$SelectedOptionForRequest {

 String get id;
/// Create a copy of SelectedOptionForRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SelectedOptionForRequestCopyWith<SelectedOptionForRequest> get copyWith => _$SelectedOptionForRequestCopyWithImpl<SelectedOptionForRequest>(this as SelectedOptionForRequest, _$identity);

  /// Serializes this SelectedOptionForRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SelectedOptionForRequest&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id);

@override
String toString() {
  return 'SelectedOptionForRequest(id: $id)';
}


}

/// @nodoc
abstract mixin class $SelectedOptionForRequestCopyWith<$Res>  {
  factory $SelectedOptionForRequestCopyWith(SelectedOptionForRequest value, $Res Function(SelectedOptionForRequest) _then) = _$SelectedOptionForRequestCopyWithImpl;
@useResult
$Res call({
 String id
});




}
/// @nodoc
class _$SelectedOptionForRequestCopyWithImpl<$Res>
    implements $SelectedOptionForRequestCopyWith<$Res> {
  _$SelectedOptionForRequestCopyWithImpl(this._self, this._then);

  final SelectedOptionForRequest _self;
  final $Res Function(SelectedOptionForRequest) _then;

/// Create a copy of SelectedOptionForRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _SelectedOptionForRequest implements SelectedOptionForRequest {
  const _SelectedOptionForRequest({required this.id});
  factory _SelectedOptionForRequest.fromJson(Map<String, dynamic> json) => _$SelectedOptionForRequestFromJson(json);

@override final  String id;

/// Create a copy of SelectedOptionForRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SelectedOptionForRequestCopyWith<_SelectedOptionForRequest> get copyWith => __$SelectedOptionForRequestCopyWithImpl<_SelectedOptionForRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SelectedOptionForRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SelectedOptionForRequest&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id);

@override
String toString() {
  return 'SelectedOptionForRequest(id: $id)';
}


}

/// @nodoc
abstract mixin class _$SelectedOptionForRequestCopyWith<$Res> implements $SelectedOptionForRequestCopyWith<$Res> {
  factory _$SelectedOptionForRequestCopyWith(_SelectedOptionForRequest value, $Res Function(_SelectedOptionForRequest) _then) = __$SelectedOptionForRequestCopyWithImpl;
@override @useResult
$Res call({
 String id
});




}
/// @nodoc
class __$SelectedOptionForRequestCopyWithImpl<$Res>
    implements _$SelectedOptionForRequestCopyWith<$Res> {
  __$SelectedOptionForRequestCopyWithImpl(this._self, this._then);

  final _SelectedOptionForRequest _self;
  final $Res Function(_SelectedOptionForRequest) _then;

/// Create a copy of SelectedOptionForRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,}) {
  return _then(_SelectedOptionForRequest(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$SelectedToppingForRequest {

 String get id;
/// Create a copy of SelectedToppingForRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SelectedToppingForRequestCopyWith<SelectedToppingForRequest> get copyWith => _$SelectedToppingForRequestCopyWithImpl<SelectedToppingForRequest>(this as SelectedToppingForRequest, _$identity);

  /// Serializes this SelectedToppingForRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SelectedToppingForRequest&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id);

@override
String toString() {
  return 'SelectedToppingForRequest(id: $id)';
}


}

/// @nodoc
abstract mixin class $SelectedToppingForRequestCopyWith<$Res>  {
  factory $SelectedToppingForRequestCopyWith(SelectedToppingForRequest value, $Res Function(SelectedToppingForRequest) _then) = _$SelectedToppingForRequestCopyWithImpl;
@useResult
$Res call({
 String id
});




}
/// @nodoc
class _$SelectedToppingForRequestCopyWithImpl<$Res>
    implements $SelectedToppingForRequestCopyWith<$Res> {
  _$SelectedToppingForRequestCopyWithImpl(this._self, this._then);

  final SelectedToppingForRequest _self;
  final $Res Function(SelectedToppingForRequest) _then;

/// Create a copy of SelectedToppingForRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _SelectedToppingForRequest implements SelectedToppingForRequest {
  const _SelectedToppingForRequest({required this.id});
  factory _SelectedToppingForRequest.fromJson(Map<String, dynamic> json) => _$SelectedToppingForRequestFromJson(json);

@override final  String id;

/// Create a copy of SelectedToppingForRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SelectedToppingForRequestCopyWith<_SelectedToppingForRequest> get copyWith => __$SelectedToppingForRequestCopyWithImpl<_SelectedToppingForRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SelectedToppingForRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SelectedToppingForRequest&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id);

@override
String toString() {
  return 'SelectedToppingForRequest(id: $id)';
}


}

/// @nodoc
abstract mixin class _$SelectedToppingForRequestCopyWith<$Res> implements $SelectedToppingForRequestCopyWith<$Res> {
  factory _$SelectedToppingForRequestCopyWith(_SelectedToppingForRequest value, $Res Function(_SelectedToppingForRequest) _then) = __$SelectedToppingForRequestCopyWithImpl;
@override @useResult
$Res call({
 String id
});




}
/// @nodoc
class __$SelectedToppingForRequestCopyWithImpl<$Res>
    implements _$SelectedToppingForRequestCopyWith<$Res> {
  __$SelectedToppingForRequestCopyWithImpl(this._self, this._then);

  final _SelectedToppingForRequest _self;
  final $Res Function(_SelectedToppingForRequest) _then;

/// Create a copy of SelectedToppingForRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,}) {
  return _then(_SelectedToppingForRequest(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
