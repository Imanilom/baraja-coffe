import 'package:kasirbaraja/models/location_type.model.dart';

export 'package:kasirbaraja/models/location_type.model.dart';

typedef LocationType = LocationTypeModel;

class LocationTypeExtension {
  static LocationType fromString(String type) =>
      LocationTypeModel.fromString(type);

  static String locationTypeToJson(LocationType type) =>
      LocationTypeModel.toJsonString(type);
}
