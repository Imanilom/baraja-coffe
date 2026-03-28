import 'package:dio/dio.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:kasirbaraja/configs/app_config.dart';
import 'package:kasirbaraja/models/report/analytic_report.model.dart';
import 'package:kasirbaraja/models/report/order_detail_report.model.dart';
import 'package:kasirbaraja/models/report/summary_report.model.dart';
import 'package:kasirbaraja/models/report/performance_report.model.dart';
import 'package:kasirbaraja/models/report/cash_recap_model.dart';

class SalesReportService {
  // This class would contain methods to generate sales reports
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<SalesSummary> fetchSalesReportSummary(
    String outletId,
    DateTime? startDate,
    DateTime? endDate,
    String? cashierId,
    String? paymentMethod,
    String? orderType,
  ) async {
    AppLogger.info('Fetching sales report for outletId: $outletId');
    try {
      final queryParams = <String, dynamic>{};

      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }
      if (cashierId != null && cashierId.isNotEmpty) {
        queryParams['cashierId'] = cashierId;
      }
      if (paymentMethod != null && paymentMethod.isNotEmpty) {
        queryParams['paymentMethod'] = paymentMethod;
      }
      if (orderType != null && orderType.isNotEmpty) {
        queryParams['orderType'] = orderType;
      }
      queryParams['outletId'] = outletId;

      Response response = await _dio.get(
        '/api/report/sales/summary',
        queryParameters: queryParams,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      final summary = SalesSummary.fromJson(response.data);

      AppLogger.debug('summary: ${response.data}');
      return summary;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }

  Future<OrderDetailReport> fetchOrderDetailReport({
    String? outletId,
    DateTime? startDate,
    DateTime? endDate,
    String? cashierId,
    String? paymentMethod,
    String? orderType,
    int page = 1,
    int limit = 20,
  }) async {
    AppLogger.info('Fetching order detail report for outletId: $outletId');
    try {
      final queryParams = <String, dynamic>{'page': page, 'limit': limit};

      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }
      if (cashierId != null && cashierId.isNotEmpty) {
        queryParams['cashierId'] = cashierId;
      }
      if (paymentMethod != null && paymentMethod.isNotEmpty) {
        queryParams['paymentMethod'] = paymentMethod;
      }
      if (orderType != null && orderType.isNotEmpty) {
        queryParams['orderType'] = orderType;
      }
      queryParams['outletId'] = outletId;

      Response response = await _dio.get(
        '/api/report/sales/order-detail',
        queryParameters: queryParams,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      return OrderDetailReport.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }

  Future<SalesAnalyticsReport> fetchSalesAnalyticsReport({
    String? outletId,
    DateTime? startDate,
    DateTime? endDate,
    String? cashierId,
    String? paymentMethod,
    String? orderType,
  }) async {
    AppLogger.info('Fetching sales analysis report for outletId: $outletId');
    try {
      final queryParams = <String, dynamic>{};

      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }
      if (cashierId != null && cashierId.isNotEmpty) {
        queryParams['cashierId'] = cashierId;
      }
      if (paymentMethod != null && paymentMethod.isNotEmpty) {
        queryParams['paymentMethod'] = paymentMethod;
      }
      if (orderType != null && orderType.isNotEmpty) {
        queryParams['orderType'] = orderType;
      }
      queryParams['outletId'] = outletId;

      Response response = await _dio.get(
        '/api/report/sales/analytics',
        queryParameters: queryParams,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      return SalesAnalyticsReport.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }

  Future<PerformanceReportModel> fetchPerformanceReport({
    String? outletId,
    DateTime? startDate,
    DateTime? endDate,
    String? cashierId,
  }) async {
    AppLogger.info('Fetching performance report for outletId: $outletId');
    try {
      final queryParams = <String, dynamic>{};

      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }
      queryParams['outletId'] = outletId;

      AppLogger.debug('cashier Id: $cashierId');
      if (cashierId != null && cashierId.isNotEmpty) {
        queryParams['cashierId'] = cashierId;
      }

      Response response = await _dio.get(
        '/api/report/sales/performance',
        queryParameters: queryParams,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      return PerformanceReportModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }

  Future<CashRecapModel> fetchCashRecap({
    required String outletId,
    required String deviceId,
  }) async {
    AppLogger.info('Fetching cash recap for deviceId: $deviceId');
    try {
      Response response = await _dio.post(
        '/api/report/cash-recap',
        data: {'outletId': outletId, 'deviceId': deviceId},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      return CashRecapModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }

  Future<CashRecapModel> reprintCashRecap({
    required String outletId,
    required String deviceId,
  }) async {
    AppLogger.info('Reprinting cash recap for deviceId: $deviceId');
    try {
      Response response = await _dio.post(
        '/api/report/cash-recap/reprint',
        data: {'outletId': outletId, 'deviceId': deviceId},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      return CashRecapModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }

  Future<void> confirmSaveCashRecap({
    required CashRecapModel recap,
    required String outletId,
    required String deviceId,
  }) async {
    AppLogger.info('Confirming and saving cash recap for deviceId: $deviceId');
    try {
      await _dio.post(
        '/api/report/cash-recap/save',
        data: {
          'outletId': outletId,
          'deviceId': deviceId,
          'period': {
            'start': recap.startDate.toIso8601String(),
            'end': recap.endDate.toIso8601String(),
          },
          'totalCash': recap.totalCash,
          'orderCount': recap.orderCount,
          'orders':
              recap.orders
                  .map((o) => {'id': o.id, 'time': o.time, 'amount': o.amount})
                  .toList(),
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }

  String _handleDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        return 'Connection timeout - Periksa koneksi internet';
      case DioExceptionType.sendTimeout:
        return 'Send timeout - Server tidak merespon';
      case DioExceptionType.receiveTimeout:
        return 'Receive timeout - Data terlalu lama diunduh';
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        switch (statusCode) {
          case 400:
            return 'Bad request - Parameter tidak valid';
          case 401:
            return 'Unauthorized - Silakan login kembali';
          case 403:
            return 'Forbidden - Akses ditolak';
          case 404:
            return 'Not found - Endpoint tidak ditemukan';
          case 500:
            return 'Server error - Silakan coba lagi nanti';
          default:
            return 'Server error: $statusCode';
        }
      case DioExceptionType.cancel:
        return 'Request dibatalkan';
      default:
        return 'Network error - Periksa koneksi internet';
    }
  }
}
