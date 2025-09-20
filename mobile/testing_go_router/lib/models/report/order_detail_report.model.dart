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
  final List<Order> orders;
  final Pagination pagination;

  OrderDetailData({required this.orders, required this.pagination});

  factory OrderDetailData.fromJson(Map<String, dynamic> json) {
    return OrderDetailData(
      orders:
          (json['orders'] as List? ?? [])
              .map((e) => Order.fromJson(e))
              .toList(),
      pagination: Pagination.fromJson(json['pagination'] ?? {}),
    );
  }
}

class Order {
  final String orderId;
  final DateTime createdAt;
  final String customerName;
  final String cashier;
  final String outlet;
  final String orderType;
  final String tableNumber;
  final String paymentMethod;
  final String status;
  final List<OrderItem> items;
  final OrderPricing pricing;

  Order({
    required this.orderId,
    required this.createdAt,
    required this.customerName,
    required this.cashier,
    required this.outlet,
    required this.orderType,
    required this.tableNumber,
    required this.paymentMethod,
    required this.status,
    required this.items,
    required this.pricing,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      orderId: json['orderId'] ?? '',
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
      customerName: json['customerName'] ?? '',
      cashier: json['cashier'] ?? '',
      outlet: json['outlet'] ?? '',
      orderType: json['orderType'] ?? '',
      tableNumber: json['tableNumber'] ?? '',
      paymentMethod: json['paymentMethod'] ?? '',
      status: json['status'] ?? '',
      items:
          (json['items'] as List? ?? [])
              .map((e) => OrderItem.fromJson(e))
              .toList(),
      pricing: OrderPricing.fromJson(json['pricing'] ?? {}),
    );
  }

  // Helper method untuk total items
  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);

  // Helper method untuk items display
  String get itemsDisplay {
    if (items.isEmpty) return 'No items';
    if (items.length == 1) {
      return '${items.first.quantity}x ${items.first.name}';
    }
    return '${items.length} items ($totalItems qty)';
  }
}

class OrderItem {
  final String name;
  final int quantity;
  final double price;
  final double subtotal;
  final String category;
  final List<String> selectedToppings;
  final List<String> selectedAddons;
  final String notes;

  OrderItem({
    required this.name,
    required this.quantity,
    required this.price,
    required this.subtotal,
    required this.category,
    required this.selectedToppings,
    required this.selectedAddons,
    required this.notes,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      name: json['name'] ?? '',
      quantity: json['quantity'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      category: json['category'] ?? '',
      selectedToppings: List<String>.from(json['selectedToppings'] ?? []),
      selectedAddons: List<String>.from(json['selectedAddons'] ?? []),
      notes: json['notes'] ?? '',
    );
  }
}

class OrderPricing {
  final double totalBeforeDiscount;
  final double totalDiscount;
  final double totalTax;
  final double totalServiceFee;
  final double grandTotal;

  OrderPricing({
    required this.totalBeforeDiscount,
    required this.totalDiscount,
    required this.totalTax,
    required this.totalServiceFee,
    required this.grandTotal,
  });

  factory OrderPricing.fromJson(Map<String, dynamic> json) {
    return OrderPricing(
      totalBeforeDiscount: (json['totalBeforeDiscount'] ?? 0).toDouble(),
      totalDiscount: (json['totalDiscount'] ?? 0).toDouble(),
      totalTax: (json['totalTax'] ?? 0).toDouble(),
      totalServiceFee: (json['totalServiceFee'] ?? 0).toDouble(),
      grandTotal: (json['grandTotal'] ?? 0).toDouble(),
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
