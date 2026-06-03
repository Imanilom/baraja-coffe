import 'package:hive_ce/hive.dart';

class OfflineOrderIdGenerator {
  static const String _seqBoxName = 'offlineOrderSeqBox';

  /// Generate offline order_id dengan format:
  /// ORD-{DD}{TT}-{SEQ3}-OFF-{DEVICE}
  ///
  /// - [tableNumber] : nomor meja yang diinput kasir (wajib)
  /// - [deviceName]  : nama device (wajib), misal "Kasir Depan"
  /// - [existingOrderIds] : optional, list order_id yang sudah ada di lokal,
  ///   untuk jaga-jaga kalau ada duplikasi.
  static Future<String> generate({
    required int tableNumber,
    required String deviceName,
    List<String> existingOrderIds = const [],
  }) async {
    // tanggal sekarang
    final now = DateTime.now();
    final dayStr = now.day.toString().padLeft(2, '0');

    // meja 2 digit
    final tableStr = tableNumber.toString().padLeft(2, '0');

    // normalisasi device
    final normalizedDevice =
        deviceName.trim().replaceAll(' ', '').toUpperCase();

    // kita tetap pakai full date buat key sequence supaya reset per hari
    final dateKey =
        '${now.year.toString().padLeft(4, '0')}'
        '${now.month.toString().padLeft(2, '0')}'
        '${now.day.toString().padLeft(2, '0')}';

    // key untuk Hive
    final seqKey = 'offline_seq_${dateKey}_${normalizedDevice}_$tableStr';

    // buka box sequence
    final box = await _openSeqBox();

    int lastSeq = box.get(seqKey, defaultValue: 0) ?? 0;

    String candidate;
    int seq = lastSeq;

    // simple loop: naikin increment sampai ketemu ID yang belum dipakai
    do {
      seq += 1;
      final seqStr = seq.toString().padLeft(3, '0');
      candidate = 'ORD-$dayStr$tableStr-$seqStr-OFF-$normalizedDevice';
    } while (existingOrderIds.contains(candidate));

    // simpan last seq baru
    await box.put(seqKey, seq);

    return candidate;
  }

  static Future<Box<int>> _openSeqBox() async {
    if (Hive.isBoxOpen(_seqBoxName)) {
      return Hive.box<int>(_seqBoxName);
    }
    return await Hive.openBox<int>(_seqBoxName);
  }
}
