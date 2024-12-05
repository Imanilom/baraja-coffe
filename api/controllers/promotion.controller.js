import Promotion from '../models/promotion.model.js';

// Create a new promotion
export const createPromotion = async (req, res) => {
  try {
    const { title, description, discountPercentage, startDate, endDate, applicableItems } = req.body;

    const promotion = new Promotion({
      title,
      description,
      discountPercentage,
      startDate,
      endDate,
      applicableItems,
    });

    await promotion.save();
    res.status(201).json({ message: 'Promotion created successfully', promotion });
  } catch (error) {
    res.status(500).json({ message: 'Error creating promotion', error: error.message });
  }
};

// Get all promotions
export const getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find().populate('applicableItems');
    res.status(200).json(promotions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching promotions', error: error.message });
  }
};

// Get a single promotion by ID
export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findById(id).populate('applicableItems');

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.status(200).json(promotion);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching promotion', error: error.message });
  }
};

// Update a promotion
export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const promotion = await Promotion.findByIdAndUpdate(id, updatedData, { new: true }).populate('applicableItems');

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.status(200).json({ message: 'Promotion updated successfully', promotion });
  } catch (error) {
    res.status(500).json({ message: 'Error updating promotion', error: error.message });
  }
};

// Delete a promotion
export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByIdAndDelete(id);

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.status(200).json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting promotion', error: error.message });
  }
};
