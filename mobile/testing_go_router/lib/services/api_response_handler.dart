import 'package:dio/dio.dart';

class ApiResponseHandler {
  static dynamic handleResponse(Response response) {
    if (response.statusCode == 200 || response.statusCode == 201) {
      return response.data;
    } else {
      throw Exception("Terjadi kesalahan: ${response.statusMessage}");
    }
  }

  static Exception handleError(DioException error) {
    if (error.response != null) {
      switch (error.response?.statusCode) {
        case 400:
          return Exception("Bad request: ${error.response?.data['message']}");
        case 401:
          return Exception("Password yang Anda masukkan salah");
        case 403:
          return Exception("Pengguna tidak ditemukan");
        case 404:
          return Exception("Not found: ${error.response?.data['message']}");
        case 500:
          return Exception("Server error: Coba lagi nanti.");
        default:
          return Exception(
              "Error ${error.response?.statusCode}: ${error.response?.data['message']}");
      }
    } else {
      // 🔹 Error jaringan atau server tidak merespons
      return Exception("Gagal terhubung ke server. Periksa koneksi internet.");
    }
  }
}
