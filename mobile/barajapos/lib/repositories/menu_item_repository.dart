import 'package:barajapos/models/try/try_menu_item_model.dart';
import 'package:barajapos/services/menu_item_service.dart';

class MenuItemRepository {
  final MenuItemService _menuItemService = MenuItemService();

  Future<List<TryMenuItemModel>> getMenuItem() async {
    try {
      final menuItems = await _menuItemService.fetchMenuItems();

      return (menuItems['data'] as List)
          .map((json) => TryMenuItemModel.fromJson(json))
          .toList();
    } catch (e) {
      print("Gagal mengambil data menu: ${e.toString()}");
      rethrow;
    }
  }
}
