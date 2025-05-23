import AutoPromo from '../models/AutoPromo.model.js';

// Get all automatic promos
export const getAutoPromos = async (req, res) => {
  try {
    // Ambil semua auto promos
    const promos = await AutoPromo.find();

    const now = new Date();

    // Cek dan update status isActive jika sudah expired
    const expiredIds = promos
      .filter(promo => promo.isActive && promo.validTo < now)
      .map(promo => promo._id);

    if (expiredIds.length > 0) {
      await AutoPromo.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { isActive: false } }
      );
    }

    // Ambil ulang data dengan populate setelah update
    const autoPromos = await AutoPromo.find()
      .populate('outlet', 'name _id')
      .populate('conditions.buyProduct', 'name _id')
      .populate('conditions.getProduct', 'name _id')
      .populate({
        path: 'conditions.bundleProducts.product',
        select: 'name _id',
      });

    if (!autoPromos || autoPromos.length === 0) {
      return res.status(404).json({ message: "No auto promos found." });
    }

    res.status(200).json(autoPromos);
  } catch (error) {
    console.error("Error fetching auto promos:", error.message);
    res.status(500).json({ message: "Server error while fetching auto promos.", details: error.message });
  }
};


// Get a single automatic promo by ID
export const getAutoPromoById = async (req, res) => {
  try {
    const autoPromo = await AutoPromo.findById(req.params.id).populate('outlet conditions.buyProduct conditions.getProduct conditions.bundleProducts.product');
    if (!autoPromo) return res.status(404).json({ message: 'Promo not found' });
    res.status(200).json(autoPromo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new automatic promo
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
    res.status(201).json(autoPromo);
  } catch (error) {
    console.error("Error saving promo:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Update an existing automatic promo
export const updateAutoPromo = async (req, res) => {
  try {
    const autoPromo = await AutoPromo.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('outlet conditions.buyProduct conditions.getProduct conditions.bundleProducts.product');
    if (!autoPromo) return res.status(404).json({ message: 'Promo not found' });
    res.status(200).json(autoPromo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an automatic promo
export const deleteAutoPromo = async (req, res) => {
  try {
    const autoPromo = await AutoPromo.findByIdAndDelete(req.params.id);
    if (!autoPromo) return res.status(404).json({ message: 'Promo not found' });
    res.status(200).json({ message: 'Promo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
