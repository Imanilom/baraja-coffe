enum LocationType { indoor, outdoor, unknown }

extension LocationTypeExtension on LocationType {
  String get value {
    switch (this) {
      case LocationType.indoor:
        return 'Indoor';
      case LocationType.outdoor:
        return 'Outdoor';
      default:
        return 'Unknown';
    }
  }

  static LocationType fromString(String type) {
    switch (type.toLowerCase()) {
      case 'indoor':
        return LocationType.indoor;
      case 'outdoor':
        return LocationType.outdoor;
      default:
        return LocationType.indoor;
    }
  }

  //to json
  static String locationTypeToJson(LocationType type) => type.value;
}
