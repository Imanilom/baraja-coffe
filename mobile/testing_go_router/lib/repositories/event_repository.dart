import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/event.model.dart';
import 'package:kasirbaraja/services/event_service.dart';

class EventRepository {
  final EventService _eventService = EventService();

  Future<List<Event>> getEvents() async {
    try {
      var eventBox = Hive.box<Event>('eventsBox');

      final data = await _eventService.fetchEvent();
      final List<dynamic> eventsJson = data['data'];
      final eventsList =
          eventsJson.map((json) => Event.fromJson(json)).toList();

      //urutkan nama event secara abjad
      eventsList.sort(
        (a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()),
      );

      // Simpan atau perbarui data di Hive
      for (var event in eventsList) {
        print('Saving event: ${event.name}');
        await eventBox.put(event.id, event);
      }

      //hapus data yang sudah tidak ada di API
      final apiEventIds = eventsList.map((e) => e.id).toSet();
      final localEventIds = eventBox.keys.cast<String>().toSet();
      final idsToDelete = localEventIds.difference(apiEventIds);
      for (var id in idsToDelete) {
        await eventBox.delete(id);
      }

      print('Events synced: ${eventsList.length}');

      return eventsList;
    } catch (e) {
      throw Exception('Failed to load events: $e');
    }
  }

  Future<List<Event>> getLocalEvents() async {
    var eventBox = Hive.box<Event>('eventsBox');
    final localData = eventBox.values.toList();

    // Urutkan data lokal berdasarkan nama (abjad)
    localData.sort(
      (a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()),
    );
    return localData;
  }
}
