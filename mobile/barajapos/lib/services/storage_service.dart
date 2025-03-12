import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  final _storage = const FlutterSecureStorage();

  // Simpan data
  Future<void> saveUserData(String token, String userId) async {
    await _storage.write(key: 'jwtToken', value: token);
    await _storage.write(key: 'userId', value: userId);
  }

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
}
