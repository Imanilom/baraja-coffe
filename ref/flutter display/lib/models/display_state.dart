import 'cart_item.dart';

class DisplayState {
  final String deviceId;
  final List<CartItem> items;
  final double discountRate;
  final int status; // 0: Ordering, 1: Payment, 2: Paid
  final String orderNumber;
  final String? customerName;
  final String? tableName;
  final String? paymentMethod;
  final double? paymentAmount;
  final double? changeAmount;
  final String? qrisUrl;
  final String? qrisPayload;
  final int timestamp;

  DisplayState({
    required this.deviceId,
    required this.items,
    required this.discountRate,
    required this.status,
    required this.orderNumber,
    this.customerName,
    this.tableName,
    this.paymentMethod,
    this.paymentAmount,
    this.changeAmount,
    this.qrisUrl,
    this.qrisPayload,
    required this.timestamp,
  });

  factory DisplayState.initial({String deviceId = 'default'}) {
    return DisplayState(
      deviceId: deviceId,
      items: [],
      discountRate: 0.0,
      status: 0,
      orderNumber: '-',
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
  }

  factory DisplayState.fromJson(Map<String, dynamic> json, {String deviceId = 'default'}) {
    List<CartItem> parsedItems = [];
    if (json['items'] is List) {
      parsedItems = (json['items'] as List)
          .map((i) => CartItem.fromJson(i as Map<String, dynamic>))
          .toList();
    }

    return DisplayState(
      deviceId: json['device_id']?.toString() ?? deviceId,
      items: parsedItems,
      discountRate: double.tryParse(json['discount_rate']?.toString() ?? '0') ?? 0.0,
      status: int.tryParse(json['status']?.toString() ?? '0') ?? 0,
      orderNumber: json['order_number']?.toString() ?? '-',
      customerName: json['customer_name']?.toString(),
      tableName: json['table_name']?.toString(),
      paymentMethod: json['payment_method']?.toString(),
      paymentAmount: json['payment_amount'] != null
          ? double.tryParse(json['payment_amount'].toString())
          : null,
      changeAmount: json['change_amount'] != null
          ? double.tryParse(json['change_amount'].toString())
          : null,
      qrisUrl: json['qris_url']?.toString(),
      qrisPayload: json['qris_payload']?.toString(),
      timestamp: int.tryParse(json['timestamp']?.toString() ?? '0') ??
          DateTime.now().millisecondsSinceEpoch,
    );
  }

  bool get hasItems => items.isNotEmpty;

  String? get qrisImageUrl {
    // 1. If we have raw QRIS payload (EMVCo qr_string from Midtrans)
    if (qrisPayload != null && qrisPayload!.trim().isNotEmpty) {
      final p = qrisPayload!.trim();
      if (p.startsWith('http://') || p.startsWith('https://')) {
        return p;
      }
      return 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${Uri.encodeComponent(p)}';
    }
    // 2. If we have qrisUrl
    if (qrisUrl != null && qrisUrl!.trim().isNotEmpty) {
      final u = qrisUrl!.trim();
      if (u.startsWith('http://') || u.startsWith('https://')) {
        return u;
      }
      return 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${Uri.encodeComponent(u)}';
    }
    return null;
  }

  double get subtotal => items.fold(0.0, (sum, item) => sum + item.totalPrice);
  double get discountAmount => subtotal * discountRate;
  double get taxAmount => 0.0;
  double get grandTotal => subtotal - discountAmount;
}
