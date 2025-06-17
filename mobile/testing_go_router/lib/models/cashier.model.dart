import 'package:hive_ce/hive.dart';

part 'adapter/cashier.model.g.dart'; // File yang akan digenerate

@HiveType(typeId: 7)
class CashierModel {
  @HiveField(0)
  final String? id;

  @HiveField(1)
  final String? username;
  @HiveField(2)
  final String? role;
  @HiveField(3)
  final String? cashierType;
  @HiveField(4)
  final String? password;
  @HiveField(5)
  final String? profilePicture;
  // @HiveField(6)

  CashierModel({
    required this.id,
    // required this.name,
    required this.username,
    required this.role,
    this.cashierType,
    required this.password,
    this.profilePicture,
  });

  factory CashierModel.fromJson(Map<String, dynamic> json) => CashierModel(
    id: json['_id'] ?? '',
    // name: json['name'] ?? '',
    username: json['username'] ?? '',
    role: json['role'] ?? '',
    cashierType: json['cashierType'] ?? '',
    password: json['password'] ?? '',
    profilePicture: json['profilePicture'] ?? '',
  );

  //tojson
  Map<String, dynamic> toJson() => {
    'id': id,
    // 'name': name,
    'username': username,
    'role': role,
    'cashierType': cashierType,
    'password': password,
    'profilePicture': profilePicture,
  };
}
