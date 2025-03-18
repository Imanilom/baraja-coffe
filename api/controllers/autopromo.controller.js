import AutoPromo from '../models/AutoPromo.model.js';

// Get all automatic promos
export const getAutoPromos = async (req, res) => {
  try {
    const autoPromos = await AutoPromo.find().populate('outlet conditions.buyProduct conditions.getProduct conditions.bundleProducts.product');
    res.status(200).json(autoPromos);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  try {
    const autoPromo = new AutoPromo(req.body);
    await autoPromo.save();
    res.status(201).json(autoPromo);
  } catch (error) {
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
