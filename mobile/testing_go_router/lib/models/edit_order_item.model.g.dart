// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'edit_order_item.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class EditOrderItemModelAdapter extends TypeAdapter<EditOrderItemModel> {
  @override
  final typeId = 26;

  @override
  EditOrderItemModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return EditOrderItemModel(
      reason: fields[0] == null ? null : fields[0] as String?,
      order: fields[1] == null ? null : fields[1] as OrderDetailModel?,
      originalItems:
          fields[2] == null ? [] : (fields[2] as List?)?.cast<OrderItemModel>(),
      isSubmitting: fields[3] == null ? false : fields[3] as bool,
      error: fields[4] == null ? null : fields[4] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, EditOrderItemModel obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.reason)
      ..writeByte(1)
      ..write(obj.order)
      ..writeByte(2)
      ..write(obj.originalItems)
      ..writeByte(3)
      ..write(obj.isSubmitting)
      ..writeByte(4)
      ..write(obj.error);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is EditOrderItemModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_EditOrderItemModel _$EditOrderItemModelFromJson(Map<String, dynamic> json) =>
    _EditOrderItemModel(
      reason: json['reason'] as String? ?? null,
      order:
          json['order'] == null
              ? null
              : OrderDetailModel.fromJson(
                json['order'] as Map<String, dynamic>,
              ),
      originalItems:
          (json['originalItems'] as List<dynamic>?)
              ?.map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      isSubmitting: json['isSubmitting'] as bool? ?? false,
      error: json['error'] as String? ?? null,
    );

Map<String, dynamic> _$EditOrderItemModelToJson(_EditOrderItemModel instance) =>
    <String, dynamic>{
      'reason': instance.reason,
      'order': instance.order,
      'originalItems': instance.originalItems,
      'isSubmitting': instance.isSubmitting,
      'error': instance.error,
    };
