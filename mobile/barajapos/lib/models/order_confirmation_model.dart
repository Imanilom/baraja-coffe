import 'package:barajapos/models/order_item_model.dart';

class OrderConfirmationModel {
  final String customerId; // ID customer
  final String customerName; // Nama customer
  final String cashierId; // ID cashier yang sedang login
  final List<OrderItemModel> items; // Daftar item pesanan
  final String orderType; // Dine-In atau Takeaway
  final String? deliveryAddress; // Alamat pengiriman (opsional)
  final int tableNumber; // Nomor meja (jika Dine-In)
  final String paymentMethod; // Metode pembayaran (Cash, EDC, Midtrans)
  final String status; // Status pesanan (Pending, Paid, dll)
  final String? phoneNumber; // Nomor telepon (opsional)
  final double totalPrice; // Total harga pesanan

  OrderConfirmationModel({
    required this.customerId,
    required this.customerName,
    required this.cashierId,
    required this.items,
    required this.orderType,
    this.deliveryAddress,
    required this.tableNumber,
    required this.paymentMethod,
    required this.status,
    this.phoneNumber,
    required this.totalPrice,
  });

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
