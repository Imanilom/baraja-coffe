//edit_order_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/order_detail.model.dart';
import 'package:kasirbaraja/providers/order_detail_providers/online_order_detail_provider.dart';
import 'package:kasirbaraja/screens/orders/edit_order/list_menu.dart';
import 'package:kasirbaraja/screens/orders/edit_order/order_detail_edit.dart';

class EditOrderScreen extends ConsumerStatefulWidget {
  final OrderDetailModel orderDetail;
  const EditOrderScreen({super.key, required this.orderDetail});

  @override
  ConsumerState<EditOrderScreen> createState() => _EditOrderScreenState();
}

class _EditOrderScreenState extends ConsumerState<EditOrderScreen> {
  @override
  void initState() {
    super.initState();
    final orderDetail = widget.orderDetail;
    print('Edit Order Detail Arguments: $orderDetail');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(onlineOrderEditorProvider.notifier).clearAll();
      ref.read(onlineOrderEditorProvider.notifier).load(orderDetail);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Order'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            showDialog(
              context: context,
              builder:
                  (context) => AlertDialog(
                    title: const Text('Konfirmasi'),
                    content: const Text(
                      'Apakah Anda yakin ingin kembali? Perubahan yang belum disimpan akan hilang.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).pop(); // Tutup dialog
                        },
                        child: const Text('Batal'),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).pop(); // Tutup dialog
                          Navigator.of(
                            context,
                          ).pop(); // Kembali ke layar sebelumnya
                        },
                        child: const Text('Ya'),
                      ),
                    ],
                  ),
            );
          },
        ),
      ),
      body: Row(
        children: const [
          Expanded(flex: 4, child: ListMenu()),
          Expanded(flex: 2, child: OrderDetailEdit()),
        ],
      ),
    );
  }
}
