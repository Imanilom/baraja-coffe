import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';

class SalesReportService {
  // This class would contain methods to generate sales reports
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<Map<String, dynamic>> fetchSalesReportSummary(
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

      print('Sales report response data: ${response.data}');

      return response.data;
    } on DioException catch (e) {
      print('error fetching sales report: ${e.response?.data}');
      throw Exception('Failed to fetch sales report');
    }
  }
}
