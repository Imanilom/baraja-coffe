// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'addon.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AddonModel {

@HiveField(0) String? get id;@HiveField(1) String? get name;@HiveField(2) String? get type;@HiveField(3) List<AddonOptionModel>? get options;
/// Create a copy of AddonModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AddonModelCopyWith<AddonModel> get copyWith => _$AddonModelCopyWithImpl<AddonModel>(this as AddonModel, _$identity);

  /// Serializes this AddonModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AddonModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.type, type) || other.type == type)&&const DeepCollectionEquality().equals(other.options, options));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,type,const DeepCollectionEquality().hash(options));

@override
String toString() {
  return 'AddonModel(id: $id, name: $name, type: $type, options: $options)';
}


}

/// @nodoc
abstract mixin class $AddonModelCopyWith<$Res>  {
  factory $AddonModelCopyWith(AddonModel value, $Res Function(AddonModel) _then) = _$AddonModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String? id,@HiveField(1) String? name,@HiveField(2) String? type,@HiveField(3) List<AddonOptionModel>? options
});




}
/// @nodoc
class _$AddonModelCopyWithImpl<$Res>
    implements $AddonModelCopyWith<$Res> {
  _$AddonModelCopyWithImpl(this._self, this._then);

  final AddonModel _self;
  final $Res Function(AddonModel) _then;

/// Create a copy of AddonModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = freezed,Object? name = freezed,Object? type = freezed,Object? options = freezed,}) {
  return _then(_self.copyWith(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,type: freezed == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String?,options: freezed == options ? _self.options : options // ignore: cast_nullable_to_non_nullable
as List<AddonOptionModel>?,
  ));
}

}


/// Adds pattern-matching-related methods to [AddonModel].
extension AddonModelPatterns on AddonModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AddonModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AddonModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AddonModel value)  $default,){
final _that = this;
switch (_that) {
case _AddonModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AddonModel value)?  $default,){
final _that = this;
switch (_that) {
case _AddonModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String? id, @HiveField(1)  String? name, @HiveField(2)  String? type, @HiveField(3)  List<AddonOptionModel>? options)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AddonModel() when $default != null:
return $default(_that.id,_that.name,_that.type,_that.options);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String? id, @HiveField(1)  String? name, @HiveField(2)  String? type, @HiveField(3)  List<AddonOptionModel>? options)  $default,) {final _that = this;
switch (_that) {
case _AddonModel():
return $default(_that.id,_that.name,_that.type,_that.options);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String? id, @HiveField(1)  String? name, @HiveField(2)  String? type, @HiveField(3)  List<AddonOptionModel>? options)?  $default,) {final _that = this;
switch (_that) {
case _AddonModel() when $default != null:
return $default(_that.id,_that.name,_that.type,_that.options);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AddonModel implements AddonModel {
   _AddonModel({@HiveField(0) this.id, @HiveField(1) this.name, @HiveField(2) this.type, @HiveField(3) final  List<AddonOptionModel>? options}): _options = options;
  factory _AddonModel.fromJson(Map<String, dynamic> json) => _$AddonModelFromJson(json);

@override@HiveField(0) final  String? id;
@override@HiveField(1) final  String? name;
@override@HiveField(2) final  String? type;
 final  List<AddonOptionModel>? _options;
@override@HiveField(3) List<AddonOptionModel>? get options {
  final value = _options;
  if (value == null) return null;
  if (_options is EqualUnmodifiableListView) return _options;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}


/// Create a copy of AddonModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AddonModelCopyWith<_AddonModel> get copyWith => __$AddonModelCopyWithImpl<_AddonModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AddonModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AddonModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.type, type) || other.type == type)&&const DeepCollectionEquality().equals(other._options, _options));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,type,const DeepCollectionEquality().hash(_options));

@override
String toString() {
  return 'AddonModel(id: $id, name: $name, type: $type, options: $options)';
}


}

/// @nodoc
abstract mixin class _$AddonModelCopyWith<$Res> implements $AddonModelCopyWith<$Res> {
  factory _$AddonModelCopyWith(_AddonModel value, $Res Function(_AddonModel) _then) = __$AddonModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String? id,@HiveField(1) String? name,@HiveField(2) String? type,@HiveField(3) List<AddonOptionModel>? options
});




}
/// @nodoc
class __$AddonModelCopyWithImpl<$Res>
    implements _$AddonModelCopyWith<$Res> {
  __$AddonModelCopyWithImpl(this._self, this._then);

  final _AddonModel _self;
  final $Res Function(_AddonModel) _then;

/// Create a copy of AddonModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = freezed,Object? name = freezed,Object? type = freezed,Object? options = freezed,}) {
  return _then(_AddonModel(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,type: freezed == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String?,options: freezed == options ? _self._options : options // ignore: cast_nullable_to_non_nullable
as List<AddonOptionModel>?,
  ));
}


}

// dart format on
