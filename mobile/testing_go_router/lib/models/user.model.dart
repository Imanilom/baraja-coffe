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

  @HiveField(8)
  final String? outletId;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.phone,
    required this.profilePicture,
    required this.role,
    required this.token,
    this.cashiers,
    this.outletId,
  });

  // ... (fromJson dan toJson tetap sama)

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final List<CashierModel> cashiers =
        (json['cashiers'] as List?)
            ?.map((x) => CashierModel.fromJson(x))
            .toList() ??
        [];

    final String outletId = json['outlet'][0]['outletId']['_id'].toString();
    // (json['outlet'] as List?) != null && (json['outlet'] as List).isNotEmpty
    //     ? ((json['outlet'] as List).first['outletId']['_id'] as String? ??
    //         '')
    //     : '';

    return UserModel(
      id: json['_id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      profilePicture: json['profilePicture'] ?? '',
      role: json['role'] ?? '',
      token: json['token'] ?? '',
      cashiers: cashiers,
      outletId: outletId,
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
    'outletId': outletId,
  };
}

// Lakukan hal yang sama untuk Outlet dan OutletDetails
