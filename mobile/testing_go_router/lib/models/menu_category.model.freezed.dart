// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'menu_category.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$MenuCategoryModel {

@HiveField(0)@JsonKey(name: '_id') String get id;@HiveField(1) String get name;
/// Create a copy of MenuCategoryModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MenuCategoryModelCopyWith<MenuCategoryModel> get copyWith => _$MenuCategoryModelCopyWithImpl<MenuCategoryModel>(this as MenuCategoryModel, _$identity);

  /// Serializes this MenuCategoryModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MenuCategoryModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'MenuCategoryModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class $MenuCategoryModelCopyWith<$Res>  {
  factory $MenuCategoryModelCopyWith(MenuCategoryModel value, $Res Function(MenuCategoryModel) _then) = _$MenuCategoryModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class _$MenuCategoryModelCopyWithImpl<$Res>
    implements $MenuCategoryModelCopyWith<$Res> {
  _$MenuCategoryModelCopyWithImpl(this._self, this._then);

  final MenuCategoryModel _self;
  final $Res Function(MenuCategoryModel) _then;

/// Create a copy of MenuCategoryModel
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

class _MenuCategoryModel implements MenuCategoryModel {
   _MenuCategoryModel({@HiveField(0)@JsonKey(name: '_id') required this.id, @HiveField(1) required this.name});
  factory _MenuCategoryModel.fromJson(Map<String, dynamic> json) => _$MenuCategoryModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String id;
@override@HiveField(1) final  String name;

/// Create a copy of MenuCategoryModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MenuCategoryModelCopyWith<_MenuCategoryModel> get copyWith => __$MenuCategoryModelCopyWithImpl<_MenuCategoryModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MenuCategoryModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MenuCategoryModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name);

@override
String toString() {
  return 'MenuCategoryModel(id: $id, name: $name)';
}


}

/// @nodoc
abstract mixin class _$MenuCategoryModelCopyWith<$Res> implements $MenuCategoryModelCopyWith<$Res> {
  factory _$MenuCategoryModelCopyWith(_MenuCategoryModel value, $Res Function(_MenuCategoryModel) _then) = __$MenuCategoryModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String name
});




}
/// @nodoc
class __$MenuCategoryModelCopyWithImpl<$Res>
    implements _$MenuCategoryModelCopyWith<$Res> {
  __$MenuCategoryModelCopyWithImpl(this._self, this._then);

  final _MenuCategoryModel _self;
  final $Res Function(_MenuCategoryModel) _then;

/// Create a copy of MenuCategoryModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,}) {
  return _then(_MenuCategoryModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
