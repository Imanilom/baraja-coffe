import 'package:barajapos/models/menu_item_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';
import 'package:barajapos/models/order_item_model.dart';
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
    final order = ref.watch(orderItemProvider(orderItem));
    final orderNotifier = ref.read(orderItemProvider(orderItem).notifier);

    print(order.selectedAddons.isNotEmpty
        ? order.selectedAddons
            .map((e) => e.options.map((e) => e.label))
            .toList()
        : []);
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
                print(order.selectedAddons.length);
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
        if (order.menuItem.toppings.isNotEmpty)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Topping:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              ...order.menuItem.toppings.map((topping) => Checkbox(
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
                // Gunakan defaultOption jika ada, jika tidak biarkan kosong
                final selectedOption = order.selectedAddons
                    .firstWhere(
                      (a) => a.id == addon.id,
                      orElse: () => AddonModel(
                        id: '',
                        name: '',
                        type: '',
                        options: [],
                      ),
                    )
                    .options
                    .firstOrNull;
                return RadioGroup(
                  value: selectedOption,
                  onChanged: (value) {
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
