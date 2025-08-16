import 'package:hive_ce/hive.dart';
import 'package:kasirbaraja/models/tax_and_service.model.dart';
import 'package:kasirbaraja/services/tax_and_service_service.dart';

class TaxAndServiceRepository {
  final TaxAndServiceService _taxAndServiceService = TaxAndServiceService();

  // Open the Hive box for tax and services
  final Box<TaxAndServiceModel> _box = Hive.box<TaxAndServiceModel>(
    'taxAndServicesBox',
  );

  Future<List<TaxAndServiceModel>> getTaxAndServices() async {
    try {
      // If the box is empty, fetch from the service
      if (_box.isEmpty) {
        final taxAndServicesResponse =
            await _taxAndServiceService.fetchTaxAndServices();
        print("Tax and Services Response: $taxAndServicesResponse");
        final taxAndServicesList =
            (taxAndServicesResponse['data'] as List)
                .map((json) => TaxAndServiceModel.fromJson(json))
                .toList();

        // Save fetched data to Hive
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
