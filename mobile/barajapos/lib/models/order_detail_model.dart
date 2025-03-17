import 'package:barajapos/models/order_item_model.dart';

class OrderDetailModel {
  final String? customerId; // ID customer
  final String? customerName; // Nama customer
  final String cashierId; // ID cashier yang sedang login
  final String? phoneNumber; // Nomor telepon (opsional)
  final List<OrderItemModel> items; // Daftar item pesanan
  final String orderType; // Dine-In atau Takeaway
  final String? deliveryAddress; // Alamat pengiriman (opsional)
  final int? tableNumber; // Nomor meja (jika Dine-In)
  final String? paymentMethod; // Metode pembayaran (Cash, EDC, Midtrans)
  final String? status; // Status pesanan (Pending, Paid, dll)
  final double? totalPrice; // Total harga pesanan

  OrderDetailModel({
    this.customerId,
    this.customerName,
    required this.cashierId,
    this.phoneNumber,
    required this.items,
    required this.orderType,
    this.deliveryAddress,
    this.tableNumber,
    this.paymentMethod,
    this.status,
    this.totalPrice,
  });

  // Copy object dengan perubahan nilai tertentu
  OrderDetailModel copyWith({
    String? customerId,
    String? customerName,
    String? cashierId,
    String? phoneNumber,
    List<OrderItemModel>? items,
    String? orderType,
    String? deliveryAddress,
    int? tableNumber,
    String? paymentMethod,
    String? status,
    double? totalPrice,
  }) {
    return OrderDetailModel(
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      cashierId: cashierId ?? this.cashierId,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      items: items ?? this.items,
      orderType: orderType ?? this.orderType,
      deliveryAddress: deliveryAddress ?? this.deliveryAddress,
      tableNumber: tableNumber ?? this.tableNumber,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      status: status ?? this.status,
      totalPrice: totalPrice ?? this.totalPrice,
    );
  }

  // Konversi ke format JSON untuk request backend
  Map<String, dynamic> toJson() {
    return {
      'customerId': customerId,
      'customer': customerName,
      'cashier': cashierId,
      'items': items.map((item) => item.toJson()).toList(),
      'orderType': orderType,
      'deliveryAddress': deliveryAddress ?? '',
      'tableNumber': tableNumber,
      'paymentMethod': paymentMethod,
      'status': status,
      'phoneNumber': phoneNumber ?? '',
      'totalPrice': totalPrice,
    };
  }
}
