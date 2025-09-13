// test/performance/order_item_performance_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:kasirbaraja/extentions/order_item_extensions.dart';
import 'package:kasirbaraja/models/addon_option.model.dart';
import 'package:kasirbaraja/models/order_item.model.dart';
import 'package:kasirbaraja/models/menu_item.model.dart';
import 'package:kasirbaraja/models/topping.model.dart';
import 'package:kasirbaraja/models/addon.model.dart';
import 'package:kasirbaraja/utils/order_item_utils.dart';

void main() {
  group('OrderItem Performance Comparison', () {
    late List<OrderItemModel> testOrderItems;
    late OrderItemModel targetItem;

    // Setup data test
    setUpAll(() {
      testOrderItems = _createTestOrderItems(1000); // 1000 items untuk test
      targetItem = testOrderItems[500]; // target di tengah list
    });

    test('Extensions vs Utils - findSimilarItemIndex Performance', () {
      const iterations = 1000;

      // Test Extensions approach
      final extensionsStopwatch = Stopwatch()..start();
      for (int i = 0; i < iterations; i++) {
        testOrderItems.findSimilarItemIndex(targetItem);
      }
      extensionsStopwatch.stop();

      // Test Utils approach
      final utilsStopwatch = Stopwatch()..start();
      for (int i = 0; i < iterations; i++) {
        OrderItemUtils.findExistingOrderItemIndex(testOrderItems, targetItem);
      }
      utilsStopwatch.stop();

      // Print hasil
      print('\n=== Performance Comparison Results ===');
      print(
        'Extensions approach: ${extensionsStopwatch.elapsedMicroseconds} microseconds',
      );
      print(
        'Utils approach: ${utilsStopwatch.elapsedMicroseconds} microseconds',
      );
      print(
        'Difference: ${(extensionsStopwatch.elapsedMicroseconds - utilsStopwatch.elapsedMicroseconds).abs()} microseconds',
      );

      if (extensionsStopwatch.elapsedMicroseconds <
          utilsStopwatch.elapsedMicroseconds) {
        print('✅ Extensions is faster');
      } else if (utilsStopwatch.elapsedMicroseconds <
          extensionsStopwatch.elapsedMicroseconds) {
        print('✅ Utils is faster');
      } else {
        print('⚖️ Both approaches have similar performance');
      }
    });

    test('Extensions vs Utils - findSimilarItemIndexExcept Performance', () {
      const iterations = 1000;
      const excludeIndex = 250;

      // Test Extensions approach
      final extensionsStopwatch = Stopwatch()..start();
      for (int i = 0; i < iterations; i++) {
        testOrderItems.findSimilarItemIndexExcept(targetItem, excludeIndex);
      }
      extensionsStopwatch.stop();

      // Test Utils approach
      final utilsStopwatch = Stopwatch()..start();
      for (int i = 0; i < iterations; i++) {
        OrderItemUtils.findExistingOrderItemIndexExcept(
          testOrderItems,
          targetItem,
          excludeIndex,
        );
      }
      utilsStopwatch.stop();

      // Print hasil
      print('\n=== Performance Comparison Results (Except Method) ===');
      print(
        'Extensions approach: ${extensionsStopwatch.elapsedMicroseconds} microseconds',
      );
      print(
        'Utils approach: ${utilsStopwatch.elapsedMicroseconds} microseconds',
      );
      print(
        'Difference: ${(extensionsStopwatch.elapsedMicroseconds - utilsStopwatch.elapsedMicroseconds).abs()} microseconds',
      );

      if (extensionsStopwatch.elapsedMicroseconds <
          utilsStopwatch.elapsedMicroseconds) {
        print('✅ Extensions is faster');
      } else if (utilsStopwatch.elapsedMicroseconds <
          extensionsStopwatch.elapsedMicroseconds) {
        print('✅ Utils is faster');
      } else {
        print('⚖️ Both approaches have similar performance');
      }
    });

    test('Extensions vs Utils - Item Similarity Check Performance', () {
      const iterations = 10000;
      final item1 = testOrderItems[0];
      final item2 = testOrderItems[1];

      // Test Extensions approach
      final extensionsStopwatch = Stopwatch()..start();
      for (int i = 0; i < iterations; i++) {
        item1.isSimilarTo(item2);
      }
      extensionsStopwatch.stop();

      // Test Utils approach
      final utilsStopwatch = Stopwatch()..start();
      for (int i = 0; i < iterations; i++) {
        OrderItemUtils.areOrderItemsEqual(item1, item2);
      }
      utilsStopwatch.stop();

      // Print hasil
      print('\n=== Performance Comparison Results (Similarity Check) ===');
      print(
        'Extensions approach: ${extensionsStopwatch.elapsedMicroseconds} microseconds',
      );
      print(
        'Utils approach: ${utilsStopwatch.elapsedMicroseconds} microseconds',
      );
      print(
        'Difference: ${(extensionsStopwatch.elapsedMicroseconds - utilsStopwatch.elapsedMicroseconds).abs()} microseconds',
      );

      if (extensionsStopwatch.elapsedMicroseconds <
          utilsStopwatch.elapsedMicroseconds) {
        print('✅ Extensions is faster');
      } else if (utilsStopwatch.elapsedMicroseconds <
          extensionsStopwatch.elapsedMicroseconds) {
        print('✅ Utils is faster');
      } else {
        print('⚖️ Both approaches have similar performance');
      }
    });

    // Test untuk memastikan kedua approach memberikan hasil yang sama
    test('Both approaches should return same results', () {
      // Test findSimilarItemIndex
      final extensionResult = testOrderItems.findSimilarItemIndex(targetItem);
      final utilsResult = OrderItemUtils.findExistingOrderItemIndex(
        testOrderItems,
        targetItem,
      );
      expect(
        extensionResult,
        equals(utilsResult),
        reason: 'findSimilarItemIndex should return same result',
      );

      // Test findSimilarItemIndexExcept
      const excludeIndex = 250;
      final extensionResultExcept = testOrderItems.findSimilarItemIndexExcept(
        targetItem,
        excludeIndex,
      );
      final utilsResultExcept = OrderItemUtils.findExistingOrderItemIndexExcept(
        testOrderItems,
        targetItem,
        excludeIndex,
      );
      expect(
        extensionResultExcept,
        equals(utilsResultExcept),
        reason: 'findSimilarItemIndexExcept should return same result',
      );

      // Test similarity check
      final item1 = testOrderItems[0];
      final item2 = testOrderItems[1];
      final extensionSimilarity = item1.isSimilarTo(item2);
      final utilsSimilarity = OrderItemUtils.areOrderItemsEqual(item1, item2);
      expect(
        extensionSimilarity,
        equals(utilsSimilarity),
        reason: 'Similarity check should return same result',
      );
    });
  });
}

// Helper function untuk membuat test data
List<OrderItemModel> _createTestOrderItems(int count) {
  final items = <OrderItemModel>[];

  for (int i = 0; i < count; i++) {
    // Buat menu item
    final menuItem = MenuItemModel(
      id: 'menu_$i',
      name: 'Menu Item $i',
      originalPrice: 10000 + (i * 1000),
      // tambahkan field lain sesuai model Anda
    );

    // Buat toppings (variasi untuk testing)
    final toppings = <ToppingModel>[];
    if (i % 3 == 0) {
      toppings.add(
        ToppingModel(id: 'topping_1', name: 'Extra Cheese', price: 5000),
      );
    }
    if (i % 5 == 0) {
      toppings.add(
        ToppingModel(id: 'topping_2', name: 'Extra Spicy', price: 2000),
      );
    }

    // Buat addons (variasi untuk testing)
    final addons = <AddonModel>[];
    if (i % 7 == 0) {
      addons.add(
        AddonModel(
          id: 'addon_1',
          name: 'Extra Sauce',
          options: [
            AddonOptionModel(id: 'option_1', label: 'Chili Sauce'),
            AddonOptionModel(id: 'option_2', label: 'Mayo'),
          ],
        ),
      );
    }

    // Buat order item
    final orderItem = OrderItemModel(
      menuItem: menuItem,
      quantity: 1,
      selectedToppings: toppings,
      selectedAddons: addons,
      notes: i % 10 == 0 ? 'Special notes for item $i' : null,
    );

    items.add(orderItem);
  }

  return items;
}
