class MenuItemModel {
  final String id;
  final String name;
  final double price;
  final String? description;
  final String? category;
  final String? imageURL;
  final List<ToppingModel>? toppings;
  final List<AddOnModel?>? addOns;
  final String? createdAt;
  final String? updatedAt;

  MenuItemModel({
    required this.id,
    required this.name,
    required this.price,
    this.description,
    this.category,
    this.imageURL,
    this.toppings,
    this.addOns,
    this.createdAt,
    this.updatedAt,
  });

  // Factory method untuk parsing JSON ke MenuItemModel
  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    return MenuItemModel(
      id: json['_id'],
      name: json['name'],
      price: json['price'].toDouble(),
      description: json['description'],
      category: json['category'],
      imageURL: json['imageURL'],
      toppings: (json['toppings'] as List?) // Jika toppings kosong atau null
              ?.map((topping) => ToppingModel.fromJson(topping))
              .toList() ??
          [], // Default value list kosong
      addOns: (json['addOns'] as List?) // Jika addOns kosong atau null
              ?.map((addOn) => AddOnModel.fromJson(addOn))
              .toList() ??
          [],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }

  // Method untuk mengubah MenuItemModel menjadi JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'price': price,
      'description': description,
      'category': category,
      'imageURL': imageURL,
      'toppings': toppings?.map((topping) => topping.toJson()).toList() ?? [],
      'addOns': addOns?.map((addOn) => addOn?.toJson()).toList() ?? [],
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

class ToppingModel {
  final String id;
  final String name;
  final double price;
  final String? createdAt;

  ToppingModel({
    required this.id,
    required this.name,
    required this.price,
    this.createdAt,
  });

  // Factory method untuk parsing JSON ke ToppingModel
  factory ToppingModel.fromJson(Map<String, dynamic> json) {
    return ToppingModel(
      id: json['_id'],
      name: json['name'],
      price: json['price'].toDouble(),
      createdAt: json['createdAt'] ?? '',
    );
  }

  // Method untuk mengubah ToppingModel menjadi JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'price': price,
      'createdAt': createdAt,
    };
  }
}

class AddOnModel {
  final String id;
  final String name;
  final String type;
  final List<AddOnOptionModel> options;
  final bool? isActive;
  final String? createdAt;

  AddOnModel({
    required this.id,
    required this.name,
    required this.type,
    required this.options,
    this.isActive,
    this.createdAt,
  });

  AddOnModel copyWith({
    String? id,
    String? name,
    String? type,
    List<AddOnOptionModel>? options,
    bool? isActive,
    String? createdAt,
  }) {
    return AddOnModel(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      options: options ?? this.options,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  // Factory method untuk parsing JSON ke AddOnModel
  factory AddOnModel.fromJson(Map<String, dynamic> json) {
    return AddOnModel(
      id: json['_id'],
      name: json['name'],
      type: json['type'],
      options: (json['options'] as List)
          .map((option) => AddOnOptionModel.fromJson(option))
          .toList(),
      isActive: json['isActive'] ?? false,
      createdAt: json['createdAt'] ?? '',
    );
  }

  // Method untuk mengubah AddOnModel menjadi JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'type': type,
      'options': options.map((option) => option.toJson()).toList(),
      'isActive': isActive,
      'createdAt': createdAt,
    };
  }
}

class AddOnOptionModel {
  final String id;
  final String label;
  final double price;

  AddOnOptionModel({
    required this.id,
    required this.label,
    required this.price,
  });

  // Factory method untuk parsing JSON ke AddOnOptionModel
  factory AddOnOptionModel.fromJson(Map<String, dynamic> json) {
    return AddOnOptionModel(
      id: json['_id'],
      label: json['label'],
      price: json['price'].toDouble(),
    );
  }

  // Method untuk mengubah AddOnOptionModel menjadi JSON
  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'price': price,
      '_id': id,
    };
  }
}
