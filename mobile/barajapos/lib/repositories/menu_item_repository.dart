import 'package:barajapos/models/menu_item_model.dart';
import 'package:barajapos/services/menu_item_service.dart';

class MenuItemRepository {
  final MenuItemService _menuItemService = MenuItemService();

  Future<List<MenuItemModel>> getMenuItem() async {
    try {
      final menuItems = await _menuItemService.fetchMenuItems();

      return (menuItems['data'] as List)
          .map((json) => MenuItemModel.fromJson(json))
          .toList();
    } catch (e) {
      print("Gagal mengambil data menu: ${e.toString()}");
      rethrow;
    }
  }
}
