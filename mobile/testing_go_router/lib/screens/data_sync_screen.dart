// lib/screens/data_sync_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:go_router/go_router.dart'; // Import GoRouter
import 'package:kasirbaraja/services/data_sync_service.dart';

class DataSyncScreen extends ConsumerStatefulWidget {
  final String? userToken;
  final VoidCallback? onSyncComplete; // Make optional since we'll use GoRouter

  const DataSyncScreen({super.key, this.userToken, this.onSyncComplete});

  @override
  ConsumerState<DataSyncScreen> createState() => _DataSyncScreenState();
}

class _DataSyncScreenState extends ConsumerState<DataSyncScreen>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  bool _hasStarted = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    _animationController.repeat(reverse: true);

    // Start sync automatically
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startSync();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _startSync() async {
    if (_hasStarted) return;

    setState(() {
      _hasStarted = true;
    });

    try {
      print('waiting ...');
      await ref
          .read(dataSyncProvider.notifier)
          .syncData(token: widget.userToken);

      // Wait a bit before completing to show success state
      // print('waiting delayed...');
      // await Future.delayed(const Duration(seconds: 2));

      // if (mounted) {
      //   // Use GoRouter for navigation or fallback to callback
      //   if (widget.onSyncComplete != null) {
      //     print('on complete success');
      //     widget.onSyncComplete!();
      //   } else {
      //     print('on else complete');
      //     context.go('/main'); // Default navigation with GoRouter
      //   }
      // }
    } catch (e) {
      if (mounted) {
        _showErrorDialog(e.toString());
      }
    }
  }

  void _showErrorDialog(String error) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => AlertDialog(
            title: const Text('Sync Error'),
            content: Text(
              'Failed to sync data: $error, please try again.'
              'jika tetap error, silahkan hubungi admin.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  _retrySync();
                },
                child: const Text('Retry'),
              ),
              // TextButton(
              //   onPressed: () {
              //     Navigator.of(context).pop();
              //     // Use GoRouter or callback for navigation
              //     if (widget.onSyncComplete != null) {
              //       widget.onSyncComplete!();
              //     } else {}
              //   },
              //   child: const Text('Skip'),
              // ),
            ],
          ),
    );
  }

  void _retrySync() {
    ref.read(dataSyncProvider.notifier).reset();
    setState(() {
      _hasStarted = false;
    });
    _startSync();
  }

  @override
  Widget build(BuildContext context) {
    final syncState = ref.watch(dataSyncProvider);
    final isLandscape =
        MediaQuery.of(context).orientation == Orientation.landscape;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(isLandscape ? 16.0 : 24.0),
          child:
              isLandscape
                  ? _buildLandscapeLayout(syncState)
                  : _buildPortraitLayout(syncState),
        ),
      ),
    );
  }

  Widget _buildLandscapeLayout(dynamic syncState) {
    return Row(
      children: [
        // Left side - Logo and Title
        Expanded(
          flex: 2,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo or App Icon
              AnimatedBuilder(
                animation: _fadeAnimation,
                builder: (context, child) {
                  return Opacity(
                    opacity: 0.5 + (_fadeAnimation.value * 0.5),
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: Theme.of(context).primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(50),
                        border: Border.all(
                          color: Theme.of(context).primaryColor,
                          width: 3,
                        ),
                      ),
                      child: Icon(
                        Icons.download_rounded,
                        size: 50,
                        color: Theme.of(context).primaryColor,
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(height: 24),

              // Title
              Text(
                'Preparing Your App',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 8),

              // Subtitle
              Text(
                'We\'re downloading the latest data for you',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),

        // Divider
        Container(
          width: 1,
          height: double.infinity,
          margin: const EdgeInsets.symmetric(horizontal: 24),
          color: Colors.grey[300],
        ),

        // Right side - Progress Section
        Expanded(
          flex: 3,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (syncState != null) ...[
                // Progress Bar
                Container(
                  width: double.infinity,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: syncState.progress,
                      backgroundColor: Colors.transparent,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        syncState.error != null
                            ? Colors.red
                            : syncState.isCompleted
                            ? Colors.green
                            : Theme.of(context).primaryColor,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Progress Text
                Text(
                  '${(syncState.progress * 100).round()}% Complete',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),

                const SizedBox(height: 8),

                // Current Task
                Text(
                  syncState.error ?? syncState.currentTask,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color:
                        syncState.error != null ? Colors.red : Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 24),

                // Step Indicator - Compact for landscape
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  alignment: WrapAlignment.center,
                  children: [
                    _buildCompactStepIndicator(
                      1,
                      'Menu',
                      syncState.currentStep >= 1,
                      syncState.currentStep > 1 || syncState.isCompleted,
                    ),
                    _buildCompactStepIndicator(
                      2,
                      'Tax',
                      syncState.currentStep >= 2,
                      syncState.currentStep > 2 || syncState.isCompleted,
                    ),
                    _buildCompactStepIndicator(
                      3,
                      'Payment',
                      syncState.currentStep >= 3,
                      syncState.currentStep > 3 || syncState.isCompleted,
                    ),
                    // _buildCompactStepIndicator(
                    //   4,
                    //   'Areas',
                    //   syncState.currentStep >= 4,
                    //   syncState.isCompleted,
                    // ),
                  ],
                ),

                const SizedBox(height: 24),

                // Info text - more compact
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue[100]!),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: Colors.blue[600],
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'This may take a few moments depending on your connection.',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: Colors.blue[700]),
                        ),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                // Initial Loading State
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text(
                  'Initializing...',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPortraitLayout(dynamic syncState) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Logo or App Icon
        AnimatedBuilder(
          animation: _fadeAnimation,
          builder: (context, child) {
            return Opacity(
              opacity: 0.5 + (_fadeAnimation.value * 0.5),
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(60),
                  border: Border.all(
                    color: Theme.of(context).primaryColor,
                    width: 3,
                  ),
                ),
                child: Icon(
                  Icons.download_rounded,
                  size: 60,
                  color: Theme.of(context).primaryColor,
                ),
              ),
            );
          },
        ),

        const SizedBox(height: 40),

        // Title
        Text(
          'Preparing Your App',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 12),

        // Subtitle
        Text(
          'We\'re downloading the latest data for you',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 60),

        // Progress Section
        if (syncState != null) ...[
          // Progress Bar
          Container(
            width: double.infinity,
            height: 8,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(4),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: syncState.progress,
                backgroundColor: Colors.transparent,
                valueColor: AlwaysStoppedAnimation<Color>(
                  syncState.error != null
                      ? Colors.red
                      : syncState.isCompleted
                      ? Colors.green
                      : Theme.of(context).primaryColor,
                ),
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Progress Text
          Text(
            '${(syncState.progress * 100).round()}% Complete',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
          ),

          const SizedBox(height: 8),

          // Current Task
          Text(
            syncState.error ?? syncState.currentTask,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: syncState.error != null ? Colors.red : Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 16),

          // Step Indicator
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildStepIndicator(
                1,
                'Menu',
                syncState.currentStep >= 1,
                syncState.currentStep > 1 || syncState.isCompleted,
              ),
              _buildStepConnector(
                syncState.currentStep > 1 || syncState.isCompleted,
              ),
              _buildStepIndicator(
                2,
                'Tax',
                syncState.currentStep >= 2,
                syncState.currentStep > 2 || syncState.isCompleted,
              ),
              _buildStepConnector(
                syncState.currentStep > 2 || syncState.isCompleted,
              ),
              _buildStepIndicator(
                3,
                'Payment',
                syncState.currentStep >= 3,
                syncState.currentStep > 3 || syncState.isCompleted,
              ),
            ],
          ),
        ] else ...[
          // Initial Loading State
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(
            'Initializing...',
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
          ),
        ],

        const SizedBox(height: 60),

        // Info text
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.blue[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.blue[100]!),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: Colors.blue[600], size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'This process may take a few moments depending on your internet connection.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.blue[700]),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStepIndicator(
    int step,
    String label,
    bool isActive,
    bool isCompleted,
  ) {
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color:
                isCompleted
                    ? Colors.green
                    : isActive
                    ? Theme.of(context).primaryColor
                    : Colors.grey[300],
            borderRadius: BorderRadius.circular(16),
          ),
          child: Center(
            child:
                isCompleted
                    ? const Icon(Icons.check, color: Colors.white, size: 18)
                    : Text(
                      step.toString(),
                      style: TextStyle(
                        color: isActive ? Colors.white : Colors.grey[600],
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color:
                isActive || isCompleted ? Colors.grey[700] : Colors.grey[500],
            fontWeight:
                isActive || isCompleted ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildCompactStepIndicator(
    int step,
    String label,
    bool isActive,
    bool isCompleted,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color:
            isCompleted
                ? Colors.green
                : isActive
                ? Theme.of(context).primaryColor
                : Colors.grey[300],
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.3),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child:
                  isCompleted
                      ? const Icon(Icons.check, color: Colors.white, size: 12)
                      : Text(
                        step.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                        ),
                      ),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepConnector(bool isCompleted) {
    return Container(
      width: 24,
      height: 2,
      margin: const EdgeInsets.only(bottom: 24),
      color: isCompleted ? Colors.green : Colors.grey[300],
    );
  }
}
