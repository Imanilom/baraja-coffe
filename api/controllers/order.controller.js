import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';

// Fungsi untuk membuat ID order 16 digit
const generateOrderId = () => {
    return Math.floor(1000000000000000 + Math.random() * 9000000000000000);
};

// Controller untuk membuat pesanan
export const createOrder = async (req, res) => {
    try {
        let totalPriceBeforeDiscount = 0;
        let totalPrice = 0;
        let discount = 0;

        // Mengambil informasi pengguna dan vouchernya
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "Pengguna tidak ditemukan" });

        // Periksa apakah ada voucher yang belum digunakan
        const availableVoucher = user.vouchers.find(voucher => !voucher.isUsed);
        if (availableVoucher) {
            discount = availableVoucher.discountAmount;
        }

        // Mengambil detail produk dan menghitung harga total
        const productsWithDetails = await Promise.all(
            req.body.products.map(async (item) => {
                const product = await Product.findById(item.productId);
                if (!product) {
                    throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
                }

                const discountedPrice = product.price * (1 - product.discount / 100);
                const itemTotalPrice = discountedPrice * item.quantity;
                totalPriceBeforeDiscount += itemTotalPrice;

                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    customization: item.customization,
                    price: discountedPrice,
                };
            })
        );

        // Menghitung total harga setelah menggunakan voucher
        totalPrice = totalPriceBeforeDiscount - discount;
        if (totalPrice < 0) totalPrice = 0; // Pastikan totalPrice tidak negatif

        // Membuat objek pesanan baru dengan order_id
        const order = new Order({
            order_id: generateOrderId(),
            products: productsWithDetails,
            totalPrice,
            discount,
            customerName: req.body.customerName,
            status: req.body.status || 'pending',
        });

        await order.save();

        // Tandai voucher sebagai digunakan jika tersedia
        if (availableVoucher) {
            availableVoucher.isUsed = true;
            await user.save();
        }

        // Tambahkan poin ke pengguna berdasarkan total harga sebelum diskon
        const pointsEarned = Math.floor(totalPriceBeforeDiscount / 100);
        user.point += pointsEarned;
        await user.save();

        res.status(201).json({ order, pointsEarned });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
