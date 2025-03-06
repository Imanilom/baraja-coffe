import 'package:flutter/material.dart';
import 'package:barajacoffee/widgets/VoucherDetailScreen.dart';

class VoucherScreen extends StatefulWidget {
  const VoucherScreen({super.key});

  @override
  _VoucherScreenState createState() => _VoucherScreenState();
}

class _VoucherScreenState extends State<VoucherScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _voucherController = TextEditingController();
  late TabController _tabController;
  final Color mainColor = const Color(0xFF076A3B);

  List<Map<String, dynamic>> belanjaVouchers = [
    {
      'title': 'Diskon Belanja 50rb',
      'code': 'DISKON50',
      'minimalBelanja': 200000,
      'minimalTransaksi': 1,
      'expiry': '30 Feb 2025',
      'category': 'belanja',
      'description': 'Dapatkan potongan harga sebesar Rp 50.000 untuk pembelian minimal Rp 200.000',
      'syarat': '1. Minimal belanja Rp 200.000\n2. Berlaku untuk semua produk\n3. Tidak berlaku kelipatan',
      'caraPemesanan': '1. Masukkan kode voucher saat checkout\n2. Klik tombol gunakan voucher\n3. Potongan harga akan otomatis diterapkan',
      'banner': 'https://placehold.co/1980x1200/png',
    },
  ];

  List<Map<String, dynamic>> deliveryVouchers = [
    {
      'title': 'Gratis Ongkir',
      'code': 'FREESHIP',
      'minimalBelanja': 50000,
      'minimalTransaksi': 1,
      'expiry': '15 Mar 2025',
      'category': 'delivery',
      'description': 'Gratis ongkir tanpa minimum pembelian',
      'syarat': '1. Minimal belanja Rp 50.000\n2. Berlaku untuk wilayah Jabodetabek',
      'caraPemesanan': '1. Pilih metode pengiriman reguler\n2. Kode voucher akan otomatis diterapkan',
      'banner': 'https://placehold.co/1980x1200/png',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void applyVoucher(String code) {
    bool isValid = [...belanjaVouchers, ...deliveryVouchers]
        .any((voucher) => voucher["code"] == code);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isValid ? "Voucher berhasil digunakan!" : "Kode voucher tidak valid!"),
        backgroundColor: isValid ? mainColor : Colors.red,
      ),
    );

    if (isValid) {
      _voucherController.clear();
    }
  }

  void _showVoucherDetail(Map<String, dynamic> voucher) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VoucherDetailScreen(voucher: voucher, mainColor: mainColor),
      ),
    );
  }

  Widget _buildVoucherCard(Map<String, dynamic> voucher) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => _showVoucherDetail(voucher),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    voucher['title'],
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Chip(
                    label: Text(voucher['category'].toUpperCase(),
                        style: TextStyle(color: Colors.white)),
                    backgroundColor: mainColor,
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.monetization_on, size: 16),
                  const SizedBox(width: 5),
                  Text('Min. Belanja: Rp ${voucher['minimalBelanja']}'),
                ],
              ),
              const SizedBox(height: 5),
              Row(
                children: [
                  const Icon(Icons.date_range, size: 16),
                  const SizedBox(width: 5),
                  Text('Berlaku hingga: ${voucher['expiry']}'),
                ],
              ),
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => applyVoucher(voucher['code']),
                  style: TextButton.styleFrom(
                    backgroundColor: mainColor.withOpacity(0.2),
                    foregroundColor: mainColor,
                  ),
                  child: const Text('Pakai'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVoucherList(List<Map<String, dynamic>> vouchers) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (vouchers.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Text('Tidak ada voucher tersedia'),
            ),
          )
        else
          ...vouchers.map((voucher) => _buildVoucherCard(voucher)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text("Voucher Saya"),
        backgroundColor: Colors.white,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: mainColor,
              unselectedLabelColor: Colors.grey,
              indicatorColor: mainColor,
              tabs: const [
                Tab(text: "Voucher Belanja"),
                Tab(text: "Voucher Delivery"),
              ],
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _voucherController,
              decoration: InputDecoration(
                hintText: "Masukkan kode voucher",
                suffixIcon: IconButton(
                  icon: Icon(Icons.check_circle, color: mainColor),
                  onPressed: () => applyVoucher(_voucherController.text),
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildVoucherList(belanjaVouchers),
                _buildVoucherList(deliveryVouchers),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
