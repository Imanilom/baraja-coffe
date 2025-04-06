import 'package:hive_ce/hive.dart';

part 'topping.model.g.dart';

@HiveType(typeId: 1)
class ToppingModel {
  @HiveField(0)
  final String? id;

  @HiveField(1)
  final String name;

  @HiveField(2)
  final int price;

  ToppingModel({
    this.id,
    required this.name,
    required this.price,
  });

  factory ToppingModel.fromJson(Map<String, dynamic> json) {
    return ToppingModel(
      id: json['_id'],
      name: json['name'],
      price: json['price'],
    );
  }
}
