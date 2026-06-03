# Kasir Baraja POS

Aplikasi Point of Sale (POS) untuk Baraja Coffee yang dibangun dengan Flutter.

## Deskripsi

Kasir Baraja adalah aplikasi kasir modern yang dirancang khusus untuk bisnis kafe dan restoran. Aplikasi ini mendukung berbagai fitur seperti manajemen pesanan, pembayaran, pencetakan struk, reservasi, dan pelaporan penjualan.

## Fitur Utama

- 🛒 **Manajemen Pesanan**: Buat dan kelola pesanan dengan mudah (Dine-in, Takeaway, Delivery)
- 💳 **Pembayaran Multi-metode**: Mendukung Cash, QRIS, Transfer, dan metode pembayaran lainnya
- 🖨️ **Printer Integration**: Cetak struk via Bluetooth dan Network Printer
- 📊 **Laporan Penjualan**: Dashboard dan laporan penjualan lengkap dengan grafik
- 🔐 **Autentikasi**: Login aman dengan JWT token
- 📱 **QR Code Scanner**: Scan QR code untuk mengambil data pesanan
- 📅 **Reservasi**: Manajemen reservasi meja
- 🔄 **Sinkronisasi Data**: Sync data dengan server backend
- 🌐 **Offline Support**: Penyimpanan lokal dengan Hive untuk mode offline
- 🔔 **Notifikasi Real-time**: Socket.IO untuk update pesanan real-time

## Teknologi

- **Framework**: Flutter 3.7.2+
- **State Management**: Riverpod
- **Routing**: go_router
- **Local Database**: Hive
- **HTTP Client**: Dio
- **Code Generation**: Freezed, JSON Serializable
- **Real-time**: Socket.IO Client

## Prasyarat

- Flutter SDK 3.7.2 atau lebih tinggi
- Dart SDK 3.7.2 atau lebih tinggi
- Android Studio / VS Code dengan Flutter plugin
- Perangkat Android atau Emulator

## Instalasi

1. Clone repository:
```bash
git clone <repository-url>
cd testing_go_router
```

2. Install dependencies:
```bash
flutter pub get
```

3. Buat file `.env` di root project dengan konfigurasi berikut:
```env
BASE_URL=https://your-api-url.com
API_KEY=your_api_key
# Tambahkan konfigurasi lainnya sesuai kebutuhan
```

4. Generate code (untuk Freezed dan JSON Serializable):
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

## Menjalankan Aplikasi

### Development Mode
```bash
flutter run
```

### Build APK
```bash
flutter build apk --release
```

### Build untuk profiling
```bash
flutter build apk --profile
```

## Struktur Proyek

```
lib/
├── configs/          # Konfigurasi aplikasi
├── enums/            # Enumerasi (OrderType, PaymentMethod, dll)
├── extensions/       # Dart extensions
├── features/         # Fitur modular
├── helper/           # Helper utilities
├── models/           # Data models (Freezed)
├── providers/        # Riverpod providers (State management)
├── repositories/     # Data layer
├── screens/          # UI screens
│   ├── auth/         # Login & authentication
│   ├── orders/       # Order management
│   ├── payments/     # Payment processing
│   ├── reports/      # Sales reports
│   ├── reservation/  # Table reservation
│   └── settings/     # App settings
├── services/         # Business logic services
├── utils/            # Utility functions
└── widgets/          # Reusable UI components
```

## Arsitektur

Aplikasi ini menggunakan **Clean Architecture** dengan pemisahan layer:

1. **Presentation Layer** (Screens & Widgets)
   - UI components
   - User interactions

2. **State Management** (Providers)
   - Riverpod providers
   - State management logic

3. **Business Logic** (Services)
   - Core business rules
   - API integration
   - Data processing

4. **Data Layer** (Repositories & Models)
   - Data models
   - Local & remote data sources
   - Hive database

## Konfigurasi Printer

### Bluetooth Printer
1. Buka Settings → Printer
2. Scan Bluetooth Printer
3. Pilih printer dan konfigurasi jenis cetakan (Customer, Kitchen, Bar, Waiter)

### Network Printer
1. Buka Settings → Printer
2. Scan Network Printer
3. Masukkan IP address dan port
4. Konfigurasi jenis cetakan

## Testing

Jalankan unit tests:
```bash
flutter test
```

Jalankan analyzer:
```bash
flutter analyze
```

## Troubleshooting

### Build Error
Jika terjadi error saat build, coba:
```bash
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Printer Tidak Terdeteksi
- Pastikan Bluetooth/WiFi aktif
- Pastikan printer dalam mode pairing
- Restart aplikasi dan coba scan ulang

## Kontribusi

Untuk berkontribusi pada project ini:
1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## Lisensi

Proprietary - Baraja Coffee

## Kontak

Untuk pertanyaan atau dukungan, hubungi tim development Baraja Coffee.

