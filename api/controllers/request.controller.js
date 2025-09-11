import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Product from '../models/modul_market/Product.model.js';
import ProductStock from '../models//modul_menu/ProductStock.model.js';
import Request from '../models/modul_market/Request.model.js';

class RequestController {

  // Membuat request baru (hanya membuat request, belum mengambil stok)
    async createRequest(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(req.user._id).session(session);
      if (!user || !['staff', 'admin', 'superadmin'].includes(user.role)) {
        await session.abortTransaction();
        return res.status(403).json({ message: 'Akses ditolak' });
      }

      const { requestedWarehouse, items } = req.body;
      if (!requestedWarehouse) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Warehouse wajib diisi' });
      }

      const requestItems = [];
      
      for (const item of items) {
        const { productId, quantity, notes } = item;
        if (!productId || !quantity || quantity <= 0) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: 'Data item tidak lengkap atau quantity <= 0' 
          });
        }

        const productDoc = await Product.findById(productId).session(session);
        if (!productDoc) {
          await session.abortTransaction();
          return res.status(404).json({ 
            message: `Produk dengan ID ${productId} tidak ditemukan` 
          });
        }

        if (quantity < productDoc.minimumrequest) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Permintaan minimal ${productDoc.minimumrequest} ${productDoc.unit} untuk ${productDoc.name}`
          });
        }

        // Cek stok di Gudang Pusat
        let stockDoc = await ProductStock.findOne({ 
        productId, 
        warehouse: requestedWarehouse 
      }).session(session);


        // Auto-create jika belum ada
        if (!stockDoc) {
          stockDoc = new ProductStock({
          productId,
          warehouse: requestedWarehouse,
          currentStock: 0,
          minStock: 0,
          movements: []
          });

          await stockDoc.save({ session });
          console.log(`Auto-creating warehouse stock for product ${productId}`);
        }

        const availableStock = stockDoc.currentStock;

        requestItems.push({
          productId,
          productName: productDoc.name,
          productSku: productDoc.sku,
          category: productDoc.category,
          quantity,
          unit: productDoc.unit,
          notes: notes || '',
          status: 'pending',
          fulfilledQuantity: 0,
          availableStock,
          minimumRequest: productDoc.minimumrequest
        });
      }

      // Buat request tanpa mengubah stok dulu
      const newRequest = new Request({
      requestedWarehouse,
      requester: user.username,
      items: requestItems,
      status: 'pending',
      fulfillmentStatus: 'pending'
    });


      await newRequest.save({ session });
      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: 'Request berhasil dibuat, menunggu approval',
        data: newRequest
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Error creating request:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Terjadi kesalahan server.' 
      });
    } finally {
      session.endSession();
    }
  }


  // Approve request dan fulfill stok
async approveAndFulfillRequest(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user._id).session(session);
    if (!user || !['staff','admin', 'superadmin'].includes(user.role)) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const { requestId } = req.body;
    
    const requestDoc = await Request.findById(requestId).populate('requestedWarehouse').session(session);
    if (!requestDoc) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    if (requestDoc.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Request sudah diproses' });
    }

    const destinationWarehouse = requestDoc.requestedWarehouse._id;
    const updatedItems = [];
    const transferSummary = [];
    const productStockUpdates = [];
    
    // Process setiap item dalam request
    for (const item of requestDoc.items) {
      const { productId, quantity, _id: itemId } = item;

      // Find all warehouses that have this product in stock
      const availableStocks = await ProductStock.find({
        productId,
        currentStock: { $gt: 0 }
      }).session(session);

      let totalAvailableStock = availableStocks.reduce((sum, stock) => sum + stock.currentStock, 0);
      let remainingQuantityNeeded = quantity;
      let fulfilledQuantity = 0;
      let itemStatus = 'tidak tersedia';
      const transferDetails = [];

      // Sort warehouses by stock quantity (highest first)
      availableStocks.sort((a, b) => b.currentStock - a.currentStock);

      // Try to fulfill from available warehouses
      for (const sourceStock of availableStocks) {
        if (remainingQuantityNeeded <= 0) break;

        const sourceWarehouseId = sourceStock.warehouse;
        const availableInThisWarehouse = sourceStock.currentStock;

        // Skip if this is already the destination warehouse and we have enough
        if (sourceWarehouseId.toString() === destinationWarehouse.toString() && availableInThisWarehouse >= quantity) {
          fulfilledQuantity = quantity;
          remainingQuantityNeeded = 0;
          itemStatus = 'dibeli';
          transferDetails.push({
            from: sourceWarehouseId,
            to: destinationWarehouse,
            quantity: 0, // No transfer needed, already in destination
            note: 'Already in destination warehouse'
          });
          break;
        }

        const transferQuantity = Math.min(remainingQuantityNeeded, availableInThisWarehouse);
        
        if (transferQuantity > 0) {
          fulfilledQuantity += transferQuantity;
          remainingQuantityNeeded -= transferQuantity;

          // Only transfer if different warehouses
          if (sourceWarehouseId.toString() !== destinationWarehouse.toString()) {
            // OUT movement from source warehouse
            productStockUpdates.push({
              updateOne: {
                filter: { productId, warehouse: sourceWarehouseId },
                update: {
                  $inc: { currentStock: -transferQuantity },
                  $push: { 
                    movements: {
                      quantity: transferQuantity,
                      type: 'transfer',
                      referenceId: requestDoc._id,
                      notes: `Transfer ke warehouse ${destinationWarehouse} untuk request dari ${requestDoc.requester}`,
                      sourceWarehouse: sourceWarehouseId,
                      destinationWarehouse: destinationWarehouse,
                      handledBy: user.username,
                      date: new Date()
                    }
                  }
                }
              }
            });

            // IN movement to destination warehouse
            productStockUpdates.push({
              updateOne: {
                filter: { productId, warehouse: destinationWarehouse },
                update: {
                  $inc: { currentStock: transferQuantity },
                  $push: { 
                    movements: {
                      quantity: transferQuantity,
                      type: 'transfer',
                      referenceId: requestDoc._id,
                      notes: `Transfer dari warehouse ${sourceWarehouseId} untuk request dari ${requestDoc.requester}`,
                      sourceWarehouse: sourceWarehouseId,
                      destinationWarehouse: destinationWarehouse,
                      handledBy: user.username,
                      date: new Date()
                    }
                  },
                  $setOnInsert: { 
                    category: item.category,
                    minStock: 0
                  }
                },
                upsert: true
              }
            });

            transferDetails.push({
              from: sourceWarehouseId,
              to: destinationWarehouse,
              quantity: transferQuantity,
              note: `Transferred ${transferQuantity} ${item.unit}`
            });
          }
        }
      }

      // Determine final status
      if (fulfilledQuantity >= quantity) {
        itemStatus = 'dibeli';
      } else if (fulfilledQuantity > 0) {
        itemStatus = 'kurang';
      } else {
        itemStatus = 'tidak tersedia';
      }

      // Update item in request
      const updatedItem = {
        ...item.toObject(),
        status: itemStatus,
        fulfilledQuantity: fulfilledQuantity,
        availableStock: totalAvailableStock,
        processedAt: new Date(),
        processedBy: user.username
      };
      updatedItems.push(updatedItem);

      transferSummary.push({
        productName: item.productName,
        productSku: item.productSku,
        requested: quantity,
        fulfilled: fulfilledQuantity,
        totalAvailable: totalAvailableStock,
        status: itemStatus,
        transfers: transferDetails
      });
    }

    // Execute all stock updates in bulk
    if (productStockUpdates.length > 0) {
      await ProductStock.bulkWrite(productStockUpdates, { session });
    }

    // Update request document
    requestDoc.items = updatedItems;
    requestDoc.status = 'approved';
    requestDoc.reviewed = true;
    requestDoc.reviewedBy = user.username;
    requestDoc.reviewedAt = new Date();

    // Calculate overall fulfillment status
    const totalRequested = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalFulfilled = updatedItems.reduce((sum, item) => sum + item.fulfilledQuantity, 0);
    const allFulfilled = updatedItems.every(item => item.status === 'dibeli');
    const noneFulfilled = updatedItems.every(item => item.status === 'tidak tersedia');
    const somePartial = updatedItems.some(item => item.status === 'kurang');

    if (allFulfilled) {
      requestDoc.fulfillmentStatus = 'dibeli';
    } else if (noneFulfilled) {
      requestDoc.fulfillmentStatus = 'tidak tersedia';
    } else if (somePartial || totalFulfilled < totalRequested) {
      requestDoc.fulfillmentStatus = 'partial';
    } else {
      requestDoc.fulfillmentStatus = 'kurang';
    }

    // Update fulfilled items count
    requestDoc.fulfilledItems = updatedItems.filter(item => 
      item.fulfilledQuantity > 0
    ).length;

    await requestDoc.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Request berhasil diapprove dan stok telah dipindahkan',
      data: {
        request: requestDoc,
        transferSummary,
        destinationWarehouse,
        totalRequested: totalRequested,
        totalFulfilled: totalFulfilled,
        fulfillmentPercentage: totalRequested > 0 ? Math.round((totalFulfilled / totalRequested) * 100) : 0
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error approving request:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Terjadi kesalahan server.' 
    });
  } finally {
    session.endSession();
  }
}


  // Reject request
  async rejectRequest(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user || !['admin', 'superadmin'].includes(user.role)) {
        return res.status(403).json({ message: 'Akses ditolak' });
      }

      const { requestId, reason } = req.body;
      
      const requestDoc = await Request.findById(requestId);
      if (!requestDoc) {
        return res.status(404).json({ message: 'Request tidak ditemukan' });
      }

      if (requestDoc.status !== 'pending') {
        return res.status(400).json({ message: 'Request sudah diproses' });
      }

      requestDoc.status = 'rejected';
      requestDoc.reviewed = true;
      requestDoc.reviewedBy = user.username;
      requestDoc.reviewedAt = new Date();
      requestDoc.rejectionReason = reason;
      requestDoc.fulfillmentStatus = 'tidak tersedia';

      await requestDoc.save();

      res.status(200).json({
        success: true,
        message: 'Request berhasil ditolak',
        data: requestDoc
      });

    } catch (error) {
      console.error('Error rejecting request:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Terjadi kesalahan server.' 
      });
    }
  }

  // Get request list dengan filter
  async getRequests(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(403).json({ message: 'Akses ditolak' });
      }

      const { 
        status, 
        department, 
        fulfillmentStatus,
        page = 1, 
        limit = 20,
        startDate,
        endDate
      } = req.query;

      const filter = {};
      
      // Filter berdasarkan role
      if (user.role === 'staff') {
        filter.requester = user.username;
      }

      if (status) filter.status = status;
      if (department) filter.department = department;
      if (fulfillmentStatus) filter.fulfillmentStatus = fulfillmentStatus;
      
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      
      const requests = await Request.find(filter)
        .populate('items.productId', 'name sku category unit')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Request.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          requests,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });

    } catch (error) {
      console.error('Error getting requests:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Terjadi kesalahan server.' 
      });
    }
  }

  // Get request detail
  async getRequestDetail(req, res) {
    try {
      const { requestId } = req.params;
      const user = await User.findById(req.user._id);

      const request = await Request.findById(requestId)
        .populate('items.productId', 'name sku category unit minimumrequest');

      if (!request) {
        return res.status(404).json({ message: 'Request tidak ditemukan' });
      }

      // Staff hanya bisa lihat request sendiri
      if (user.role === 'staff' && request.requester !== user.username) {
        return res.status(403).json({ message: 'Akses ditolak' });
      }

      res.status(200).json({
        success: true,
        data: request
      });

    } catch (error) {
      console.error('Error getting request detail:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Terjadi kesalahan server.' 
      });
    }
  }
}

export default new RequestController();