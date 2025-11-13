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
  const { 
    name, 
    promoType, 
    conditions, 
    discount, 
    bundlePrice, 
    outlet, 
    consumerType, 
    validFrom, 
    validTo, 
    isActive,
    activeHours // Tambahkan field activeHours
  } = req.body;
  const createdBy = req.user._id;

  if (!name || !promoType || !outlet || !validFrom || !validTo) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Validasi activeHours jika diaktifkan
  if (activeHours && activeHours.isEnabled) {
    if (!activeHours.schedule || activeHours.schedule.length === 0) {
      return res.status(400).json({ 
        message: "Schedule is required when active hours is enabled" 
      });
    }

    // Validasi setiap schedule
    for (const schedule of activeHours.schedule) {
      if (schedule.dayOfWeek === undefined || !schedule.startTime || !schedule.endTime) {
        return res.status(400).json({ 
          message: "Each schedule must have dayOfWeek, startTime, and endTime" 
        });
      }
    }
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
      activeHours: activeHours || { isEnabled: false, schedule: [] }
    });

    await autoPromo.save();

    // ✅ Log create
    await logActivity({
      userId: req.user._id,
      identifier: req.user.email || req.user.username,
      action: "CREATE",
      module: "AutoPromo",
      description: `Membuat promo baru: ${autoPromo.name}${autoPromo.activeHours.isEnabled ? ' (dengan jam aktif)' : ''}`,
      metadata: { 
        promoId: autoPromo._id,
        hasActiveHours: autoPromo.activeHours.isEnabled
      },
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
    // Validasi activeHours jika ada dalam request body
    if (req.body.activeHours && req.body.activeHours.isEnabled) {
      const { activeHours } = req.body;
      if (!activeHours.schedule || activeHours.schedule.length === 0) {
        return res.status(400).json({ 
          message: "Schedule is required when active hours is enabled" 
        });
      }

      // Validasi setiap schedule
      for (const schedule of activeHours.schedule) {
        if (schedule.dayOfWeek === undefined || !schedule.startTime || !schedule.endTime) {
          return res.status(400).json({ 
            message: "Each schedule must have dayOfWeek, startTime, and endTime" 
          });
        }
      }
    }

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
      description: `Update promo: ${autoPromo.name}${autoPromo.activeHours.isEnabled ? ' (dengan jam aktif)' : ''}`,
      metadata: { 
        promoId: autoPromo._id,
        hasActiveHours: autoPromo.activeHours.isEnabled
      },
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

// =============================
// Get active promos (considering active hours)
// =============================
export const getActivePromos = async (req, res) => {
  try {
    const { outletId } = req.query;
    const now = new Date();

    // Query dasar untuk promo aktif
    let query = {
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now }
    };

    // Filter by outlet jika provided
    if (outletId) {
      query.outlet = outletId;
    }

    // Ambil semua promo yang memenuhi kriteria tanggal
    const promos = await AutoPromo.find(query).populate(PROMO_POPULATE);

    // Filter promo berdasarkan jam aktif
    const activePromos = promos.filter(promo => {
      if (!promo.activeHours.isEnabled) {
        // Jika jam aktif tidak diaktifkan, promo aktif
        return true;
      }
      
      // Periksa apakah promo aktif berdasarkan jam
      return promo.isWithinActiveHours(now);
    });

    res.status(200).json({
      total: activePromos.length,
      promos: activePromos
    });
  } catch (error) {
    console.error("Error fetching active promos:", error.message);
    res.status(500).json({ message: "Server error while fetching active promos.", details: error.message });
  }
};

// =============================
// Check if specific promo is currently active
// =============================
export const checkPromoActive = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const promo = await AutoPromo.findById(id).populate(PROMO_POPULATE);
    
    if (!promo) {
      return res.status(404).json({ message: 'Promo not found' });
    }

    // Check basic validity
    const isDateValid = now >= promo.validFrom && now <= promo.validTo;
    const isActive = promo.isActive;
    
    // Check active hours if enabled
    let isWithinActiveHours = true;
    if (promo.activeHours.isEnabled) {
      isWithinActiveHours = promo.isWithinActiveHours(now);
    }

    const isCurrentlyActive = isDateValid && isActive && isWithinActiveHours;

    res.status(200).json({
      promo: promo.name,
      isCurrentlyActive,
      details: {
        isDateValid,
        isActive,
        isWithinActiveHours: promo.activeHours.isEnabled ? isWithinActiveHours : 'not_enabled',
        currentTime: now.toISOString(),
        activeHours: promo.activeHours
      }
    });
  } catch (error) {
    console.error("Error checking promo active status:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// =============================
// Get promo schedule for specific day
// =============================
export const getPromoSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek } = req.query; // 0-6 (Sunday-Saturday)

    const promo = await AutoPromo.findById(id);
    
    if (!promo) {
      return res.status(404).json({ message: 'Promo not found' });
    }

    if (!promo.activeHours.isEnabled) {
      return res.status(400).json({ 
        message: 'Active hours is not enabled for this promo' 
      });
    }

    let schedule;
    if (dayOfWeek !== undefined) {
      // Get schedule for specific day
      const day = parseInt(dayOfWeek);
      if (day < 0 || day > 6) {
        return res.status(400).json({ message: 'dayOfWeek must be between 0-6' });
      }
      schedule = promo.activeHours.schedule.find(s => s.dayOfWeek === day);
    } else {
      // Get current schedule
      schedule = promo.getCurrentSchedule();
    }

    res.status(200).json({
      promo: promo.name,
      schedule,
      dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : new Date().getDay()
    });
  } catch (error) {
    console.error("Error getting promo schedule:", error.message);
    res.status(500).json({ message: error.message });
  }
};