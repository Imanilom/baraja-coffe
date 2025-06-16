// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'try_menu_item.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$TryMenuItemModel {
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

  /// Create a copy of TryMenuItemModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $TryMenuItemModelCopyWith<TryMenuItemModel> get copyWith =>
      _$TryMenuItemModelCopyWithImpl<TryMenuItemModel>(
          this as TryMenuItemModel, _$identity);

  /// Serializes this TryMenuItemModel to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is TryMenuItemModel &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.description, description) ||
                other.description == description) &&
            const DeepCollectionEquality()
                .equals(other.categories, categories) &&
            (identical(other.imageURL, imageURL) ||
                other.imageURL == imageURL));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, price, description,
      const DeepCollectionEquality().hash(categories), imageURL);

  @override
  String toString() {
    return 'TryMenuItemModel(id: $id, name: $name, price: $price, description: $description, categories: $categories, imageURL: $imageURL)';
  }
}

/// @nodoc
abstract mixin class $TryMenuItemModelCopyWith<$Res> {
  factory $TryMenuItemModelCopyWith(
          TryMenuItemModel value, $Res Function(TryMenuItemModel) _then) =
      _$TryMenuItemModelCopyWithImpl;
  @useResult
  $Res call(
      {@HiveField(1) @JsonKey(name: '_id') String id,
      @HiveField(2) String? name,
      @HiveField(3) int? price,
      @HiveField(4) String? description,
      @HiveField(5) @JsonKey(name: 'category') List<String>? categories,
      @HiveField(6) String? imageURL});
}

/// @nodoc
class _$TryMenuItemModelCopyWithImpl<$Res>
    implements $TryMenuItemModelCopyWith<$Res> {
  _$TryMenuItemModelCopyWithImpl(this._self, this._then);

  final TryMenuItemModel _self;
  final $Res Function(TryMenuItemModel) _then;

  /// Create a copy of TryMenuItemModel
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
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _TryMenuItemModel implements TryMenuItemModel {
  _TryMenuItemModel(
      {@HiveField(1) @JsonKey(name: '_id') required this.id,
      @HiveField(2) this.name = '',
      @HiveField(3) this.price = 0,
      @HiveField(4) this.description = '',
      @HiveField(5)
      @JsonKey(name: 'category')
      final List<String>? categories = const [],
      @HiveField(6) this.imageURL = ''})
      : _categories = categories;
  factory _TryMenuItemModel.fromJson(Map<String, dynamic> json) =>
      _$TryMenuItemModelFromJson(json);

  @override
  @HiveField(1)
  @JsonKey(name: '_id')
  final String id;
  @override
  @JsonKey()
  @HiveField(2)
  final String? name;
  @override
  @JsonKey()
  @HiveField(3)
  final int? price;
  @override
  @JsonKey()
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
  @JsonKey()
  @HiveField(6)
  final String? imageURL;

  /// Create a copy of TryMenuItemModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$TryMenuItemModelCopyWith<_TryMenuItemModel> get copyWith =>
      __$TryMenuItemModelCopyWithImpl<_TryMenuItemModel>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$TryMenuItemModelToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _TryMenuItemModel &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.description, description) ||
                other.description == description) &&
            const DeepCollectionEquality()
                .equals(other._categories, _categories) &&
            (identical(other.imageURL, imageURL) ||
                other.imageURL == imageURL));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, price, description,
      const DeepCollectionEquality().hash(_categories), imageURL);

  @override
  String toString() {
    return 'TryMenuItemModel(id: $id, name: $name, price: $price, description: $description, categories: $categories, imageURL: $imageURL)';
  }
}

/// @nodoc
abstract mixin class _$TryMenuItemModelCopyWith<$Res>
    implements $TryMenuItemModelCopyWith<$Res> {
  factory _$TryMenuItemModelCopyWith(
          _TryMenuItemModel value, $Res Function(_TryMenuItemModel) _then) =
      __$TryMenuItemModelCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@HiveField(1) @JsonKey(name: '_id') String id,
      @HiveField(2) String? name,
      @HiveField(3) int? price,
      @HiveField(4) String? description,
      @HiveField(5) @JsonKey(name: 'category') List<String>? categories,
      @HiveField(6) String? imageURL});
}

/// @nodoc
class __$TryMenuItemModelCopyWithImpl<$Res>
    implements _$TryMenuItemModelCopyWith<$Res> {
  __$TryMenuItemModelCopyWithImpl(this._self, this._then);

  final _TryMenuItemModel _self;
  final $Res Function(_TryMenuItemModel) _then;

  /// Create a copy of TryMenuItemModel
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
  }) {
    return _then(_TryMenuItemModel(
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
    ));
  }
}

// dart format on
