enum OrderStatus {
  pending,
  waiting,
  reserved,
  onProcess,
  completed,
  canceled,
  unknown,
}

extension OrderStatusExtension on OrderStatus {
  String get value {
    switch (this) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.waiting:
        return 'Waiting';
      case OrderStatus.reserved:
        return 'Reserved';
      case OrderStatus.onProcess:
        return 'OnProcess';
      case OrderStatus.completed:
        return 'Completed';
      case OrderStatus.canceled:
        return 'Canceled';
      default:
        return 'Unknown';
    }
  }

  static OrderStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return OrderStatus.pending;
      case 'waiting':
        return OrderStatus.waiting;
      case 'reserved':
        return OrderStatus.reserved;
      case 'onprocess':
        return OrderStatus.onProcess;
      case 'completed':
        return OrderStatus.completed;
      case 'canceled':
        return OrderStatus.canceled;
      default:
        return OrderStatus.unknown;
    }
  }

  //to json
  static String orderStatusToJson(OrderStatus status) => status.value;
}
