import 'package:flutter/material.dart';

class CategoryWidget extends StatelessWidget {
  final List<Map<String, dynamic>> categories;

  const CategoryWidget({super.key, required this.categories});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: categories.map((category) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: Column(
              children: [
                Icon(category['icon'], size: 40, color: Colors.brown),
                SizedBox(height: 5),
                Text(category['label'], style: TextStyle(fontSize: 14)),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
