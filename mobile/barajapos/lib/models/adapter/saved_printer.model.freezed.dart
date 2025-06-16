// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'saved_printer.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SavedPrinterModel {
  @HiveField(0)
  String get name;
  @HiveField(1)
  String get id; // device.id.id
  @HiveField(2)
  String get role;

  /// Create a copy of SavedPrinterModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $SavedPrinterModelCopyWith<SavedPrinterModel> get copyWith =>
      _$SavedPrinterModelCopyWithImpl<SavedPrinterModel>(
          this as SavedPrinterModel, _$identity);

  /// Serializes this SavedPrinterModel to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is SavedPrinterModel &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.role, role) || other.role == role));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name, id, role);

  @override
  String toString() {
    return 'SavedPrinterModel(name: $name, id: $id, role: $role)';
  }
}

/// @nodoc
abstract mixin class $SavedPrinterModelCopyWith<$Res> {
  factory $SavedPrinterModelCopyWith(
          SavedPrinterModel value, $Res Function(SavedPrinterModel) _then) =
      _$SavedPrinterModelCopyWithImpl;
  @useResult
  $Res call(
      {@HiveField(0) String name,
      @HiveField(1) String id,
      @HiveField(2) String role});
}

/// @nodoc
class _$SavedPrinterModelCopyWithImpl<$Res>
    implements $SavedPrinterModelCopyWith<$Res> {
  _$SavedPrinterModelCopyWithImpl(this._self, this._then);

  final SavedPrinterModel _self;
  final $Res Function(SavedPrinterModel) _then;

  /// Create a copy of SavedPrinterModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? id = null,
    Object? role = null,
  }) {
    return _then(_self.copyWith(
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _self.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _SavedPrinterModel implements SavedPrinterModel {
  _SavedPrinterModel(
      {@HiveField(0) required this.name,
      @HiveField(1) required this.id,
      @HiveField(2) required this.role});
  factory _SavedPrinterModel.fromJson(Map<String, dynamic> json) =>
      _$SavedPrinterModelFromJson(json);

  @override
  @HiveField(0)
  final String name;
  @override
  @HiveField(1)
  final String id;
// device.id.id
  @override
  @HiveField(2)
  final String role;

  /// Create a copy of SavedPrinterModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$SavedPrinterModelCopyWith<_SavedPrinterModel> get copyWith =>
      __$SavedPrinterModelCopyWithImpl<_SavedPrinterModel>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$SavedPrinterModelToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _SavedPrinterModel &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.role, role) || other.role == role));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name, id, role);

  @override
  String toString() {
    return 'SavedPrinterModel(name: $name, id: $id, role: $role)';
  }
}

/// @nodoc
abstract mixin class _$SavedPrinterModelCopyWith<$Res>
    implements $SavedPrinterModelCopyWith<$Res> {
  factory _$SavedPrinterModelCopyWith(
          _SavedPrinterModel value, $Res Function(_SavedPrinterModel) _then) =
      __$SavedPrinterModelCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String name,
      @HiveField(1) String id,
      @HiveField(2) String role});
}

/// @nodoc
class __$SavedPrinterModelCopyWithImpl<$Res>
    implements _$SavedPrinterModelCopyWith<$Res> {
  __$SavedPrinterModelCopyWithImpl(this._self, this._then);

  final _SavedPrinterModel _self;
  final $Res Function(_SavedPrinterModel) _then;

  /// Create a copy of SavedPrinterModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? name = null,
    Object? id = null,
    Object? role = null,
  }) {
    return _then(_SavedPrinterModel(
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _self.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

// dart format on
