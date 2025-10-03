import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/report/analytic_report.model.dart';
import 'package:kasirbaraja/models/report/order_detail_report.model.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/sales_report_service.dart';
import 'package:kasirbaraja/models/report/summary_report.model.dart';
import 'package:kasirbaraja/models/report/performance_report.model.dart';

class OrderDetailState {
  final List<Order> orders;
  final Pagination pagination;
  final bool isLoadingMore;

  OrderDetailState({
    required this.orders,
    required this.pagination,
    this.isLoadingMore = false,
  });

  OrderDetailState copyWith({
    List<Order>? orders,
    Pagination? pagination,
    bool? isLoadingMore,
  }) {
    return OrderDetailState(
      orders: orders ?? this.orders,
      pagination: pagination ?? this.pagination,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    );
  }
}

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

  void updateCashier(String? cashierId) {
    state = state.copyWith(cashierId: cashierId);
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
      await HiveService.outletId,
      filter.startDate,
      filter.endDate,
      filter.cashierId,
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

class OrderDetailReportNotifier extends AsyncNotifier<OrderDetailState> {
  @override
  Future<OrderDetailState> build() async {
    final filter = ref.watch(salesFilterProvider);
    final response = await _fetchOrders(filter, 1);

    return OrderDetailState(
      orders: response.data.orders,
      pagination: response.data.pagination,
    );
  }

  Future<OrderDetailReport> _fetchOrders(SalesFilter filter, int page) async {
    final service = ref.read(salesReportServiceProvider);
    return await service.fetchOrderDetailReport(
      outletId: await HiveService.outletId,
      startDate: filter.startDate,
      endDate: filter.endDate,
      cashierId: filter.cashierId,
      paymentMethod: filter.paymentMethod,
      orderType: filter.orderType,
      page: page,
    );
  }

  Future<void> refresh() async {
    final filter = ref.read(salesFilterProvider);
    state = const AsyncValue.loading();

    try {
      final response = await _fetchOrders(filter, 1);
      state = AsyncValue.data(
        OrderDetailState(
          orders: response.data.orders,
          pagination: response.data.pagination,
        ),
      );
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> loadMore() async {
    final currentState = state.value;
    if (currentState == null ||
        currentState.isLoadingMore ||
        !currentState.pagination.hasNext) {
      return;
    }

    state = AsyncValue.data(currentState.copyWith(isLoadingMore: true));

    try {
      final filter = ref.read(salesFilterProvider);
      final nextPage = currentState.pagination.currentPage + 1;
      final response = await _fetchOrders(filter, nextPage);

      final newOrders = [...currentState.orders, ...response.data.orders];

      state = AsyncValue.data(
        OrderDetailState(
          orders: newOrders,
          pagination: response.data.pagination,
          isLoadingMore: false,
        ),
      );
    } catch (error) {
      state = AsyncValue.data(currentState.copyWith(isLoadingMore: false));
      // Optionally show error message
    }
  }
}

final orderDetailReportProvider =
    AsyncNotifierProvider<OrderDetailReportNotifier, OrderDetailState>(
      () => OrderDetailReportNotifier(),
    );

class SalesAnaliticsNotifier extends AsyncNotifier<SalesAnalyticsReport> {
  @override
  Future<SalesAnalyticsReport> build() async {
    final filter = ref.watch(salesFilterProvider);
    return _fetchSalesAnalytics(filter);
  }

  Future<SalesAnalyticsReport> _fetchSalesAnalytics(SalesFilter filter) async {
    final apiService = ref.read(salesReportServiceProvider);
    return await apiService.fetchSalesAnalyticsReport(
      outletId: await HiveService.outletId,
      startDate: filter.startDate,
      endDate: filter.endDate,
      cashierId: filter.cashierId,
      paymentMethod: filter.paymentMethod,
      orderType: filter.orderType,
    );
  }

  Future<void> refresh() async {
    final filter = ref.watch(salesFilterProvider);
    state = const AsyncValue.loading();
    try {
      final data = await _fetchSalesAnalytics(filter);
      state = AsyncValue.data(data);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

final salesAnalyticsProvider =
    AsyncNotifierProvider<SalesAnaliticsNotifier, SalesAnalyticsReport>(
      () => SalesAnaliticsNotifier(),
    );

class SalesPerformanceNotifier extends AsyncNotifier<PerformanceReportModel> {
  @override
  Future<PerformanceReportModel> build() async {
    final filter = ref.watch(salesFilterProvider);
    return _fetchSalesPerformance(filter);
  }

  Future<PerformanceReportModel> _fetchSalesPerformance(
    SalesFilter filter,
  ) async {
    final apiService = ref.read(salesReportServiceProvider);
    return await apiService.fetchPerformanceReport(
      outletId: await HiveService.outletId,
      startDate: filter.startDate,
      endDate: filter.endDate,
      cashierId: filter.cashierId,
      // paymentMethod: filter.paymentMethod,
      // orderType: filter.orderType,
    );
  }

  Future<void> refresh() async {
    final filter = ref.watch(salesFilterProvider);
    state = const AsyncValue.loading();
    try {
      final data = await _fetchSalesPerformance(filter);
      state = AsyncValue.data(data);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

final performanceReportProvider =
    AsyncNotifierProvider<SalesPerformanceNotifier, PerformanceReportModel>(
      () => SalesPerformanceNotifier(),
    );
