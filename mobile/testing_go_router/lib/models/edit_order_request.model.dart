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

enum EditReason {
  editBeforePay,
  addAfterFullpay,
  oosRefund,
  swapItem,
  reduceOffsetPendingFirst,
  addMultipleAfterFullpay,
  cancelOrderBeforePayment,
}
