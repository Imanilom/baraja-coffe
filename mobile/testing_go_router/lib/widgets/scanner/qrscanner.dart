import 'package:flutter/material.dart';
import 'package:qr_code_scanner_plus/qr_code_scanner_plus.dart';

class QRScannerOverlay extends StatefulWidget {
  final Function(String) onScanned;
  final VoidCallback onClose;

  const QRScannerOverlay({
    super.key,
    required this.onScanned,
    required this.onClose,
  });

  @override
  State<QRScannerOverlay> createState() => _QRScannerOverlayState();
}

class _QRScannerOverlayState extends State<QRScannerOverlay> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool isScanning = true;
  bool isFlashOn = false;
  bool isFrontCamera = false;

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
            cameraFacing: isFrontCamera ? CameraFacing.front : CameraFacing.back,
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
                    onPressed: widget.onClose,
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

          // Bottom instruction text
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
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tekan ikon kamera untuk beralih antara kamera depan dan belakang',
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 12,
                    ),
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
      if (scanData.code != null && isScanning) {
        setState(() {
          isScanning = false;
        });

        // Pause scanning to prevent multiple scans
        controller.pauseCamera();

        // Show result dialog
        _showScanResult(scanData.code!);
      }
    });
  }

  void _showScanResult(String scannedData) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('QR Code Berhasil Dipindai'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Data yang dipindai:'),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  scannedData,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 14,
                  ),
                ),
              ),
            ],
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
                widget.onScanned(scannedData);
                widget.onClose(); // Close scanner overlay
              },
              child: const Text('Gunakan'),
            ),
          ],
        );
      },
    );
  }

  void _resumeScanning() {
    setState(() {
      isScanning = true;
    });
    controller?.resumeCamera();
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }
}