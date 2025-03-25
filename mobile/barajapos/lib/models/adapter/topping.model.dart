import 'package:hive_ce/hive.dart';

part 'topping.model.g.dart';

@HiveType(typeId: 1)
class ToppingModel {
  @HiveField(0)
  final String? id;

  @HiveField(1)
  final double name;

  @HiveField(2)
  final String price;

  ToppingModel({
    this.id,
    required this.name,
    required this.price,
  });
}
