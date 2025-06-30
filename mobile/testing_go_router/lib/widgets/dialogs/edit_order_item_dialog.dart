import 'package:flutter/material.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/models/addon_option.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/utils/format_rupiah.dart';

class EditOrderItemDialog extends StatefulWidget {
  final OrderItemModel orderItem;
  final Function(OrderItemModel) onEditOrder;
  //fungsi close dialog
  final Function() onClose;

  const EditOrderItemDialog({
    super.key,
    required this.orderItem,
    required this.onEditOrder,
    required this.onClose,
  });

  @override
  EditOrderItemDialogState createState() => EditOrderItemDialogState();
}

class EditOrderItemDialogState extends State<EditOrderItemDialog> {
  late List<ToppingModel> selectedToppings;
  late List<AddonModel> selectedAddons;
  late int quantity;

  @override
  void initState() {
    super.initState();
    // Inisialisasi state dengan data dari OrderItem yang akan diedit
    selectedToppings = List.from(widget.orderItem.selectedToppings);
    selectedAddons = List.from(widget.orderItem.selectedAddons);
    quantity = widget.orderItem.quantity;
  }

  @override
  Widget build(BuildContext context) {
    final menuItem = widget.orderItem.menuItem;

    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              ElevatedButton(
                onPressed: () {
                  widget.onClose(); // Tutup dialog
                },
                child: const Text('Kembali'),
              ),
              const Text(
                'Edit Pesanan',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              ElevatedButton(
                onPressed: () async {
                  // Buat OrderItem baru dengan data yang sudah diubah
                  final editedOrderItem = OrderItemModel(
                    menuItem: widget.orderItem.menuItem,
                    quantity: quantity,
                    selectedToppings: selectedToppings,
                    selectedAddons: selectedAddons,
                  );
                  widget.onEditOrder(editedOrderItem); // Kirim ke OrderNotifier
                  widget.onClose();
                },
                child: const Text('Simpan'),
              ),
            ],
          ),
          const Divider(),
          const SizedBox(height: 16),
          //quantity
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.remove),
                onPressed: () {
                  setState(() {
                    if (quantity > 1) {
                      quantity--;
                    }
                  });
                },
              ),
              Text(
                '$quantity',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: () {
                  setState(() {
                    quantity++;
                  });
                },
              ),
            ],
          ),
          if (menuItem.toppings!.isNotEmpty)
            const Text(
              'Topping:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ..._buildToppingList(menuItem.toppings!, selectedToppings, (topping) {
            setState(() {
              if (selectedToppings.contains(topping)) {
                selectedToppings.remove(topping);
              } else {
                selectedToppings.add(topping);
              }
            });
          }),

          // Pilih Addon (hanya yang tersedia di MenuItem)
          if (menuItem.addons!.isNotEmpty)
            const Text('Addon:', style: TextStyle(fontWeight: FontWeight.bold)),
          ..._buildAddonList(
            menuItem.addons?.whereType<AddonModel>().toList() ?? [],
            selectedAddons,
            (addon, selectedOption) {
              setState(() {
                final index = selectedAddons.indexWhere(
                  (a) => a.id == addon.id,
                );
                if (index != -1) {
                  selectedAddons[index] = addon.copyWith(
                    options: [selectedOption],
                  );
                } else {
                  selectedAddons.add(addon.copyWith(options: [selectedOption]));
                }
              });
            },
          ),
        ],
      ),
    );
  }

  // Build daftar topping
  List<Widget> _buildToppingList(
    List<ToppingModel> availableToppings,
    List<ToppingModel> selectedToppings,
    Function(ToppingModel) onToppingSelected,
  ) {
    return availableToppings.map((topping) {
      return CheckboxListTile(
        title: Text(topping.name!),
        subtitle: Text(formatRupiah(topping.price!)),
        value: selectedToppings.contains(topping),
        onChanged: (value) {
          onToppingSelected(topping);
        },
      );
    }).toList();
  }

  // Build daftar addon
  List<Widget> _buildAddonList(
    List<AddonModel> availableAddons,
    List<AddonModel> selectedAddons,
    Function(AddonModel, AddonOptionModel) onAddonSelected,
  ) {
    return availableAddons.map((addon) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            addon.name!,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          ...addon.options!.map((option) {
            return RadioListTile<AddonOptionModel>(
              title: Text(option.label!),
              value: option,
              groupValue:
                  selectedAddons
                      .firstWhere(
                        (a) => a.id == addon.id,
                        orElse:
                            () => AddonModel(
                              id: '',
                              name: '',
                              type: '',
                              options: [],
                            ),
                      )
                      .options!
                      .firstOrNull,
              onChanged: (value) {
                if (value != null) {
                  onAddonSelected(addon, value);
                }
              },
            );
          }),
        ],
      );
    }).toList();
  }
}
