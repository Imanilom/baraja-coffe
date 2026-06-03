// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'outlet_info.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$OutletInfoModel {

@HiveField(0)@JsonKey(name: '_id') String? get id;@HiveField(1) String? get name;@HiveField(2) String? get address;@HiveField(3) String? get city;@HiveField(4) String? get contactNumber;
/// Create a copy of OutletInfoModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OutletInfoModelCopyWith<OutletInfoModel> get copyWith => _$OutletInfoModelCopyWithImpl<OutletInfoModel>(this as OutletInfoModel, _$identity);

  /// Serializes this OutletInfoModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OutletInfoModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.address, address) || other.address == address)&&(identical(other.city, city) || other.city == city)&&(identical(other.contactNumber, contactNumber) || other.contactNumber == contactNumber));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,address,city,contactNumber);

@override
String toString() {
  return 'OutletInfoModel(id: $id, name: $name, address: $address, city: $city, contactNumber: $contactNumber)';
}


}

/// @nodoc
abstract mixin class $OutletInfoModelCopyWith<$Res>  {
  factory $OutletInfoModelCopyWith(OutletInfoModel value, $Res Function(OutletInfoModel) _then) = _$OutletInfoModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String? id,@HiveField(1) String? name,@HiveField(2) String? address,@HiveField(3) String? city,@HiveField(4) String? contactNumber
});




}
/// @nodoc
class _$OutletInfoModelCopyWithImpl<$Res>
    implements $OutletInfoModelCopyWith<$Res> {
  _$OutletInfoModelCopyWithImpl(this._self, this._then);

  final OutletInfoModel _self;
  final $Res Function(OutletInfoModel) _then;

/// Create a copy of OutletInfoModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = freezed,Object? name = freezed,Object? address = freezed,Object? city = freezed,Object? contactNumber = freezed,}) {
  return _then(_self.copyWith(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,contactNumber: freezed == contactNumber ? _self.contactNumber : contactNumber // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [OutletInfoModel].
extension OutletInfoModelPatterns on OutletInfoModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OutletInfoModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OutletInfoModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OutletInfoModel value)  $default,){
final _that = this;
switch (_that) {
case _OutletInfoModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OutletInfoModel value)?  $default,){
final _that = this;
switch (_that) {
case _OutletInfoModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String? id, @HiveField(1)  String? name, @HiveField(2)  String? address, @HiveField(3)  String? city, @HiveField(4)  String? contactNumber)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OutletInfoModel() when $default != null:
return $default(_that.id,_that.name,_that.address,_that.city,_that.contactNumber);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)@JsonKey(name: '_id')  String? id, @HiveField(1)  String? name, @HiveField(2)  String? address, @HiveField(3)  String? city, @HiveField(4)  String? contactNumber)  $default,) {final _that = this;
switch (_that) {
case _OutletInfoModel():
return $default(_that.id,_that.name,_that.address,_that.city,_that.contactNumber);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)@JsonKey(name: '_id')  String? id, @HiveField(1)  String? name, @HiveField(2)  String? address, @HiveField(3)  String? city, @HiveField(4)  String? contactNumber)?  $default,) {final _that = this;
switch (_that) {
case _OutletInfoModel() when $default != null:
return $default(_that.id,_that.name,_that.address,_that.city,_that.contactNumber);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OutletInfoModel implements OutletInfoModel {
  const _OutletInfoModel({@HiveField(0)@JsonKey(name: '_id') this.id, @HiveField(1) this.name = null, @HiveField(2) this.address = null, @HiveField(3) this.city = null, @HiveField(4) this.contactNumber = null});
  factory _OutletInfoModel.fromJson(Map<String, dynamic> json) => _$OutletInfoModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String? id;
@override@JsonKey()@HiveField(1) final  String? name;
@override@JsonKey()@HiveField(2) final  String? address;
@override@JsonKey()@HiveField(3) final  String? city;
@override@JsonKey()@HiveField(4) final  String? contactNumber;

/// Create a copy of OutletInfoModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OutletInfoModelCopyWith<_OutletInfoModel> get copyWith => __$OutletInfoModelCopyWithImpl<_OutletInfoModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OutletInfoModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OutletInfoModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.address, address) || other.address == address)&&(identical(other.city, city) || other.city == city)&&(identical(other.contactNumber, contactNumber) || other.contactNumber == contactNumber));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,address,city,contactNumber);

@override
String toString() {
  return 'OutletInfoModel(id: $id, name: $name, address: $address, city: $city, contactNumber: $contactNumber)';
}


}

/// @nodoc
abstract mixin class _$OutletInfoModelCopyWith<$Res> implements $OutletInfoModelCopyWith<$Res> {
  factory _$OutletInfoModelCopyWith(_OutletInfoModel value, $Res Function(_OutletInfoModel) _then) = __$OutletInfoModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String? id,@HiveField(1) String? name,@HiveField(2) String? address,@HiveField(3) String? city,@HiveField(4) String? contactNumber
});




}
/// @nodoc
class __$OutletInfoModelCopyWithImpl<$Res>
    implements _$OutletInfoModelCopyWith<$Res> {
  __$OutletInfoModelCopyWithImpl(this._self, this._then);

  final _OutletInfoModel _self;
  final $Res Function(_OutletInfoModel) _then;

/// Create a copy of OutletInfoModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = freezed,Object? name = freezed,Object? address = freezed,Object? city = freezed,Object? contactNumber = freezed,}) {
  return _then(_OutletInfoModel(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,contactNumber: freezed == contactNumber ? _self.contactNumber : contactNumber // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
