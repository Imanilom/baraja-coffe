// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'promo_group.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PromoGroupModel {

@HiveField(1) String get promoId;@HiveField(2) String get title;@HiveField(3) String get subtitle;@HiveField(4) String get promoType;// bundling | buy_x_get_y
@HiveField(5) List<PromoGroupLine> get lines;@HiveField(6) int get times;
/// Create a copy of PromoGroupModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PromoGroupModelCopyWith<PromoGroupModel> get copyWith => _$PromoGroupModelCopyWithImpl<PromoGroupModel>(this as PromoGroupModel, _$identity);

  /// Serializes this PromoGroupModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PromoGroupModel&&(identical(other.promoId, promoId) || other.promoId == promoId)&&(identical(other.title, title) || other.title == title)&&(identical(other.subtitle, subtitle) || other.subtitle == subtitle)&&(identical(other.promoType, promoType) || other.promoType == promoType)&&const DeepCollectionEquality().equals(other.lines, lines)&&(identical(other.times, times) || other.times == times));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,promoId,title,subtitle,promoType,const DeepCollectionEquality().hash(lines),times);

@override
String toString() {
  return 'PromoGroupModel(promoId: $promoId, title: $title, subtitle: $subtitle, promoType: $promoType, lines: $lines, times: $times)';
}


}

/// @nodoc
abstract mixin class $PromoGroupModelCopyWith<$Res>  {
  factory $PromoGroupModelCopyWith(PromoGroupModel value, $Res Function(PromoGroupModel) _then) = _$PromoGroupModelCopyWithImpl;
@useResult
$Res call({
@HiveField(1) String promoId,@HiveField(2) String title,@HiveField(3) String subtitle,@HiveField(4) String promoType,@HiveField(5) List<PromoGroupLine> lines,@HiveField(6) int times
});




}
/// @nodoc
class _$PromoGroupModelCopyWithImpl<$Res>
    implements $PromoGroupModelCopyWith<$Res> {
  _$PromoGroupModelCopyWithImpl(this._self, this._then);

  final PromoGroupModel _self;
  final $Res Function(PromoGroupModel) _then;

/// Create a copy of PromoGroupModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? promoId = null,Object? title = null,Object? subtitle = null,Object? promoType = null,Object? lines = null,Object? times = null,}) {
  return _then(_self.copyWith(
promoId: null == promoId ? _self.promoId : promoId // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,subtitle: null == subtitle ? _self.subtitle : subtitle // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,lines: null == lines ? _self.lines : lines // ignore: cast_nullable_to_non_nullable
as List<PromoGroupLine>,times: null == times ? _self.times : times // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [PromoGroupModel].
extension PromoGroupModelPatterns on PromoGroupModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PromoGroupModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PromoGroupModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PromoGroupModel value)  $default,){
final _that = this;
switch (_that) {
case _PromoGroupModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PromoGroupModel value)?  $default,){
final _that = this;
switch (_that) {
case _PromoGroupModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(1)  String promoId, @HiveField(2)  String title, @HiveField(3)  String subtitle, @HiveField(4)  String promoType, @HiveField(5)  List<PromoGroupLine> lines, @HiveField(6)  int times)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PromoGroupModel() when $default != null:
return $default(_that.promoId,_that.title,_that.subtitle,_that.promoType,_that.lines,_that.times);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(1)  String promoId, @HiveField(2)  String title, @HiveField(3)  String subtitle, @HiveField(4)  String promoType, @HiveField(5)  List<PromoGroupLine> lines, @HiveField(6)  int times)  $default,) {final _that = this;
switch (_that) {
case _PromoGroupModel():
return $default(_that.promoId,_that.title,_that.subtitle,_that.promoType,_that.lines,_that.times);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(1)  String promoId, @HiveField(2)  String title, @HiveField(3)  String subtitle, @HiveField(4)  String promoType, @HiveField(5)  List<PromoGroupLine> lines, @HiveField(6)  int times)?  $default,) {final _that = this;
switch (_that) {
case _PromoGroupModel() when $default != null:
return $default(_that.promoId,_that.title,_that.subtitle,_that.promoType,_that.lines,_that.times);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()
@HiveField(0)
class _PromoGroupModel implements PromoGroupModel {
  const _PromoGroupModel({@HiveField(1) required this.promoId, @HiveField(2) required this.title, @HiveField(3) required this.subtitle, @HiveField(4) required this.promoType, @HiveField(5) required final  List<PromoGroupLine> lines, @HiveField(6) this.times = 1}): _lines = lines;
  factory _PromoGroupModel.fromJson(Map<String, dynamic> json) => _$PromoGroupModelFromJson(json);

@override@HiveField(1) final  String promoId;
@override@HiveField(2) final  String title;
@override@HiveField(3) final  String subtitle;
@override@HiveField(4) final  String promoType;
// bundling | buy_x_get_y
 final  List<PromoGroupLine> _lines;
// bundling | buy_x_get_y
@override@HiveField(5) List<PromoGroupLine> get lines {
  if (_lines is EqualUnmodifiableListView) return _lines;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_lines);
}

@override@JsonKey()@HiveField(6) final  int times;

/// Create a copy of PromoGroupModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PromoGroupModelCopyWith<_PromoGroupModel> get copyWith => __$PromoGroupModelCopyWithImpl<_PromoGroupModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PromoGroupModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PromoGroupModel&&(identical(other.promoId, promoId) || other.promoId == promoId)&&(identical(other.title, title) || other.title == title)&&(identical(other.subtitle, subtitle) || other.subtitle == subtitle)&&(identical(other.promoType, promoType) || other.promoType == promoType)&&const DeepCollectionEquality().equals(other._lines, _lines)&&(identical(other.times, times) || other.times == times));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,promoId,title,subtitle,promoType,const DeepCollectionEquality().hash(_lines),times);

@override
String toString() {
  return 'PromoGroupModel(promoId: $promoId, title: $title, subtitle: $subtitle, promoType: $promoType, lines: $lines, times: $times)';
}


}

/// @nodoc
abstract mixin class _$PromoGroupModelCopyWith<$Res> implements $PromoGroupModelCopyWith<$Res> {
  factory _$PromoGroupModelCopyWith(_PromoGroupModel value, $Res Function(_PromoGroupModel) _then) = __$PromoGroupModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(1) String promoId,@HiveField(2) String title,@HiveField(3) String subtitle,@HiveField(4) String promoType,@HiveField(5) List<PromoGroupLine> lines,@HiveField(6) int times
});




}
/// @nodoc
class __$PromoGroupModelCopyWithImpl<$Res>
    implements _$PromoGroupModelCopyWith<$Res> {
  __$PromoGroupModelCopyWithImpl(this._self, this._then);

  final _PromoGroupModel _self;
  final $Res Function(_PromoGroupModel) _then;

/// Create a copy of PromoGroupModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? promoId = null,Object? title = null,Object? subtitle = null,Object? promoType = null,Object? lines = null,Object? times = null,}) {
  return _then(_PromoGroupModel(
promoId: null == promoId ? _self.promoId : promoId // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,subtitle: null == subtitle ? _self.subtitle : subtitle // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,lines: null == lines ? _self._lines : lines // ignore: cast_nullable_to_non_nullable
as List<PromoGroupLine>,times: null == times ? _self.times : times // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$PromoGroupLine {

@HiveField(1) String get menuItemId;@HiveField(2) int get qty;
/// Create a copy of PromoGroupLine
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PromoGroupLineCopyWith<PromoGroupLine> get copyWith => _$PromoGroupLineCopyWithImpl<PromoGroupLine>(this as PromoGroupLine, _$identity);

  /// Serializes this PromoGroupLine to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PromoGroupLine&&(identical(other.menuItemId, menuItemId) || other.menuItemId == menuItemId)&&(identical(other.qty, qty) || other.qty == qty));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItemId,qty);

@override
String toString() {
  return 'PromoGroupLine(menuItemId: $menuItemId, qty: $qty)';
}


}

/// @nodoc
abstract mixin class $PromoGroupLineCopyWith<$Res>  {
  factory $PromoGroupLineCopyWith(PromoGroupLine value, $Res Function(PromoGroupLine) _then) = _$PromoGroupLineCopyWithImpl;
@useResult
$Res call({
@HiveField(1) String menuItemId,@HiveField(2) int qty
});




}
/// @nodoc
class _$PromoGroupLineCopyWithImpl<$Res>
    implements $PromoGroupLineCopyWith<$Res> {
  _$PromoGroupLineCopyWithImpl(this._self, this._then);

  final PromoGroupLine _self;
  final $Res Function(PromoGroupLine) _then;

/// Create a copy of PromoGroupLine
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? menuItemId = null,Object? qty = null,}) {
  return _then(_self.copyWith(
menuItemId: null == menuItemId ? _self.menuItemId : menuItemId // ignore: cast_nullable_to_non_nullable
as String,qty: null == qty ? _self.qty : qty // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [PromoGroupLine].
extension PromoGroupLinePatterns on PromoGroupLine {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PromoGroupLine value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PromoGroupLine() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PromoGroupLine value)  $default,){
final _that = this;
switch (_that) {
case _PromoGroupLine():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PromoGroupLine value)?  $default,){
final _that = this;
switch (_that) {
case _PromoGroupLine() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(1)  String menuItemId, @HiveField(2)  int qty)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PromoGroupLine() when $default != null:
return $default(_that.menuItemId,_that.qty);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(1)  String menuItemId, @HiveField(2)  int qty)  $default,) {final _that = this;
switch (_that) {
case _PromoGroupLine():
return $default(_that.menuItemId,_that.qty);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(1)  String menuItemId, @HiveField(2)  int qty)?  $default,) {final _that = this;
switch (_that) {
case _PromoGroupLine() when $default != null:
return $default(_that.menuItemId,_that.qty);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()
@HiveField(0)
class _PromoGroupLine implements PromoGroupLine {
  const _PromoGroupLine({@HiveField(1) required this.menuItemId, @HiveField(2) required this.qty});
  factory _PromoGroupLine.fromJson(Map<String, dynamic> json) => _$PromoGroupLineFromJson(json);

@override@HiveField(1) final  String menuItemId;
@override@HiveField(2) final  int qty;

/// Create a copy of PromoGroupLine
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PromoGroupLineCopyWith<_PromoGroupLine> get copyWith => __$PromoGroupLineCopyWithImpl<_PromoGroupLine>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PromoGroupLineToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PromoGroupLine&&(identical(other.menuItemId, menuItemId) || other.menuItemId == menuItemId)&&(identical(other.qty, qty) || other.qty == qty));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItemId,qty);

@override
String toString() {
  return 'PromoGroupLine(menuItemId: $menuItemId, qty: $qty)';
}


}

/// @nodoc
abstract mixin class _$PromoGroupLineCopyWith<$Res> implements $PromoGroupLineCopyWith<$Res> {
  factory _$PromoGroupLineCopyWith(_PromoGroupLine value, $Res Function(_PromoGroupLine) _then) = __$PromoGroupLineCopyWithImpl;
@override @useResult
$Res call({
@HiveField(1) String menuItemId,@HiveField(2) int qty
});




}
/// @nodoc
class __$PromoGroupLineCopyWithImpl<$Res>
    implements _$PromoGroupLineCopyWith<$Res> {
  __$PromoGroupLineCopyWithImpl(this._self, this._then);

  final _PromoGroupLine _self;
  final $Res Function(_PromoGroupLine) _then;

/// Create a copy of PromoGroupLine
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? menuItemId = null,Object? qty = null,}) {
  return _then(_PromoGroupLine(
menuItemId: null == menuItemId ? _self.menuItemId : menuItemId // ignore: cast_nullable_to_non_nullable
as String,qty: null == qty ? _self.qty : qty // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
