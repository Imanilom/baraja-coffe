// lib/services/data_sync_service.dart
import 'package:dio/dio.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/tax_and_service.model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/repositories/menu_item_repository.dart';
import 'package:kasirbaraja/configs/app_config.dart';

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

// Data sync service
class DataSyncService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  // Sync all data from server
  Future<void> syncAllData({
    required Function(DataSyncProgress) onProgress,
    // String? token,
  }) async {
    const totalSteps = 4;
    int currentStep = 0;

    try {
      // Set authorization header if token provided
      // if (token != null) {
      //   _dio.options.headers['Authorization'] = 'Bearer $token';
      // }

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

      // Step 2: Sync Tax and Service
      currentStep++;
      onProgress(
        DataSyncProgress(
          currentStep: currentStep,
          totalSteps: totalSteps,
          currentTask: 'Downloading tax and service data...',
        ),
      );
      await _syncTaxAndService();

      // Step 3: Sync Payment Methods
      currentStep++;
      onProgress(
        DataSyncProgress(
          currentStep: currentStep,
          totalSteps: totalSteps,
          currentTask: 'Downloading payment methods...',
        ),
      );
      await _syncPaymentMethods();

      // Completed
      onProgress(
        DataSyncProgress(
          currentStep: totalSteps,
          totalSteps: totalSteps,
          currentTask: 'Sync completed successfully!',
          isCompleted: true,
        ),
      );
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

  // Private method to sync tax and service
  Future<void> _syncTaxAndService() async {
    try {
      final response = await _dio.get('/api/tax-service');
      final List<dynamic> data = response.data;

      final taxServiceBox = await Hive.openBox<TaxAndServiceModel>(
        'taxAndService',
      );
      await taxServiceBox.clear(); // Clear existing data

      for (final item in data) {
        final taxService = TaxAndServiceModel.fromJson(item);
        await taxServiceBox.put(taxService.id, taxService);
      }
    } catch (e) {
      throw Exception('Failed to sync tax and service: $e');
    }
  }

  // Private method to sync payment methods
  Future<void> _syncPaymentMethods() async {
    try {
      final response = await _dio.get(
        '/api/paymentlist/payment-methods-and-types',
      );
      final List<dynamic> data = response.data['paymentTypes'] ?? response.data;

      final paymentMethodsBox = await Hive.openBox<PaymentTypeModel>(
        'paymentMethods',
      );
      await paymentMethodsBox.clear(); // Clear existing data

      for (final item in data) {
        final paymentType = PaymentTypeModel.fromJson(item);
        await paymentMethodsBox.put(paymentType.id, paymentType);
      }
    } catch (e) {
      throw Exception('Failed to sync payment methods: $e');
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
      // _authState.state = const AsyncValue.data(AuthStatus.needPin);
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
