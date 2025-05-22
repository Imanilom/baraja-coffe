import { RawMaterial } from '../models/RawMaterial.model.js';
import { StockOpname } from '../models/StockOpname.model.js';



// Batch insert or update stock with outlet, date, and notes
export const batchInsertStock = async (req, res) => {
  try {
    const { outletId, datein, notes, materials } = req.body;     
    if (!outletId || !datein || !Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ message: 'Invalid request data' });
    }
    
    const bulkOps = materials.map(material => ({
      updateOne: {
        filter: { name: material.name, category: material.category, availableAt: outletId },
        update: {
          $inc: { quantity: material.quantity },
          $setOnInsert: {
            name: material.name,
            category: material.category,
            unit: material.unit,
            minimumStock: material.minimumStock,
            maximumStock: material.maximumStock,
            costPerUnit: material.costPerUnit,
            supplier: material.supplier,
            expiryDate: material.expiryDate,
            availableAt: outletId,
            datein: datein,
            notes: notes,
            lastUpdatedBy: req.user._id,
          }
        },
        upsert: true,
      }
    }));
    
    const result = await RawMaterial.bulkWrite(bulkOps);
    res.status(200).json({ message: 'Stock batch processed successfully', result });
  } catch (error) {
    res.status(500).json({ message: 'Error processing batch stock', error });
  }
};

// get all raw materials
export const getRawMaterials = async (req, res) => {
  try {
    const { outletId, status } = req.query;
    let filter = {};

    // Tambahkan filter berdasarkan outlet jika diberikan
    if (outletId) {
      filter.availableAt = outletId;
    }

    // Tambahkan filter berdasarkan status jika diberikan
    if (status) {
      filter.status = status;
    }

    // Ambil data bahan baku berdasarkan filter
    const rawMaterials = await RawMaterial.find(filter).populate('availableAt lastUpdatedBy category');

    res.status(200).json({
      message: 'Raw materials retrieved successfully',
      data: rawMaterials
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving raw materials', error: error.message });
  }
};

// Update a raw material by ID
export const updateRawMaterial = async (req, res) => {
  try {
    const {
      name,
      category,
      quantity,
      unit,
      minimumStock,
      maximumStock,
      costPerUnit,
      supplier,
      expiryDate,
    } = req.body;

    const updates = {
      name,
      category,
      quantity,
      unit,
      minimumStock,
      maximumStock,
      costPerUnit,
      supplier,
      expiryDate,
    };

    const updatedRawMaterial = await RawMaterial.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updatedRawMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found',
      });
    }

    res.status(200).json({ success: true, data: updatedRawMaterial });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update raw material',
      error: error.message,
    });
  }
};

// Delete a raw material by ID
export const deleteRawMaterial = async (req, res) => {
  try {
    const deletedRawMaterial = await RawMaterial.findByIdAndDelete(req.params.id);

    if (!deletedRawMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Raw material deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete raw material',
      error: error.message,
    });
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
