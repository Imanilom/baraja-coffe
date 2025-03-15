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
  List<AddOnOptionModel> selectedAddons = [];

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Pilih Topping & Addon untuk ${widget.menuItem.name}'),
      content: SingleChildScrollView(
        child: Column(
          children: [
            // Pilih Topping
            const Text('Topping:',
                style: TextStyle(fontWeight: FontWeight.bold)),
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
            ..._buildAddonList(selectedAddons, (AddOnOptionModel addon) {
              setState(() {
                if (selectedAddons.contains(addon)) {
                  selectedAddons.remove(addon);
                } else {
                  selectedAddons.add(addon);
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
            final orderItem = OrderItemModel(
              menuItem: widget.menuItem,
              selectedToppings: selectedToppings,
              selectedAddons: selectedAddons,
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
  List<Widget> _buildAddonList(List<AddOnOptionModel> selectedAddons,
      Function(AddOnOptionModel) onAddonSelected) {
    // Contoh data addon (bisa diganti dengan data dari API)
    final addons = widget.menuItem.addOns;

    return addons.map((addon) {
      return ExpansionTile(
        title: Text(addon.name),
        children: addon.options.map((option) {
          return CheckboxListTile(
            title: Text(option.label),
            subtitle: Text(formatRupiah(option.price)),
            value: selectedAddons.contains(option),
            onChanged: (value) {
              onAddonSelected(option);
            },
          );
        }).toList(),
      );
    }).toList();
  }
}
