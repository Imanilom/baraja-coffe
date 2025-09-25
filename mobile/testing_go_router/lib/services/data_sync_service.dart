// lib/services/data_sync_service.dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/repositories/event_repository.dart';
import 'package:kasirbaraja/repositories/menu_item_repository.dart';
import 'package:kasirbaraja/repositories/payment_type_repository.dart';
import 'package:kasirbaraja/repositories/tax_and_service_repository.dart';
import 'package:kasirbaraja/services/hive_service.dart';
// import 'package:kasirbaraja/services/hive_service.dart';

// Data sync progress state
class DataSyncProgress {
  final int currentStep;
  final int totalSteps;
  final String currentTask;
  final bool isCompleted;
  final String? error;
  final double progress;

  DataSyncProgress({
    required this.currentStep,
    required this.totalSteps,
    required this.currentTask,
    this.isCompleted = false,
    this.error,
  }) : progress = currentStep / totalSteps;

  DataSyncProgress copyWith({
    int? currentStep,
    int? totalSteps,
    String? currentTask,
    bool? isCompleted,
    String? error,
  }) {
    return DataSyncProgress(
      currentStep: currentStep ?? this.currentStep,
      totalSteps: totalSteps ?? this.totalSteps,
      currentTask: currentTask ?? this.currentTask,
      isCompleted: isCompleted ?? this.isCompleted,
      error: error ?? this.error,
    );
  }
}

class DataSyncService {
  Future<void> syncAllData({
    required Function(DataSyncProgress) onProgress,
    // String? token,
  }) async {
    const totalSteps = 3;
    int currentStep = 0;

    try {
      // Step 1: Sync Menu Items
      currentStep++;
      onProgress(
        DataSyncProgress(
          currentStep: currentStep,
          totalSteps: totalSteps,
          currentTask: 'Downloading menu items...',
        ),
      );
      await MenuItemRepository().getMenuItem();

      currentStep++;
      onProgress(
        DataSyncProgress(
          currentStep: currentStep,
          totalSteps: totalSteps,
          currentTask: 'Downloading stock...',
        ),
      );
      await MenuItemRepository().getMenuItemStock();

      // Step 2: Sync Tax and Service
      currentStep++;
      onProgress(
        DataSyncProgress(
          currentStep: currentStep,
          totalSteps: totalSteps,
          currentTask: 'Downloading Event...',
        ),
      );
      await EventRepository().getEvents();
      // Step 2: Sync Tax and Service
      currentStep++;
      onProgress(
        DataSyncProgress(
          currentStep: currentStep,
          totalSteps: totalSteps,
          currentTask: 'Downloading tax and service data...',
        ),
      );
      await TaxAndServiceRepository().getTaxAndServices();

      // Step 3: Sync Payment Methods
      currentStep++;
      onProgress(
        DataSyncProgress(
          currentStep: currentStep,
          totalSteps: totalSteps,
          currentTask: 'Downloading payment methods...',
        ),
      );
      await PaymentTypeRepository().getPaymentTypes();

      // Completed
      onProgress(
        DataSyncProgress(
          currentStep: totalSteps,
          totalSteps: totalSteps,
          currentTask: 'Sync completed successfully!',
          isCompleted: true,
        ),
      );

      print('Event data count: ${HiveService.eventBox.length}');
      print('MenuItem data count: ${HiveService.menuItemsBox.length}');
      print('TaxAndService data count: ${HiveService.taxAndServiceBox.length}');
      print('PaymentType data count: ${HiveService.paymentTypeBox.length}');
    } catch (e) {
      onProgress(
        DataSyncProgress(
          currentStep: currentStep,
          totalSteps: totalSteps,
          currentTask: 'Sync failed',
          error: e.toString(),
        ),
      );
      rethrow;
    }
  }
}

// Riverpod providers
final dioProvider = Provider<Dio>((ref) {
  return Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
    ),
  );
});

final dataSyncServiceProvider = Provider<DataSyncService>(
  (ref) => DataSyncService(),
);

// State notifier for data sync
class DataSyncNotifier extends StateNotifier<DataSyncProgress?> {
  final DataSyncService _dataSyncService;
  final TryAuthNotifier _authState;

  DataSyncNotifier(this._dataSyncService, this._authState) : super(null);

  Future<void> syncData({String? token}) async {
    try {
      await _dataSyncService.syncAllData(
        onProgress: (progress) {
          state = progress;
        },
        // token: token,
      );
      await _authState.checkLoginStatus();
    } catch (e) {
      // Error is already handled in syncAllData
      rethrow;
    }
  }

  void reset() {
    state = null;
  }
}

final dataSyncProvider =
    StateNotifierProvider<DataSyncNotifier, DataSyncProgress?>((ref) {
      final dataSyncService = ref.read(dataSyncServiceProvider);
      final authState = ref.read(tryAuthProvider.notifier);
      return DataSyncNotifier(dataSyncService, authState);
    });
