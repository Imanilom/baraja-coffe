import 'package:kasirbaraja/models/user.model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/providers/message_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce/hive.dart';
import 'package:bcrypt/bcrypt.dart';
import 'package:kasirbaraja/widgets/inputs/pin_input.dart';

class LoginCashierScreen extends ConsumerWidget {
  const LoginCashierScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final box = Hive.box('userBox');
    final manager = box.get('user') as UserModel;

    final currentCashier = ref.watch(selectedCashierProvider);

    //membuat isvalidate provider boolean
    final isValid = StateProvider<bool>((ref) => false);

    print('manager: ${manager.phone}');
    print('list cashier: ${manager.cashiers}');

    //menampilkan message
    ref.listen(messageProvider, (previous, next) {
      if (next != null) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(next)));
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
              ref.read(tryAuthProvider.notifier).logout();
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

                final selectedCashier = ref.read(
                  selectedCashierProvider.notifier,
                );
                return ListTile(
                  selected: cashier.username == currentCashier?.username,
                  title: Text(cashier.username!),
                  leading: const Icon(Icons.person),
                  subtitle: Text(cashier.role!),
                  trailing: Icon(
                    cashier.username == currentCashier?.username
                        ? Icons.circle
                        : Icons.arrow_forward,
                  ),
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
                child:
                    currentCashier == null
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
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('PIN salah')),
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
