import AutoPromo from '../models/AutoPromo.model.js';
import { logActivity } from '../helpers/logActivity.js';

// Helper: populate paths yang konsisten
const PROMO_POPULATE = [
  { path: 'outlet', select: 'name _id' },
  { path: 'conditions.buyProduct', select: 'name _id' },
  { path: 'conditions.getProduct', select: 'name _id' },
  { path: 'conditions.bundleProducts.product', select: 'name _id' },
  { path: 'conditions.products', select: 'name _id' } 
];

// =============================
// Get all automatic promos
// =============================
export const getAutoPromos = async (req, res) => {
  try {
    const now = new Date();

    // Nonaktifkan promo yang sudah expired
    const expiredPromos = await AutoPromo.find({
      isActive: true,
      validTo: { $lt: now }
    });

    if (expiredPromos.length > 0) {
      const expiredIds = expiredPromos.map(p => p._id);
      await AutoPromo.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { isActive: false } }
      );
    }

    // Ambil semua promo dengan populate lengkap
    const autoPromos = await AutoPromo.find().populate(PROMO_POPULATE);

    if (!autoPromos || autoPromos.length === 0) {
      return res.status(404).json({ message: "No auto promos found." });
    }

    res.status(200).json(autoPromos);
  } catch (error) {
    console.error("Error fetching auto promos:", error.message);
    res.status(500).json({ message: "Server error while fetching auto promos.", details: error.message });
  }
};

// =============================
// Get promo by ID
// =============================
export const getAutoPromoById = async (req, res) => {
  try {
    const autoPromo = await AutoPromo.findById(req.params.id).populate(PROMO_POPULATE);
    if (!autoPromo) return res.status(404).json({ message: 'Promo not found' });
    res.status(200).json(autoPromo);
  } catch (error) {
    console.error("Error fetching promo by ID:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// =============================
// Create promo + LOG
// =============================
export const createAutoPromo = async (req, res) => {
  const { name, promoType, conditions, discount, bundlePrice, outlet, consumerType, validFrom, validTo, isActive } = req.body;
  const createdBy = req.user._id;

  if (!name || !promoType || !outlet || !validFrom || !validTo) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const autoPromo = new AutoPromo({
      name,
      promoType,
      conditions,
      discount,
      bundlePrice,
      outlet,
      consumerType,
      createdBy,
      validFrom,
      validTo,
      isActive,
    });

    await autoPromo.save();

    // ✅ Log create
    await logActivity({
      userId: req.user._id,
      identifier: req.user.email || req.user.username,
      action: "CREATE",
      module: "AutoPromo",
      description: `Membuat promo baru: ${autoPromo.name}`,
      metadata: { promoId: autoPromo._id },
      req,
    });

    // Return dengan populate
    const populatedPromo = await AutoPromo.findById(autoPromo._id).populate(PROMO_POPULATE);
    res.status(201).json(populatedPromo);
  } catch (error) {
    console.error("Error saving promo:", error.message);

    // ✅ Log gagal create
    await logActivity({
      userId: req.user?._id,
      identifier: req.user?.email || req.user?.username,
      action: "CREATE",
      module: "AutoPromo",
      description: `Gagal membuat promo: ${name}`,
      status: "FAILED",
      req,
    });

    res.status(400).json({ message: error.message });
  }
};

// =============================
// Update promo + LOG
// =============================
export const updateAutoPromo = async (req, res) => {
  try {
    // Gunakan findByIdAndUpdate dengan populate
    const autoPromo = await AutoPromo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(PROMO_POPULATE);

    if (!autoPromo) {
      await logActivity({
        userId: req.user._id,
        identifier: req.user.email || req.user.username,
        action: "UPDATE",
        module: "AutoPromo",
        description: `Update gagal: promo tidak ditemukan (ID: ${req.params.id})`,
        status: "FAILED",
        req,
      });
      return res.status(404).json({ message: 'Promo not found' });
    }

    // ✅ Log update sukses
    await logActivity({
      userId: req.user._id,
      identifier: req.user.email || req.user.username,
      action: "UPDATE",
      module: "AutoPromo",
      description: `Update promo: ${autoPromo.name}`,
      metadata: { promoId: autoPromo._id },
      req,
    });

    res.status(200).json(autoPromo);
  } catch (error) {
    console.error("Error updating promo:", error.message);

    // ✅ Log gagal update
    await logActivity({
      userId: req.user?._id,
      identifier: req.user?.email || req.user?.username,
      action: "UPDATE",
      module: "AutoPromo",
      description: `Gagal update promo (ID: ${req.params.id})`,
      status: "FAILED",
      req,
    });

    res.status(400).json({ message: error.message });
  }
};

// =============================
// Delete promo + LOG
// =============================
export const deleteAutoPromo = async (req, res) => {
  try {
    const autoPromo = await AutoPromo.findById(req.params.id);
    if (!autoPromo) {
      await logActivity({
        userId: req.user._id,
        identifier: req.user.email || req.user.username,
        action: "DELETE",
        module: "AutoPromo",
        description: `Delete gagal: promo tidak ditemukan (ID: ${req.params.id})`,
        status: "FAILED",
        req,
      });
      return res.status(404).json({ message: 'Promo not found' });
    }

    await AutoPromo.findByIdAndDelete(req.params.id);

    // ✅ Log delete sukses
    await logActivity({
      userId: req.user._id,
      identifier: req.user.email || req.user.username,
      action: "DELETE",
      module: "AutoPromo",
      description: `Menghapus promo: ${autoPromo.name}`,
      metadata: { promoId: autoPromo._id },
      req,
    });

    res.status(200).json({ message: 'Promo deleted successfully' });
  } catch (error) {
    console.error("Error deleting promo:", error.message);

    // ✅ Log gagal delete
    await logActivity({
      userId: req.user?._id,
      identifier: req.user?.email || req.user?.username,
      action: "DELETE",
      module: "AutoPromo",
      description: `Gagal menghapus promo (ID: ${req.params.id})`,
      status: "FAILED",
      req,
    });

    res.status(500).json({ message: error.message });
  }
};