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
@HiveField(3) String get paperSize;@HiveField(4) bool get canPrintCustomer;@HiveField(5) bool get canPrintKitchen;@HiveField(6) bool get canPrintBar;@HiveField(7) bool get canPrintWaiter;@HiveField(8) int get customerCopies;@HiveField(9) int get kitchenCopies;@HiveField(10) int get barCopies;@HiveField(11) int get waiterCopies;
/// Create a copy of BluetoothPrinterModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BluetoothPrinterModelCopyWith<BluetoothPrinterModel> get copyWith => _$BluetoothPrinterModelCopyWithImpl<BluetoothPrinterModel>(this as BluetoothPrinterModel, _$identity);

  /// Serializes this BluetoothPrinterModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BluetoothPrinterModel&&(identical(other.name, name) || other.name == name)&&(identical(other.address, address) || other.address == address)&&(identical(other.connectionType, connectionType) || other.connectionType == connectionType)&&(identical(other.paperSize, paperSize) || other.paperSize == paperSize)&&(identical(other.canPrintCustomer, canPrintCustomer) || other.canPrintCustomer == canPrintCustomer)&&(identical(other.canPrintKitchen, canPrintKitchen) || other.canPrintKitchen == canPrintKitchen)&&(identical(other.canPrintBar, canPrintBar) || other.canPrintBar == canPrintBar)&&(identical(other.canPrintWaiter, canPrintWaiter) || other.canPrintWaiter == canPrintWaiter)&&(identical(other.customerCopies, customerCopies) || other.customerCopies == customerCopies)&&(identical(other.kitchenCopies, kitchenCopies) || other.kitchenCopies == kitchenCopies)&&(identical(other.barCopies, barCopies) || other.barCopies == barCopies)&&(identical(other.waiterCopies, waiterCopies) || other.waiterCopies == waiterCopies));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,address,connectionType,paperSize,canPrintCustomer,canPrintKitchen,canPrintBar,canPrintWaiter,customerCopies,kitchenCopies,barCopies,waiterCopies);

@override
String toString() {
  return 'BluetoothPrinterModel(name: $name, address: $address, connectionType: $connectionType, paperSize: $paperSize, canPrintCustomer: $canPrintCustomer, canPrintKitchen: $canPrintKitchen, canPrintBar: $canPrintBar, canPrintWaiter: $canPrintWaiter, customerCopies: $customerCopies, kitchenCopies: $kitchenCopies, barCopies: $barCopies, waiterCopies: $waiterCopies)';
}


}

/// @nodoc
abstract mixin class $BluetoothPrinterModelCopyWith<$Res>  {
  factory $BluetoothPrinterModelCopyWith(BluetoothPrinterModel value, $Res Function(BluetoothPrinterModel) _then) = _$BluetoothPrinterModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0) String name,@HiveField(1) String address,@HiveField(2) String? connectionType,@HiveField(3) String paperSize,@HiveField(4) bool canPrintCustomer,@HiveField(5) bool canPrintKitchen,@HiveField(6) bool canPrintBar,@HiveField(7) bool canPrintWaiter,@HiveField(8) int customerCopies,@HiveField(9) int kitchenCopies,@HiveField(10) int barCopies,@HiveField(11) int waiterCopies
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
@pragma('vm:prefer-inline') @override $Res call({Object? name = null,Object? address = null,Object? connectionType = freezed,Object? paperSize = null,Object? canPrintCustomer = null,Object? canPrintKitchen = null,Object? canPrintBar = null,Object? canPrintWaiter = null,Object? customerCopies = null,Object? kitchenCopies = null,Object? barCopies = null,Object? waiterCopies = null,}) {
  return _then(_self.copyWith(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,connectionType: freezed == connectionType ? _self.connectionType : connectionType // ignore: cast_nullable_to_non_nullable
as String?,paperSize: null == paperSize ? _self.paperSize : paperSize // ignore: cast_nullable_to_non_nullable
as String,canPrintCustomer: null == canPrintCustomer ? _self.canPrintCustomer : canPrintCustomer // ignore: cast_nullable_to_non_nullable
as bool,canPrintKitchen: null == canPrintKitchen ? _self.canPrintKitchen : canPrintKitchen // ignore: cast_nullable_to_non_nullable
as bool,canPrintBar: null == canPrintBar ? _self.canPrintBar : canPrintBar // ignore: cast_nullable_to_non_nullable
as bool,canPrintWaiter: null == canPrintWaiter ? _self.canPrintWaiter : canPrintWaiter // ignore: cast_nullable_to_non_nullable
as bool,customerCopies: null == customerCopies ? _self.customerCopies : customerCopies // ignore: cast_nullable_to_non_nullable
as int,kitchenCopies: null == kitchenCopies ? _self.kitchenCopies : kitchenCopies // ignore: cast_nullable_to_non_nullable
as int,barCopies: null == barCopies ? _self.barCopies : barCopies // ignore: cast_nullable_to_non_nullable
as int,waiterCopies: null == waiterCopies ? _self.waiterCopies : waiterCopies // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _BluetoothPrinterModel implements BluetoothPrinterModel {
   _BluetoothPrinterModel({@HiveField(0) required this.name, @HiveField(1) required this.address, @HiveField(2) this.connectionType, @HiveField(3) this.paperSize = 'mm58', @HiveField(4) this.canPrintCustomer = true, @HiveField(5) this.canPrintKitchen = false, @HiveField(6) this.canPrintBar = false, @HiveField(7) this.canPrintWaiter = false, @HiveField(8) this.customerCopies = 1, @HiveField(9) this.kitchenCopies = 1, @HiveField(10) this.barCopies = 1, @HiveField(11) this.waiterCopies = 1});
  factory _BluetoothPrinterModel.fromJson(Map<String, dynamic> json) => _$BluetoothPrinterModelFromJson(json);

@override@HiveField(0) final  String name;
@override@HiveField(1) final  String address;
//mac or ip
@override@HiveField(2) final  String? connectionType;
// 'wifi' or 'bluetooth'
@override@JsonKey()@HiveField(3) final  String paperSize;
@override@JsonKey()@HiveField(4) final  bool canPrintCustomer;
@override@JsonKey()@HiveField(5) final  bool canPrintKitchen;
@override@JsonKey()@HiveField(6) final  bool canPrintBar;
@override@JsonKey()@HiveField(7) final  bool canPrintWaiter;
@override@JsonKey()@HiveField(8) final  int customerCopies;
@override@JsonKey()@HiveField(9) final  int kitchenCopies;
@override@JsonKey()@HiveField(10) final  int barCopies;
@override@JsonKey()@HiveField(11) final  int waiterCopies;

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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _BluetoothPrinterModel&&(identical(other.name, name) || other.name == name)&&(identical(other.address, address) || other.address == address)&&(identical(other.connectionType, connectionType) || other.connectionType == connectionType)&&(identical(other.paperSize, paperSize) || other.paperSize == paperSize)&&(identical(other.canPrintCustomer, canPrintCustomer) || other.canPrintCustomer == canPrintCustomer)&&(identical(other.canPrintKitchen, canPrintKitchen) || other.canPrintKitchen == canPrintKitchen)&&(identical(other.canPrintBar, canPrintBar) || other.canPrintBar == canPrintBar)&&(identical(other.canPrintWaiter, canPrintWaiter) || other.canPrintWaiter == canPrintWaiter)&&(identical(other.customerCopies, customerCopies) || other.customerCopies == customerCopies)&&(identical(other.kitchenCopies, kitchenCopies) || other.kitchenCopies == kitchenCopies)&&(identical(other.barCopies, barCopies) || other.barCopies == barCopies)&&(identical(other.waiterCopies, waiterCopies) || other.waiterCopies == waiterCopies));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,address,connectionType,paperSize,canPrintCustomer,canPrintKitchen,canPrintBar,canPrintWaiter,customerCopies,kitchenCopies,barCopies,waiterCopies);

@override
String toString() {
  return 'BluetoothPrinterModel(name: $name, address: $address, connectionType: $connectionType, paperSize: $paperSize, canPrintCustomer: $canPrintCustomer, canPrintKitchen: $canPrintKitchen, canPrintBar: $canPrintBar, canPrintWaiter: $canPrintWaiter, customerCopies: $customerCopies, kitchenCopies: $kitchenCopies, barCopies: $barCopies, waiterCopies: $waiterCopies)';
}


}

/// @nodoc
abstract mixin class _$BluetoothPrinterModelCopyWith<$Res> implements $BluetoothPrinterModelCopyWith<$Res> {
  factory _$BluetoothPrinterModelCopyWith(_BluetoothPrinterModel value, $Res Function(_BluetoothPrinterModel) _then) = __$BluetoothPrinterModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0) String name,@HiveField(1) String address,@HiveField(2) String? connectionType,@HiveField(3) String paperSize,@HiveField(4) bool canPrintCustomer,@HiveField(5) bool canPrintKitchen,@HiveField(6) bool canPrintBar,@HiveField(7) bool canPrintWaiter,@HiveField(8) int customerCopies,@HiveField(9) int kitchenCopies,@HiveField(10) int barCopies,@HiveField(11) int waiterCopies
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
@override @pragma('vm:prefer-inline') $Res call({Object? name = null,Object? address = null,Object? connectionType = freezed,Object? paperSize = null,Object? canPrintCustomer = null,Object? canPrintKitchen = null,Object? canPrintBar = null,Object? canPrintWaiter = null,Object? customerCopies = null,Object? kitchenCopies = null,Object? barCopies = null,Object? waiterCopies = null,}) {
  return _then(_BluetoothPrinterModel(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,connectionType: freezed == connectionType ? _self.connectionType : connectionType // ignore: cast_nullable_to_non_nullable
as String?,paperSize: null == paperSize ? _self.paperSize : paperSize // ignore: cast_nullable_to_non_nullable
as String,canPrintCustomer: null == canPrintCustomer ? _self.canPrintCustomer : canPrintCustomer // ignore: cast_nullable_to_non_nullable
as bool,canPrintKitchen: null == canPrintKitchen ? _self.canPrintKitchen : canPrintKitchen // ignore: cast_nullable_to_non_nullable
as bool,canPrintBar: null == canPrintBar ? _self.canPrintBar : canPrintBar // ignore: cast_nullable_to_non_nullable
as bool,canPrintWaiter: null == canPrintWaiter ? _self.canPrintWaiter : canPrintWaiter // ignore: cast_nullable_to_non_nullable
as bool,customerCopies: null == customerCopies ? _self.customerCopies : customerCopies // ignore: cast_nullable_to_non_nullable
as int,kitchenCopies: null == kitchenCopies ? _self.kitchenCopies : kitchenCopies // ignore: cast_nullable_to_non_nullable
as int,barCopies: null == barCopies ? _self.barCopies : barCopies // ignore: cast_nullable_to_non_nullable
as int,waiterCopies: null == waiterCopies ? _self.waiterCopies : waiterCopies // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
