import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/utils/app_logger.dart';

class SavedOrderRepository {
  /// Get all saved orders from local Hive box
  List<OrderDetailModel> getSavedOrders() {
    try {
      final box = HiveService.savedOrdersBox;
      if (box.isOpen) {
        // Return list sorted by updatedAt descending (newest first)
        final List<OrderDetailModel> orders = box.values.toList();
        orders.sort((a, b) {
          final aTime = a.updatedAt ?? DateTime(2000);
          final bTime = b.updatedAt ?? DateTime(2000);
          return bTime.compareTo(aTime);
        });
        return orders;
      }
      return [];
    } catch (e) {
      AppLogger.error('Failed to fetch saved orders', error: e);
      return [];
    }
  }

  /// Save or Update an order to local Hive box
  Future<void> saveOrder(OrderDetailModel order) async {
    try {
      final box = HiveService.savedOrdersBox;
      if (order.orderId != null) {
        await box.put(order.orderId!, order);
      } else {
        AppLogger.error('Cannot save order without orderId');
      }
    } catch (e) {
      AppLogger.error('Failed to save order locally', error: e);
      rethrow;
    }
  }

  /// Delete an order from local Hive box
  Future<void> deleteOrder(String orderId) async {
    try {
      final box = HiveService.savedOrdersBox;
      await box.delete(orderId);
    } catch (e) {
      AppLogger.error('Failed to delete saved order', error: e);
      rethrow;
    }
  }
}
