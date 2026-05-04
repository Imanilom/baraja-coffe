//future provider for tax and service
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/tax_and_service.model.dart';
import '../repositories/tax_and_service_repository.dart';

final taxAndServiceRepository = Provider<TaxAndServiceRepository>(
  (ref) => TaxAndServiceRepository(),
);

final taxProvider = FutureProvider<List<TaxAndServiceModel>>((ref) async {
  // Simulate fetching data from an API or database
  final repository = ref.watch(taxAndServiceRepository);
  final taxAndServices = await repository.getTaxAndServices();
  // Return the fetched data
  if (taxAndServices.isEmpty) {
    // If no data is found, you can return an empty list or handle it as needed
    return [];
  }

  return taxAndServices;
});
