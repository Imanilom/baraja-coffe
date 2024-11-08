import Voucher from '../models/voucher.model.js';

// Membuat voucher baru
export const createVoucher = async (req, res) => {
    const { code, name, description, discountAmount, expirationDate, voucherPicture} = req.body;

    try {
        const newVoucher = new Voucher({
            code,
            name,
            description,
            discountAmount,
            expirationDate,
            voucherPicture
        });

        await newVoucher.save();
        res.status(201).json({ message: 'Voucher berhasil dibuat', voucher: newVoucher });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Melihat semua voucher yang tersedia
export const getAllVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find();
        res.status(200).json(vouchers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Memperbarui voucher berdasarkan ID
export const updateVoucher = async (req, res) => {
    const { id } = req.params;
    const { name, description, discountAmount, expirationDate, voucherPicture } = req.body;

    try {
        const voucher = await Voucher.findByIdAndUpdate(
            id,
            { name, description, discountAmount, expirationDate, voucherPicture },
            { new: true }
        );
        if (!voucher) return res.status(404).json({ message: "Voucher tidak ditemukan" });

        res.status(200).json({ message: "Voucher berhasil diperbarui", voucher });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Menghapus voucher
export const deleteVoucher = async (req, res) => {
    const { id } = req.params;

    try {
        const voucher = await Voucher.findByIdAndDelete(id);
        if (!voucher) return res.status(404).json({ message: "Voucher tidak ditemukan" });

        res.status(200).json({ message: "Voucher berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
