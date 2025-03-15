import 'package:barajapos/models/menu_item_model.dart';
import 'package:barajapos/services/menu_item_service.dart';

class MenuItemRepository {
  final MenuItemService _menuItemService = MenuItemService();

  Future<List<MenuItemModel>> fetchMenu() async {
    try {
      final menuItems = await _menuItemService.menuItem();
      print("Fetched Menu Items: ${menuItems.toString()}");

      final List<dynamic> menuList = menuItems['data'];
      return menuList.map((json) => MenuItemModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception("Gagal mengambil data menu: ${e.toString()}");
    }
  }
}
