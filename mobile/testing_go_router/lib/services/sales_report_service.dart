import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';
import 'package:kasirbaraja/models/report/summary_report.model.dart';

class SalesReportService {
  // This class would contain methods to generate sales reports
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<SalesSummary> fetchSalesReportSummary(
    String outletId,
    DateTime? startDate,
    DateTime? endDate,
    String? cashier,
    String? paymentMethod,
    String? orderType,
  ) async {
    print('Fetching sales report for outletId: $outletId');
    try {
      final queryParams = <String, dynamic>{};

      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }
      if (cashier != null && cashier.isNotEmpty) {
        queryParams['cashier'] = cashier;
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

      return SalesSummary.fromJson(response.data);
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
