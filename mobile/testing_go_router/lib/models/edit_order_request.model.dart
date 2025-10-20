// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:kasirbaraja/models/order_item.model.dart';

part 'edit_order_request.model.freezed.dart';
part 'edit_order_request.model.g.dart';

@freezed
abstract class EditOrderRequest with _$EditOrderRequest {
  const factory EditOrderRequest({
    required String reason,
    required List<Operation> operations,
  }) = _EditOrderRequest;

  factory EditOrderRequest.fromJson(Map<String, dynamic> json) =>
      _$EditOrderRequestFromJson(json);
}

@freezed
abstract class Operation with _$Operation {
  const factory Operation.add({required OrderItemModel item}) = AddOperation;

  const factory Operation.update({
    required String itemId,
    required Map<String, dynamic> patch,
    @Default(false) bool oos,
  }) = UpdateOperation;

  const factory Operation.remove({
    required String itemId,
    @Default(false) bool oos,
  }) = RemoveOperation;

  factory Operation.fromJson(Map<String, dynamic> json) =>
      _$OperationFromJson(json);
}

@freezed
abstract class OrderItemModelForRequest with _$OrderItemModelForRequest {
  const factory OrderItemModelForRequest({
    required String menuItem,
    @Default(1) int quantity,
    @Default([]) List<SelectedAddonForRequest> selectedAddons,
    @Default([]) List<SelectedToppingForRequest> selectedToppings,
    @Default('') String notes,
    @Default('Dine-In')
    String dineType, // Sesuaikan dengan OrderType jika diperlukan
  }) = _OrderItemModelForRequest;

  factory OrderItemModelForRequest.fromJson(Map<String, dynamic> json) =>
      _$OrderItemModelForRequestFromJson(json);

  factory OrderItemModelForRequest.fromOrderItemModel(OrderItemModel item) {
    return OrderItemModelForRequest(
      menuItem: item.menuItem.id,
      quantity: item.quantity,
      selectedAddons:
          item.selectedAddons
              .map(
                (addon) => SelectedAddonForRequest(
                  id: addon.id!,
                  options:
                      addon.selectedOptions
                          .map(
                            (option) =>
                                SelectedOptionForRequest(id: option.id!),
                          )
                          .toList(),
                ),
              )
              .toList(),
      selectedToppings:
          item.selectedToppings
              .map((topping) => SelectedToppingForRequest(id: topping.id!))
              .toList(),
      notes: item.notes ?? '',
      dineType:
          item.orderType.name, // Konversi enum ke string sesuai kebutuhan API,
    );
  }
}

@freezed
abstract class SelectedAddonForRequest with _$SelectedAddonForRequest {
  const factory SelectedAddonForRequest({
    required String id,
    @Default([]) List<SelectedOptionForRequest> options,
  }) = _SelectedAddonForRequest;

  factory SelectedAddonForRequest.fromJson(Map<String, dynamic> json) =>
      _$SelectedAddonForRequestFromJson(json);
}

@freezed
abstract class SelectedOptionForRequest with _$SelectedOptionForRequest {
  const factory SelectedOptionForRequest({required String id}) =
      _SelectedOptionForRequest;

  factory SelectedOptionForRequest.fromJson(Map<String, dynamic> json) =>
      _$SelectedOptionForRequestFromJson(json);
}

@freezed
abstract class SelectedToppingForRequest with _$SelectedToppingForRequest {
  const factory SelectedToppingForRequest({required String id}) =
      _SelectedToppingForRequest;

  factory SelectedToppingForRequest.fromJson(Map<String, dynamic> json) =>
      _$SelectedToppingForRequestFromJson(json);
}

enum EditReason {
  editBeforePay,
  addAfterFullpay,
  oosRefund,
  swapItem,
  reduceOffsetPendingFirst,
  addMultipleAfterFullpay,
  cancelOrderBeforePayment,
}
