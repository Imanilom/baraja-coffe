import 'package:kasirbaraja/models/device.model.dart';
import 'package:kasirbaraja/models/user.model.dart';
import 'package:kasirbaraja/providers/auth_provider.dart';
import 'package:kasirbaraja/providers/message_provider.dart';
import 'package:kasirbaraja/utils/app_logger.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce/hive.dart';
import 'package:bcrypt/bcrypt.dart';
import 'package:kasirbaraja/services/notification_service.dart';
import 'package:kasirbaraja/widgets/inputs/pin_input.dart';
import 'package:permission_handler/permission_handler.dart';

//loading state provider
final isLoading = StateProvider<bool>((ref) => false);
final isValid = StateProvider<bool>((ref) => false);

class ModernLoginCashierScreen extends ConsumerStatefulWidget {
  const ModernLoginCashierScreen({super.key});

  @override
  ConsumerState<ModernLoginCashierScreen> createState() =>
      _ModernLoginCashierScreenState();
}

class _ModernLoginCashierScreenState
    extends ConsumerState<ModernLoginCashierScreen> {
  @override
  void initState() {
    super.initState();
    debugCheckNotifPermission();
    _initNotification(); // panggil init di sini
  }

  Future<void> debugCheckNotifPermission() async {
    final s = await Permission.notification.status;
    AppLogger.debug('Notification Permission Status: ${s.name}');
  }

  Future<void> _initNotification() async {
    try {
      // 1. Init Notification Service
      await NotificationService.init();

      // 2. Request permission (Android 13+)
      final status = await Permission.notification.status;
      if (status.isDenied || status.isPermanentlyDenied) {
        final result = await Permission.notification.request();
        if (result.isPermanentlyDenied && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Aktifkan izin notifikasi di Pengaturan agar kasir menerima pesanan baru.',
              ),
            ),
          );
          // Optional: buka settings jika mau
          // await openAppSettings();
        }
      }

      AppLogger.debug('Notifikasi berhasil diinisialisasi');
    } catch (e) {
      AppLogger.error('Gagal inisialisasi notifikasi', error: e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final box = Hive.box('userBox');
    final manager = box.get('user') as UserModel;
    final currentCashier = ref.watch(selectedCashierProvider);
    final currentDevice = ref.watch(selectedDeviceProvider);

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

    // Di dalam build method, tambahkan listener untuk loading state
    ref.listen<AsyncValue<bool>>(cashierLoginToDeviceProvider, (
      previous,
      next,
    ) {
      next.whenOrNull(
        loading: () {
          // Tampilkan loading indicator
          showDialog(
            context: context,
            barrierDismissible: false,
            builder:
                (context) => const AlertDialog(
                  content: Row(
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(width: 16),
                      Text('Login ke device...'),
                    ],
                  ),
                ),
          );
        },
        data: (success) {
          // Sembunyikan loading indicator
          Navigator.of(context).pop();
        },
        error: (error, stack) {
          // Sembunyikan loading indicator
          Navigator.of(context).pop();
        },
      );
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
                      currentDevice,
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
    DeviceModel? currentDevice,
    StateProvider<bool> isValid,
    BoxConstraints constraints,
  ) {
    final isLandscape = constraints.maxWidth > constraints.maxHeight;

    if (isLandscape) {
      return Row(
        children: [
          Expanded(
            child: _buildCashierList(context, ref, manager, currentCashier),
          ),
          const SizedBox(width: 24),
          Expanded(
            child: _buildDeviceAndPinSection(
              context,
              ref,
              currentCashier,
              currentDevice,
              isValid,
            ),
          ),
        ],
      );
    } else {
      return Column(
        children: [
          Expanded(
            child: _buildCashierList(context, ref, manager, currentCashier),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: _buildDeviceAndPinSection(
              context,
              ref,
              currentCashier,
              currentDevice,
              isValid,
            ),
          ),
        ],
      );
    }
  }

  Widget _buildDeviceAndPinSection(
    BuildContext context,
    WidgetRef ref,
    dynamic currentCashier,
    DeviceModel? currentDevice,
    StateProvider<bool> isValid,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: _buildSectionContent(
        context,
        ref,
        currentCashier,
        currentDevice,
        isValid,
      ),
    );
  }

  Widget _buildSectionContent(
    BuildContext context,
    WidgetRef ref,
    dynamic currentCashier,
    DeviceModel? currentDevice,
    StateProvider<bool> isValid,
  ) {
    // Step 1: Pilih Cashier
    if (currentCashier == null) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.person_outline, size: 48, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'Pilih kasir terlebih dahulu',
              style: TextStyle(
                color: Color(0xFF111827),
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    // Step 2: Pilih Device
    if (currentDevice == null) {
      // final devices = ref.watch(devicesProvider);

      return _buildDeviceSelection(ref, currentCashier);

      // return devices.when(
      //   data: (devices) => _buildDeviceSelection(ref, devices, currentCashier),
      //   loading: () => const Center(child: CircularProgressIndicator()),
      //   error: (_, __) => const Center(child: Text('Error')),
      // );
    }

    // Step 3: Input PIN
    return _buildPinInputSection(
      context,
      ref,
      currentCashier,
      currentDevice,
      isValid,
    );
  }

  Widget _buildDeviceSelection(
    WidgetRef ref,
    // List<DeviceModel> devices,
    dynamic currentCashier,
  ) {
    final devices = ref.watch(devicesProvider);

    return Column(
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.all(24),
          child: Row(
            children: [
              const Icon(Icons.devices, color: Colors.green),
              const SizedBox(width: 12),
              const Text(
                'Pilih Device',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF111827),
                ),
              ),
              const Spacer(),
              // Tombol untuk reset pilihan cashier
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.grey),
                onPressed: () {
                  ref.read(selectedCashierProvider.notifier).state = null;
                },
                tooltip: 'Kembali ke pilihan kasir',
              ),
            ],
          ),
        ),
        Divider(color: Colors.grey[200], thickness: 1),

        // Daftar Device
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              final future = ref.refresh(devicesProvider.future);
              await future;
            },
            child: devices.when(
              loading: () => _buildSkeletonDeviceSelection(),
              error: (_, __) => const Center(child: Text('Error')),
              data:
                  (devices) =>
                      devices.isEmpty
                          ? const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.devices_other_rounded,
                                  size: 48,
                                  color: Colors.grey,
                                ),
                                SizedBox(height: 16),
                                Text(
                                  'Tidak ada device tersedia',
                                  style: TextStyle(
                                    color: Color(0xFF6B7280),
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                          )
                          : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: devices.length,
                            itemBuilder: (context, index) {
                              final device = devices[index];
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey[200]!),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: 0.05,
                                      ),
                                      blurRadius: 8,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: ListTile(
                                  leading: Icon(
                                    Icons.tablet_android,
                                    color:
                                        device.isOnline
                                            ? Colors.green
                                            : Colors.grey,
                                  ),
                                  title: Text(
                                    device.deviceName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF111827),
                                    ),
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        device.location,
                                        style: TextStyle(
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.circle,
                                            size: 8,
                                            color:
                                                device.isOnline
                                                    ? Colors.green
                                                    : Colors.red,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            device.isOnline
                                                ? 'Online'
                                                : 'Offline',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color:
                                                  device.isOnline
                                                      ? Colors.green
                                                      : Colors.red,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  trailing: const Icon(
                                    Icons.arrow_forward_ios,
                                    size: 16,
                                  ),
                                  onTap: () {
                                    if (device.isAvailable) {
                                      ref
                                          .read(selectedDeviceProvider.notifier)
                                          .state = device;
                                    } else {
                                      if (!context.mounted) return;
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(
                                          content: const Text(
                                            'Device tidak tersedia',
                                          ),
                                          backgroundColor: Colors.orange[600],
                                          behavior: SnackBarBehavior.floating,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                          ),
                                        ),
                                      );
                                    }
                                  },
                                ),
                              );
                            },
                          ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSkeletonDeviceSelection() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: 3, // tampilkan 6 skeleton item
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            title: Container(
              height: 14,
              width: 120,
              margin: const EdgeInsets.only(bottom: 6),
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 10,
                  width: 100,
                  margin: const EdgeInsets.only(bottom: 6),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Container(
                      height: 10,
                      width: 50,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            trailing: Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildPinInputSection(
    BuildContext context,
    WidgetRef ref,
    dynamic currentCashier,
    DeviceModel currentDevice,
    StateProvider<bool> isValid,
  ) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Info Device yang dipilih
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green[200]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.tablet_android, color: Colors.green[700]),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          currentDevice.deviceName,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.green[800],
                          ),
                        ),
                        Text(
                          currentDevice.location,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.green[700],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Kasir: ${currentCashier.username}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.green[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.edit, color: Colors.green[700]),
                    onPressed: () {
                      ref.read(selectedDeviceProvider.notifier).state = null;
                    },
                    tooltip: 'Ganti Device',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

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
                // 1. Validasi PIN
                final isValidPin = BCrypt.checkpw(
                  pin.toString(),
                  currentCashier.password!,
                );

                ref.read(isValidProvider.notifier).state = isValidPin;

                if (!isValidPin) {
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
                  return false;
                }

                try {
                  // 3. Login ke device
                  AppLogger.debug(
                    'Logging in cashier to device: ${currentDevice.deviceName}',
                  );
                  await ref
                      .read(cashierLoginToDeviceProvider.notifier)
                      .loginCashierToDevice(currentCashier, currentDevice);
                  AppLogger.debug('Device login completed');
                  // 4. Check hasil login device
                  AppLogger.debug('Checking device login result');
                  final loginState = ref.read(cashierLoginToDeviceProvider);

                  return loginState.when(
                    data: (success) {
                      if (success) {
                        // 5. Jika berhasil, login cashier
                        ref
                            .read(authCashierProvider.notifier)
                            .login(currentCashier);
                        return true;
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text('Gagal login ke device'),
                            backgroundColor: Colors.orange[600],
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        );
                        return false;
                      }
                    },
                    loading: () {
                      // Tetap return false, nanti handle loading di UI
                      return false;
                    },
                    error: (error, stack) {
                      AppLogger.error(
                        'Device login error',
                        error: error,
                        stackTrace: stack,
                      );
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Error: ${error.toString()}'),
                          backgroundColor: Colors.red[600],
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      );
                      return false;
                    },
                  );
                } catch (e) {
                  if (context.mounted) {
                    AppLogger.error('Exception during device login', error: e);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Terjadi kesalahan: $e'),
                        backgroundColor: Colors.red[600],
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    );
                  }
                  return false;
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  // _buildCashierList method tetap sama seperti sebelumnya...
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
            color: Colors.black.withValues(alpha: 0.05),
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
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                color: Colors.white,
                borderRadius: const BorderRadius.all(Radius.circular(12)),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    child: Icon(Icons.person, color: Colors.green),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        manager.username,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF111827),
                        ),
                      ),
                      Text(
                        manager.role,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ],
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
                      showLogoutDialog(context, ref);
                    },
                  ),
                ],
              ),
            ),
          ),
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
                        color: Colors.black.withValues(alpha: 0.05),
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
                      // Reset device ketika ganti cashier
                      ref.read(selectedDeviceProvider.notifier).state = null;
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

  void showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Konfirmasi'),
          content: const Text('Apakah Anda yakin ingin keluar?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('Batal', style: TextStyle(color: Colors.grey[600])),
            ),
            TextButton(
              onPressed: () {
                if (ref.read(isLoading)) return;

                ref.read(isLoading.notifier).state = true;
                ref.read(tryAuthProvider.notifier).logout();
                // Reset semua state
                ref.read(selectedCashierProvider.notifier).state = null;
                ref.read(selectedDeviceProvider.notifier).state = null;
                Navigator.of(context).pop();
                ref.read(isLoading.notifier).state = false;
              },
              child:
                  ref.watch(isLoading)
                      ? const CircularProgressIndicator()
                      : const Text(
                        'Ya, Keluar',
                        style: TextStyle(color: Colors.red),
                      ),
            ),
          ],
        );
      },
    );
  }
}
