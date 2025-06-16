import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketListener {
  static final SocketListener _instance = SocketListener._internal();
  late io.Socket socket;

  factory SocketListener() => _instance;

  SocketListener._internal() {
    // Setup koneksi
    socket = io.io('http://localhost:3000', {
      'transports': ['websocket'],
      'autoConnect': true,
    });

    // Listen event order baru
    socket.on('order_created', (data) {
      print('🛎️ Order Baru: ${data['id']}');
      // Tambahkan logic untuk update UI di sini
      // muncul snack bar
      ScaffoldMessenger.of(data).showSnackBar(
        SnackBar(
          content: Text('Order Baru: ${data['id']}'),
          duration: Duration(seconds: 2),
        ),
      );
    });

    socket.onConnect((_) => print('Terhubung ke server'));
    socket.onDisconnect((_) => print('Terputus dari server'));
  }
}
