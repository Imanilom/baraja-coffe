import 'dart:io';
import 'dart:typed_data';
import 'package:image/image.dart' as img;

Future<Uint8List> convertImageToBytes(int width) async {
  // Load gambar
  final imageFile = File('assets/logo/logo_baraja.png');
  final imageBytes = await imageFile.readAsBytes();
  final originalImage = img.decodeImage(imageBytes)!;

  // Konversi ke grayscale dan resize
  final resizedImage = img.copyResize(originalImage, width: width);
  final grayscaleImage = img.grayscale(resizedImage);

  // Konversi ke bitmap 1-bit
  final bitmap = Uint8List(
    grayscaleImage.height * (grayscaleImage.width / 8).ceil(),
  );

  for (int y = 0; y < grayscaleImage.height; y++) {
    for (int x = 0; x < grayscaleImage.width; x++) {
      final pixel = grayscaleImage.getPixel(x, y);
      final luminance = img.getLuminance(pixel);
      if (luminance < 128) {
        // Threshold 128 untuk binerisasi
        final index = y * (grayscaleImage.width ~/ 8) + (x ~/ 8);
        bitmap[index] |= (1 << (7 - (x % 8)));
      }
    }
  }

  return bitmap;
}
