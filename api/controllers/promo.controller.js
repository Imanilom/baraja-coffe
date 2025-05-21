import Promo from '../models/Promo.model.js';

// Get all promos
export const getPromos = async (req, res) => {
  try {
    const now = new Date();

    // Update promos that are expired and still marked as active
    await Promo.updateMany(
      { validTo: { $lt: now }, isActive: true },
      { $set: { isActive: false } }
    );

    // Get updated promos
    const promos = await Promo.find().populate('outlet createdBy');

    res.status(200).json(promos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get a single promo by ID
export const getPromoById = async (req, res) => {
  try {
    const promo = await Promo.findById(req.params.id).populate('outlet createdBy');
    if (!promo) return res.status(404).json({ message: 'Promo not found' });
    res.status(200).json(promo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new promo
export const createPromo = async (req, res) => {
  try {
    const { name, discountAmount, discountType, customerType, outlet, validFrom, validTo } = req.body;
    const createdBy = req.user._id; // Pastikan req.user sudah terisi dengan benar

    // Perbaikan: Masukkan data sebagai objek ke dalam constructor Promo
    const promo = new Promo({
      name,
      discountAmount,
      discountType,
      customerType,
      outlet, // Pastikan ini dalam bentuk array jika di skema terdefinisi sebagai array
      createdBy,
      validFrom,
      validTo
    });

    await promo.save(); // Simpan promo ke database
    res.status(201).json(promo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Update an existing promo
export const updatePromo = async (req, res) => {
  try {
    const promo = await Promo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!promo) return res.status(404).json({ message: 'Promo not found' });
    res.status(200).json(promo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a promo
export const deletePromo = async (req, res) => {
  try {
    const promo = await Promo.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promo not found' });
    res.status(200).json({ message: 'Promo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
