import 'package:kasirbaraja/models/order_detail.model.dart';

extension OrderCalculations on OrderDetailModel {
  int calculateSubtotal() {
    return items.fold(0, (sum, item) => sum + (item.calculateSubTotalPrice()));
  }

  OrderDetailModel withCalculations({
    required int totalTax,
    required int totalServiceFee,
    required Map<String, dynamic> discounts,
  }) {
    final subtotal = calculateSubtotal();
    final taxAmount = totalTax;
    final serviceFee = totalServiceFee;
    final discount =
        (discounts['voucherDiscount'] ?? 0) +
        (discounts['manualDiscount'] ?? 0) +
        (discounts['autoPromoDiscount'] ?? 0);

    print('Data pending orders yg diambil: $discounts');

    return copyWith(
      subTotalPrice: subtotal,
      tax: taxAmount,
      serviceFee: serviceFee,
      totalPrice: (subtotal + taxAmount + serviceFee - discount).toInt(),
      discounts: {
        'voucher': discounts['voucherDiscount'] ?? 0,
        'manual': discounts['manualDiscount'] ?? 0,
        'autoPromo': discounts['autoPromoDiscount'] ?? 0,
      },
    );
  }
}
