import 'package:hive_ce/hive.dart';

part 'billing_model.g.dart';

@HiveType(typeId: 0)
class Billing {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final List<String> items;

  @HiveField(2)
  final double totalPrice;

  Billing({
    required this.id,
    required this.items,
    required this.totalPrice,
  });
}
