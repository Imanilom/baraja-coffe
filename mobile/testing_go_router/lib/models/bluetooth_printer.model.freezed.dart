// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'bluetooth_printer.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$BluetoothPrinterModel {

@HiveField(0) String get name;@HiveField(1) String get address;//mac or ip
@HiveField(2) String? get connectionType;// 'wifi' or 'bluetooth'
@HiveField(3) bool get isKitchenPrinter;@HiveField(4) bool get isBarPrinter;@HiveField(5) String get paperSize;@HiveField(6) int get kitchenCopies;@HiveField(7) int get barCopies;
/// Create a copy of BluetoothPrinterModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BluetoothPrinterModelCopyWith<BluetoothPrinterModel> get copyWith => _$BluetoothPrinterModelCopyWithImpl<BluetoothPrinterModel>(this as BluetoothPrinterModel, _$identity);

  /// Serializes this BluetoothPrinterModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BluetoothPrinterModel&&(identical(other.name, name) || other.name == name)&&(identical(other.address, address) || other.address == address)&&(identical(other.connectionType, connectionType) || other.connectionType == connectionType)&&(identical(other.isKitchenPrinter, isKitchenPrinter) || other.isKitchenPrinter == isKitchenPrinter)&&(identical(other.isBarPrinter, isBarPrinter) || other.isBarPrinter == isBarPrinter)&&(identical(other.paperSize, paperSize) || other.paperSize == paperSize)&&(identical(other.kitchenCopies, kitchenCopies) || other.kitchenCopies == kitchenCopies)&&(identical(other.barCopies, barCopies) || other.barCopies == barCopies));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,address,connectionType,isKitchenPrinter,isBarPrinter,paperSize,kitchenCopies,barCopies);

@override
String toString() {
  return 'BluetoothPrinterModel(name: $name, address: $address, connectionType: $connectionType, isKitchenPrinter: $isKitchenPrinter, isBarPrinter: $isBarPrinter, paperSize: $paperSize, kitchenCopies: $kitchenCopies, barCopies: $barCopies)';
}


}

/// @nodoc
abstract mixin class $BluetoothPrinterModelCopyWith<$Res>  {
  factory $BluetoothPrinterModelCopyWith(BluetoothPrinterModel value, $Res Function(BluetoothPrinterModel) _then) = _$BluetoothPrinterModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String name,@HiveField(1) String address,@HiveField(2) String? connectionType,@HiveField(3) bool isKitchenPrinter,@HiveField(4) bool isBarPrinter,@HiveField(5) String paperSize,@HiveField(6) int kitchenCopies,@HiveField(7) int barCopies
});




}
/// @nodoc
class _$BluetoothPrinterModelCopyWithImpl<$Res>
    implements $BluetoothPrinterModelCopyWith<$Res> {
  _$BluetoothPrinterModelCopyWithImpl(this._self, this._then);

  final BluetoothPrinterModel _self;
  final $Res Function(BluetoothPrinterModel) _then;

/// Create a copy of BluetoothPrinterModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? name = null,Object? address = null,Object? connectionType = freezed,Object? isKitchenPrinter = null,Object? isBarPrinter = null,Object? paperSize = null,Object? kitchenCopies = null,Object? barCopies = null,}) {
  return _then(_self.copyWith(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,connectionType: freezed == connectionType ? _self.connectionType : connectionType // ignore: cast_nullable_to_non_nullable
as String?,isKitchenPrinter: null == isKitchenPrinter ? _self.isKitchenPrinter : isKitchenPrinter // ignore: cast_nullable_to_non_nullable
as bool,isBarPrinter: null == isBarPrinter ? _self.isBarPrinter : isBarPrinter // ignore: cast_nullable_to_non_nullable
as bool,paperSize: null == paperSize ? _self.paperSize : paperSize // ignore: cast_nullable_to_non_nullable
as String,kitchenCopies: null == kitchenCopies ? _self.kitchenCopies : kitchenCopies // ignore: cast_nullable_to_non_nullable
as int,barCopies: null == barCopies ? _self.barCopies : barCopies // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _BluetoothPrinterModel implements BluetoothPrinterModel {
   _BluetoothPrinterModel({@HiveField(0) required this.name, @HiveField(1) required this.address, @HiveField(2) this.connectionType, @HiveField(3) this.isKitchenPrinter = false, @HiveField(4) this.isBarPrinter = true, @HiveField(5) this.paperSize = 'mm58', @HiveField(6) this.kitchenCopies = 1, @HiveField(7) this.barCopies = 1});
  factory _BluetoothPrinterModel.fromJson(Map<String, dynamic> json) => _$BluetoothPrinterModelFromJson(json);

@override@HiveField(0) final  String name;
@override@HiveField(1) final  String address;
//mac or ip
@override@HiveField(2) final  String? connectionType;
// 'wifi' or 'bluetooth'
@override@JsonKey()@HiveField(3) final  bool isKitchenPrinter;
@override@JsonKey()@HiveField(4) final  bool isBarPrinter;
@override@JsonKey()@HiveField(5) final  String paperSize;
@override@JsonKey()@HiveField(6) final  int kitchenCopies;
@override@JsonKey()@HiveField(7) final  int barCopies;

/// Create a copy of BluetoothPrinterModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BluetoothPrinterModelCopyWith<_BluetoothPrinterModel> get copyWith => __$BluetoothPrinterModelCopyWithImpl<_BluetoothPrinterModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$BluetoothPrinterModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _BluetoothPrinterModel&&(identical(other.name, name) || other.name == name)&&(identical(other.address, address) || other.address == address)&&(identical(other.connectionType, connectionType) || other.connectionType == connectionType)&&(identical(other.isKitchenPrinter, isKitchenPrinter) || other.isKitchenPrinter == isKitchenPrinter)&&(identical(other.isBarPrinter, isBarPrinter) || other.isBarPrinter == isBarPrinter)&&(identical(other.paperSize, paperSize) || other.paperSize == paperSize)&&(identical(other.kitchenCopies, kitchenCopies) || other.kitchenCopies == kitchenCopies)&&(identical(other.barCopies, barCopies) || other.barCopies == barCopies));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,address,connectionType,isKitchenPrinter,isBarPrinter,paperSize,kitchenCopies,barCopies);

@override
String toString() {
  return 'BluetoothPrinterModel(name: $name, address: $address, connectionType: $connectionType, isKitchenPrinter: $isKitchenPrinter, isBarPrinter: $isBarPrinter, paperSize: $paperSize, kitchenCopies: $kitchenCopies, barCopies: $barCopies)';
}


}

/// @nodoc
abstract mixin class _$BluetoothPrinterModelCopyWith<$Res> implements $BluetoothPrinterModelCopyWith<$Res> {
  factory _$BluetoothPrinterModelCopyWith(_BluetoothPrinterModel value, $Res Function(_BluetoothPrinterModel) _then) = __$BluetoothPrinterModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String name,@HiveField(1) String address,@HiveField(2) String? connectionType,@HiveField(3) bool isKitchenPrinter,@HiveField(4) bool isBarPrinter,@HiveField(5) String paperSize,@HiveField(6) int kitchenCopies,@HiveField(7) int barCopies
});




}
/// @nodoc
class __$BluetoothPrinterModelCopyWithImpl<$Res>
    implements _$BluetoothPrinterModelCopyWith<$Res> {
  __$BluetoothPrinterModelCopyWithImpl(this._self, this._then);

  final _BluetoothPrinterModel _self;
  final $Res Function(_BluetoothPrinterModel) _then;

/// Create a copy of BluetoothPrinterModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? name = null,Object? address = null,Object? connectionType = freezed,Object? isKitchenPrinter = null,Object? isBarPrinter = null,Object? paperSize = null,Object? kitchenCopies = null,Object? barCopies = null,}) {
  return _then(_BluetoothPrinterModel(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,connectionType: freezed == connectionType ? _self.connectionType : connectionType // ignore: cast_nullable_to_non_nullable
as String?,isKitchenPrinter: null == isKitchenPrinter ? _self.isKitchenPrinter : isKitchenPrinter // ignore: cast_nullable_to_non_nullable
as bool,isBarPrinter: null == isBarPrinter ? _self.isBarPrinter : isBarPrinter // ignore: cast_nullable_to_non_nullable
as bool,paperSize: null == paperSize ? _self.paperSize : paperSize // ignore: cast_nullable_to_non_nullable
as String,kitchenCopies: null == kitchenCopies ? _self.kitchenCopies : kitchenCopies // ignore: cast_nullable_to_non_nullable
as int,barCopies: null == barCopies ? _self.barCopies : barCopies // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
