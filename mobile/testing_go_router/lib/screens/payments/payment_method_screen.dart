import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/models/payments/payment_model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/providers/order_detail_providers/order_detail_provider.dart';
import 'package:kasirbaraja/providers/payment_provider.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

class PaymentMethodScreen extends ConsumerWidget {
  const PaymentMethodScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(paymentProvider);
    final notifier = ref.read(paymentProvider.notifier);
    final OrderDetailModel orderdetail =
        GoRouterState.of(context).extra as OrderDetailModel;
    final total = orderdetail.totalPrice;

    // Daftar metode pembayaran
    final paymentMethods = [
      PaymentMethod(id: 'Cash', name: 'Tunai', type: 'Cash'),
      // PaymentMethod(id: 'edc', name: 'EDC', type: 'edc'),
    ];

    // Daftar bank untuk EDC
    final banks = [
      PaymentMethod(id: 'bca', name: 'BCA', type: 'edc'),
      PaymentMethod(id: 'bri', name: 'BRI', type: 'edc'),
      PaymentMethod(id: 'mandiri', name: 'Mandiri', type: 'edc'),
    ];

    // Daftar nominal uang untuk tunai
    final cashSuggestions = _getCashSuggestions(total!.toInt());
    print('Cash suggestions: $cashSuggestions');

    return Scaffold(
      appBar: AppBar(title: const Text('Pilih Pembayaran')),
      // body: SingleChildScrollView(
      //   physics: const BouncingScrollPhysics(),
      //   child: Column(
      //     mainAxisSize: MainAxisSize.min,
      //     children: [
      //       // Bagian Total Tagihan
      //       const Text('Total Tagihan'),
      //       const SizedBox(height: 10),
      //       Container(
      //         width: double.infinity,
      //         padding: const EdgeInsets.all(16),
      //         decoration: BoxDecoration(
      //           color: const Color.fromARGB(255, 236, 236, 236),
      //           borderRadius: BorderRadius.circular(8),
      //         ),
      //         child: Center(
      //           child: Text(
      //             formatRupiah(total.toInt()),
      //             style: const TextStyle(
      //               fontSize: 32,
      //               fontWeight: FontWeight.bold,
      //             ),
      //           ),
      //         ),
      //       ),
      //       const SizedBox(height: 16),

      //       // Pilihan Metode Pembayaran
      //       _buildMethodSelection(notifier, paymentMethods, state),

      //       // Konten Dinamis (Tunai/EDC)
      //       if (state.selectedMethod != null)
      //         Expanded(
      //           child: SingleChildScrollView(
      //             physics: const BouncingScrollPhysics(),
      //             child:
      //                 state.selectedMethod!.type == 'Cash'
      //                     ? _buildCashPayment(cashSuggestions, notifier, state)
      //                     : _buildEDCPayment(banks, notifier, state),
      //           ),
      //         ),

      //       // Tombol Lanjut Pembayaran
      //       if (state.selectedMethod != null &&
      //           ((state.selectedMethod!.type == 'Cash' &&
      //                   state.selectedCashAmount != null) ||
      //               (state.selectedMethod!.type == 'edc' &&
      //                   state.selectedBankId != null)))
      //         Padding(
      //           padding: const EdgeInsets.only(top: 16, bottom: 8),
      //           child: SizedBox(
      //             width: double.infinity,
      //             child: ElevatedButton(
      //               style: ElevatedButton.styleFrom(
      //                 padding: const EdgeInsets.symmetric(vertical: 16),
      //               ),
      //               onPressed: () => _processPayment(context, ref),
      //               child: const Text('LANJUT PEMBAYARAN'),
      //             ),
      //           ),
      //         ),
      //     ],
      //   ),
      // ),
      body: Container(
        width: double.infinity,
        color: Colors.white,
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Bagian Total Tagihan
            const Text('Total Tagihan'),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color.fromARGB(255, 236, 236, 236),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  formatRupiah(total.toInt()),
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Pilihan Metode Pembayaran
            _buildMethodSelection(notifier, paymentMethods, state),

            // Konten Dinamis (Tunai/EDC)
            if (state.selectedMethod != null)
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child:
                      state.selectedMethod!.type == 'Cash'
                          ? _buildCashPayment(cashSuggestions, notifier, state)
                          : _buildEDCPayment(banks, notifier, state),
                ),
              ),

            // Tombol Lanjut Pembayaran
            if (state.selectedMethod != null &&
                ((state.selectedMethod!.type == 'Cash' &&
                        state.selectedCashAmount != null) ||
                    (state.selectedMethod!.type == 'edc' &&
                        state.selectedBankId != null)))
              Padding(
                padding: const EdgeInsets.only(top: 16, bottom: 8),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    onPressed: () => _processPayment(context, ref),
                    child: const Text('LANJUT PEMBAYARAN'),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  List<int> _getCashSuggestions(int totalAmount) {
    final suggestions =
        <int>{
            totalAmount,
            _roundUpToNearest(totalAmount, 1000),
            _roundUpToNearest(totalAmount, 2000),
            _roundUpToNearest(totalAmount, 5000),
            _roundUpToNearest(totalAmount, 10000),
            _roundUpToNearest(totalAmount, 20000),
            _roundUpToNearest(totalAmount, 50000),
            _roundUpToNearest(totalAmount, 100000),
            // 20000,
            // 50000,
            // 100000,
          }.toList()
          ..sort();

    return suggestions.take(4).toList(); // Limit to 6 suggestions
  }

  /// Round up to the nearest multiple of [nearest].
  /// For example, if [number] is 1234 and [nearest] is 1000,
  /// the result will be 2000.
  int _roundUpToNearest(int number, int nearest) {
    if (nearest <= 0) {
      throw ArgumentError('Nearest must be greater than zero.');
    }
    return ((number + nearest - 1) ~/ nearest) * nearest; // Round up
  }

  Widget _buildMethodSelection(
    PaymentNotifier notifier,
    List<PaymentMethod> methods,
    PaymentState state,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Metode Pembayaran', style: TextStyle(fontSize: 16)),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children:
                  methods.map((method) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text(method.name),
                        ),
                        selected: state.selectedMethod?.id == method.id,
                        onSelected: (_) {
                          notifier.clearSelection();
                          notifier.selectMethod(method);
                        },
                      ),
                    );
                  }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCashPayment(
    List<int> suggestions,
    PaymentNotifier notifier,
    PaymentState state,
  ) {
    return Column(
      children: [
        const Text('Pilih Jumlah Tunai', style: TextStyle(fontSize: 16)),
        const SizedBox(height: 8),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 5,
          childAspectRatio: 3.5, //fit
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          padding: const EdgeInsets.symmetric(vertical: 0),
          children:
              suggestions.map((amount) {
                return InkWell(
                  onTap: () => notifier.selectCashAmount(amount),
                  child: Card(
                    color:
                        state.selectedCashAmount == amount
                            ? Colors.green
                            : null,
                    elevation: state.selectedCashAmount == amount ? 2 : 0,
                    child: Center(
                      child: Text(
                        formatRupiah(amount),
                        style: TextStyle(
                          fontWeight:
                              state.selectedCashAmount == amount
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
        ),
        if (state.selectedCashAmount != null)
          Container(
            margin: const EdgeInsets.only(top: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Kembalian:', style: TextStyle(fontSize: 16)),
                Text(
                  formatRupiah(state.change),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildEDCPayment(
    List<PaymentMethod> banks,
    PaymentNotifier notifier,
    PaymentState state,
  ) {
    return Column(
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 8),
          child: Text('Pilih Bank', style: TextStyle(fontSize: 16)),
        ),
        GridView.count(
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 3,
          childAspectRatio: 3.5, //fit
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          padding: const EdgeInsets.symmetric(vertical: 8),
          children:
              banks.map((bank) {
                return InkWell(
                  onTap: () => notifier.selectBank(bank.id),
                  child: Card(
                    color: state.selectedBankId == bank.id ? Colors.blue : null,
                    elevation: state.selectedBankId == bank.id ? 2 : 0,
                    child: Center(
                      child: Text(
                        bank.name,
                        style: TextStyle(
                          fontWeight:
                              state.selectedBankId == bank.id
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                        ),
                      ),
                    ),
                  ),
                );
                // return GestureDetector(
                //   onTap: () => notifier.selectBank(bank.id),
                //   child: Card(
                //     margin: const EdgeInsets.all(8),
                //     elevation: state.selectedBankId == bank.id ? 2 : 0,
                //     color: state.selectedBankId == bank.id ? Colors.blue : null,
                //     child: Column(
                //       mainAxisAlignment: MainAxisAlignment.center,
                //       children: [
                //         // if (bank.logoUrl != null)
                //         //   Image.network(bank.logoUrl!, height: 40),
                //         const SizedBox(height: 8),
                //         Text(bank.name, style: const TextStyle(fontSize: 12)),
                //       ],
                //     ),
                //   ),
                // );
              }).toList(),
        ),
      ],
    );
  }

  void _processPayment(BuildContext context, WidgetRef ref) async {
    final state = ref.read(paymentProvider);
    final orderDetail = ref.watch(orderDetailProvider.notifier);
    final cashierId = ref.watch(authCashierProvider).value?.id ?? '';

    // Proses pembayaran
    if (state.selectedMethod == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan pilih metode pembayaran!')),
      );
      return;
    }

    // Simpan metode pembayaran ke orderDetailProvider
    orderDetail.updatePaymentMethod(state.selectedMethod!.type);

    final success = await orderDetail.submitOrder(cashierId);

    // Navigasi ke halaman sukses
    if (success && context.mounted) {
      context.goNamed(
        'payment-success',
        extra: {
          'payment_method': state.selectedMethod!.name,
          'amount':
              state.selectedMethod!.type == 'Cash'
                  ? state.selectedCashAmount
                  : state.totalAmount,
          'change': state.selectedMethod!.type == 'Cash' ? state.change : null,
        },
      );
    } else if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Pembayaran gagal!')));
    }
  }
}

// class PaymentMethodScreens extends ConsumerWidget {
//   const PaymentMethodScreens({super.key});

//   @override
//   Widget build(BuildContext context, WidgetRef ref) {
//     final state = ref.watch(paymentProvider);
//     final notifier = ref.read(paymentProvider.notifier);
//     final orderDetail = GoRouterState.of(context).extra as OrderDetailModel;
//     final total = orderDetail.totalPrice!;

//     final paymentMethods = [
//       PaymentMethod(id: 'Cash', name: 'Tunai', type: 'Cash'),
//       // PaymentMethod(id: 'edc', name: 'EDC', type: 'edc'),
//     ];

//     final banks = [
//       PaymentMethod(id: 'bca', name: 'BCA', type: 'edc'),
//       PaymentMethod(id: 'bri', name: 'BRI', type: 'edc'),
//       PaymentMethod(id: 'mandiri', name: 'Mandiri', type: 'edc'),
//     ];

//     final cashSuggestions = _getCashSuggestions(total.toInt());

//     return Scaffold(
//       appBar: AppBar(title: const Text('Pilih Pembayaran')),
//       body: LayoutBuilder(
//         builder: (context, constraints) {
//           return SingleChildScrollView(
//             child: ConstrainedBox(
//               constraints: BoxConstraints(minHeight: constraints.maxHeight),
//               child: Container(
//                 width: double.infinity,
//                 color: Colors.white,
//                 padding: const EdgeInsets.all(16),
//                 child: Column(
//                   children: [
//                     _buildTotalPayment(total.toInt()),
//                     _buildMethodSelection(notifier, paymentMethods, state),
//                     if (state.selectedMethod != null)
//                       state.selectedMethod!.type == 'Cash'
//                           ? _buildCashPayment(cashSuggestions, notifier, state)
//                           : _buildEDCPayment(banks, notifier, state),
//                     if (state.selectedMethod != null)
//                       _buildPaymentButton(context, ref),
//                   ],
//                 ),
//               ),
//             ),
//           );
//         },
//       ),
//     );
//   }

//   Widget _buildTotalPayment(int total) {
//     return Column(
//       children: [
//         const Text('Total Tagihan'),
//         const SizedBox(height: 10),
//         Container(
//           width: double.infinity,
//           padding: const EdgeInsets.all(16),
//           decoration: BoxDecoration(
//             color: const Color.fromARGB(255, 236, 236, 236),
//             borderRadius: BorderRadius.circular(8),
//           ),
//           child: Center(
//             child: Text(
//               formatRupiah(total),
//               style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
//             ),
//           ),
//         ),
//         const SizedBox(height: 16),
//       ],
//     );
//   }

//   // ... (_getCashSuggestions dan _roundUpToNearest tetap sama)
//   List<int> _getCashSuggestions(int totalAmount) {
//     final suggestions =
//         <int>{
//             totalAmount,
//             _roundUpToNearest(totalAmount, 1000),
//             _roundUpToNearest(totalAmount, 2000),
//             _roundUpToNearest(totalAmount, 5000),
//             _roundUpToNearest(totalAmount, 10000),
//             _roundUpToNearest(totalAmount, 20000),
//             _roundUpToNearest(totalAmount, 50000),
//             _roundUpToNearest(totalAmount, 100000),
//             // 20000,
//             // 50000,
//             // 100000,
//           }.toList()
//           ..sort();

//     return suggestions.take(4).toList(); // Limit to 6 suggestions
//   }

//   int _roundUpToNearest(int number, int nearest) {
//     if (nearest <= 0) {
//       throw ArgumentError('Nearest must be greater than zero.');
//     }
//     return ((number + nearest - 1) ~/ nearest) * nearest; // Round up
//   }

//   Widget _buildMethodSelection(
//     PaymentNotifier notifier,
//     List<PaymentMethod> methods,
//     PaymentState state,
//   ) {
//     return Container(
//       padding: const EdgeInsets.symmetric(vertical: 8),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           const Text('Metode Pembayaran', style: TextStyle(fontSize: 16)),
//           const SizedBox(height: 8),
//           SizedBox(
//             height: 50, // Fixed height untuk horizontal scroll
//             child: ListView.separated(
//               scrollDirection: Axis.horizontal,
//               itemCount: methods.length,
//               separatorBuilder: (_, __) => const SizedBox(width: 8),
//               itemBuilder: (_, index) {
//                 final method = methods[index];
//                 return ChoiceChip(
//                   label: Text(method.name),
//                   selected: state.selectedMethod?.id == method.id,
//                   onSelected: (_) {
//                     notifier.clearSelection();
//                     notifier.selectMethod(method);
//                   },
//                 );
//               },
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildCashPayment(
//     List<int> suggestions,
//     PaymentNotifier notifier,
//     PaymentState state,
//   ) {
//     return Column(
//       children: [
//         const Text('Pilih Jumlah Tunai', style: TextStyle(fontSize: 16)),
//         const SizedBox(height: 8),
//         GridView.count(
//           shrinkWrap: true,
//           physics: const NeverScrollableScrollPhysics(),
//           crossAxisCount: 5,
//           childAspectRatio: 3.5, //fit
//           mainAxisSpacing: 8,
//           crossAxisSpacing: 8,
//           padding: const EdgeInsets.symmetric(vertical: 0),
//           children:
//               suggestions.map((amount) {
//                 return InkWell(
//                   onTap: () => notifier.selectCashAmount(amount),
//                   child: Card(
//                     color:
//                         state.selectedCashAmount == amount
//                             ? Colors.green
//                             : null,
//                     elevation: state.selectedCashAmount == amount ? 2 : 0,
//                     child: Center(
//                       child: Text(
//                         formatRupiah(amount),
//                         style: TextStyle(
//                           fontWeight:
//                               state.selectedCashAmount == amount
//                                   ? FontWeight.bold
//                                   : FontWeight.normal,
//                         ),
//                       ),
//                     ),
//                   ),
//                 );
//               }).toList(),
//         ),
//         if (state.selectedCashAmount != null)
//           Container(
//             margin: const EdgeInsets.only(top: 16),
//             padding: const EdgeInsets.all(16),
//             decoration: BoxDecoration(
//               color: Colors.grey[100],
//               borderRadius: BorderRadius.circular(8),
//             ),
//             child: Row(
//               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//               children: [
//                 const Text('Kembalian:', style: TextStyle(fontSize: 16)),
//                 Text(
//                   formatRupiah(state.change),
//                   style: const TextStyle(
//                     fontSize: 18,
//                     fontWeight: FontWeight.bold,
//                   ),
//                 ),
//               ],
//             ),
//           ),
//       ],
//     );
//   }

//   Widget _buildEDCPayment(
//     List<PaymentMethod> banks,
//     PaymentNotifier notifier,
//     PaymentState state,
//   ) {
//     return Column(
//       children: [
//         const Padding(
//           padding: EdgeInsets.symmetric(vertical: 8),
//           child: Text('Pilih Bank', style: TextStyle(fontSize: 16)),
//         ),
//         GridView.count(
//           physics: const NeverScrollableScrollPhysics(),
//           crossAxisCount: 3,
//           childAspectRatio: 3.5, //fit
//           mainAxisSpacing: 8,
//           crossAxisSpacing: 8,
//           padding: const EdgeInsets.symmetric(vertical: 8),
//           children:
//               banks.map((bank) {
//                 return InkWell(
//                   onTap: () => notifier.selectBank(bank.id),
//                   child: Card(
//                     color: state.selectedBankId == bank.id ? Colors.blue : null,
//                     elevation: state.selectedBankId == bank.id ? 2 : 0,
//                     child: Center(
//                       child: Text(
//                         bank.name,
//                         style: TextStyle(
//                           fontWeight:
//                               state.selectedBankId == bank.id
//                                   ? FontWeight.bold
//                                   : FontWeight.normal,
//                         ),
//                       ),
//                     ),
//                   ),
//                 );
//                 // return GestureDetector(
//                 //   onTap: () => notifier.selectBank(bank.id),
//                 //   child: Card(
//                 //     margin: const EdgeInsets.all(8),
//                 //     elevation: state.selectedBankId == bank.id ? 2 : 0,
//                 //     color: state.selectedBankId == bank.id ? Colors.blue : null,
//                 //     child: Column(
//                 //       mainAxisAlignment: MainAxisAlignment.center,
//                 //       children: [
//                 //         // if (bank.logoUrl != null)
//                 //         //   Image.network(bank.logoUrl!, height: 40),
//                 //         const SizedBox(height: 8),
//                 //         Text(bank.name, style: const TextStyle(fontSize: 12)),
//                 //       ],
//                 //     ),
//                 //   ),
//                 // );
//               }).toList(),
//         ),
//       ],
//     );
//   }

//   Widget _buildPaymentButton(BuildContext context, WidgetRef ref) {
//     return Padding(
//       padding: const EdgeInsets.only(top: 16, bottom: 8),
//       child: SizedBox(
//         width: double.infinity,
//         child: ElevatedButton(
//           style: ElevatedButton.styleFrom(
//             padding: const EdgeInsets.symmetric(vertical: 16),
//             backgroundColor: Colors.green,
//           ),
//           onPressed: () => _processPayment(context, ref),
//           child: const Text(
//             'LANJUT PEMBAYARAN',
//             style: TextStyle(color: Colors.white),
//           ),
//         ),
//       ),
//     );
//   }

//   // ... (_processPayment tetap sama)
//   void _processPayment(BuildContext context, WidgetRef ref) {
//     final state = ref.read(paymentProvider);

//     // Proses pembayaran
//     // ...

//     // Navigasi ke halaman sukses
//     context.pushNamed(
//       'payment-success',
//       extra: {
//         'payment_method': state.selectedMethod!.name,
//         'amount':
//             state.selectedMethod!.type == 'Cash'
//                 ? state.selectedCashAmount
//                 : state.totalAmount,
//         'change': state.selectedMethod!.type == 'Cash' ? state.change : null,
//       },
//     );
//   }
// }
