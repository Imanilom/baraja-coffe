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

@HiveField(0) String get id;@HiveField(1) String get promoId;// ID promo asli
@HiveField(2) String get name;@HiveField(3) String get promoType;@HiveField(4) String? get description;@HiveField(5) List<PromoGroupLineModel> get lines;// Items dalam group
@HiveField(6) int? get bundlePrice;@HiveField(7) int? get discount;@HiveField(8) bool get isActive;@HiveField(9) String? get imageUrl;@HiveField(10) List<String> get tags;// untuk filtering
@HiveField(11) AutoPromoModel? get sourcePromo;
/// Create a copy of PromoGroupModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PromoGroupModelCopyWith<PromoGroupModel> get copyWith => _$PromoGroupModelCopyWithImpl<PromoGroupModel>(this as PromoGroupModel, _$identity);

  /// Serializes this PromoGroupModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PromoGroupModel&&(identical(other.id, id) || other.id == id)&&(identical(other.promoId, promoId) || other.promoId == promoId)&&(identical(other.name, name) || other.name == name)&&(identical(other.promoType, promoType) || other.promoType == promoType)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other.lines, lines)&&(identical(other.bundlePrice, bundlePrice) || other.bundlePrice == bundlePrice)&&(identical(other.discount, discount) || other.discount == discount)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&const DeepCollectionEquality().equals(other.tags, tags)&&(identical(other.sourcePromo, sourcePromo) || other.sourcePromo == sourcePromo));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,promoId,name,promoType,description,const DeepCollectionEquality().hash(lines),bundlePrice,discount,isActive,imageUrl,const DeepCollectionEquality().hash(tags),sourcePromo);

@override
String toString() {
  return 'PromoGroupModel(id: $id, promoId: $promoId, name: $name, promoType: $promoType, description: $description, lines: $lines, bundlePrice: $bundlePrice, discount: $discount, isActive: $isActive, imageUrl: $imageUrl, tags: $tags, sourcePromo: $sourcePromo)';
}


}

/// @nodoc
abstract mixin class $PromoGroupModelCopyWith<$Res>  {
  factory $PromoGroupModelCopyWith(PromoGroupModel value, $Res Function(PromoGroupModel) _then) = _$PromoGroupModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String promoId,@HiveField(2) String name,@HiveField(3) String promoType,@HiveField(4) String? description,@HiveField(5) List<PromoGroupLineModel> lines,@HiveField(6) int? bundlePrice,@HiveField(7) int? discount,@HiveField(8) bool isActive,@HiveField(9) String? imageUrl,@HiveField(10) List<String> tags,@HiveField(11) AutoPromoModel? sourcePromo
});


$AutoPromoModelCopyWith<$Res>? get sourcePromo;

}
/// @nodoc
class _$PromoGroupModelCopyWithImpl<$Res>
    implements $PromoGroupModelCopyWith<$Res> {
  _$PromoGroupModelCopyWithImpl(this._self, this._then);

  final PromoGroupModel _self;
  final $Res Function(PromoGroupModel) _then;

/// Create a copy of PromoGroupModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? promoId = null,Object? name = null,Object? promoType = null,Object? description = freezed,Object? lines = null,Object? bundlePrice = freezed,Object? discount = freezed,Object? isActive = null,Object? imageUrl = freezed,Object? tags = null,Object? sourcePromo = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,promoId: null == promoId ? _self.promoId : promoId // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,lines: null == lines ? _self.lines : lines // ignore: cast_nullable_to_non_nullable
as List<PromoGroupLineModel>,bundlePrice: freezed == bundlePrice ? _self.bundlePrice : bundlePrice // ignore: cast_nullable_to_non_nullable
as int?,discount: freezed == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int?,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,imageUrl: freezed == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String?,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,sourcePromo: freezed == sourcePromo ? _self.sourcePromo : sourcePromo // ignore: cast_nullable_to_non_nullable
as AutoPromoModel?,
  ));
}
/// Create a copy of PromoGroupModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AutoPromoModelCopyWith<$Res>? get sourcePromo {
    if (_self.sourcePromo == null) {
    return null;
  }

  return $AutoPromoModelCopyWith<$Res>(_self.sourcePromo!, (value) {
    return _then(_self.copyWith(sourcePromo: value));
  });
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String promoId, @HiveField(2)  String name, @HiveField(3)  String promoType, @HiveField(4)  String? description, @HiveField(5)  List<PromoGroupLineModel> lines, @HiveField(6)  int? bundlePrice, @HiveField(7)  int? discount, @HiveField(8)  bool isActive, @HiveField(9)  String? imageUrl, @HiveField(10)  List<String> tags, @HiveField(11)  AutoPromoModel? sourcePromo)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PromoGroupModel() when $default != null:
return $default(_that.id,_that.promoId,_that.name,_that.promoType,_that.description,_that.lines,_that.bundlePrice,_that.discount,_that.isActive,_that.imageUrl,_that.tags,_that.sourcePromo);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String id, @HiveField(1)  String promoId, @HiveField(2)  String name, @HiveField(3)  String promoType, @HiveField(4)  String? description, @HiveField(5)  List<PromoGroupLineModel> lines, @HiveField(6)  int? bundlePrice, @HiveField(7)  int? discount, @HiveField(8)  bool isActive, @HiveField(9)  String? imageUrl, @HiveField(10)  List<String> tags, @HiveField(11)  AutoPromoModel? sourcePromo)  $default,) {final _that = this;
switch (_that) {
case _PromoGroupModel():
return $default(_that.id,_that.promoId,_that.name,_that.promoType,_that.description,_that.lines,_that.bundlePrice,_that.discount,_that.isActive,_that.imageUrl,_that.tags,_that.sourcePromo);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String id, @HiveField(1)  String promoId, @HiveField(2)  String name, @HiveField(3)  String promoType, @HiveField(4)  String? description, @HiveField(5)  List<PromoGroupLineModel> lines, @HiveField(6)  int? bundlePrice, @HiveField(7)  int? discount, @HiveField(8)  bool isActive, @HiveField(9)  String? imageUrl, @HiveField(10)  List<String> tags, @HiveField(11)  AutoPromoModel? sourcePromo)?  $default,) {final _that = this;
switch (_that) {
case _PromoGroupModel() when $default != null:
return $default(_that.id,_that.promoId,_that.name,_that.promoType,_that.description,_that.lines,_that.bundlePrice,_that.discount,_that.isActive,_that.imageUrl,_that.tags,_that.sourcePromo);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PromoGroupModel implements PromoGroupModel {
   _PromoGroupModel({@HiveField(0) required this.id, @HiveField(1) required this.promoId, @HiveField(2) required this.name, @HiveField(3) required this.promoType, @HiveField(4) this.description = null, @HiveField(5) final  List<PromoGroupLineModel> lines = const [], @HiveField(6) this.bundlePrice, @HiveField(7) this.discount, @HiveField(8) this.isActive = false, @HiveField(9) this.imageUrl, @HiveField(10) final  List<String> tags = const [], @HiveField(11) this.sourcePromo}): _lines = lines,_tags = tags;
  factory _PromoGroupModel.fromJson(Map<String, dynamic> json) => _$PromoGroupModelFromJson(json);

@override@HiveField(0) final  String id;
@override@HiveField(1) final  String promoId;
// ID promo asli
@override@HiveField(2) final  String name;
@override@HiveField(3) final  String promoType;
@override@JsonKey()@HiveField(4) final  String? description;
 final  List<PromoGroupLineModel> _lines;
@override@JsonKey()@HiveField(5) List<PromoGroupLineModel> get lines {
  if (_lines is EqualUnmodifiableListView) return _lines;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_lines);
}

// Items dalam group
@override@HiveField(6) final  int? bundlePrice;
@override@HiveField(7) final  int? discount;
@override@JsonKey()@HiveField(8) final  bool isActive;
@override@HiveField(9) final  String? imageUrl;
 final  List<String> _tags;
@override@JsonKey()@HiveField(10) List<String> get tags {
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tags);
}

// untuk filtering
@override@HiveField(11) final  AutoPromoModel? sourcePromo;

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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PromoGroupModel&&(identical(other.id, id) || other.id == id)&&(identical(other.promoId, promoId) || other.promoId == promoId)&&(identical(other.name, name) || other.name == name)&&(identical(other.promoType, promoType) || other.promoType == promoType)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other._lines, _lines)&&(identical(other.bundlePrice, bundlePrice) || other.bundlePrice == bundlePrice)&&(identical(other.discount, discount) || other.discount == discount)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&const DeepCollectionEquality().equals(other._tags, _tags)&&(identical(other.sourcePromo, sourcePromo) || other.sourcePromo == sourcePromo));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,promoId,name,promoType,description,const DeepCollectionEquality().hash(_lines),bundlePrice,discount,isActive,imageUrl,const DeepCollectionEquality().hash(_tags),sourcePromo);

@override
String toString() {
  return 'PromoGroupModel(id: $id, promoId: $promoId, name: $name, promoType: $promoType, description: $description, lines: $lines, bundlePrice: $bundlePrice, discount: $discount, isActive: $isActive, imageUrl: $imageUrl, tags: $tags, sourcePromo: $sourcePromo)';
}


}

/// @nodoc
abstract mixin class _$PromoGroupModelCopyWith<$Res> implements $PromoGroupModelCopyWith<$Res> {
  factory _$PromoGroupModelCopyWith(_PromoGroupModel value, $Res Function(_PromoGroupModel) _then) = __$PromoGroupModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String id,@HiveField(1) String promoId,@HiveField(2) String name,@HiveField(3) String promoType,@HiveField(4) String? description,@HiveField(5) List<PromoGroupLineModel> lines,@HiveField(6) int? bundlePrice,@HiveField(7) int? discount,@HiveField(8) bool isActive,@HiveField(9) String? imageUrl,@HiveField(10) List<String> tags,@HiveField(11) AutoPromoModel? sourcePromo
});


@override $AutoPromoModelCopyWith<$Res>? get sourcePromo;

}
/// @nodoc
class __$PromoGroupModelCopyWithImpl<$Res>
    implements _$PromoGroupModelCopyWith<$Res> {
  __$PromoGroupModelCopyWithImpl(this._self, this._then);

  final _PromoGroupModel _self;
  final $Res Function(_PromoGroupModel) _then;

/// Create a copy of PromoGroupModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? promoId = null,Object? name = null,Object? promoType = null,Object? description = freezed,Object? lines = null,Object? bundlePrice = freezed,Object? discount = freezed,Object? isActive = null,Object? imageUrl = freezed,Object? tags = null,Object? sourcePromo = freezed,}) {
  return _then(_PromoGroupModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,promoId: null == promoId ? _self.promoId : promoId // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,promoType: null == promoType ? _self.promoType : promoType // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,lines: null == lines ? _self._lines : lines // ignore: cast_nullable_to_non_nullable
as List<PromoGroupLineModel>,bundlePrice: freezed == bundlePrice ? _self.bundlePrice : bundlePrice // ignore: cast_nullable_to_non_nullable
as int?,discount: freezed == discount ? _self.discount : discount // ignore: cast_nullable_to_non_nullable
as int?,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,imageUrl: freezed == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String?,tags: null == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,sourcePromo: freezed == sourcePromo ? _self.sourcePromo : sourcePromo // ignore: cast_nullable_to_non_nullable
as AutoPromoModel?,
  ));
}

/// Create a copy of PromoGroupModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AutoPromoModelCopyWith<$Res>? get sourcePromo {
    if (_self.sourcePromo == null) {
    return null;
  }

  return $AutoPromoModelCopyWith<$Res>(_self.sourcePromo!, (value) {
    return _then(_self.copyWith(sourcePromo: value));
  });
}
}


/// @nodoc
mixin _$PromoGroupLineModel {

@HiveField(0) String get menuItemId;@HiveField(1) String get menuItemName;@HiveField(2) int get qty;@HiveField(3) int? get originalPrice;@HiveField(4) String? get categoryId;@HiveField(5) String? get categoryName;
/// Create a copy of PromoGroupLineModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PromoGroupLineModelCopyWith<PromoGroupLineModel> get copyWith => _$PromoGroupLineModelCopyWithImpl<PromoGroupLineModel>(this as PromoGroupLineModel, _$identity);

  /// Serializes this PromoGroupLineModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PromoGroupLineModel&&(identical(other.menuItemId, menuItemId) || other.menuItemId == menuItemId)&&(identical(other.menuItemName, menuItemName) || other.menuItemName == menuItemName)&&(identical(other.qty, qty) || other.qty == qty)&&(identical(other.originalPrice, originalPrice) || other.originalPrice == originalPrice)&&(identical(other.categoryId, categoryId) || other.categoryId == categoryId)&&(identical(other.categoryName, categoryName) || other.categoryName == categoryName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItemId,menuItemName,qty,originalPrice,categoryId,categoryName);

@override
String toString() {
  return 'PromoGroupLineModel(menuItemId: $menuItemId, menuItemName: $menuItemName, qty: $qty, originalPrice: $originalPrice, categoryId: $categoryId, categoryName: $categoryName)';
}


}

/// @nodoc
abstract mixin class $PromoGroupLineModelCopyWith<$Res>  {
  factory $PromoGroupLineModelCopyWith(PromoGroupLineModel value, $Res Function(PromoGroupLineModel) _then) = _$PromoGroupLineModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String menuItemId,@HiveField(1) String menuItemName,@HiveField(2) int qty,@HiveField(3) int? originalPrice,@HiveField(4) String? categoryId,@HiveField(5) String? categoryName
});




}
/// @nodoc
class _$PromoGroupLineModelCopyWithImpl<$Res>
    implements $PromoGroupLineModelCopyWith<$Res> {
  _$PromoGroupLineModelCopyWithImpl(this._self, this._then);

  final PromoGroupLineModel _self;
  final $Res Function(PromoGroupLineModel) _then;

/// Create a copy of PromoGroupLineModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? menuItemId = null,Object? menuItemName = null,Object? qty = null,Object? originalPrice = freezed,Object? categoryId = freezed,Object? categoryName = freezed,}) {
  return _then(_self.copyWith(
menuItemId: null == menuItemId ? _self.menuItemId : menuItemId // ignore: cast_nullable_to_non_nullable
as String,menuItemName: null == menuItemName ? _self.menuItemName : menuItemName // ignore: cast_nullable_to_non_nullable
as String,qty: null == qty ? _self.qty : qty // ignore: cast_nullable_to_non_nullable
as int,originalPrice: freezed == originalPrice ? _self.originalPrice : originalPrice // ignore: cast_nullable_to_non_nullable
as int?,categoryId: freezed == categoryId ? _self.categoryId : categoryId // ignore: cast_nullable_to_non_nullable
as String?,categoryName: freezed == categoryName ? _self.categoryName : categoryName // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [PromoGroupLineModel].
extension PromoGroupLineModelPatterns on PromoGroupLineModel {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PromoGroupLineModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PromoGroupLineModel() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PromoGroupLineModel value)  $default,){
final _that = this;
switch (_that) {
case _PromoGroupLineModel():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PromoGroupLineModel value)?  $default,){
final _that = this;
switch (_that) {
case _PromoGroupLineModel() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@HiveField(0)  String menuItemId, @HiveField(1)  String menuItemName, @HiveField(2)  int qty, @HiveField(3)  int? originalPrice, @HiveField(4)  String? categoryId, @HiveField(5)  String? categoryName)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PromoGroupLineModel() when $default != null:
return $default(_that.menuItemId,_that.menuItemName,_that.qty,_that.originalPrice,_that.categoryId,_that.categoryName);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@HiveField(0)  String menuItemId, @HiveField(1)  String menuItemName, @HiveField(2)  int qty, @HiveField(3)  int? originalPrice, @HiveField(4)  String? categoryId, @HiveField(5)  String? categoryName)  $default,) {final _that = this;
switch (_that) {
case _PromoGroupLineModel():
return $default(_that.menuItemId,_that.menuItemName,_that.qty,_that.originalPrice,_that.categoryId,_that.categoryName);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@HiveField(0)  String menuItemId, @HiveField(1)  String menuItemName, @HiveField(2)  int qty, @HiveField(3)  int? originalPrice, @HiveField(4)  String? categoryId, @HiveField(5)  String? categoryName)?  $default,) {final _that = this;
switch (_that) {
case _PromoGroupLineModel() when $default != null:
return $default(_that.menuItemId,_that.menuItemName,_that.qty,_that.originalPrice,_that.categoryId,_that.categoryName);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PromoGroupLineModel implements PromoGroupLineModel {
   _PromoGroupLineModel({@HiveField(0) required this.menuItemId, @HiveField(1) required this.menuItemName, @HiveField(2) required this.qty, @HiveField(3) this.originalPrice, @HiveField(4) this.categoryId, @HiveField(5) this.categoryName});
  factory _PromoGroupLineModel.fromJson(Map<String, dynamic> json) => _$PromoGroupLineModelFromJson(json);

@override@HiveField(0) final  String menuItemId;
@override@HiveField(1) final  String menuItemName;
@override@HiveField(2) final  int qty;
@override@HiveField(3) final  int? originalPrice;
@override@HiveField(4) final  String? categoryId;
@override@HiveField(5) final  String? categoryName;

/// Create a copy of PromoGroupLineModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PromoGroupLineModelCopyWith<_PromoGroupLineModel> get copyWith => __$PromoGroupLineModelCopyWithImpl<_PromoGroupLineModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PromoGroupLineModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PromoGroupLineModel&&(identical(other.menuItemId, menuItemId) || other.menuItemId == menuItemId)&&(identical(other.menuItemName, menuItemName) || other.menuItemName == menuItemName)&&(identical(other.qty, qty) || other.qty == qty)&&(identical(other.originalPrice, originalPrice) || other.originalPrice == originalPrice)&&(identical(other.categoryId, categoryId) || other.categoryId == categoryId)&&(identical(other.categoryName, categoryName) || other.categoryName == categoryName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,menuItemId,menuItemName,qty,originalPrice,categoryId,categoryName);

@override
String toString() {
  return 'PromoGroupLineModel(menuItemId: $menuItemId, menuItemName: $menuItemName, qty: $qty, originalPrice: $originalPrice, categoryId: $categoryId, categoryName: $categoryName)';
}


}

/// @nodoc
abstract mixin class _$PromoGroupLineModelCopyWith<$Res> implements $PromoGroupLineModelCopyWith<$Res> {
  factory _$PromoGroupLineModelCopyWith(_PromoGroupLineModel value, $Res Function(_PromoGroupLineModel) _then) = __$PromoGroupLineModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String menuItemId,@HiveField(1) String menuItemName,@HiveField(2) int qty,@HiveField(3) int? originalPrice,@HiveField(4) String? categoryId,@HiveField(5) String? categoryName
});




}
/// @nodoc
class __$PromoGroupLineModelCopyWithImpl<$Res>
    implements _$PromoGroupLineModelCopyWith<$Res> {
  __$PromoGroupLineModelCopyWithImpl(this._self, this._then);

  final _PromoGroupLineModel _self;
  final $Res Function(_PromoGroupLineModel) _then;

/// Create a copy of PromoGroupLineModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? menuItemId = null,Object? menuItemName = null,Object? qty = null,Object? originalPrice = freezed,Object? categoryId = freezed,Object? categoryName = freezed,}) {
  return _then(_PromoGroupLineModel(
menuItemId: null == menuItemId ? _self.menuItemId : menuItemId // ignore: cast_nullable_to_non_nullable
as String,menuItemName: null == menuItemName ? _self.menuItemName : menuItemName // ignore: cast_nullable_to_non_nullable
as String,qty: null == qty ? _self.qty : qty // ignore: cast_nullable_to_non_nullable
as int,originalPrice: freezed == originalPrice ? _self.originalPrice : originalPrice // ignore: cast_nullable_to_non_nullable
as int?,categoryId: freezed == categoryId ? _self.categoryId : categoryId // ignore: cast_nullable_to_non_nullable
as String?,categoryName: freezed == categoryName ? _self.categoryName : categoryName // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
