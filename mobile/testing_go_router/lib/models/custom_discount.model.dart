import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';

part 'custom_discount.model.freezed.dart';
part 'custom_discount.model.g.dart';

/// Model untuk custom discount yang bisa diterapkan pada item atau order level
/// Menyimpan metadata lengkap (siapa, kapan, kenapa) untuk audit trail
@freezed
@HiveType(typeId: 37) // TypeId 37 - Custom Discount Model
abstract class CustomDiscountModel with _$CustomDiscountModel {
  const factory CustomDiscountModel({
    /// Status aktif discount
    @HiveField(0) @Default(false) bool isActive,

    /// Tipe discount: 'percentage' atau 'fixed'
    @HiveField(1) String? discountType,

    /// Nilai discount (percentage number atau nominal rupiah)
    @HiveField(2) @Default(0) int discountValue,

    /// Jumlah discount dalam rupiah (hasil kalkulasi)
    @HiveField(3) @Default(0) int discountAmount,

    /// ID kasir yang menerapkan discount
    @HiveField(4) String? appliedBy,

    /// Waktu discount diterapkan
    @HiveField(5) DateTime? appliedAt,

    /// Alasan pemberian discount
    @HiveField(6) @Default('') String reason,
  }) = _CustomDiscountModel;

  factory CustomDiscountModel.fromJson(Map<String, dynamic> json) =>
      _$CustomDiscountModelFromJson(json);
}

/// Extension untuk helper methods
extension CustomDiscountModelExtension on CustomDiscountModel {
  /// Check apakah discount valid
  bool get isValid => isActive && discountAmount > 0;

  /// Get display text untuk discount type
  String get typeDisplayText {
    if (discountType == 'percentage') return 'Persentase';
    if (discountType == 'fixed') return 'Nominal Tetap';
    return 'Unknown';
  }

  /// Get display text untuk discount value
  String get valueDisplayText {
    if (discountType == 'percentage') return '$discountValue%';
    return 'Rp ${discountValue.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}';
  }
}
