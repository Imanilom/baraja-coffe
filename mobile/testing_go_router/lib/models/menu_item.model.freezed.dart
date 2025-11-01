// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'menu_item.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$MenuItemModel {

@HiveField(1) String get id;@HiveField(2) String? get name;@HiveField(3) int? get originalPrice;// Ubah menjadi int
@HiveField(4) int? get discountedPrice;// Tambahkan field baru
@HiveField(5) String? get description;@HiveField(6) String? get mainCategory;// Ubah tipe data
@HiveField(7) String? get subCategory;// Ubah tipe data
// @HiveField(6) MenuCategoryModel? category, // Ubah tipe data
// @HiveField(7) MenuSubCategoryModel? subCategory, // Ubah tipe data
@HiveField(8)@JsonKey(name: 'imageUrl') String? get imageURL;// Sesuaikan key JSON
@HiveField(9) List<ToppingModel>? get toppings;@HiveField(10) List<AddonModel>? get addons;@HiveField(11) int? get discountPercentage;// Tambahkan fiel,d baru
@HiveField(12) int? get averageRating;// Tambahkan field baru
@HiveField(13) int? get reviewCount;// Tambahkan field baru
@HiveField(14) bool? get isAvailable;// Tambahkan field baru
@HiveField(15) String? get workstation;@HiveField(16) MenuStockModel? get stock;
/// Create a copy of MenuItemModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MenuItemModelCopyWith<MenuItemModel> get copyWith => _$MenuItemModelCopyWithImpl<MenuItemModel>(this as MenuItemModel, _$identity);

  /// Serializes this MenuItemModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MenuItemModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.originalPrice, originalPrice) || other.originalPrice == originalPrice)&&(identical(other.discountedPrice, discountedPrice) || other.discountedPrice == discountedPrice)&&(identical(other.description, description) || other.description == description)&&(identical(other.mainCategory, mainCategory) || other.mainCategory == mainCategory)&&(identical(other.subCategory, subCategory) || other.subCategory == subCategory)&&(identical(other.imageURL, imageURL) || other.imageURL == imageURL)&&const DeepCollectionEquality().equals(other.toppings, toppings)&&const DeepCollectionEquality().equals(other.addons, addons)&&(identical(other.discountPercentage, discountPercentage) || other.discountPercentage == discountPercentage)&&(identical(other.averageRating, averageRating) || other.averageRating == averageRating)&&(identical(other.reviewCount, reviewCount) || other.reviewCount == reviewCount)&&(identical(other.isAvailable, isAvailable) || other.isAvailable == isAvailable)&&(identical(other.workstation, workstation) || other.workstation == workstation)&&(identical(other.stock, stock) || other.stock == stock));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,originalPrice,discountedPrice,description,mainCategory,subCategory,imageURL,const DeepCollectionEquality().hash(toppings),const DeepCollectionEquality().hash(addons),discountPercentage,averageRating,reviewCount,isAvailable,workstation,stock);

@override
String toString() {
  return 'MenuItemModel(id: $id, name: $name, originalPrice: $originalPrice, discountedPrice: $discountedPrice, description: $description, mainCategory: $mainCategory, subCategory: $subCategory, imageURL: $imageURL, toppings: $toppings, addons: $addons, discountPercentage: $discountPercentage, averageRating: $averageRating, reviewCount: $reviewCount, isAvailable: $isAvailable, workstation: $workstation, stock: $stock)';
}


}

/// @nodoc
abstract mixin class $MenuItemModelCopyWith<$Res>  {
  factory $MenuItemModelCopyWith(MenuItemModel value, $Res Function(MenuItemModel) _then) = _$MenuItemModelCopyWithImpl;
@useResult
$Res call({
@HiveField(1) String id,@HiveField(2) String? name,@HiveField(3) int? originalPrice,@HiveField(4) int? discountedPrice,@HiveField(5) String? description,@HiveField(6) String? mainCategory,@HiveField(7) String? subCategory,@HiveField(8)@JsonKey(name: 'imageUrl') String? imageURL,@HiveField(9) List<ToppingModel>? toppings,@HiveField(10) List<AddonModel>? addons,@HiveField(11) int? discountPercentage,@HiveField(12) int? averageRating,@HiveField(13) int? reviewCount,@HiveField(14) bool? isAvailable,@HiveField(15) String? workstation,@HiveField(16) MenuStockModel? stock
});


$MenuStockModelCopyWith<$Res>? get stock;

}
/// @nodoc
class _$MenuItemModelCopyWithImpl<$Res>
    implements $MenuItemModelCopyWith<$Res> {
  _$MenuItemModelCopyWithImpl(this._self, this._then);

  final MenuItemModel _self;
  final $Res Function(MenuItemModel) _then;

/// Create a copy of MenuItemModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = freezed,Object? originalPrice = freezed,Object? discountedPrice = freezed,Object? description = freezed,Object? mainCategory = freezed,Object? subCategory = freezed,Object? imageURL = freezed,Object? toppings = freezed,Object? addons = freezed,Object? discountPercentage = freezed,Object? averageRating = freezed,Object? reviewCount = freezed,Object? isAvailable = freezed,Object? workstation = freezed,Object? stock = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,originalPrice: freezed == originalPrice ? _self.originalPrice : originalPrice // ignore: cast_nullable_to_non_nullable
as int?,discountedPrice: freezed == discountedPrice ? _self.discountedPrice : discountedPrice // ignore: cast_nullable_to_non_nullable
as int?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,mainCategory: freezed == mainCategory ? _self.mainCategory : mainCategory // ignore: cast_nullable_to_non_nullable
as String?,subCategory: freezed == subCategory ? _self.subCategory : subCategory // ignore: cast_nullable_to_non_nullable
as String?,imageURL: freezed == imageURL ? _self.imageURL : imageURL // ignore: cast_nullable_to_non_nullable
as String?,toppings: freezed == toppings ? _self.toppings : toppings // ignore: cast_nullable_to_non_nullable
as List<ToppingModel>?,addons: freezed == addons ? _self.addons : addons // ignore: cast_nullable_to_non_nullable
as List<AddonModel>?,discountPercentage: freezed == discountPercentage ? _self.discountPercentage : discountPercentage // ignore: cast_nullable_to_non_nullable
as int?,averageRating: freezed == averageRating ? _self.averageRating : averageRating // ignore: cast_nullable_to_non_nullable
as int?,reviewCount: freezed == reviewCount ? _self.reviewCount : reviewCount // ignore: cast_nullable_to_non_nullable
as int?,isAvailable: freezed == isAvailable ? _self.isAvailable : isAvailable // ignore: cast_nullable_to_non_nullable
as bool?,workstation: freezed == workstation ? _self.workstation : workstation // ignore: cast_nullable_to_non_nullable
as String?,stock: freezed == stock ? _self.stock : stock // ignore: cast_nullable_to_non_nullable
as MenuStockModel?,
  ));
}
/// Create a copy of MenuItemModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MenuStockModelCopyWith<$Res>? get stock {
    if (_self.stock == null) {
    return null;
  }

  return $MenuStockModelCopyWith<$Res>(_self.stock!, (value) {
    return _then(_self.copyWith(stock: value));
  });
}
}


/// @nodoc
@JsonSerializable()

class _MenuItemModel extends MenuItemModel {
   _MenuItemModel({@HiveField(1) required this.id, @HiveField(2) this.name = "", @HiveField(3) this.originalPrice = 0, @HiveField(4) this.discountedPrice = 0, @HiveField(5) this.description = "", @HiveField(6) this.mainCategory = "", @HiveField(7) this.subCategory = "", @HiveField(8)@JsonKey(name: 'imageUrl') this.imageURL = "", @HiveField(9) final  List<ToppingModel>? toppings = const [], @HiveField(10) final  List<AddonModel>? addons = const [], @HiveField(11) this.discountPercentage = 0, @HiveField(12) this.averageRating = 0, @HiveField(13) this.reviewCount = 0, @HiveField(14) this.isAvailable = true, @HiveField(15) this.workstation = "", @HiveField(16) this.stock = null}): _toppings = toppings,_addons = addons,super._();
  factory _MenuItemModel.fromJson(Map<String, dynamic> json) => _$MenuItemModelFromJson(json);

@override@HiveField(1) final  String id;
@override@JsonKey()@HiveField(2) final  String? name;
@override@JsonKey()@HiveField(3) final  int? originalPrice;
// Ubah menjadi int
@override@JsonKey()@HiveField(4) final  int? discountedPrice;
// Tambahkan field baru
@override@JsonKey()@HiveField(5) final  String? description;
@override@JsonKey()@HiveField(6) final  String? mainCategory;
// Ubah tipe data
@override@JsonKey()@HiveField(7) final  String? subCategory;
// Ubah tipe data
// @HiveField(6) MenuCategoryModel? category, // Ubah tipe data
// @HiveField(7) MenuSubCategoryModel? subCategory, // Ubah tipe data
@override@HiveField(8)@JsonKey(name: 'imageUrl') final  String? imageURL;
// Sesuaikan key JSON
 final  List<ToppingModel>? _toppings;
// Sesuaikan key JSON
@override@JsonKey()@HiveField(9) List<ToppingModel>? get toppings {
  final value = _toppings;
  if (value == null) return null;
  if (_toppings is EqualUnmodifiableListView) return _toppings;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

 final  List<AddonModel>? _addons;
@override@JsonKey()@HiveField(10) List<AddonModel>? get addons {
  final value = _addons;
  if (value == null) return null;
  if (_addons is EqualUnmodifiableListView) return _addons;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override@JsonKey()@HiveField(11) final  int? discountPercentage;
// Tambahkan fiel,d baru
@override@JsonKey()@HiveField(12) final  int? averageRating;
// Tambahkan field baru
@override@JsonKey()@HiveField(13) final  int? reviewCount;
// Tambahkan field baru
@override@JsonKey()@HiveField(14) final  bool? isAvailable;
// Tambahkan field baru
@override@JsonKey()@HiveField(15) final  String? workstation;
@override@JsonKey()@HiveField(16) final  MenuStockModel? stock;

/// Create a copy of MenuItemModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MenuItemModelCopyWith<_MenuItemModel> get copyWith => __$MenuItemModelCopyWithImpl<_MenuItemModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MenuItemModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MenuItemModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.originalPrice, originalPrice) || other.originalPrice == originalPrice)&&(identical(other.discountedPrice, discountedPrice) || other.discountedPrice == discountedPrice)&&(identical(other.description, description) || other.description == description)&&(identical(other.mainCategory, mainCategory) || other.mainCategory == mainCategory)&&(identical(other.subCategory, subCategory) || other.subCategory == subCategory)&&(identical(other.imageURL, imageURL) || other.imageURL == imageURL)&&const DeepCollectionEquality().equals(other._toppings, _toppings)&&const DeepCollectionEquality().equals(other._addons, _addons)&&(identical(other.discountPercentage, discountPercentage) || other.discountPercentage == discountPercentage)&&(identical(other.averageRating, averageRating) || other.averageRating == averageRating)&&(identical(other.reviewCount, reviewCount) || other.reviewCount == reviewCount)&&(identical(other.isAvailable, isAvailable) || other.isAvailable == isAvailable)&&(identical(other.workstation, workstation) || other.workstation == workstation)&&(identical(other.stock, stock) || other.stock == stock));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,originalPrice,discountedPrice,description,mainCategory,subCategory,imageURL,const DeepCollectionEquality().hash(_toppings),const DeepCollectionEquality().hash(_addons),discountPercentage,averageRating,reviewCount,isAvailable,workstation,stock);

@override
String toString() {
  return 'MenuItemModel(id: $id, name: $name, originalPrice: $originalPrice, discountedPrice: $discountedPrice, description: $description, mainCategory: $mainCategory, subCategory: $subCategory, imageURL: $imageURL, toppings: $toppings, addons: $addons, discountPercentage: $discountPercentage, averageRating: $averageRating, reviewCount: $reviewCount, isAvailable: $isAvailable, workstation: $workstation, stock: $stock)';
}


}

/// @nodoc
abstract mixin class _$MenuItemModelCopyWith<$Res> implements $MenuItemModelCopyWith<$Res> {
  factory _$MenuItemModelCopyWith(_MenuItemModel value, $Res Function(_MenuItemModel) _then) = __$MenuItemModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(1) String id,@HiveField(2) String? name,@HiveField(3) int? originalPrice,@HiveField(4) int? discountedPrice,@HiveField(5) String? description,@HiveField(6) String? mainCategory,@HiveField(7) String? subCategory,@HiveField(8)@JsonKey(name: 'imageUrl') String? imageURL,@HiveField(9) List<ToppingModel>? toppings,@HiveField(10) List<AddonModel>? addons,@HiveField(11) int? discountPercentage,@HiveField(12) int? averageRating,@HiveField(13) int? reviewCount,@HiveField(14) bool? isAvailable,@HiveField(15) String? workstation,@HiveField(16) MenuStockModel? stock
});


@override $MenuStockModelCopyWith<$Res>? get stock;

}
/// @nodoc
class __$MenuItemModelCopyWithImpl<$Res>
    implements _$MenuItemModelCopyWith<$Res> {
  __$MenuItemModelCopyWithImpl(this._self, this._then);

  final _MenuItemModel _self;
  final $Res Function(_MenuItemModel) _then;

/// Create a copy of MenuItemModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = freezed,Object? originalPrice = freezed,Object? discountedPrice = freezed,Object? description = freezed,Object? mainCategory = freezed,Object? subCategory = freezed,Object? imageURL = freezed,Object? toppings = freezed,Object? addons = freezed,Object? discountPercentage = freezed,Object? averageRating = freezed,Object? reviewCount = freezed,Object? isAvailable = freezed,Object? workstation = freezed,Object? stock = freezed,}) {
  return _then(_MenuItemModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,originalPrice: freezed == originalPrice ? _self.originalPrice : originalPrice // ignore: cast_nullable_to_non_nullable
as int?,discountedPrice: freezed == discountedPrice ? _self.discountedPrice : discountedPrice // ignore: cast_nullable_to_non_nullable
as int?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,mainCategory: freezed == mainCategory ? _self.mainCategory : mainCategory // ignore: cast_nullable_to_non_nullable
as String?,subCategory: freezed == subCategory ? _self.subCategory : subCategory // ignore: cast_nullable_to_non_nullable
as String?,imageURL: freezed == imageURL ? _self.imageURL : imageURL // ignore: cast_nullable_to_non_nullable
as String?,toppings: freezed == toppings ? _self._toppings : toppings // ignore: cast_nullable_to_non_nullable
as List<ToppingModel>?,addons: freezed == addons ? _self._addons : addons // ignore: cast_nullable_to_non_nullable
as List<AddonModel>?,discountPercentage: freezed == discountPercentage ? _self.discountPercentage : discountPercentage // ignore: cast_nullable_to_non_nullable
as int?,averageRating: freezed == averageRating ? _self.averageRating : averageRating // ignore: cast_nullable_to_non_nullable
as int?,reviewCount: freezed == reviewCount ? _self.reviewCount : reviewCount // ignore: cast_nullable_to_non_nullable
as int?,isAvailable: freezed == isAvailable ? _self.isAvailable : isAvailable // ignore: cast_nullable_to_non_nullable
as bool?,workstation: freezed == workstation ? _self.workstation : workstation // ignore: cast_nullable_to_non_nullable
as String?,stock: freezed == stock ? _self.stock : stock // ignore: cast_nullable_to_non_nullable
as MenuStockModel?,
  ));
}

/// Create a copy of MenuItemModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MenuStockModelCopyWith<$Res>? get stock {
    if (_self.stock == null) {
    return null;
  }

  return $MenuStockModelCopyWith<$Res>(_self.stock!, (value) {
    return _then(_self.copyWith(stock: value));
  });
}
}

// dart format on
