import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/addon_option.model.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/models/device.model.dart';
import 'package:kasirbaraja/models/event.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/menu_stock.model.dart';
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
    Hive.registerAdapter(EventAdapter());
    Hive.registerAdapter(DeviceModelAdapter());
    Hive.registerAdapter(MenuStockModelAdapter());

    await _openBoxes();
  }

  static Future<void> _openBoxes() async {
    await Hive.openBox('userBox');
    await Hive.openBox<MenuItemModel>('menuItemsBox');
    await Hive.openBox<BluetoothPrinterModel>('printers');
    await Hive.openBox<TaxAndServiceModel>('taxAndService');
    await Hive.openBox<PaymentTypeModel>('paymentTypes');
    await Hive.openBox<Event>('eventsBox');
    await Hive.openBox<DeviceModel>('devices');
    // await Hive.openBox<DeviceModel>('loginDeviceBox');
  }

  // Helper methods to get boxes
  static Box get userBox => Hive.box('userBox');
  static Box<MenuItemModel> get menuItemsBox =>
      Hive.box<MenuItemModel>('menuItemsBox');
  static Box<TaxAndServiceModel> get taxAndServiceBox =>
      Hive.box<TaxAndServiceModel>('taxAndService');
  static Box<PaymentTypeModel> get paymentTypeBox =>
      Hive.box<PaymentTypeModel>('paymentTypes');
  static Box<Event> get eventBox => Hive.box<Event>('eventsBox');
  static Box<DeviceModel> get deviceBox => Hive.box<DeviceModel>('devices');

  //login device box
  // static Box<DeviceModel> get loginDeviceBox =>
  //     Hive.box<DeviceModel>('loginDeviceBox');

  // Clear all data (useful for logout or data refresh)
  static Future<void> clearAllData() async {
    await userBox.clear();
    await menuItemsBox.clear();
    await taxAndServiceBox.clear();
    await paymentTypeBox.clear();
    await eventBox.clear();
    await deviceBox.clear();
    // await loginDeviceBox.clear();
  }

  // Close all boxes (call this when app is closing)
  static Future<void> closeAllBoxes() async {
    await menuItemsBox.close();
    await taxAndServiceBox.close();
    await paymentTypeBox.close();
    await eventBox.close();
    await deviceBox.close();
    // await loginDeviceBox.close();
  }

  // Check if data exists (to determine if sync is needed)
  static bool hasData() {
    return menuItemsBox.isNotEmpty ||
        taxAndServiceBox.isNotEmpty ||
        paymentTypeBox.isNotEmpty ||
        eventBox.isNotEmpty ||
        deviceBox.isNotEmpty;
  }

  // Get data count for each type
  static Map<String, int> getDataCounts() {
    return {
      'menuItemsBox': menuItemsBox.length,
      'taxAndService': taxAndServiceBox.length,
      'paymentTypes': paymentTypeBox.length,
      'eventsBox': eventBox.length,
      'devices': deviceBox.length,
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

  //save device to cashier
  static Future<void> saveDevice(DeviceModel device) async {
    final box = Hive.box('userBox');
    await box.put('device', device);
  }

  //get device from cashier
  static Future<DeviceModel?> getDevice() async {
    final box = Hive.box('userBox');
    return box.get('device') as DeviceModel?;
  }

  static Future<UserModel?> getUser() async {
    final box = Hive.box('userBox');
    final user = box.get('user') as UserModel?;

    return user;
  }

  static Future<UserModel?> tryGetUser() async {
    final box = Hive.box('userBox');
    final user = box.get('user') as UserModel?;

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

  //get outletId dari user yang sudah disimpan di hive
  static Future<String> get outletId async {
    final box = Hive.box('userBox');
    final user = box.get('user') as UserModel?;
    return user?.outletId ?? '';
  }

  static Future<String> get userToken async {
    final box = Hive.box('userBox');
    final user = box.get('user') as UserModel?;
    return user?.token ?? '';
  }

  //saved device
  // static Future<void> saveLoginDevice(DeviceModel device) async {
  //   final box = Hive.box('loginDeviceBox');
  //   await box.put('loginDevice', device);
  // }

  // static Future<DeviceModel?> getLoginDevice() async {
  //   final box = Hive.box('loginDeviceBox');
  //   return box.get('loginDevice') as DeviceModel?;
  // }
}
