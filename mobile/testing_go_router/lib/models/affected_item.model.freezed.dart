// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'affected_item.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AffectedItemModel {

@HiveField(0) String get menuItem;@HiveField(1) String get menuItemName;@HiveField(2) int get quantity;@HiveField(3) int get originalSubtotal;@HiveField(4) int get discountAmount;@HiveField(5) int get discountedSubtotal;@HiveField(6) int? get discountPercentage;@HiveField(7)@JsonKey(name: '_id') String? get id;
/// Create a copy of AffectedItemModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AffectedItemModelCopyWith<AffectedItemModel> get copyWith => _$AffectedItemModelCopyWithImpl<AffectedItemModel>(this as AffectedItemModel, _$identity);

  /// Serializes this AffectedItemModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AffectedItemModel&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.menuItemName, menuItemName) || other.menuItemName == menuItemName)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.originalSubtotal, originalSubtotal) || other.originalSubtotal == originalSubtotal)&&(identical(other.discountAmount, discountAmount) || other.discountAmount == discountAmount)&&(identical(other.discountedSubtotal, discountedSubtotal) || other.discountedSubtotal == discountedSubtotal)&&(identical(other.discountPercentage, discountPercentage) || other.discountPercentage == discountPercentage)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,menuItemName,quantity,originalSubtotal,discountAmount,discountedSubtotal,discountPercentage,id);

@override
String toString() {
  return 'AffectedItemModel(menuItem: $menuItem, menuItemName: $menuItemName, quantity: $quantity, originalSubtotal: $originalSubtotal, discountAmount: $discountAmount, discountedSubtotal: $discountedSubtotal, discountPercentage: $discountPercentage, id: $id)';
}


}

/// @nodoc
abstract mixin class $AffectedItemModelCopyWith<$Res>  {
  factory $AffectedItemModelCopyWith(AffectedItemModel value, $Res Function(AffectedItemModel) _then) = _$AffectedItemModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String menuItem,@HiveField(1) String menuItemName,@HiveField(2) int quantity,@HiveField(3) int originalSubtotal,@HiveField(4) int discountAmount,@HiveField(5) int discountedSubtotal,@HiveField(6) int? discountPercentage,@HiveField(7)@JsonKey(name: '_id') String? id
});




}
/// @nodoc
class _$AffectedItemModelCopyWithImpl<$Res>
    implements $AffectedItemModelCopyWith<$Res> {
  _$AffectedItemModelCopyWithImpl(this._self, this._then);

  final AffectedItemModel _self;
  final $Res Function(AffectedItemModel) _then;

/// Create a copy of AffectedItemModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? menuItem = null,Object? menuItemName = null,Object? quantity = null,Object? originalSubtotal = null,Object? discountAmount = null,Object? discountedSubtotal = null,Object? discountPercentage = freezed,Object? id = freezed,}) {
  return _then(_self.copyWith(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,menuItemName: null == menuItemName ? _self.menuItemName : menuItemName // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,originalSubtotal: null == originalSubtotal ? _self.originalSubtotal : originalSubtotal // ignore: cast_nullable_to_non_nullable
as int,discountAmount: null == discountAmount ? _self.discountAmount : discountAmount // ignore: cast_nullable_to_non_nullable
as int,discountedSubtotal: null == discountedSubtotal ? _self.discountedSubtotal : discountedSubtotal // ignore: cast_nullable_to_non_nullable
as int,discountPercentage: freezed == discountPercentage ? _self.discountPercentage : discountPercentage // ignore: cast_nullable_to_non_nullable
as int?,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [AffectedItemModel].
extension AffectedItemModelPatterns on AffectedItemModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AffectedItemModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AffectedItemModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AffectedItemModel value)  $default,){
final _that = this;
switch (_that) {
case _AffectedItemModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AffectedItemModel value)?  $default,){
final _that = this;
switch (_that) {
case _AffectedItemModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String menuItem, @HiveField(1)  String menuItemName, @HiveField(2)  int quantity, @HiveField(3)  int originalSubtotal, @HiveField(4)  int discountAmount, @HiveField(5)  int discountedSubtotal, @HiveField(6)  int? discountPercentage, @HiveField(7)@JsonKey(name: '_id')  String? id)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AffectedItemModel() when $default != null:
return $default(_that.menuItem,_that.menuItemName,_that.quantity,_that.originalSubtotal,_that.discountAmount,_that.discountedSubtotal,_that.discountPercentage,_that.id);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String menuItem, @HiveField(1)  String menuItemName, @HiveField(2)  int quantity, @HiveField(3)  int originalSubtotal, @HiveField(4)  int discountAmount, @HiveField(5)  int discountedSubtotal, @HiveField(6)  int? discountPercentage, @HiveField(7)@JsonKey(name: '_id')  String? id)  $default,) {final _that = this;
switch (_that) {
case _AffectedItemModel():
return $default(_that.menuItem,_that.menuItemName,_that.quantity,_that.originalSubtotal,_that.discountAmount,_that.discountedSubtotal,_that.discountPercentage,_that.id);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String menuItem, @HiveField(1)  String menuItemName, @HiveField(2)  int quantity, @HiveField(3)  int originalSubtotal, @HiveField(4)  int discountAmount, @HiveField(5)  int discountedSubtotal, @HiveField(6)  int? discountPercentage, @HiveField(7)@JsonKey(name: '_id')  String? id)?  $default,) {final _that = this;
switch (_that) {
case _AffectedItemModel() when $default != null:
return $default(_that.menuItem,_that.menuItemName,_that.quantity,_that.originalSubtotal,_that.discountAmount,_that.discountedSubtotal,_that.discountPercentage,_that.id);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AffectedItemModel implements AffectedItemModel {
   _AffectedItemModel({@HiveField(0) required this.menuItem, @HiveField(1) required this.menuItemName, @HiveField(2) required this.quantity, @HiveField(3) required this.originalSubtotal, @HiveField(4) required this.discountAmount, @HiveField(5) required this.discountedSubtotal, @HiveField(6) this.discountPercentage = 0, @HiveField(7)@JsonKey(name: '_id') this.id = null});
  factory _AffectedItemModel.fromJson(Map<String, dynamic> json) => _$AffectedItemModelFromJson(json);

@override@HiveField(0) final  String menuItem;
@override@HiveField(1) final  String menuItemName;
@override@HiveField(2) final  int quantity;
@override@HiveField(3) final  int originalSubtotal;
@override@HiveField(4) final  int discountAmount;
@override@HiveField(5) final  int discountedSubtotal;
@override@JsonKey()@HiveField(6) final  int? discountPercentage;
@override@HiveField(7)@JsonKey(name: '_id') final  String? id;

/// Create a copy of AffectedItemModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AffectedItemModelCopyWith<_AffectedItemModel> get copyWith => __$AffectedItemModelCopyWithImpl<_AffectedItemModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AffectedItemModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AffectedItemModel&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.menuItemName, menuItemName) || other.menuItemName == menuItemName)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.originalSubtotal, originalSubtotal) || other.originalSubtotal == originalSubtotal)&&(identical(other.discountAmount, discountAmount) || other.discountAmount == discountAmount)&&(identical(other.discountedSubtotal, discountedSubtotal) || other.discountedSubtotal == discountedSubtotal)&&(identical(other.discountPercentage, discountPercentage) || other.discountPercentage == discountPercentage)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,menuItemName,quantity,originalSubtotal,discountAmount,discountedSubtotal,discountPercentage,id);

@override
String toString() {
  return 'AffectedItemModel(menuItem: $menuItem, menuItemName: $menuItemName, quantity: $quantity, originalSubtotal: $originalSubtotal, discountAmount: $discountAmount, discountedSubtotal: $discountedSubtotal, discountPercentage: $discountPercentage, id: $id)';
}


}

/// @nodoc
abstract mixin class _$AffectedItemModelCopyWith<$Res> implements $AffectedItemModelCopyWith<$Res> {
  factory _$AffectedItemModelCopyWith(_AffectedItemModel value, $Res Function(_AffectedItemModel) _then) = __$AffectedItemModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String menuItem,@HiveField(1) String menuItemName,@HiveField(2) int quantity,@HiveField(3) int originalSubtotal,@HiveField(4) int discountAmount,@HiveField(5) int discountedSubtotal,@HiveField(6) int? discountPercentage,@HiveField(7)@JsonKey(name: '_id') String? id
});




}
/// @nodoc
class __$AffectedItemModelCopyWithImpl<$Res>
    implements _$AffectedItemModelCopyWith<$Res> {
  __$AffectedItemModelCopyWithImpl(this._self, this._then);

  final _AffectedItemModel _self;
  final $Res Function(_AffectedItemModel) _then;

/// Create a copy of AffectedItemModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? menuItem = null,Object? menuItemName = null,Object? quantity = null,Object? originalSubtotal = null,Object? discountAmount = null,Object? discountedSubtotal = null,Object? discountPercentage = freezed,Object? id = freezed,}) {
  return _then(_AffectedItemModel(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,menuItemName: null == menuItemName ? _self.menuItemName : menuItemName // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,originalSubtotal: null == originalSubtotal ? _self.originalSubtotal : originalSubtotal // ignore: cast_nullable_to_non_nullable
as int,discountAmount: null == discountAmount ? _self.discountAmount : discountAmount // ignore: cast_nullable_to_non_nullable
as int,discountedSubtotal: null == discountedSubtotal ? _self.discountedSubtotal : discountedSubtotal // ignore: cast_nullable_to_non_nullable
as int,discountPercentage: freezed == discountPercentage ? _self.discountPercentage : discountPercentage // ignore: cast_nullable_to_non_nullable
as int?,id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
