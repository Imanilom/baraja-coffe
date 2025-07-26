import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/addon_option.model.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/models/user.model.dart';
import 'package:kasirbaraja/models/cashier.model.dart';
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
    // Hive.registerAdapter(SavedPrinterModelAdapter());
    Hive.registerAdapter(BluetoothPrinterModelAdapter());
    Hive.registerAdapter(PaymentTypeModelAdapter());
    Hive.registerAdapter(PaymentMethodModelAdapter());

    await Future.wait([
      Hive.openBox('userBox'),
      Hive.openBox<MenuItemModel>('menuItemsBox'),
      Hive.openBox<BluetoothPrinterModel>('printers'),
    ]);
  }

  //simpan data user ke hive dengan userModel
  static Future<void> saveUser(UserModel user) async {
    final box = Hive.box('userBox');
    await box.put('user', user);
  }

  //simpan data cashier ke hive dengan cashierModel
  static Future<void> saveCashier(CashierModel cashier) async {
    final box = Hive.box('userBox');
    await box.put('cashier', cashier);
  }

  static Future<UserModel?> getUser() async {
    final box = Hive.box('userBox');
    final user = box.get('user') as UserModel;

    return user;
  }

  static Future<UserModel?> tryGetUser() async {
    final box = Hive.box('userBox');
    final user = box.get('user') as UserModel;

    return user;
  }

  static Future<CashierModel?> getCashier() async {
    final box = Hive.box('userBox');
    return box.get('cashier') as CashierModel?;
  }

  static Future<void> clearCashier() async {
    final box = Hive.box('userBox');
    await box.delete('cashier');
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
