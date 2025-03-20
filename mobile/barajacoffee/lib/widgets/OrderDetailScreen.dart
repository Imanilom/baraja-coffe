import 'package:flutter/material.dart';

class OrderDetailScreen extends StatelessWidget {
  final Map<String, dynamic> order;

  const OrderDetailScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final isCompleted = order["status"] == "Completed";

    return Scaffold(
      appBar: AppBar(
        title: const Text("Detail Pesanan"),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildOrderHeader(),
                  const SizedBox(height: 20),
                  _buildStatusIndicator(),
                  const SizedBox(height: 20),
                  _buildDeliveryInfo(),
                  const SizedBox(height: 20),
                  _buildItemsList(),
                  const SizedBox(height: 20),
                  _buildPriceBreakdown(),
                  const SizedBox(height: 20),
                  _buildPaymentInfo(),
                  if (isCompleted) _buildRatingSection(),
                ],
              ),
            ),
          ),
          _buildReorderButton(),
        ],
      ),
    );
  }

  Widget _buildOrderHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Pesanan ${order["id"]}",
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          order["date"],
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusIndicator() {
    final status = order["status"];
    final color = _getStatusColor(status);
    
    return Row(
      children: [
        Icon(
          _getStatusIcon(status),
          color: color,
          size: 20,
        ),
        const SizedBox(width: 8),
        Text(
          status,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ],
    );
  }

  Widget _buildDeliveryInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Estimasi Pengantaran",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.delivery_dining,
                  color: Colors.green.shade700,
                ),
                const SizedBox(width: 8),
                Text(
                  _getDeliveryMessage(),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItemsList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Item Pesanan",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 12),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: order["items"].length,
          separatorBuilder: (_, __) => const Divider(height: 24),
          itemBuilder: (context, index) {
            final item = order["items"][index];
            return Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.fastfood,
                    color: Colors.green.shade700,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item["name"],
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      Text(
                        "Jumlah: ${item["quantity"]}",
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  "Rp${item["price"]}",
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildPriceBreakdown() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildPriceRow("Subtotal", order["total"]),
            _buildPriceRow("Diskin", "-${order["discount"]}"),
            const Divider(height: 24),
            _buildPriceRow(
              "Total Pembayaran",
              order["final_total"],
              isTotal: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoRow("Metode Pembayaran", order["payment_method"]),
            const SizedBox(height: 12),
            _buildInfoRow("Lokasi Pengantaran", order["location"]),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingSection() {
    final rating = order["rating"];
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Penilaian Pesanan",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 12),
            if (rating != null)
              _buildStarRating(rating)
            else
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.star_border),
                label: const Text("Beri Penilaian"),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildReorderButton() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: ElevatedButton.icon(
        onPressed: () {},
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green.shade700,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        icon: const Icon(Icons.replay),
        label: const Text("Pesan Lagi"),
      ),
    );
  }

  // Helper methods
  Widget _buildPriceRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: isTotal ? 16 : 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              fontSize: isTotal ? 18 : 14,
              color: isTotal ? Colors.green.shade700 : Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String title, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 14,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildStarRating(double rating) {
    return Row(
      children: List.generate(5, (index) {
        if (index < rating.floor()) {
          return Icon(Icons.star, color: Colors.amber.shade600);
        } else if (index == rating.floor() && rating % 1 != 0) {
          return Icon(Icons.star_half, color: Colors.amber.shade600);
        } else {
          return Icon(Icons.star_border, color: Colors.amber.shade600);
        }
      }),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case "On Process":
        return Colors.green.shade700;
      case "Completed":
        return Colors.blue.shade700;
      case "Cancelled":
        return Colors.red.shade700;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case "On Process":
        return Icons.timer;
      case "Completed":
        return Icons.check_circle;
      case "Cancelled":
        return Icons.cancel;
      default:
        return Icons.info;
    }
  }

  String _getDeliveryMessage() {
    switch (order["status"]) {
      case "On Process":
        return "Estimasi tiba dalam 15-30 menit";
      case "Completed":
        return "Pesanan telah diterima pada ${order["date"]}";
      case "Cancelled":
        return "Pesanan dibatalkan";
      default:
        return "";
    }
  }
}