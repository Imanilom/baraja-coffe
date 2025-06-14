import 'package:hive_ce/hive.dart';

part 'addon_option.model.g.dart';

@HiveType(typeId: 3)
class AddonOptionModel {
  @HiveField(0)
  final String? id;

  @HiveField(1)
  final String name;

  @HiveField(2)
  final double price;

  AddonOptionModel({
    this.id,
    required this.name,
    required this.price,
  });
}
