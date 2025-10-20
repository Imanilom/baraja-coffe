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

_OrderItemModelForRequest _$OrderItemModelForRequestFromJson(
  Map<String, dynamic> json,
) => _OrderItemModelForRequest(
  menuItem: json['menuItem'] as String,
  quantity: (json['quantity'] as num?)?.toInt() ?? 1,
  selectedAddons:
      (json['selectedAddons'] as List<dynamic>?)
          ?.map(
            (e) => SelectedAddonForRequest.fromJson(e as Map<String, dynamic>),
          )
          .toList() ??
      const [],
  selectedToppings:
      (json['selectedToppings'] as List<dynamic>?)
          ?.map(
            (e) =>
                SelectedToppingForRequest.fromJson(e as Map<String, dynamic>),
          )
          .toList() ??
      const [],
  notes: json['notes'] as String? ?? '',
  dineType: json['dineType'] as String? ?? 'Dine-In',
);

Map<String, dynamic> _$OrderItemModelForRequestToJson(
  _OrderItemModelForRequest instance,
) => <String, dynamic>{
  'menuItem': instance.menuItem,
  'quantity': instance.quantity,
  'selectedAddons': instance.selectedAddons,
  'selectedToppings': instance.selectedToppings,
  'notes': instance.notes,
  'dineType': instance.dineType,
};

_SelectedAddonForRequest _$SelectedAddonForRequestFromJson(
  Map<String, dynamic> json,
) => _SelectedAddonForRequest(
  id: json['id'] as String,
  options:
      (json['options'] as List<dynamic>?)
          ?.map(
            (e) => SelectedOptionForRequest.fromJson(e as Map<String, dynamic>),
          )
          .toList() ??
      const [],
);

Map<String, dynamic> _$SelectedAddonForRequestToJson(
  _SelectedAddonForRequest instance,
) => <String, dynamic>{'id': instance.id, 'options': instance.options};

_SelectedOptionForRequest _$SelectedOptionForRequestFromJson(
  Map<String, dynamic> json,
) => _SelectedOptionForRequest(id: json['id'] as String);

Map<String, dynamic> _$SelectedOptionForRequestToJson(
  _SelectedOptionForRequest instance,
) => <String, dynamic>{'id': instance.id};

_SelectedToppingForRequest _$SelectedToppingForRequestFromJson(
  Map<String, dynamic> json,
) => _SelectedToppingForRequest(id: json['id'] as String);

Map<String, dynamic> _$SelectedToppingForRequestToJson(
  _SelectedToppingForRequest instance,
) => <String, dynamic>{'id': instance.id};
