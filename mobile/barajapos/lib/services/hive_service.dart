import 'package:barajapos/models/adapter/addon.model.dart';
import 'package:barajapos/models/adapter/addon_option.model.dart';
import 'package:barajapos/models/adapter/menu_item.model.dart';
import 'package:barajapos/models/adapter/order_detail.model.dart';
import 'package:barajapos/models/adapter/order_item.model.dart';
import 'package:barajapos/models/adapter/saved_printer.model.dart';
import 'package:barajapos/models/adapter/topping.model.dart';
import 'package:barajapos/models/adapter/user.model.dart';
import 'package:barajapos/models/adapter/cashier.model.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';

class HiveService {
  static Future<void> init() async {
    await Hive.initFlutter();
    Hive.registerAdapter(UserModelAdapter());
    Hive.registerAdapter(CashierModelAdapter());
    Hive.registerAdapter(MenuItemModelAdapter());
    Hive.registerAdapter(ToppingModelAdapter());
    Hive.registerAdapter(AddonModelAdapter());
    Hive.registerAdapter(AddonOptionModelAdapter());
    Hive.registerAdapter(OrderItemModelAdapter());
    Hive.registerAdapter(OrderDetailModelAdapter());
    Hive.registerAdapter(SavedPrinterModelAdapter());

    await Hive.openBox('userBox'); // membuka box 'userBox'
    await Hive.openBox<MenuItemModel>('menuItemsBox');
  }

  //simpan data user ke hive dengan userModel
  static Future<void> saveUser(UserModel user) async {
    final box = Hive.box('userBox');
    await box.put('user', user);
  }

  static Future<UserModel?> getUser() async {
    final box = Hive.box('userBox');
    return box.get('user');
  }

  static Future<void> clearUser() async {
    final box = Hive.box('userBox');
    await box.clear();
  }

  //simpan list menu items ke hive
  static Future<void> saveMenuItems(List<MenuItemModel> menuItems) async {
    final box = Hive.box('menuItemsBox');
    await box.put('menuItems', menuItems);
  }

  static Future<List<MenuItemModel>?> getMenuItems() async {
    final box = Hive.box('menuItemsBox');
    return box.get('menuItems') as List<MenuItemModel>?;
  }

  static Future<void> clearMenuItems() async {
    final box = Hive.box<MenuItemModel>('menuItemsBox');
    await box.clear();
  }
}
