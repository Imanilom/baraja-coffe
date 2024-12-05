import { Voucher } from '../models/Voucher.model.js';
import { UserVoucher } from '../models/UserVoucher.model.js';

// Claim a voucher
export const claimVoucher = async (req, res) => {
  try {
    const { userId, voucherCode } = req.body;

    // Find the voucher by code
    const voucher = await Voucher.findOne({ code: voucherCode });
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }

    // Check if the voucher is active and within the date range
    const currentDate = new Date();
    if (!voucher.isActive || currentDate < voucher.startDate || currentDate > voucher.endDate) {
      return res.status(400).json({ success: false, message: 'Voucher is not active or expired' });
    }

    // Check claims for this voucher
    const totalClaims = await UserVoucher.aggregate([
      { $match: { voucherId: voucher._id } },
      { $group: { _id: null, totalClaims: { $sum: '$claims' } } },
    ]);

    const claimsForVoucher = totalClaims[0]?.totalClaims || 0;

    if (claimsForVoucher >= voucher.maxClaims) {
      return res.status(400).json({ success: false, message: 'Voucher claim limit reached' });
    }

    // Check user claims for this voucher
    let userVoucher = await UserVoucher.findOne({ userId, voucherId: voucher._id });
    if (!userVoucher) {
      userVoucher = new UserVoucher({ userId, voucherId: voucher._id, claims: 0 });
    }

    if (userVoucher.claims >= voucher.maxClaims) {
      return res.status(400).json({ success: false, message: 'You have reached your claim limit for this voucher' });
    }

    // Increment claims for user and voucher
    userVoucher.claims += 1;
    await userVoucher.save();

    res.status(200).json({
      success: true,
      message: 'Voucher claimed successfully',
      voucher: { code: voucher.code, discountAmount: voucher.discountAmount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to claim voucher', error: error.message });
  }
};

// Fetch claimed vouchers for a user
export const getUserVouchers = async (req, res) => {
  try {
    const { userId } = req.params;

    const userVouchers = await UserVoucher.find({ userId })
      .populate('voucherId')
      .select('voucherId claims');

    res.status(200).json({ success: true, data: userVouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch claimed vouchers', error: error.message });
  }
};

// Create a new voucher
export const createVoucher = async (req, res) => {
  try {
    const { code, description, discountAmount, minimumOrder, startDate, endDate, isActive, maxClaims } = req.body;

    // Validate inputs
    if (!code || !discountAmount || !maxClaims) {
      return res.status(400).json({ success: false, message: 'Code, discount amount, and max claims are required' });
    }

    // Check if voucher code already exists
    const existingVoucher = await Voucher.findOne({ code });
    if (existingVoucher) {
      return res.status(400).json({ success: false, message: 'Voucher code already exists' });
    }

    // Create the voucher
    const newVoucher = new Voucher({
      code,
      description,
      discountAmount,
      minimumOrder,
      startDate,
      endDate,
      isActive,
      maxClaims,
    });

    await newVoucher.save();
    res.status(201).json({ success: true, message: 'Voucher created successfully', data: newVoucher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create voucher', error: error.message });
  }
};

// Get all vouchers
export const getVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    res.status(200).json({ success: true, data: vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vouchers', error: error.message });
  }
};

// Get a single voucher by ID
export const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }

    res.status(200).json({ success: true, data: voucher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch voucher', error: error.message });
  }
};

// Update a voucher
export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedVoucher = await Voucher.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedVoucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }

    res.status(200).json({ success: true, message: 'Voucher updated successfully', data: updatedVoucher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update voucher', error: error.message });
  }
};

// Delete a voucher
export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedVoucher = await Voucher.findByIdAndDelete(id);
    if (!deletedVoucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }

    res.status(200).json({ success: true, message: 'Voucher deleted successfully', data: deletedVoucher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete voucher', error: error.message });
  }
};
