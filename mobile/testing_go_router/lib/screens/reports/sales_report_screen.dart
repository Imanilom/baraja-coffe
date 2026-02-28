import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/services/hive_service.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';
import 'package:intl/intl.dart';
import 'package:kasirbaraja/models/report/order_detail_report.model.dart';
import 'package:kasirbaraja/models/report/performance_report.model.dart';
import 'package:kasirbaraja/providers/sales_report_provider.dart';
import 'package:fl_chart/fl_chart.dart';

import 'package:kasirbaraja/services/printer_service.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/screens/orders/order_histories/widgets/order_list_widget.dart';
import 'package:kasirbaraja/screens/orders/order_histories/widgets/order_detail_widget.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';

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
  OrderDetailModel? _selectedOrder;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
                  // const PopupMenuItem(
                  //   value: 'export_csv',
                  //   child: Row(
                  //     children: [
                  //       Icon(Icons.download),
                  //       SizedBox(width: 8),
                  //       Text('Export CSV'),
                  //     ],
                  //   ),
                  // ),
                  // const PopupMenuItem(
                  //   value: 'export_pdf',
                  //   child: Row(
                  //     children: [
                  //       Icon(Icons.picture_as_pdf),
                  //       SizedBox(width: 8),
                  //       Text('Export PDF'),
                  //     ],
                  //   ),
                  // ),
                  // const PopupMenuItem(
                  //   value: 'print',
                  //   child: Row(
                  //     children: [
                  //       Icon(Icons.print),
                  //       SizedBox(width: 8),
                  //       Text('Print'),
                  //     ],
                  //   ),
                  // ),
                  const PopupMenuItem(
                    value: 'print_cash_recap',
                    child: Row(
                      children: [
                        Icon(Icons.receipt_long),
                        SizedBox(width: 8),
                        Text('Print Rekap Kasir'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'reprint_cash_recap',
                    child: Row(
                      children: [
                        Icon(Icons.print_outlined),
                        SizedBox(width: 8),
                        Text('Reprint Rekap Terakhir'),
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
            // Tab(text: 'Ringkasan'),
            Tab(text: 'Detail Order'),
            // Tab(text: 'Analisis'),
            Tab(text: 'Performa'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // _buildSummaryTab(),
          _buildDetailTab(),
          // _buildAnalysisTab(),
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
    return Consumer(
      builder: (context, ref, child) {
        final filter = ref.watch(salesFilterProvider);

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withValues(alpha: 0.1),
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
                  filter.startDate != null && filter.endDate != null
                      ? '${DateFormat('dd MMM yyyy').format(filter.startDate!)} - ${DateFormat('dd MMM yyyy').format(filter.endDate!)}'
                      : 'Pilih periode',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
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
      },
    );
  }

  Widget _buildSummaryCards() {
    return Consumer(
      builder: (context, ref, child) {
        final salesAnalyticsAsync = ref.watch(salesSummaryProvider);

        return salesAnalyticsAsync.when(
          data: (response) {
            final summary = response.data.summary;
            return Row(
              children: [
                Expanded(
                  child: _buildSummaryCard(
                    'Total Penjualan',
                    NumberFormat.currency(
                      locale: 'id',
                      symbol: 'Rp ',
                      decimalDigits: 0,
                    ).format(summary.totalSales),
                    Icons.attach_money,
                    Colors.green,
                    'Total Revenue',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSummaryCard(
                    'Total Transaksi',
                    '${summary.totalTransactions}',
                    Icons.receipt_long,
                    Colors.blue,
                    'Transactions',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSummaryCard(
                    'Rata-rata Order',
                    NumberFormat.currency(
                      locale: 'id',
                      symbol: 'Rp ',
                      decimalDigits: 0,
                    ).format(summary.avgOrderValue),
                    Icons.trending_up,
                    Colors.orange,
                    'Per Transaksi',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSummaryCard(
                    'Total Items',
                    '${summary.totalItems}',
                    Icons.inventory,
                    Colors.purple,
                    'Items Terjual',
                  ),
                ),
              ],
            );
          },
          loading:
              () => Row(
                children: List.generate(
                  4,
                  (index) => Expanded(
                    child: Container(
                      margin: EdgeInsets.only(right: index < 3 ? 12 : 0),
                      height: 140,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                  ),
                ),
              ),
          error:
              (error, stackTrace) => Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red[200]!),
                ),
                child: Column(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red[600], size: 32),
                    const SizedBox(height: 8),
                    Text(
                      'Error: $error',
                      style: TextStyle(color: Colors.red[700]),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => ref.refresh(salesSummaryProvider),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red[600],
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
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
            color: Colors.grey.withValues(alpha: 0.1),
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
                  color: color.withValues(alpha: 0.1),
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
    return Consumer(
      builder: (context, ref, child) {
        final salesAnalyticsAsync = ref.watch(salesSummaryProvider);

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withValues(alpha: 0.1),
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
              salesAnalyticsAsync.when(
                data: (response) {
                  final paymentMethods = response.data.paymentMethodBreakdown;
                  if (paymentMethods.isEmpty) {
                    return const Center(
                      child: Text('Tidak ada data metode pembayaran'),
                    );
                  }

                  return Column(
                    children:
                        paymentMethods.asMap().entries.map((entry) {
                          final index = entry.key;
                          final payment = entry.value;
                          final colors = [
                            Colors.green,
                            Colors.blue,
                            Colors.orange,
                            Colors.purple,
                          ];
                          final color = colors[index % colors.length];

                          return Column(
                            children: [
                              _buildPaymentMethodItem(
                                payment.method,
                                NumberFormat.currency(
                                  locale: 'id',
                                  symbol: 'Rp ',
                                  decimalDigits: 0,
                                ).format(payment.amount),
                                '${payment.percentage}%',
                                color,
                              ),
                              if (index < paymentMethods.length - 1)
                                const SizedBox(height: 12),
                            ],
                          );
                        }).toList(),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error:
                    (error, _) => Center(
                      child: Text(
                        'Error loading payment data: $error',
                        style: TextStyle(color: Colors.red[600]),
                      ),
                    ),
              ),
            ],
          ),
        );
      },
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
            color: color.withValues(alpha: 0.1),
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
    return Consumer(
      builder: (context, ref, child) {
        final salesAnalyticsAsync = ref.watch(salesSummaryProvider);

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withValues(alpha: 0.1),
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
              salesAnalyticsAsync.when(
                data: (response) {
                  final orderTypes = response.data.orderTypeBreakdown;
                  if (orderTypes.isEmpty) {
                    return const Center(
                      child: Text('Tidak ada data tipe order'),
                    );
                  }

                  return Column(
                    children:
                        orderTypes.asMap().entries.map((entry) {
                          final index = entry.key;
                          final order = entry.value;
                          final colors = [
                            Colors.green,
                            Colors.orange,
                            Colors.blue,
                            Colors.purple,
                          ];
                          final color = colors[index % colors.length];

                          return Column(
                            children: [
                              _buildOrderTypeItem(
                                order.type,
                                '${order.count} order${order.count > 1 ? 's' : ''}',
                                '${order.percentage}%',
                                color,
                              ),
                              if (index < orderTypes.length - 1)
                                const SizedBox(height: 12),
                            ],
                          );
                        }).toList(),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error:
                    (error, _) => Center(
                      child: Text(
                        'Error loading order type data: $error',
                        style: TextStyle(color: Colors.red[600]),
                      ),
                    ),
              ),
            ],
          ),
        );
      },
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
            color: color.withValues(alpha: 0.1),
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
    return Consumer(
      builder: (context, ref, child) {
        final orderDetailAsync = ref.watch(orderDetailReportProvider);

        return orderDetailAsync.when(
          data: (orderState) => _buildOrderDetailContent(ref, orderState),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stackTrace) => _buildErrorState(ref, error.toString()),
        );
      },
    );
  }

  Widget _buildOrderDetailContent(WidgetRef ref, OrderDetailState orderState) {
    return Column(
      children: [
        // Header dengan info pagination
        _buildDetailHeader(orderState.pagination),

        // Split View: List & Detail
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Left: Order List
              Expanded(
                flex: 4,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(right: BorderSide(color: Colors.grey[300]!)),
                  ),
                  child: OrderListWidget(
                    orders: orderState.orders,
                    selectedOrder: _selectedOrder,
                    onSelect: (order) {
                      setState(() {
                        _selectedOrder = order;
                      });
                    },
                    onRefresh: () => ref.invalidate(orderDetailReportProvider),
                  ),
                ),
              ),

              // Right: Order Detail
              Expanded(
                flex: 6,
                child: Container(
                  color: Colors.white,
                  child: OrderDetailWidget(
                    order: _selectedOrder,
                    onClose: () {
                      setState(() {
                        _selectedOrder = null;
                      });
                    },
                  ),
                ),
              ),
            ],
          ),
        ),

        // Loading more indicator
        if (orderState.isLoadingMore)
          const Padding(
            padding: EdgeInsets.all(16),
            child: CircularProgressIndicator(),
          ),
      ],
    );
  }

  Widget _buildDetailHeader(Pagination pagination) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.indigo[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.indigo[200]!),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Total Orders: ${pagination.totalOrders}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'Page ${pagination.currentPage} of ${pagination.totalPages}',
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
            ],
          ),
          Row(
            children: [
              Icon(Icons.receipt_long, color: Colors.indigo[600]),
              const SizedBox(width: 8),
              Text(
                'Detail Orders',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.indigo[600],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Tab Analisis
  Widget _buildAnalysisTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildHourlySalesChart(),
          const SizedBox(height: 16),
          _buildDailyTrendChart(),
          const SizedBox(height: 16),
          _buildTopSellingItems(),
        ],
      ),
    );
  }

  Widget _buildHourlySalesChart() {
    return Consumer(
      builder: (context, ref, child) {
        final analyticsAsync = ref.watch(salesAnalyticsProvider);

        return Container(
          height: 400,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withValues(alpha: 0.1),
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
                child: analyticsAsync.when(
                  data: (response) {
                    final hourlySales = response.data.hourlySales;
                    if (hourlySales.isEmpty) {
                      return const Center(
                        child: Text('Tidak ada data penjualan per jam'),
                      );
                    }

                    return BarChart(
                      BarChartData(
                        alignment: BarChartAlignment.spaceAround,
                        maxY:
                            hourlySales
                                .map((e) => e.totalSales)
                                .reduce((a, b) => a > b ? a : b) *
                            1.2,
                        barTouchData: BarTouchData(
                          touchTooltipData: BarTouchTooltipData(
                            getTooltipItem: (group, groupIndex, rod, rodIndex) {
                              final hour = group.x.toInt();
                              final sales = rod.toY;
                              final orders =
                                  hourlySales
                                      .firstWhere((h) => h.hour == hour)
                                      .totalOrders;

                              return BarTooltipItem(
                                'Jam ${hour.toString().padLeft(2, '0')}:00\n'
                                'Penjualan: ${NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0).format(sales)}\n'
                                'Orders: $orders',
                                const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              );
                            },
                          ),
                        ),
                        titlesData: FlTitlesData(
                          show: true,
                          rightTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          topTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (double value, TitleMeta meta) {
                                final hour = value.toInt();
                                if (hour % 4 == 0) {
                                  // Show every 4 hours
                                  return SideTitleWidget(
                                    meta: meta,
                                    child: Text(
                                      '${hour.toString().padLeft(2, '0')}:00',
                                      style: const TextStyle(fontSize: 10),
                                    ),
                                  );
                                }
                                return const Text('');
                              },
                              reservedSize: 30,
                            ),
                          ),
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (double value, TitleMeta meta) {
                                return SideTitleWidget(
                                  meta: meta,
                                  child: Text(
                                    NumberFormat.compact().format(value),
                                    style: const TextStyle(fontSize: 10),
                                  ),
                                );
                              },
                              reservedSize: 50,
                            ),
                          ),
                        ),
                        borderData: FlBorderData(show: false),
                        barGroups:
                            hourlySales.map((hourData) {
                              return BarChartGroupData(
                                x: hourData.hour,
                                barRods: [
                                  BarChartRodData(
                                    toY: hourData.totalSales,
                                    color:
                                        hourData.totalSales > 0
                                            ? Colors.indigo[600]!
                                            : Colors.grey[300]!,
                                    width: 16,
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(4),
                                      topRight: Radius.circular(4),
                                    ),
                                  ),
                                ],
                              );
                            }).toList(),
                        gridData: const FlGridData(show: false),
                      ),
                    );
                  },
                  loading:
                      () => const Center(child: CircularProgressIndicator()),
                  error:
                      (error, _) => Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.error_outline,
                              size: 48,
                              color: Colors.red[400],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Error loading hourly sales data',
                              style: TextStyle(color: Colors.red[600]),
                            ),
                          ],
                        ),
                      ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDailyTrendChart() {
    return Consumer(
      builder: (context, ref, child) {
        final analyticsAsync = ref.watch(salesAnalyticsProvider);

        return Container(
          height: 350,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withValues(alpha: 0.1),
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
                child: analyticsAsync.when(
                  data: (response) {
                    final dailyTrend = response.data.dailyTrend;
                    if (dailyTrend.isEmpty) {
                      return const Center(
                        child: Text('Tidak ada data tren harian'),
                      );
                    }

                    return LineChart(
                      LineChartData(
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: true,
                          drawHorizontalLine: true,
                          horizontalInterval:
                              200000, // Adjust based on your data
                          getDrawingHorizontalLine: (value) {
                            return const FlLine(
                              color: Colors.grey,
                              strokeWidth: 0.5,
                            );
                          },
                          getDrawingVerticalLine: (value) {
                            return const FlLine(
                              color: Colors.grey,
                              strokeWidth: 0.5,
                            );
                          },
                        ),
                        titlesData: FlTitlesData(
                          show: true,
                          rightTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          topTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 30,
                              interval: 1,
                              getTitlesWidget: (double value, TitleMeta meta) {
                                final index = value.toInt();
                                if (index >= 0 && index < dailyTrend.length) {
                                  final date = DateTime.parse(
                                    dailyTrend[index].date,
                                  );
                                  return SideTitleWidget(
                                    meta: meta,
                                    child: Text(
                                      DateFormat('dd/MM').format(date),
                                      style: const TextStyle(fontSize: 10),
                                    ),
                                  );
                                }
                                return const Text('');
                              },
                            ),
                          ),
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 50,
                              getTitlesWidget: (double value, TitleMeta meta) {
                                return SideTitleWidget(
                                  meta: meta,
                                  child: Text(
                                    NumberFormat.compact().format(value),
                                    style: const TextStyle(fontSize: 10),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                        borderData: FlBorderData(
                          show: true,
                          border: Border.all(
                            color: Colors.grey[300]!,
                            width: 1,
                          ),
                        ),
                        minX: 0,
                        maxX: (dailyTrend.length - 1).toDouble(),
                        minY: 0,
                        maxY:
                            dailyTrend
                                .map((e) => e.totalSales)
                                .reduce((a, b) => a > b ? a : b) *
                            1.1,
                        lineBarsData: [
                          LineChartBarData(
                            spots:
                                dailyTrend.asMap().entries.map((entry) {
                                  return FlSpot(
                                    entry.key.toDouble(),
                                    entry.value.totalSales,
                                  );
                                }).toList(),
                            isCurved: true,
                            color: Colors.indigo[600]!,
                            barWidth: 3,
                            isStrokeCapRound: true,
                            dotData: FlDotData(
                              show: true,
                              getDotPainter: (spot, percent, barData, index) {
                                return FlDotCirclePainter(
                                  radius: 4,
                                  color: Colors.white,
                                  strokeWidth: 2,
                                  strokeColor: Colors.indigo[600]!,
                                );
                              },
                            ),
                            belowBarData: BarAreaData(
                              show: true,
                              color: Colors.indigo[600]!.withValues(alpha: 0.1),
                            ),
                          ),
                        ],
                        lineTouchData: LineTouchData(
                          touchTooltipData: LineTouchTooltipData(
                            // tooltipBgColor: Colors.grey[800],
                            getTooltipItems: (
                              List<LineBarSpot> touchedBarSpots,
                            ) {
                              return touchedBarSpots.map((barSpot) {
                                final index = barSpot.x.toInt();
                                if (index >= 0 && index < dailyTrend.length) {
                                  final dayData = dailyTrend[index];
                                  final date = DateTime.parse(dayData.date);

                                  return LineTooltipItem(
                                    '${DateFormat('dd MMM yyyy').format(date)}\n'
                                    'Penjualan: ${NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0).format(dayData.totalSales)}\n'
                                    'Orders: ${dayData.totalOrders}\n'
                                    'Avg: ${NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0).format(dayData.avgOrderValue)}',
                                    const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                    ),
                                  );
                                }
                                return null;
                              }).toList();
                            },
                          ),
                        ),
                      ),
                    );
                  },
                  loading:
                      () => const Center(child: CircularProgressIndicator()),
                  error:
                      (error, _) => Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.error_outline,
                              size: 48,
                              color: Colors.red[400],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Error loading daily trend data',
                              style: TextStyle(color: Colors.red[600]),
                            ),
                          ],
                        ),
                      ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTopSellingItems() {
    return Consumer(
      builder: (context, ref, child) {
        final analyticsAsync = ref.watch(salesAnalyticsProvider);

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withValues(alpha: 0.1),
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
              analyticsAsync.when(
                data: (response) {
                  final topItems = response.data.topSellingItems;
                  if (topItems.isEmpty) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32.0),
                        child: Text('Tidak ada data item terlaris'),
                      ),
                    );
                  }

                  return Column(
                    children:
                        topItems.map((item) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: _buildTopSellingItem(
                              item.menuItem.name,
                              '${item.totalQuantity} terjual (${item.orderCount} orders)',
                              NumberFormat.currency(
                                locale: 'id',
                                symbol: 'Rp ',
                                decimalDigits: 0,
                              ).format(item.totalRevenue),
                              item.rank,
                              item.menuItem.category,
                            ),
                          );
                        }).toList(),
                  );
                },
                loading:
                    () => const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32.0),
                        child: CircularProgressIndicator(),
                      ),
                    ),
                error:
                    (error, _) => Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          children: [
                            Icon(
                              Icons.error_outline,
                              size: 48,
                              color: Colors.red[400],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Error loading top selling items',
                              style: TextStyle(color: Colors.red[600]),
                            ),
                          ],
                        ),
                      ),
                    ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTopSellingItem(
    String name,
    String quantity,
    String revenue,
    int rank,
    String category,
  ) {
    Color getRankColor(int rank) {
      switch (rank) {
        case 1:
          return Colors.amber;
        case 2:
          return Colors.grey[400]!;
        case 3:
          return Colors.orange[300]!;
        default:
          return Colors.grey[300]!;
      }
    }

    Color getCategoryColor(String category) {
      switch (category.toLowerCase()) {
        case 'makanan':
          return Colors.green;
        case 'minuman':
          return Colors.blue;
        default:
          return Colors.grey;
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: getRankColor(rank).withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Center(
              child: Text(
                '$rank',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: getRankColor(rank),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: getCategoryColor(
                          category,
                        ).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        category,
                        style: TextStyle(
                          fontSize: 10,
                          color: getCategoryColor(category),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  quantity,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            revenue,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.green,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Consumer(
            builder: (context, ref, child) {
              final performanceAsync = ref.watch(performanceReportProvider);

              return performanceAsync.when(
                data: (performanceResponse) {
                  return _buildDailyTrendFromAPI(
                    performanceResponse.data.dailyPerformanceTrend,
                  );
                },
                loading:
                    () => Container(
                      height: 350,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                error:
                    (error, stackTrace) => Container(
                      height: 350,
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red[200]!),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.error_outline,
                            size: 48,
                            color: Colors.red[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Error memuat data performa',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.red[600],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            error.toString(),
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.red[500],
                            ),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed:
                                () => ref.refresh(performanceReportProvider),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red[600],
                              foregroundColor: Colors.white,
                            ),
                            child: const Text('Coba Lagi'),
                          ),
                        ],
                      ),
                    ),
              );
            },
          ),
          const SizedBox(height: 16),
          _buildTopSellingItems(),
        ],
      ),
    );
  }

  Widget _buildDailyTrendFromAPI(List<DailyTrend> dailyTrends) {
    return Container(
      height: 350,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
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
            child:
                dailyTrends.isEmpty
                    ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.show_chart,
                            size: 64,
                            color: Colors.grey[300],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Tidak ada data tren penjualan',
                            style: TextStyle(
                              color: Colors.grey[500],
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                    : LineChart(
                      LineChartData(
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: false,
                          horizontalInterval: _calculateYInterval(dailyTrends),
                          getDrawingHorizontalLine: (value) {
                            return FlLine(
                              color: Colors.grey[300]!,
                              strokeWidth: 1,
                            );
                          },
                        ),
                        titlesData: FlTitlesData(
                          show: true,
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 40,
                              interval: _calculateXInterval(dailyTrends.length),
                              getTitlesWidget: (double value, TitleMeta meta) {
                                final index = value.toInt();
                                if (index >= 0 && index < dailyTrends.length) {
                                  final date = DateTime.parse(
                                    dailyTrends[index].date,
                                  );
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 8),
                                    child: Text(
                                      '${date.day}/${date.month}',
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                        fontSize: 10,
                                      ),
                                    ),
                                  );
                                }
                                return const SizedBox.shrink();
                              },
                            ),
                          ),
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 60,
                              interval: _calculateYInterval(dailyTrends),
                              getTitlesWidget: (double value, TitleMeta meta) {
                                return Text(
                                  _formatChartCurrency(value),
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 10,
                                  ),
                                );
                              },
                            ),
                          ),
                          rightTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          topTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                        ),
                        borderData: FlBorderData(
                          show: true,
                          border: Border(
                            bottom: BorderSide(color: Colors.grey[300]!),
                            left: BorderSide(color: Colors.grey[300]!),
                          ),
                        ),
                        minX: 0,
                        maxX: (dailyTrends.length - 1).toDouble(),
                        minY: 0,
                        maxY: _getMaxSales(dailyTrends) * 1.1,
                        lineBarsData: [
                          LineChartBarData(
                            spots:
                                dailyTrends.asMap().entries.map((entry) {
                                  return FlSpot(
                                    entry.key.toDouble(),
                                    entry.value.totalSales,
                                  );
                                }).toList(),
                            isCurved: true,
                            gradient: LinearGradient(
                              colors: [
                                Colors.indigo[400]!,
                                Colors.indigo[600]!,
                              ],
                            ),
                            barWidth: 3,
                            isStrokeCapRound: true,
                            dotData: FlDotData(
                              show: true,
                              getDotPainter: (spot, percent, barData, index) {
                                return FlDotCirclePainter(
                                  radius: 4,
                                  color: Colors.white,
                                  strokeWidth: 2,
                                  strokeColor: Colors.indigo[600]!,
                                );
                              },
                            ),
                            belowBarData: BarAreaData(
                              show: true,
                              gradient: LinearGradient(
                                colors: [
                                  Colors.indigo[100]!.withValues(alpha: 0.3),
                                  Colors.indigo[50]!.withValues(alpha: 0.1),
                                ],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                            ),
                          ),
                        ],
                        lineTouchData: LineTouchData(
                          enabled: true,
                          touchTooltipData: LineTouchTooltipData(
                            getTooltipItems: (List<LineBarSpot> touchedSpots) {
                              return touchedSpots.map((
                                LineBarSpot touchedSpot,
                              ) {
                                final index = touchedSpot.x.toInt();
                                if (index >= 0 && index < dailyTrends.length) {
                                  final trend = dailyTrends[index];
                                  final date = DateTime.parse(trend.date);
                                  return LineTooltipItem(
                                    '${DateFormat('dd MMM yyyy').format(date)}\n'
                                    'Penjualan: ${formatCurrency(trend.totalSales)}\n'
                                    'Orders: ${trend.totalOrders}\n'
                                    'Kasir: ${trend.totalCashiers}',
                                    const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                    ),
                                  );
                                }
                                return null;
                              }).toList();
                            },
                          ),
                        ),
                      ),
                    ),
          ),
        ],
      ),
    );
  }

  // 5. Helper methods untuk chart calculations
  double _calculateYInterval(List<DailyTrend> trends) {
    if (trends.isEmpty) return 100000;
    final maxSales = trends
        .map((e) => e.totalSales)
        .reduce((a, b) => a > b ? a : b);
    if (maxSales <= 100000) return 25000;
    if (maxSales <= 500000) return 100000;
    if (maxSales <= 1000000) return 200000;
    return 500000;
  }

  double _calculateXInterval(int trendsLength) {
    if (trendsLength <= 7) return 1;
    if (trendsLength <= 14) return 2;
    return (trendsLength / 5).ceilToDouble();
  }

  double _getMaxSales(List<DailyTrend> trends) {
    if (trends.isEmpty) return 1000000;
    return trends.map((e) => e.totalSales).reduce((a, b) => a > b ? a : b);
  }

  String _formatChartCurrency(double value) {
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)}M';
    } else if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(0)}K';
    } else {
      return value.toStringAsFixed(0);
    }
  }

  String formatCurrency(double amount) {
    return NumberFormat.currency(
      locale: 'id',
      symbol: 'Rp ',
      decimalDigits: 0,
    ).format(amount);
  }

  // Dialog dan Handler Methods
  void _showDatePicker() async {
    final currentFilter = ref.read(salesFilterProvider);

    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(
        start:
            currentFilter.startDate ??
            DateTime.now().subtract(const Duration(days: 7)),
        end: currentFilter.endDate ?? DateTime.now(),
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
      ref
          .read(salesFilterProvider.notifier)
          .updateDateRange(picked.start, picked.end);
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
      case 'print_cash_recap':
        _printCashRecap();
        break;
      case 'reprint_cash_recap':
        _reprintCashRecap();
        break;
    }
  }

  Future<void> _printCashRecap() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final user = await HiveService.getUser();
      final device = await HiveService.getDevice();
      final cashier = await HiveService.getCashier();

      final outletId = user?.outletId ?? '';
      final outletName =
          'Baraja Coffee'; // Default since OutletModel is not available

      if (device == null) throw Exception('Device not found');

      final service = ref.read(salesReportServiceProvider);

      final recap = await service.fetchCashRecap(
        outletId: outletId,
        deviceId: device.id,
      );

      // Get saved printers from provider
      final savedPrinters = ref.read(savedPrintersProvider);
      final connectionStatuses = ref.read(printerConnectionProvider);

      if (savedPrinters.isEmpty) {
        throw Exception('Tidak ada printer yang tersimpan');
      }

      // Close loading dialog
      if (mounted) Navigator.pop(context);

      // Show printer selection dialog
      final BluetoothPrinterModel? selectedPrinter =
          await showDialog<BluetoothPrinterModel>(
            context: context,
            builder:
                (context) => SimpleDialog(
                  title: const Text('Pilih Printer'),
                  children:
                      savedPrinters.map((printer) {
                        final isConnected =
                            connectionStatuses[printer.address]?.state ==
                            PrinterConnectionState.connected;
                        return SimpleDialogOption(
                          onPressed: () => Navigator.pop(context, printer),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8.0),
                            child: Row(
                              children: [
                                const Icon(Icons.print),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        printer.name,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                      Text(
                                        printer.address,
                                        style: TextStyle(
                                          color: Colors.grey[600],
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isConnected)
                                  const Icon(
                                    Icons.check_circle,
                                    color: Colors.green,
                                  ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                ),
          );

      if (selectedPrinter == null) {
        return; // User cancelled
      }

      // Show loading again for printing process
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder:
              (context) => const Center(child: CircularProgressIndicator()),
        );
      }

      final connectedPrinter = selectedPrinter;

      final success = await ThermalPrinters.printCashRecap(
        recap: recap,
        printer: connectedPrinter,
        cashierName: cashier?.username ?? 'Unknown Cashier',
        deviceName: device.deviceName,
        outletName: outletName,
      );

      if (mounted) Navigator.pop(context);

      if (mounted) {
        if (success) {
          // Physical confirmation before locking the data
          final bool? confirmSave = await showDialog<bool>(
            context: context,
            builder:
                (context) => AlertDialog(
                  title: const Text('Print Berhasil?'),
                  content: const Text(
                    'Apakah rekap kasir berhasil dicetak dengan benar? Jika "Ya", data akan disimpan dan periode rekap akan dimajukan.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Tidak (Ulang)'),
                    ),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Ya, Simpan'),
                    ),
                  ],
                ),
          );

          if (confirmSave == true) {
            if (mounted) {
              showDialog(
                context: context,
                barrierDismissible: false,
                builder:
                    (context) =>
                        const Center(child: CircularProgressIndicator()),
              );
            }

            await service.confirmSaveCashRecap(
              recap: recap,
              outletId: outletId,
              deviceId: device.id,
            );

            if (mounted) Navigator.pop(context); // Close Saving loading

            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Berhasil merekap kasir'),
                  backgroundColor: Colors.green,
                ),
              );
            }
          } else {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Data belum disimpan. Silakan klik Print kembali jika ingin mengulang.',
                  ),
                  backgroundColor: Colors.orange,
                ),
              );
            }
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Gagal mencetak rekap kasir'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) Navigator.pop(context); // Hide loading
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _reprintCashRecap() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final user = await HiveService.getUser();
      final device = await HiveService.getDevice();
      final cashier = await HiveService.getCashier();

      final outletId = user?.outletId ?? '';
      final outletName = 'Baraja Coffee';

      if (device == null) throw Exception('Device not found');

      final service = ref.read(salesReportServiceProvider);

      final recap = await service.reprintCashRecap(
        outletId: outletId,
        deviceId: device.id,
      );

      // Get saved printers from provider
      final savedPrinters = ref.read(savedPrintersProvider);
      final connectionStatuses = ref.read(printerConnectionProvider);

      if (savedPrinters.isEmpty) {
        throw Exception('Tidak ada printer yang tersimpan');
      }

      // Close loading dialog
      if (mounted) Navigator.pop(context);

      // Show printer selection dialog
      final BluetoothPrinterModel? selectedPrinter =
          await showDialog<BluetoothPrinterModel>(
            context: context,
            builder:
                (context) => SimpleDialog(
                  title: const Text('Pilih Printer (Reprint)'),
                  children:
                      savedPrinters.map((printer) {
                        final isConnected =
                            connectionStatuses[printer.address]?.state ==
                            PrinterConnectionState.connected;
                        return SimpleDialogOption(
                          onPressed: () => Navigator.pop(context, printer),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8.0),
                            child: Row(
                              children: [
                                const Icon(Icons.print),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        printer.name,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                      Text(
                                        printer.address,
                                        style: TextStyle(
                                          color: Colors.grey[600],
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isConnected)
                                  const Icon(
                                    Icons.check_circle,
                                    color: Colors.green,
                                  ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                ),
          );

      if (selectedPrinter == null) {
        return; // User cancelled
      }

      // Show loading again for printing process
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder:
              (context) => const Center(child: CircularProgressIndicator()),
        );
      }

      final connectedPrinter = selectedPrinter;

      final success = await ThermalPrinters.printCashRecap(
        recap: recap,
        printer: connectedPrinter,
        cashierName: cashier?.username ?? 'Unknown Cashier',
        deviceName: device.deviceName,
        outletName: outletName,
      );

      if (mounted) Navigator.pop(context);

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Berhasil mereprint rekap kasir'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Gagal mereprint rekap kasir'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) Navigator.pop(context); // Hide loading
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
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

  // Helper methods untuk styling

  Widget _buildErrorState(WidgetRef ref, String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
          const SizedBox(height: 16),
          Text(
            'Terjadi Kesalahan',
            style: TextStyle(
              fontSize: 18,
              color: Colors.red[600],
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Colors.red[500]),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => ref.refresh(orderDetailReportProvider),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red[600],
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: const Text('Coba Lagi'),
          ),
        ],
      ),
    );
  }
}

// Helper class untuk DateRange jika belum ada
class DateRange {
  final DateTime startDate;
  final DateTime endDate;

  DateRange({required this.startDate, required this.endDate});
}
