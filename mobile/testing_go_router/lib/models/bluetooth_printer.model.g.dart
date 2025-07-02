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
      paperSize: fields[3] == null ? 'mm58' : fields[3] as String,
      canPrintCustomer: fields[4] == null ? true : fields[4] as bool,
      canPrintKitchen: fields[5] == null ? false : fields[5] as bool,
      canPrintBar: fields[6] == null ? false : fields[6] as bool,
      canPrintWaiter: fields[7] == null ? false : fields[7] as bool,
      customerCopies: fields[8] == null ? 1 : (fields[8] as num).toInt(),
      kitchenCopies: fields[9] == null ? 1 : (fields[9] as num).toInt(),
      barCopies: fields[10] == null ? 1 : (fields[10] as num).toInt(),
      waiterCopies: fields[11] == null ? 1 : (fields[11] as num).toInt(),
    );
  }

  @override
  void write(BinaryWriter writer, BluetoothPrinterModel obj) {
    writer
      ..writeByte(12)
      ..writeByte(0)
      ..write(obj.name)
      ..writeByte(1)
      ..write(obj.address)
      ..writeByte(2)
      ..write(obj.connectionType)
      ..writeByte(3)
      ..write(obj.paperSize)
      ..writeByte(4)
      ..write(obj.canPrintCustomer)
      ..writeByte(5)
      ..write(obj.canPrintKitchen)
      ..writeByte(6)
      ..write(obj.canPrintBar)
      ..writeByte(7)
      ..write(obj.canPrintWaiter)
      ..writeByte(8)
      ..write(obj.customerCopies)
      ..writeByte(9)
      ..write(obj.kitchenCopies)
      ..writeByte(10)
      ..write(obj.barCopies)
      ..writeByte(11)
      ..write(obj.waiterCopies);
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
  paperSize: json['paperSize'] as String? ?? 'mm58',
  canPrintCustomer: json['canPrintCustomer'] as bool? ?? true,
  canPrintKitchen: json['canPrintKitchen'] as bool? ?? false,
  canPrintBar: json['canPrintBar'] as bool? ?? false,
  canPrintWaiter: json['canPrintWaiter'] as bool? ?? false,
  customerCopies: (json['customerCopies'] as num?)?.toInt() ?? 1,
  kitchenCopies: (json['kitchenCopies'] as num?)?.toInt() ?? 1,
  barCopies: (json['barCopies'] as num?)?.toInt() ?? 1,
  waiterCopies: (json['waiterCopies'] as num?)?.toInt() ?? 1,
);

Map<String, dynamic> _$BluetoothPrinterModelToJson(
  _BluetoothPrinterModel instance,
) => <String, dynamic>{
  'name': instance.name,
  'address': instance.address,
  'connectionType': instance.connectionType,
  'paperSize': instance.paperSize,
  'canPrintCustomer': instance.canPrintCustomer,
  'canPrintKitchen': instance.canPrintKitchen,
  'canPrintBar': instance.canPrintBar,
  'canPrintWaiter': instance.canPrintWaiter,
  'customerCopies': instance.customerCopies,
  'kitchenCopies': instance.kitchenCopies,
  'barCopies': instance.barCopies,
  'waiterCopies': instance.waiterCopies,
};
