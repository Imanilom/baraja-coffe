class UserModel {
  final String id;
  final String name;
  final String username;
  final String email;
  final String phone;
  final String profilePicture;
  final String role;
  final String cashierType;
  final String token;

  UserModel({
    required this.id,
    required this.name,
    required this.username,
    required this.email,
    required this.phone,
    required this.profilePicture,
    required this.role,
    required this.cashierType,
    required this.token,
  });

  // Factory method untuk parsing JSON ke UserModel
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? '', // Default value jika kosong
      name: json['name'] ?? '', // Default value jika kosong
      username: json['username'] ?? '', // Default value jika kosong
      email: json['email'] ?? '', // Default value jika kosong
      phone: json['phone'] ?? '', // Default value jika kosong
      profilePicture: json['profilePicture'] ?? '',
      cashierType: json['cashierType'] ?? '', // Default value jika kosong
      role: json['role'] ?? '', // Default value jika kosong
      token: json['token'] ?? '',
    );
  }

  // Method untuk mengubah UserModel menjadi JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'username': username,
      'email': email,
      'phone': phone,
      'profilePicture': profilePicture,
      'role': role,
      'cashierType': cashierType,
      'token': token,
    };
  }
}
