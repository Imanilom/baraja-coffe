// widgets/confirm_order_button.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kasirbaraja/models/online_order/confirm_order.model.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/orders/online_order_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/providers/orders/order_history_provider.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';

class ConfirmOrderButton extends ConsumerStatefulWidget {
  final OrderDetailModel? orderDetail;
  final String orderId;
  final String cashierId;
  final String source;

  const ConfirmOrderButton({
    super.key,
    this.orderDetail,
    required this.orderId,
    required this.cashierId,
    required this.source,
  });

  @override
  ConsumerState<ConfirmOrderButton> createState() => _ConfirmOrderButtonState();
}

class _ConfirmOrderButtonState extends ConsumerState<ConfirmOrderButton> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final confirmationState = ref.watch(orderConfirmationProvider);

    // Listen untuk perubahan state dan tampilkan snackbar jika perlu
    ref.listen<OrderConfirmationState>(orderConfirmationProvider, (
      previous,
      next,
    ) {
      if (next.response != null && next.response!.success) {
        // Tampilkan snackbar sukses
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.response!.message),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(16),
            duration: const Duration(seconds: 2),
            animation: CurvedAnimation(
              parent: const AlwaysStoppedAnimation(1.0),
              curve: Curves.easeInOut,
            ),
            dismissDirection: DismissDirection.vertical,
          ),
        );

        setState(() => _isLoading = false);
        // Bersihkan order detail setelah konfirmasi berhasil
        ref.read(onlineOrderDetailProvider.notifier).clearOnlineOrderDetail();
        // refresh daftar pesanan
        ref.read(onlineOrderProvider.notifier).refresh();
        ref.read(orderHistoryProvider.notifier).refreshHistory();
      } else if (next.error != null) {
        // Tampilkan snackbar error
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(16),
            duration: const Duration(seconds: 2),
          ),
        );
        setState(() => _isLoading = false);
      }
    });

    return ElevatedButton(
      onPressed: () {
        _confirmOrder(context, ref);
        // Navigator.of(context).pop();
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        disabledBackgroundColor: Colors.grey[300],
        disabledForegroundColor: Colors.grey[500],
      ),
      child:
          _isLoading || confirmationState.isLoading
              ? const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  ),
                  SizedBox(width: 8),
                  Text('Memproses...'),
                ],
              )
              : const Text('Konfirmasi'),
    );
  }

  void _confirmOrder(BuildContext context, WidgetRef ref) {
    final confirmationState = ref.watch(orderConfirmationProvider);
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Konfirmasi Order'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text('Anda akan mengonfirmasi order ini.'),
              SizedBox(height: 8),
              Text(
                'Apakah Anda yakin ingin melanjutkan?',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Batal'),
            ),
            ElevatedButton(
              onPressed:
                  _isLoading || confirmationState.isLoading
                      ? null
                      : () async {
                        setState(() => _isLoading = true);

                        final request = ConfirmOrderRequest(
                          orderId:
                              widget.orderDetail?.orderId ?? widget.orderId,
                          cashierId:
                              widget.orderDetail?.cashierId ?? widget.cashierId,
                          source: widget.orderDetail?.source ?? widget.source,
                        );

                        await ref
                            .read(orderConfirmationProvider.notifier)
                            .confirmOrder(ref, request);
                        // Tutup dialog setelah proses konfirmasi
                        if (context.mounted) {
                          // printer all
                          final savedPrinter = ref.read(
                            savedPrintersProvider.notifier,
                          );
                          savedPrinter.printToPrinter(
                            orderDetail: widget.orderDetail!,
                            printType: 'all',
                          );

                          Navigator.of(context).pop();
                        }
                      },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
              ),
              child: const Text('Ya, Lanjutkan'),
            ),
          ],
        );
      },
    );
  }
}
