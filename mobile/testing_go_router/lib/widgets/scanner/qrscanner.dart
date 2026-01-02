// qrscanner.dart - Fixed version with proper type conversion
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:qr_code_scanner_plus/qr_code_scanner_plus.dart';
import 'dart:convert';
import '../../configs/app_config.dart';
import '../../models/order_detail.model.dart';
import '../../models/order_item.model.dart';
import '../../models/menu_item.model.dart';
import '../../enums/order_type.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class QRScannerOverlay extends ConsumerStatefulWidget {
  final Function(String) onScanned;

  const QRScannerOverlay({super.key, required this.onScanned});

  @override
  ConsumerState<QRScannerOverlay> createState() => _QRScannerOverlayState();
}

class _QRScannerOverlayState extends ConsumerState<QRScannerOverlay> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool isScanning = true;
  bool isFlashOn = false;
  bool isFrontCamera = false;
  bool isProcessing = false; // Add this to prevent multiple scans

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      child: Stack(
        children: [
          // QR Scanner View
          QRView(
            key: qrKey,
            onQRViewCreated: _onQRViewCreated,
            overlay: QrScannerOverlayShape(
              borderColor: Colors.green,
              borderRadius: 10,
              borderLength: 30,
              borderWidth: 10,
              cutOutSize: MediaQuery.of(context).size.width * 0.6,
            ),
            cameraFacing:
                isFrontCamera ? CameraFacing.front : CameraFacing.back,
          ),

          // Top controls
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Close button
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(
                      Icons.close,
                      color: Colors.white,
                      size: 28,
                    ),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.black.withOpacity(0.5),
                      padding: const EdgeInsets.all(8),
                    ),
                  ),

                  // Controls row
                  Row(
                    children: [
                      // Camera switch button
                      IconButton(
                        onPressed: () async {
                          await controller?.flipCamera();
                          setState(() {
                            isFrontCamera = !isFrontCamera;
                          });
                        },
                        icon: const Icon(
                          Icons.flip_camera_ios,
                          color: Colors.white,
                          size: 28,
                        ),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.black.withOpacity(0.5),
                          padding: const EdgeInsets.all(8),
                        ),
                      ),

                      const SizedBox(width: 8),

                      // Flash toggle button (only show for back camera)
                      if (!isFrontCamera)
                        IconButton(
                          onPressed: () async {
                            await controller?.toggleFlash();
                            setState(() {
                              isFlashOn = !isFlashOn;
                            });
                          },
                          icon: Icon(
                            isFlashOn ? Icons.flash_on : Icons.flash_off,
                            color: Colors.white,
                            size: 28,
                          ),
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.black.withOpacity(0.5),
                            padding: const EdgeInsets.all(8),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Processing overlay
          if (isProcessing)
            Container(
              color: Colors.black.withOpacity(0.7),
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text(
                      'Memproses QR Code...',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),

          // Bottom instruction text
          if (!isProcessing)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      isFrontCamera
                          ? 'Arahkan kamera depan ke QR code'
                          : 'Arahkan kamera ke QR code',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Pastikan QR code berada dalam frame',
                      style: TextStyle(color: Colors.grey[400], fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Tekan ikon kamera untuk beralih antara kamera depan dan belakang',
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _onQRViewCreated(QRViewController controller) {
    setState(() {
      this.controller = controller;
    });

    controller.scannedDataStream.listen((scanData) {
      if (scanData.code != null && isScanning && !isProcessing) {
        setState(() {
          isScanning = false;
          isProcessing = true;
        });

        // Pause scanning to prevent multiple scans
        controller.pauseCamera();

        // Process the scanned data
        _processScanResult(scanData.code!);
      }
    });
  }

  void _processScanResult(String scannedData) async {
    print('QR Code scanned: $scannedData');

    try {
      // Parse JSON untuk mendapatkan order_id
      final Map<String, dynamic> jsonData = json.decode(scannedData);
      final String? orderId = jsonData['order_id'];

      if (orderId != null && orderId.isNotEmpty) {
        // Panggil API
        await _callOrderAPI(orderId);
      } else {
        _showErrorDialog('Order ID tidak ditemukan dalam QR code');
      }
    } catch (e) {
      print('Error parsing QR code: $e');
      // Jika bukan JSON yang valid, tampilkan error
      _showErrorDialog('QR code tidak valid atau format tidak sesuai');
    }
  }

  Future<void> _callOrderAPI(String orderId) async {
    final Dio dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
      ),
    );

    try {
      final response = await dio.get(
        '/api/cashier-order/$orderId',
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        // API berhasil dipanggil
        final responseData = response.data;
        print('API Response: $responseData');

        // Convert API response ke OrderDetailModel
        final orderDetailModel = OrderDetailModel.fromJson(
          responseData['order'],
        );
        // _convertToOrderDetailModel(
        // responseData['orderData'],
        // );

        _showOrderDetailDialog(orderDetailModel);
      } else {
        _showErrorDialog(
          'Gagal mengambil data order. Status: ${response.statusCode}',
        );
      }
    } on DioException catch (e) {
      String errorMessage = 'Terjadi kesalahan jaringan';
      if (e.type == DioExceptionType.connectionTimeout) {
        errorMessage = 'Koneksi timeout';
      } else if (e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Timeout menerima data';
      } else if (e.response?.statusCode == 404) {
        errorMessage = 'Order tidak ditemukan';
      } else if (e.response?.statusCode == 500) {
        errorMessage = 'Kesalahan server';
      }
      _showErrorDialog(errorMessage);
    } catch (e) {
      print('Unexpected error: $e');
      _showErrorDialog('Terjadi kesalahan yang tidak terduga');
    } finally {
      setState(() {
        isProcessing = false;
      });
    }
  }

  OrderDetailModel? _convertToOrderDetailModel(Map<String, dynamic> orderData) {
    try {
      // Validate required fields
      if (orderData['orderId'] == null || orderData['items'] == null) {
        print('Missing required fields in order data');
        return null;
      }

      // Convert items dari API response
      List<OrderItemModel> items = [];
      if (orderData['items'] != null && orderData['items'] is List) {
        for (var item in orderData['items']) {
          try {
            // Validate item data
            if (item['menuItemId'] == null ||
                item['name'] == null ||
                item['price'] == null ||
                item['quantity'] == null) {
              print('Missing required fields in item data');
              continue;
            }

            // Create MenuItemModel with proper type conversion
            final menuItem = MenuItemModel(
              id: item['menuItemId'],
              name: item['name'],
              discountedPrice: (item['price'] as num).toInt(), // Convert to int
              mainCategory:
                  item['mainCategory'] ?? '', // Default empty if not provided
              workstation:
                  item['workstation'] ?? '', // Default empty if not provided
              // Add other required fields with defaults
            );

            // Create OrderItemModel
            final orderItem = OrderItemModel(
              menuItem: menuItem,
              quantity: item['quantity'] as int,
              subtotal:
                  ((item['price'] as num) * (item['quantity'] as int)).toInt(),
              selectedAddons: [], // Handle addons if available
              selectedToppings: [], // Handle toppings if available
              notes: item['notes']?.toString() ?? '',
            );

            items.add(orderItem);
          } catch (e) {
            print('Error processing item: $e');
            continue;
          }
        }
      }

      if (items.isEmpty) {
        print('No valid items found in order data');
        return null;
      }

      // Determine order type berdasarkan data
      OrderType orderType = OrderType.dineIn; // Default
      if (orderData['orderType'] != null) {
        String orderTypeStr = orderData['orderType'].toString().toLowerCase();
        switch (orderTypeStr) {
          case 'delivery':
            orderType = OrderType.delivery;
            break;
          case 'takeaway':
          case 'pickup':
            orderType = OrderType.takeAway;
            break;
          case 'dinein':
          default:
            orderType = OrderType.dineIn;
            break;
        }
      }

      // Calculate totals
      double totalPrice = (orderData['total'] as num?)?.toDouble() ?? 0.0;
      double taxRate = 0.1; // 10% tax
      double totalTax = totalPrice * taxRate;
      double grandTotal = totalPrice + totalTax;

      // Create OrderDetailModel
      final orderDetailModel = OrderDetailModel(
        orderId: orderData['orderId'].toString(),
        items: items,
        user: orderData['customerName']?.toString() ?? 'Customer',
        tableNumber: orderData['tableNumber']?.toString() ?? '',
        orderType: orderType,
        totalAfterDiscount: totalPrice.toInt(),
        totalTax: totalTax.toInt(),
        grandTotal: grandTotal.toInt(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      return orderDetailModel;
    } catch (e) {
      print('Error converting to OrderDetailModel: $e');
      return null;
    }
  }

  void _showOrderDetailDialog(OrderDetailModel orderDetail) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Order Berhasil Ditemukan'),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Order ID: ${orderDetail.orderId}'),
                  if (orderDetail.user != null)
                    Text('Customer: ${orderDetail.user}'),
                  if (orderDetail.tableNumber!.isNotEmpty)
                    Text('Table: ${orderDetail.tableNumber}'),
                  Text('Order Type: ${orderDetail.orderType.name}'),
                  Text('Payment Status: ${orderDetail.paymentStatus}'),
                  const SizedBox(height: 12),
                  const Text(
                    'Items:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  ...orderDetail.items.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              '${item.quantity}x ${item.menuItem.name} - workstation: ${item.menuItem.workstation}',
                            ),
                          ),
                          Text(
                            'Rp ${item.subtotal.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Subtotal:'),
                      Text(
                        'Rp ${orderDetail.totalAfterDiscount.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                      ),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Tax:'),
                      Text(
                        'Rp ${orderDetail.totalTax.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                      ),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total:',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'Rp ${orderDetail.grandTotal.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _resumeScanning();
              },
              child: const Text('Scan Lagi'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop();
                print(
                  'Navigating to Order Detail with orderDetail: $orderDetail',
                );
                widget.onScanned(orderDetail.orderId ?? '');
                // widget.onClose();
              },
              child: const Text('Tampilkan di Order Detail'),
            ),
          ],
        );
      },
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Error'),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _resumeScanning();
              },
              child: const Text('Scan Lagi'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop();
                // widget.onClose();
              },
              child: const Text('Tutup'),
            ),
          ],
        );
      },
    );
  }

  void _resumeScanning() {
    setState(() {
      isScanning = true;
      isProcessing = false;
    });
    controller?.resumeCamera();
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }
}
