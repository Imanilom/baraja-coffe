import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart';

class PinInputScreen extends ConsumerWidget {
  const PinInputScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const Scaffold(
      child: Center(
        child: Text('Pin Input'),
      ),
    );
  }
}
