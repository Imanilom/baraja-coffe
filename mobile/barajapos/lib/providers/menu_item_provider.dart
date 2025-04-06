import 'package:barajapos/models/adapter/menu_item.model.dart';
import 'package:barajapos/repositories/menu_item_repository.dart';
import 'package:collection/collection.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final menuItemRepository =
    Provider<MenuItemRepository>((ref) => MenuItemRepository());

final categoryProvider = StateProvider<String>((ref) => 'Coffee');

final searchQueryProvider = StateProvider<String>((ref) => '');

final menuItemProvider = FutureProvider<List<MenuItemModel>>((ref) async {
  final menuItems = await ref.read(menuItemRepository).getMenuItem();
  var category = ref.watch(categoryProvider); // Ambil kategori yang dipilih
  var searchQuery = ref.watch(searchQueryProvider);

  // 🔹 Filter berdasarkan kategori
  var filteredProducts = menuItems
      .where((menuItem) => menuItem.categories.contains(category))
      .toList();

  // 🔹 Filter berdasarkan pencarian
  if (searchQuery.isNotEmpty) {
    filteredProducts = filteredProducts
        .where((menuItem) =>
            menuItem.name.toLowerCase().contains(searchQuery.toLowerCase()))
        .toList();
  }

  // 🔹 Kelompokkan berdasarkan sub kategori
  final groupedBySubCategory =
      groupBy(filteredProducts, (MenuItemModel item) => item.name);

  // 🔹 Ubah format menjadi list dengan key "subCategory"
  return groupedBySubCategory.entries.expand((entry) {
    return entry.value.map((menuItem) => menuItem);
  }).toList();
});
