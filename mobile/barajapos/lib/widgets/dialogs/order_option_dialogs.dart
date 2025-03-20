// import 'package:barajapos/models/order_detail_model.dart';
import 'package:barajapos/utils/format_rupiah.dart';
import 'package:flutter/material.dart';
import 'package:barajapos/models/menu_item_model.dart';
import 'package:barajapos/models/order_item_model.dart';

class OrderOptionDialogs extends StatefulWidget {
  final MenuItemModel menuItem;
  final Function(OrderItemModel) onAddToOrder;

  const OrderOptionDialogs({
    super.key,
    required this.menuItem,
    required this.onAddToOrder,
  });

  @override
  OrderOptionDialogsState createState() => OrderOptionDialogsState();
}

class OrderOptionDialogsState extends State<OrderOptionDialogs> {
  List<ToppingModel> selectedToppings = [];
  List<AddonModel> selectedAddons = [];
  int quantity = 1;

  @override
  void initState() {
    super.initState();
    _initializeDefaultAddons();
  }

  void _initializeDefaultAddons() {
    setState(() {
      selectedAddons = widget.menuItem.addons!.map((addon) {
        return addon.copyWith(options: [addon.options.first]);
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Pilih Topping & Addon untuk ${widget.menuItem.name}'),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Counter Quantity
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove),
                    onPressed: () {
                      setState(() {
                        if (quantity > 1) {
                          quantity--; // Kurangi quantity
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
                        quantity++; // Tambah quantity
                      });
                    },
                  ),
                ],
              ),
            ),
            // Pilih Topping,
            if (widget.menuItem.toppings.isNotEmpty)
              const Text(
                'Topping',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),

            ..._buildToppingList(selectedToppings, (ToppingModel topping) {
              setState(() {
                if (selectedToppings.contains(topping)) {
                  selectedToppings.remove(topping);
                } else {
                  selectedToppings.add(topping);
                }
              });
            }),

            // Pilih Addon
            ..._buildAddonList(selectedAddons, (addon, selectedOption) {
              setState(() {
                final index =
                    selectedAddons.indexWhere((a) => a.id == addon.id);
                if (index != -1) {
                  // Jika addon sudah dipilih, update opsi yang dipilih
                  selectedAddons[index] =
                      addon.copyWith(options: [selectedOption]);
                } else {
                  // Jika addon belum dipilih, tambahkan ke daftar
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
            // Buat OrderItem dan panggil callback
            print(
              'OrderItem: ${selectedToppings.map((topping) => topping.name)}, ${selectedAddons.map((addon) => addon.name)}',
            );
            final orderItem = OrderItemModel(
              menuItem: widget.menuItem,
              selectedToppings: selectedToppings,
              selectedAddons: selectedAddons,
              quantity: quantity,
            );
            widget.onAddToOrder(orderItem);
            Navigator.pop(context);
          },
          child: const Text('Tambahkan'),
        ),
      ],
    );
  }

  // Build daftar topping
  List<Widget> _buildToppingList(List<ToppingModel> selectedToppings,
      Function(ToppingModel) onToppingSelected) {
    // Contoh data topping (bisa diganti dengan data dari API)
    // data toping diambil dari menu item itu sendiri
    final toppings = widget.menuItem.toppings;

    return toppings.map((topping) {
      return CheckboxListTile(
        title: Text(topping.name),
        subtitle: Text(formatRupiah(topping.price)),
        value: selectedToppings.contains(topping),
        onChanged: (value) {
          onToppingSelected(topping);
        },
      );
    }).toList();
  }

  // Build daftar addon
  List<Widget> _buildAddonList(List<AddonModel> selectedAddons,
      Function(AddonModel, AddonOptionModel) onAddonSelected) {
    // Contoh data addon (bisa diganti dengan data dari API)
    final addons = widget.menuItem.addons!;
    print(addons);
    return addons.map((addon) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(addon.name, style: const TextStyle(fontWeight: FontWeight.bold)),
          ...addon.options.map((option) {
            return RadioListTile<AddonOptionModel>(
              title: Text(option.label),
              subtitle: Text(formatRupiah(option.price)),
              value: option,
              groupValue: selectedAddons
                  .firstWhere((a) => a.id == addon.id,
                      orElse: () =>
                          addon.copyWith(options: [addon.options.first]))
                  .options
                  .firstOrNull,
              onChanged: (value) {
                if (value != null) {
                  onAddonSelected(addon, value);
                }
              },
              //letakkan radiobuttonnya di kanan,
              controlAffinity: ListTileControlAffinity.trailing,
            );
          }),
        ],
      );
    }).toList();
  }
}
