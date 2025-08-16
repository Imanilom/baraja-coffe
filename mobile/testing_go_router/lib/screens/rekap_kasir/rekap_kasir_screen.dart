import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Models
class Transaction {
  final String transactionId;
  final String time;
  final String cashier;
  final int items;
  final int total;
  final String payment;

  Transaction({
    required this.transactionId,
    required this.time,
    required this.cashier,
    required this.items,
    required this.total,
    required this.payment,
  });
}

class SalesReportFilter {
  final String period;
  final String cashier;

  SalesReportFilter({required this.period, required this.cashier});

  SalesReportFilter copyWith({String? period, String? cashier}) {
    return SalesReportFilter(
      period: period ?? this.period,
      cashier: cashier ?? this.cashier,
    );
  }
}

class SalesSummary {
  final int totalTransactions;
  final int totalSales;
  final int averagePerTransaction;
  final int totalItems;

  SalesSummary({
    required this.totalTransactions,
    required this.totalSales,
    required this.averagePerTransaction,
    required this.totalItems,
  });
}

// Providers
final salesReportFilterProvider =
    StateNotifierProvider<SalesReportFilterNotifier, SalesReportFilter>((ref) {
      return SalesReportFilterNotifier();
    });

class SalesReportFilterNotifier extends StateNotifier<SalesReportFilter> {
  SalesReportFilterNotifier()
    : super(SalesReportFilter(period: 'Hari Ini', cashier: 'Semua Kasir'));

  void updatePeriod(String period) {
    state = state.copyWith(period: period);
  }

  void updateCashier(String cashier) {
    state = state.copyWith(cashier: cashier);
  }

  void resetFilter() {
    state = SalesReportFilter(period: 'Hari Ini', cashier: 'Semua Kasir');
  }
}

// Mock data provider - replace with actual API call
final salesDataProvider = Provider<List<Transaction>>((ref) {
  return [
    Transaction(
      transactionId: 'TRX001',
      time: '08:15',
      cashier: 'Budi',
      items: 5,
      total: 125000,
      payment: 'Cash',
    ),
    Transaction(
      transactionId: 'TRX002',
      time: '08:32',
      cashier: 'Sari',
      items: 3,
      total: 87500,
      payment: 'Debit',
    ),
    Transaction(
      transactionId: 'TRX003',
      time: '09:15',
      cashier: 'Budi',
      items: 7,
      total: 234000,
      payment: 'Cash',
    ),
    Transaction(
      transactionId: 'TRX004',
      time: '09:45',
      cashier: 'Andi',
      items: 2,
      total: 45000,
      payment: 'E-wallet',
    ),
    Transaction(
      transactionId: 'TRX005',
      time: '10:20',
      cashier: 'Sari',
      items: 4,
      total: 156000,
      payment: 'Credit',
    ),
  ];
});

// Filtered sales data provider
final filteredSalesDataProvider = Provider<List<Transaction>>((ref) {
  final salesData = ref.watch(salesDataProvider);
  final filter = ref.watch(salesReportFilterProvider);

  // Apply filters
  List<Transaction> filteredData = salesData;

  if (filter.cashier != 'Semua Kasir') {
    filteredData =
        filteredData
            .where((transaction) => transaction.cashier == filter.cashier)
            .toList();
  }

  // Add more filter logic for period if needed
  // This is where you'd implement date filtering based on filter.period

  return filteredData;
});

// Sales summary provider
final salesSummaryProvider = Provider<SalesSummary>((ref) {
  final filteredData = ref.watch(filteredSalesDataProvider);

  final totalTransactions = filteredData.length;
  final totalSales = filteredData.fold(
    0,
    (sum, transaction) => sum + transaction.total,
  );
  final totalItems = filteredData.fold(
    0,
    (sum, transaction) => sum + transaction.items,
  );
  final averagePerTransaction =
      totalTransactions > 0 ? (totalSales / totalTransactions).round() : 0;

  return SalesSummary(
    totalTransactions: totalTransactions,
    totalSales: totalSales,
    averagePerTransaction: averagePerTransaction,
    totalItems: totalItems,
  );
});

// Available periods and cashiers providers
final availablePeriodsProvider = Provider<List<String>>((ref) {
  return ['Hari Ini', 'Kemarin', 'Minggu Ini', 'Bulan Ini'];
});

final availableCashiersProvider = Provider<List<String>>((ref) {
  final salesData = ref.watch(salesDataProvider);
  final cashiers =
      salesData.map((transaction) => transaction.cashier).toSet().toList();
  return ['Semua Kasir', ...cashiers];
});

// Main Widget
class SalesReportPage extends ConsumerStatefulWidget {
  const SalesReportPage({super.key});

  @override
  ConsumerState<SalesReportPage> createState() => _SalesReportPageState();
}

class _SalesReportPageState extends ConsumerState<SalesReportPage> {
  @override
  void initState() {
    super.initState();
    // Force landscape orientation
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
  }

  @override
  void dispose() {
    // Reset orientation when leaving the page
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Text(
          'Laporan Rekap Penjualan',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: Colors.blue[800],
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.print, color: Colors.white),
            onPressed: _handlePrint,
          ),
          IconButton(
            icon: Icon(Icons.download, color: Colors.white),
            onPressed: _handleExport,
          ),
          SizedBox(width: 16),
        ],
      ),
      body: Row(
        children: [
          // Left Panel - Filters and Summary
          Container(
            width: 300,
            color: Colors.white,
            child: Column(
              children: [
                // Filter Section
                FilterSection(),

                // Summary Section
                Expanded(child: SummarySection()),
              ],
            ),
          ),

          // Right Panel - Transaction List
          Expanded(child: TransactionListSection()),
        ],
      ),
    );
  }

  void _handlePrint() {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('Mencetak laporan...')));
  }

  void _handleExport() {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('Mengekspor laporan...')));
  }
}

// Filter Section Widget
class FilterSection extends ConsumerWidget {
  const FilterSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(salesReportFilterProvider);
    final availablePeriods = ref.watch(availablePeriodsProvider);
    final availableCashiers = ref.watch(availableCashiersProvider);

    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Filter Laporan',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.blue[800],
            ),
          ),
          SizedBox(height: 16),

          // Period Filter
          Text('Periode:', style: TextStyle(fontWeight: FontWeight.w500)),
          SizedBox(height: 4),
          DropdownButtonFormField<String>(
            value: filter.period,
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              isDense: true,
            ),
            items:
                availablePeriods
                    .map(
                      (period) =>
                          DropdownMenuItem(value: period, child: Text(period)),
                    )
                    .toList(),
            onChanged: (value) {
              if (value != null) {
                ref
                    .read(salesReportFilterProvider.notifier)
                    .updatePeriod(value);
              }
            },
          ),

          SizedBox(height: 12),

          // Cashier Filter
          Text('Kasir:', style: TextStyle(fontWeight: FontWeight.w500)),
          SizedBox(height: 4),
          DropdownButtonFormField<String>(
            value: filter.cashier,
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              isDense: true,
            ),
            items:
                availableCashiers
                    .map(
                      (cashier) => DropdownMenuItem(
                        value: cashier,
                        child: Text(cashier),
                      ),
                    )
                    .toList(),
            onChanged: (value) {
              if (value != null) {
                ref
                    .read(salesReportFilterProvider.notifier)
                    .updateCashier(value);
              }
            },
          ),

          SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Filter diterapkan')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue[800],
                    foregroundColor: Colors.white,
                  ),
                  child: Text('Terapkan'),
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    ref.read(salesReportFilterProvider.notifier).resetFilter();
                  },
                  child: Text('Reset'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Summary Section Widget
class SummarySection extends ConsumerWidget {
  const SummarySection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(salesSummaryProvider);

    return Padding(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Ringkasan',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          SizedBox(height: 16),

          _buildSummaryCard(
            'Total Transaksi',
            '${summary.totalTransactions}',
            Icons.receipt_long,
            Colors.green,
          ),

          _buildSummaryCard(
            'Total Penjualan',
            'Rp ${_formatCurrency(summary.totalSales)}',
            Icons.attach_money,
            Colors.blue,
          ),

          _buildSummaryCard(
            'Rata-rata per Transaksi',
            'Rp ${_formatCurrency(summary.averagePerTransaction)}',
            Icons.trending_up,
            Colors.orange,
          ),

          _buildSummaryCard(
            'Total Item Terjual',
            '${summary.totalItems}',
            Icons.inventory,
            Colors.purple,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Transaction List Section Widget
class TransactionListSection extends ConsumerWidget {
  const TransactionListSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filteredTransactions = ref.watch(filteredSalesDataProvider);
    final filter = ref.watch(salesReportFilterProvider);

    return Container(
      margin: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
              border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
            ),
            child: Row(
              children: [
                Icon(Icons.list_alt, color: Colors.grey[600]),
                SizedBox(width: 8),
                Text(
                  'Detail Transaksi - ${filter.period}',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
                Spacer(),
                Text(
                  'Total: ${filteredTransactions.length} transaksi',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),

          // Table Header
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
            ),
            child: Row(
              children: [
                Expanded(
                  flex: 2,
                  child: Text('ID Transaksi', style: _headerStyle()),
                ),
                Expanded(flex: 1, child: Text('Waktu', style: _headerStyle())),
                Expanded(flex: 2, child: Text('Kasir', style: _headerStyle())),
                Expanded(flex: 1, child: Text('Items', style: _headerStyle())),
                Expanded(flex: 2, child: Text('Total', style: _headerStyle())),
                Expanded(
                  flex: 2,
                  child: Text('Pembayaran', style: _headerStyle()),
                ),
              ],
            ),
          ),

          // Transaction List
          Expanded(
            child: ListView.builder(
              itemCount: filteredTransactions.length,
              itemBuilder: (context, index) {
                final transaction = filteredTransactions[index];
                return TransactionRow(transaction: transaction);
              },
            ),
          ),
        ],
      ),
    );
  }

  TextStyle _headerStyle() {
    return TextStyle(
      fontWeight: FontWeight.bold,
      color: Colors.grey[700],
      fontSize: 13,
    );
  }
}

// Transaction Row Widget
class TransactionRow extends StatelessWidget {
  final Transaction transaction;

  const TransactionRow({super.key, required this.transaction});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey[200]!, width: 0.5),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              transaction.transactionId,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.blue[700],
              ),
            ),
          ),
          Expanded(flex: 1, child: Text(transaction.time)),
          Expanded(flex: 2, child: Text(transaction.cashier)),
          Expanded(flex: 1, child: Text('${transaction.items}')),
          Expanded(
            flex: 2,
            child: Text(
              'Rp ${_formatCurrency(transaction.total)}',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.green[700],
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getPaymentColor(transaction.payment),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                transaction.payment,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getPaymentColor(String payment) {
    switch (payment) {
      case 'Cash':
        return Colors.green;
      case 'Debit':
        return Colors.blue;
      case 'Credit':
        return Colors.purple;
      case 'E-wallet':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}

// Helper function
String _formatCurrency(int amount) {
  String str = amount.toString();
  String result = '';
  int count = 0;

  for (int i = str.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 == 0) {
      result = '.$result';
    }
    result = str[i] + result;
    count++;
  }

  return result;
}
