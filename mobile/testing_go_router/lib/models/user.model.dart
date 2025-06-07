import 'package:kasirbaraja/models/cashier.model.dart';
import 'package:hive_ce/hive.dart';

part 'adapter/user.model.g.dart'; // File yang akan digenerate

@HiveType(typeId: 6)
class UserModel {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String username;

  @HiveField(2)
  final String email;

  @HiveField(3)
  final String phone;

  @HiveField(4)
  final String profilePicture;

  @HiveField(5)
  final String role;

  @HiveField(6)
  final String token;

  @HiveField(7)
  final List<CashierModel>? cashiers;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.phone,
    required this.profilePicture,
    required this.role,
    required this.token,
    this.cashiers,
  });

  // ... (fromJson dan toJson tetap sama)

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final List<CashierModel> cashiers =
        (json['cashiers'] as List?)
            ?.map((x) => CashierModel.fromJson(x))
            .toList() ??
        [];

    return UserModel(
      id: json['_id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      profilePicture: json['profilePicture'] ?? '',
      role: json['role'] ?? '',
      token: json['token'] ?? '',
      cashiers: cashiers,
    );
  }

  Map<String, dynamic> toJson() => {
    '_id': id,
    'username': username,
    'email': email,
    'phone': phone,
    'profilePicture': profilePicture,
    'role': role,
    'token': token,
    'cashiers': cashiers?.map((x) => x.toJson()).toList(),
  };
}

// Lakukan hal yang sama untuk Outlet dan OutletDetails
