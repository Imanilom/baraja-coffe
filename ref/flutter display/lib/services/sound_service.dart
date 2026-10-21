import 'package:flutter/services.dart';

class SoundService {
  static void playChime() {
    try {
      SystemSound.play(SystemSoundType.click);
    } catch (_) {}
  }

  static void playSuccess() {
    try {
      SystemSound.play(SystemSoundType.alert);
    } catch (_) {}
  }
}
