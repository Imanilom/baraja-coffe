class CartItem {
  final String name;
  final int qty;
  final double price;
  final String? note;
  final String? image;

  CartItem({
    required this.name,
    required this.qty,
    required this.price,
    this.note,
    this.image,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      name: json['name']?.toString() ?? '',
      qty: int.tryParse(json['qty']?.toString() ?? '1') ?? 1,
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      note: json['note']?.toString(),
      image: json['image']?.toString() ?? json['image_url']?.toString() ?? json['imageUrl']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'qty': qty,
        'price': price,
        if (note != null) 'note': note,
        if (image != null) 'image': image,
      };

  double get totalPrice => qty * price;
}
