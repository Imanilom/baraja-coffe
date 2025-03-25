// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'addon.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AddonModel {
  @HiveField(1)
  String? get id;
  @HiveField(2)
  String get name;
  @HiveField(3)
  String? get type;
  @HiveField(4)
  List<AddonOptionModel> get options;

  /// Create a copy of AddonModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $AddonModelCopyWith<AddonModel> get copyWith =>
      _$AddonModelCopyWithImpl<AddonModel>(this as AddonModel, _$identity);

  /// Serializes this AddonModel to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is AddonModel &&
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
    return 'AddonModel(id: $id, name: $name, type: $type, options: $options)';
  }
}

/// @nodoc
abstract mixin class $AddonModelCopyWith<$Res> {
  factory $AddonModelCopyWith(
          AddonModel value, $Res Function(AddonModel) _then) =
      _$AddonModelCopyWithImpl;
  @useResult
  $Res call(
      {@HiveField(1) String? id,
      @HiveField(2) String name,
      @HiveField(3) String? type,
      @HiveField(4) List<AddonOptionModel> options});
}

/// @nodoc
class _$AddonModelCopyWithImpl<$Res> implements $AddonModelCopyWith<$Res> {
  _$AddonModelCopyWithImpl(this._self, this._then);

  final AddonModel _self;
  final $Res Function(AddonModel) _then;

  /// Create a copy of AddonModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = freezed,
    Object? name = null,
    Object? type = freezed,
    Object? options = null,
  }) {
    return _then(_self.copyWith(
      id: freezed == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String?,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      type: freezed == type
          ? _self.type
          : type // ignore: cast_nullable_to_non_nullable
              as String?,
      options: null == options
          ? _self.options
          : options // ignore: cast_nullable_to_non_nullable
              as List<AddonOptionModel>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
@HiveField(0)
class _AddonModel implements AddonModel {
  _AddonModel(
      {@HiveField(1) this.id,
      @HiveField(2) required this.name,
      @HiveField(3) this.type,
      @HiveField(4) required final List<AddonOptionModel> options})
      : _options = options;
  factory _AddonModel.fromJson(Map<String, dynamic> json) =>
      _$AddonModelFromJson(json);

  @override
  @HiveField(1)
  final String? id;
  @override
  @HiveField(2)
  final String name;
  @override
  @HiveField(3)
  final String? type;
  final List<AddonOptionModel> _options;
  @override
  @HiveField(4)
  List<AddonOptionModel> get options {
    if (_options is EqualUnmodifiableListView) return _options;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_options);
  }

  /// Create a copy of AddonModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$AddonModelCopyWith<_AddonModel> get copyWith =>
      __$AddonModelCopyWithImpl<_AddonModel>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$AddonModelToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _AddonModel &&
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
    return 'AddonModel(id: $id, name: $name, type: $type, options: $options)';
  }
}

/// @nodoc
abstract mixin class _$AddonModelCopyWith<$Res>
    implements $AddonModelCopyWith<$Res> {
  factory _$AddonModelCopyWith(
          _AddonModel value, $Res Function(_AddonModel) _then) =
      __$AddonModelCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@HiveField(1) String? id,
      @HiveField(2) String name,
      @HiveField(3) String? type,
      @HiveField(4) List<AddonOptionModel> options});
}

/// @nodoc
class __$AddonModelCopyWithImpl<$Res> implements _$AddonModelCopyWith<$Res> {
  __$AddonModelCopyWithImpl(this._self, this._then);

  final _AddonModel _self;
  final $Res Function(_AddonModel) _then;

  /// Create a copy of AddonModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = freezed,
    Object? name = null,
    Object? type = freezed,
    Object? options = null,
  }) {
    return _then(_AddonModel(
      id: freezed == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String?,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      type: freezed == type
          ? _self.type
          : type // ignore: cast_nullable_to_non_nullable
              as String?,
      options: null == options
          ? _self._options
          : options // ignore: cast_nullable_to_non_nullable
              as List<AddonOptionModel>,
    ));
  }
}

// dart format on
