import 'package:barajapos/models/adapter/order_detail.model.dart';
import 'package:barajapos/services/api_response_handler.dart';
import 'package:dio/dio.dart';
import 'package:barajapos/configs/app_config.dart';

class OrderService {
  final Dio _dio = Dio(
    BaseOptions(baseUrl: AppConfig.baseUrl),
  );

  Future<Map<String, dynamic>> createOrder(OrderDetailModel orderDetail) async {
    try {
      print('start create order...'); //
      Response response = await _dio.post(
        '/api/order',
        // data: orderDetail.toJson(),
      );
      return response.data;
    } on DioException catch (e) {
      throw ApiResponseHandler.handleError(e);
    }
  }
}
