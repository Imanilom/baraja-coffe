import 'package:barajapos/models/adapter/menu_item.model.dart';
import 'package:collection/collection.dart';
import 'package:hive_ce/hive.dart';

// Fungsi untuk mencari dan memfilter produk
List<Map<String, dynamic>> searchAndFilterProducts(
    String searchQuery, String category) {
  var productBox = Hive.box<MenuItemModel>('menuItemsBox');
  var allProducts = productBox.values.toList();

  // 1️⃣ Filter berdasarkan kategori
  var filteredProducts = allProducts
      .where((product) => product.categories!.contains(category))
      .toList();

  // 2️⃣ Cari produk berdasarkan nama
  if (searchQuery.isNotEmpty) {
    filteredProducts = filteredProducts
        .where((product) =>
            product.name!.toLowerCase().contains(searchQuery.toLowerCase()))
        .toList();
  }

  // 3️⃣ Kelompokkan berdasarkan sub-menu
  var groupedBySubCategory =
      groupBy(filteredProducts, (MenuItemModel product) => product.name);

  // 4️⃣ Konversi ke format yang bisa digunakan di UI
  return groupedBySubCategory.entries.map((entry) {
    return {
      "subCategory": entry.key,
      "products": entry.value,
    };
  }).toList();
}
