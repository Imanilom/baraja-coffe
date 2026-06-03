class SalesAnalyticsReport {
  final bool success;
  final SalesAnalyticsData data;

  SalesAnalyticsReport({required this.success, required this.data});

  factory SalesAnalyticsReport.fromJson(Map<String, dynamic> json) {
    return SalesAnalyticsReport(
      success: json['success'] ?? false,
      data: SalesAnalyticsData.fromJson(json['data'] ?? {}),
    );
  }
}

class SalesAnalyticsData {
  final List<HourlySales> hourlySales;
  final List<TopSellingItem> topSellingItems;
  final List<DailyTrend> dailyTrend;

  SalesAnalyticsData({
    required this.hourlySales,
    required this.topSellingItems,
    required this.dailyTrend,
  });

  factory SalesAnalyticsData.fromJson(Map<String, dynamic> json) {
    return SalesAnalyticsData(
      hourlySales:
          (json['hourlySales'] as List? ?? [])
              .map((x) => HourlySales.fromJson(x))
              .toList(),
      topSellingItems:
          (json['topSellingItems'] as List? ?? [])
              .map((x) => TopSellingItem.fromJson(x))
              .toList(),
      dailyTrend:
          (json['dailyTrend'] as List? ?? [])
              .map((x) => DailyTrend.fromJson(x))
              .toList(),
    );
  }
}

class HourlySales {
  final int hour;
  final double totalSales;
  final int totalOrders;

  HourlySales({
    required this.hour,
    required this.totalSales,
    required this.totalOrders,
  });

  factory HourlySales.fromJson(Map<String, dynamic> json) {
    return HourlySales(
      hour: json['hour'] ?? 0,
      totalSales: (json['totalSales'] ?? 0).toDouble(),
      totalOrders: json['totalOrders'] ?? 0,
    );
  }
}

class TopSellingItem {
  final int rank;
  final MenuItem menuItem;
  final int totalQuantity;
  final double totalRevenue;
  final int orderCount;
  final String avgQuantityPerOrder;

  TopSellingItem({
    required this.rank,
    required this.menuItem,
    required this.totalQuantity,
    required this.totalRevenue,
    required this.orderCount,
    required this.avgQuantityPerOrder,
  });

  factory TopSellingItem.fromJson(Map<String, dynamic> json) {
    return TopSellingItem(
      rank: json['rank'] ?? 0,
      menuItem: MenuItem.fromJson(json['menuItem'] ?? {}),
      totalQuantity: json['totalQuantity'] ?? 0,
      totalRevenue: (json['totalRevenue'] ?? 0).toDouble(),
      orderCount: json['orderCount'] ?? 0,
      avgQuantityPerOrder: json['avgQuantityPerOrder'] ?? '0',
    );
  }
}

class MenuItem {
  final String id;
  final String name;
  final double price;
  final String category;

  MenuItem({
    required this.id,
    required this.name,
    required this.price,
    required this.category,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      category: json['category'] ?? '',
    );
  }
}

class DailyTrend {
  final String date;
  final double totalSales;
  final int totalOrders;
  final double avgOrderValue;

  DailyTrend({
    required this.date,
    required this.totalSales,
    required this.totalOrders,
    required this.avgOrderValue,
  });

  factory DailyTrend.fromJson(Map<String, dynamic> json) {
    return DailyTrend(
      date: json['date'] ?? '',
      totalSales: (json['totalSales'] ?? 0).toDouble(),
      totalOrders: json['totalOrders'] ?? 0,
      avgOrderValue: (json['avgOrderValue'] ?? 0).toDouble(),
    );
  }
}
