// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'edit_order_request.model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_EditOrderRequest _$EditOrderRequestFromJson(Map<String, dynamic> json) =>
    _EditOrderRequest(
      reason: json['reason'] as String,
      operations:
          (json['operations'] as List<dynamic>)
              .map((e) => Operation.fromJson(e as Map<String, dynamic>))
              .toList(),
    );

Map<String, dynamic> _$EditOrderRequestToJson(_EditOrderRequest instance) =>
    <String, dynamic>{
      'reason': instance.reason,
      'operations': instance.operations,
    };

AddOperation _$AddOperationFromJson(Map<String, dynamic> json) => AddOperation(
  item: OrderItemModel.fromJson(json['item'] as Map<String, dynamic>),
  $type: json['runtimeType'] as String?,
);

Map<String, dynamic> _$AddOperationToJson(AddOperation instance) =>
    <String, dynamic>{'item': instance.item, 'runtimeType': instance.$type};

UpdateOperation _$UpdateOperationFromJson(Map<String, dynamic> json) =>
    UpdateOperation(
      itemId: json['itemId'] as String,
      patch: json['patch'] as Map<String, dynamic>,
      oos: json['oos'] as bool? ?? false,
      $type: json['runtimeType'] as String?,
    );

Map<String, dynamic> _$UpdateOperationToJson(UpdateOperation instance) =>
    <String, dynamic>{
      'itemId': instance.itemId,
      'patch': instance.patch,
      'oos': instance.oos,
      'runtimeType': instance.$type,
    };

RemoveOperation _$RemoveOperationFromJson(Map<String, dynamic> json) =>
    RemoveOperation(
      itemId: json['itemId'] as String,
      oos: json['oos'] as bool? ?? false,
      $type: json['runtimeType'] as String?,
    );

Map<String, dynamic> _$RemoveOperationToJson(RemoveOperation instance) =>
    <String, dynamic>{
      'itemId': instance.itemId,
      'oos': instance.oos,
      'runtimeType': instance.$type,
    };
