// import 'package:hive_ce/hive.dart';

// class BillingService {
//   static Future<void> saveBilling(Billing billing) async {
//     var box = await Hive.openBox<Billing>('billingBox');
//     await box.put(billing.id, billing);
//   }

//   static Future<List<Billing>> getAllBilling() async {
//     var box = await Hive.openBox<Billing>('billingBox');
//     return box.values.toList();
//   }

//   static Future<void> deleteBilling(String id) async {
//     var box = await Hive.openBox<Billing>('billingBox');
//     await box.delete(id);
//   }

//   static Future<void> clearAllBilling() async {
//     var box = await Hive.openBox<Billing>('billingBox');
//     await box.clear();
//   }
// }
