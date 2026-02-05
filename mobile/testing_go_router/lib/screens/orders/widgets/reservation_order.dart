// screens/reservation_screen.dart - Updated with ConsumerWidget and Riverpod
import 'package:flutter/material.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../models/table.dart';
import '../../../models/area.dart';
import '../../../models/reservation_data.dart';
import '../../../services/reservation_service.dart';
import '../../../widgets/reservation/date_selector.dart';
import '../../../widgets/reservation/person_counter.dart';
import '../../../widgets/reservation/area_selector.dart';
import '../../../widgets/reservation/time_selector.dart';

// Providers untuk state management
final selectedDateProvider = StateProvider<DateTime>((ref) => DateTime.now());
final selectedTimeProvider = StateProvider<TimeOfDay>(
  (ref) => const TimeOfDay(hour: 19, minute: 0),
);
final selectedAreaProvider = StateProvider<Area?>((ref) => null);
final personCountProvider = StateProvider<int>((ref) => 1);
final selectedTableIdsProvider = StateProvider<List<String>>((ref) => []);
final isLoadingTablesProvider = StateProvider<bool>((ref) => false);
final isLoadingAreasProvider = StateProvider<bool>((ref) => true);
final isCheckingAvailabilityProvider = StateProvider<bool>((ref) => false);
final availabilityResultProvider = StateProvider<Map<String, dynamic>?>(
  (ref) => null,
);

// Provider untuk areas
final areasProvider = StateNotifierProvider<AreasNotifier, List<Area>>((ref) {
  return AreasNotifier();
});

// Provider untuk tables
final tablesProvider = StateNotifierProvider<TablesNotifier, List<TableModel>>((
  ref,
) {
  return TablesNotifier();
});

// StateNotifier untuk Areas
class AreasNotifier extends StateNotifier<List<Area>> {
  AreasNotifier() : super([]);

  Future<void> loadAreas({required String date, required String time}) async {
    try {
      final loadedAreas = await ReservationService.getAreas(
        date: date,
        time: time,
      );
      state = loadedAreas.where((area) => area.isActive).toList();
    } catch (e) {
      state = [];
      throw Exception('Gagal memuat data area: $e');
    }
  }

  Future<void> refreshAreaAvailability({
    required String date,
    required String time,
  }) async {
    try {
      final refreshedAreas = await ReservationService.refreshAreaAvailability(
        date: date,
        time: time,
      );
      state = refreshedAreas.where((area) => area.isActive).toList();
    } catch (e) {
      AppLogger.error('Error refreshing areas availability', error: e);
    }
  }
}

// StateNotifier untuk Tables
class TablesNotifier extends StateNotifier<List<TableModel>> {
  TablesNotifier() : super([]);

  Future<void> loadTablesForArea(
    String areaId, {
    required String date,
    required String time,
  }) async {
    try {
      final result = await ReservationService.getAreaTables(
        areaId,
        date: date,
        time: time,
      );
      state = result['tables'];
    } catch (e) {
      state = [];
      throw Exception('Gagal memuat meja untuk area: $e');
    }
  }

  Future<void> refreshTableAvailability({
    required String areaId,
    required String date,
    required String time,
  }) async {
    try {
      final result = await ReservationService.refreshTableAvailability(
        areaId: areaId,
        date: date,
        time: time,
      );
      state = result['tables'];
    } catch (e) {
      AppLogger.error('Error refreshing tables availability', error: e);
    }
  }

  void clearTables() {
    state = [];
  }
}

class ReservationOrder extends ConsumerStatefulWidget {
  const ReservationOrder({super.key});

  @override
  ConsumerState<ReservationOrder> createState() => _ReservationOrderState();
}

class _ReservationOrderState extends ConsumerState<ReservationOrder> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _validateInitialDateTime();
      _loadAreas();
    });
  }

  void _validateInitialDateTime() {
    final DateTime now = DateTime.now();
    final DateTime today = DateTime(now.year, now.month, now.day);
    final selectedDate = ref.read(selectedDateProvider);
    final selectedTime = ref.read(selectedTimeProvider);

    final DateTime currentSelectedDate = DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
    );

    if (currentSelectedDate.isBefore(today)) {
      ref.read(selectedDateProvider.notifier).state = now;
    }

    if (currentSelectedDate.isAtSameMomentAs(today) &&
        !_isValidTime(selectedTime, selectedDate)) {
      final DateTime minimumTime = now.add(const Duration(minutes: 5));
      ref.read(selectedTimeProvider.notifier).state = TimeOfDay(
        hour: minimumTime.hour,
        minute: minimumTime.minute,
      );
    }
  }

  Future<void> _loadAreas() async {
    try {
      ref.read(isLoadingAreasProvider.notifier).state = true;

      final selectedDate = ref.read(selectedDateProvider);
      final selectedTime = ref.read(selectedTimeProvider);

      final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
      final timeStr =
          '${selectedTime.hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')}';

      await ref
          .read(areasProvider.notifier)
          .loadAreas(date: dateStr, time: timeStr);

      ref.read(isLoadingAreasProvider.notifier).state = false;
    } catch (e) {
      ref.read(isLoadingAreasProvider.notifier).state = false;
      _showErrorDialog('Gagal memuat data area: $e');
    }
  }

  Future<void> _refreshAreasAvailability() async {
    final selectedDate = ref.read(selectedDateProvider);
    final selectedTime = ref.read(selectedTimeProvider);

    if (!_isValidReservationDate() ||
        !_isValidTime(selectedTime, selectedDate)) {
      return;
    }

    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
      final timeStr =
          '${selectedTime.hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')}';

      await ref
          .read(areasProvider.notifier)
          .refreshAreaAvailability(date: dateStr, time: timeStr);

      // Update selected area if it still exists
      final selectedArea = ref.read(selectedAreaProvider);
      if (selectedArea != null) {
        final areas = ref.read(areasProvider);
        final updatedSelectedArea = areas.firstWhere(
          (area) => area.id == selectedArea.id,
          orElse: () => selectedArea,
        );
        ref.read(selectedAreaProvider.notifier).state = updatedSelectedArea;
      }
    } catch (e) {
      AppLogger.error('Error refreshing areas availability', error: e);
    }
  }

  Future<void> _loadTablesForArea(String areaId) async {
    ref.read(isLoadingTablesProvider.notifier).state = true;
    ref.read(tablesProvider.notifier).clearTables();
    ref.read(selectedTableIdsProvider.notifier).state = [];

    try {
      final selectedDate = ref.read(selectedDateProvider);
      final selectedTime = ref.read(selectedTimeProvider);

      final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
      final timeStr =
          '${selectedTime.hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')}';

      await ref
          .read(tablesProvider.notifier)
          .loadTablesForArea(areaId, date: dateStr, time: timeStr);

      ref.read(isLoadingTablesProvider.notifier).state = false;
    } catch (e) {
      ref.read(isLoadingTablesProvider.notifier).state = false;
      _showErrorDialog('Gagal memuat meja untuk area: $e');
    }
  }

  Future<void> _refreshTablesAvailability() async {
    final selectedArea = ref.read(selectedAreaProvider);
    final selectedDate = ref.read(selectedDateProvider);
    final selectedTime = ref.read(selectedTimeProvider);

    if (selectedArea == null ||
        !_isValidReservationDate() ||
        !_isValidTime(selectedTime, selectedDate)) {
      return;
    }

    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
      final timeStr =
          '${selectedTime.hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')}';

      await ref
          .read(tablesProvider.notifier)
          .refreshTableAvailability(
            areaId: selectedArea.id,
            date: dateStr,
            time: timeStr,
          );

      // Remove selected tables that are no longer available
      final tables = ref.read(tablesProvider);
      final selectedTableIds = ref.read(selectedTableIdsProvider);

      final validTableIds =
          selectedTableIds.where((tableId) {
            final table = tables.firstWhere(
              (t) => t.id == tableId,
              orElse:
                  () =>
                      TableModel(id: '', tableNumber: '', areaId: '', seats: 0),
            );
            return table.id.isNotEmpty && table.canBeSelected;
          }).toList();

      ref.read(selectedTableIdsProvider.notifier).state = validTableIds;
    } catch (e) {
      AppLogger.error('Error refreshing tables availability', error: e);
    }
  }

  void _onDateChanged(DateTime newDate) {
    ref.read(selectedDateProvider.notifier).state = newDate;
    ref.read(selectedTableIdsProvider.notifier).state =
        []; // Clear selections when date changes

    // Refresh availability for new date
    _refreshAreasAvailability();
    final selectedArea = ref.read(selectedAreaProvider);
    if (selectedArea != null) {
      _refreshTablesAvailability();
    }
  }

  Future<void> _onTimeChanged(TimeOfDay newTime) async {
    final selectedDate = ref.read(selectedDateProvider);

    if (_isValidTime(newTime, selectedDate)) {
      ref.read(selectedTimeProvider.notifier).state = newTime;
      ref.read(selectedTableIdsProvider.notifier).state =
          []; // Clear selections when time changes

      // Refresh availability for new time
      _refreshAreasAvailability();
      final selectedArea = ref.read(selectedAreaProvider);
      if (selectedArea != null) {
        _refreshTablesAvailability();
      }
    }
  }

  void _onAreaChanged(Area area) {
    ref.read(selectedAreaProvider.notifier).state = area;

    final personCount = ref.read(personCountProvider);
    if (personCount > area.capacity) {
      ref.read(personCountProvider.notifier).state = area.capacity;
    }

    ref.read(selectedTableIdsProvider.notifier).state =
        []; // Clear table selections when area changes
    _loadTablesForArea(area.id);
  }

  bool _isValidReservationDate() {
    final selectedDate = ref.read(selectedDateProvider);
    final DateTime now = DateTime.now();
    final DateTime today = DateTime(now.year, now.month, now.day);
    final DateTime selectedDateOnly = DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
    );
    return selectedDateOnly.isAfter(today) ||
        selectedDateOnly.isAtSameMomentAs(today);
  }

  bool _isValidTime(TimeOfDay time, DateTime date) {
    final DateTime now = DateTime.now();
    final DateTime selectedDateTime = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );

    final DateTime today = DateTime(now.year, now.month, now.day);
    final DateTime selectedDateOnly = DateTime(date.year, date.month, date.day);

    if (selectedDateOnly.isAfter(today)) {
      return true;
    }

    if (selectedDateOnly.isAtSameMomentAs(today)) {
      final DateTime minimumTime = now.add(const Duration(minutes: 5));
      return selectedDateTime.isAfter(minimumTime) ||
          selectedDateTime.isAtSameMomentAs(minimumTime);
    }

    return false;
  }

  void _toggleTableSelection(String tableId) {
    final tables = ref.read(tablesProvider);
    final table = tables.firstWhere((t) => t.id == tableId);

    if (!table.canBeSelected) {
      _showTableNotAvailableDialog(table);
      return;
    }

    final selectedTableIds = ref.read(selectedTableIdsProvider);
    if (selectedTableIds.contains(tableId)) {
      ref.read(selectedTableIdsProvider.notifier).state =
          selectedTableIds.where((id) => id != tableId).toList();
    } else {
      ref.read(selectedTableIdsProvider.notifier).state = [
        ...selectedTableIds,
        tableId,
      ];
    }
  }

  void _showTableNotAvailableDialog(TableModel table) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.orange),
              SizedBox(width: 8),
              Text('Meja Tidak Tersedia'),
            ],
          ),
          content: Text(
            'Meja ${table.tableNumber} tidak dapat dipilih.\n\n'
            'Status: ${table.availabilityStatus}',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }

  int _calculateTotalCapacity() {
    final tables = ref.read(tablesProvider);
    final selectedTableIds = ref.read(selectedTableIdsProvider);

    int totalCapacity = 0;
    for (String tableId in selectedTableIds) {
      final table = tables.firstWhere((t) => t.id == tableId);
      totalCapacity += table.seats;
    }
    return totalCapacity;
  }

  String _getSelectedTableNumbers() {
    final tables = ref.read(tablesProvider);
    final selectedTableIds = ref.read(selectedTableIdsProvider);

    List<String> tableNumbers = [];
    for (String tableId in selectedTableIds) {
      final table = tables.firstWhere((t) => t.id == tableId);
      tableNumbers.add(table.tableNumber);
    }
    return tableNumbers.join(', ');
  }

  bool _isTableSelectionValid() {
    final selectedTableIds = ref.read(selectedTableIdsProvider);
    final personCount = ref.read(personCountProvider);

    if (selectedTableIds.isEmpty) return false;
    final totalCapacity = _calculateTotalCapacity();
    return totalCapacity >= personCount;
  }

  bool get _canMakeReservation {
    final selectedArea = ref.read(selectedAreaProvider);
    final selectedTableIds = ref.read(selectedTableIdsProvider);
    final selectedDate = ref.read(selectedDateProvider);
    final selectedTime = ref.read(selectedTimeProvider);
    final isCheckingAvailability = ref.read(isCheckingAvailabilityProvider);

    return selectedArea != null &&
        selectedTableIds.isNotEmpty &&
        _isTableSelectionValid() &&
        _isValidReservationDate() &&
        _isValidTime(selectedTime, selectedDate) &&
        !isCheckingAvailability;
  }

  Future<void> _checkAvailability() async {
    final selectedArea = ref.read(selectedAreaProvider);
    final selectedTableIds = ref.read(selectedTableIdsProvider);
    final selectedDate = ref.read(selectedDateProvider);
    final selectedTime = ref.read(selectedTimeProvider);
    final personCount = ref.read(personCountProvider);

    if (selectedArea == null || selectedTableIds.isEmpty) return;

    ref.read(isCheckingAvailabilityProvider.notifier).state = true;
    ref.read(availabilityResultProvider.notifier).state = null;

    final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
    final timeStr =
        '${selectedTime.hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')}';

    try {
      final result = await ReservationService.checkAvailability(
        date: dateStr,
        time: timeStr,
        areaId: selectedArea.id,
        guestCount: personCount,
        tableIds: selectedTableIds,
      );

      ref.read(isCheckingAvailabilityProvider.notifier).state = false;
      ref.read(availabilityResultProvider.notifier).state = result;

      if (result['available'] == true) {
        _showAvailabilityDialog(result, true);
      } else {
        _showAvailabilityDialog(result, false);
        // Refresh table availability after failed check
        await _refreshTablesAvailability();
      }
    } catch (e) {
      ref.read(isCheckingAvailabilityProvider.notifier).state = false;
      ref.read(availabilityResultProvider.notifier).state = {
        'available': false,
        'message': 'Gagal memeriksa ketersediaan: $e',
        'reason': 'error',
      };
    }
  }

  void _showTimeValidationDialog(TimeOfDay attemptedTime) {
    final DateTime now = DateTime.now();
    final DateTime minimumTime = now.add(const Duration(minutes: 5));
    final String minimumTimeText =
        '${minimumTime.hour.toString().padLeft(2, '0')}:${minimumTime.minute.toString().padLeft(2, '0')}';

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.orange),
              SizedBox(width: 8),
              Text('Waktu Tidak Valid'),
            ],
          ),
          content: Text(
            'Waktu ${attemptedTime.hour.toString().padLeft(2, '0')}:${attemptedTime.minute.toString().padLeft(2, '0')} tidak dapat dipilih.\n\n'
            'Untuk reservasi hari ini, minimal waktu yang dapat dipilih adalah $minimumTimeText (5 menit dari sekarang).',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                ref.read(selectedTimeProvider.notifier).state = TimeOfDay(
                  hour: minimumTime.hour,
                  minute: minimumTime.minute,
                );
                _onTimeChanged(ref.read(selectedTimeProvider));
              },
              child: const Text('Gunakan Waktu Minimum'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _selectTime(BuildContext context) async {
    final selectedTime = ref.read(selectedTimeProvider);
    final selectedDate = ref.read(selectedDateProvider);

    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: selectedTime,
    );

    if (picked != null && picked != selectedTime) {
      if (_isValidTime(picked, selectedDate)) {
        await _onTimeChanged(picked);
      } else {
        _showTimeValidationDialog(picked);
      }
    }
  }

  void _showAvailabilityDialog(Map<String, dynamic> result, bool isAvailable) {
    final selectedArea = ref.read(selectedAreaProvider);
    final personCount = ref.read(personCountProvider);

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              Icon(
                isAvailable ? Icons.check_circle : Icons.error,
                color: isAvailable ? Colors.green : Colors.red,
              ),
              const SizedBox(width: 8),
              Text(
                isAvailable ? 'Meja Tersedia' : 'Meja Tidak Tersedia',
                style: TextStyle(
                  color: isAvailable ? Colors.green : Colors.red,
                  fontSize: 18,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(result['message'] ?? ''),
              if (!isAvailable && result['conflicting_tables'] != null) ...[
                const SizedBox(height: 8),
                Text(
                  'Meja yang bentrok: ${(result['conflicting_tables'] as List).join(', ')}',
                  style: TextStyle(
                    color: Colors.red.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
              if (result['data'] != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Detail Informasi:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.grey.shade700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _buildInfoRow(
                        'Area',
                        result['data']['area_name'] ??
                            selectedArea?.areaName ??
                            '',
                      ),
                      _buildInfoRow(
                        'Jumlah Tamu',
                        '${result['data']['guest_count'] ?? personCount} orang',
                      ),
                      _buildInfoRow('Meja Dipilih', _getSelectedTableNumbers()),
                      _buildInfoRow(
                        'Total Kapasitas',
                        '${_calculateTotalCapacity()} orang',
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                isAvailable ? 'Batal' : 'OK',
                style: const TextStyle(color: Colors.grey),
              ),
            ),
            if (isAvailable)
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  _navigateToMenuWithReservation();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green.shade700,
                ),
                child: const Text(
                  'Lanjut ke Menu',
                  style: TextStyle(color: Colors.white),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12)),
          Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  void _navigateToMenuWithReservation() {
    final selectedArea = ref.read(selectedAreaProvider);
    final selectedDate = ref.read(selectedDateProvider);
    final selectedTime = ref.read(selectedTimeProvider);
    final personCount = ref.read(personCountProvider);
    final selectedTableIds = ref.read(selectedTableIdsProvider);

    if (selectedArea == null) return;

    final String formattedDate = DateFormat(
      'dd MMMM yyyy',
      'id_ID',
    ).format(selectedDate);
    final String formattedTime =
        '${selectedTime.hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')}';

    final reservationData = ReservationData(
      date: selectedDate,
      time: selectedTime,
      areaId: selectedArea.id,
      areaCode: selectedArea.areaCode,
      personCount: personCount,
      formattedDate: formattedDate,
      formattedTime: formattedTime,
      selectedTableIds: selectedTableIds,
    );

    // Navigator.push(
    //   context,
    //   MaterialPageRoute(
    //     builder: (context) => MenuScreen(
    //       isReservation: true,
    //       reservationData: reservationData,
    //     ),
    //   ),
    // );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.error, color: Colors.red),
              SizedBox(width: 8),
              Text('Error'),
            ],
          ),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildReservationButton() {
    final selectedArea = ref.read(selectedAreaProvider);
    final selectedTableIds = ref.read(selectedTableIdsProvider);
    final selectedDate = ref.read(selectedDateProvider);
    final selectedTime = ref.read(selectedTimeProvider);
    final isCheckingAvailability = ref.read(isCheckingAvailabilityProvider);

    String buttonText = 'Cek Ketersediaan & Lanjut';

    if (!_isValidReservationDate()) {
      buttonText =
          'Tanggal Tidak Valid (Pilih Tanggal Hari Ini atau Sesudahnya)';
    } else if (!_isValidTime(selectedTime, selectedDate)) {
      buttonText = 'Waktu Tidak Valid (Minimal 5 Menit dari Sekarang)';
    } else if (selectedArea == null) {
      buttonText = 'Pilih Area Terlebih Dahulu';
    } else if (selectedArea.isFullyBooked) {
      buttonText = 'Area Sudah Penuh untuk Waktu Ini';
    } else if (selectedTableIds.isEmpty) {
      buttonText = 'Pilih Meja Terlebih Dahulu';
    } else if (!_isTableSelectionValid()) {
      buttonText = 'Kapasitas Meja Tidak Mencukupi';
    }

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _canMakeReservation ? _checkAvailability : null,
        style: ElevatedButton.styleFrom(
          backgroundColor:
              _canMakeReservation
                  ? Colors.green.shade700
                  : Colors.grey.shade300,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        child:
            isCheckingAvailability
                ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    strokeWidth: 2,
                  ),
                )
                : Text(
                  buttonText,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color:
                        _canMakeReservation
                            ? Colors.white
                            : Colors.grey.shade600,
                  ),
                ),
      ),
    );
  }

  Widget _buildTableList() {
    final selectedArea = ref.watch(selectedAreaProvider);
    final tables = ref.watch(tablesProvider);
    final selectedTableIds = ref.watch(selectedTableIdsProvider);
    final isLoadingTables = ref.watch(isLoadingTablesProvider);
    final personCount = ref.watch(personCountProvider);

    if (selectedArea == null) return const SizedBox();

    if (isLoadingTables) {
      return const Center(child: CircularProgressIndicator());
    }

    if (tables.isEmpty) {
      return const Center(
        child: Text(
          'Tidak ada meja tersedia untuk area ini',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    // Filter tables by availability status
    final availableTables =
        tables.where((table) => table.canBeSelected).toList();

    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Pilih Meja',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (selectedTableIds.isNotEmpty)
                    Text(
                      'Dipilih: ${selectedTableIds.length} meja',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.green.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  Text(
                    'Tersedia: ${availableTables.length}/${tables.length}',
                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Selected tables info
          if (selectedTableIds.isNotEmpty) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          'Total Kapasitas: ${_calculateTotalCapacity()} orang',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Colors.green.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Status: ${_isTableSelectionValid() ? "Mencukupi" : "Tidak Mencukupi"} untuk $personCount orang',
                    style: TextStyle(
                      fontSize: 11,
                      color:
                          _isTableSelectionValid() ? Colors.green : Colors.red,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Area availability warning
          if (selectedArea.isFullyBooked) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning, color: Colors.red.shade600, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Area sudah penuh untuk waktu yang dipilih',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.red.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Tables grid
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children:
                tables.map((table) {
                  final isSelected = selectedTableIds.contains(table.id);
                  final canBeSelected = table.canBeSelected;

                  Color backgroundColor;
                  Color borderColor;
                  Color textColor;

                  if (!canBeSelected) {
                    backgroundColor = Colors.red.shade100;
                    borderColor = Colors.red.shade300;
                    textColor = Colors.red.shade800;
                  } else if (isSelected) {
                    backgroundColor = Colors.green.shade700;
                    borderColor = Colors.green.shade700;
                    textColor = Colors.white;
                  } else {
                    backgroundColor = Colors.white;
                    borderColor = Colors.grey.shade300;
                    textColor = Colors.black87;
                  }

                  return GestureDetector(
                    onTap: () => _toggleTableSelection(table.id),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: 8,
                        horizontal: 12,
                      ),
                      decoration: BoxDecoration(
                        color: backgroundColor,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: borderColor,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            table.tableNumber,
                            style: TextStyle(
                              color: textColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            '${table.seats} kursi',
                            style: TextStyle(
                              color:
                                  isSelected
                                      ? Colors.white70
                                      : Colors.grey.shade600,
                              fontSize: 10,
                            ),
                          ),
                          if (!canBeSelected)
                            Text(
                              table.isReserved
                                  ? 'Direservasi'
                                  : 'Tidak Tersedia',
                              style: TextStyle(
                                color: Colors.red.shade600,
                                fontSize: 8,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
          ),

          const SizedBox(height: 8),

          // Legend
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: [
              _buildLegendItem(Colors.white, Colors.grey.shade300, 'Tersedia'),
              _buildLegendItem(
                Colors.green.shade700,
                Colors.green.shade700,
                'Dipilih',
              ),
              _buildLegendItem(
                Colors.red.shade100,
                Colors.red.shade300,
                'Direservasi/Tidak Tersedia',
              ),
            ],
          ),

          // Refresh button
          const SizedBox(height: 8),
          Center(
            child: TextButton.icon(
              onPressed: _refreshTablesAvailability,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text(
                'Refresh Ketersediaan',
                style: TextStyle(fontSize: 12),
              ),
              style: TextButton.styleFrom(
                foregroundColor: Colors.green.shade700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(
    Color backgroundColor,
    Color borderColor,
    String label,
  ) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: backgroundColor,
            border: Border.all(color: borderColor),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 9, color: Colors.grey)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedDate = ref.watch(selectedDateProvider);
    final selectedTime = ref.watch(selectedTimeProvider);
    final selectedArea = ref.watch(selectedAreaProvider);
    final personCount = ref.watch(personCountProvider);
    final areas = ref.watch(areasProvider);
    final isLoadingAreas = ref.watch(isLoadingAreasProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      // appBar: const ClassicAppBar(title: 'Reservasi'),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Date selection
                DateSelector(
                  selectedDate: selectedDate,
                  onDateChanged: _onDateChanged,
                ),
                const SizedBox(height: 16),

                // Time selection
                TimeSelector(
                  selectedTime: selectedTime,
                  selectedDate: selectedDate,
                  onTimeChanged: _onTimeChanged,
                  selectTime: () => _selectTime(context),
                ),
                const SizedBox(height: 16),

                // Area selection
                AreaSelector(
                  areas: areas,
                  selectedAreaId: selectedArea?.id,
                  onAreaChanged: _onAreaChanged,
                  isLoading: isLoadingAreas,
                ),

                const SizedBox(height: 16),

                // Table selection
                _buildTableList(),

                const SizedBox(height: 16),

                // Person count
                PersonCounter(
                  personCount: personCount,
                  maxPersons: selectedArea?.capacity ?? 30,
                  onPersonCountChanged: (count) {
                    ref.read(personCountProvider.notifier).state = count;
                  },
                ),

                const SizedBox(height: 24),

                // Reservation button
                _buildReservationButton(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
