import 'package:flutter/material.dart';
import 'package:barajapos/models/menu_item_model.dart';
import 'package:barajapos/models/order_item_model.dart';

class EditOrderItemDialog extends StatefulWidget {
  final OrderItemModel orderItem;
  final Function(OrderItemModel) onEditOrder;

  const EditOrderItemDialog({
    super.key,
    required this.orderItem,
    required this.onEditOrder,
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

    return AlertDialog(
      title: Text('Edit Pesanan ${menuItem.name}'),
      content: SingleChildScrollView(
        child: Column(
          children: [
            // Counter Quantity
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
                      fontSize: 18, fontWeight: FontWeight.bold),
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

            // Pilih Topping (hanya yang tersedia di MenuItem)
            if (menuItem.toppings.isNotEmpty)
              const Text('Topping:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
            ..._buildToppingList(menuItem.toppings, selectedToppings,
                (topping) {
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
              const Text('Addon:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
            ..._buildAddonList(
                menuItem.addons?.whereType<AddonModel>().toList() ?? [],
                selectedAddons, (addon, selectedOption) {
              setState(() {
                final index =
                    selectedAddons.indexWhere((a) => a.id == addon.id);
                if (index != -1) {
                  selectedAddons[index] =
                      addon.copyWith(options: [selectedOption]);
                } else {
                  selectedAddons.add(addon.copyWith(options: [selectedOption]));
                }
              });
            }),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text('Batal'),
        ),
        TextButton(
          onPressed: () {
            // Buat OrderItem baru dengan data yang sudah diubah
            final editedOrderItem = OrderItemModel(
              menuItem: widget.orderItem.menuItem,
              quantity: quantity,
              selectedToppings: selectedToppings,
              selectedAddons: selectedAddons,
            );
            widget.onEditOrder(editedOrderItem); // Kirim ke OrderNotifier
            Navigator.pop(context);
          },
          child: const Text('Simpan'),
        ),
      ],
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
        title: Text(topping.name),
        subtitle: Text('\$${topping.price}'),
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
          Text(addon.name, style: const TextStyle(fontWeight: FontWeight.bold)),
          ...addon.options.map((option) {
            return RadioListTile<AddonOptionModel>(
              title: Text(option.label),
              value: option,
              groupValue: selectedAddons
                  .firstWhere((a) => a.id == addon.id,
                      orElse: () =>
                          AddonModel(id: '', name: '', type: '', options: []))
                  .options
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
