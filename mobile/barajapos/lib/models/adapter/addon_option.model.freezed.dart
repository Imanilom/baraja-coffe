// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'addon_option.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AddonOptionModel {
  @HiveField(0)
  String? get id;
  @HiveField(1)
  String? get label;
  @HiveField(2)
  bool? get isDefault;
  @HiveField(3)
  int? get price;

  /// Create a copy of AddonOptionModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $AddonOptionModelCopyWith<AddonOptionModel> get copyWith =>
      _$AddonOptionModelCopyWithImpl<AddonOptionModel>(
          this as AddonOptionModel, _$identity);

  /// Serializes this AddonOptionModel to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is AddonOptionModel &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.label, label) || other.label == label) &&
            (identical(other.isDefault, isDefault) ||
                other.isDefault == isDefault) &&
            (identical(other.price, price) || other.price == price));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, label, isDefault, price);

  @override
  String toString() {
    return 'AddonOptionModel(id: $id, label: $label, isDefault: $isDefault, price: $price)';
  }
}

/// @nodoc
abstract mixin class $AddonOptionModelCopyWith<$Res> {
  factory $AddonOptionModelCopyWith(
          AddonOptionModel value, $Res Function(AddonOptionModel) _then) =
      _$AddonOptionModelCopyWithImpl;
  @useResult
  $Res call(
      {@HiveField(0) String? id,
      @HiveField(1) String? label,
      @HiveField(2) bool? isDefault,
      @HiveField(3) int? price});
}

/// @nodoc
class _$AddonOptionModelCopyWithImpl<$Res>
    implements $AddonOptionModelCopyWith<$Res> {
  _$AddonOptionModelCopyWithImpl(this._self, this._then);

  final AddonOptionModel _self;
  final $Res Function(AddonOptionModel) _then;

  /// Create a copy of AddonOptionModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = freezed,
    Object? label = freezed,
    Object? isDefault = freezed,
    Object? price = freezed,
  }) {
    return _then(_self.copyWith(
      id: freezed == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String?,
      label: freezed == label
          ? _self.label
          : label // ignore: cast_nullable_to_non_nullable
              as String?,
      isDefault: freezed == isDefault
          ? _self.isDefault
          : isDefault // ignore: cast_nullable_to_non_nullable
              as bool?,
      price: freezed == price
          ? _self.price
          : price // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _AddonOptionModel implements AddonOptionModel {
  _AddonOptionModel(
      {@HiveField(0) this.id,
      @HiveField(1) this.label,
      @HiveField(2) this.isDefault,
      @HiveField(3) this.price});
  factory _AddonOptionModel.fromJson(Map<String, dynamic> json) =>
      _$AddonOptionModelFromJson(json);

  @override
  @HiveField(0)
  final String? id;
  @override
  @HiveField(1)
  final String? label;
  @override
  @HiveField(2)
  final bool? isDefault;
  @override
  @HiveField(3)
  final int? price;

  /// Create a copy of AddonOptionModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$AddonOptionModelCopyWith<_AddonOptionModel> get copyWith =>
      __$AddonOptionModelCopyWithImpl<_AddonOptionModel>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$AddonOptionModelToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _AddonOptionModel &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.label, label) || other.label == label) &&
            (identical(other.isDefault, isDefault) ||
                other.isDefault == isDefault) &&
            (identical(other.price, price) || other.price == price));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, label, isDefault, price);

  @override
  String toString() {
    return 'AddonOptionModel(id: $id, label: $label, isDefault: $isDefault, price: $price)';
  }
}

/// @nodoc
abstract mixin class _$AddonOptionModelCopyWith<$Res>
    implements $AddonOptionModelCopyWith<$Res> {
  factory _$AddonOptionModelCopyWith(
          _AddonOptionModel value, $Res Function(_AddonOptionModel) _then) =
      __$AddonOptionModelCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String? id,
      @HiveField(1) String? label,
      @HiveField(2) bool? isDefault,
      @HiveField(3) int? price});
}

/// @nodoc
class __$AddonOptionModelCopyWithImpl<$Res>
    implements _$AddonOptionModelCopyWith<$Res> {
  __$AddonOptionModelCopyWithImpl(this._self, this._then);

  final _AddonOptionModel _self;
  final $Res Function(_AddonOptionModel) _then;

  /// Create a copy of AddonOptionModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = freezed,
    Object? label = freezed,
    Object? isDefault = freezed,
    Object? price = freezed,
  }) {
    return _then(_AddonOptionModel(
      id: freezed == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String?,
      label: freezed == label
          ? _self.label
          : label // ignore: cast_nullable_to_non_nullable
              as String?,
      isDefault: freezed == isDefault
          ? _self.isDefault
          : isDefault // ignore: cast_nullable_to_non_nullable
              as bool?,
      price: freezed == price
          ? _self.price
          : price // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

// dart format on
