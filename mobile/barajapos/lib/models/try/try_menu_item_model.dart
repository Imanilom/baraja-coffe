class TryMenuItemModel {
  String id;
  String name;
  final double price;
  String description;
  final List<String> category;
  String imageURL;
  final List<Topping> toppings;
  List<Addon>? addons;
  // final List<AvailableAt> availableAt;

  TryMenuItemModel({
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

  factory TryMenuItemModel.fromJson(Map<String, dynamic> json) {
    final List<Topping> toppings = json['toppings'] != null
        ? List<Topping>.from(json['toppings'].map((x) => Topping.fromJson(x)))
        : [];

    final List<Addon> addons = json['addons'] != null
        ? List<Addon>.from(json['addons'].map((x) => Addon.fromJson(x)))
        : [];

    return TryMenuItemModel(
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

class Topping {
  final String? id;
  final String name;
  final double price;

  Topping({
    this.id,
    required this.name,
    required this.price,
  });

  factory Topping.fromJson(Map<String, dynamic> json) {
    return Topping(
      id: json['_id'],
      name: json['name'],
      price: json['price'],
    );
  }
}

class Addon {
  final String? id;
  final String name;
  final List<Option> options;

  Addon({
    this.id,
    required this.name,
    required this.options,
  });

  factory Addon.fromJson(Map<String, dynamic> json) {
    final List<Option> options = json['options'] != null
        ? List<Option>.from(json['options'].map((x) => Option.fromJson(x)))
        : [];

    return Addon(
      id: json['_id'],
      name: json['name'],
      options: options,
    );
  }
}

class Option {
  final String label;
  final double price;

  Option({
    required this.label,
    required this.price,
  });

  factory Option.fromJson(Map<String, dynamic> json) {
    return Option(
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
