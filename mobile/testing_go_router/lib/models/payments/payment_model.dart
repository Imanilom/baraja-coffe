class PaymentMethod {
  final String id;
  final String name;
  final String type; // 'cash' atau 'edc'
  final String? logoUrl; // Untuk logo bank

  PaymentMethod({
    required this.id,
    required this.name,
    required this.type,
    this.logoUrl,
  });
}

class PaymentState {
  final PaymentMethod? selectedMethod;
  final int? selectedCashAmount; // Untuk tunai
  final String? selectedBankId; // Untuk EDC
  final int totalAmount;

  PaymentState({
    this.selectedMethod,
    this.selectedCashAmount,
    this.selectedBankId,
    required this.totalAmount,
  });

  PaymentState copyWith({
    PaymentMethod? selectedMethod,
    int? selectedCashAmount,
    String? selectedBankId,
    int? totalAmount,
  }) {
    return PaymentState(
      selectedMethod: selectedMethod ?? this.selectedMethod,
      selectedCashAmount: selectedCashAmount ?? this.selectedCashAmount,
      selectedBankId: selectedBankId ?? this.selectedBankId,
      totalAmount: totalAmount ?? this.totalAmount,
    );
  }

  // Hitung kembalian (untuk tunai)
  int get change =>
      (selectedCashAmount != null && selectedMethod?.type == 'cash')
          ? 0
          : selectedCashAmount! - totalAmount;
}
