import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/services/menu_item_service.dart';
import 'package:hive_ce/hive.dart';

class MenuItemRepository {
  final MenuItemService _menuItemService = MenuItemService();

  Future<List<MenuItemModel>> getMenuItem() async {
    try {
      var productBox = Hive.box<MenuItemModel>('menuItemsBox');

      // 🔹 Jika data sudah ada, langsung ambil dari Hive
      if (productBox.isNotEmpty) {
        // return productBox.values.toList();
        // bandingkan id di Hive dengan id di API
        final menuItemsResponse = await _menuItemService.fetchMenuItems();
        final menuItemsList =
            (menuItemsResponse['data'] as List)
                .map((json) => MenuItemModel.fromJson(json))
                .toList();
        final existingIds = productBox.values.map((item) => item.id).toSet();
        final newItems =
            menuItemsList
                .where((item) => !existingIds.contains(item.id))
                .toList();
        await productBox.putAll({for (var item in newItems) item.id: item});

        //jika di server ada data yang dihilangkan, maka hapus dari Hive
        final idsToDelete =
            productBox.keys
                .where((id) => !menuItemsList.any((item) => item.id == id))
                .toList();
        await productBox.deleteAll(idsToDelete);

        return productBox.values.toList();
      }

      final menuItemsResponse = await _menuItemService.fetchMenuItems();
      print("Data menu yang diambil: ${menuItemsResponse['data'].length}");
      final menuItemsList =
          (menuItemsResponse['data'] as List)
              .map((json) => MenuItemModel.fromJson(json))
              .toList();

      print(
        "Data menu yg tidak diambil: ${menuItemsList.where((item) => item.category == null).length}",
      );

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
