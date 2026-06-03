import 'package:flutter_riverpod/flutter_riverpod.dart';

final messageProvider = StateNotifierProvider<MessageNotifier, String?>((ref) {
  return MessageNotifier();
});

class MessageNotifier extends StateNotifier<String?> {
  MessageNotifier() : super(null);

  void showMessage(String message) {
    state = message;
  }

  void clearMessage() {
    state = null;
  }
}
