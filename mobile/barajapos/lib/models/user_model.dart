class UserModel {
  String id;
  // String name;
  String username;
  String email;
  String phone;
  String profilePicture;
  String role;
  String cashierType;
  // final List<Outlet> outlet;
  String token;

  UserModel({
    required this.id,
    // required this.name,
    required this.username,
    required this.email,
    required this.phone,
    required this.profilePicture,
    required this.role,
    required this.cashierType,
    // required this.outlet,
    required this.token,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'],
      // name: json['name'],
      username: json['username'],
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      profilePicture: json['profilePicture'] ?? '',
      role: json['role'],
      cashierType: json['cashierType'] ?? '',
      // outlet: (json['outlet'] as List<dynamic>)
      //     .map((o) => Outlet.fromJson(o))
      //     .toList(),
      token: json['token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      // 'name': name,
      'username': username,
      'email': email,
      'phone': phone,
      'profilePicture': profilePicture,
      'role': role,
      'cashierType': cashierType,
      // 'outlet': outlet.map((o) => o.toJson()).toList(),
      'token': token,
    };
  }
}

class Outlet {
  final String id;
  final OutletDetails outletId;

  Outlet({required this.id, required this.outletId});

  factory Outlet.fromJson(Map<String, dynamic> json) {
    return Outlet(
      id: json['_id'],
      outletId: OutletDetails.fromJson(json['outletId']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'outletId': outletId.toJson(),
    };
  }
}

class OutletDetails {
  final String id;
  final String name;
  final Admin admin;

  OutletDetails({required this.id, required this.name, required this.admin});

  factory OutletDetails.fromJson(Map<String, dynamic> json) {
    return OutletDetails(
      id: json['_id'],
      name: json['name'],
      admin: Admin.fromJson(json['admin']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'admin': admin.toJson(),
    };
  }
}

class Admin {
  final String id;
  final String name;

  Admin({required this.id, required this.name});

  factory Admin.fromJson(Map<String, dynamic> json) {
    return Admin(
      id: json['_id'],
      name: json['name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
    };
  }
}
