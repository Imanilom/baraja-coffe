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

      print(
          "Data menu yg tidak diambil: ${menuItemsList.where((item) => item.categories == null).length}");

      // 🔹 Simpan data ke Hive
      await productBox.putAll({for (var item in menuItemsList) item.id: item});
      // await productBox.putAll({
      //   for (int i = 0; i < menuItemsList.length; i++)
      //     menuItemsList[i].id ?? 'item_$i': menuItemsList[i],
      // });

      return menuItemsList;
    } catch (e) {
      print("Gagal mengambil data menu: ${e.toString()}");
      rethrow;
    }
  }
}
