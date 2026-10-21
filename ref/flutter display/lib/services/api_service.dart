import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/display_state.dart';

class ApiService {
  String baseUrl;

  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? AppConfig.defaultApiUrl;

  String get streamUrl {
    if (baseUrl.contains('api.php')) {
      return baseUrl.replaceAll('api.php', 'stream.php');
    }
    return '$baseUrl/stream.php';
  }

  Future<DisplayState?> fetchState(String deviceId) async {
    try {
      final uri = Uri.parse('$baseUrl?device=${Uri.encodeComponent(deviceId)}&_t=${DateTime.now().millisecondsSinceEpoch}');
      final response = await http.get(uri).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final Map<String, dynamic> json = jsonDecode(response.body);
        return DisplayState.fromJson(json, deviceId: deviceId);
      }
    } catch (e) {
      // Network or parse error
    }
    return null;
  }

  /// Subscribe to Real-Time SSE Stream (Server-Sent Events) from stream.php
  Stream<DisplayState> subscribeToState(String deviceId) async* {
    final client = http.Client();
    try {
      final uri = Uri.parse('$streamUrl?device=${Uri.encodeComponent(deviceId)}&_t=${DateTime.now().millisecondsSinceEpoch}');
      final request = http.Request('GET', uri);
      request.headers['Accept'] = 'text/event-stream';
      request.headers['Cache-Control'] = 'no-cache';

      final response = await client.send(request);
      if (response.statusCode == 200) {
        String buffer = '';
        await for (final chunk in response.stream.transform(utf8.decoder)) {
          buffer += chunk;
          while (buffer.contains('\n\n')) {
            final index = buffer.indexOf('\n\n');
            final message = buffer.substring(0, index);
            buffer = buffer.substring(index + 2);

            for (final line in message.split('\n')) {
              if (line.startsWith('data:')) {
                final jsonString = line.substring(5).trim();
                if (jsonString.isNotEmpty) {
                  try {
                    final Map<String, dynamic> json = jsonDecode(jsonString);
                    yield DisplayState.fromJson(json, deviceId: deviceId);
                  } catch (_) {}
                }
              }
            }
          }
        }
      }
    } catch (_) {
      // Stream error/disconnect
    } finally {
      client.close();
    }
  }

  Future<List<Map<String, dynamic>>> fetchPromos() async {
    try {
      final uri = Uri.parse('$baseUrl?action=get_promos&_t=${DateTime.now().millisecondsSinceEpoch}');
      final response = await http.get(uri).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final Map<String, dynamic> json = jsonDecode(response.body);
        if (json['status'] == 'success' && json['promos'] is List) {
          return (json['promos'] as List).cast<Map<String, dynamic>>();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<List<Map<String, dynamic>>> fetchTickers() async {
    try {
      final uri = Uri.parse('$baseUrl?action=get_tickers&_t=${DateTime.now().millisecondsSinceEpoch}');
      final response = await http.get(uri).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final Map<String, dynamic> json = jsonDecode(response.body);
        if (json['status'] == 'success' && json['tickers'] is List) {
          return (json['tickers'] as List).cast<Map<String, dynamic>>();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<List<String>> fetchDevices() async {
    try {
      final uri = Uri.parse('$baseUrl?action=list_devices');
      final response = await http.get(uri).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final Map<String, dynamic> json = jsonDecode(response.body);
        if (json['status'] == 'success' && json['devices'] is List) {
          return (json['devices'] as List).map((e) => e.toString()).toList();
        }
      }
    } catch (e) {
      // Failed to fetch devices list
    }
    return [];
  }

  Future<bool> sendState(String deviceId, Map<String, dynamic> payload) async {
    try {
      final uri = Uri.parse('$baseUrl?device=${Uri.encodeComponent(deviceId)}');
      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': AppConfig.apiKey,
        },
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 4));

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> sendReceiptEmail({
    required String deviceId,
    required String email,
    required DisplayState state,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl?action=send_receipt');
      final payload = {
        'device_id': deviceId,
        'email': email,
        'order_number': state.orderNumber,
        'customer_name': state.customerName,
        'table_name': state.tableName,
        'items': state.items.map((i) => i.toJson()).toList(),
        'subtotal': state.subtotal,
        'discount_amount': state.discountAmount,
        'grand_total': state.grandTotal,
        'payment_method': state.paymentMethod,
        'payment_amount': state.paymentAmount,
        'change_amount': state.changeAmount,
        'timestamp': state.timestamp,
      };
      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': AppConfig.apiKey,
        },
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final Map<String, dynamic> json = jsonDecode(response.body);
        return json['status'] == 'success';
      }
    } catch (_) {}
    return false;
  }
}

