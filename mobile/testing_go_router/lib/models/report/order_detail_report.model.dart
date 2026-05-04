import 'package:kasirbaraja/models/order_detail.model.dart';

class OrderDetailReport {
  final bool success;
  final OrderDetailData data;

  OrderDetailReport({required this.success, required this.data});

  factory OrderDetailReport.fromJson(Map<String, dynamic> json) {
    return OrderDetailReport(
      success: json['success'] ?? false,
      data: OrderDetailData.fromJson(json['data'] ?? {}),
    );
  }
}

class OrderDetailData {
  final List<OrderDetailModel> orders;
  final Pagination pagination;

  OrderDetailData({required this.orders, required this.pagination});

  factory OrderDetailData.fromJson(Map<String, dynamic> json) {
    return OrderDetailData(
      orders:
          (json['orders'] as List? ?? [])
              .map((e) => OrderDetailModel.fromJson(e))
              .toList(),
      pagination: Pagination.fromJson(json['pagination'] ?? {}),
    );
  }
}

class Pagination {
  final int currentPage;
  final int totalPages;
  final int totalOrders;
  final bool hasNext;
  final bool hasPrev;

  Pagination({
    required this.currentPage,
    required this.totalPages,
    required this.totalOrders,
    required this.hasNext,
    required this.hasPrev,
  });

  factory Pagination.fromJson(Map<String, dynamic> json) {
    return Pagination(
      currentPage: json['currentPage'] ?? 1,
      totalPages: json['totalPages'] ?? 1,
      totalOrders: json['totalOrders'] ?? 0,
      hasNext: json['hasNext'] ?? false,
      hasPrev: json['hasPrev'] ?? false,
    );
  }
}
