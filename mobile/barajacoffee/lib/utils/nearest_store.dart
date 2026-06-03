import 'package:geolocator/geolocator.dart';
import 'dart:math';

List<Map<String, dynamic>> stores = [
  {"name": "Baraja Coffee A", "latitude": -6.200000, "longitude": 106.816666},
  {"name": "Baraja Coffee B", "latitude": -6.202345, "longitude": 106.812345},
  {"name": "Baraja Coffee C", "latitude": -6.205678, "longitude": 106.810123},
];


Future<Position?> getUserLocation() async {
  bool serviceEnabled;
  LocationPermission permission;

  serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) {
    return null;
  }

  permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.deniedForever) {
      return null;
    }
  }

  return await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
}


double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
  const double R = 6371; // Radius bumi dalam km
  double dLat = (lat2 - lat1) * pi / 180;
  double dLon = (lon2 - lon1) * pi / 180;
  double a = sin(dLat / 2) * sin(dLat / 2) +
      cos(lat1 * pi / 180) * cos(lat2 * pi / 180) * sin(dLon / 2) * sin(dLon / 2);
  double c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return R * c;
}

Map<String, dynamic>? findNearestStore(Position userPosition) {
  Map<String, dynamic>? nearestStore;
  double minDistance = double.infinity;

  for (var store in stores) {
    double distance = calculateDistance(
      userPosition.latitude,
      userPosition.longitude,
      store["latitude"],
      store["longitude"],
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestStore = {...store, "distance": minDistance};
    }
  }

  return nearestStore;
}
