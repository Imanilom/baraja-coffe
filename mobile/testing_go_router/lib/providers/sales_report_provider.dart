import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/services/sales_report_service.dart';

final salesReportService = SalesReportService();

// final salesReportProvider = FutureProvider.autoDispose
//     .family<Map<String, dynamic>, String>((ref, date) async {
//       final user = await HiveService.getUser();

//       if (user == null) {
//         throw Exception('User not found');
//       }

//       final outletId = user.outletId!;
//       final report = await salesReportService.fetchSalesReportSummary(
//         outletId,
//         date,
//       );

//       return report;
//     });
