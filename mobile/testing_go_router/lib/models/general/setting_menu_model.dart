import 'package:flutter/material.dart';

class SettingMenuModel {
  final String title;
  final IconData icon;
  final int index;
  final VoidCallback? onTap;

  SettingMenuModel({
    required this.title,
    required this.icon,
    required this.index,
    this.onTap,
  });
}
