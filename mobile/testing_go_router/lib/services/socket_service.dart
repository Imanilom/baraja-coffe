import 'dart:async';
import 'package:kasirbaraja/utils/app_logger.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/repositories/menu_item_repository.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/notification_service.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
// import 'package:dio/dio.dart';
import 'package:kasirbaraja/configs/app_config.dart';

class SocketService {
  late IO.Socket socket;
  final String _serverUrl = AppConfig.baseUrl;
  final Ref ref;
  Timer? _debounce;

  SocketService(this.ref);

  void connect(String cashierId) {
    socket = IO.io(_serverUrl, {
      'transports': ['websocket'],
      'autoConnect': false,
      'reconnection': true,
      'reconnectionAttempts': 10,
      'extraHeaders': {'ngrok-skip-browser-warning': 'true'},
    });

    socket.onConnect((_) async {
      AppLogger.info('CONNECTED: ${socket.id}');
      socket.emit('join_cashier_room', {'id': cashierId});
      final device = await HiveService.getDevice();
      AppLogger.debug('bersiap join area');
      if (device != null && device.assignedAreas.isNotEmpty) {
        AppLogger.debug('mencoba join area');
        joinArea(device.assignedAreas[0]);
      }
    });
    socket.onDisconnect((_) => AppLogger.warning('DISCONNECTED'));
    socket.onError((err) => AppLogger.error('ERROR', error: err));

    socket.on('order_created', (data) {
      AppLogger.info('order_created: $data');
      NotificationService.showSystemNotification(
        'Pesanan Baru',
        'Hello World!',
      );
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 500), () {
        ref.invalidate(onlineOrderProvider);
      });
    });

    socket.on('new_order', (data) {
      AppLogger.info('new_order at my device: $data');
      NotificationService.showSystemNotification(
        'Pesanan Baru',
        'Hello World! new_order',
      );
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 500), () {
        ref.invalidate(onlineOrderProvider);
      });
    });

    socket.on('new_order_created', (data) {
      AppLogger.info('new_order_created at my device: $data');
      NotificationService.showSystemNotification(
        'Pesanan Baru dari area device anda,',
        "cek detail di menu 'pesanan online'",
      );
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 500), () {
        ref.invalidate(onlineOrderProvider);
      });
    });

    socket.on('update_stock', (data) {
      AppLogger.info('update_stock: $data');
      NotificationService.showSystemNotification(
        'Stok Menu Diperbarui',
        "Stok menu telah diperbarui.",
      );
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 500), () async {
        await MenuItemRepository().getMenuItem();
      });
    });

    socket.connect();
  }

  void joinArea(String tableCode) {
    socket.emit('join_area', tableCode);
    AppLogger.info('join_area_group: $tableCode');
  }

  // Tambahkan method untuk meninggalkan area
  void leaveArea(String tableCode) {
    socket.emit('leave_area', tableCode);
    AppLogger.info('leave_area: $tableCode');
  }

  // Tambahkan method untuk meninggalkan cashier room
  void leaveCashierRoom(String cashierId) {
    socket.emit('leave_cashier_room', {'id': cashierId});
    AppLogger.info('leave_cashier_room: $cashierId');
  }

  void disconnect() {
    _debounce?.cancel();
    socket.disconnect();
  }

  void dispose() {
    socket.off('order_created');
    socket.off('new_order');
    socket.offAny();
    socket.dispose();
  }

  Future<void> logout() async {
    final device = await HiveService.getDevice();
    final cashier = await HiveService.getCashier();

    // 1) Minta server lepas semua room (lebih aman & ringkas)
    try {
      // Ack pattern (kalau versi lib mendukung Future)
      // ignore: deprecated_member_use
      socket.emitWithAck(
        'device:leaveAll',
        null,
        ack: (res) {
          AppLogger.debug('leaveAll ack: $res');
        },
      );
      // Kalau versi package kamu belum ada Future-nya, cara di atas sudah cukup.
    } catch (_) {}

    // 2) (Opsional) fallback granular kalau kamu masih butuh
    // if (device != null) {
    //   for (final area in device.assignedAreas) {
    //     leaveAreaByLetter(area);
    //   }
    // }
    // if (cashier?.id != null) {
    //   leaveCashierRoom(cashier!.id!);
    // }

    // 3) Lepas listeners supaya tidak double saat login berikutnya
    socket.off('order_created');
    socket.off('new_order');
    socket.offAny();

    // 4) Putus koneksi
    _debounce?.cancel();
    if (socket.connected) {
      // beri sedikit jeda biar ack sempat terkirim
      await Future.delayed(const Duration(milliseconds: 200));
      socket.disconnect();
    }

    AppLogger.info('Left all rooms & disconnected');
  }

  IO.Socket get instance => socket;
}
