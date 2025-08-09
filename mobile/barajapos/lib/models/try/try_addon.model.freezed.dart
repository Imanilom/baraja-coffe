// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'try_addon.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$TryAddonModel {
  @HiveField(0)
  String? get id;
  @HiveField(1)
  String? get name;
  @HiveField(2)
  String? get type;
  @HiveField(3)
  List<AddonOptionModel>? get options;

  /// Create a copy of TryAddonModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $TryAddonModelCopyWith<TryAddonModel> get copyWith =>
      _$TryAddonModelCopyWithImpl<TryAddonModel>(
          this as TryAddonModel, _$identity);

  /// Serializes this TryAddonModel to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is TryAddonModel &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.type, type) || other.type == type) &&
            const DeepCollectionEquality().equals(other.options, options));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, type,
      const DeepCollectionEquality().hash(options));

  @override
  String toString() {
    return 'TryAddonModel(id: $id, name: $name, type: $type, options: $options)';
  }
}

/// @nodoc
abstract mixin class $TryAddonModelCopyWith<$Res> {
  factory $TryAddonModelCopyWith(
          TryAddonModel value, $Res Function(TryAddonModel) _then) =
      _$TryAddonModelCopyWithImpl;
  @useResult
  $Res call(
      {@HiveField(0) String? id,
      @HiveField(1) String? name,
      @HiveField(2) String? type,
      @HiveField(3) List<AddonOptionModel>? options});
}

/// @nodoc
class _$TryAddonModelCopyWithImpl<$Res>
    implements $TryAddonModelCopyWith<$Res> {
  _$TryAddonModelCopyWithImpl(this._self, this._then);

  final TryAddonModel _self;
  final $Res Function(TryAddonModel) _then;

  /// Create a copy of TryAddonModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = freezed,
    Object? name = freezed,
    Object? type = freezed,
    Object? options = freezed,
  }) {
    return _then(_self.copyWith(
      id: freezed == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String?,
      name: freezed == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      type: freezed == type
          ? _self.type
          : type // ignore: cast_nullable_to_non_nullable
              as String?,
      options: freezed == options
          ? _self.options
          : options // ignore: cast_nullable_to_non_nullable
              as List<AddonOptionModel>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _TryAddonModel implements TryAddonModel {
  _TryAddonModel(
      {@HiveField(0) this.id = '',
      @HiveField(1) this.name = '',
      @HiveField(2) this.type = '',
      @HiveField(3) final List<AddonOptionModel>? options})
      : _options = options;
  factory _TryAddonModel.fromJson(Map<String, dynamic> json) =>
      _$TryAddonModelFromJson(json);

  @override
  @JsonKey()
  @HiveField(0)
  final String? id;
  @override
  @JsonKey()
  @HiveField(1)
  final String? name;
  @override
  @JsonKey()
  @HiveField(2)
  final String? type;
  final List<AddonOptionModel>? _options;
  @override
  @HiveField(3)
  List<AddonOptionModel>? get options {
    final value = _options;
    if (value == null) return null;
    if (_options is EqualUnmodifiableListView) return _options;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  /// Create a copy of TryAddonModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$TryAddonModelCopyWith<_TryAddonModel> get copyWith =>
      __$TryAddonModelCopyWithImpl<_TryAddonModel>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$TryAddonModelToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _TryAddonModel &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.type, type) || other.type == type) &&
            const DeepCollectionEquality().equals(other._options, _options));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, type,
      const DeepCollectionEquality().hash(_options));

  @override
  String toString() {
    return 'TryAddonModel(id: $id, name: $name, type: $type, options: $options)';
  }
}

/// @nodoc
abstract mixin class _$TryAddonModelCopyWith<$Res>
    implements $TryAddonModelCopyWith<$Res> {
  factory _$TryAddonModelCopyWith(
          _TryAddonModel value, $Res Function(_TryAddonModel) _then) =
      __$TryAddonModelCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String? id,
      @HiveField(1) String? name,
      @HiveField(2) String? type,
      @HiveField(3) List<AddonOptionModel>? options});
}

/// @nodoc
class __$TryAddonModelCopyWithImpl<$Res>
    implements _$TryAddonModelCopyWith<$Res> {
  __$TryAddonModelCopyWithImpl(this._self, this._then);

  final _TryAddonModel _self;
  final $Res Function(_TryAddonModel) _then;

  /// Create a copy of TryAddonModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = freezed,
    Object? name = freezed,
    Object? type = freezed,
    Object? options = freezed,
  }) {
    return _then(_TryAddonModel(
      id: freezed == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String?,
      name: freezed == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      type: freezed == type
          ? _self.type
          : type // ignore: cast_nullable_to_non_nullable
              as String?,
      options: freezed == options
          ? _self._options
          : options // ignore: cast_nullable_to_non_nullable
              as List<AddonOptionModel>?,
    ));
  }
}

// dart format on
