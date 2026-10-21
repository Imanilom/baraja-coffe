import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_app/main.dart';
import 'package:provider/provider.dart';
import 'package:flutter_app/controllers/display_controller.dart';

void main() {
  testWidgets('Customer Display App Smoke Test', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => DisplayController(),
        child: const CustomerDisplayApp(),
      ),
    );

    // Verify main brand heading is rendered
    expect(find.text('BARAJA COFFEE'), findsOneWidget);
  });
}
