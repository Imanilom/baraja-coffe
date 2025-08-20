import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/tax_and_service.model.dart';
import 'package:kasirbaraja/models/user.model.dart';
import 'package:kasirbaraja/services/hive_service.dart';
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
      print("Failed to fetch tax and services: ${e.toString()}");
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
        print('No active taxes found for outlet: $outletId');
        return 0;
      }

      // Hitung total persentase tax
      final totalTaxPercentage = activeTaxes.fold(
        0.0,
        (sum, tax) => sum + (tax.percentage ?? 0.0),
      );

      // Hitung tax amount dan bulatkan
      final taxAmount = (subtotal * totalTaxPercentage / 100).round();

      print('Tax calculation:');
      print('- Subtotal: Rp $subtotal');
      print('- Total tax percentage: $totalTaxPercentage%');
      print('- Tax amount: Rp $taxAmount');

      return taxAmount;
    } catch (e) {
      print('Error calculating tax: $e');
      return 0;
    }
  }

  /// Calculate service charge for given subtotal and outlet
  Future<int> calculateServiceCharge(int subtotal, String outletId) async {
    try {
      final activeServices = await getActiveServicesForOutlet(outletId);

      if (activeServices.isEmpty) {
        print('No active service charges found for outlet: $outletId');
        return 0;
      }

      // Hitung total persentase service
      final totalServicePercentage = activeServices.fold(
        0.0,
        (sum, service) => sum + (service.percentage ?? 0.0),
      );

      // Hitung service amount dan bulatkan
      final serviceAmount = (subtotal * totalServicePercentage / 100).round();

      print('Service charge calculation:');
      print('- Subtotal: Rp $subtotal');
      print('- Total service percentage: $totalServicePercentage%');
      print('- Service amount: Rp $serviceAmount');

      return serviceAmount;
    } catch (e) {
      print('Error calculating service charge: $e');
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
      print('Error getting tax breakdown: $e');
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
      print('Error getting service breakdown: $e');
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
      print('Calculating order totals for outlet: $outletId');

      final taxAmount = await calculateTotalTax(subtotal, outletId);
      final serviceAmount = await calculateServiceCharge(subtotal, outletId);
      final taxBreakdown = await getTaxBreakdown(subtotal, outletId);
      final serviceBreakdown = await getServiceBreakdown(subtotal, outletId);

      final grandTotal = subtotal + taxAmount + serviceAmount;

      print('Order calculation summary:');
      print('- Subtotal: Rp $subtotal');
      print('- Tax: Rp $taxAmount');
      print('- Service: Rp $serviceAmount');
      print('- Grand Total: Rp $grandTotal');

      return OrderCalculationResult(
        subtotal: subtotal,
        taxAmount: taxAmount,
        serviceAmount: serviceAmount,
        grandTotal: grandTotal,
        taxBreakdown: taxBreakdown,
        serviceBreakdown: serviceBreakdown,
      );
    } catch (e) {
      print('Error calculating order totals: $e');
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

  /// Test method untuk debugging tax calculation
  Future<void> debugTaxCalculation() async {
    final outletId = await _outletId;
    print('\n=== DEBUG TAX CALCULATION ===');
    print('Outlet ID: $outletId');

    final allTaxAndServices = getAllTaxAndServices();
    print('Total tax and services in Hive: ${allTaxAndServices.length}');

    final activeTaxes = await getActiveTaxesForOutlet(outletId);
    print('Active taxes for outlet: ${activeTaxes.length}');
    for (var tax in activeTaxes) {
      print('- ${tax.name}: ${tax.percentage}% (${tax.type})');
    }

    final activeServices = await getActiveServicesForOutlet(outletId);
    print('Active services for outlet: ${activeServices.length}');
    for (var service in activeServices) {
      print('- ${service.name}: ${service.percentage}% (${service.type})');
    }

    // Test calculation dengan sample subtotal
    const testSubtotal = 100000;
    final result = await calculateOrderTotals(testSubtotal);
    print('Sample calculation (Rp $testSubtotal):');
    print('- Tax: Rp ${result.taxAmount}');
    print('- Service: Rp ${result.serviceAmount}');
    print('- Total: Rp ${result.grandTotal}');
    print('=== END DEBUG ===\n');
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
