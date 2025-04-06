import 'package:barajapos/models/adapter/menu_item.model.dart';
import 'package:barajapos/services/menu_item_service.dart';
import 'package:hive_ce/hive.dart';

class MenuItemRepository {
  final MenuItemService _menuItemService = MenuItemService();

  Future<List<MenuItemModel>> getMenuItem() async {
    try {
      var productBox = Hive.box<MenuItemModel>('menuItemsBox');

      // 🔹 Jika data sudah ada, langsung ambil dari Hive
      if (productBox.isNotEmpty) {
        return productBox.values.toList();
      }

      final menuItemsResponse = await _menuItemService.fetchMenuItems();
      final menuItemsList = (menuItemsResponse['data'] as List)
          .map((json) => MenuItemModel.fromJson(json))
          .toList();

      // 🔹 Simpan data ke Hive
      await productBox.putAll({for (var item in menuItemsList) item.id: item});

      return menuItemsList;
    } catch (e) {
      print("Gagal mengambil data menu: ${e.toString()}");
      rethrow;
    }
  }
}
