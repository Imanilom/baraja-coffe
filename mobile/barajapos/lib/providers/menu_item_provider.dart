import 'package:barajapos/models/try/try_menu_item_model.dart';
import 'package:barajapos/repositories/menu_item_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final menuItemRepository =
    Provider<MenuItemRepository>((ref) => MenuItemRepository());

final menuItemProvider = FutureProvider<List<TryMenuItemModel>>((ref) async {
  final repository = ref.read(menuItemRepository);
  return repository.getMenuItem();
});
