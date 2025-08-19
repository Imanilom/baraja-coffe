import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/addon_option.model.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/outlet_info.model.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/models/tax_and_service.model.dart';
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
    Hive.registerAdapter(TaxAndServiceModelAdapter());
    Hive.registerAdapter(OutletInfoModelAdapter());

    await _openBoxes();
  }

  static Future<void> _openBoxes() async {
    await Hive.openBox('userBox');
    await Hive.openBox<MenuItemModel>('menuItemsBox');
    await Hive.openBox<BluetoothPrinterModel>('printers');
    await Hive.openBox<TaxAndServiceModel>('taxAndService');
    await Hive.openBox<PaymentTypeModel>('paymentMethods');
  }

  // Helper methods to get boxes
  static Box get userBox => Hive.box('userBox');
  static Box<MenuItemModel> get menuItemsBox =>
      Hive.box<MenuItemModel>('menuItemsBox');
  static Box<TaxAndServiceModel> get taxAndServiceBox =>
      Hive.box<TaxAndServiceModel>('taxAndService');
  static Box<PaymentTypeModel> get paymentMethodsBox =>
      Hive.box<PaymentTypeModel>('paymentMethods');

  // Clear all data (useful for logout or data refresh)
  static Future<void> clearAllData() async {
    await userBox.clear();
    await menuItemsBox.clear();
    await taxAndServiceBox.clear();
    await paymentMethodsBox.clear();
  }

  // Close all boxes (call this when app is closing)
  static Future<void> closeAllBoxes() async {
    await menuItemsBox.close();
    await taxAndServiceBox.close();
    await paymentMethodsBox.close();
  }

  // Check if data exists (to determine if sync is needed)
  static bool hasData() {
    return menuItemsBox.isNotEmpty ||
        taxAndServiceBox.isNotEmpty ||
        paymentMethodsBox.isNotEmpty;
  }

  // Get data count for each type
  static Map<String, int> getDataCounts() {
    return {
      'menuItemsBox': menuItemsBox.length,
      'taxAndService': taxAndServiceBox.length,
      'paymentMethods': paymentMethodsBox.length,
    };
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
