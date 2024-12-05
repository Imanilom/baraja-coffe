import { RawMaterial } from '../models/RawMaterial.model.js';
import { StockOpname } from '../models/StockOpname.model.js';

// Raw Material Controllers

// Add a new raw material
export const createRawMaterial = async (req, res) => {
  try {
    const { name, quantity, unit, minimumStock, supplier } = req.body;

    const rawMaterial = new RawMaterial({
      name,
      quantity,
      unit,
      minimumStock,
      supplier,
    });

    const savedRawMaterial = await rawMaterial.save();
    res.status(201).json({ success: true, data: savedRawMaterial });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create raw material', error: error.message });
  }
};

// Get all raw materials
export const getRawMaterials = async (req, res) => {
  try {
    const rawMaterials = await RawMaterial.find();
    res.status(200).json({ success: true, data: rawMaterials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch raw materials', error: error.message });
  }
};

// Update a raw material by ID
export const updateRawMaterial = async (req, res) => {
  try {
    const { name, quantity, unit, minimumStock, supplier } = req.body;

    const updatedRawMaterial = await RawMaterial.findByIdAndUpdate(
      req.params.id,
      { name, quantity, unit, minimumStock, supplier, lastUpdated: Date.now() },
      { new: true }
    );

    if (!updatedRawMaterial) return res.status(404).json({ success: false, message: 'Raw material not found' });

    res.status(200).json({ success: true, data: updatedRawMaterial });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update raw material', error: error.message });
  }
};

// Delete a raw material by ID
export const deleteRawMaterial = async (req, res) => {
  try {
    const deletedRawMaterial = await RawMaterial.findByIdAndDelete(req.params.id);

    if (!deletedRawMaterial) return res.status(404).json({ success: false, message: 'Raw material not found' });

    res.status(200).json({ success: true, message: 'Raw material deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete raw material', error: error.message });
  }
};

// Stock Opname Controllers

// Add a new stock opname
export const createStockOpname = async (req, res) => {
  try {
    const { itemType, itemId, initialStock, finalStock, remarks } = req.body;

    const stockOpname = new StockOpname({
      itemType,
      itemId,
      initialStock,
      finalStock,
      remarks,
    });

    const savedStockOpname = await stockOpname.save();
    res.status(201).json({ success: true, data: savedStockOpname });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create stock opname', error: error.message });
  }
};

// Get all stock opnames
export const getStockOpnames = async (req, res) => {
  try {
    const stockOpnames = await StockOpname.find().populate('itemId');
    res.status(200).json({ success: true, data: stockOpnames });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stock opnames', error: error.message });
  }
};

// Get stock opname by ID
export const getStockOpnameById = async (req, res) => {
  try {
    const stockOpname = await StockOpname.findById(req.params.id).populate('itemId');

    if (!stockOpname) return res.status(404).json({ success: false, message: 'Stock opname not found' });

    res.status(200).json({ success: true, data: stockOpname });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stock opname', error: error.message });
  }
};

// Update stock opname by ID
export const updateStockOpname = async (req, res) => {
  try {
    const { itemType, itemId, initialStock, finalStock, remarks } = req.body;

    const updatedStockOpname = await StockOpname.findByIdAndUpdate(
      req.params.id,
      { itemType, itemId, initialStock, finalStock, remarks },
      { new: true }
    );

    if (!updatedStockOpname) return res.status(404).json({ success: false, message: 'Stock opname not found' });

    res.status(200).json({ success: true, data: updatedStockOpname });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update stock opname', error: error.message });
  }
};

// Delete stock opname by ID
export const deleteStockOpname = async (req, res) => {
  try {
    const deletedStockOpname = await StockOpname.findByIdAndDelete(req.params.id);

    if (!deletedStockOpname) return res.status(404).json({ success: false, message: 'Stock opname not found' });

    res.status(200).json({ success: true, message: 'Stock opname deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete stock opname', error: error.message });
  }
};
