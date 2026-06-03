import Asset from '../models/Asset.model.js';
import Warehouse from '../models/modul_market/Warehouse.model.js';

// CREATE: tambah asset baru
export const createAsset = async (req, res) => {
  try {
    const { name, code, category, description, quantity, unit, price, currency, warehouse, barcode } = req.body;

    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const asset = new Asset({
      name,
      code,
      category,
      description,
      quantity,
      unit,
      price,
      currency,
      warehouse,
      barcode,
    });

    await asset.save();
    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating asset', error: error.message });
  }
};

// READ: ambil semua asset
export const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find()
      .populate('warehouse', 'code name type')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching assets', error: error.message });
  }
};

// READ: ambil asset by id
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('warehouse', 'code name type');
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    res.json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching asset', error: error.message });
  }
};

// UPDATE: update asset
export const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('warehouse', 'code name type');

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    res.json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating asset', error: error.message });
  }
};

// DELETE: hapus asset
export const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    res.json({ success: true, message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting asset', error: error.message });
  }
};

// REPORT: ambil semua asset berdasarkan warehouse
export const getAssetsByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const assets = await Asset.find({ warehouse: warehouseId });
    const totalValue = assets.reduce((sum, a) => sum + (a.quantity * a.price), 0);

    res.json({
      success: true,
      warehouse,
      totalValue,
      assets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching warehouse assets', error: error.message });
  }
};

// REPORT: ringkasan semua asset (per kategori & total nilai)
export const getAssetsSummary = async (req, res) => {
  try {
    const summary = await Asset.aggregate([
      {
        $group: {
          _id: '$category',
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
        },
      },
      { $sort: { totalValue: -1 } },
    ]);

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching asset summary', error: error.message });
  }
};
