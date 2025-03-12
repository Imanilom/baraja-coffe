import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

class AuthRepository {
  final AuthService _authService;
  final StorageService _storage;

  AuthRepository(this._authService, this._storage);

  Future<UserModel> login(String username, String password) async {
    final data = await _authService.login(username, password);
    final userData = UserModel.fromJson(data);

    await _storage.saveUserData(userData.token, userData.id);
    print([
      "Token: ${userData.token}",
      "User ID: ${userData.id}",
      "name: ${userData.name} - ${userData.username}",
      "role: ${userData.role} - ${userData.cashierType}",
    ]);
    return userData;
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }
}
