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
  @HiveField(1)
  @JsonKey(name: '_id')
  String get id;
  @HiveField(2)
  String? get name;
  @HiveField(3)
  int? get price;
  @HiveField(4)
  String? get description;
  @HiveField(5)
  @JsonKey(name: 'category')
  List<String>? get categories;
  @HiveField(6)
  String? get imageURL;
  @HiveField(7)
  List<ToppingModel>? get toppings;
  @HiveField(8)
  List<AddonModel>? get addons;

  /// Create a copy of MenuItemModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $MenuItemModelCopyWith<MenuItemModel> get copyWith =>
      _$MenuItemModelCopyWithImpl<MenuItemModel>(
          this as MenuItemModel, _$identity);

  /// Serializes this MenuItemModel to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is MenuItemModel &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.description, description) ||
                other.description == description) &&
            const DeepCollectionEquality()
                .equals(other.categories, categories) &&
            (identical(other.imageURL, imageURL) ||
                other.imageURL == imageURL) &&
            const DeepCollectionEquality().equals(other.toppings, toppings) &&
            const DeepCollectionEquality().equals(other.addons, addons));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      name,
      price,
      description,
      const DeepCollectionEquality().hash(categories),
      imageURL,
      const DeepCollectionEquality().hash(toppings),
      const DeepCollectionEquality().hash(addons));

  @override
  String toString() {
    return 'MenuItemModel(id: $id, name: $name, price: $price, description: $description, categories: $categories, imageURL: $imageURL, toppings: $toppings, addons: $addons)';
  }
}

/// @nodoc
abstract mixin class $MenuItemModelCopyWith<$Res> {
  factory $MenuItemModelCopyWith(
          MenuItemModel value, $Res Function(MenuItemModel) _then) =
      _$MenuItemModelCopyWithImpl;
  @useResult
  $Res call(
      {@HiveField(1) @JsonKey(name: '_id') String id,
      @HiveField(2) String? name,
      @HiveField(3) int? price,
      @HiveField(4) String? description,
      @HiveField(5) @JsonKey(name: 'category') List<String>? categories,
      @HiveField(6) String? imageURL,
      @HiveField(7) List<ToppingModel>? toppings,
      @HiveField(8) List<AddonModel>? addons});
}

/// @nodoc
class _$MenuItemModelCopyWithImpl<$Res>
    implements $MenuItemModelCopyWith<$Res> {
  _$MenuItemModelCopyWithImpl(this._self, this._then);

  final MenuItemModel _self;
  final $Res Function(MenuItemModel) _then;

  /// Create a copy of MenuItemModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = freezed,
    Object? price = freezed,
    Object? description = freezed,
    Object? categories = freezed,
    Object? imageURL = freezed,
    Object? toppings = freezed,
    Object? addons = freezed,
  }) {
    return _then(_self.copyWith(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: freezed == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      price: freezed == price
          ? _self.price
          : price // ignore: cast_nullable_to_non_nullable
              as int?,
      description: freezed == description
          ? _self.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      categories: freezed == categories
          ? _self.categories
          : categories // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      imageURL: freezed == imageURL
          ? _self.imageURL
          : imageURL // ignore: cast_nullable_to_non_nullable
              as String?,
      toppings: freezed == toppings
          ? _self.toppings
          : toppings // ignore: cast_nullable_to_non_nullable
              as List<ToppingModel>?,
      addons: freezed == addons
          ? _self.addons
          : addons // ignore: cast_nullable_to_non_nullable
              as List<AddonModel>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _MenuItemModel implements MenuItemModel {
  _MenuItemModel(
      {@HiveField(1) @JsonKey(name: '_id') required this.id,
      @HiveField(2) this.name,
      @HiveField(3) this.price,
      @HiveField(4) this.description,
      @HiveField(5) @JsonKey(name: 'category') final List<String>? categories,
      @HiveField(6) this.imageURL,
      @HiveField(7) final List<ToppingModel>? toppings,
      @HiveField(8) final List<AddonModel>? addons})
      : _categories = categories,
        _toppings = toppings,
        _addons = addons;
  factory _MenuItemModel.fromJson(Map<String, dynamic> json) =>
      _$MenuItemModelFromJson(json);

  @override
  @HiveField(1)
  @JsonKey(name: '_id')
  final String id;
  @override
  @HiveField(2)
  final String? name;
  @override
  @HiveField(3)
  final int? price;
  @override
  @HiveField(4)
  final String? description;
  final List<String>? _categories;
  @override
  @HiveField(5)
  @JsonKey(name: 'category')
  List<String>? get categories {
    final value = _categories;
    if (value == null) return null;
    if (_categories is EqualUnmodifiableListView) return _categories;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  @HiveField(6)
  final String? imageURL;
  final List<ToppingModel>? _toppings;
  @override
  @HiveField(7)
  List<ToppingModel>? get toppings {
    final value = _toppings;
    if (value == null) return null;
    if (_toppings is EqualUnmodifiableListView) return _toppings;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final List<AddonModel>? _addons;
  @override
  @HiveField(8)
  List<AddonModel>? get addons {
    final value = _addons;
    if (value == null) return null;
    if (_addons is EqualUnmodifiableListView) return _addons;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  /// Create a copy of MenuItemModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$MenuItemModelCopyWith<_MenuItemModel> get copyWith =>
      __$MenuItemModelCopyWithImpl<_MenuItemModel>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$MenuItemModelToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _MenuItemModel &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.description, description) ||
                other.description == description) &&
            const DeepCollectionEquality()
                .equals(other._categories, _categories) &&
            (identical(other.imageURL, imageURL) ||
                other.imageURL == imageURL) &&
            const DeepCollectionEquality().equals(other._toppings, _toppings) &&
            const DeepCollectionEquality().equals(other._addons, _addons));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      name,
      price,
      description,
      const DeepCollectionEquality().hash(_categories),
      imageURL,
      const DeepCollectionEquality().hash(_toppings),
      const DeepCollectionEquality().hash(_addons));

  @override
  String toString() {
    return 'MenuItemModel(id: $id, name: $name, price: $price, description: $description, categories: $categories, imageURL: $imageURL, toppings: $toppings, addons: $addons)';
  }
}

/// @nodoc
abstract mixin class _$MenuItemModelCopyWith<$Res>
    implements $MenuItemModelCopyWith<$Res> {
  factory _$MenuItemModelCopyWith(
          _MenuItemModel value, $Res Function(_MenuItemModel) _then) =
      __$MenuItemModelCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@HiveField(1) @JsonKey(name: '_id') String id,
      @HiveField(2) String? name,
      @HiveField(3) int? price,
      @HiveField(4) String? description,
      @HiveField(5) @JsonKey(name: 'category') List<String>? categories,
      @HiveField(6) String? imageURL,
      @HiveField(7) List<ToppingModel>? toppings,
      @HiveField(8) List<AddonModel>? addons});
}

/// @nodoc
class __$MenuItemModelCopyWithImpl<$Res>
    implements _$MenuItemModelCopyWith<$Res> {
  __$MenuItemModelCopyWithImpl(this._self, this._then);

  final _MenuItemModel _self;
  final $Res Function(_MenuItemModel) _then;

  /// Create a copy of MenuItemModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = null,
    Object? name = freezed,
    Object? price = freezed,
    Object? description = freezed,
    Object? categories = freezed,
    Object? imageURL = freezed,
    Object? toppings = freezed,
    Object? addons = freezed,
  }) {
    return _then(_MenuItemModel(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: freezed == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      price: freezed == price
          ? _self.price
          : price // ignore: cast_nullable_to_non_nullable
              as int?,
      description: freezed == description
          ? _self.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      categories: freezed == categories
          ? _self._categories
          : categories // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      imageURL: freezed == imageURL
          ? _self.imageURL
          : imageURL // ignore: cast_nullable_to_non_nullable
              as String?,
      toppings: freezed == toppings
          ? _self._toppings
          : toppings // ignore: cast_nullable_to_non_nullable
              as List<ToppingModel>?,
      addons: freezed == addons
          ? _self._addons
          : addons // ignore: cast_nullable_to_non_nullable
              as List<AddonModel>?,
    ));
  }
}

// dart format on
