// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'try_order_item.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$TryOrderItemModel {
  @HiveField(0)
  TryMenuItemModel? get menuItem;
  @HiveField(1)
  List<ToppingModel> get selectedToppings;
  @HiveField(2)
  List<TryAddonModel>? get selectedAddons;
  @HiveField(3)
  int get quantity;

  /// Create a copy of TryOrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $TryOrderItemModelCopyWith<TryOrderItemModel> get copyWith =>
      _$TryOrderItemModelCopyWithImpl<TryOrderItemModel>(
          this as TryOrderItemModel, _$identity);

  /// Serializes this TryOrderItemModel to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is TryOrderItemModel &&
            (identical(other.menuItem, menuItem) ||
                other.menuItem == menuItem) &&
            const DeepCollectionEquality()
                .equals(other.selectedToppings, selectedToppings) &&
            const DeepCollectionEquality()
                .equals(other.selectedAddons, selectedAddons) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      menuItem,
      const DeepCollectionEquality().hash(selectedToppings),
      const DeepCollectionEquality().hash(selectedAddons),
      quantity);

  @override
  String toString() {
    return 'TryOrderItemModel(menuItem: $menuItem, selectedToppings: $selectedToppings, selectedAddons: $selectedAddons, quantity: $quantity)';
  }
}

/// @nodoc
abstract mixin class $TryOrderItemModelCopyWith<$Res> {
  factory $TryOrderItemModelCopyWith(
          TryOrderItemModel value, $Res Function(TryOrderItemModel) _then) =
      _$TryOrderItemModelCopyWithImpl;
  @useResult
  $Res call(
      {@HiveField(0) TryMenuItemModel? menuItem,
      @HiveField(1) List<ToppingModel> selectedToppings,
      @HiveField(2) List<TryAddonModel>? selectedAddons,
      @HiveField(3) int quantity});

  $TryMenuItemModelCopyWith<$Res>? get menuItem;
}

/// @nodoc
class _$TryOrderItemModelCopyWithImpl<$Res>
    implements $TryOrderItemModelCopyWith<$Res> {
  _$TryOrderItemModelCopyWithImpl(this._self, this._then);

  final TryOrderItemModel _self;
  final $Res Function(TryOrderItemModel) _then;

  /// Create a copy of TryOrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? menuItem = freezed,
    Object? selectedToppings = null,
    Object? selectedAddons = freezed,
    Object? quantity = null,
  }) {
    return _then(_self.copyWith(
      menuItem: freezed == menuItem
          ? _self.menuItem
          : menuItem // ignore: cast_nullable_to_non_nullable
              as TryMenuItemModel?,
      selectedToppings: null == selectedToppings
          ? _self.selectedToppings
          : selectedToppings // ignore: cast_nullable_to_non_nullable
              as List<ToppingModel>,
      selectedAddons: freezed == selectedAddons
          ? _self.selectedAddons
          : selectedAddons // ignore: cast_nullable_to_non_nullable
              as List<TryAddonModel>?,
      quantity: null == quantity
          ? _self.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }

  /// Create a copy of TryOrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $TryMenuItemModelCopyWith<$Res>? get menuItem {
    if (_self.menuItem == null) {
      return null;
    }

    return $TryMenuItemModelCopyWith<$Res>(_self.menuItem!, (value) {
      return _then(_self.copyWith(menuItem: value));
    });
  }
}

/// @nodoc
@JsonSerializable()
class _TryOrderItemModel extends TryOrderItemModel {
  _TryOrderItemModel(
      {@HiveField(0) this.menuItem,
      @HiveField(1) final List<ToppingModel> selectedToppings = const [],
      @HiveField(2) final List<TryAddonModel>? selectedAddons,
      @HiveField(3) this.quantity = 1})
      : _selectedToppings = selectedToppings,
        _selectedAddons = selectedAddons,
        super._();
  factory _TryOrderItemModel.fromJson(Map<String, dynamic> json) =>
      _$TryOrderItemModelFromJson(json);

  @override
  @HiveField(0)
  final TryMenuItemModel? menuItem;
  final List<ToppingModel> _selectedToppings;
  @override
  @JsonKey()
  @HiveField(1)
  List<ToppingModel> get selectedToppings {
    if (_selectedToppings is EqualUnmodifiableListView)
      return _selectedToppings;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_selectedToppings);
  }

  final List<TryAddonModel>? _selectedAddons;
  @override
  @HiveField(2)
  List<TryAddonModel>? get selectedAddons {
    final value = _selectedAddons;
    if (value == null) return null;
    if (_selectedAddons is EqualUnmodifiableListView) return _selectedAddons;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  @JsonKey()
  @HiveField(3)
  final int quantity;

  /// Create a copy of TryOrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$TryOrderItemModelCopyWith<_TryOrderItemModel> get copyWith =>
      __$TryOrderItemModelCopyWithImpl<_TryOrderItemModel>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$TryOrderItemModelToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _TryOrderItemModel &&
            (identical(other.menuItem, menuItem) ||
                other.menuItem == menuItem) &&
            const DeepCollectionEquality()
                .equals(other._selectedToppings, _selectedToppings) &&
            const DeepCollectionEquality()
                .equals(other._selectedAddons, _selectedAddons) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      menuItem,
      const DeepCollectionEquality().hash(_selectedToppings),
      const DeepCollectionEquality().hash(_selectedAddons),
      quantity);

  @override
  String toString() {
    return 'TryOrderItemModel(menuItem: $menuItem, selectedToppings: $selectedToppings, selectedAddons: $selectedAddons, quantity: $quantity)';
  }
}

/// @nodoc
abstract mixin class _$TryOrderItemModelCopyWith<$Res>
    implements $TryOrderItemModelCopyWith<$Res> {
  factory _$TryOrderItemModelCopyWith(
          _TryOrderItemModel value, $Res Function(_TryOrderItemModel) _then) =
      __$TryOrderItemModelCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@HiveField(0) TryMenuItemModel? menuItem,
      @HiveField(1) List<ToppingModel> selectedToppings,
      @HiveField(2) List<TryAddonModel>? selectedAddons,
      @HiveField(3) int quantity});

  @override
  $TryMenuItemModelCopyWith<$Res>? get menuItem;
}

/// @nodoc
class __$TryOrderItemModelCopyWithImpl<$Res>
    implements _$TryOrderItemModelCopyWith<$Res> {
  __$TryOrderItemModelCopyWithImpl(this._self, this._then);

  final _TryOrderItemModel _self;
  final $Res Function(_TryOrderItemModel) _then;

  /// Create a copy of TryOrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? menuItem = freezed,
    Object? selectedToppings = null,
    Object? selectedAddons = freezed,
    Object? quantity = null,
  }) {
    return _then(_TryOrderItemModel(
      menuItem: freezed == menuItem
          ? _self.menuItem
          : menuItem // ignore: cast_nullable_to_non_nullable
              as TryMenuItemModel?,
      selectedToppings: null == selectedToppings
          ? _self._selectedToppings
          : selectedToppings // ignore: cast_nullable_to_non_nullable
              as List<ToppingModel>,
      selectedAddons: freezed == selectedAddons
          ? _self._selectedAddons
          : selectedAddons // ignore: cast_nullable_to_non_nullable
              as List<TryAddonModel>?,
      quantity: null == quantity
          ? _self.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }

  /// Create a copy of TryOrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $TryMenuItemModelCopyWith<$Res>? get menuItem {
    if (_self.menuItem == null) {
      return null;
    }

    return $TryMenuItemModelCopyWith<$Res>(_self.menuItem!, (value) {
      return _then(_self.copyWith(menuItem: value));
    });
  }
}

// dart format on
