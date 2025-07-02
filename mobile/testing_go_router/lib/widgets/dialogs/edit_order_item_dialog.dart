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
  //fungsi delete order item
  final Function()? onDeleteOrderItem;

  const EditOrderItemDialog({
    super.key,
    required this.orderItem,
    required this.onEditOrder,
    required this.onClose,
    this.onDeleteOrderItem,
  });

  @override
  EditOrderItemDialogState createState() => EditOrderItemDialogState();
}

class EditOrderItemDialogState extends State<EditOrderItemDialog> {
  late List<ToppingModel> selectedToppings;
  late List<AddonModel> selectedAddons;
  late int quantity;
  late String note;

  @override
  void initState() {
    super.initState();
    // Inisialisasi state dengan data dari OrderItem yang akan diedit
    selectedToppings = List.from(widget.orderItem.selectedToppings);
    selectedAddons = List.from(widget.orderItem.selectedAddons);
    quantity = widget.orderItem.quantity;
    note = widget.orderItem.note ?? '';
  }

  @override
  Widget build(BuildContext context) {
    final menuItem = widget.orderItem.menuItem;

    return Padding(
      padding: MediaQuery.of(context).viewInsets,
      child: Container(
        color: Colors.white,
        padding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            spacing: 16,
            children: [
              //nama menu item dan dapat dihapus,
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    menuItem.name!,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  TextButton.icon(
                    icon: const Icon(Icons.delete),
                    label: const Text('Hapus Item'),
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.red,
                      backgroundColor: Colors.red[50],
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: () {
                      // Tampilkan dialog konfirmasi sebelum menghapus
                      if (widget.onDeleteOrderItem != null) {
                        showDialog(
                          context: context,
                          builder: (context) {
                            return AlertDialog(
                              title: const Text('Hapus Order Item'),
                              content: const Text(
                                'Apakah Anda yakin ingin menghapus item ini?',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                  },
                                  child: const Text('Batal'),
                                ),
                                TextButton(
                                  onPressed: () {
                                    widget.onDeleteOrderItem!();
                                    Navigator.of(context).pop();
                                    widget.onClose(); // Tutup dialog
                                  },
                                  child: const Text('Hapus'),
                                ),
                              ],
                            );
                          },
                        );
                        return;
                      }
                      widget.onClose(); // Tutup dialog
                    },
                  ),
                ],
              ),
              Divider(height: 1, color: Colors.grey[300]),
              const SizedBox(height: 8),
              //quantity
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Jumlah',
                    style: TextStyle(
                      fontWeight: FontWeight.normal,
                      fontSize: 16,
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconButton(
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.green[50],
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        icon: const Icon(Icons.remove),
                        onPressed: () {
                          setState(() {
                            if (quantity > 1) {
                              quantity--;
                            }
                          });
                        },
                      ),
                      Container(
                        padding: const EdgeInsets.all(8.0),
                        width: 80,
                        alignment: Alignment.center,
                        child: Text(
                          '$quantity',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.normal,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          setState(() {
                            quantity++;
                          });
                        },
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.green[50],
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        icon: const Icon(Icons.add),
                      ),
                    ],
                  ),
                ],
              ),
              if (menuItem.toppings!.isNotEmpty)
                const Text(
                  'Topping:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ..._buildToppingList(menuItem.toppings!, selectedToppings, (
                topping,
              ) {
                setState(() {
                  if (selectedToppings.contains(topping)) {
                    selectedToppings.remove(topping);
                  } else {
                    selectedToppings.add(topping);
                  }
                });
              }),
              //divider spacing
              Divider(height: 1, color: Colors.grey[300]),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Catatan',
                    style: TextStyle(
                      fontWeight: FontWeight.normal,
                      fontSize: 16,
                    ),
                  ),
                  // TextField untuk catatan,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        note,
                        style: const TextStyle(fontSize: 16),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit),
                        style: IconButton.styleFrom(
                          foregroundColor: Colors.green,
                          backgroundColor: Colors.green[50],
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder: (context) {
                              return AlertDialog(
                                title: const Text('Catatan'),
                                content: TextField(
                                  controller: TextEditingController(text: note),
                                  autofocus: true,
                                  maxLines: 3,
                                  decoration: const InputDecoration(
                                    hintText: 'Masukkan catatan...',
                                  ),
                                  onChanged: (value) {
                                    note = value;
                                  },
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () {
                                      Navigator.of(context).pop();
                                    },
                                    child: const Text('Simpan'),
                                  ),
                                ],
                              );
                            },
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
              if (menuItem.toppings!.isNotEmpty)
                const Text(
                  'Topping:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ..._buildToppingList(menuItem.toppings!, selectedToppings, (
                topping,
              ) {
                setState(() {
                  if (selectedToppings.contains(topping)) {
                    selectedToppings.remove(topping);
                  } else {
                    selectedToppings.add(topping);
                  }
                });
              }),
              //divider spacing
              Divider(height: 1, color: Colors.grey[300]),
              const SizedBox(height: 16),

              // Pilih Addon (hanya yang tersedia di MenuItem)
              if (menuItem.addons!.isNotEmpty)
                const Text(
                  'Addon:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
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
                      selectedAddons.add(
                        addon.copyWith(options: [selectedOption]),
                      );
                    }
                  });
                },
              ),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                spacing: 16,
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () {
                        widget.onClose(); // Tutup dialog
                      },
                      style: TextButton.styleFrom(
                        backgroundColor: Colors.green[50],
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Batal'),
                    ),
                  ),
                  Expanded(
                    child: TextButton(
                      onPressed: () async {
                        // Buat OrderItem baru dengan data yang sudah diubah
                        final editedOrderItem = OrderItemModel(
                          menuItem: widget.orderItem.menuItem,
                          quantity: quantity,
                          selectedToppings: selectedToppings,
                          selectedAddons: selectedAddons,
                          note: note.isEmpty ? null : note,
                        );
                        widget.onEditOrder(
                          editedOrderItem,
                        ); // Kirim ke OrderNotifier
                        widget.onClose();
                      },
                      style: TextButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Simpan'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
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
