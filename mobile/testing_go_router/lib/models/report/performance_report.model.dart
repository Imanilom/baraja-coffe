class PerformanceReportModel {
  final bool success;
  final PerformanceData data;

  PerformanceReportModel({required this.success, required this.data});

  factory PerformanceReportModel.fromJson(Map<String, dynamic> json) {
    return PerformanceReportModel(
      success: json['success'] ?? false,
      data: PerformanceData.fromJson(json['data']),
    );
  }
}

class PerformanceData {
  final List<CashierPerformanceData> cashierPerformance;
  final List<DailyTrend> dailyPerformanceTrend;

  PerformanceData({
    required this.cashierPerformance,
    required this.dailyPerformanceTrend,
  });

  factory PerformanceData.fromJson(Map<String, dynamic> json) {
    return PerformanceData(
      cashierPerformance:
          (json['cashierPerformance'] as List)
              .map((item) => CashierPerformanceData.fromJson(item))
              .toList(),
      dailyPerformanceTrend:
          (json['dailyPerformanceTrend'] as List)
              .map((item) => DailyTrend.fromJson(item))
              .toList(),
    );
  }
}

class CashierPerformanceData {
  final Cashier cashier;
  final Performance performance;

  CashierPerformanceData({required this.cashier, required this.performance});

  factory CashierPerformanceData.fromJson(Map<String, dynamic> json) {
    return CashierPerformanceData(
      cashier: Cashier.fromJson(json['cashier']),
      performance: Performance.fromJson(json['performance']),
    );
  }
}

class Cashier {
  final String? id;
  final String name;
  final String email;

  Cashier({this.id, required this.name, required this.email});

  factory Cashier.fromJson(Map<String, dynamic> json) {
    return Cashier(
      id: json['id'],
      name: json['name'] ?? 'Unknown Cashier',
      email: json['email'] ?? 'No email',
    );
  }
}

class Performance {
  final int totalTransactions;
  final double totalSales;
  final double avgOrderValue;
  final int totalItems;
  final String avgItemsPerOrder;

  Performance({
    required this.totalTransactions,
    required this.totalSales,
    required this.avgOrderValue,
    required this.totalItems,
    required this.avgItemsPerOrder,
  });

  factory Performance.fromJson(Map<String, dynamic> json) {
    return Performance(
      totalTransactions: json['totalTransactions'] ?? 0,
      totalSales: (json['totalSales'] ?? 0).toDouble(),
      avgOrderValue: (json['avgOrderValue'] ?? 0).toDouble(),
      totalItems: json['totalItems'] ?? 0,
      avgItemsPerOrder: json['avgItemsPerOrder'] ?? '0',
    );
  }
}

class DailyTrend {
  final String date;
  final double totalSales;
  final int totalOrders;
  final int totalCashiers;
  final double avgSalesPerCashier;

  DailyTrend({
    required this.date,
    required this.totalSales,
    required this.totalOrders,
    required this.totalCashiers,
    required this.avgSalesPerCashier,
  });

  factory DailyTrend.fromJson(Map<String, dynamic> json) {
    return DailyTrend(
      date: json['date'] ?? '',
      totalSales: (json['totalSales'] ?? 0).toDouble(),
      totalOrders: json['totalOrders'] ?? 0,
      totalCashiers: json['totalCashiers'] ?? 0,
      avgSalesPerCashier: (json['avgSalesPerCashier'] ?? 0).toDouble(),
    );
  }
}
