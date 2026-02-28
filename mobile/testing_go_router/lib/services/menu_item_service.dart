import 'package:kasirbaraja/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';

class MenuItemService {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConfig.baseUrl));

  Future<Map<String, dynamic>> fetchMenuItems() async {
    try {
      final response = await _dio.get(
        '/api/menu/all-menu-items',
        options: Options(headers: {'ngrok-skip-browser-warning': true}),
        queryParameters: {'limit': '500'},
      );

      return response.data;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }

  //get menu item stock
  Future<Map<String, dynamic>> fetchMenuItemStock() async {
    try {
      final response = await _dio.get(
        '/api/product/menu-stock',
        options: Options(headers: {'ngrok-skip-browser-warning': true}),
        // queryParameters: {'limit': '500'},
      );

      return response.data;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }
}
