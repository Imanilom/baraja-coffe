import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/sales_report_provider.dart';
// Import service yang sudah dibuat sebelumnya
// import 'sales_report_service.dart';

class SalesReportScreen extends ConsumerStatefulWidget {
  const SalesReportScreen({super.key});

  @override
  ConsumerState<SalesReportScreen> createState() => _SalesReportScreenState();
}

class _SalesReportScreenState extends ConsumerState<SalesReportScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  DateTime selectedDate = DateTime.now();
  DateRange selectedDateRange = DateRange(
    startDate: DateTime.now().subtract(const Duration(days: 7)),
    endDate: DateTime.now(),
  );

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ref = this.ref;
    final reportProvider = ref.watch(salesReportProvider('default'));
    print('reportProvider: $reportProvider');
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Laporan Penjualan',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: Colors.indigo[600],
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.date_range, color: Colors.white),
            onPressed: _showDatePicker,
          ),
          IconButton(
            icon: const Icon(Icons.filter_list, color: Colors.white),
            onPressed: _showFilterDialog,
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            onSelected: _handleMenuSelection,
            itemBuilder:
                (context) => [
                  const PopupMenuItem(
                    value: 'export_csv',
                    child: Row(
                      children: [
                        Icon(Icons.download),
                        SizedBox(width: 8),
                        Text('Export CSV'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'export_pdf',
                    child: Row(
                      children: [
                        Icon(Icons.picture_as_pdf),
                        SizedBox(width: 8),
                        Text('Export PDF'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'print',
                    child: Row(
                      children: [
                        Icon(Icons.print),
                        SizedBox(width: 8),
                        Text('Print'),
                      ],
                    ),
                  ),
                ],
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Ringkasan'),
            Tab(text: 'Detail Order'),
            Tab(text: 'Analisis'),
            Tab(text: 'Performa'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildSummaryTab(),
          _buildDetailTab(),
          _buildAnalysisTab(),
          _buildPerformanceTab(),
        ],
      ),
    );
  }

  // Tab Ringkasan
  Widget _buildSummaryTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildDateRangeSelector(),
          const SizedBox(height: 16),
          _buildSummaryCards(),
          const SizedBox(height: 16),
          _buildPaymentMethodBreakdown(),
          const SizedBox(height: 16),
          _buildOrderTypeBreakdown(),
        ],
      ),
    );
  }

  Widget _buildDateRangeSelector() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(Icons.calendar_today, color: Colors.indigo[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              '${DateFormat('dd MMM yyyy').format(selectedDateRange.startDate)} - ${DateFormat('dd MMM yyyy').format(selectedDateRange.endDate)}',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
          ElevatedButton(
            onPressed: _showDatePicker,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.indigo[600],
              foregroundColor: Colors.white,
            ),
            child: const Text('Ubah Periode'),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCards() {
    // Simulasi data - seharusnya menggunakan provider dari service
    return Consumer(
      builder: (context, ref, child) {
        // final summaryAsync = ref.watch(dailySummaryProvider(selectedDate));

        // Untuk demo, kita gunakan data statis
        return Row(
          children: [
            Expanded(
              child: _buildSummaryCard(
                'Total Penjualan',
                'Rp 66.000',
                Icons.attach_money,
                Colors.green,
                'Hari Ini',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildSummaryCard(
                'Total Transaksi',
                '2',
                Icons.receipt_long,
                Colors.blue,
                'Hari Ini',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildSummaryCard(
                'Rata-rata Order',
                'Rp 33.000',
                Icons.trending_up,
                Colors.orange,
                'Per Transaksi',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildSummaryCard(
                'Total Pajak',
                'Rp 3.000',
                Icons.account_balance,
                Colors.purple,
                'PPN 10%',
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSummaryCard(
    String title,
    String value,
    IconData icon,
    Color color,
    String subtitle,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const Spacer(),
              Icon(Icons.trending_up, color: Colors.green[400], size: 20),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          Text(
            subtitle,
            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodBreakdown() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.payment, color: Colors.indigo[600]),
              const SizedBox(width: 8),
              const Text(
                'Breakdown Metode Pembayaran',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildPaymentMethodItem('Cash', 'Rp 33.000', '50%', Colors.green),
          const SizedBox(height: 12),
          _buildPaymentMethodItem('Debit', 'Rp 33.000', '50%', Colors.blue),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodItem(
    String method,
    String amount,
    String percentage,
    Color color,
  ) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(6),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            method,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          ),
        ),
        Text(
          amount,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(width: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            percentage,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOrderTypeBreakdown() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.restaurant, color: Colors.indigo[600]),
              const SizedBox(width: 8),
              const Text(
                'Breakdown Tipe Order',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildOrderTypeItem('Dine-In', '1 order', '50%', Colors.green),
          const SizedBox(height: 12),
          _buildOrderTypeItem('Take Away', '1 order', '50%', Colors.orange),
        ],
      ),
    );
  }

  Widget _buildOrderTypeItem(
    String type,
    String count,
    String percentage,
    Color color,
  ) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(6),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            type,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          ),
        ),
        Text(
          count,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(width: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            percentage,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ),
      ],
    );
  }

  // Tab Detail Order (menggunakan kode dari sebelumnya dengan sedikit modifikasi)
  Widget _buildDetailTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 1,
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(Colors.grey[100]),
            columns: const [
              DataColumn(
                label: Text(
                  'Order ID',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
              DataColumn(
                label: Text(
                  'Waktu',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
              DataColumn(
                label: Text(
                  'Kasir',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
              DataColumn(
                label: Text(
                  'Tipe',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
              DataColumn(
                label: Text(
                  'Meja',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
              DataColumn(
                label: Text(
                  'Pembayaran',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
              DataColumn(
                label: Text(
                  'Item',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
              DataColumn(
                label: Text(
                  'Status',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
              DataColumn(
                label: Text(
                  'Total',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
                numeric: true,
              ),
            ],
            rows: _buildSampleDataRows(),
          ),
        ),
      ),
    );
  }

  List<DataRow> _buildSampleDataRows() {
    // Sample data berdasarkan JSON yang diberikan
    final sampleData = [
      {
        'orderId': 'CASHIER-1755657769029',
        'user': 'jilo',
        'createdAt': DateTime.parse('2025-08-20T02:42:49.163Z'),
        'paymentMethod': 'Debit',
        'orderType': 'Take Away',
        'tableNumber': '',
        'grandTotal': 33000,
        'status': 'Completed',
        'items': ['1x Americano'],
      },
      {
        'orderId': 'ORD-20G6-001',
        'user': 'uji',
        'createdAt': DateTime.parse('2025-08-20T02:26:12.414Z'),
        'paymentMethod': 'Cash',
        'orderType': 'Dine-In',
        'tableNumber': 'G6',
        'grandTotal': 33000,
        'status': 'Completed',
        'items': ['1x Americano'],
      },
    ];

    return sampleData.map((item) {
      return DataRow(
        cells: [
          DataCell(
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                item['orderId'] as String,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
          DataCell(
            Text(
              DateFormat('dd/MM HH:mm').format(item['createdAt'] as DateTime),
              style: const TextStyle(fontSize: 11),
            ),
          ),
          DataCell(
            Text(
              item['user'] as String,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
            ),
          ),
          DataCell(
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color:
                    item['orderType'] == 'Dine-In'
                        ? Colors.green[50]
                        : Colors.orange[50],
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                item['orderType'] as String,
                style: TextStyle(
                  fontSize: 10,
                  color:
                      item['orderType'] == 'Dine-In'
                          ? Colors.green[700]
                          : Colors.orange[700],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
          DataCell(
            Text(
              (item['tableNumber'] as String).isEmpty
                  ? '-'
                  : item['tableNumber'] as String,
              style: const TextStyle(fontSize: 11),
            ),
          ),
          DataCell(
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color:
                    item['paymentMethod'] == 'Cash'
                        ? Colors.green[50]
                        : Colors.blue[50],
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                item['paymentMethod'] as String,
                style: TextStyle(
                  fontSize: 10,
                  color:
                      item['paymentMethod'] == 'Cash'
                          ? Colors.green[700]
                          : Colors.blue[700],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
          DataCell(
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children:
                  (item['items'] as List<String>).map((itemName) {
                    return Text(itemName, style: const TextStyle(fontSize: 10));
                  }).toList(),
            ),
          ),
          DataCell(
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                item['status'] as String,
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.green[700],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
          DataCell(
            Text(
              NumberFormat.currency(
                locale: 'id',
                symbol: 'Rp ',
                decimalDigits: 0,
              ).format(item['grandTotal'] as int),
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
          ),
        ],
      );
    }).toList();
  }

  // Tab Analisis
  Widget _buildAnalysisTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildHourlySalesChart(),
          const SizedBox(height: 16),
          _buildTopSellingItems(),
        ],
      ),
    );
  }

  Widget _buildHourlySalesChart() {
    return Container(
      height: 300,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.bar_chart, color: Colors.indigo[600]),
              const SizedBox(width: 8),
              const Text(
                'Penjualan Per Jam',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Expanded(
            child: Center(
              child: Text(
                'Chart akan ditampilkan di sini\n(Gunakan library seperti fl_chart)',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey[500], fontSize: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopSellingItems() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.trending_up, color: Colors.indigo[600]),
              const SizedBox(width: 8),
              const Text(
                'Item Terlaris',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildTopSellingItem('Americano', '2 terjual', 'Rp 60.000', 1),
          const SizedBox(height: 12),
          _buildTopSellingItem('Latte', '0 terjual', 'Rp 0', 2),
          const SizedBox(height: 12),
          _buildTopSellingItem('Cappuccino', '0 terjual', 'Rp 0', 3),
        ],
      ),
    );
  }

  Widget _buildTopSellingItem(
    String name,
    String quantity,
    String revenue,
    int rank,
  ) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: rank == 1 ? Colors.amber[100] : Colors.grey[100],
            borderRadius: BorderRadius.circular(16),
          ),
          child: Center(
            child: Text(
              '$rank',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: rank == 1 ? Colors.amber[700] : Colors.grey[600],
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                quantity,
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
        Text(
          revenue,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.green,
          ),
        ),
      ],
    );
  }

  // Tab Performa
  Widget _buildPerformanceTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildCashierPerformance(),
          const SizedBox(height: 16),
          _buildDailyTrend(),
        ],
      ),
    );
  }

  Widget _buildCashierPerformance() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.person, color: Colors.indigo[600]),
              const SizedBox(width: 8),
              const Text(
                'Performa Kasir',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildCashierPerformanceItem(
            'jilo',
            '1 transaksi',
            'Rp 33.000',
            'Rp 33.000',
          ),
          const SizedBox(height: 12),
          _buildCashierPerformanceItem(
            'uji',
            '1 transaksi',
            'Rp 33.000',
            'Rp 33.000',
          ),
        ],
      ),
    );
  }

  Widget _buildCashierPerformanceItem(
    String name,
    String transactions,
    String total,
    String average,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: Colors.indigo[100],
            child: Text(
              name[0].toUpperCase(),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.indigo[700],
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  transactions,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                total,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
              Text(
                'Avg: $average',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDailyTrend() {
    return Container(
      height: 300,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.timeline, color: Colors.indigo[600]),
              const SizedBox(width: 8),
              const Text(
                'Tren Penjualan Harian',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.show_chart, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    'Grafik Tren Penjualan',
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Gunakan library fl_chart untuk\nmenampilkan grafik interaktif',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[400], fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Dialog dan Handler Methods
  void _showDatePicker() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(
        start: selectedDateRange.startDate,
        end: selectedDateRange.endDate,
      ),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Colors.indigo[600]!,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        selectedDateRange = DateRange(
          startDate: picked.start,
          endDate: picked.end,
        );
      });

      // Update provider filter jika menggunakan riverpod
      // ref.read(salesReportFilterProvider.notifier).updateDateRange(picked.start, picked.end);
    }
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder:
          (context) => Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Container(
              width: MediaQuery.of(context).size.width * 0.8,
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.filter_list, color: Colors.indigo[600]),
                      const SizedBox(width: 8),
                      const Text(
                        'Filter Laporan',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Filter Kasir
                  const Text(
                    'Kasir',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Semua Kasir')),
                      DropdownMenuItem(value: 'jilo', child: Text('jilo')),
                      DropdownMenuItem(value: 'uji', child: Text('uji')),
                    ],
                    onChanged: (value) {},
                  ),

                  const SizedBox(height: 16),

                  // Filter Metode Pembayaran
                  const Text(
                    'Metode Pembayaran',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: null,
                        child: Text('Semua Metode'),
                      ),
                      DropdownMenuItem(value: 'Cash', child: Text('Cash')),
                      DropdownMenuItem(value: 'Debit', child: Text('Debit')),
                      DropdownMenuItem(value: 'Credit', child: Text('Credit')),
                      DropdownMenuItem(value: 'QRIS', child: Text('QRIS')),
                    ],
                    onChanged: (value) {},
                  ),

                  const SizedBox(height: 16),

                  // Filter Tipe Order
                  const Text(
                    'Tipe Order',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Semua Tipe')),
                      DropdownMenuItem(
                        value: 'Dine-In',
                        child: Text('Dine-In'),
                      ),
                      DropdownMenuItem(
                        value: 'Take Away',
                        child: Text('Take Away'),
                      ),
                      DropdownMenuItem(
                        value: 'Delivery',
                        child: Text('Delivery'),
                      ),
                    ],
                    onChanged: (value) {},
                  ),

                  const SizedBox(height: 24),

                  // Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            // Reset filters
                            Navigator.pop(context);
                          },
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            side: BorderSide(color: Colors.grey[300]!),
                          ),
                          child: const Text('Reset Filter'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            // Apply filters
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Filter berhasil diterapkan'),
                                backgroundColor: Colors.green,
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.indigo[600],
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: const Text('Terapkan Filter'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
    );
  }

  void _handleMenuSelection(String value) {
    switch (value) {
      case 'export_csv':
        _exportToCSV();
        break;
      case 'export_pdf':
        _exportToPDF();
        break;
      case 'print':
        _printReport();
        break;
    }
  }

  void _exportToCSV() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.download, color: Colors.white),
            SizedBox(width: 8),
            Text('Mengexport laporan ke CSV...'),
          ],
        ),
        backgroundColor: Colors.indigo[600],
        behavior: SnackBarBehavior.floating,
      ),
    );

    // Implementasi export CSV menggunakan SalesReportExporter.generateCSV()
    // final orders = ref.read(salesReportDataProvider(filter));
    // final csvData = SalesReportExporter.generateCSV(orders);
    // Save to file...
  }

  void _exportToPDF() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.picture_as_pdf, color: Colors.white),
            SizedBox(width: 8),
            Text('Mengexport laporan ke PDF...'),
          ],
        ),
        backgroundColor: Colors.red[600],
        behavior: SnackBarBehavior.floating,
      ),
    );

    // Implementasi export PDF menggunakan package pdf
  }

  void _printReport() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.print, color: Colors.white),
            SizedBox(width: 8),
            Text('Menyiapkan dokumen untuk print...'),
          ],
        ),
        backgroundColor: Colors.green[600],
        behavior: SnackBarBehavior.floating,
      ),
    );

    // Implementasi print menggunakan package printing
  }
}

// Helper class untuk DateRange jika belum ada
class DateRange {
  final DateTime startDate;
  final DateTime endDate;

  DateRange({required this.startDate, required this.endDate});
}
