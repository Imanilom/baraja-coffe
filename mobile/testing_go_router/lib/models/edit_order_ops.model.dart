// // ignore_for_file: invalid_annotation_target

// import 'package:freezed_annotation/freezed_annotation.dart';
// import 'package:hive_ce/hive.dart';
// import 'package:kasirbaraja/models/order_item.model.dart';

// part 'edit_order_ops.model.freezed.dart';
// part 'edit_order_ops.model.g.dart';

// @freezed
// @HiveType(typeId: 26) // Pastikan typeId unik
// abstract class EditOrderOpsModel with _$EditOrderOpsModel {
//   factory EditOrderOpsModel({
//     @HiveField(0) required String reason,
//     @HiveField(1) required List<EditOperation> operations,
//   }) = _EditOrderOpsModel;

//   factory EditOrderOpsModel.fromJson(Map<String, dynamic> json) =>
//       _$EditOrderOpsModelFromJson(json);
// }

// @freezed
// @HiveType(typeId: 27)
// abstract class EditOperationModel with _$EditOperationModel {
//   factory EditOperationModel.add({
//     @HiveField(0) @Default('add') String op,
//     @HiveField(1) required OrderItemModel item,
//   }) = _EditOperationModelAdd;

//   factory EditOperationModel.update({
//     @HiveField(0) @Default('update') String op,
//     @HiveField(1) required String itemId,
//     @HiveField(2) required OrderItemModel patch,
//     @HiveField(3) @Default(false) bool oos,
//   }) = _EditOperationModelUpdate;

//   factory EditOperationModel.remove({
//     @HiveField(0) @Default('remove') String op,
//     @HiveField(1) required String itemId,
//     @HiveField(2) @Default(false) bool oos,
//   }) = _EditOperationModelRemove;

//   factory EditOperationModel.fromJson(Map<String, dynamic> json) =>
//       _$EditOperationModelFromJson(json);
// }
