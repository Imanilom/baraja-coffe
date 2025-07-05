// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'menu_subcategory.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$MenuSubCategoryModel {

@HiveField(0)@JsonKey(name: '_id') String get id;@HiveField(1) String get name;
/// Create a copy of MenuSubCategoryModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MenuSubCategoryModelCopyWith<MenuSubCategoryModel> get copyWith => _$MenuSubCategoryModelCopyWithImpl<MenuSubCategoryModel>(this as MenuSubCategoryModel, _$identity);

  /// Serializes this MenuSubCategoryModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MenuSubCategoryModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'MenuSubCategoryModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class $MenuSubCategoryModelCopyWith<$Res>  {
  factory $MenuSubCategoryModelCopyWith(MenuSubCategoryModel value, $Res Function(MenuSubCategoryModel) _then) = _$MenuSubCategoryModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class _$MenuSubCategoryModelCopyWithImpl<$Res>
    implements $MenuSubCategoryModelCopyWith<$Res> {
  _$MenuSubCategoryModelCopyWithImpl(this._self, this._then);

  final MenuSubCategoryModel _self;
  final $Res Function(MenuSubCategoryModel) _then;

/// Create a copy of MenuSubCategoryModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _MenuSubCategoryModel implements MenuSubCategoryModel {
   _MenuSubCategoryModel({@HiveField(0)@JsonKey(name: '_id') required this.id, @HiveField(1) required this.name});
  factory _MenuSubCategoryModel.fromJson(Map<String, dynamic> json) => _$MenuSubCategoryModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String id;
@override@HiveField(1) final  String name;

/// Create a copy of MenuSubCategoryModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MenuSubCategoryModelCopyWith<_MenuSubCategoryModel> get copyWith => __$MenuSubCategoryModelCopyWithImpl<_MenuSubCategoryModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MenuSubCategoryModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MenuSubCategoryModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'MenuSubCategoryModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class _$MenuSubCategoryModelCopyWith<$Res> implements $MenuSubCategoryModelCopyWith<$Res> {
  factory _$MenuSubCategoryModelCopyWith(_MenuSubCategoryModel value, $Res Function(_MenuSubCategoryModel) _then) = __$MenuSubCategoryModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class __$MenuSubCategoryModelCopyWithImpl<$Res>
    implements _$MenuSubCategoryModelCopyWith<$Res> {
  __$MenuSubCategoryModelCopyWithImpl(this._self, this._then);

  final _MenuSubCategoryModel _self;
  final $Res Function(_MenuSubCategoryModel) _then;

/// Create a copy of MenuSubCategoryModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,}) {
  return _then(_MenuSubCategoryModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
