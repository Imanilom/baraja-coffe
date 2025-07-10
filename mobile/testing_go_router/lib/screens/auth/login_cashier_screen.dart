import 'package:kasirbaraja/models/user.model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/providers/message_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce/hive.dart';
import 'package:bcrypt/bcrypt.dart';
import 'package:kasirbaraja/widgets/inputs/pin_input.dart';

class ModernLoginCashierScreen extends ConsumerWidget {
  const ModernLoginCashierScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final box = Hive.box('userBox');
    final manager = box.get('user') as UserModel;
    final currentCashier = ref.watch(selectedCashierProvider);
    final isValid = StateProvider<bool>((ref) => false);

    // Menampilkan message
    ref.listen(messageProvider, (previous, next) {
      if (next != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.black87,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
      ref.read(messageProvider.notifier).clearMessage();
    });

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Expanded(
                    child: _buildMainContent(
                      context,
                      ref,
                      manager,
                      currentCashier,
                      isValid,
                      constraints,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildMainContent(
    BuildContext context,
    WidgetRef ref,
    UserModel manager,
    dynamic currentCashier,
    StateProvider<bool> isValid,
    BoxConstraints constraints,
  ) {
    final isLandscape = constraints.maxWidth > constraints.maxHeight;

    return isLandscape
        ? Row(
          children: [
            Expanded(
              child: _buildCashierList(context, ref, manager, currentCashier),
            ),
            const SizedBox(width: 24),
            Expanded(
              child: _buildPinSection(context, ref, currentCashier, isValid),
            ),
          ],
        )
        : Column(
          children: [
            Expanded(
              child: _buildCashierList(context, ref, manager, currentCashier),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: _buildPinSection(context, ref, currentCashier, isValid),
            ),
          ],
        );
  }

  Widget _buildCashierList(
    BuildContext context,
    WidgetRef ref,
    UserModel manager,
    dynamic currentCashier,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                const Icon(Icons.people, color: Colors.green),
                const SizedBox(width: 12),
                const Text(
                  'Pilih Kasir',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF111827),
                  ),
                ),
                const Spacer(),
                IconButton(
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.red[50],
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.red[200]!),
                    ),
                  ),
                  icon: const Icon(Icons.logout_rounded, color: Colors.red),
                  onPressed: () {
                    ref.read(tryAuthProvider.notifier).logout();
                  },
                ),
              ],
            ),
          ),
          Divider(color: Colors.grey[200], thickness: 1),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: manager.cashiers!.length,
              itemBuilder: (context, index) {
                final cashier = manager.cashiers![index];
                final isSelected = cashier.username == currentCashier?.username;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.green : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color:
                          isSelected ? Colors.transparent : Colors.grey[200]!,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ListTile(
                    leading: Icon(
                      Icons.person,
                      color:
                          isSelected ? Colors.white : const Color(0xFF111827),
                    ),
                    title: Text(
                      cashier.username ?? '',
                      style: TextStyle(
                        color:
                            isSelected ? Colors.white : const Color(0xFF111827),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    subtitle: Text(
                      cashier.role ?? '',
                      style: TextStyle(
                        color: isSelected ? Colors.white70 : Colors.grey[600],
                      ),
                    ),
                    trailing: Icon(
                      isSelected ? Icons.check_circle : Icons.arrow_forward_ios,
                      color: isSelected ? Colors.white : Colors.grey[400],
                      size: 18,
                    ),
                    onTap: () {
                      ref.read(selectedCashierProvider.notifier).state =
                          cashier;
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPinSection(
    BuildContext context,
    WidgetRef ref,
    dynamic currentCashier,
    StateProvider<bool> isValid,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child:
          currentCashier == null
              ? const Center(
                child: Text(
                  'Pilih kasir terlebih dahulu',
                  style: TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              )
              : SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Masukkan PIN Anda',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(height: 24),
                      ModernPinInput(
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
                              SnackBar(
                                content: const Text('PIN salah'),
                                backgroundColor: Colors.red[600],
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            );
                          }
                          return ref.watch(isValid);
                        },
                      ),
                    ],
                  ),
                ),
              ),
    );
  }
}
