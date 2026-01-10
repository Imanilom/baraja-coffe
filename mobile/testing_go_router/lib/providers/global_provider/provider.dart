import 'package:flutter_riverpod/flutter_riverpod.dart';

class CurrentPageIndexProvider extends StateNotifier<int> {
  CurrentPageIndexProvider() : super(0);

  void setIndex(int index) {
    state = index;
  }
}

class CurrentWidgetIndexProvider extends StateNotifier<int> {
  CurrentWidgetIndexProvider() : super(0);

  void setIndex(int index) {
    state = index;
  }
}

class CurrentMenuSettingsProvider extends StateNotifier<int> {
  CurrentMenuSettingsProvider() : super(0);

  void setIndex(int index) {
    state = index;
  }
}

class CurrentIndexPaymentMethodProvider extends StateNotifier<int> {
  CurrentIndexPaymentMethodProvider() : super(0);

  void setIndex(int index) {
    state = index;
  }
}

final orderOnlineIndicatorProvider = StateProvider<bool>((ref) => false);

final currentPageIndexProvider =
    StateNotifierProvider<CurrentPageIndexProvider, int>((ref) {
      return CurrentPageIndexProvider();
    });

final currentWidgetIndexProvider =
    StateNotifierProvider<CurrentWidgetIndexProvider, int>((ref) {
      return CurrentWidgetIndexProvider();
    });

final currentIndexPaymentMethodProvider =
    StateNotifierProvider<CurrentIndexPaymentMethodProvider, int>((ref) {
      return CurrentIndexPaymentMethodProvider();
    });

final currentMenuSettingsProvider =
    StateNotifierProvider<CurrentMenuSettingsProvider, int>((ref) {
      return CurrentMenuSettingsProvider();
    });

final openBillLoadingProvider = StateProvider<bool>((ref) => false);

final openBillSuccessProvider = StateProvider<bool>((ref) => false);
