import Voucher from '../models/voucher.model.js';
import QRCode from 'qrcode';

// Create a new voucher
export const createVoucher = async (req, res) => {
    try {
        const { name, description, discountAmount, discountType, validFrom, validTo, quota, applicableOutlets, customerType, printOnReceipt } = req.body;
        
        const newVoucher = new Voucher({
            name,
            description,
            discountAmount,
            discountType,
            validFrom,
            validTo,
            quota,
            applicableOutlets,
            customerType,
            printOnReceipt
        });
        
        await newVoucher.save();
        res.status(201).json(newVoucher);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all vouchers
export const getAllVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find();
        res.status(200).json(vouchers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single voucher by ID
export const getVoucherById = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
        res.status(200).json(voucher);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a voucher
export const updateVoucher = async (req, res) => {
    try {
        const updatedVoucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedVoucher) return res.status(404).json({ message: 'Voucher not found' });
        res.status(200).json(updatedVoucher);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a voucher
export const deleteVoucher = async (req, res) => {
    try {
        const deletedVoucher = await Voucher.findByIdAndDelete(req.params.id);
        if (!deletedVoucher) return res.status(404).json({ message: 'Voucher not found' });
        res.status(200).json({ message: 'Voucher deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Generate QR Code for a voucher
export const generateVoucherQR = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
        
        const qrCodeData = await QRCode.toDataURL(voucher.code);
        res.status(200).json({ qrCode: qrCodeData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
