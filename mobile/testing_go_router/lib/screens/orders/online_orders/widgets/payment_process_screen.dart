import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/payments/payment.model.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';
import 'package:kasirbaraja/models/payments/payment_method.model.dart';
import 'package:kasirbaraja/models/payments/payment_type.model.dart';
import 'package:kasirbaraja/providers/payment_provider.dart';
import 'package:go_router/go_router.dart';

class PaymentProcessScreen extends ConsumerStatefulWidget {
  final PaymentModel payment;

  const PaymentProcessScreen({super.key, required this.payment});

  @override
  ConsumerState<PaymentProcessScreen> createState() =>
      _PaymentProcessScreenState();
}

class _PaymentProcessScreenState extends ConsumerState<PaymentProcessScreen> {
  final PageController _pageController = PageController();
  final TextEditingController _notesController = TextEditingController();
  int _currentStep = 0;

  @override
  void initState() {
    super.initState();
    // Initialize amount with payment amount
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(paymentProcessProvider.notifier)
          .setAmount(widget.payment.amount);
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _notesController.dispose();
    // Reset provider state when leaving
    // ref.read(paymentProcessProvider.notifier).reset();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final paymentTypesAsync = ref.watch(paymentTypesProvider);
    final processState = ref.watch(paymentProcessProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: _buildAppBar(),
      body: paymentTypesAsync.when(
        data:
            (paymentTypes) => Column(
              children: [
                _buildProgressIndicator(),
                Expanded(
                  child: PageView(
                    controller: _pageController,
                    physics: const NeverScrollableScrollPhysics(),
                    onPageChanged: (index) {
                      setState(() {
                        _currentStep = index;
                      });
                    },
                    children: [
                      _buildPaymentTypeSelection(paymentTypes),
                      _buildPaymentMethodSelection(),
                      _buildPaymentConfirmation(),
                    ],
                  ),
                ),
                _buildBottomNavigation(),
              ],
            ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => _buildErrorState(error),
      ),
    );
  }

  Widget _buildErrorState(dynamic error) {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.error_outline_rounded,
              size: 48,
              color: Colors.red,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Gagal Memuat Data',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tidak dapat memuat metode pembayaran',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              ref.invalidate(paymentTypesProvider);
            },
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Coba Lagi'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      elevation: 0,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded, color: Colors.black87),
        onPressed: () => Navigator.pop(context),
      ),
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Proses Pembayaran',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          Text(
            _getPaymentTitle(widget.payment),
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
          ),
        ],
      ),
      actions: [
        Container(
          margin: const EdgeInsets.only(right: 16),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.orange, Colors.orange.shade600],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            formatRupiah(widget.payment.amount),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          _buildStepIndicator(0, 'Pilih Tipe', Icons.category_rounded),
          _buildStepConnector(0),
          _buildStepIndicator(1, 'Pilih Metode', Icons.payment_rounded),
          _buildStepConnector(1),
          _buildStepIndicator(2, 'Konfirmasi', Icons.check_circle_rounded),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, String title, IconData icon) {
    final isActive = _currentStep >= step;
    final isCompleted = _currentStep > step;

    return Expanded(
      child: Column(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient:
                  isActive
                      ? LinearGradient(
                        colors: [Colors.orange, Colors.orange.shade600],
                      )
                      : null,
              color: !isActive ? Colors.grey.shade300 : null,
              shape: BoxShape.circle,
              boxShadow:
                  isActive
                      ? [
                        BoxShadow(
                          color: Colors.orange.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ]
                      : null,
            ),
            child: Icon(
              isCompleted ? Icons.check_rounded : icon,
              color: isActive ? Colors.white : Colors.grey.shade600,
              size: 24,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              color: isActive ? Colors.orange : Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepConnector(int step) {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 24),
        color: _currentStep > step ? Colors.orange : Colors.grey.shade300,
      ),
    );
  }

  Widget _buildPaymentTypeSelection(List<PaymentTypeModel> paymentTypes) {
    final processState = ref.watch(paymentProcessProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Pilih Tipe Pembayaran',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Pilih kategori pembayaran yang sesuai',
            style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 1.1,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: paymentTypes.length,
            itemBuilder: (context, index) {
              final type = paymentTypes[index];
              final isSelected = processState.selectedType?.id == type.id;

              return _buildPaymentTypeCard(type, isSelected);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentTypeCard(PaymentTypeModel type, bool isSelected) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        color: isSelected ? Colors.orange.withOpacity(0.1) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? Colors.orange : Colors.grey.shade300,
          width: isSelected ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color:
                isSelected
                    ? Colors.orange.withOpacity(0.2)
                    : Colors.black.withOpacity(0.04),
            blurRadius: isSelected ? 12 : 6,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            ref.read(paymentProcessProvider.notifier).selectPaymentType(type);
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors:
                          isSelected
                              ? [Colors.orange, Colors.orange.shade600]
                              : [Colors.grey.shade200, Colors.grey.shade300],
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    _getPaymentTypeIcon(type.id),
                    size: 32,
                    color: isSelected ? Colors.white : Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  type.name,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.orange : Colors.black87,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  '${type.paymentMethods.length} metode',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
                if (isSelected) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.check_rounded,
                          size: 12,
                          color: Colors.white,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'Dipilih',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentMethodSelection() {
    final processState = ref.watch(paymentProcessProvider);

    if (processState.selectedType == null) {
      return const Center(child: Text('Pilih tipe pembayaran terlebih dahulu'));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Pilih Metode ${processState.selectedType!.name}',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Pilih cara pembayaran yang diinginkan',
            style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 24),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: processState.selectedType!.paymentMethods.length,
            itemBuilder: (context, index) {
              final method = processState.selectedType!.paymentMethods[index];
              final isSelected = processState.selectedMethod?.id == method.id;

              return _buildPaymentMethodCard(method, isSelected);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodCard(PaymentMethodModel method, bool isSelected) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isSelected ? Colors.orange.withOpacity(0.1) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? Colors.orange : Colors.grey.shade300,
          width: isSelected ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color:
                isSelected
                    ? Colors.orange.withOpacity(0.2)
                    : Colors.black.withOpacity(0.04),
            blurRadius: isSelected ? 12 : 6,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            ref
                .read(paymentProcessProvider.notifier)
                .selectPaymentMethod(method);
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors:
                          isSelected
                              ? [Colors.orange, Colors.orange.shade600]
                              : [Colors.grey.shade100, Colors.grey.shade200],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getPaymentMethodIcon(method.id),
                    size: 28,
                    color: isSelected ? Colors.white : Colors.grey.shade600,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        method.name,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.orange : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        method.name,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      if (method.isDigital) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Digital',
                            style: TextStyle(
                              color: Colors.green,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.orange : Colors.transparent,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? Colors.orange : Colors.grey.shade400,
                      width: 2,
                    ),
                  ),
                  child:
                      isSelected
                          ? const Icon(
                            Icons.check_rounded,
                            color: Colors.white,
                            size: 14,
                          )
                          : null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentConfirmation() {
    final processState = ref.watch(paymentProcessProvider);
    final amount = processState.amount ?? widget.payment.amount;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Konfirmasi Pembayaran',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Periksa kembali detail pembayaran Anda',
            style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 24),

          // Payment Summary Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.orange.withOpacity(0.1),
                  Colors.orange.withOpacity(0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.orange.withOpacity(0.3)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Total Pembayaran',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    Text(
                      formatRupiah(amount),
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.orange,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  height: 1,
                  color: Colors.orange.withOpacity(0.2),
                ),
                const SizedBox(height: 16),
                _buildSummaryRow('Tagihan', _getPaymentTitle(widget.payment)),
                const SizedBox(height: 8),
                _buildSummaryRow(
                  'Metode',
                  '${processState.selectedType?.name} - ${processState.selectedMethod?.name}',
                ),
                const SizedBox(height: 8),
                _buildSummaryRow(
                  'Tipe Pembayaran',
                  processState.selectedMethod?.isDigital == true
                      ? 'Digital'
                      : 'Manual',
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Notes Section
          const Text(
            'Catatan (Opsional)',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _notesController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Tambahkan catatan untuk pembayaran ini...',
              filled: true,
              fillColor: Colors.grey.shade100,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.orange, width: 2),
              ),
            ),
            onChanged: (value) {
              ref.read(paymentProcessProvider.notifier).setNotes(value);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
        ),
        Flexible(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }

  Widget _buildBottomNavigation() {
    final processState = ref.watch(paymentProcessProvider);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 8,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_currentStep > 0) ...[
            Expanded(
              child: OutlinedButton(
                onPressed:
                    processState.isProcessing
                        ? null
                        : () {
                          _pageController.previousPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  side: const BorderSide(color: Colors.orange),
                ),
                child: const Text(
                  'Kembali',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
          ],
          Expanded(
            child: ElevatedButton(
              onPressed:
                  _getNextButtonEnabled() && !processState.isProcessing
                      ? _handleNextButton
                      : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                disabledBackgroundColor: Colors.grey.shade300,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 4,
              ),
              child:
                  processState.isProcessing
                      ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                      : Text(
                        _getNextButtonText(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
            ),
          ),
        ],
      ),
    );
  }

  bool _getNextButtonEnabled() {
    final processState = ref.read(paymentProcessProvider);

    switch (_currentStep) {
      case 0:
        return processState.selectedType != null;
      case 1:
        return processState.selectedMethod != null;
      case 2:
        return processState.selectedType != null &&
            processState.selectedMethod != null;
      default:
        return false;
    }
  }

  String _getNextButtonText() {
    switch (_currentStep) {
      case 0:
        return 'Pilih Metode';
      case 1:
        return 'Konfirmasi';
      case 2:
        return 'Proses Pembayaran';
      default:
        return 'Lanjut';
    }
  }

  void _handleNextButton() {
    if (_currentStep < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _processPayment();
    }
  }

  void _processPayment() async {
    // Show loading dialog
    _showProcessingDialog();

    try {
      // Process payment using provider
      final success =
          await ref.read(paymentProcessProvider.notifier).processPayment();

      // Close loading dialog
      if (mounted) Navigator.pop(context);

      if (success) {
        _showSuccessDialog();
      } else {
        _showErrorDialog();
      }
    } catch (e) {
      // Close loading dialog
      if (mounted) Navigator.pop(context);
      _showErrorDialog();
    }
  }

  void _showProcessingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => AlertDialog(
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            content: Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.orange, Colors.orange.shade600],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Padding(
                      padding: EdgeInsets.all(20),
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Memproses Pembayaran...',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Mohon tunggu, pembayaran sedang diproses',
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
    );
  }

  void _showSuccessDialog() {
    final processState = ref.read(paymentProcessProvider);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => AlertDialog(
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            content: Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.green, Color(0xFF4CAF50)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_rounded,
                      color: Colors.white,
                      size: 40,
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Pembayaran Berhasil!',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green.withOpacity(0.3)),
                    ),
                    child: Column(
                      children: [
                        Text(
                          formatRupiah(
                            processState.amount ?? widget.payment.amount,
                          ),
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Via ${processState.selectedType?.name} - ${processState.selectedMethod?.name}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _getPaymentTitle(widget.payment),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Transaksi ID: PAY${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context); // Close success dialog
                    Navigator.pop(context); // Go back to previous screen

                    // Show snackbar
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Pembayaran ${_getPaymentTitle(widget.payment)} berhasil diproses',
                        ),
                        backgroundColor: Colors.green,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Selesai',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
    );
  }

  void _showErrorDialog() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Row(
              children: [
                Icon(Icons.error_outline, color: Colors.red),
                SizedBox(width: 12),
                Text('Pembayaran Gagal'),
              ],
            ),
            content: const Text(
              'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
    );
  }

  String _getPaymentTitle(PaymentModel payment) {
    if (payment.paymentType != null) {
      switch (payment.paymentType!.toLowerCase()) {
        case 'dp':
          return 'Tagihan DP (Down Payment)';
        case 'pelunasan':
          return 'Tagihan Pelunasan';
        case 'full':
          return 'Pembayaran Penuh';
        default:
          return 'Tagihan ${payment.paymentType}';
      }
    }
    return 'Tagihan Pembayaran';
  }

  IconData _getPaymentTypeIcon(String typeId) {
    switch (typeId) {
      case 'cash':
        return Icons.payments_rounded;
      case 'ewallet':
        return Icons.account_balance_wallet_rounded;
      case 'debit':
        return Icons.credit_card_rounded;
      case 'banktransfer':
        return Icons.account_balance_rounded;
      default:
        return Icons.payment_rounded;
    }
  }

  IconData _getPaymentMethodIcon(String methodId) {
    switch (methodId) {
      case 'cash':
        return Icons.payments_rounded;
      case 'qris':
        return Icons.qr_code_rounded;
      case 'gopay':
        return Icons.account_balance_wallet_rounded;
      case 'bni':
      case 'bri':
      case 'bca':
        return Icons.account_balance_rounded;
      default:
        return Icons.payment_rounded;
    }
  }
}
