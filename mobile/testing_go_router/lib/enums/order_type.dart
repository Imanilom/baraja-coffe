enum OrderType { dineIn, pickup, delivery, takeAway, reservation, unknown }

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
}
