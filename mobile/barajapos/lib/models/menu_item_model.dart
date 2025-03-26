class MenuItemModel {
  String id;
  String name;
  final double price;
  String description;
  final List<String> category;
  String imageURL;
  final List<ToppingModel> toppings;
  List<AddonModel>? addons;
  // final List<AvailableAt> availableAt;

  MenuItemModel({
    required this.id,
    required this.name,
    required this.price,
    required this.description,
    required this.category,
    required this.imageURL,
    required this.toppings,
    this.addons,
    // required this.availableAt,
  });

  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    final List<ToppingModel> toppings = json['toppings'] != null
        ? List<ToppingModel>.from(
            json['toppings'].map((x) => ToppingModel.fromJson(x)))
        : [];

    final List<AddonModel> addons = json['addons'] != null
        ? List<AddonModel>.from(
            json['addons'].map((x) => AddonModel.fromJson(x)))
        : [];

    return MenuItemModel(
      id: json['_id'],
      name: json['name'],
      price: json['price'],
      description: json['description'],
      category: List<String>.from(json['category']),
      imageURL: json['imageURL'],
      toppings: toppings,
      addons: addons,
      // availableAt: List<AvailableAt>.from(
      //     json['availableAt'].map((x) => AvailableAt.fromJson(x))),
    );
  }
}

class ToppingModel {
  final String? id;
  final String name;
  final double price;

  ToppingModel({
    this.id,
    required this.name,
    required this.price,
  });

  factory ToppingModel.fromJson(Map<String, dynamic> json) {
    return ToppingModel(
      id: json['_id'],
      name: json['name'],
      price: json['price'],
    );
  }
}

class AddonModel {
  final String? id;
  final String name;
  final String? type;
  final List<AddonOptionModel> options;

  AddonModel({
    this.id,
    required this.name,
    this.type,
    required this.options,
  });

  AddonModel copyWith({
    String? id,
    String? name,
    String? type,
    List<AddonOptionModel>? options,
    bool? isActive,
    String? createdAt,
  }) {
    return AddonModel(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      options: options ?? this.options,
    );
  }

  factory AddonModel.fromJson(Map<String, dynamic> json) {
    final List<AddonOptionModel> options = json['options'] != null
        ? List<AddonOptionModel>.from(
            json['options'].map((x) => AddonOptionModel.fromJson(x)))
        : [];

    return AddonModel(
      id: json['_id'],
      name: json['name'],
      options: options,
    );
  }
}

class AddonOptionModel {
  final String? id;
  final String label;
  final double price;

  AddonOptionModel({
    this.id,
    required this.label,
    required this.price,
  });

  factory AddonOptionModel.fromJson(Map<String, dynamic> json) {
    return AddonOptionModel(
      id: json['_id'],
      label: json['label'],
      price: json['price'],
    );
  }
}

class AvailableAt {
  final String id;
  final String name;
  final String address;
  final String city;
  final double latitude;
  final double longitude;
  final String contactNumber;
  final String admin;
  final List<String> outletPictures;

  AvailableAt({
    required this.id,
    required this.name,
    required this.address,
    required this.city,
    required this.latitude,
    required this.longitude,
    required this.contactNumber,
    required this.admin,
    required this.outletPictures,
  });

  factory AvailableAt.fromJson(Map<String, dynamic> json) {
    return AvailableAt(
      id: json['_id'],
      name: json['name'],
      address: json['address'],
      city: json['city'],
      latitude: json['latitude'].toDouble(),
      longitude: json['longitude'].toDouble(),
      contactNumber: json['contactNumber'],
      admin: json['admin'],
      outletPictures: List<String>.from(json['outletPictures']),
    );
  }
}
