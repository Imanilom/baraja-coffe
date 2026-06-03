import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:kasirbaraja/services/payment_method_service.dart';
import 'package:hive_ce/hive.dart';

class PaymentMethodRepository {
  final PaymentMethodService _paymentMethodService = PaymentMethodService();

  Future<List<PaymentMethodModel>> getPaymentMethods() async {
    final box =
        HiveService.paymentMethodBox; // isinya sekarang PaymentMethodModel

    try {
      final resp = await _paymentMethodService.fetchPaymentMethods();
      final raw = resp['paymentMethods'];
      if (raw is! List) {
        throw StateError('Invalid response: paymentMethods is not a List');
      }
      AppLogger.debug('Received ${raw.length} payment methods from server');
      final serverMethods =
          raw
              .map(
                (e) => PaymentMethodModel.fromJson(e as Map<String, dynamic>),
              )
              .toList();
      AppLogger.info(
        'Fetched ${serverMethods.length} payment methods from server',
      );

      await box.clear();
      await box.putAll({for (final m in serverMethods) m.id: m});

      return serverMethods;
    } catch (e) {
      final local = box.values.cast<PaymentMethodModel>().toList();
      if (local.isNotEmpty) return local;
      rethrow;
    }
  }

  Future<List<PaymentMethodModel>> getLocalPaymentMethods() async {
    final box = HiveService.paymentMethodBox;
    if (box.isEmpty) {
      AppLogger.info('PaymentMethodBox is empty, fetching from server...');
      return getPaymentMethods();
    }
    return box.values.cast<PaymentMethodModel>().toList();
  }
}
