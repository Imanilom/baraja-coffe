import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';
import 'package:kasirbaraja/models/report/summary_report.model.dart';

class SalesReportService {
  // This class would contain methods to generate sales reports
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<SalesSummary> fetchSalesReportSummary(
    String outletId,
    String date,
  ) async {
    print('Fetching sales report for outletId: $outletId, date: $date');
    try {
      Response response = await _dio.get(
        '/api/report/sales/summary',
        queryParameters: {'outletId': outletId, 'date': date},
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
        return 'Connection timeout';
      case DioExceptionType.sendTimeout:
        return 'Send timeout';
      case DioExceptionType.receiveTimeout:
        return 'Receive timeout';
      case DioExceptionType.badResponse:
        return 'Server error: ${e.response?.statusCode}';
      case DioExceptionType.cancel:
        return 'Request cancelled';
      default:
        return 'Network error occurred';
    }
  }
}
