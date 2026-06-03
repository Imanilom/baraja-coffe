import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'order_type.model.freezed.dart';
part 'order_type.model.g.dart';

@freezed
@HiveType(typeId: 205)
abstract class OrderTypeModel with _$OrderTypeModel {
  const OrderTypeModel._();

  const factory OrderTypeModel({
    @HiveField(0) required String id,
    @HiveField(1) required String name,
    @HiveField(2) required String shortName,
  }) = _OrderTypeModel;

  factory OrderTypeModel.fromJson(Map<String, dynamic> json) =>
      _$OrderTypeModelFromJson(json);

  // Static instances to mimic enum behavior
  static const dineIn = OrderTypeModel(
    id: 'Dine-In',
    name: 'Dine-In',
    shortName: 'DI',
  );
  static const pickup = OrderTypeModel(
    id: 'Pickup',
    name: 'Pickup',
    shortName: 'PU',
  );
  static const delivery = OrderTypeModel(
    id: 'Delivery',
    name: 'Delivery',
    shortName: 'DL',
  );
  static const takeAway = OrderTypeModel(
    id: 'Take Away',
    name: 'Take Away',
    shortName: 'TA',
  );
  static const reservation = OrderTypeModel(
    id: 'Reservation',
    name: 'Reservation',
    shortName: 'RS',
  );
  static const unknown = OrderTypeModel(
    id: 'unknown',
    name: 'Unknown',
    shortName: 'UN',
  );

  static List<OrderTypeModel> get values => [
    dineIn,
    pickup,
    delivery,
    takeAway,
    reservation,
    unknown,
  ];

  static OrderTypeModel fromString(String type) {
    return values.firstWhere(
      (e) =>
          e.id.toLowerCase() == type.toLowerCase() ||
          e.name.toLowerCase() == type.toLowerCase(),
      orElse: () => unknown,
    );
  }

  static String toJsonString(OrderTypeModel? type) => type?.id ?? unknown.id;
}

@freezed
@HiveType(typeId: 206)
abstract class ItemOrderTypeModel with _$ItemOrderTypeModel {
  const ItemOrderTypeModel._();

  const factory ItemOrderTypeModel({
    @HiveField(0) required String id,
    @HiveField(1) required String name,
    @HiveField(2) required String shortName,
  }) = _ItemOrderTypeModel;

  factory ItemOrderTypeModel.fromJson(Map<String, dynamic> json) =>
      _$ItemOrderTypeModelFromJson(json);

  static const dineIn = ItemOrderTypeModel(
    id: 'Dine-In',
    name: 'Dine-In',
    shortName: 'DI',
  );
  static const takeAway = ItemOrderTypeModel(
    id: 'Take Away',
    name: 'Take Away',
    shortName: 'TA',
  );

  static List<ItemOrderTypeModel> get values => [dineIn, takeAway];

  static ItemOrderTypeModel fromString(String type) {
    try {
      return values.firstWhere(
        (e) =>
            e.id.toLowerCase() == type.toLowerCase() ||
            e.name.toLowerCase() == type.toLowerCase() ||
            e.shortName.toLowerCase() == type.toLowerCase(),
        orElse: () => dineIn,
      );
    } catch (_) {
      return dineIn;
    }
  }
}
