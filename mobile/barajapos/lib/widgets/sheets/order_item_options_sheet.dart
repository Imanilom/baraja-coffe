import 'package:barajapos/models/adapter/addon.model.dart';
import 'package:barajapos/models/adapter/addon_option.model.dart';
import 'package:collection/collection.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';
import 'package:barajapos/models/adapter/order_item.model.dart';
import 'package:barajapos/providers/orders/order_item_provider.dart';

class OrderItemOptionsSheet extends ConsumerWidget {
  final OrderItemModel orderItem;
  final Function(OrderItemModel) onSubmit;

  const OrderItemOptionsSheet({
    super.key,
    required this.orderItem,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    print('permasalahannya disini ternyata pada providernya');
    final order = ref.watch(orderItemProvider(orderItem));
    final orderNotifier = ref.read(orderItemProvider(orderItem).notifier);

    print(order.selectedAddons
        .map((e) => e.options.map((e) => e.label))
        .toList());
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Quantity Selector,
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Button(
              style: ButtonVariance.secondary,
              onPressed: () => closeSheet(context),
              child: const Text('Kembali'),
            ),
            const Text(
              'Edit Pesanan',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Button(
              style: ButtonVariance.primary,
              onPressed: () {
                print(
                    'length of data addon yang akan di order: ${order.selectedAddons.map((addon) => addon.options.map((option) => option.label)).toList()}');
                print('data order: ${order.menuItem}');
                onSubmit(order);
                closeSheet(context);
              },
              child: const Text('Simpan'),
            ),
          ],
        ),
        const Divider(),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(
              variance: ButtonVariance.primary,
              icon: const Icon(Icons.remove),
              onPressed: () => orderNotifier.setQuantity(order.quantity - 1),
            ),
            Text(
              '${order.quantity}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            IconButton(
              variance: ButtonVariance.primary,
              icon: const Icon(Icons.add),
              onPressed: () => orderNotifier.setQuantity(order.quantity + 1),
            ),
          ],
        ),

        // Topping Selection
        if (order.menuItem.toppings!.isNotEmpty)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Topping:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              ...order.menuItem.toppings!.map((topping) => Checkbox(
                    state: order.selectedToppings.contains(topping)
                        ? CheckboxState.checked
                        : CheckboxState.unchecked,
                    trailing: Text(topping.name),
                    onChanged: (value) => orderNotifier.toggleTopping(topping),
                  )),
            ],
          ),

        // Addon Selection
        if (order.menuItem.addons!.isNotEmpty) const Text('data'),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ...order.menuItem.addons!.map(
              (addon) {
                // // Gunakan defaultOption jika ada, jika tidak biarkan kosong
                // final AddonOptionModel selectedOption =
                //     addon.options.firstWhere(
                //   (option) => option.isDefault == true,
                //   orElse: () => AddonOptionModel(
                //       id: '',
                //       label: '',
                //       price: 0,
                //       isDefault: false), // Jika tidak ada default, biarkan null
                // );
                final AddonOptionModel? selectedOption = addon.options
                    .firstWhereOrNull((option) => option.isDefault == true);
                print('selectedOption: $selectedOption');

                return RadioGroup<AddonOptionModel>(
                  value: selectedOption,
                  onChanged: (value) {
                    print('value: $value');
                    print('addon: $addon');
                    orderNotifier.selectAddon(addon, value);
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        addon.name,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      ...addon.options.map(
                        (option) => RadioItem(
                          value: option,
                          trailing: Text(option.label),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        )
      ],
    );
  }
}
