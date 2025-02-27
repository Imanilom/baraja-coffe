import 'package:flutter/material.dart';

class LevelWidget extends StatelessWidget {
  final int points;

  const LevelWidget({super.key, required this.points});

  // Menentukan level berdasarkan points
  Map<String, dynamic> getUserLevel() {
    if (points >= 2000) {
      return {"name": "Black", "next": null, "min": 2000, "benefit": "Diskon 25% + Semua Keuntungan Platinum", "image": "../lib/assets/images/banner.png"};
    } else if (points >= 1000) {
      return {"name": "Platinum", "next": 2000, "min": 1000, "benefit": "Cashback 5% + Keuntungan Gold", "image": "../lib/assets/images/banner.png"};
    } else if (points >= 500) {
      return {"name": "Gold", "next": 1000, "min": 500, "benefit": "Gratis Ongkir + Diskon 15%", "image": "../lib/assets/images/banner.png"};
    } else if (points >= 200) {
      return {"name": "Silver", "next": 500, "min": 200, "benefit": "Diskon 10%", "image": "../lib/assets/images/banner.png"};
    } else {
      return {"name": "Bronze", "next": 200, "min": 0, "benefit": "Diskon 5%", "image": "../lib/assets/images/banner.png"};
    }
  }

  @override
  Widget build(BuildContext context) {
    final level = getUserLevel();
    double progress = level["next"] != null ? (points - level["min"]) / (level["next"]! - level["min"]) : 1.0;
    int remainingPoints = level["next"] != null ? level["next"]! - points : 0;

    return Column(
      children: [
        // Gambar Level
        Image.asset(level["image"], height: 100),

        // Nama Level
        Text(
          "Level: ${level["name"]}",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 5),

        // Keuntungan Level
        Text(
          "Keuntungan: ${level["benefit"]}",
          style: TextStyle(fontSize: 14, color: Colors.green[700]),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 15),

        // Progress Bar Menuju Level Berikutnya
        if (level["next"] != null) ...[
          Text("Naik Level ${level["name"]} ke ${getUserLevel()["next"] != null ? getUserLevel()["next"].toString() : "Max"}"),
          SizedBox(height: 5),
          LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.grey[300],
            color: Colors.green[700],
            minHeight: 10,
          ),
          SizedBox(height: 5),
          Text(
            "Butuh $remainingPoints Points Lagi untuk Level ${getUserLevel()["next"] != null ? getUserLevel()["next"].toString() : "Max"}",
            style: TextStyle(fontSize: 12, color: Colors.grey[700]),
          ),
        ],
      ],
    );
  }
}
