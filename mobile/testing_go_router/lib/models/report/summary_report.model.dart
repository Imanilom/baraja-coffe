class SalesSummary {
  final bool success;
  final SalesData data;

  SalesSummary({required this.success, required this.data});

  factory SalesSummary.fromJson(Map<String, dynamic> json) {
    return SalesSummary(
      success: json['success'] ?? false,
      data: SalesData.fromJson(json['data'] ?? {}),
    );
  }
}

class SalesData {
  final Summary summary;
  final List<PaymentMethodBreakdown> paymentMethodBreakdown;
  final List<OrderTypeBreakdown> orderTypeBreakdown;

  SalesData({
    required this.summary,
    required this.paymentMethodBreakdown,
    required this.orderTypeBreakdown,
  });

  factory SalesData.fromJson(Map<String, dynamic> json) {
    return SalesData(
      summary: Summary.fromJson(json['summary'] ?? {}),
      paymentMethodBreakdown:
          (json['paymentMethodBreakdown'] as List? ?? [])
              .map((e) => PaymentMethodBreakdown.fromJson(e))
              .toList(),
      orderTypeBreakdown:
          (json['orderTypeBreakdown'] as List? ?? [])
              .map((e) => OrderTypeBreakdown.fromJson(e))
              .toList(),
    );
  }
}

class Summary {
  final double totalSales;
  final int totalTransactions;
  final double avgOrderValue;
  final double totalTax;
  final double totalServiceFee;
  final double totalDiscount;
  final int totalItems;

  Summary({
    required this.totalSales,
    required this.totalTransactions,
    required this.avgOrderValue,
    required this.totalTax,
    required this.totalServiceFee,
    required this.totalDiscount,
    required this.totalItems,
  });

  factory Summary.fromJson(Map<String, dynamic> json) {
    return Summary(
      totalSales: (json['totalSales'] ?? 0).toDouble(),
      totalTransactions: json['totalTransactions'] ?? 0,
      avgOrderValue: (json['avgOrderValue'] ?? 0).toDouble(),
      totalTax: (json['totalTax'] ?? 0).toDouble(),
      totalServiceFee: (json['totalServiceFee'] ?? 0).toDouble(),
      totalDiscount: (json['totalDiscount'] ?? 0).toDouble(),
      totalItems: json['totalItems'] ?? 0,
    );
  }
}

class PaymentMethodBreakdown {
  final String method;
  final double amount;
  final int count;
  final String percentage;

  PaymentMethodBreakdown({
    required this.method,
    required this.amount,
    required this.count,
    required this.percentage,
  });

  factory PaymentMethodBreakdown.fromJson(Map<String, dynamic> json) {
    return PaymentMethodBreakdown(
      method: json['method'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      count: json['count'] ?? 0,
      percentage: json['percentage'] ?? '0',
    );
  }
}

class OrderTypeBreakdown {
  final String type;
  final int count;
  final double total;
  final String percentage;

  OrderTypeBreakdown({
    required this.type,
    required this.count,
    required this.total,
    required this.percentage,
  });

  factory OrderTypeBreakdown.fromJson(Map<String, dynamic> json) {
    return OrderTypeBreakdown(
      type: json['type'] ?? '',
      count: json['count'] ?? 0,
      total: (json['total'] ?? 0).toDouble(),
      percentage: json['percentage'] ?? '0',
    );
  }
}

class SalesFilter {
  final DateTime? startDate;
  final DateTime? endDate;
  final String? cashier;
  final String? paymentMethod;
  final String? orderType;

  SalesFilter({
    this.startDate,
    this.endDate,
    this.cashier,
    this.paymentMethod,
    this.orderType,
  });

  SalesFilter copyWith({
    DateTime? startDate,
    DateTime? endDate,
    String? cashier,
    String? paymentMethod,
    String? orderType,
  }) {
    return SalesFilter(
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      cashier: cashier ?? this.cashier,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      orderType: orderType ?? this.orderType,
    );
  }
}
