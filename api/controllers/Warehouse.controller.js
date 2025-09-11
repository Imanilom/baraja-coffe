import Warehouse from '../models/modul_market/Warehouse.model.js';
import mongoose from 'mongoose'; // untuk validasi ObjectId

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Public
export const getAllWarehouses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive } = req.query;

    const query = {
      ...(search && {
        $or: [
          { code: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ]
      }),
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    };

    const warehouses = await Warehouse.find(query)
      .populate('admin', 'name email username') // opsional: tampilkan hanya field tertentu dari User
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Warehouse.countDocuments(query);

    res.status(200).json({
      success: true,
      data: warehouses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single warehouse by ID
// @route   GET /api/warehouses/:id
// @access  Public
export const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id)
      .populate('admin', 'name email username'); // populate admin jika ada

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.status(200).json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new warehouse
// @route   POST /api/warehouses
// @access  Private/Admin
export const createWarehouse = async (req, res) => {
  try {
    const { code, name, type, admin } = req.body;

    // Validasi dasar
    if (!code || !name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Code, name, and type are required'
      });
    }

    // Validasi admin jika disediakan
    if (admin && !mongoose.Types.ObjectId.isValid(admin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin user ID'
      });
    }

    const existingWarehouse = await Warehouse.findOne({ code: code.toLowerCase() });
    if (existingWarehouse) {
      return res.status(409).json({
        success: false,
        message: 'Warehouse code already exists'
      });
    }

    const warehouse = new Warehouse({
      code: code.toLowerCase(),
      name,
      type,
      admin: admin || undefined // biarkan null/undefined jika tidak disediakan
    });

    await warehouse.save();

    // Populate admin di response
    const populatedWarehouse = await warehouse.populate('admin', 'name email username');

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: populatedWarehouse
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate warehouse code'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private/Admin
export const updateWarehouse = async (req, res) => {
  try {
    const { code, name, type, admin, isActive } = req.body;

    const updateData = {};
    if (code) updateData.code = code.toLowerCase();
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Validasi dan set admin jika ada
    if (admin !== undefined) {
      if (admin === null) {
        updateData.admin = null;
      } else if (mongoose.Types.ObjectId.isValid(admin)) {
        updateData.admin = admin;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid admin user ID'
        });
      }
    }

    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('admin', 'name email username');

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate warehouse code'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Soft delete warehouse (set isActive to false)
// @route   DELETE /api/warehouses/:id
// @access  Private/Admin
export const deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).populate('admin', 'name email username');

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Warehouse deactivated successfully',
      data: warehouse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Restore warehouse (set isActive to true)
// @route   PATCH /api/warehouses/:id/restore
// @access  Private/Admin
export const restoreWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).populate('admin', 'name email username');

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Warehouse activated successfully',
      data: warehouse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};