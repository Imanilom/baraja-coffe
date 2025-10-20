// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'edit_order_ops.model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_EditOrderOpsRequest _$EditOrderOpsRequestFromJson(Map<String, dynamic> json) =>
    _EditOrderOpsRequest(
      reason: json['reason'] as String,
      operations:
          (json['operations'] as List<dynamic>)
              .map((e) => EditOperation.fromJson(e as Map<String, dynamic>))
              .toList(),
    );

Map<String, dynamic> _$EditOrderOpsRequestToJson(
  _EditOrderOpsRequest instance,
) => <String, dynamic>{
  'reason': instance.reason,
  'operations': instance.operations,
};

_EditOperationAdd _$EditOperationAddFromJson(Map<String, dynamic> json) =>
    _EditOperationAdd(
      op: json['op'] as String? ?? 'add',
      item: EditAddItem.fromJson(json['item'] as Map<String, dynamic>),
      $type: json['runtimeType'] as String?,
    );

Map<String, dynamic> _$EditOperationAddToJson(_EditOperationAdd instance) =>
    <String, dynamic>{
      'op': instance.op,
      'item': instance.item,
      'runtimeType': instance.$type,
    };

_EditOperationUpdate _$EditOperationUpdateFromJson(Map<String, dynamic> json) =>
    _EditOperationUpdate(
      op: json['op'] as String? ?? 'update',
      itemId: json['itemId'] as String,
      patch: EditUpdatePatch.fromJson(json['patch'] as Map<String, dynamic>),
      oos: json['oos'] as bool? ?? false,
      $type: json['runtimeType'] as String?,
    );

Map<String, dynamic> _$EditOperationUpdateToJson(
  _EditOperationUpdate instance,
) => <String, dynamic>{
  'op': instance.op,
  'itemId': instance.itemId,
  'patch': instance.patch,
  'oos': instance.oos,
  'runtimeType': instance.$type,
};

_EditOperationRemove _$EditOperationRemoveFromJson(Map<String, dynamic> json) =>
    _EditOperationRemove(
      op: json['op'] as String? ?? 'remove',
      itemId: json['itemId'] as String,
      oos: json['oos'] as bool? ?? false,
      $type: json['runtimeType'] as String?,
    );

Map<String, dynamic> _$EditOperationRemoveToJson(
  _EditOperationRemove instance,
) => <String, dynamic>{
  'op': instance.op,
  'itemId': instance.itemId,
  'oos': instance.oos,
  'runtimeType': instance.$type,
};

_EditAddItem _$EditAddItemFromJson(Map<String, dynamic> json) => _EditAddItem(
  menuItem: json['menuItem'] as String,
  quantity: (json['quantity'] as num?)?.toInt() ?? 1,
  selectedAddons:
      (json['selectedAddons'] as List<dynamic>?)
          ?.map((e) => SelectedAddon.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  selectedToppings:
      (json['selectedToppings'] as List<dynamic>?)
          ?.map((e) => SelectedTopping.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  notes: json['notes'] as String? ?? '',
  dineType: json['dineType'] as String? ?? 'Dine-In',
);

Map<String, dynamic> _$EditAddItemToJson(_EditAddItem instance) =>
    <String, dynamic>{
      'menuItem': instance.menuItem,
      'quantity': instance.quantity,
      'selectedAddons': instance.selectedAddons,
      'selectedToppings': instance.selectedToppings,
      'notes': instance.notes,
      'dineType': instance.dineType,
    };

_EditUpdatePatch _$EditUpdatePatchFromJson(Map<String, dynamic> json) =>
    _EditUpdatePatch(
      quantity: (json['quantity'] as num?)?.toInt(),
      notes: json['notes'] as String?,
      dineType: json['dineType'] as String?,
      selectedAddons:
          (json['selectedAddons'] as List<dynamic>?)
              ?.map((e) => SelectedAddon.fromJson(e as Map<String, dynamic>))
              .toList(),
      selectedToppings:
          (json['selectedToppings'] as List<dynamic>?)
              ?.map((e) => SelectedTopping.fromJson(e as Map<String, dynamic>))
              .toList(),
    );

Map<String, dynamic> _$EditUpdatePatchToJson(_EditUpdatePatch instance) =>
    <String, dynamic>{
      'quantity': instance.quantity,
      'notes': instance.notes,
      'dineType': instance.dineType,
      'selectedAddons': instance.selectedAddons,
      'selectedToppings': instance.selectedToppings,
    };

_SelectedAddon _$SelectedAddonFromJson(Map<String, dynamic> json) =>
    _SelectedAddon(
      id: json['id'] as String,
      options:
          (json['options'] as List<dynamic>?)
              ?.map(
                (e) => SelectedAddonOption.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          const [],
    );

Map<String, dynamic> _$SelectedAddonToJson(_SelectedAddon instance) =>
    <String, dynamic>{'id': instance.id, 'options': instance.options};

_SelectedAddonOption _$SelectedAddonOptionFromJson(Map<String, dynamic> json) =>
    _SelectedAddonOption(id: json['id'] as String);

Map<String, dynamic> _$SelectedAddonOptionToJson(
  _SelectedAddonOption instance,
) => <String, dynamic>{'id': instance.id};

_SelectedTopping _$SelectedToppingFromJson(Map<String, dynamic> json) =>
    _SelectedTopping(id: json['id'] as String);

Map<String, dynamic> _$SelectedToppingToJson(_SelectedTopping instance) =>
    <String, dynamic>{'id': instance.id};
