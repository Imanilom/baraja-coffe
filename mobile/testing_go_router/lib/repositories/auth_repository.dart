import '../models/user.model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import '../services/hive_service.dart';

class AuthRepository {
  final AuthService _authService;
  final StorageService _storage;

  AuthRepository(this._authService, this._storage);

  Future<UserModel> login(String username, String password) async {
    try {
      final data = await _authService.login(username, password);
      final userData = UserModel.fromJson(data);

      await _storage.saveDetailUser(userData);
      await _storage.saveUserData(userData.token, userData.id);
      print('login berhasil $userData[outletId]');
      //masukan data user ke hive?
      await HiveService.saveUser(userData);

      return userData;
    } catch (e) {
      print('login dan simpan data gagal $e');
      rethrow;
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }

  Future<UserModel?> getCurrentUser() async {
    final token = await _storage.getToken();
    if (token == null) return null;

    try {
      if (JwtDecoder.isExpired(token)) {
        await logout(); // 🔹 Hapus token jika sudah expired
        return null;
      }
      final userData = await _storage.getDetailUser();
      return userData;
    } catch (e) {
      return null; // 🔹 Jika API gagal, anggap user tidak login
    }
  }
}
