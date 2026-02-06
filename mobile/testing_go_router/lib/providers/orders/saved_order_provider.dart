import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/repositories/saved_order_repository.dart';

// Repository Provider
final savedOrderRepositoryProvider = Provider<SavedOrderRepository>((ref) {
  return SavedOrderRepository();
});

// Notifier
class SavedOrderNotifier extends AsyncNotifier<List<OrderDetailModel>> {
  @override
  Future<List<OrderDetailModel>> build() async {
    return _fetchSavedOrders();
  }

  Future<List<OrderDetailModel>> _fetchSavedOrders() async {
    final repository = ref.read(savedOrderRepositoryProvider);
    // Simulate async if needed, or just return synchronous hive access
    // Hive access is sync for values, but async for opening box (already opened in main).
    return repository.getSavedOrders();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    try {
      final data = await _fetchSavedOrders();
      state = AsyncValue.data(data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> deleteOrder(String orderId) async {
    final repository = ref.read(savedOrderRepositoryProvider);
    try {
      await repository.deleteOrder(orderId);
      // Refresh list after deletion
      await refresh();
    } catch (e) {
      // Handle error (maybe show toast via listener in UI)
      rethrow;
    }
  }
}

// Global Provider
final savedOrderProvider =
    AsyncNotifierProvider<SavedOrderNotifier, List<OrderDetailModel>>(() {
      return SavedOrderNotifier();
    });
