enum OrderType { dineIn, pickup, delivery, takeAway, reservation, unknown }

enum ItemOrderType { dineIn, takeAway }

extension OrderTypeExtension on OrderType {
  String get value {
    switch (this) {
      case OrderType.dineIn:
        return 'Dine-In';
      case OrderType.pickup:
        return 'Pickup';
      case OrderType.delivery:
        return 'Delivery';
      case OrderType.takeAway:
        return 'Take Away';
      case OrderType.reservation:
        return 'Reservation';
      default:
        return 'Unknown';
    }
  }

  String get shortValue {
    switch (this) {
      case OrderType.dineIn:
        return 'DI';
      case OrderType.pickup:
        return 'PU';
      case OrderType.delivery:
        return 'DL';
      case OrderType.takeAway:
        return 'TA';
      case OrderType.reservation:
        return 'RS';
      default:
        return 'UN';
    }
  }

  static OrderType fromString(String type) {
    switch (type.toLowerCase()) {
      case 'dine-in':
        return OrderType.dineIn;
      case 'pickup':
        return OrderType.pickup;
      case 'delivery':
        return OrderType.delivery;
      case 'take away':
        return OrderType.takeAway;
      case 'reservation':
        return OrderType.reservation;
      default:
        return OrderType.dineIn;
    }
  }

  //to json
  static String orderTypeToJson(OrderType type) => type.value;
  static String orderTypeToShortJson(OrderType type) => type.shortValue;
}

// ItemOrderType extension
extension ItemOrderTypeExt on ItemOrderType {
  String get value {
    switch (this) {
      case ItemOrderType.dineIn:
        return 'DI';
      case ItemOrderType.takeAway:
        return 'TA';
    }
  }

  static ItemOrderType fromString(String type) {
    switch (type.toUpperCase()) {
      case 'DI':
        return ItemOrderType.dineIn;
      case 'TA':
        return ItemOrderType.takeAway;
      default:
        return ItemOrderType.dineIn;
    }
  }

  //to json
  static String itemOrderTypeToJson(ItemOrderType type) => type.value;
}
