import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/repositories/menu_item_repository.dart';
import 'package:collection/collection.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final menuItemRepository = Provider<MenuItemRepository>(
  (ref) => MenuItemRepository(),
);

// final categoryProvider = StateProvider<String>((ref) => 'Chocolate');
// final categoryProvider = StateProvider<String>((ref) => 'Appetizer');
final categoryProvider = StateProvider<String>((ref) => 'All');

final searchQueryProvider = StateProvider<String>((ref) => '');

final searchBarProvider = StateProvider<bool>((ref) => false);

final menuItemProvider = FutureProvider<List<MenuItemModel>>((ref) async {
  final menuItems = await ref.read(menuItemRepository).getMenuItem();
  // return menuItems ?? [];
  var category = ref.watch(categoryProvider); // Ambil kategori yang dipilih
  var searchQuery = ref.watch(searchQueryProvider);

  // 🔹 Filter berdasarkan kategori
  // var filteredProducts = menuItems
  //     .where((menuItem) => menuItem.categories!.contains(category))
  //     .toList();
  var filteredProducts =
      category == 'All'
          ? menuItems
          : menuItems
              .where(
                (menuItem) => (menuItem.categories ?? []).contains(category),
              ) // amanin null
              .toList();

  // 🔹 Filter berdasarkan pencarian
  if (searchQuery.isNotEmpty) {
    filteredProducts =
        filteredProducts
            .where(
              (menuItem) => menuItem.name!.toLowerCase().contains(
                searchQuery.toLowerCase(),
              ),
            )
            .toList();
  }

  // 🔹 Kelompokkan berdasarkan sub kategori
  final groupedBySubCategory = groupBy(
    filteredProducts,
    (MenuItemModel item) => item.name,
  );

  // 🔹 Ubah format menjadi list dengan key "subCategory"
  return groupedBySubCategory.entries.expand((entry) {
    return entry.value.map((menuItem) => menuItem);
  }).toList();
});
