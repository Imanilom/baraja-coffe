import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/services/menu_item_service.dart';
import 'package:hive_ce/hive.dart';

class MenuItemRepository {
  final MenuItemService _menuItemService = MenuItemService();

  Future<List<MenuItemModel>> getMenuItem() async {
    try {
      var productBox = Hive.box<MenuItemModel>('menuItemsBox');

      // Ambil data dari API
      final menuItemsResponse = await _menuItemService.fetchMenuItems();
      final menuItemsList =
          (menuItemsResponse['data'] as List)
              .map((json) => MenuItemModel.fromJson(json))
              .toList();

      // Urutkan data API berdasarkan nama (abjad)
      menuItemsList.sort(
        (a, b) => a.name!.toLowerCase().compareTo(b.name!.toLowerCase()),
      );

      if (productBox.isNotEmpty) {
        // Buat map untuk akses cepat data lokal berdasarkan ID
        final localItemsMap = Map<String, MenuItemModel>.fromEntries(
          productBox.values.map((item) => MapEntry(item.id, item)),
        );

        // Buat map untuk akses cepat data API berdasarkan ID
        final apiItemsMap = Map<String, MenuItemModel>.fromEntries(
          menuItemsList.map((item) => MapEntry(item.id, item)),
        );

        // 1. Cek item yang perlu diupdate atau ditambah
        for (var apiItem in menuItemsList) {
          final localItem = localItemsMap[apiItem.id];

          if (localItem == null) {
            // Item baru - tambahkan
            print("Menambah item baru: ${apiItem.name}");
            await productBox.put(apiItem.id, apiItem);
          } else if (_hasDataChanged(localItem, apiItem)) {
            // Item sudah ada tapi data berubah - update
            print("Mengupdate item: ${apiItem.name}");
            await productBox.put(apiItem.id, apiItem);
          }
        }

        // 2. Hapus item yang tidak ada di API
        final idsToDelete =
            localItemsMap.keys
                .where((id) => !apiItemsMap.containsKey(id))
                .toList();

        if (idsToDelete.isNotEmpty) {
          print("Menghapus ${idsToDelete.length} item yang sudah tidak ada");
          await productBox.deleteAll(idsToDelete);
        }

        // Return data yang sudah diurutkan dari Hive
        final sortedLocalData = productBox.values.toList();
        sortedLocalData.sort(
          (a, b) => a.name!.toLowerCase().compareTo(b.name!.toLowerCase()),
        );
        return sortedLocalData;
      } else {
        // Jika Hive kosong, simpan semua data yang sudah diurutkan
        print("Data menu yang diambil: ${menuItemsResponse['data'].length}");
        await productBox.putAll({
          for (var item in menuItemsList) item.id: item,
        });
        return menuItemsList; // Sudah diurutkan di atas
      }
    } catch (e) {
      print("Gagal mengambil data menu: ${e.toString()}");

      // Fallback: return data lokal jika ada error (dengan sorting)
      var productBox = Hive.box<MenuItemModel>('menuItemsBox');
      if (productBox.isNotEmpty) {
        print("Menggunakan data lokal karena error");
        final localData = productBox.values.toList();
        localData.sort(
          (a, b) => a.name!.toLowerCase().compareTo(b.name!.toLowerCase()),
        );
        return localData;
      }

      rethrow;
    }
  }

  //get menu item yang disimpan di Hive
  Future<List<MenuItemModel>> getLocalMenuItems() async {
    var productBox = Hive.box<MenuItemModel>('menuItemsBox');
    final localData = productBox.values.toList();
    // Urutkan data lokal juga berdasarkan abjad
    localData.sort(
      (a, b) => a.name!.toLowerCase().compareTo(b.name!.toLowerCase()),
    );
    return localData;
  }

  /// Membandingkan apakah data item telah berubah
  bool _hasDataChanged(MenuItemModel local, MenuItemModel api) {
    // Bandingkan field-field penting
    return local.name != api.name ||
        local.originalPrice != api.originalPrice ||
        local.discountedPrice != api.discountedPrice ||
        local.description != api.description ||
        local.mainCategory != api.mainCategory ||
        local.subCategory != api.subCategory ||
        local.imageURL != api.imageURL ||
        local.discountPercentage != api.discountPercentage ||
        local.averageRating != api.averageRating ||
        local.reviewCount != api.reviewCount ||
        local.isAvailable != api.isAvailable ||
        local.workstation != api.workstation ||
        _hasToppingsChanged(local.toppings, api.toppings) ||
        _hasAddonsChanged(local.addons, api.addons);
  }

  /// Membandingkan apakah toppings berubah
  bool _hasToppingsChanged(List<ToppingModel>? local, List<ToppingModel>? api) {
    if (local == null && api == null) return false;
    if (local == null || api == null) return true;
    if (local.length != api.length) return true;

    // Buat set untuk perbandingan yang lebih efisien
    final localSet = local.map((t) => '${t.id}_${t.name}_${t.price}').toSet();
    final apiSet = api.map((t) => '${t.id}_${t.name}_${t.price}').toSet();

    return !localSet.equals(apiSet);
  }

  /// Membandingkan apakah addons berubah
  bool _hasAddonsChanged(List<AddonModel>? local, List<AddonModel>? api) {
    if (local == null && api == null) return false;
    if (local == null || api == null) return true;
    if (local.length != api.length) return true;

    // Buat set untuk perbandingan yang lebih efisien
    final localSet =
        local
            .map(
              (a) =>
                  '${a.id}_${a.name}_${a.options!.map((o) => '${o.id}_${o.label}_${o.price}')}',
            )
            .toSet();
    final apiSet =
        api
            .map(
              (a) =>
                  '${a.id}_${a.name}_${a.options!.map((o) => '${o.id}_${o.label}_${o.price}')}',
            )
            .toSet();

    return !localSet.equals(apiSet);
  }
}

// Extension untuk membandingkan Set
extension SetComparison<T> on Set<T> {
  bool equals(Set<T> other) {
    if (length != other.length) return false;
    return every(other.contains);
  }
}
