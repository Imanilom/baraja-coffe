// dart format width=80
// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'device.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$DeviceModel {

@HiveField(0)@JsonKey(name: '_id') String get id;@HiveField(1) String get outlet;@HiveField(2) String get deviceId;@HiveField(3) String get deviceName;@HiveField(4) String get deviceType;@HiveField(5) String get location;@HiveField(6) List<String> get assignedAreas;@HiveField(7) List<String> get assignedTables;@HiveField(8) List<String> get orderTypes;@HiveField(9) bool get isOnline;@HiveField(10) Map<String, dynamic>? get currentUser;@HiveField(11) bool get isAvailable;
/// Create a copy of DeviceModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DeviceModelCopyWith<DeviceModel> get copyWith => _$DeviceModelCopyWithImpl<DeviceModel>(this as DeviceModel, _$identity);

  /// Serializes this DeviceModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DeviceModel&&(identical(other.id, id) || other.id == id)&&(identical(other.outlet, outlet) || other.outlet == outlet)&&(identical(other.deviceId, deviceId) || other.deviceId == deviceId)&&(identical(other.deviceName, deviceName) || other.deviceName == deviceName)&&(identical(other.deviceType, deviceType) || other.deviceType == deviceType)&&(identical(other.location, location) || other.location == location)&&const DeepCollectionEquality().equals(other.assignedAreas, assignedAreas)&&const DeepCollectionEquality().equals(other.assignedTables, assignedTables)&&const DeepCollectionEquality().equals(other.orderTypes, orderTypes)&&(identical(other.isOnline, isOnline) || other.isOnline == isOnline)&&const DeepCollectionEquality().equals(other.currentUser, currentUser)&&(identical(other.isAvailable, isAvailable) || other.isAvailable == isAvailable));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,outlet,deviceId,deviceName,deviceType,location,const DeepCollectionEquality().hash(assignedAreas),const DeepCollectionEquality().hash(assignedTables),const DeepCollectionEquality().hash(orderTypes),isOnline,const DeepCollectionEquality().hash(currentUser),isAvailable);

@override
String toString() {
  return 'DeviceModel(id: $id, outlet: $outlet, deviceId: $deviceId, deviceName: $deviceName, deviceType: $deviceType, location: $location, assignedAreas: $assignedAreas, assignedTables: $assignedTables, orderTypes: $orderTypes, isOnline: $isOnline, currentUser: $currentUser, isAvailable: $isAvailable)';
}


}

/// @nodoc
abstract mixin class $DeviceModelCopyWith<$Res>  {
  factory $DeviceModelCopyWith(DeviceModel value, $Res Function(DeviceModel) _then) = _$DeviceModelCopyWithImpl;
@useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String outlet,@HiveField(2) String deviceId,@HiveField(3) String deviceName,@HiveField(4) String deviceType,@HiveField(5) String location,@HiveField(6) List<String> assignedAreas,@HiveField(7) List<String> assignedTables,@HiveField(8) List<String> orderTypes,@HiveField(9) bool isOnline,@HiveField(10) Map<String, dynamic>? currentUser,@HiveField(11) bool isAvailable
});




}
/// @nodoc
class _$DeviceModelCopyWithImpl<$Res>
    implements $DeviceModelCopyWith<$Res> {
  _$DeviceModelCopyWithImpl(this._self, this._then);

  final DeviceModel _self;
  final $Res Function(DeviceModel) _then;

/// Create a copy of DeviceModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? outlet = null,Object? deviceId = null,Object? deviceName = null,Object? deviceType = null,Object? location = null,Object? assignedAreas = null,Object? assignedTables = null,Object? orderTypes = null,Object? isOnline = null,Object? currentUser = freezed,Object? isAvailable = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,outlet: null == outlet ? _self.outlet : outlet // ignore: cast_nullable_to_non_nullable
as String,deviceId: null == deviceId ? _self.deviceId : deviceId // ignore: cast_nullable_to_non_nullable
as String,deviceName: null == deviceName ? _self.deviceName : deviceName // ignore: cast_nullable_to_non_nullable
as String,deviceType: null == deviceType ? _self.deviceType : deviceType // ignore: cast_nullable_to_non_nullable
as String,location: null == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String,assignedAreas: null == assignedAreas ? _self.assignedAreas : assignedAreas // ignore: cast_nullable_to_non_nullable
as List<String>,assignedTables: null == assignedTables ? _self.assignedTables : assignedTables // ignore: cast_nullable_to_non_nullable
as List<String>,orderTypes: null == orderTypes ? _self.orderTypes : orderTypes // ignore: cast_nullable_to_non_nullable
as List<String>,isOnline: null == isOnline ? _self.isOnline : isOnline // ignore: cast_nullable_to_non_nullable
as bool,currentUser: freezed == currentUser ? _self.currentUser : currentUser // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,isAvailable: null == isAvailable ? _self.isAvailable : isAvailable // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// @nodoc
@JsonSerializable()

class _DeviceModel implements DeviceModel {
   _DeviceModel({@HiveField(0)@JsonKey(name: '_id') required this.id, @HiveField(1) required this.outlet, @HiveField(2) required this.deviceId, @HiveField(3) required this.deviceName, @HiveField(4) required this.deviceType, @HiveField(5) required this.location, @HiveField(6) final  List<String> assignedAreas = const [], @HiveField(7) final  List<String> assignedTables = const [], @HiveField(8) final  List<String> orderTypes = const [], @HiveField(9) this.isOnline = false, @HiveField(10) final  Map<String, dynamic>? currentUser = null, @HiveField(11) this.isAvailable = true}): _assignedAreas = assignedAreas,_assignedTables = assignedTables,_orderTypes = orderTypes,_currentUser = currentUser;
  factory _DeviceModel.fromJson(Map<String, dynamic> json) => _$DeviceModelFromJson(json);

@override@HiveField(0)@JsonKey(name: '_id') final  String id;
@override@HiveField(1) final  String outlet;
@override@HiveField(2) final  String deviceId;
@override@HiveField(3) final  String deviceName;
@override@HiveField(4) final  String deviceType;
@override@HiveField(5) final  String location;
 final  List<String> _assignedAreas;
@override@JsonKey()@HiveField(6) List<String> get assignedAreas {
  if (_assignedAreas is EqualUnmodifiableListView) return _assignedAreas;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_assignedAreas);
}

 final  List<String> _assignedTables;
@override@JsonKey()@HiveField(7) List<String> get assignedTables {
  if (_assignedTables is EqualUnmodifiableListView) return _assignedTables;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_assignedTables);
}

 final  List<String> _orderTypes;
@override@JsonKey()@HiveField(8) List<String> get orderTypes {
  if (_orderTypes is EqualUnmodifiableListView) return _orderTypes;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_orderTypes);
}

@override@JsonKey()@HiveField(9) final  bool isOnline;
 final  Map<String, dynamic>? _currentUser;
@override@JsonKey()@HiveField(10) Map<String, dynamic>? get currentUser {
  final value = _currentUser;
  if (value == null) return null;
  if (_currentUser is EqualUnmodifiableMapView) return _currentUser;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

@override@JsonKey()@HiveField(11) final  bool isAvailable;

/// Create a copy of DeviceModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DeviceModelCopyWith<_DeviceModel> get copyWith => __$DeviceModelCopyWithImpl<_DeviceModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DeviceModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DeviceModel&&(identical(other.id, id) || other.id == id)&&(identical(other.outlet, outlet) || other.outlet == outlet)&&(identical(other.deviceId, deviceId) || other.deviceId == deviceId)&&(identical(other.deviceName, deviceName) || other.deviceName == deviceName)&&(identical(other.deviceType, deviceType) || other.deviceType == deviceType)&&(identical(other.location, location) || other.location == location)&&const DeepCollectionEquality().equals(other._assignedAreas, _assignedAreas)&&const DeepCollectionEquality().equals(other._assignedTables, _assignedTables)&&const DeepCollectionEquality().equals(other._orderTypes, _orderTypes)&&(identical(other.isOnline, isOnline) || other.isOnline == isOnline)&&const DeepCollectionEquality().equals(other._currentUser, _currentUser)&&(identical(other.isAvailable, isAvailable) || other.isAvailable == isAvailable));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,outlet,deviceId,deviceName,deviceType,location,const DeepCollectionEquality().hash(_assignedAreas),const DeepCollectionEquality().hash(_assignedTables),const DeepCollectionEquality().hash(_orderTypes),isOnline,const DeepCollectionEquality().hash(_currentUser),isAvailable);

@override
String toString() {
  return 'DeviceModel(id: $id, outlet: $outlet, deviceId: $deviceId, deviceName: $deviceName, deviceType: $deviceType, location: $location, assignedAreas: $assignedAreas, assignedTables: $assignedTables, orderTypes: $orderTypes, isOnline: $isOnline, currentUser: $currentUser, isAvailable: $isAvailable)';
}


}

/// @nodoc
abstract mixin class _$DeviceModelCopyWith<$Res> implements $DeviceModelCopyWith<$Res> {
  factory _$DeviceModelCopyWith(_DeviceModel value, $Res Function(_DeviceModel) _then) = __$DeviceModelCopyWithImpl;
@override @useResult
$Res call({
@HiveField(0)@JsonKey(name: '_id') String id,@HiveField(1) String outlet,@HiveField(2) String deviceId,@HiveField(3) String deviceName,@HiveField(4) String deviceType,@HiveField(5) String location,@HiveField(6) List<String> assignedAreas,@HiveField(7) List<String> assignedTables,@HiveField(8) List<String> orderTypes,@HiveField(9) bool isOnline,@HiveField(10) Map<String, dynamic>? currentUser,@HiveField(11) bool isAvailable
});




}
/// @nodoc
class __$DeviceModelCopyWithImpl<$Res>
    implements _$DeviceModelCopyWith<$Res> {
  __$DeviceModelCopyWithImpl(this._self, this._then);

  final _DeviceModel _self;
  final $Res Function(_DeviceModel) _then;

/// Create a copy of DeviceModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? outlet = null,Object? deviceId = null,Object? deviceName = null,Object? deviceType = null,Object? location = null,Object? assignedAreas = null,Object? assignedTables = null,Object? orderTypes = null,Object? isOnline = null,Object? currentUser = freezed,Object? isAvailable = null,}) {
  return _then(_DeviceModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,outlet: null == outlet ? _self.outlet : outlet // ignore: cast_nullable_to_non_nullable
as String,deviceId: null == deviceId ? _self.deviceId : deviceId // ignore: cast_nullable_to_non_nullable
as String,deviceName: null == deviceName ? _self.deviceName : deviceName // ignore: cast_nullable_to_non_nullable
as String,deviceType: null == deviceType ? _self.deviceType : deviceType // ignore: cast_nullable_to_non_nullable
as String,location: null == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String,assignedAreas: null == assignedAreas ? _self._assignedAreas : assignedAreas // ignore: cast_nullable_to_non_nullable
as List<String>,assignedTables: null == assignedTables ? _self._assignedTables : assignedTables // ignore: cast_nullable_to_non_nullable
as List<String>,orderTypes: null == orderTypes ? _self._orderTypes : orderTypes // ignore: cast_nullable_to_non_nullable
as List<String>,isOnline: null == isOnline ? _self.isOnline : isOnline // ignore: cast_nullable_to_non_nullable
as bool,currentUser: freezed == currentUser ? _self._currentUser : currentUser // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,isAvailable: null == isAvailable ? _self.isAvailable : isAvailable // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
