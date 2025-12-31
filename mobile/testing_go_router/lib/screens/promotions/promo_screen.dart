import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:kasirbaraja/providers/promotion_providers/auto_promo_provider.dart';

class PromoScreen extends ConsumerWidget {
  const PromoScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final promoList = ref.watch(autopromoProvider);

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.blue[700],
        elevation: 0,
        title: const Text(
          'Daftar Auto Promo - Baraja Amphitheater',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(promoGroupsProvider),
          ),
          promoList.when(
            data:
                (promos) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Chip(
                    label: Text(
                      '${promos.length} Promo',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    backgroundColor: Colors.blue[900],
                  ),
                ),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: promoList.when(
        data: (promos) {
          if (promos.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox_outlined, size: 80, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'Tidak ada promo',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            );
          }

          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: ListView.builder(
              itemCount: promos.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: PromoCard(promo: promos[index]),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error:
            (error, stack) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 80, color: Colors.red[400]),
                  const SizedBox(height: 16),
                  Text(
                    'Gagal memuat data promo',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    error.toString(),
                    style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => ref.refresh(autopromoProvider),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Coba Lagi'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
      ),
    );
  }
}

class PromoCard extends StatelessWidget {
  final dynamic promo; // AutoPromoModel

  const PromoCard({super.key, required this.promo});

  @override
  Widget build(BuildContext context) {
    final isActive = promo.isActive ?? false;
    final promoType = _getPromoTypeLabel(promo.promoType ?? '');
    final validFrom = promo.validFrom;
    final validTo = promo.validTo;
    final dateFormat = DateFormat('dd MMM yyyy');
    final hasActiveHours = promo.activeHours?.isEnabled ?? false;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: isActive ? Colors.green : Colors.grey[300]!,
          width: 2,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left Section - Icon & Status
            Container(
              width: 100,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isActive ? Colors.green[50] : Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Icon(
                    _getPromoIcon(promo.promoType ?? ''),
                    size: 48,
                    color: isActive ? Colors.green[700] : Colors.grey[600],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: isActive ? Colors.green : Colors.grey[400],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isActive ? 'AKTIF' : 'NONAKTIF',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 20),

            // Middle Section - Promo Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          promo.name ?? 'Promo',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.blue[200]!),
                        ),
                        child: Text(
                          promoType,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.blue[700],
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Periode Promo
                  if (validFrom != null && validTo != null)
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today,
                          size: 16,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Periode: ${dateFormat.format(validFrom)} - ${dateFormat.format(validTo)}',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[700],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),

                  // Active Hours
                  if (hasActiveHours) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.access_time,
                          size: 16,
                          color: Colors.orange[700],
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Jam Aktif: ${_getActiveHoursText(promo.activeHours)}',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.orange[700],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],

                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 12),

                  // Conditional Details based on promo type
                  _buildPromoDetails(promo),
                ],
              ),
            ),

            // Right Section - Discount Info
            Container(
              width: 140,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.orange[400]!, Colors.orange[600]!],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _getDiscountText(promo),
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _getDiscountSubtext(promo),
                    style: const TextStyle(fontSize: 12, color: Colors.white),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPromoDetails(dynamic promo) {
    final promoType = promo.promoType ?? '';
    final conditions = promo.conditions;

    switch (promoType) {
      case 'product_specific':
        return _buildProductSpecific(conditions);
      case 'bundling':
        return _buildBundling(conditions);
      case 'discount_on_quantity':
        return _buildDiscountOnQuantity(conditions, promo.discount ?? 0);
      case 'discount_on_total':
        return _buildDiscountOnTotal(conditions, promo.discount ?? 0);
      case 'buy_x_get_y':
        return _buildBuyXGetY(conditions);
      default:
        return const SizedBox();
    }
  }

  Widget _buildProductSpecific(dynamic conditions) {
    final products = conditions?.products ?? [];

    if (products.isEmpty) {
      return _buildInfoBox(
        icon: Icons.info_outline,
        title: 'Berlaku untuk semua produk',
        color: Colors.blue,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Produk yang Mendapat Diskon:'),
        const SizedBox(height: 8),
        ...products
            .map<Widget>(
              (product) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Icon(
                      Icons.check_circle,
                      size: 16,
                      color: Colors.green[600],
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        product.name ?? '',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      ],
    );
  }

  Widget _buildBundling(dynamic conditions) {
    final bundleProducts = conditions?.bundleProducts ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Paket Bundle:'),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.purple[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.purple[200]!),
          ),
          child: Column(
            children:
                bundleProducts.map<Widget>((item) {
                  final product = item.product;
                  final quantity = item.quantity;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.purple[600],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${quantity}x',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            product?.name ?? '',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildDiscountOnQuantity(dynamic conditions, int discount) {
    final minQuantity = conditions?.minQuantity ?? 0;

    return _buildInfoBox(
      icon: Icons.shopping_cart,
      title: 'Syarat Promo',
      subtitle:
          'Beli minimal $minQuantity item untuk mendapat diskon $discount%',
      color: Colors.teal,
    );
  }

  Widget _buildDiscountOnTotal(dynamic conditions, int discount) {
    final minTotal = conditions?.minTotal ?? 0;

    return _buildInfoBox(
      icon: Icons.receipt_long,
      title: 'Syarat Promo',
      subtitle:
          'Belanja minimal Rp${_formatCurrency(minTotal)} untuk mendapat diskon Rp${_formatCurrency(discount)}',
      color: Colors.indigo,
    );
  }

  Widget _buildBuyXGetY(dynamic conditions) {
    final buyProduct = conditions?.buyProduct;
    final getProduct = conditions?.getProduct;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Ketentuan Promo:'),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.green[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.green[200]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.blue[600],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'BELI',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      buyProduct?.name ?? '',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green[600],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'GRATIS',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      getProduct?.name ?? '',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoBox({
    required IconData icon,
    required String title,
    String? subtitle,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        color: Colors.grey[800],
      ),
    );
  }

  String _getActiveHoursText(dynamic activeHours) {
    if (activeHours == null) return 'Tidak ada jadwal';
    final schedule = activeHours.schedule ?? [];
    if (schedule.isEmpty) return 'Tidak ada jadwal';

    final first = schedule.first;
    return '${first.startTime} - ${first.endTime} (Setiap hari)';
  }

  String _getPromoTypeLabel(String type) {
    switch (type) {
      case 'product_specific':
        return 'Produk Spesifik';
      case 'bundling':
        return 'Paket Bundle';
      case 'discount_on_quantity':
        return 'Diskon Kuantitas';
      case 'discount_on_total':
        return 'Diskon Total';
      case 'buy_x_get_y':
        return 'Beli X Gratis Y';
      default:
        return 'Promo';
    }
  }

  IconData _getPromoIcon(String type) {
    switch (type) {
      case 'product_specific':
        return Icons.local_offer;
      case 'bundling':
        return Icons.inventory_2;
      case 'discount_on_quantity':
        return Icons.shopping_cart;
      case 'discount_on_total':
        return Icons.receipt_long;
      case 'buy_x_get_y':
        return Icons.card_giftcard;
      default:
        return Icons.discount;
    }
  }

  String _getDiscountText(dynamic promo) {
    if (promo.bundlePrice != null && promo.bundlePrice > 0) {
      return 'Rp${_formatCurrency(promo.bundlePrice)}';
    } else if (promo.discount != null && promo.discount > 0) {
      if (promo.promoType == 'product_specific' ||
          promo.promoType == 'discount_on_quantity') {
        return '${promo.discount}%';
      } else {
        return 'Rp${_formatCurrency(promo.discount)}';
      }
    }
    return 'GRATIS';
  }

  String _getDiscountSubtext(dynamic promo) {
    if (promo.bundlePrice != null && promo.bundlePrice > 0) {
      return 'Harga Bundle';
    } else if (promo.discount != null && promo.discount > 0) {
      return 'Diskon';
    }
    return 'Bonus';
  }

  String _formatCurrency(dynamic value) {
    final number = value is int ? value : int.tryParse(value.toString()) ?? 0;
    final formatter = NumberFormat('#,###', 'id_ID');
    return formatter.format(number);
  }
}
