// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'free_item.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$FreeItemModel {

// Sesuaikan fields sesuai dengan struktur freeItemModels yang sebenarnya
@HiveField(0) String get menuItem;@HiveField(1) String get menuItemName;@HiveField(2) int get quantity;@HiveField(3) String get id;
/// Create a copy of FreeItemModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FreeItemModelCopyWith<FreeItemModel> get copyWith => _$FreeItemModelCopyWithImpl<FreeItemModel>(this as FreeItemModel, _$identity);

  /// Serializes this FreeItemModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FreeItemModel&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.menuItemName, menuItemName) || other.menuItemName == menuItemName)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,menuItemName,quantity,id);

@override
String toString() {
  return 'FreeItemModel(menuItem: $menuItem, menuItemName: $menuItemName, quantity: $quantity, id: $id)';
}


}

/// @nodoc
abstract mixin class $FreeItemModelCopyWith<$Res>  {
  factory $FreeItemModelCopyWith(FreeItemModel value, $Res Function(FreeItemModel) _then) = _$FreeItemModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String menuItem,@HiveField(1) String menuItemName,@HiveField(2) int quantity,@HiveField(3) String id
});




}
/// @nodoc
class _$FreeItemModelCopyWithImpl<$Res>
    implements $FreeItemModelCopyWith<$Res> {
  _$FreeItemModelCopyWithImpl(this._self, this._then);

  final FreeItemModel _self;
  final $Res Function(FreeItemModel) _then;

/// Create a copy of FreeItemModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? menuItem = null,Object? menuItemName = null,Object? quantity = null,Object? id = null,}) {
  return _then(_self.copyWith(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,menuItemName: null == menuItemName ? _self.menuItemName : menuItemName // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _FreeItemModel implements FreeItemModel {
   _FreeItemModel({@HiveField(0) required this.menuItem, @HiveField(1) required this.menuItemName, @HiveField(2) required this.quantity, @HiveField(3) required this.id});
  factory _FreeItemModel.fromJson(Map<String, dynamic> json) => _$FreeItemModelFromJson(json);

// Sesuaikan fields sesuai dengan struktur freeItemModels yang sebenarnya
@override@HiveField(0) final  String menuItem;
@override@HiveField(1) final  String menuItemName;
@override@HiveField(2) final  int quantity;
@override@HiveField(3) final  String id;

/// Create a copy of FreeItemModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FreeItemModelCopyWith<_FreeItemModel> get copyWith => __$FreeItemModelCopyWithImpl<_FreeItemModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FreeItemModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _FreeItemModel&&(identical(other.menuItem, menuItem) || other.menuItem == menuItem)&&(identical(other.menuItemName, menuItemName) || other.menuItemName == menuItemName)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.id, id) || other.id == id));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItem,menuItemName,quantity,id);

@override
String toString() {
  return 'FreeItemModel(menuItem: $menuItem, menuItemName: $menuItemName, quantity: $quantity, id: $id)';
}


}

/// @nodoc
abstract mixin class _$FreeItemModelCopyWith<$Res> implements $FreeItemModelCopyWith<$Res> {
  factory _$FreeItemModelCopyWith(_FreeItemModel value, $Res Function(_FreeItemModel) _then) = __$FreeItemModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String menuItem,@HiveField(1) String menuItemName,@HiveField(2) int quantity,@HiveField(3) String id
});




}
/// @nodoc
class __$FreeItemModelCopyWithImpl<$Res>
    implements _$FreeItemModelCopyWith<$Res> {
  __$FreeItemModelCopyWithImpl(this._self, this._then);

  final _FreeItemModel _self;
  final $Res Function(_FreeItemModel) _then;

/// Create a copy of FreeItemModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? menuItem = null,Object? menuItemName = null,Object? quantity = null,Object? id = null,}) {
  return _then(_FreeItemModel(
menuItem: null == menuItem ? _self.menuItem : menuItem // ignore: cast_nullable_to_non_nullable
as String,menuItemName: null == menuItemName ? _self.menuItemName : menuItemName // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
