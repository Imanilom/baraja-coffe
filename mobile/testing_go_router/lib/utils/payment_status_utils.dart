import 'package:flutter/material.dart';

class PaymentStatusUtils {
  static Color getColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'settlement':
        return Colors.green;
      case 'partial':
        return Colors.blue;
      case 'expired':
        return Colors.red;
      case 'cancled':
        return Colors.grey;
      default:
        return Colors.orange;
    }
  }

  //get status string
  static String getStatus(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'settlement':
        return 'Completed';
      case 'partial':
        return 'Baru DP';
      case 'expired':
        return 'Expired';
      case 'cancled':
        return 'Cancelled';
      default:
        return 'Unknow';
    }
  }
}
