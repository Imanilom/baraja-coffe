import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kasirbaraja/models/bluetooth_printer.model.dart';
import 'package:kasirbaraja/providers/printer_providers/printer_provider.dart';

class DetailPrinterScreen extends ConsumerStatefulWidget {
  const DetailPrinterScreen({super.key});

  @override
  ConsumerState<DetailPrinterScreen> createState() =>
      _DetailPrinterScreenState();
}

class _DetailPrinterScreenState extends ConsumerState<DetailPrinterScreen> {
  late BluetoothPrinterModel _printer;
  bool _isLoading = false;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      final routerState = GoRouterState.of(context);
      if (routerState.extra != null) {
        _printer = routerState.extra as BluetoothPrinterModel;
        _initialized = true;
      } else {
        // Handle case when extra is null
        Navigator.pop(context);
      }
    }
  }

  Future<void> _updatePrinter() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(savedPrintersProvider.notifier).updatePrinter(_printer);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Printer updated successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail Printer'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: _isLoading ? null : _updatePrinter,
          ),
        ],
      ),
      body:
          _isLoading
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Informasi Dasar
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _printer.name,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          Text(_printer.address),
                          Text(
                            'Connection: ${_printer.connectionType ?? 'N/A'}',
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Printer Roles
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          // Customer Printer Toggle,
                          SwitchListTile(
                            title: const Text('Customer Printer'),
                            value: _printer.canPrintCustomer,
                            onChanged:
                                (value) => setState(() {
                                  _printer = _printer.copyWith(
                                    canPrintCustomer: value,
                                  );
                                }),
                          ),

                          if (_printer.canPrintCustomer) ...[
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Customer Copies'),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove),
                                      onPressed:
                                          () => setState(() {
                                            _printer = _printer.copyWith(
                                              customerCopies:
                                                  _printer.customerCopies > 1
                                                      ? _printer
                                                              .customerCopies -
                                                          1
                                                      : 1,
                                            );
                                          }),
                                    ),
                                    Text('${_printer.customerCopies}'),
                                    IconButton(
                                      icon: const Icon(Icons.add),
                                      onPressed:
                                          () => setState(() {
                                            _printer = _printer.copyWith(
                                              customerCopies:
                                                  _printer.customerCopies + 1,
                                            );
                                          }),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],

                          const Divider(),

                          // Kitchen Printer Toggle
                          SwitchListTile(
                            title: const Text('Kitchen Printer'),
                            value: _printer.canPrintKitchen,
                            onChanged:
                                (value) => setState(() {
                                  _printer = _printer.copyWith(
                                    canPrintKitchen: value,
                                  );
                                }),
                          ),

                          if (_printer.canPrintKitchen) ...[
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Kitchen Copies'),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove),
                                      onPressed:
                                          () => setState(() {
                                            _printer = _printer.copyWith(
                                              kitchenCopies:
                                                  _printer.kitchenCopies > 1
                                                      ? _printer.kitchenCopies -
                                                          1
                                                      : 1,
                                            );
                                          }),
                                    ),
                                    Text('${_printer.kitchenCopies}'),
                                    IconButton(
                                      icon: const Icon(Icons.add),
                                      onPressed:
                                          () => setState(() {
                                            _printer = _printer.copyWith(
                                              kitchenCopies:
                                                  _printer.kitchenCopies + 1,
                                            );
                                          }),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],

                          const Divider(),

                          // Bar Printer Toggle
                          SwitchListTile(
                            title: const Text('Bar Printer'),
                            value: _printer.canPrintBar,
                            onChanged:
                                (value) => setState(() {
                                  _printer = _printer.copyWith(
                                    canPrintBar: value,
                                  );
                                }),
                          ),

                          if (_printer.canPrintBar) ...[
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Bar Copies'),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove),
                                      onPressed:
                                          () => setState(() {
                                            _printer = _printer.copyWith(
                                              barCopies:
                                                  _printer.barCopies > 1
                                                      ? _printer.barCopies - 1
                                                      : 1,
                                            );
                                          }),
                                    ),
                                    Text('${_printer.barCopies}'),
                                    IconButton(
                                      icon: const Icon(Icons.add),
                                      onPressed:
                                          () => setState(() {
                                            _printer = _printer.copyWith(
                                              barCopies: _printer.barCopies + 1,
                                            );
                                          }),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],

                          const Divider(),

                          // Waiter Printer Toggle,
                          SwitchListTile(
                            title: const Text('Waiter Printer'),
                            value: _printer.canPrintWaiter,
                            onChanged:
                                (value) => setState(() {
                                  _printer = _printer.copyWith(
                                    canPrintWaiter: value,
                                  );
                                }),
                          ),

                          if (_printer.canPrintWaiter) ...[
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Waiter Copies'),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove),
                                      onPressed:
                                          () => setState(() {
                                            _printer = _printer.copyWith(
                                              waiterCopies:
                                                  _printer.waiterCopies > 1
                                                      ? _printer.waiterCopies -
                                                          1
                                                      : 1,
                                            );
                                          }),
                                    ),
                                    Text('${_printer.waiterCopies}'),
                                    IconButton(
                                      icon: const Icon(Icons.add),
                                      onPressed:
                                          () => setState(() {
                                            _printer = _printer.copyWith(
                                              waiterCopies:
                                                  _printer.waiterCopies + 1,
                                            );
                                          }),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Paper Size Selection
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Paper Size',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<String>(
                            value: _printer.paperSize,
                            items: const [
                              DropdownMenuItem(
                                value: 'mm58',
                                child: Text('58mm'),
                              ),
                              DropdownMenuItem(
                                value: 'mm72',
                                child: Text('72mm'),
                              ),
                              DropdownMenuItem(
                                value: 'mm80',
                                child: Text('80mm'),
                              ),
                            ],
                            onChanged: (value) {
                              if (value != null) {
                                setState(() {
                                  _printer = _printer.copyWith(
                                    paperSize: value,
                                  );
                                });
                              }
                            },
                            decoration: const InputDecoration(
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
    );
  }
}
