import 'package:barajapos/models/adapter/user.model.dart';
import 'package:barajapos/models/adapter/cashier.model.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';

class HiveService {
  static Future<void> init() async {
    await Hive.initFlutter();
    Hive.registerAdapter(UserModelAdapter());
    Hive.registerAdapter(CashierModelAdapter());

    await Hive.openBox('userBox');
  }

  //simpan data user ke hive dengan userModel
  static Future<void> saveUser(UserModel user) async {
    final box = Hive.box('userBox');
    await box.put('user', user);
  }
}
