import 'package:barajapos/providers/order_detail_providers/order_detail_provider.dart';
import 'package:barajapos/utils/format_rupiah.dart';
import 'package:barajapos/widgets/payment/success_payment.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart' as shadcn;

// Provider untuk menyimpan metode pembayaran yang dipilih
final paymentMethodProvider = StateProvider<String?>((ref) => null);

class PaymentMethod extends ConsumerWidget {
  const PaymentMethod({
    super.key,
    required this.closeSheet,
  });

  //function untuk menutup sheet
  final Function closeSheet;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Ambil metode pembayaran yang dipilih
    final selectedPaymentMethod = ref.watch(paymentMethodProvider);
    final orderDetail = ref.watch(orderDetailProvider.notifier);

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              ElevatedButton(
                onPressed: () {},
                child: const Text('Kembali'),
              ),
              const Text(
                'Pilih Metode Pembayaran',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              ElevatedButton(
                onPressed: () async {
                  if (selectedPaymentMethod == null) {
                    // Tampilkan pesan jika belum memilih metode pembayaran
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Silakan pilih metode pembayaran!'),
                      ),
                    );
                    return;
                  }

                  // Simpan metode pembayaran ke orderDetailProvider
                  orderDetail.updatePaymentMethod(selectedPaymentMethod);

                  // Kirim data orderDetail ke backend
                  final success = await orderDetail.submitOrder();
                  print(
                      'Metode pembayaran yang dipilih: $selectedPaymentMethod');
                  // Tutup modal
                  if (success && context.mounted) {
                    // Navigator.pop(context);
                    closeSheet();
                    shadcn.openSheet(
                      context: context,
                      builder: (context) => const SuccessPayment(),
                      position: shadcn.OverlayPosition.bottom,
                    );
                  } else if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Pembayaran gagal!'),
                      ),
                    );
                  }
                },
                child: const Text('Lanjut Bayar'),
              ),
            ],
          ),
          const Divider(),
          const SizedBox(height: 16),

          Text(
            'Total Harga: ${formatRupiah(orderDetail.totalPrice)}',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          // Opsi Metode Pembayaran
          ListTile(
            leading: const Icon(Icons.payment),
            title: const Text('Cash'),
            trailing: Radio<String>(
              value: 'Cash',
              groupValue: selectedPaymentMethod,
              onChanged: (value) {
                ref.read(paymentMethodProvider.notifier).state = value;
              },
            ),
          ),
          ListTile(
            leading: const Icon(Icons.credit_card),
            title: const Text('Kartu Kredit/Debit'),
            trailing: Radio<String>(
              value: 'Kartu Kredit/Debit',
              groupValue: selectedPaymentMethod,
              onChanged: (value) {
                ref.read(paymentMethodProvider.notifier).state = value;
              },
            ),
          ),
          ListTile(
            leading: const Icon(Icons.qr_code),
            title: const Text('QRIS'),
            trailing: Radio<String>(
              value: 'QRIS',
              groupValue: selectedPaymentMethod,
              onChanged: (value) {
                ref.read(paymentMethodProvider.notifier).state = value;
              },
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
