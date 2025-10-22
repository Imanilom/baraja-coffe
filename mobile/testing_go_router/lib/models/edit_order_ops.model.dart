// edit_order_ops.model.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'edit_order_ops.model.freezed.dart';
part 'edit_order_ops.model.g.dart';

@freezed
abstract class EditOrderOpsRequest with _$EditOrderOpsRequest {
  factory EditOrderOpsRequest({
    required String reason,
    required List<EditOperation> operations,
  }) = _EditOrderOpsRequest;

  factory EditOrderOpsRequest.fromJson(Map<String, dynamic> json) =>
      _$EditOrderOpsRequestFromJson(json);
}

@freezed
abstract class EditOperation with _$EditOperation {
  factory EditOperation.add({
    @Default('add') String op,
    required EditAddItem item,
  }) = _EditOperationAdd;

  factory EditOperation.update({
    @Default('update') String op,
    required String itemId,
    required EditUpdatePatch patch,
    @Default(false) bool oos, // jika OOS dari dapur
  }) = _EditOperationUpdate;

  factory EditOperation.remove({
    @Default('remove') String op,
    required String itemId,
    @Default(false) bool oos,
  }) = _EditOperationRemove;

  factory EditOperation.fromJson(Map<String, dynamic> json) =>
      _$EditOperationFromJson(json);
}

@freezed
abstract class EditAddItem with _$EditAddItem {
  factory EditAddItem({
    required String menuItem,
    @Default(1) int quantity,
    @Default([]) List<SelectedAddon> selectedAddons,
    @Default([]) List<SelectedTopping> selectedToppings,
    @Default('') String notes,
    @JsonKey(name: 'dineType') @Default('Dine-In') String dineType,
  }) = _EditAddItem;

  factory EditAddItem.fromJson(Map<String, dynamic> json) =>
      _$EditAddItemFromJson(json);
}

@freezed
abstract class EditUpdatePatch with _$EditUpdatePatch {
  factory EditUpdatePatch({
    int? quantity,
    String? notes,
    String? dineType,
    List<SelectedAddon>? selectedAddons,
    List<SelectedTopping>? selectedToppings,
  }) = _EditUpdatePatch;

  factory EditUpdatePatch.fromJson(Map<String, dynamic> json) =>
      _$EditUpdatePatchFromJson(json);
}

@freezed
abstract class SelectedAddon with _$SelectedAddon {
  factory SelectedAddon({
    required String id, // addonId
    @Default([]) List<SelectedAddonOption> options,
  }) = _SelectedAddon;

  factory SelectedAddon.fromJson(Map<String, dynamic> json) =>
      _$SelectedAddonFromJson(json);
}

@freezed
abstract class SelectedAddonOption with _$SelectedAddonOption {
  factory SelectedAddonOption({
    required String id, // optionId
  }) = _SelectedAddonOption;

  factory SelectedAddonOption.fromJson(Map<String, dynamic> json) =>
      _$SelectedAddonOptionFromJson(json);
}

@freezed
abstract class SelectedTopping with _$SelectedTopping {
  factory SelectedTopping({
    required String id, // toppingId
  }) = _SelectedTopping;

  factory SelectedTopping.fromJson(Map<String, dynamic> json) =>
      _$SelectedToppingFromJson(json);
}
