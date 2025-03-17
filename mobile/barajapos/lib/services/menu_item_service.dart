import 'package:dio/dio.dart';
import 'package:barajapos/configs/app_config.dart';

class MenuItemService {
  final Dio _dio = Dio(
    BaseOptions(baseUrl: AppConfig.baseUrl),
  );

  Future<Map<String, dynamic>> menuItem() async {
    try {
      print("sedang mengambil data menu"); // berhasil
      Response response = await _dio.get('/api/menu/menu-items');

      if (response.statusCode == 200) {
        print("Ambil data menu ini loh: ${response.data.toString()}"); //check
        return response.data;
      } else {
        throw Exception("Gagal mengambil data menu ini loh:");
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }
}
