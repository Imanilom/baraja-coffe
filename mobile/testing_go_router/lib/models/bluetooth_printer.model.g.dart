// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bluetooth_printer.model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class BluetoothPrinterModelAdapter extends TypeAdapter<BluetoothPrinterModel> {
  @override
  final typeId = 13;

  @override
  BluetoothPrinterModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return BluetoothPrinterModel(
      name: fields[0] as String,
      address: fields[1] as String,
      connectionType: fields[2] as String?,
      isKitchenPrinter: fields[3] == null ? false : fields[3] as bool,
      isBarPrinter: fields[4] == null ? true : fields[4] as bool,
      paperSize: fields[5] == null ? 'mm58' : fields[5] as String,
      kitchenCopies: fields[6] == null ? 1 : (fields[6] as num).toInt(),
      barCopies: fields[7] == null ? 1 : (fields[7] as num).toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, BluetoothPrinterModel obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.name)
      ..writeByte(1)
      ..write(obj.address)
      ..writeByte(2)
      ..write(obj.connectionType)
      ..writeByte(3)
      ..write(obj.isKitchenPrinter)
      ..writeByte(4)
      ..write(obj.isBarPrinter)
      ..writeByte(5)
      ..write(obj.paperSize)
      ..writeByte(6)
      ..write(obj.kitchenCopies)
      ..writeByte(7)
      ..write(obj.barCopies);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BluetoothPrinterModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_BluetoothPrinterModel _$BluetoothPrinterModelFromJson(
  Map<String, dynamic> json,
) => _BluetoothPrinterModel(
  name: json['name'] as String,
  address: json['address'] as String,
  connectionType: json['connectionType'] as String?,
  isKitchenPrinter: json['isKitchenPrinter'] as bool? ?? false,
  isBarPrinter: json['isBarPrinter'] as bool? ?? true,
  paperSize: json['paperSize'] as String? ?? 'mm58',
  kitchenCopies: (json['kitchenCopies'] as num?)?.toInt() ?? 1,
  barCopies: (json['barCopies'] as num?)?.toInt() ?? 1,
);

Map<String, dynamic> _$BluetoothPrinterModelToJson(
  _BluetoothPrinterModel instance,
) => <String, dynamic>{
  'name': instance.name,
  'address': instance.address,
  'connectionType': instance.connectionType,
  'isKitchenPrinter': instance.isKitchenPrinter,
  'isBarPrinter': instance.isBarPrinter,
  'paperSize': instance.paperSize,
  'kitchenCopies': instance.kitchenCopies,
  'barCopies': instance.barCopies,
};
