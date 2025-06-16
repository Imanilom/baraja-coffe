import 'package:kasirbaraja/models/user.model.dart';
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  final _storage = const FlutterSecureStorage();

  // Simpan data
  Future<void> saveUserData(String token, String userId) async {
    await _storage.write(key: 'jwtToken', value: token);
    await _storage.write(key: 'userId', value: userId);
  }

  Future<void> saveDetailUser(UserModel user) async {
    await _storage.write(key: 'userDetails', value: jsonEncode(user.toJson()));
  }

  Future<UserModel?> getDetailUser() async {
    final json = await _storage.read(key: 'userDetails');
    if (json == null) return null;
    return UserModel.fromJson(jsonDecode(json));
  }

  Future<void> getUserData() async {}

  Future<void> saveFCMToken(String fcmToken) async {
    await _storage.write(key: 'fcmToken', value: fcmToken);
  }

  // Ambil data
  Future<String?> getToken() async {
    return await _storage.read(key: 'jwtToken');
  }

  Future<String?> getUserId() async {
    return await _storage.read(key: 'userId');
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }
}
