class AutoPromoType {
  static const String productSpecific = 'product_specific';
  static const String bundling = 'bundling';
  static const String discountOnQuantity = 'discount_on_quantity';
  static const String discountOnTotal = 'discount_on_total';
  static const String buyXGetY = 'buy_x_get_y';
}

class AutoPromoHelper {
  static String getAutoPromoTypeDisplay(String autoPromoType) {
    switch (autoPromoType) {
      case AutoPromoType.productSpecific:
        return 'Produk Spesifik';
      case AutoPromoType.bundling:
        return 'Bundling';
      case AutoPromoType.discountOnQuantity:
        return 'Diskon Jumlah';
      case AutoPromoType.discountOnTotal:
        return 'Diskon Total';
      case AutoPromoType.buyXGetY:
        return 'Beli X Gratis Y';
      default:
        return autoPromoType;
    }
  }
}
