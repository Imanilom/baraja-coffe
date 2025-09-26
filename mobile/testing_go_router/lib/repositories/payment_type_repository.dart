import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/payment_type_service.dart';
import 'package:hive_ce/hive.dart';

class PaymentTypeRepository {
  final PaymentTypeService _paymentTypeService = PaymentTypeService();

  Future<List<PaymentTypeModel>> getPaymentTypes() async {
    try {
      final paymentTypeBox = HiveService.paymentTypeBox;
      final paymentTypeResponse = await _paymentTypeService.fetchPaymentTypes();

      final serverTypes =
          (paymentTypeResponse['paymentTypes'] as List)
              .map((json) => PaymentTypeModel.fromJson(json))
              .toList();

      // CASE 1: Box kosong (first run)
      if (paymentTypeBox.isEmpty) {
        await _saveAllTypes(paymentTypeBox, serverTypes);
        return serverTypes;
      }

      // CASE 2: Data sudah ada, lakukan sinkronisasi
      final localTypes = paymentTypeBox.values.toList();
      final List<PaymentTypeModel> typesToUpdate = [];
      final List<String> idsToDelete = [];

      // 1. Identifikasi perubahan pada payment types
      for (final serverType in serverTypes) {
        final localType = localTypes.firstWhere(
          (t) => t.id == serverType.id,
          orElse:
              () => PaymentTypeModel(
                id: '',
                name: '',
                icon: '',
                isActive: false,
                paymentMethods: [],
              ),
        );

        // Periksa apakah ada perubahan di type atau methods
        if (localType.id.isEmpty ||
            _hasTypeChanged(localType, serverType) ||
            _hasMethodsChanged(localType, serverType)) {
          typesToUpdate.add(serverType);
        }
      }

      // 2. Identifikasi type yang dihapus di server
      for (final localType in localTypes) {
        if (!serverTypes.any((s) => s.id == localType.id)) {
          idsToDelete.add(localType.id);
        }
      }

      // 3. Eksekusi update dan delete
      await _updateTypes(paymentTypeBox, typesToUpdate);
      await _deleteTypes(paymentTypeBox, idsToDelete);

      return paymentTypeBox.values.toList();
    } catch (e) {
      rethrow;
    }
  }

  //get local payment types
  Future<List<PaymentTypeModel>> getLocalPaymentTypes() async {
    final paymentTypeBox = HiveService.paymentTypeBox;
    if (paymentTypeBox.isEmpty) {
      print('PaymentTypeBox is empty, fetching from server...');
      return getPaymentTypes();
    }
    return paymentTypeBox.values.toList();
  }

  // ===== Helper Methods =====

  Future<void> _saveAllTypes(
    Box<PaymentTypeModel> box,
    List<PaymentTypeModel> types,
  ) async {
    final Map<String, PaymentTypeModel> typeMap = {
      for (var type in types) type.id: type,
    };
    await box.putAll(typeMap);
  }

  Future<void> _updateTypes(
    Box<PaymentTypeModel> box,
    List<PaymentTypeModel> types,
  ) async {
    for (final type in types) {
      print('Updating type: ${type.name}');
      await box.put(type.id, type);
    }
  }

  Future<void> _deleteTypes(Box<PaymentTypeModel> box, List<String> ids) async {
    for (final id in ids) {
      await box.delete(id);
    }
  }

  bool _hasTypeChanged(PaymentTypeModel local, PaymentTypeModel server) {
    return local.name != server.name ||
        local.icon != server.icon ||
        local.isActive != server.isActive;
  }

  bool _hasMethodsChanged(PaymentTypeModel local, PaymentTypeModel server) {
    // 1. Periksa jumlah methods berbeda
    if (local.paymentMethods.length != server.paymentMethods.length) {
      return true;
    }

    // 2. Periksa setiap method
    for (final serverMethod in server.paymentMethods) {
      final localMethod = local.paymentMethods.firstWhere(
        (m) => m.id == serverMethod.id,
        orElse:
            () => PaymentMethodModel(
              id: '',
              name: '',
              methodCode: '',
              typeId: [],
              isDigital: false,
              isActive: false,
            ),
      );

      // Jika method tidak ada atau properti berubah
      if (localMethod.id.isEmpty ||
          localMethod.name != serverMethod.name ||
          localMethod.methodCode != serverMethod.methodCode ||
          localMethod.isDigital != serverMethod.isDigital ||
          localMethod.isActive != serverMethod.isActive) {
        return true;
      }
    }

    return false;
  }
}
