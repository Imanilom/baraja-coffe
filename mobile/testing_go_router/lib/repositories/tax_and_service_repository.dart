import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/tax_and_service.model.dart';
import 'package:kasirbaraja/models/user.model.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:kasirbaraja/services/tax_and_service_service.dart';

class TaxAndServiceRepository {
  final TaxAndServiceService _taxAndServiceService = TaxAndServiceService();

  // Open the Hive box for tax and services
  final Box<TaxAndServiceModel> _box = HiveService.taxAndServiceBox;
  final Future<UserModel?> _userBox = HiveService.getUser();
  Future<String> get _outletId async => (await _userBox)?.outletId ?? '';

  Future<List<TaxAndServiceModel>> getTaxAndServices() async {
    try {
      if (_box.isEmpty) {
        final taxAndServicesResponse =
            await _taxAndServiceService.fetchTaxAndServices();
        AppLogger.debug(
          'fetched tax and services: ${taxAndServicesResponse['data']}',
        );
        final taxAndServicesList =
            (taxAndServicesResponse['data'] as List)
                .map((json) => TaxAndServiceModel.fromJson(json))
                .toList();

        // Save fetched data to Hive
        // await _box.clear();
        await _box.addAll(taxAndServicesList);
      }

      return getTaxOnly();
    } catch (e) {
      AppLogger.error('Failed to fetch tax and services', error: e);
      rethrow;
    }
  }

  //get tax only
  Future<List<TaxAndServiceModel>> getTaxOnly() async {
    final allTaxAndServices = _box.values.toList();
    return allTaxAndServices
        .where((tax) => tax.type == 'tax' && tax.isActive == true)
        .toList();
  }

  // Get service charges only
  Future<List<TaxAndServiceModel>> getServiceOnly() async {
    final allTaxAndServices = _box.values.toList();
    return allTaxAndServices
        .where(
          (service) => service.type == 'service' && service.isActive == true,
        )
        .toList();
  }

  // Get active taxes for specific outlet
  Future<List<TaxAndServiceModel>> getActiveTaxesForOutlet(
    String outletId,
  ) async {
    final allTaxes = await getTaxOnly();
    return allTaxes.where((tax) {
      // Cek apakah tax berlaku untuk outlet ini
      return tax.appliesToOutlets?.any((outlet) => outlet.id == outletId) ??
          false;
    }).toList();
  }

  // Get active service charges for specific outlet
  Future<List<TaxAndServiceModel>> getActiveServicesForOutlet(
    String outletId,
  ) async {
    final allServices = await getServiceOnly();
    return allServices.where((service) {
      // Cek apakah service berlaku untuk outlet ini
      return service.appliesToOutlets?.any((outlet) => outlet.id == outletId) ??
          false;
    }).toList();
  }

  /// Calculate total tax for given subtotal and outlet
  Future<int> calculateTotalTax(int subtotal, String outletId) async {
    try {
      final activeTaxes = await getActiveTaxesForOutlet(outletId);

      if (activeTaxes.isEmpty) {
        AppLogger.debug('No active taxes found for outlet: $outletId');
        return 0;
      }

      // Hitung total persentase tax
      final totalTaxPercentage = activeTaxes.fold(
        0.0,
        (sum, tax) => sum + (tax.percentage ?? 0.0),
      );

      // Hitung tax amount dan bulatkan
      final taxAmount = (subtotal * totalTaxPercentage / 100).round();

      AppLogger.debug(
        'Tax calculation:\n'
        '- Subtotal: Rp $subtotal\n'
        '- Total tax percentage: $totalTaxPercentage%\n'
        '- Tax amount: Rp $taxAmount',
      );

      return taxAmount;
    } catch (e) {
      AppLogger.error('Error calculating tax', error: e);
      return 0;
    }
  }

  /// Calculate service charge for given subtotal and outlet
  Future<int> calculateServiceCharge(int subtotal, String outletId) async {
    try {
      final activeServices = await getActiveServicesForOutlet(outletId);

      if (activeServices.isEmpty) {
        AppLogger.debug(
          'No active service charges found for outlet: $outletId',
        );
        return 0;
      }

      // Hitung total persentase service
      final totalServicePercentage = activeServices.fold(
        0.0,
        (sum, service) => sum + (service.percentage ?? 0.0),
      );

      // Hitung service amount dan bulatkan
      final serviceAmount = (subtotal * totalServicePercentage / 100).round();

      AppLogger.debug(
        'Service charge calculation:\n'
        '- Subtotal: Rp $subtotal\n'
        '- Total service percentage: $totalServicePercentage%\n'
        '- Service amount: Rp $serviceAmount',
      );

      return serviceAmount;
    } catch (e) {
      AppLogger.error('Error calculating service charge', error: e);
      return 0;
    }
  }

  /// Get detailed breakdown of tax calculation
  Future<TaxBreakdownResult> getTaxBreakdown(
    int subtotal,
    String outletId,
  ) async {
    try {
      final activeTaxes = await getActiveTaxesForOutlet(outletId);

      if (activeTaxes.isEmpty) {
        return TaxBreakdownResult(
          taxes: [],
          totalTaxAmount: 0,
          totalTaxPercentage: 0.0,
        );
      }

      final List<TaxDetail> taxDetails = [];
      int totalTaxAmount = 0;
      double totalTaxPercentage = 0.0;

      for (final tax in activeTaxes) {
        final percentage = tax.percentage!.toDouble();
        final taxAmount = (subtotal * percentage / 100).round();
        totalTaxAmount += taxAmount;
        totalTaxPercentage += percentage;

        taxDetails.add(
          TaxDetail(
            id: tax.id ?? '',
            name: tax.name ?? 'Unknown Tax',
            percentage: percentage,
            amount: taxAmount,
            type: tax.type ?? 'tax',
          ),
        );
      }

      return TaxBreakdownResult(
        taxes: taxDetails,
        totalTaxAmount: totalTaxAmount,
        totalTaxPercentage: totalTaxPercentage,
      );
    } catch (e) {
      AppLogger.error('Error getting tax breakdown', error: e);
      return TaxBreakdownResult(
        taxes: [],
        totalTaxAmount: 0,
        totalTaxPercentage: 0.0,
      );
    }
  }

  /// Get detailed breakdown of service charges
  Future<ServiceBreakdownResult> getServiceBreakdown(
    int subtotal,
    String outletId,
  ) async {
    try {
      final activeServices = await getActiveServicesForOutlet(outletId);

      if (activeServices.isEmpty) {
        return ServiceBreakdownResult(
          services: [],
          totalServiceAmount: 0,
          totalServicePercentage: 0.0,
        );
      }

      final List<ServiceDetail> serviceDetails = [];
      int totalServiceAmount = 0;
      double totalServicePercentage = 0.0;

      for (final service in activeServices) {
        final percentage = service.percentage!.toDouble();
        final serviceAmount = (subtotal * percentage / 100).round();
        totalServiceAmount += serviceAmount;
        totalServicePercentage += percentage;

        serviceDetails.add(
          ServiceDetail(
            id: service.id ?? '',
            name: service.name ?? 'Unknown Service',
            percentage: percentage,
            amount: serviceAmount,
            type: service.type ?? 'service',
          ),
        );
      }

      return ServiceBreakdownResult(
        services: serviceDetails,
        totalServiceAmount: totalServiceAmount,
        totalServicePercentage: totalServicePercentage,
      );
    } catch (e) {
      AppLogger.error('Error getting service breakdown', error: e);
      return ServiceBreakdownResult(
        services: [],
        totalServiceAmount: 0,
        totalServicePercentage: 0.0,
      );
    }
  }

  /// Calculate complete order totals (tax + service + grand total)
  Future<OrderCalculationResult> calculateOrderTotals(int subtotal) async {
    try {
      final outletId = await _outletId;
      AppLogger.debug('Calculating order totals for outlet: $outletId');

      final taxAmount = await calculateTotalTax(subtotal, outletId);
      final serviceAmount = await calculateServiceCharge(subtotal, outletId);
      final taxBreakdown = await getTaxBreakdown(subtotal, outletId);
      final serviceBreakdown = await getServiceBreakdown(subtotal, outletId);

      final grandTotal = subtotal + taxAmount + serviceAmount;

      AppLogger.debug(
        'Order calculation summary:\n'
        '- Subtotal: Rp $subtotal\n'
        '- Tax: Rp $taxAmount\n'
        '- Service: Rp $serviceAmount\n'
        '- Grand Total: Rp $grandTotal',
      );

      return OrderCalculationResult(
        subtotal: subtotal,
        taxAmount: taxAmount,
        serviceAmount: serviceAmount,
        grandTotal: grandTotal,
        taxBreakdown: taxBreakdown,
        serviceBreakdown: serviceBreakdown,
      );
    } catch (e) {
      AppLogger.error('Error calculating order totals', error: e);
      // Return safe defaults in case of error
      return OrderCalculationResult(
        subtotal: subtotal,
        taxAmount: 0,
        serviceAmount: 0,
        grandTotal: subtotal,
        taxBreakdown: TaxBreakdownResult(
          taxes: [],
          totalTaxAmount: 0,
          totalTaxPercentage: 0.0,
        ),
        serviceBreakdown: ServiceBreakdownResult(
          services: [],
          totalServiceAmount: 0,
          totalServicePercentage: 0.0,
        ),
      );
    }
  }

  Future<void> debugTaxCalculation() async {
    final outletId = await _outletId;
    String debugMsg =
        '\n=== DEBUG TAX CALCULATION ===\n'
        'Outlet ID: $outletId\n';

    final allTaxAndServices = getAllTaxAndServices();
    debugMsg += 'Total tax and services in Hive: ${allTaxAndServices.length}\n';

    final activeTaxes = await getActiveTaxesForOutlet(outletId);
    debugMsg += 'Active taxes for outlet: ${activeTaxes.length}\n';
    for (var tax in activeTaxes) {
      debugMsg += '- ${tax.name}: ${tax.percentage}% (${tax.type})\n';
    }

    final activeServices = await getActiveServicesForOutlet(outletId);
    debugMsg += 'Active services for outlet: ${activeServices.length}\n';
    for (var service in activeServices) {
      debugMsg +=
          '- ${service.name}: ${service.percentage}% (${service.type})\n';
    }

    // Test calculation dengan sample subtotal
    const testSubtotal = 100000;
    final result = await calculateOrderTotals(testSubtotal);
    debugMsg +=
        'Sample calculation (Rp $testSubtotal):\n'
        '- Tax: Rp ${result.taxAmount}\n'
        '- Service: Rp ${result.serviceAmount}\n'
        '- Total: Rp ${result.grandTotal}\n'
        '=== END DEBUG ===\n';

    AppLogger.debug(debugMsg);
  }

  // Existing methods
  Future<void> addTaxAndService(TaxAndServiceModel taxAndService) async {
    await _box.add(taxAndService);
  }

  Future<void> updateTaxAndService(
    int index,
    TaxAndServiceModel taxAndService,
  ) async {
    await _box.putAt(index, taxAndService);
  }

  Future<void> deleteTaxAndService(int index) async {
    await _box.deleteAt(index);
  }

  Future<void> clearAllTaxAndServices() async {
    await _box.clear();
  }

  List<TaxAndServiceModel> getAllTaxAndServices() {
    return _box.values.toList();
  }
}

// Supporting models untuk result breakdown
class TaxDetail {
  final String id;
  final String name;
  final double percentage;
  final int amount;
  final String type;

  TaxDetail({
    required this.id,
    required this.name,
    required this.percentage,
    required this.amount,
    required this.type,
  });
}

class ServiceDetail {
  final String id;
  final String name;
  final double percentage;
  final int amount;
  final String type;

  ServiceDetail({
    required this.id,
    required this.name,
    required this.percentage,
    required this.amount,
    required this.type,
  });
}

class TaxBreakdownResult {
  final List<TaxDetail> taxes;
  final int totalTaxAmount;
  final double totalTaxPercentage;

  TaxBreakdownResult({
    required this.taxes,
    required this.totalTaxAmount,
    required this.totalTaxPercentage,
  });
}

class ServiceBreakdownResult {
  final List<ServiceDetail> services;
  final int totalServiceAmount;
  final double totalServicePercentage;

  ServiceBreakdownResult({
    required this.services,
    required this.totalServiceAmount,
    required this.totalServicePercentage,
  });
}

class OrderCalculationResult {
  final int subtotal;
  final int taxAmount;
  final int serviceAmount;
  final int grandTotal;
  final TaxBreakdownResult taxBreakdown;
  final ServiceBreakdownResult serviceBreakdown;

  OrderCalculationResult({
    required this.subtotal,
    required this.taxAmount,
    required this.serviceAmount,
    required this.grandTotal,
    required this.taxBreakdown,
    required this.serviceBreakdown,
  });
}
