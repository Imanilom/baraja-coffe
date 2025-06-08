// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'try_order_detail.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$TryOrderDetailModel {
  @HiveField(0)
  @JsonKey(name: 'userId')
  String? get customerId;
  @HiveField(1)
  String? get customerName;
  @HiveField(2)
  String? get cashierId;
  @HiveField(3)
  String? get phoneNumber;
  @HiveField(4)
  List<TryOrderItemModel> get items;
  @HiveField(5)
  String get orderType;
  @HiveField(6)
  String? get deliveryAddress;
  @HiveField(7)
  String? get tableNumber;
  @HiveField(8)
  String? get paymentMethod;
  @HiveField(9)
  String? get status;
  @HiveField(10)
  double? get totalPrice;

  /// Create a copy of TryOrderDetailModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $TryOrderDetailModelCopyWith<TryOrderDetailModel> get copyWith =>
      _$TryOrderDetailModelCopyWithImpl<TryOrderDetailModel>(
          this as TryOrderDetailModel, _$identity);

  /// Serializes this TryOrderDetailModel to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is TryOrderDetailModel &&
            (identical(other.customerId, customerId) ||
                other.customerId == customerId) &&
            (identical(other.customerName, customerName) ||
                other.customerName == customerName) &&
            (identical(other.cashierId, cashierId) ||
                other.cashierId == cashierId) &&
            (identical(other.phoneNumber, phoneNumber) ||
                other.phoneNumber == phoneNumber) &&
            const DeepCollectionEquality().equals(other.items, items) &&
            (identical(other.orderType, orderType) ||
                other.orderType == orderType) &&
            (identical(other.deliveryAddress, deliveryAddress) ||
                other.deliveryAddress == deliveryAddress) &&
            (identical(other.tableNumber, tableNumber) ||
                other.tableNumber == tableNumber) &&
            (identical(other.paymentMethod, paymentMethod) ||
                other.paymentMethod == paymentMethod) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.totalPrice, totalPrice) ||
                other.totalPrice == totalPrice));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      customerId,
      customerName,
      cashierId,
      phoneNumber,
      const DeepCollectionEquality().hash(items),
      orderType,
      deliveryAddress,
      tableNumber,
      paymentMethod,
      status,
      totalPrice);

  @override
  String toString() {
    return 'TryOrderDetailModel(customerId: $customerId, customerName: $customerName, cashierId: $cashierId, phoneNumber: $phoneNumber, items: $items, orderType: $orderType, deliveryAddress: $deliveryAddress, tableNumber: $tableNumber, paymentMethod: $paymentMethod, status: $status, totalPrice: $totalPrice)';
  }
}

/// @nodoc
abstract mixin class $TryOrderDetailModelCopyWith<$Res> {
  factory $TryOrderDetailModelCopyWith(
          TryOrderDetailModel value, $Res Function(TryOrderDetailModel) _then) =
      _$TryOrderDetailModelCopyWithImpl;
  @useResult
  $Res call(
      {@HiveField(0) @JsonKey(name: 'userId') String? customerId,
      @HiveField(1) String? customerName,
      @HiveField(2) String? cashierId,
      @HiveField(3) String? phoneNumber,
      @HiveField(4) List<TryOrderItemModel> items,
      @HiveField(5) String orderType,
      @HiveField(6) String? deliveryAddress,
      @HiveField(7) String? tableNumber,
      @HiveField(8) String? paymentMethod,
      @HiveField(9) String? status,
      @HiveField(10) double? totalPrice});
}

/// @nodoc
class _$TryOrderDetailModelCopyWithImpl<$Res>
    implements $TryOrderDetailModelCopyWith<$Res> {
  _$TryOrderDetailModelCopyWithImpl(this._self, this._then);

  final TryOrderDetailModel _self;
  final $Res Function(TryOrderDetailModel) _then;

  /// Create a copy of TryOrderDetailModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? customerId = freezed,
    Object? customerName = freezed,
    Object? cashierId = freezed,
    Object? phoneNumber = freezed,
    Object? items = null,
    Object? orderType = null,
    Object? deliveryAddress = freezed,
    Object? tableNumber = freezed,
    Object? paymentMethod = freezed,
    Object? status = freezed,
    Object? totalPrice = freezed,
  }) {
    return _then(_self.copyWith(
      customerId: freezed == customerId
          ? _self.customerId
          : customerId // ignore: cast_nullable_to_non_nullable
              as String?,
      customerName: freezed == customerName
          ? _self.customerName
          : customerName // ignore: cast_nullable_to_non_nullable
              as String?,
      cashierId: freezed == cashierId
          ? _self.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String?,
      phoneNumber: freezed == phoneNumber
          ? _self.phoneNumber
          : phoneNumber // ignore: cast_nullable_to_non_nullable
              as String?,
      items: null == items
          ? _self.items
          : items // ignore: cast_nullable_to_non_nullable
              as List<TryOrderItemModel>,
      orderType: null == orderType
          ? _self.orderType
          : orderType // ignore: cast_nullable_to_non_nullable
              as String,
      deliveryAddress: freezed == deliveryAddress
          ? _self.deliveryAddress
          : deliveryAddress // ignore: cast_nullable_to_non_nullable
              as String?,
      tableNumber: freezed == tableNumber
          ? _self.tableNumber
          : tableNumber // ignore: cast_nullable_to_non_nullable
              as String?,
      paymentMethod: freezed == paymentMethod
          ? _self.paymentMethod
          : paymentMethod // ignore: cast_nullable_to_non_nullable
              as String?,
      status: freezed == status
          ? _self.status
          : status // ignore: cast_nullable_to_non_nullable
              as String?,
      totalPrice: freezed == totalPrice
          ? _self.totalPrice
          : totalPrice // ignore: cast_nullable_to_non_nullable
              as double?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _TryOrderDetailModel implements TryOrderDetailModel {
  _TryOrderDetailModel(
      {@HiveField(0) @JsonKey(name: 'userId') this.customerId,
      @HiveField(1) this.customerName,
      @HiveField(2) this.cashierId,
      @HiveField(3) this.phoneNumber,
      @HiveField(4) final List<TryOrderItemModel> items = const [],
      @HiveField(5) required this.orderType,
      @HiveField(6) this.deliveryAddress,
      @HiveField(7) this.tableNumber,
      @HiveField(8) this.paymentMethod,
      @HiveField(9) this.status,
      @HiveField(10) this.totalPrice})
      : _items = items;
  factory _TryOrderDetailModel.fromJson(Map<String, dynamic> json) =>
      _$TryOrderDetailModelFromJson(json);

  @override
  @HiveField(0)
  @JsonKey(name: 'userId')
  final String? customerId;
  @override
  @HiveField(1)
  final String? customerName;
  @override
  @HiveField(2)
  final String? cashierId;
  @override
  @HiveField(3)
  final String? phoneNumber;
  final List<TryOrderItemModel> _items;
  @override
  @JsonKey()
  @HiveField(4)
  List<TryOrderItemModel> get items {
    if (_items is EqualUnmodifiableListView) return _items;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_items);
  }

  @override
  @HiveField(5)
  final String orderType;
  @override
  @HiveField(6)
  final String? deliveryAddress;
  @override
  @HiveField(7)
  final String? tableNumber;
  @override
  @HiveField(8)
  final String? paymentMethod;
  @override
  @HiveField(9)
  final String? status;
  @override
  @HiveField(10)
  final double? totalPrice;

  /// Create a copy of TryOrderDetailModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$TryOrderDetailModelCopyWith<_TryOrderDetailModel> get copyWith =>
      __$TryOrderDetailModelCopyWithImpl<_TryOrderDetailModel>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$TryOrderDetailModelToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _TryOrderDetailModel &&
            (identical(other.customerId, customerId) ||
                other.customerId == customerId) &&
            (identical(other.customerName, customerName) ||
                other.customerName == customerName) &&
            (identical(other.cashierId, cashierId) ||
                other.cashierId == cashierId) &&
            (identical(other.phoneNumber, phoneNumber) ||
                other.phoneNumber == phoneNumber) &&
            const DeepCollectionEquality().equals(other._items, _items) &&
            (identical(other.orderType, orderType) ||
                other.orderType == orderType) &&
            (identical(other.deliveryAddress, deliveryAddress) ||
                other.deliveryAddress == deliveryAddress) &&
            (identical(other.tableNumber, tableNumber) ||
                other.tableNumber == tableNumber) &&
            (identical(other.paymentMethod, paymentMethod) ||
                other.paymentMethod == paymentMethod) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.totalPrice, totalPrice) ||
                other.totalPrice == totalPrice));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      customerId,
      customerName,
      cashierId,
      phoneNumber,
      const DeepCollectionEquality().hash(_items),
      orderType,
      deliveryAddress,
      tableNumber,
      paymentMethod,
      status,
      totalPrice);

  @override
  String toString() {
    return 'TryOrderDetailModel(customerId: $customerId, customerName: $customerName, cashierId: $cashierId, phoneNumber: $phoneNumber, items: $items, orderType: $orderType, deliveryAddress: $deliveryAddress, tableNumber: $tableNumber, paymentMethod: $paymentMethod, status: $status, totalPrice: $totalPrice)';
  }
}

/// @nodoc
abstract mixin class _$TryOrderDetailModelCopyWith<$Res>
    implements $TryOrderDetailModelCopyWith<$Res> {
  factory _$TryOrderDetailModelCopyWith(_TryOrderDetailModel value,
          $Res Function(_TryOrderDetailModel) _then) =
      __$TryOrderDetailModelCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@HiveField(0) @JsonKey(name: 'userId') String? customerId,
      @HiveField(1) String? customerName,
      @HiveField(2) String? cashierId,
      @HiveField(3) String? phoneNumber,
      @HiveField(4) List<TryOrderItemModel> items,
      @HiveField(5) String orderType,
      @HiveField(6) String? deliveryAddress,
      @HiveField(7) String? tableNumber,
      @HiveField(8) String? paymentMethod,
      @HiveField(9) String? status,
      @HiveField(10) double? totalPrice});
}

/// @nodoc
class __$TryOrderDetailModelCopyWithImpl<$Res>
    implements _$TryOrderDetailModelCopyWith<$Res> {
  __$TryOrderDetailModelCopyWithImpl(this._self, this._then);

  final _TryOrderDetailModel _self;
  final $Res Function(_TryOrderDetailModel) _then;

  /// Create a copy of TryOrderDetailModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? customerId = freezed,
    Object? customerName = freezed,
    Object? cashierId = freezed,
    Object? phoneNumber = freezed,
    Object? items = null,
    Object? orderType = null,
    Object? deliveryAddress = freezed,
    Object? tableNumber = freezed,
    Object? paymentMethod = freezed,
    Object? status = freezed,
    Object? totalPrice = freezed,
  }) {
    return _then(_TryOrderDetailModel(
      customerId: freezed == customerId
          ? _self.customerId
          : customerId // ignore: cast_nullable_to_non_nullable
              as String?,
      customerName: freezed == customerName
          ? _self.customerName
          : customerName // ignore: cast_nullable_to_non_nullable
              as String?,
      cashierId: freezed == cashierId
          ? _self.cashierId
          : cashierId // ignore: cast_nullable_to_non_nullable
              as String?,
      phoneNumber: freezed == phoneNumber
          ? _self.phoneNumber
          : phoneNumber // ignore: cast_nullable_to_non_nullable
              as String?,
      items: null == items
          ? _self._items
          : items // ignore: cast_nullable_to_non_nullable
              as List<TryOrderItemModel>,
      orderType: null == orderType
          ? _self.orderType
          : orderType // ignore: cast_nullable_to_non_nullable
              as String,
      deliveryAddress: freezed == deliveryAddress
          ? _self.deliveryAddress
          : deliveryAddress // ignore: cast_nullable_to_non_nullable
              as String?,
      tableNumber: freezed == tableNumber
          ? _self.tableNumber
          : tableNumber // ignore: cast_nullable_to_non_nullable
              as String?,
      paymentMethod: freezed == paymentMethod
          ? _self.paymentMethod
          : paymentMethod // ignore: cast_nullable_to_non_nullable
              as String?,
      status: freezed == status
          ? _self.status
          : status // ignore: cast_nullable_to_non_nullable
              as String?,
      totalPrice: freezed == totalPrice
          ? _self.totalPrice
          : totalPrice // ignore: cast_nullable_to_non_nullable
              as double?,
    ));
  }
}

// dart format on
