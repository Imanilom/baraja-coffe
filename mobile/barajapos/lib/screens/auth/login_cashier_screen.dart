import 'package:barajapos/models/adapter/user.model.dart';
import 'package:barajapos/providers/auth_provider.dart';
import 'package:barajapos/providers/message_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_ce/hive.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart' as shadcn;
// import 'package:barajapos/models/user_model.dart';
// import 'package:barajapos/services/hive_service.dart';
import 'package:bcrypt/bcrypt.dart';

class LoginCashierScreen extends ConsumerWidget {
  const LoginCashierScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final box = Hive.box('userBox');
    final manager = box.get('user') as UserModel;

    final currentCashier = ref.watch(selectedCashierProvider);

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
      body: Row(children: [
        Expanded(
          child: ListView.builder(
            itemCount: manager.cashiers!.length,
            itemBuilder: (context, index) {
              final cashier = manager.cashiers![index];

              final selectedCashier =
                  ref.read(selectedCashierProvider.notifier);
              return ListTile(
                title: Text(cashier.username!),
                leading: const Icon(Icons.person),
                trailing: const Icon(Icons.arrow_forward),
                subtitle: Text(cashier.role!),
                onTap: () {
                  selectedCashier.state = null;
                  selectedCashier.state = cashier;
                  context.go('/pin-input');
                },
              );
            },
          ),
        ),
        // Expanded(
        //   child: SingleChildScrollView(
        //     keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        //     child: Center(
        //       child: currentCashier == null
        //           ? const Text('Pilih kasir untuk login')
        //           : Card(
        //               child: Column(
        //                 mainAxisSize: MainAxisSize.min,
        //                 children: [
        //                   const Text('Masukan PIN'),
        //                   InputOTP(
        //                     onChanged: (value) {},
        //                     onSubmitted: (value) {
        //                       print('value: ${value.otpToString()}');
        //                       // ref.read(authCashierProvider.notifier).login(cashier);
        //                       bool isValid = BCrypt.checkpw(
        //                         value.otpToString(),
        //                         currentCashier.password!,
        //                       );

        //                       if (isValid) {
        //                         // Simpan kasir ke state
        //                         print('passwordnya benar');
        //                         ref
        //                             .read(authCashierProvider.notifier)
        //                             .login(currentCashier);
        //                         // context.go('/main'); // Pindah ke halaman utama
        //                       } else {
        //                         showToast(
        //                           context: context,
        //                           builder: (context, overlay) =>
        //                               const SurfaceCard(
        //                             child: Basic(
        //                               title: Text('pin Salah'),
        //                               trailingAlignment: Alignment.center,
        //                             ),
        //                           ),
        //                           location: ToastLocation.bottomCenter,
        //                         );
        //                       }
        //                     },
        //                     children: [
        //                       InputOTPChild.character(
        //                         allowDigit: true,
        //                         obscured: true,
        //                       ),
        //                       InputOTPChild.character(
        //                         allowDigit: true,
        //                         obscured: true,
        //                       ),
        //                       InputOTPChild.character(
        //                         allowDigit: true,
        //                         obscured: true,
        //                       ),
        //                       InputOTPChild.character(
        //                         allowDigit: true,
        //                         obscured: true,
        //                       ),
        //                     ],
        //                   ),
        //                 ],
        //               ).gap(8),
        //             ),
        //     ),
        //   ),
        // ),
      ]),
    );
  }
}
