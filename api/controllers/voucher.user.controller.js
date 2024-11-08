import Voucher from '../models/voucher.model.js';
import User from '../models/user.model.js';
import Order from '../models/order.model.js';

// Melihat semua voucher yang belum diklaim oleh pengguna tertentu
export const getAvailableVouchers = async (req, res) => {
    const { userId } = req.user;

    try {
        // Hanya menampilkan voucher yang belum diklaim oleh user tertentu dan belum kedaluwarsa
        const vouchers = await Voucher.find({
            expirationDate: { $gte: new Date() }, // Cek voucher belum kedaluwarsa
            claimedBy: { $ne: userId } // Cek voucher belum diklaim oleh user ini
        });
        res.status(200).json(vouchers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Mengklaim voucher oleh pengguna
export const claimVoucher = async (req, res) => {
    const { userId } = req.user;
    const { code } = req.body;

    try {
        // Temukan voucher berdasarkan kode yang belum kedaluwarsa
        const voucher = await Voucher.findOne({ code, expirationDate: { $gte: new Date() } });
        if (!voucher) return res.status(404).json({ message: "Voucher tidak ditemukan atau sudah kedaluwarsa" });

        // Periksa apakah user sudah mengklaim voucher ini
        if (voucher.claimedBy.includes(userId)) {
            return res.status(400).json({ message: "Voucher sudah diklaim oleh pengguna ini" });
        }

        // Perbarui voucher untuk menambahkan user ke claimedBy
        voucher.claimedBy.push(userId);
        await voucher.save();

        // Tambahkan voucher ke dalam array vouchers pada user
        const user = await User.findById(userId);
        user.vouchers.push(voucher._id);
        await user.save();

        res.status(200).json({ message: "Voucher berhasil diklaim", voucher });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Menggunakan voucher saat membuat pesanan
export const applyVoucherToOrder = async (req, res) => {
    const { userId } = req.user;
    const { orderId, voucherCode } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order tidak ditemukan" });

        // Temukan voucher yang diklaim oleh user ini
        const voucher = await Voucher.findOne({ 
            code: voucherCode, 
            claimedBy: userId, 
            expirationDate: { $gte: new Date() } 
        });

        if (!voucher) return res.status(404).json({ message: "Voucher tidak valid atau belum diklaim" });

        // Terapkan diskon ke total harga order
        const discount = voucher.discountAmount;
        const newTotalPrice = Math.max(0, order.totalPrice - discount);

        // Update order dengan total harga setelah diskon
        order.discount = discount;
        order.totalPrice = newTotalPrice;
        await order.save();

        res.status(200).json({ message: "Voucher berhasil digunakan", order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
