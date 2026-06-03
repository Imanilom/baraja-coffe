// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/enums/location_type.dart';
import 'package:kasirbaraja/models/order_status.model.dart';
import 'package:kasirbaraja/models/order_type.model.dart';
import 'package:kasirbaraja/models/applied_promos.model.dart';
import 'package:kasirbaraja/models/cashier.model.dart';
import 'package:kasirbaraja/models/custom_amount_items.model.dart';
import 'package:kasirbaraja/models/custom_discount.model.dart';
import 'package:kasirbaraja/models/discount.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/models/tax_service_detail.model.dart';

part 'order_detail.model.freezed.dart';
part 'order_detail.model.g.dart';

@freezed
@HiveType(typeId: 5)
abstract class OrderDetailModel with _$OrderDetailModel {
  factory OrderDetailModel({
    // Identitas Order
    @HiveField(0) @Default(null) @JsonKey(name: 'order_id') String? orderId,
    @HiveField(1) @JsonKey(name: 'user_id') String? userId,
    @HiveField(2) @Default(null) String? user,
    @HiveField(3) @Default(null) CashierModel? cashier,

    // Item dan Status
    @HiveField(4) @Default([]) List<OrderItemModel> items,
    @HiveField(5)
    @JsonKey(
      fromJson: OrderStatusModel.fromString,
      toJson: OrderStatusModel.toJsonString,
    )
    @Default(OrderStatusModel.unknown)
    OrderStatusModel status,

    // Pembayaran & Tipe Order
    @HiveField(6) @Default(null) String? paymentMethod,

    @HiveField(7)
    @JsonKey(
      fromJson: OrderTypeModel.fromString,
      toJson: OrderTypeModel.toJsonString,
    )
    required OrderTypeModel orderType,

    // Lokasi
    @HiveField(8) @Default('') String deliveryAddress,
    @HiveField(9) @Default('') String? tableNumber,

    @HiveField(10)
    @JsonKey(
      fromJson: LocationTypeModel.fromString,
      toJson: LocationTypeModel.toJsonString,
    )
    @Default(LocationTypeModel.indoor)
    LocationTypeModel type,

    @HiveField(11) String? outlet,

    // Diskon & Promo
    @HiveField(12) DiscountModel? discounts,
    @HiveField(13) @Default([]) List<AppliedPromosModel>? appliedPromos,
    @HiveField(14) @Default(null) String? appliedManualPromo,
    @HiveField(15) @Default(null) String? appliedVoucher,

    // Pajak & Layanan
    @HiveField(16)
    @Default([])
    List<TaxServiceDetailModel> taxAndServiceDetails,
    @HiveField(17) @Default(0) int totalTax,
    @HiveField(18) @Default(0) int totalServiceFee,

    // Total Harga,
    @HiveField(19) @Default(0) int totalBeforeDiscount,
    @HiveField(20) @Default(0) int totalAfterDiscount,
    @HiveField(21) @Default(0) int grandTotal,

    // Metadata
    @HiveField(22) @Default(null) String? source,
    @HiveField(23) @JsonKey(name: 'createdAtWIB') DateTime? createdAt,
    @HiveField(24) @JsonKey(name: 'updatedAtWIB') DateTime? updatedAt,
    @HiveField(25)
    @JsonKey(name: 'payment_details')
    @Default(<PaymentModel>[])
    List<PaymentModel> payments,
    @HiveField(26) @Default(null) String? paymentStatus,
    @HiveField(27) @Default(null) @JsonKey(name: '_id') String? id,
    @HiveField(28) @Default(false) bool isOpenBill,
    //nominal pembayaran,
    @HiveField(29) @Default(0) int paymentAmount,
    @HiveField(30) @Default(0) int changeAmount,
    @HiveField(31) @Default(null) String? paymentType,
    @HiveField(32) @Default(false) bool isSplitPayment,
    @HiveField(33) @Default(0) int printSequence,
    @HiveField(34) @Default([]) List<String> printHistory,
    @HiveField(35)
    @Default(null)
    List<CustomAmountItemsModel>? customAmountItems,
    @HiveField(36) @Default(0) int totalCustomAmount,
    @HiveField(37) @Default(<String>[]) List<String> selectedPromoIds,

    // Custom discount untuk order-level
    @HiveField(38) @Default(null) CustomDiscountModel? customDiscountDetails,
  }) = _OrderDetailModel;

  factory OrderDetailModel.fromJson(Map<String, dynamic> json) =>
      _$OrderDetailModelFromJson(json);

  // Konverter untuk JSON serialization
  // static String orderStatusToJson(OrderStatus status) => status.value;
  // static String? paymentMethodToJson(PaymentMethod? method) => method?.value;
  // static String orderTypeToJson(OrderType type) => type.value;
  // static String locationTypeToJson(LocationType type) => type.value;
}
