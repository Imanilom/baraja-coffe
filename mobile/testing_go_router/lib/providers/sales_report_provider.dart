import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/sales_report_service.dart';
import 'package:kasirbaraja/models/report/summary_report.model.dart';

final salesReportServiceProvider = Provider<SalesReportService>(
  (ref) => SalesReportService(),
);

class SalesFilterNotifier extends StateNotifier<SalesFilter> {
  SalesFilterNotifier()
    : super(
        SalesFilter(
          startDate: DateTime.now().subtract(const Duration(days: 7)),
          endDate: DateTime.now(),
        ),
      );

  void updateDateRange(DateTime startDate, DateTime endDate) {
    state = state.copyWith(startDate: startDate, endDate: endDate);
  }

  void updateCashier(String? cashier) {
    state = state.copyWith(cashier: cashier);
  }

  void updatePaymentMethod(String? paymentMethod) {
    state = state.copyWith(paymentMethod: paymentMethod);
  }

  void updateOrderType(String? orderType) {
    state = state.copyWith(orderType: orderType);
  }

  void resetFilter() {
    state = SalesFilter(
      startDate: DateTime.now().subtract(const Duration(days: 7)),
      endDate: DateTime.now(),
    );
  }
}

final salesFilterProvider =
    StateNotifierProvider<SalesFilterNotifier, SalesFilter>(
      (ref) => SalesFilterNotifier(),
    );

class SalesSummaryNotifier extends AsyncNotifier<SalesSummary> {
  @override
  Future<SalesSummary> build() async {
    final filter = ref.watch(salesFilterProvider);
    return _fetchSalesSummary(filter);
  }

  Future<SalesSummary> _fetchSalesSummary(SalesFilter filter) async {
    final apiService = ref.read(salesReportServiceProvider);
    return await apiService.fetchSalesReportSummary(
      HiveService.outletId,
      filter.startDate,
      filter.endDate,
      filter.cashier,
      filter.paymentMethod,
      filter.orderType,
    );
  }

  Future<void> refresh() async {
    final filter = ref.watch(salesFilterProvider);
    state = const AsyncValue.loading();
    try {
      final data = await _fetchSalesSummary(filter);
      state = AsyncValue.data(data);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

final salesSummaryProvider =
    AsyncNotifierProvider<SalesSummaryNotifier, SalesSummary>(
      () => SalesSummaryNotifier(),
    );
