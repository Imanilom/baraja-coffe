import 'package:hive_ce/hive.dart';

/// Gunakan WIB agar konsisten dengan backend Anda
DateTime _wibNow() {
  // Ambil waktu UTC lalu geser ke GMT+7
  return DateTime.now().toUtc().add(const Duration(hours: 7));
}

/// Mapping kode hari:
/// 1=Mon..7=Sun -> ['MD','TU','WD','TH','FR','ST','SN']
/// (Perbaikan dari versi JS Anda: di JS, getDay() 0=Sun—array sebelumnya
/// akan salah mengembalikan 'MD' untuk Sunday. Di Dart ini kita map dengan benar.)
String _dayCode(int weekday) {
  const map = {
    DateTime.monday: 'MD',
    DateTime.tuesday: 'TU',
    DateTime.wednesday: 'WD',
    DateTime.thursday: 'TH',
    DateTime.friday: 'FR',
    DateTime.saturday: 'ST',
    DateTime.sunday: 'SN',
  };
  return map[weekday]!;
}

/// Membuat Order ID seperti: ORD-<DD><TABLE_OR_DAY>-<SEQ>
/// Contoh: ORD-05MD05-001  (hari ke-05, Senin "MD05", seq 001)
Future<String> generateOrderId({String? tableNumber}) async {
  final now = _wibNow();

  final year = now.year.toString().padLeft(4, '0');
  final month = now.month.toString().padLeft(2, '0');
  final day = now.day.toString().padLeft(2, '0');
  final dateStr = '$year$month$day'; // mis. "20250605"

  // Jika tidak ada tableNumber, pakai kode hari + tanggal (DD)
  final tableOrDayCode =
      (tableNumber != null && tableNumber.trim().isNotEmpty)
          ? tableNumber.trim()
          : '${_dayCode(now.weekday)}$day';

  // Kunci sequence unik per tableOrDayCode dan tanggal (reset harian implisit)
  final key = 'order_seq_${tableOrDayCode}_$dateStr';

  // Buka box counters (sekali saja di app init juga boleh)
  final box = await Hive.openBox<int>('counters');

  // Ambil dan increment counter lokal
  var seq = box.get(key, defaultValue: 0) ?? 0;
  seq += 1;
  await box.put(key, seq);

  // Format final OrderId
  final seqStr = seq.toString().padLeft(3, '0');
  return 'ORD-$day$tableOrDayCode-$seqStr';
}
