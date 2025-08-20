import LoyaltyProgram from '../models/LoyaltyProgram.model.js'; // Pastikan path sesuai dengan struktur proyek Anda
import LoyaltyLevel from '../models/LoyaltyLevel.model.js';
import mongoose from 'mongoose';

// 1. Membuat Program Loyalty Baru
export const createLoyaltyProgram = async (req, res) => {
  try {
    const { name, description, pointsPerRp, registrationPoints, firstTransactionPoints, pointsToDiscountRatio, discountValuePerPoint, outlet } = req.body;

    // Validasi input
    if (!name || !pointsPerRp || !registrationPoints || !firstTransactionPoints || !pointsToDiscountRatio || !discountValuePerPoint) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Periksa apakah nama program sudah ada
    const existingProgram = await LoyaltyProgram.findOne({ name });
    if (existingProgram) {
      return res.status(400).json({ success: false, message: 'Loyalty program with this name already exists' });
    }

    // Buat program loyalty baru
    const newProgram = new LoyaltyProgram({
      name,
      description,
      consumertype,
      pointsPerRp,
      registrationPoints,
      firstTransactionPoints,
      pointsToDiscountRatio,
      discountValuePerPoint,
      outlet,
    });

    await newProgram.save();

    res.status(201).json({ success: true, message: 'Loyalty program created successfully', data: newProgram });
  } catch (error) {
    console.error('Error creating loyalty program:', error);
    res.status(500).json({ success: false, message: 'Failed to create loyalty program', error: error.message });
  }
};

// 2. Mengambil Semua Program Loyalty
export const getAllLoyaltyPrograms = async (req, res) => {
  try {
    const programs = await LoyaltyProgram.find().populate('outlet');

    if (!programs || programs.length === 0) {
      return res.status(404).json({ success: false, message: 'No loyalty programs found' });
    }

    res.status(200).json({ success: true, data: programs });
  } catch (error) {
    console.error('Error fetching loyalty programs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loyalty programs', error: error.message });
  }
};

// 3. Mengambil Program Loyalty Berdasarkan ID
export const getLoyaltyProgramById = async (req, res) => {
  try {
    const programId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: 'Invalid loyalty program ID' });
    }

    const program = await LoyaltyProgram.findById(programId).populate('outlet');

    if (!program) {
      return res.status(404).json({ success: false, message: 'Loyalty program not found' });
    }

    res.status(200).json({ success: true, data: program });
  } catch (error) {
    console.error('Error fetching loyalty program by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loyalty program by ID', error: error.message });
  }
};

// 4. Memperbarui Program Loyalty
export const updateLoyaltyProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: 'Invalid loyalty program ID' });
    }

    const program = await LoyaltyProgram.findByIdAndUpdate(programId, updates, { new: true, runValidators: true }).populate('outlet');

    if (!program) {
      return res.status(404).json({ success: false, message: 'Loyalty program not found' });
    }

    res.status(200).json({ success: true, message: 'Loyalty program updated successfully', data: program });
  } catch (error) {
    console.error('Error updating loyalty program:', error);
    res.status(500).json({ success: false, message: 'Failed to update loyalty program', error: error.message });
  }
};

// 5. Menghapus Program Loyalty
export const deleteLoyaltyProgram = async (req, res) => {
  try {
    const programId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: 'Invalid loyalty program ID' });
    }

    const program = await LoyaltyProgram.findByIdAndDelete(programId);

    if (!program) {
      return res.status(404).json({ success: false, message: 'Loyalty program not found' });
    }

    res.status(200).json({ success: true, message: 'Loyalty program deleted successfully' });
  } catch (error) {
    console.error('Error deleting loyalty program:', error);
    res.status(500).json({ success: false, message: 'Failed to delete loyalty program', error: error.message });
  }
};


// Loyalty Level

// CREATE
export const createLoyaltyLevel = async (req, res) => {
  try {
    const {
      name,
      requiredPoints,
      description,
      pointsPerCurrency,
      currencyUnit,
      levelUpBonusPoints,
      benefits
    } = req.body;

    // Validasi input wajib
    if (!name || requiredPoints == null || pointsPerCurrency == null || currencyUnit == null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, requiredPoints, pointsPerCurrency, currencyUnit'
      });
    }

    // Validasi angka
    if (requiredPoints < 0 || pointsPerCurrency <= 0 || currencyUnit <= 0 || (levelUpBonusPoints && levelUpBonusPoints < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Numeric fields must be positive values'
      });
    }

    // Validasi benefits
    if (benefits && !Array.isArray(benefits)) {
      return res.status(400).json({
        success: false,
        message: 'Benefits must be an array of strings'
      });
    }

    // Cek duplikat nama
    const existingLevel = await LoyaltyLevel.findOne({ name: name.trim() });
    if (existingLevel) {
      return res.status(400).json({ success: false, message: 'Loyalty level with this name already exists' });
    }

    // Buat level baru
    const newLevel = new LoyaltyLevel({
      name: name.trim(),
      requiredPoints,
      description,
      pointsPerCurrency,
      currencyUnit,
      levelUpBonusPoints: levelUpBonusPoints || 0,
      benefits: benefits || []
    });

    await newLevel.save();

    res.status(201).json({
      success: true,
      message: 'Loyalty level created successfully',
      data: newLevel
    });
  } catch (error) {
    console.error('Error creating loyalty level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create loyalty level',
      error: error.message
    });
  }
};

// GET ALL
export const getAllLoyaltyLevels = async (req, res) => {
  try {
    const levels = await LoyaltyLevel.find().sort({ requiredPoints: 1 });

    res.status(200).json({
      success: true,
      count: levels.length,
      data: levels
    });
  } catch (error) {
    console.error('Error fetching loyalty levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loyalty levels',
      error: error.message
    });
  }
};

// UPDATE
export const updateLoyaltyLevel = async (req, res) => {
  try {
    const levelId = req.params.id;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(levelId)) {
      return res.status(400).json({ success: false, message: 'Invalid loyalty level ID' });
    }

    // Validasi benefits kalau dikirim
    if (updates.benefits && !Array.isArray(updates.benefits)) {
      return res.status(400).json({
        success: false,
        message: 'Benefits must be an array of strings'
      });
    }

    // Validasi angka
    const numericFields = ['requiredPoints', 'pointsPerCurrency', 'currencyUnit', 'levelUpBonusPoints'];
    for (const field of numericFields) {
      if (updates[field] != null && updates[field] < 0) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a positive number`
        });
      }
    }

    const level = await LoyaltyLevel.findByIdAndUpdate(
      levelId,
      updates,
      { new: true, runValidators: true }
    );

    if (!level) {
      return res.status(404).json({ success: false, message: 'Loyalty level not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Loyalty level updated successfully',
      data: level
    });
  } catch (error) {
    console.error('Error updating loyalty level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update loyalty level',
      error: error.message
    });
  }
};
