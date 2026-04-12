# ============================================================
# Google Play Core (Flutter deferred components — not used but referenced)
# ============================================================
-dontwarn com.google.android.play.core.splitcompat.**
-dontwarn com.google.android.play.core.splitinstall.**
-dontwarn com.google.android.play.core.tasks.**

# ============================================================
# Flutter Local Notifications
# ============================================================
-keep class com.dexterous.** { *; }

# ============================================================
# Firebase Cloud Messaging
# ============================================================
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# ============================================================
# Permission Handler
# ============================================================
-keep class com.baseflow.permissionhandler.** { *; }

# ============================================================
# Flutter
# ============================================================
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# ============================================================
# AndroidX
# ============================================================
-keep class androidx.core.app.NotificationCompat** { *; }
-keep class androidx.core.app.NotificationManagerCompat { *; }
