// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'edit_order_ops.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$EditOrderOpsRequest {

 String get reason; List<EditOperation> get operations;
/// Create a copy of EditOrderOpsRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EditOrderOpsRequestCopyWith<EditOrderOpsRequest> get copyWith => _$EditOrderOpsRequestCopyWithImpl<EditOrderOpsRequest>(this as EditOrderOpsRequest, _$identity);

  /// Serializes this EditOrderOpsRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EditOrderOpsRequest&&(identical(other.reason, reason) || other.reason == reason)&&const DeepCollectionEquality().equals(other.operations, operations));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,reason,const DeepCollectionEquality().hash(operations));

@override
String toString() {
  return 'EditOrderOpsRequest(reason: $reason, operations: $operations)';
}


}

/// @nodoc
abstract mixin class $EditOrderOpsRequestCopyWith<$Res>  {
  factory $EditOrderOpsRequestCopyWith(EditOrderOpsRequest value, $Res Function(EditOrderOpsRequest) _then) = _$EditOrderOpsRequestCopyWithImpl;
@useResult
$Res call({
 String reason, List<EditOperation> operations
});




}
/// @nodoc
class _$EditOrderOpsRequestCopyWithImpl<$Res>
    implements $EditOrderOpsRequestCopyWith<$Res> {
  _$EditOrderOpsRequestCopyWithImpl(this._self, this._then);

  final EditOrderOpsRequest _self;
  final $Res Function(EditOrderOpsRequest) _then;

/// Create a copy of EditOrderOpsRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? reason = null,Object? operations = null,}) {
  return _then(_self.copyWith(
reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,operations: null == operations ? _self.operations : operations // ignore: cast_nullable_to_non_nullable
as List<EditOperation>,
  ));
}

}


/// Adds pattern-matching-related methods to [EditOrderOpsRequest].
extension EditOrderOpsRequestPatterns on EditOrderOpsRequest {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _EditOrderOpsRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _EditOrderOpsRequest() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _EditOrderOpsRequest value)  $default,){
final _that = this;
switch (_that) {
case _EditOrderOpsRequest():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _EditOrderOpsRequest value)?  $default,){
final _that = this;
switch (_that) {
case _EditOrderOpsRequest() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String reason,  List<EditOperation> operations)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _EditOrderOpsRequest() when $default != null:
return $default(_that.reason,_that.operations);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String reason,  List<EditOperation> operations)  $default,) {final _that = this;
switch (_that) {
case _EditOrderOpsRequest():
return $default(_that.reason,_that.operations);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String reason,  List<EditOperation> operations)?  $default,) {final _that = this;
switch (_that) {
case _EditOrderOpsRequest() when $default != null:
return $default(_that.reason,_that.operations);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _EditOrderOpsRequest implements EditOrderOpsRequest {
   _EditOrderOpsRequest({required this.reason, required final  List<EditOperation> operations}): _operations = operations;
  factory _EditOrderOpsRequest.fromJson(Map<String, dynamic> json) => _$EditOrderOpsRequestFromJson(json);

@override final  String reason;
 final  List<EditOperation> _operations;
@override List<EditOperation> get operations {
  if (_operations is EqualUnmodifiableListView) return _operations;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_operations);
}


/// Create a copy of EditOrderOpsRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EditOrderOpsRequestCopyWith<_EditOrderOpsRequest> get copyWith => __$EditOrderOpsRequestCopyWithImpl<_EditOrderOpsRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EditOrderOpsRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EditOrderOpsRequest&&(identical(other.reason, reason) || other.reason == reason)&&const DeepCollectionEquality().equals(other._operations, _operations));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,reason,const DeepCollectionEquality().hash(_operations));

@override
String toString() {
  return 'EditOrderOpsRequest(reason: $reason, operations: $operations)';
}


}

/// @nodoc
abstract mixin class _$EditOrderOpsRequestCopyWith<$Res> implements $EditOrderOpsRequestCopyWith<$Res> {
  factory _$EditOrderOpsRequestCopyWith(_EditOrderOpsRequest value, $Res Function(_EditOrderOpsRequest) _then) = __$EditOrderOpsRequestCopyWithImpl;
@override @useResult
$Res call({
 String reason, List<EditOperation> operations
});




}
/// @nodoc
class __$EditOrderOpsRequestCopyWithImpl<$Res>
    implements _$EditOrderOpsRequestCopyWith<$Res> {
  __$EditOrderOpsRequestCopyWithImpl(this._self, this._then);

  final _EditOrderOpsRequest _self;
  final $Res Function(_EditOrderOpsRequest) _then;

/// Create a copy of EditOrderOpsRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? reason = null,Object? operations = null,}) {
  return _then(_EditOrderOpsRequest(
reason: null == reason ? _self.reason : reason // ignore: cast_nullable_to_non_nullable
as String,operations: null == operations ? _self._operations : operations // ignore: cast_nullable_to_non_nullable
as List<EditOperation>,
  ));
}


}

EditOperation _$EditOperationFromJson(
  Map<String, dynamic> json
) {
        switch (json['runtimeType']) {
                  case 'add':
          return _EditOperationAdd.fromJson(
            json
          );
                case 'update':
          return _EditOperationUpdate.fromJson(
            json
          );
                case 'remove':
          return _EditOperationRemove.fromJson(
            json
          );
        
          default:
            throw CheckedFromJsonException(
  json,
  'runtimeType',
  'EditOperation',
  'Invalid union type "${json['runtimeType']}"!'
);
        }
      
}

/// @nodoc
mixin _$EditOperation {

 String get op;
/// Create a copy of EditOperation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EditOperationCopyWith<EditOperation> get copyWith => _$EditOperationCopyWithImpl<EditOperation>(this as EditOperation, _$identity);

  /// Serializes this EditOperation to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EditOperation&&(identical(other.op, op) || other.op == op));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,op);

@override
String toString() {
  return 'EditOperation(op: $op)';
}


}

/// @nodoc
abstract mixin class $EditOperationCopyWith<$Res>  {
  factory $EditOperationCopyWith(EditOperation value, $Res Function(EditOperation) _then) = _$EditOperationCopyWithImpl;
@useResult
$Res call({
 String op
});




}
/// @nodoc
class _$EditOperationCopyWithImpl<$Res>
    implements $EditOperationCopyWith<$Res> {
  _$EditOperationCopyWithImpl(this._self, this._then);

  final EditOperation _self;
  final $Res Function(EditOperation) _then;

/// Create a copy of EditOperation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? op = null,}) {
  return _then(_self.copyWith(
op: null == op ? _self.op : op // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [EditOperation].
extension EditOperationPatterns on EditOperation {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>({TResult Function( _EditOperationAdd value)?  add,TResult Function( _EditOperationUpdate value)?  update,TResult Function( _EditOperationRemove value)?  remove,required TResult orElse(),}){
final _that = this;
switch (_that) {
case _EditOperationAdd() when add != null:
return add(_that);case _EditOperationUpdate() when update != null:
return update(_that);case _EditOperationRemove() when remove != null:
return remove(_that);case _:
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

@optionalTypeArgs TResult map<TResult extends Object?>({required TResult Function( _EditOperationAdd value)  add,required TResult Function( _EditOperationUpdate value)  update,required TResult Function( _EditOperationRemove value)  remove,}){
final _that = this;
switch (_that) {
case _EditOperationAdd():
return add(_that);case _EditOperationUpdate():
return update(_that);case _EditOperationRemove():
return remove(_that);case _:
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>({TResult? Function( _EditOperationAdd value)?  add,TResult? Function( _EditOperationUpdate value)?  update,TResult? Function( _EditOperationRemove value)?  remove,}){
final _that = this;
switch (_that) {
case _EditOperationAdd() when add != null:
return add(_that);case _EditOperationUpdate() when update != null:
return update(_that);case _EditOperationRemove() when remove != null:
return remove(_that);case _:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>({TResult Function( String op,  EditAddItem item)?  add,TResult Function( String op,  String itemId,  EditUpdatePatch patch,  bool oos)?  update,TResult Function( String op,  String itemId,  bool oos)?  remove,required TResult orElse(),}) {final _that = this;
switch (_that) {
case _EditOperationAdd() when add != null:
return add(_that.op,_that.item);case _EditOperationUpdate() when update != null:
return update(_that.op,_that.itemId,_that.patch,_that.oos);case _EditOperationRemove() when remove != null:
return remove(_that.op,_that.itemId,_that.oos);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>({required TResult Function( String op,  EditAddItem item)  add,required TResult Function( String op,  String itemId,  EditUpdatePatch patch,  bool oos)  update,required TResult Function( String op,  String itemId,  bool oos)  remove,}) {final _that = this;
switch (_that) {
case _EditOperationAdd():
return add(_that.op,_that.item);case _EditOperationUpdate():
return update(_that.op,_that.itemId,_that.patch,_that.oos);case _EditOperationRemove():
return remove(_that.op,_that.itemId,_that.oos);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>({TResult? Function( String op,  EditAddItem item)?  add,TResult? Function( String op,  String itemId,  EditUpdatePatch patch,  bool oos)?  update,TResult? Function( String op,  String itemId,  bool oos)?  remove,}) {final _that = this;
switch (_that) {
case _EditOperationAdd() when add != null:
return add(_that.op,_that.item);case _EditOperationUpdate() when update != null:
return update(_that.op,_that.itemId,_that.patch,_that.oos);case _EditOperationRemove() when remove != null:
return remove(_that.op,_that.itemId,_that.oos);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _EditOperationAdd implements EditOperation {
   _EditOperationAdd({this.op = 'add', required this.item, final  String? $type}): $type = $type ?? 'add';
  factory _EditOperationAdd.fromJson(Map<String, dynamic> json) => _$EditOperationAddFromJson(json);

@override@JsonKey() final  String op;
 final  EditAddItem item;

@JsonKey(name: 'runtimeType')
final String $type;


/// Create a copy of EditOperation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EditOperationAddCopyWith<_EditOperationAdd> get copyWith => __$EditOperationAddCopyWithImpl<_EditOperationAdd>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EditOperationAddToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EditOperationAdd&&(identical(other.op, op) || other.op == op)&&(identical(other.item, item) || other.item == item));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,op,item);

@override
String toString() {
  return 'EditOperation.add(op: $op, item: $item)';
}


}

/// @nodoc
abstract mixin class _$EditOperationAddCopyWith<$Res> implements $EditOperationCopyWith<$Res> {
  factory _$EditOperationAddCopyWith(_EditOperationAdd value, $Res Function(_EditOperationAdd) _then) = __$EditOperationAddCopyWithImpl;
@override @useResult
$Res call({
 String op, EditAddItem item
});


$EditAddItemCopyWith<$Res> get item;

}
/// @nodoc
class __$EditOperationAddCopyWithImpl<$Res>
    implements _$EditOperationAddCopyWith<$Res> {
  __$EditOperationAddCopyWithImpl(this._self, this._then);

  final _EditOperationAdd _self;
  final $Res Function(_EditOperationAdd) _then;

/// Create a copy of EditOperation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? op = null,Object? item = null,}) {
  return _then(_EditOperationAdd(
op: null == op ? _self.op : op // ignore: cast_nullable_to_non_nullable
as String,item: null == item ? _self.item : item // ignore: cast_nullable_to_non_nullable
as EditAddItem,
  ));
}

/// Create a copy of EditOperation
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$EditAddItemCopyWith<$Res> get item {
  
  return $EditAddItemCopyWith<$Res>(_self.item, (value) {
    return _then(_self.copyWith(item: value));
  });
}
}

/// @nodoc
@JsonSerializable()

class _EditOperationUpdate implements EditOperation {
   _EditOperationUpdate({this.op = 'update', required this.itemId, required this.patch, this.oos = false, final  String? $type}): $type = $type ?? 'update';
  factory _EditOperationUpdate.fromJson(Map<String, dynamic> json) => _$EditOperationUpdateFromJson(json);

@override@JsonKey() final  String op;
 final  String itemId;
 final  EditUpdatePatch patch;
@JsonKey() final  bool oos;

@JsonKey(name: 'runtimeType')
final String $type;


/// Create a copy of EditOperation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EditOperationUpdateCopyWith<_EditOperationUpdate> get copyWith => __$EditOperationUpdateCopyWithImpl<_EditOperationUpdate>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EditOperationUpdateToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EditOperationUpdate&&(identical(other.op, op) || other.op == op)&&(identical(other.itemId, itemId) || other.itemId == itemId)&&(identical(other.patch, patch) || other.patch == patch)&&(identical(other.oos, oos) || other.oos == oos));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,op,itemId,patch,oos);

@override
String toString() {
  return 'EditOperation.update(op: $op, itemId: $itemId, patch: $patch, oos: $oos)';
}


}

/// @nodoc
abstract mixin class _$EditOperationUpdateCopyWith<$Res> implements $EditOperationCopyWith<$Res> {
  factory _$EditOperationUpdateCopyWith(_EditOperationUpdate value, $Res Function(_EditOperationUpdate) _then) = __$EditOperationUpdateCopyWithImpl;
@override @useResult
$Res call({
 String op, String itemId, EditUpdatePatch patch, bool oos
});


$EditUpdatePatchCopyWith<$Res> get patch;

}
/// @nodoc
class __$EditOperationUpdateCopyWithImpl<$Res>
    implements _$EditOperationUpdateCopyWith<$Res> {
  __$EditOperationUpdateCopyWithImpl(this._self, this._then);

  final _EditOperationUpdate _self;
  final $Res Function(_EditOperationUpdate) _then;

/// Create a copy of EditOperation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? op = null,Object? itemId = null,Object? patch = null,Object? oos = null,}) {
  return _then(_EditOperationUpdate(
op: null == op ? _self.op : op // ignore: cast_nullable_to_non_nullable
as String,itemId: null == itemId ? _self.itemId : itemId // ignore: cast_nullable_to_non_nullable
as String,patch: null == patch ? _self.patch : patch // ignore: cast_nullable_to_non_nullable
as EditUpdatePatch,oos: null == oos ? _self.oos : oos // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

/// Create a copy of EditOperation
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$EditUpdatePatchCopyWith<$Res> get patch {
  
  return $EditUpdatePatchCopyWith<$Res>(_self.patch, (value) {
    return _then(_self.copyWith(patch: value));
  });
}
}

/// @nodoc
@JsonSerializable()

class _EditOperationRemove implements EditOperation {
   _EditOperationRemove({this.op = 'remove', required this.itemId, this.oos = false, final  String? $type}): $type = $type ?? 'remove';
  factory _EditOperationRemove.fromJson(Map<String, dynamic> json) => _$EditOperationRemoveFromJson(json);

@override@JsonKey() final  String op;
 final  String itemId;
@JsonKey() final  bool oos;

@JsonKey(name: 'runtimeType')
final String $type;


/// Create a copy of EditOperation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EditOperationRemoveCopyWith<_EditOperationRemove> get copyWith => __$EditOperationRemoveCopyWithImpl<_EditOperationRemove>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EditOperationRemoveToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EditOperationRemove&&(identical(other.op, op) || other.op == op)&&(identical(other.itemId, itemId) || other.itemId == itemId)&&(identical(other.oos, oos) || other.oos == oos));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,op,itemId,oos);

@override
String toString() {
  return 'EditOperation.remove(op: $op, itemId: $itemId, oos: $oos)';
}


}

/// @nodoc
abstract mixin class _$EditOperationRemoveCopyWith<$Res> implements $EditOperationCopyWith<$Res> {
  factory _$EditOperationRemoveCopyWith(_EditOperationRemove value, $Res Function(_EditOperationRemove) _then) = __$EditOperationRemoveCopyWithImpl;
@override @useResult
$Res call({
 String op, String itemId, bool oos
});




}
/// @nodoc
class __$EditOperationRemoveCopyWithImpl<$Res>
    implements _$EditOperationRemoveCopyWith<$Res> {
  __$EditOperationRemoveCopyWithImpl(this._self, this._then);

  final _EditOperationRemove _self;
  final $Res Function(_EditOperationRemove) _then;

/// Create a copy of EditOperation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? op = null,Object? itemId = null,Object? oos = null,}) {
  return _then(_EditOperationRemove(
op: null == op ? _self.op : op // ignore: cast_nullable_to_non_nullable
as String,itemId: null == itemId ? _self.itemId : itemId // ignore: cast_nullable_to_non_nullable
as String,oos: null == oos ? _self.oos : oos // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$EditAddItem {

 String get menuItem; int get quantity; List<SelectedAddon> get selectedAddons; List<SelectedTopping> get selectedToppings; String get notes;@JsonKey(name: 'dineType') String get dineType;
/// Create a copy of EditAddItem
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EditAddItemCopyWith<EditAddItem> get copyWith => _$EditAddItemCopyWithImpl<EditAddItem>(this as EditAddItem, _$identity);

  /// Serializes this EditAddItem to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EditAddItem&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&const DeepCollectionEquality().equals(other.selectedAddons, selectedAddons)&&const DeepCollectionEquality().equals(other.selectedToppings, selectedToppings)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.dineType, dineType) || other.dineType == dineType));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,quantity,const DeepCollectionEquality().hash(selectedAddons),const DeepCollectionEquality().hash(selectedToppings),notes,dineType);

@override
String toString() {
  return 'EditAddItem(menuItem: $menuItem, quantity: $quantity, selectedAddons: $selectedAddons, selectedToppings: $selectedToppings, notes: $notes, dineType: $dineType)';
}


}

/// @nodoc
abstract mixin class $EditAddItemCopyWith<$Res>  {
  factory $EditAddItemCopyWith(EditAddItem value, $Res Function(EditAddItem) _then) = _$EditAddItemCopyWithImpl;
@useResult
$Res call({
 String menuItem, int quantity, List<SelectedAddon> selectedAddons, List<SelectedTopping> selectedToppings, String notes,@JsonKey(name: 'dineType') String dineType
});




}
/// @nodoc
class _$EditAddItemCopyWithImpl<$Res>
    implements $EditAddItemCopyWith<$Res> {
  _$EditAddItemCopyWithImpl(this._self, this._then);

  final EditAddItem _self;
  final $Res Function(EditAddItem) _then;

/// Create a copy of EditAddItem
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? menuItem = null,Object? quantity = null,Object? selectedAddons = null,Object? selectedToppings = null,Object? notes = null,Object? dineType = null,}) {
  return _then(_self.copyWith(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,selectedAddons: null == selectedAddons ? _self.selectedAddons : selectedAddons // ignore: cast_nullable_to_non_nullable
as List<SelectedAddon>,selectedToppings: null == selectedToppings ? _self.selectedToppings : selectedToppings // ignore: cast_nullable_to_non_nullable
as List<SelectedTopping>,notes: null == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String,dineType: null == dineType ? _self.dineType : dineType // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [EditAddItem].
extension EditAddItemPatterns on EditAddItem {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _EditAddItem value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _EditAddItem() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _EditAddItem value)  $default,){
final _that = this;
switch (_that) {
case _EditAddItem():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _EditAddItem value)?  $default,){
final _that = this;
switch (_that) {
case _EditAddItem() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String menuItem,  int quantity,  List<SelectedAddon> selectedAddons,  List<SelectedTopping> selectedToppings,  String notes, @JsonKey(name: 'dineType')  String dineType)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _EditAddItem() when $default != null:
return $default(_that.menuItem,_that.quantity,_that.selectedAddons,_that.selectedToppings,_that.notes,_that.dineType);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String menuItem,  int quantity,  List<SelectedAddon> selectedAddons,  List<SelectedTopping> selectedToppings,  String notes, @JsonKey(name: 'dineType')  String dineType)  $default,) {final _that = this;
switch (_that) {
case _EditAddItem():
return $default(_that.menuItem,_that.quantity,_that.selectedAddons,_that.selectedToppings,_that.notes,_that.dineType);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String menuItem,  int quantity,  List<SelectedAddon> selectedAddons,  List<SelectedTopping> selectedToppings,  String notes, @JsonKey(name: 'dineType')  String dineType)?  $default,) {final _that = this;
switch (_that) {
case _EditAddItem() when $default != null:
return $default(_that.menuItem,_that.quantity,_that.selectedAddons,_that.selectedToppings,_that.notes,_that.dineType);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _EditAddItem implements EditAddItem {
   _EditAddItem({required this.menuItem, this.quantity = 1, final  List<SelectedAddon> selectedAddons = const [], final  List<SelectedTopping> selectedToppings = const [], this.notes = '', @JsonKey(name: 'dineType') this.dineType = 'Dine-In'}): _selectedAddons = selectedAddons,_selectedToppings = selectedToppings;
  factory _EditAddItem.fromJson(Map<String, dynamic> json) => _$EditAddItemFromJson(json);

@override final  String menuItem;
@override@JsonKey() final  int quantity;
 final  List<SelectedAddon> _selectedAddons;
@override@JsonKey() List<SelectedAddon> get selectedAddons {
  if (_selectedAddons is EqualUnmodifiableListView) return _selectedAddons;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_selectedAddons);
}

 final  List<SelectedTopping> _selectedToppings;
@override@JsonKey() List<SelectedTopping> get selectedToppings {
  if (_selectedToppings is EqualUnmodifiableListView) return _selectedToppings;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_selectedToppings);
}

@override@JsonKey() final  String notes;
@override@JsonKey(name: 'dineType') final  String dineType;

/// Create a copy of EditAddItem
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EditAddItemCopyWith<_EditAddItem> get copyWith => __$EditAddItemCopyWithImpl<_EditAddItem>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EditAddItemToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EditAddItem&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&const DeepCollectionEquality().equals(other._selectedAddons, _selectedAddons)&&const DeepCollectionEquality().equals(other._selectedToppings, _selectedToppings)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.dineType, dineType) || other.dineType == dineType));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,quantity,const DeepCollectionEquality().hash(_selectedAddons),const DeepCollectionEquality().hash(_selectedToppings),notes,dineType);

@override
String toString() {
  return 'EditAddItem(menuItem: $menuItem, quantity: $quantity, selectedAddons: $selectedAddons, selectedToppings: $selectedToppings, notes: $notes, dineType: $dineType)';
}


}

/// @nodoc
abstract mixin class _$EditAddItemCopyWith<$Res> implements $EditAddItemCopyWith<$Res> {
  factory _$EditAddItemCopyWith(_EditAddItem value, $Res Function(_EditAddItem) _then) = __$EditAddItemCopyWithImpl;
@override @useResult
$Res call({
 String menuItem, int quantity, List<SelectedAddon> selectedAddons, List<SelectedTopping> selectedToppings, String notes,@JsonKey(name: 'dineType') String dineType
});




}
/// @nodoc
class __$EditAddItemCopyWithImpl<$Res>
    implements _$EditAddItemCopyWith<$Res> {
  __$EditAddItemCopyWithImpl(this._self, this._then);

  final _EditAddItem _self;
  final $Res Function(_EditAddItem) _then;

/// Create a copy of EditAddItem
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? menuItem = null,Object? quantity = null,Object? selectedAddons = null,Object? selectedToppings = null,Object? notes = null,Object? dineType = null,}) {
  return _then(_EditAddItem(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,selectedAddons: null == selectedAddons ? _self._selectedAddons : selectedAddons // ignore: cast_nullable_to_non_nullable
as List<SelectedAddon>,selectedToppings: null == selectedToppings ? _self._selectedToppings : selectedToppings // ignore: cast_nullable_to_non_nullable
as List<SelectedTopping>,notes: null == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String,dineType: null == dineType ? _self.dineType : dineType // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$EditUpdatePatch {

 int? get quantity; String? get notes; String? get dineType; List<SelectedAddon>? get selectedAddons; List<SelectedTopping>? get selectedToppings;
/// Create a copy of EditUpdatePatch
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EditUpdatePatchCopyWith<EditUpdatePatch> get copyWith => _$EditUpdatePatchCopyWithImpl<EditUpdatePatch>(this as EditUpdatePatch, _$identity);

  /// Serializes this EditUpdatePatch to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EditUpdatePatch&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.dineType, dineType) || other.dineType == dineType)&&const DeepCollectionEquality().equals(other.selectedAddons, selectedAddons)&&const DeepCollectionEquality().equals(other.selectedToppings, selectedToppings));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,quantity,notes,dineType,const DeepCollectionEquality().hash(selectedAddons),const DeepCollectionEquality().hash(selectedToppings));

@override
String toString() {
  return 'EditUpdatePatch(quantity: $quantity, notes: $notes, dineType: $dineType, selectedAddons: $selectedAddons, selectedToppings: $selectedToppings)';
}


}

/// @nodoc
abstract mixin class $EditUpdatePatchCopyWith<$Res>  {
  factory $EditUpdatePatchCopyWith(EditUpdatePatch value, $Res Function(EditUpdatePatch) _then) = _$EditUpdatePatchCopyWithImpl;
@useResult
$Res call({
 int? quantity, String? notes, String? dineType, List<SelectedAddon>? selectedAddons, List<SelectedTopping>? selectedToppings
});




}
/// @nodoc
class _$EditUpdatePatchCopyWithImpl<$Res>
    implements $EditUpdatePatchCopyWith<$Res> {
  _$EditUpdatePatchCopyWithImpl(this._self, this._then);

  final EditUpdatePatch _self;
  final $Res Function(EditUpdatePatch) _then;

/// Create a copy of EditUpdatePatch
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? quantity = freezed,Object? notes = freezed,Object? dineType = freezed,Object? selectedAddons = freezed,Object? selectedToppings = freezed,}) {
  return _then(_self.copyWith(
quantity: freezed == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int?,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,dineType: freezed == dineType ? _self.dineType : dineType // ignore: cast_nullable_to_non_nullable
as String?,selectedAddons: freezed == selectedAddons ? _self.selectedAddons : selectedAddons // ignore: cast_nullable_to_non_nullable
as List<SelectedAddon>?,selectedToppings: freezed == selectedToppings ? _self.selectedToppings : selectedToppings // ignore: cast_nullable_to_non_nullable
as List<SelectedTopping>?,
  ));
}

}


/// Adds pattern-matching-related methods to [EditUpdatePatch].
extension EditUpdatePatchPatterns on EditUpdatePatch {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _EditUpdatePatch value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _EditUpdatePatch() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _EditUpdatePatch value)  $default,){
final _that = this;
switch (_that) {
case _EditUpdatePatch():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _EditUpdatePatch value)?  $default,){
final _that = this;
switch (_that) {
case _EditUpdatePatch() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int? quantity,  String? notes,  String? dineType,  List<SelectedAddon>? selectedAddons,  List<SelectedTopping>? selectedToppings)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _EditUpdatePatch() when $default != null:
return $default(_that.quantity,_that.notes,_that.dineType,_that.selectedAddons,_that.selectedToppings);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int? quantity,  String? notes,  String? dineType,  List<SelectedAddon>? selectedAddons,  List<SelectedTopping>? selectedToppings)  $default,) {final _that = this;
switch (_that) {
case _EditUpdatePatch():
return $default(_that.quantity,_that.notes,_that.dineType,_that.selectedAddons,_that.selectedToppings);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int? quantity,  String? notes,  String? dineType,  List<SelectedAddon>? selectedAddons,  List<SelectedTopping>? selectedToppings)?  $default,) {final _that = this;
switch (_that) {
case _EditUpdatePatch() when $default != null:
return $default(_that.quantity,_that.notes,_that.dineType,_that.selectedAddons,_that.selectedToppings);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _EditUpdatePatch implements EditUpdatePatch {
   _EditUpdatePatch({this.quantity, this.notes, this.dineType, final  List<SelectedAddon>? selectedAddons, final  List<SelectedTopping>? selectedToppings}): _selectedAddons = selectedAddons,_selectedToppings = selectedToppings;
  factory _EditUpdatePatch.fromJson(Map<String, dynamic> json) => _$EditUpdatePatchFromJson(json);

@override final  int? quantity;
@override final  String? notes;
@override final  String? dineType;
 final  List<SelectedAddon>? _selectedAddons;
@override List<SelectedAddon>? get selectedAddons {
  final value = _selectedAddons;
  if (value == null) return null;
  if (_selectedAddons is EqualUnmodifiableListView) return _selectedAddons;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

 final  List<SelectedTopping>? _selectedToppings;
@override List<SelectedTopping>? get selectedToppings {
  final value = _selectedToppings;
  if (value == null) return null;
  if (_selectedToppings is EqualUnmodifiableListView) return _selectedToppings;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}


/// Create a copy of EditUpdatePatch
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EditUpdatePatchCopyWith<_EditUpdatePatch> get copyWith => __$EditUpdatePatchCopyWithImpl<_EditUpdatePatch>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EditUpdatePatchToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EditUpdatePatch&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.dineType, dineType) || other.dineType == dineType)&&const DeepCollectionEquality().equals(other._selectedAddons, _selectedAddons)&&const DeepCollectionEquality().equals(other._selectedToppings, _selectedToppings));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,quantity,notes,dineType,const DeepCollectionEquality().hash(_selectedAddons),const DeepCollectionEquality().hash(_selectedToppings));

@override
String toString() {
  return 'EditUpdatePatch(quantity: $quantity, notes: $notes, dineType: $dineType, selectedAddons: $selectedAddons, selectedToppings: $selectedToppings)';
}


}

/// @nodoc
abstract mixin class _$EditUpdatePatchCopyWith<$Res> implements $EditUpdatePatchCopyWith<$Res> {
  factory _$EditUpdatePatchCopyWith(_EditUpdatePatch value, $Res Function(_EditUpdatePatch) _then) = __$EditUpdatePatchCopyWithImpl;
@override @useResult
$Res call({
 int? quantity, String? notes, String? dineType, List<SelectedAddon>? selectedAddons, List<SelectedTopping>? selectedToppings
});




}
/// @nodoc
class __$EditUpdatePatchCopyWithImpl<$Res>
    implements _$EditUpdatePatchCopyWith<$Res> {
  __$EditUpdatePatchCopyWithImpl(this._self, this._then);

  final _EditUpdatePatch _self;
  final $Res Function(_EditUpdatePatch) _then;

/// Create a copy of EditUpdatePatch
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? quantity = freezed,Object? notes = freezed,Object? dineType = freezed,Object? selectedAddons = freezed,Object? selectedToppings = freezed,}) {
  return _then(_EditUpdatePatch(
quantity: freezed == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int?,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,dineType: freezed == dineType ? _self.dineType : dineType // ignore: cast_nullable_to_non_nullable
as String?,selectedAddons: freezed == selectedAddons ? _self._selectedAddons : selectedAddons // ignore: cast_nullable_to_non_nullable
as List<SelectedAddon>?,selectedToppings: freezed == selectedToppings ? _self._selectedToppings : selectedToppings // ignore: cast_nullable_to_non_nullable
as List<SelectedTopping>?,
  ));
}


}


/// @nodoc
mixin _$SelectedAddon {

 String get id;// addonId
 List<SelectedAddonOption> get options;
/// Create a copy of SelectedAddon
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SelectedAddonCopyWith<SelectedAddon> get copyWith => _$SelectedAddonCopyWithImpl<SelectedAddon>(this as SelectedAddon, _$identity);

  /// Serializes this SelectedAddon to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SelectedAddon&&(identical(other.id, id) || other.id == id)&&const DeepCollectionEquality().equals(other.options, options));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,const DeepCollectionEquality().hash(options));

@override
String toString() {
  return 'SelectedAddon(id: $id, options: $options)';
}


}

/// @nodoc
abstract mixin class $SelectedAddonCopyWith<$Res>  {
  factory $SelectedAddonCopyWith(SelectedAddon value, $Res Function(SelectedAddon) _then) = _$SelectedAddonCopyWithImpl;
@useResult
$Res call({
 String id, List<SelectedAddonOption> options
});




}
/// @nodoc
class _$SelectedAddonCopyWithImpl<$Res>
    implements $SelectedAddonCopyWith<$Res> {
  _$SelectedAddonCopyWithImpl(this._self, this._then);

  final SelectedAddon _self;
  final $Res Function(SelectedAddon) _then;

/// Create a copy of SelectedAddon
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? options = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,options: null == options ? _self.options : options // ignore: cast_nullable_to_non_nullable
as List<SelectedAddonOption>,
  ));
}

}


/// Adds pattern-matching-related methods to [SelectedAddon].
extension SelectedAddonPatterns on SelectedAddon {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SelectedAddon value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SelectedAddon() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SelectedAddon value)  $default,){
final _that = this;
switch (_that) {
case _SelectedAddon():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SelectedAddon value)?  $default,){
final _that = this;
switch (_that) {
case _SelectedAddon() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  List<SelectedAddonOption> options)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SelectedAddon() when $default != null:
return $default(_that.id,_that.options);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  List<SelectedAddonOption> options)  $default,) {final _that = this;
switch (_that) {
case _SelectedAddon():
return $default(_that.id,_that.options);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  List<SelectedAddonOption> options)?  $default,) {final _that = this;
switch (_that) {
case _SelectedAddon() when $default != null:
return $default(_that.id,_that.options);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SelectedAddon implements SelectedAddon {
   _SelectedAddon({required this.id, final  List<SelectedAddonOption> options = const []}): _options = options;
  factory _SelectedAddon.fromJson(Map<String, dynamic> json) => _$SelectedAddonFromJson(json);

@override final  String id;
// addonId
 final  List<SelectedAddonOption> _options;
// addonId
@override@JsonKey() List<SelectedAddonOption> get options {
  if (_options is EqualUnmodifiableListView) return _options;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_options);
}


/// Create a copy of SelectedAddon
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SelectedAddonCopyWith<_SelectedAddon> get copyWith => __$SelectedAddonCopyWithImpl<_SelectedAddon>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SelectedAddonToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SelectedAddon&&(identical(other.id, id) || other.id == id)&&const DeepCollectionEquality().equals(other._options, _options));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,const DeepCollectionEquality().hash(_options));

@override
String toString() {
  return 'SelectedAddon(id: $id, options: $options)';
}


}

/// @nodoc
abstract mixin class _$SelectedAddonCopyWith<$Res> implements $SelectedAddonCopyWith<$Res> {
  factory _$SelectedAddonCopyWith(_SelectedAddon value, $Res Function(_SelectedAddon) _then) = __$SelectedAddonCopyWithImpl;
@override @useResult
$Res call({
 String id, List<SelectedAddonOption> options
});




}
/// @nodoc
class __$SelectedAddonCopyWithImpl<$Res>
    implements _$SelectedAddonCopyWith<$Res> {
  __$SelectedAddonCopyWithImpl(this._self, this._then);

  final _SelectedAddon _self;
  final $Res Function(_SelectedAddon) _then;

/// Create a copy of SelectedAddon
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? options = null,}) {
  return _then(_SelectedAddon(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,options: null == options ? _self._options : options // ignore: cast_nullable_to_non_nullable
as List<SelectedAddonOption>,
  ));
}


}


/// @nodoc
mixin _$SelectedAddonOption {

 String get id;
/// Create a copy of SelectedAddonOption
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SelectedAddonOptionCopyWith<SelectedAddonOption> get copyWith => _$SelectedAddonOptionCopyWithImpl<SelectedAddonOption>(this as SelectedAddonOption, _$identity);

  /// Serializes this SelectedAddonOption to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SelectedAddonOption&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id);

@override
String toString() {
  return 'SelectedAddonOption(id: $id)';
}


}

/// @nodoc
abstract mixin class $SelectedAddonOptionCopyWith<$Res>  {
  factory $SelectedAddonOptionCopyWith(SelectedAddonOption value, $Res Function(SelectedAddonOption) _then) = _$SelectedAddonOptionCopyWithImpl;
@useResult
$Res call({
 String id
});




}
/// @nodoc
class _$SelectedAddonOptionCopyWithImpl<$Res>
    implements $SelectedAddonOptionCopyWith<$Res> {
  _$SelectedAddonOptionCopyWithImpl(this._self, this._then);

  final SelectedAddonOption _self;
  final $Res Function(SelectedAddonOption) _then;

/// Create a copy of SelectedAddonOption
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [SelectedAddonOption].
extension SelectedAddonOptionPatterns on SelectedAddonOption {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SelectedAddonOption value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SelectedAddonOption() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SelectedAddonOption value)  $default,){
final _that = this;
switch (_that) {
case _SelectedAddonOption():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SelectedAddonOption value)?  $default,){
final _that = this;
switch (_that) {
case _SelectedAddonOption() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SelectedAddonOption() when $default != null:
return $default(_that.id);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id)  $default,) {final _that = this;
switch (_that) {
case _SelectedAddonOption():
return $default(_that.id);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id)?  $default,) {final _that = this;
switch (_that) {
case _SelectedAddonOption() when $default != null:
return $default(_that.id);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SelectedAddonOption implements SelectedAddonOption {
   _SelectedAddonOption({required this.id});
  factory _SelectedAddonOption.fromJson(Map<String, dynamic> json) => _$SelectedAddonOptionFromJson(json);

@override final  String id;

/// Create a copy of SelectedAddonOption
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SelectedAddonOptionCopyWith<_SelectedAddonOption> get copyWith => __$SelectedAddonOptionCopyWithImpl<_SelectedAddonOption>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SelectedAddonOptionToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SelectedAddonOption&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id);

@override
String toString() {
  return 'SelectedAddonOption(id: $id)';
}


}

/// @nodoc
abstract mixin class _$SelectedAddonOptionCopyWith<$Res> implements $SelectedAddonOptionCopyWith<$Res> {
  factory _$SelectedAddonOptionCopyWith(_SelectedAddonOption value, $Res Function(_SelectedAddonOption) _then) = __$SelectedAddonOptionCopyWithImpl;
@override @useResult
$Res call({
 String id
});




}
/// @nodoc
class __$SelectedAddonOptionCopyWithImpl<$Res>
    implements _$SelectedAddonOptionCopyWith<$Res> {
  __$SelectedAddonOptionCopyWithImpl(this._self, this._then);

  final _SelectedAddonOption _self;
  final $Res Function(_SelectedAddonOption) _then;

/// Create a copy of SelectedAddonOption
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,}) {
  return _then(_SelectedAddonOption(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$SelectedTopping {

 String get id;
/// Create a copy of SelectedTopping
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SelectedToppingCopyWith<SelectedTopping> get copyWith => _$SelectedToppingCopyWithImpl<SelectedTopping>(this as SelectedTopping, _$identity);

  /// Serializes this SelectedTopping to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SelectedTopping&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id);

@override
String toString() {
  return 'SelectedTopping(id: $id)';
}


}

/// @nodoc
abstract mixin class $SelectedToppingCopyWith<$Res>  {
  factory $SelectedToppingCopyWith(SelectedTopping value, $Res Function(SelectedTopping) _then) = _$SelectedToppingCopyWithImpl;
@useResult
$Res call({
 String id
});




}
/// @nodoc
class _$SelectedToppingCopyWithImpl<$Res>
    implements $SelectedToppingCopyWith<$Res> {
  _$SelectedToppingCopyWithImpl(this._self, this._then);

  final SelectedTopping _self;
  final $Res Function(SelectedTopping) _then;

/// Create a copy of SelectedTopping
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [SelectedTopping].
extension SelectedToppingPatterns on SelectedTopping {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SelectedTopping value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SelectedTopping() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SelectedTopping value)  $default,){
final _that = this;
switch (_that) {
case _SelectedTopping():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SelectedTopping value)?  $default,){
final _that = this;
switch (_that) {
case _SelectedTopping() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SelectedTopping() when $default != null:
return $default(_that.id);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id)  $default,) {final _that = this;
switch (_that) {
case _SelectedTopping():
return $default(_that.id);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id)?  $default,) {final _that = this;
switch (_that) {
case _SelectedTopping() when $default != null:
return $default(_that.id);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SelectedTopping implements SelectedTopping {
   _SelectedTopping({required this.id});
  factory _SelectedTopping.fromJson(Map<String, dynamic> json) => _$SelectedToppingFromJson(json);

@override final  String id;

/// Create a copy of SelectedTopping
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SelectedToppingCopyWith<_SelectedTopping> get copyWith => __$SelectedToppingCopyWithImpl<_SelectedTopping>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SelectedToppingToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SelectedTopping&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id);

@override
String toString() {
  return 'SelectedTopping(id: $id)';
}


}

/// @nodoc
abstract mixin class _$SelectedToppingCopyWith<$Res> implements $SelectedToppingCopyWith<$Res> {
  factory _$SelectedToppingCopyWith(_SelectedTopping value, $Res Function(_SelectedTopping) _then) = __$SelectedToppingCopyWithImpl;
@override @useResult
$Res call({
 String id
});




}
/// @nodoc
class __$SelectedToppingCopyWithImpl<$Res>
    implements _$SelectedToppingCopyWith<$Res> {
  __$SelectedToppingCopyWithImpl(this._self, this._then);

  final _SelectedTopping _self;
  final $Res Function(_SelectedTopping) _then;

/// Create a copy of SelectedTopping
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,}) {
  return _then(_SelectedTopping(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
