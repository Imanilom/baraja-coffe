import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';

extension OrderCalculations on OrderDetailModel {
  int calculateSubtotal() {
    return items.fold(0, (sum, item) => sum + (item.subtotal));
  }

  // OrderDetailModel withCalculations({
  //   required int totalTax,
  //   required int totalServiceFee,
  //   required Map<String, dynamic> discounts,
  // }) {
  //   final subtotal = calculateSubtotal();
  //   final taxAmount = totalTax;
  //   final serviceFee = totalServiceFee;
  //   final discount =
  //       (discounts['voucherDiscount'] ?? 0) +
  //       (discounts['manualDiscount'] ?? 0) +
  //       (discounts['autoPromoDiscount'] ?? 0);

  //   print('Data pending orders yg diambil: $discounts');

  //   return copyWith(
  //     subTotalPrice: subtotal,
  //     tax: taxAmount,
  //     serviceFee: serviceFee,
  //     totalPrice: (subtotal + taxAmount + serviceFee - discount).toInt(),
  //     discounts: {
  //       'voucher': discounts['voucherDiscount'] ?? 0,
  //       'manual': discounts['manualDiscount'] ?? 0,
  //       'autoPromo': discounts['autoPromoDiscount'] ?? 0,
  //     },
  //   );
  // }
}

// ========== UTILITY EXTENSIONS ==========
extension PaymentMethodExtension on PaymentMethodModel {
  bool get hasCashPayment => id == 'cash';

  bool get hasMultipleMethods => paymentTypes.length > 1;

  List<PaymentTypeModel> get activeTypes =>
      paymentTypes.where((method) => method.isActive).toList();
}

extension PaymentTypeExtensionon on PaymentTypeModel {
  bool get isCash => typeCode.toLowerCase() == 'cash';

  bool get isEWallet => methodIds.contains('ewallet');

  bool get isDebit => methodIds.contains('debit');

  bool get isBankTransfer => methodIds.contains('banktransfer');
}
