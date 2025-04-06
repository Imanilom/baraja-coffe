// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'order_item.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$OrderItemModel {
  @HiveField(0)
  MenuItemModel get menuItem;
  @HiveField(1)
  List<ToppingModel> get selectedToppings;
  @HiveField(2)
  List<AddonModel> get selectedAddons;
  @HiveField(3)
  int get quantity;

  /// Create a copy of OrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $OrderItemModelCopyWith<OrderItemModel> get copyWith =>
      _$OrderItemModelCopyWithImpl<OrderItemModel>(
          this as OrderItemModel, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is OrderItemModel &&
            (identical(other.menuItem, menuItem) ||
                other.menuItem == menuItem) &&
            const DeepCollectionEquality()
                .equals(other.selectedToppings, selectedToppings) &&
            const DeepCollectionEquality()
                .equals(other.selectedAddons, selectedAddons) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      menuItem,
      const DeepCollectionEquality().hash(selectedToppings),
      const DeepCollectionEquality().hash(selectedAddons),
      quantity);

  @override
  String toString() {
    return 'OrderItemModel(menuItem: $menuItem, selectedToppings: $selectedToppings, selectedAddons: $selectedAddons, quantity: $quantity)';
  }
}

/// @nodoc
abstract mixin class $OrderItemModelCopyWith<$Res> {
  factory $OrderItemModelCopyWith(
          OrderItemModel value, $Res Function(OrderItemModel) _then) =
      _$OrderItemModelCopyWithImpl;
  @useResult
  $Res call(
      {@HiveField(0) MenuItemModel menuItem,
      @HiveField(1) List<ToppingModel> selectedToppings,
      @HiveField(2) List<AddonModel> selectedAddons,
      @HiveField(3) int quantity});

  $MenuItemModelCopyWith<$Res> get menuItem;
}

/// @nodoc
class _$OrderItemModelCopyWithImpl<$Res>
    implements $OrderItemModelCopyWith<$Res> {
  _$OrderItemModelCopyWithImpl(this._self, this._then);

  final OrderItemModel _self;
  final $Res Function(OrderItemModel) _then;

  /// Create a copy of OrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? menuItem = null,
    Object? selectedToppings = null,
    Object? selectedAddons = null,
    Object? quantity = null,
  }) {
    return _then(_self.copyWith(
      menuItem: null == menuItem
          ? _self.menuItem
          : menuItem // ignore: cast_nullable_to_non_nullable
              as MenuItemModel,
      selectedToppings: null == selectedToppings
          ? _self.selectedToppings
          : selectedToppings // ignore: cast_nullable_to_non_nullable
              as List<ToppingModel>,
      selectedAddons: null == selectedAddons
          ? _self.selectedAddons
          : selectedAddons // ignore: cast_nullable_to_non_nullable
              as List<AddonModel>,
      quantity: null == quantity
          ? _self.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }

  /// Create a copy of OrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $MenuItemModelCopyWith<$Res> get menuItem {
    return $MenuItemModelCopyWith<$Res>(_self.menuItem, (value) {
      return _then(_self.copyWith(menuItem: value));
    });
  }
}

/// @nodoc

class _OrderItemModel extends OrderItemModel {
  _OrderItemModel(
      {@HiveField(0) required this.menuItem,
      @HiveField(1) final List<ToppingModel> selectedToppings = const [],
      @HiveField(2) final List<AddonModel> selectedAddons = const [],
      @HiveField(3) this.quantity = 1})
      : _selectedToppings = selectedToppings,
        _selectedAddons = selectedAddons,
        super._();

  @override
  @HiveField(0)
  final MenuItemModel menuItem;
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

  final List<AddonModel> _selectedAddons;
  @override
  @JsonKey()
  @HiveField(2)
  List<AddonModel> get selectedAddons {
    if (_selectedAddons is EqualUnmodifiableListView) return _selectedAddons;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_selectedAddons);
  }

  @override
  @JsonKey()
  @HiveField(3)
  final int quantity;

  /// Create a copy of OrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$OrderItemModelCopyWith<_OrderItemModel> get copyWith =>
      __$OrderItemModelCopyWithImpl<_OrderItemModel>(this, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _OrderItemModel &&
            (identical(other.menuItem, menuItem) ||
                other.menuItem == menuItem) &&
            const DeepCollectionEquality()
                .equals(other._selectedToppings, _selectedToppings) &&
            const DeepCollectionEquality()
                .equals(other._selectedAddons, _selectedAddons) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      menuItem,
      const DeepCollectionEquality().hash(_selectedToppings),
      const DeepCollectionEquality().hash(_selectedAddons),
      quantity);

  @override
  String toString() {
    return 'OrderItemModel(menuItem: $menuItem, selectedToppings: $selectedToppings, selectedAddons: $selectedAddons, quantity: $quantity)';
  }
}

/// @nodoc
abstract mixin class _$OrderItemModelCopyWith<$Res>
    implements $OrderItemModelCopyWith<$Res> {
  factory _$OrderItemModelCopyWith(
          _OrderItemModel value, $Res Function(_OrderItemModel) _then) =
      __$OrderItemModelCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@HiveField(0) MenuItemModel menuItem,
      @HiveField(1) List<ToppingModel> selectedToppings,
      @HiveField(2) List<AddonModel> selectedAddons,
      @HiveField(3) int quantity});

  @override
  $MenuItemModelCopyWith<$Res> get menuItem;
}

/// @nodoc
class __$OrderItemModelCopyWithImpl<$Res>
    implements _$OrderItemModelCopyWith<$Res> {
  __$OrderItemModelCopyWithImpl(this._self, this._then);

  final _OrderItemModel _self;
  final $Res Function(_OrderItemModel) _then;

  /// Create a copy of OrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? menuItem = null,
    Object? selectedToppings = null,
    Object? selectedAddons = null,
    Object? quantity = null,
  }) {
    return _then(_OrderItemModel(
      menuItem: null == menuItem
          ? _self.menuItem
          : menuItem // ignore: cast_nullable_to_non_nullable
              as MenuItemModel,
      selectedToppings: null == selectedToppings
          ? _self._selectedToppings
          : selectedToppings // ignore: cast_nullable_to_non_nullable
              as List<ToppingModel>,
      selectedAddons: null == selectedAddons
          ? _self._selectedAddons
          : selectedAddons // ignore: cast_nullable_to_non_nullable
              as List<AddonModel>,
      quantity: null == quantity
          ? _self.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }

  /// Create a copy of OrderItemModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $MenuItemModelCopyWith<$Res> get menuItem {
    return $MenuItemModelCopyWith<$Res>(_self.menuItem, (value) {
      return _then(_self.copyWith(menuItem: value));
    });
  }
}

// dart format on
