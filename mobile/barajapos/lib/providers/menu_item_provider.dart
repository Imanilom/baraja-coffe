import 'package:barajapos/configs/menu_item_data.dart';
import 'package:barajapos/models/menu_item_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:barajapos/repositories/menu_item_repository.dart';

final menuItemProvider = FutureProvider<List<MenuItemModel>>((ref) async {
  // final menu = MenuItemRepository();
  // return menu.fetchMenu();
  return dummyMenuItems;
});
