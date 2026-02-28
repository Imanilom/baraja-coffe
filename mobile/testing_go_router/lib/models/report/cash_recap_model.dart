class CashRecapModel {
  final DateTime printDate;
  final DateTime startDate;
  final DateTime endDate;
  final double totalCash;
  final int orderCount;
  final List<CashRecapOrder> orders;

  CashRecapModel({
    required this.printDate,
    required this.startDate,
    required this.endDate,
    required this.totalCash,
    required this.orderCount,
    required this.orders,
  });

  factory CashRecapModel.fromJson(Map<String, dynamic> json) {
    final data = json['data'];
    return CashRecapModel(
      printDate: DateTime.parse(data['printDate']),
      startDate: DateTime.parse(data['period']['start']),
      endDate: DateTime.parse(data['period']['end']),
      totalCash: (data['totalCash'] as num).toDouble(),
      orderCount: (data['orderCount'] as num).toInt(),
      orders:
          (data['orders'] as List)
              .map((e) => CashRecapOrder.fromJson(e))
              .toList(),
    );
  }
}

class CashRecapOrder {
  final String id;
  final String time;
  final double amount;

  CashRecapOrder({required this.id, required this.time, required this.amount});

  factory CashRecapOrder.fromJson(Map<String, dynamic> json) {
    return CashRecapOrder(
      id: json['id'],
      time: json['time'],
      amount: (json['amount'] as num).toDouble(),
    );
  }
}
