import 'package:hive_ce/hive.dart';

part 'addon_option.model.g.dart';

@HiveType(typeId: 3)
class AddonOptionModel {
  @HiveField(0)
  final String? id;

  @HiveField(1)
  final String label;

  @HiveField(2)
  final bool? isDefault;

  @HiveField(3)
  final int price;

  AddonOptionModel({
    this.id,
    required this.label,
    this.isDefault,
    required this.price,
  });

  factory AddonOptionModel.fromJson(Map<String, dynamic> json) {
    return AddonOptionModel(
      id: json['_id'],
      label: json['label'],
      isDefault: json['isDefault'],
      price: json['price'],
    );
  }
}
