import 'package:barajapos/models/adapter/user.model.dart';
import 'package:barajapos/providers/auth_provider.dart';
import 'package:barajapos/providers/message_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce/hive.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart' as shadcn;
import 'package:bcrypt/bcrypt.dart';
import 'package:barajapos/widgets/inputs/pin_input.dart';

class LoginCashierScreen extends ConsumerWidget {
  const LoginCashierScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final box = Hive.box('userBox');
    final manager = box.get('user') as UserModel;

    final currentCashier = ref.watch(selectedCashierProvider);

    //membuat isvalidate provider boolean
    final isValid = StateProvider<bool>((ref) => false);

    //menampilkan message
    ref.listen(messageProvider, (previous, next) {
      if (next != null) {
        shadcn.showToast(
          context: context,
          builder: (context, overlay) => shadcn.SurfaceCard(
            child: shadcn.Basic(
              title: Text(next),
              trailingAlignment: Alignment.center,
            ),
          ),
          location: shadcn.ToastLocation.bottomCenter,
        );
      }
      //clear message
      ref.read(messageProvider.notifier).clearMessage();
    });

    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: Row(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: manager.cashiers!.length,
              itemBuilder: (context, index) {
                final cashier = manager.cashiers![index];

                final selectedCashier =
                    ref.read(selectedCashierProvider.notifier);
                return ListTile(
                  selected: cashier.username == currentCashier?.username,
                  title: Text(cashier.username!),
                  leading: const Icon(Icons.person),
                  subtitle: Text(cashier.role!),
                  trailing: Icon(cashier.username == currentCashier?.username
                      ? Icons.circle
                      : Icons.arrow_forward),
                  onTap: () {
                    selectedCashier.state = null;
                    selectedCashier.state = cashier;
                  },
                );
              },
            ),
          ),
          Expanded(
            child: Container(
              color: Colors.grey[200],
              child: Center(
                child: currentCashier == null
                    ? const Text('Pilih kasir untuk masuk')
                    : Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: PinInput(
                          pinLength: 4,
                          onCompleted: (pin) async {
                            ref.read(isValid.notifier).state = BCrypt.checkpw(
                              pin.toString(),
                              currentCashier.password!,
                            );

                            if (ref.watch(isValid)) {
                              ref
                                  .read(authCashierProvider.notifier)
                                  .login(currentCashier);
                            } else {
                              shadcn.showToast(
                                context: context,
                                builder: (context, overlay) =>
                                    const shadcn.SurfaceCard(
                                  child: shadcn.Basic(
                                    title: Text('PIN Salah'),
                                    trailingAlignment: Alignment.center,
                                  ),
                                ),
                                location: shadcn.ToastLocation.bottomCenter,
                              );
                            }
                            return ref.watch(isValid);
                          },
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
