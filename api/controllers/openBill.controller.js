// controllers/openBill.controller.js
import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import Reservation from '../models/Reservation.model.js';
import Table from '../models/Table.model.js';
import Area from '../models/Area.model.js';
import Payment from '../models/Payment.model.js';
import Joi from 'joi';
import { Log } from '../models/Log.model.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: simpan audit log ke database
// ─────────────────────────────────────────────────────────────────────────────
const createAuditLog = async ({
  req,
  action,
  description,
  status = 'SUCCESS',
  metadata = {}
}) => {
  try {
    const cashierId = req.body?.cashierId || req.user?._id || req.user?.id || null;
    const cashierName = req.body?.cashierName || req.user?.username || req.user?.name || 'unknown';
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    await Log.create({
      userId: cashierId,
      identifier: cashierName,
      action,
      module: 'Open Bill',
      description,
      status,
      ip,
      userAgent,
      metadata: {
        ...metadata,
        cashierName,
        timestamp: new Date().toISOString()
      }
    });
  } catch (logErr) {
    // Jangan crash controller karena log gagal
    console.error('⚠️  [AUDIT LOG FAILED]', logErr.message);
  }
};

// Helper untuk get WIB time sekarang
const getWIBNow = () => {
  const now = new Date();
  const wibOffset = 7 * 60 * 60 * 1000;
  return new Date(now.getTime() + wibOffset);
};

// Schema untuk menambah item ke order
const addOrderItemSchema = Joi.object({
  menuItem: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).max(100).required(),
  subtotal: Joi.number().min(0).required(), // Tambahkan subtotal
  notes: Joi.string().optional().allow(''),
  guestName: Joi.string().optional().allow(''),
  dineType: Joi.string().valid('Dine-In', 'Take Away').optional().default('Dine-In')

});

// Schema untuk custom amount
const customAmountSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().optional().allow(''),
  dineType: Joi.string().valid('Dine-In', 'Take Away').optional().default('Dine-In'),
  originalAmount: Joi.number().min(0).optional(),
  discountApplied: Joi.number().min(0).optional().default(0)
});

// Schema untuk update custom amount
const updateCustomAmountSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().optional().allow(''),
  dineType: Joi.string().valid('Dine-In', 'Take Away').optional().default('Dine-In'),
  originalAmount: Joi.number().min(0).optional(),
  discountApplied: Joi.number().min(0).optional().default(0)
});


// Schema untuk close order
const closeOrderSchema = Joi.object({
  final_notes: Joi.string().optional().allow('', null),
  payment_method: Joi.string().valid('Cash', 'E-Wallet', 'Bank Transfer', 'Credit Card', 'QRIS', 'Debit').required(),
  amount_paid: Joi.number().min(0).required(),
  change: Joi.number().min(0).optional().default(0),
  // Tambahkan field opsional untuk kompatibilitas
  cashierId: Joi.string().optional().allow('', null),
  cashierName: Joi.string().optional().allow('', null)
});


// Get all open bills - FIXED VERSION
// Di getOpenBills controller, tambahkan opsi untuk include reservasi
export const getOpenBills = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      table_number,
      area_id,
      include_reservations = false // Tambahkan parameter baru
    } = req.query;

    let query = { isOpenBill: true };

    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['Pending', 'Confirmed', 'In Progress', 'OnProcess', 'Waiting'] };
    }

    // JIKA ingin include reservasi yang belum punya order
    if (include_reservations === 'true') {
      // Gabungkan query dari Orders dan Reservasi
      const [orders, reservations] = await Promise.all([
        Order.find(query)
          .populate('reservation')
          .skip((page - 1) * limit)
          .limit(parseInt(limit)),

        // Cari reservasi yang belum punya order dan status confirmed
        Reservation.find({
          status: status || 'confirmed',
          _id: { $nin: await Order.distinct('reservation') } // Exclude yang sudah punya order
        })
          .populate('table_id')
          .populate('area_id')
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
      ]);

      // Format data untuk konsumsi frontend
      const formattedOrders = orders.map(order => ({
        ...order.toObject(),
        type: 'order'
      }));

      const formattedReservations = reservations.map(reservation => ({
        _id: reservation._id,
        reservation: reservation,
        reservation_code: reservation.reservation_code,
        tableNumber: reservation.table_id?.map(t => t.table_number).join(', '),
        area: reservation.area_id?.area_name,
        guest_count: reservation.guest_count,
        reservation_time: reservation.reservation_time,
        status: reservation.status,
        type: 'reservation', // Tandai sebagai reservasi
        can_create_order: true
      }));

      const combinedData = [...formattedOrders, ...formattedReservations];
      const total = await Order.countDocuments(query) +
        await Reservation.countDocuments({
          status: status || 'confirmed',
          _id: { $nin: await Order.distinct('reservation') }
        });

      return res.json({
        success: true,
        data: combinedData,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    }

    // ── Path default: query orders saja tanpa reservasi
    if (table_number) query.tableNumber = table_number;
    if (area_id && mongoose.Types.ObjectId.isValid(area_id)) {
      // Cari reservations yang punya area_id tsb dulu, kemudian filter orders
      const reservationIds = await Reservation.distinct('_id', { area_id });
      query.reservation = { $in: reservationIds };
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('reservation')
        .populate('items.menuItem')
        .sort({ createdAt: -1 })
        .skip((page - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    // ── Audit log sukses
    await createAuditLog({
      req,
      action: 'GET_OPEN_BILLS',
      description: `Kasir melihat daftar open bills — ${orders.length} order ditemukan`,
      metadata: { page, limit, status, area_id, table_number, total }
    });

    return res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    await createAuditLog({
      req,
      action: 'GET_OPEN_BILLS',
      description: `Gagal mengambil daftar open bills: ${error.message}`,
      status: 'FAILED',
      metadata: { error: error.message }
    });
    res.status(500).json({
      success: false,
      message: 'Error getting open bills',
      error: error.message
    });
  }
};

// Get open bill by ID - FIXED VERSION
export const getOpenBillById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Fetching open bill detail for:', id);

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    // Populate table and area information jika ada reservation
    if (order.reservation) {
      const reservation = await Reservation.findById(order.reservation)
        .populate('table_id')
        .populate('area_id');
      order.reservation = reservation;
    }

    console.log(`✅ Open bill detail loaded: ${order.order_id}`);

    // ── Audit log
    await createAuditLog({
      req,
      action: 'GET_OPEN_BILL_DETAIL',
      description: `Kasir melihat detail open bill order ${order.order_id}`,
      metadata: { orderId: id, order_id: order.order_id, status: order.status }
    });

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('❌ Error getting open bill:', error);
    await createAuditLog({
      req,
      action: 'GET_OPEN_BILL_DETAIL',
      description: `Gagal mengambil detail open bill ID ${req.params.id}: ${error.message}`,
      status: 'FAILED',
      metadata: { orderId: req.params.id, error: error.message }
    });
    res.status(500).json({
      success: false,
      message: 'Error getting open bill',
      error: error.message
    });
  }
};

export const addItemToOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    console.log('📥 Received request to add item:', {
      orderId: id,
      body: req.body
    });

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const { error, value } = addOrderItemSchema.validate(req.body);

    if (error) {
      await session.abortTransaction();
      session.endSession();
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { menuItem, quantity, subtotal, notes, guestName, dineType } = value;

    console.log('➕ Adding item to open bill:', {
      orderId: id,
      menuItem,
      quantity,
      subtotal,
      notes,
      guestName,
      dineType
    });

    // Find the open bill order
    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    if (order.status === 'Completed' || order.status === 'Canceled' || order.status === 'Paid') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot add items to completed or canceled order'
      });
    }

    // ✅ TAMBAHAN: Cek apakah sudah ada payment (defense in depth)
    const hasPaidCheck = order.payments && order.payments.length > 0;
    if (hasPaidCheck) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot add items to an order that already has payment records (FRAUD PREVENTION)'
      });
    }

    // DAPATKAN HARGA MENU ITEM DARI DATABASE
    const MenuItem = mongoose.model('MenuItem');
    const menuItemDoc = await MenuItem.findById(menuItem).session(session);

    if (!menuItemDoc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Hitung subtotal SELALU dari database untuk keamanan
    // Jangan percaya subtotal dari frontend
    const calculatedSubtotal = menuItemDoc.price * quantity;
    const itemPrice = menuItemDoc.price;

    console.log('💰 Price calculation (Backend Enforced):', {
      menuPrice: itemPrice,
      quantity: quantity,
      calculatedSubtotal: calculatedSubtotal,
      providedSubtotalFromFrontend: subtotal // Log what frontend sent for debugging
    });

    // Add new item dengan data denormalized
    const newItem = {
      menuItem: menuItem,
      menuItemData: {
        name: menuItemDoc.name || 'Unknown Item',
        price: itemPrice,
        category: menuItemDoc.category || 'Uncategorized',
        sku: menuItemDoc.sku || '',
        isActive: menuItemDoc.isActive !== false
      },
      quantity: quantity,
      subtotal: calculatedSubtotal,
      notes: notes || '',
      guestName: guestName || '',
      dineType: dineType || 'Dine-In',
      addedAt: getWIBNow(),
      kitchenStatus: 'pending',
      isPrinted: false,
      batchNumber: order.currentBatch
    };

    order.items.push(newItem);

    // Recalculate totals
    const itemsTotal = order.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const customAmountTotal = order.customAmountItems.reduce((sum, item) => sum + (item.amount || 0), 0);

    order.totalBeforeDiscount = itemsTotal;
    order.totalAfterDiscount = itemsTotal;
    order.grandTotal = itemsTotal + customAmountTotal;
    order.lastItemAddedAt = getWIBNow();

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Item added to order ${order.order_id}`);

    // ── Audit log
    await createAuditLog({
      req,
      action: 'ADD_ITEM_OPEN_BILL',
      description: `Kasir menambah item "${menuItemDoc.name}" x${quantity} ke order ${order.order_id}`,
      metadata: {
        orderId: id,
        order_id: order.order_id,
        menuItemId: menuItem,
        menuItemName: menuItemDoc.name,
        quantity,
        calculatedSubtotal,
        itemPrice,
        providedSubtotalFromFrontend: value.subtotal,
        dineType,
        notes,
        guestName,
        grandTotalAfter: order.grandTotal
      }
    });

    // Populate the updated order
    const updatedOrder = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    res.json({
      success: true,
      message: 'Item added successfully',
      data: updatedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error adding item to open bill:', error);
    await createAuditLog({
      req,
      action: 'ADD_ITEM_OPEN_BILL',
      description: `Gagal menambah item ke open bill ID ${req.params.id}: ${error.message}`,
      status: 'FAILED',
      metadata: { orderId: req.params.id, body: req.body, error: error.message }
    });
    res.status(500).json({
      success: false,
      message: 'Error adding item to open bill',
      error: error.message
    });
  }
};

// Remove item from open bill — SOFT DELETE VERSION (Fraud Prevention)
export const removeItemFromOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id, itemId } = req.params;
    // Ambil audit context dari request body
    const { reason, cashierId, cashierName } = req.body;

    // Validasi: reason wajib diisi
    if (!reason || reason.trim() === '') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Alasan penghapusan item wajib diisi (field: reason)'
      });
    }

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(itemId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID or item ID format'
      });
    }

    console.log('➖ [SOFT DELETE] Cancelling item from open bill:', { orderId: id, itemId, reason, cashierId });

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.isOpenBill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'This is not an open bill order' });
    }

    // ✅ CRITICAL: Cek status DAN payment — double defense
    const hasPaid = order.payments && order.payments.length > 0;
    if (order.status === 'Completed' || order.status === 'Canceled' || order.status === 'Paid' || hasPaid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat mengubah order yang sudah Completed/Paid (FRAUD PREVENTION)'
      });
    }

    // Cari item dalam order
    const targetItem = order.items.id(itemId);
    if (!targetItem) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Item not found in order' });
    }

    // ✅ Cek sudah di-cancel sebelumnya
    if (targetItem.isCancelled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Item sudah dibatalkan sebelumnya' });
    }

    // Simpan snapshot item sebelum di-cancel
    const cancelledItemSnapshot = {
      menuItemId: targetItem.menuItem,
      menuItemName: targetItem.menuItemData?.name || 'Unknown',
      quantity: targetItem.quantity,
      subtotal: targetItem.subtotal,
      unitPrice: targetItem.quantity > 0 ? Math.round(targetItem.subtotal / targetItem.quantity) : 0,
      cancelledAt: getWIBNow()
    };

    // ✅ SOFT DELETE — mark sebagai cancelled, JANGAN hapus dari array
    const effectiveCashierId = cashierId || req.user?._id || req.user?.id || null;
    targetItem.isCancelled = true;
    targetItem.cancelledAt = getWIBNow();
    targetItem.cancelledBy = mongoose.Types.ObjectId.isValid(effectiveCashierId) ? effectiveCashierId : null;
    targetItem.cancellationReason = reason.trim();

    // ✅ Catat di modificationHistory
    if (!order.modificationHistory) order.modificationHistory = [];
    order.modificationHistory.push({
      action: 'item_deleted',
      itemId: itemId,
      itemDetails: cancelledItemSnapshot,
      reason: reason.trim(),
      cashierId: effectiveCashierId,
      timestamp: getWIBNow(),
      deletedItemPrice: targetItem.subtotal,
      itemQuantity: targetItem.quantity
    });

    // Recalculate totals — HANYA dari item yang TIDAK cancelled
    const itemsTotal = order.items
      .filter(item => !item.isCancelled)
      .reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const customAmountTotal = order.customAmountItems.reduce((sum, item) => sum + (item.amount || 0), 0);

    order.totalBeforeDiscount = itemsTotal;
    order.totalAfterDiscount = itemsTotal;
    order.grandTotal = itemsTotal + customAmountTotal;

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ [SOFT DELETE] Item cancelled in order ${order.order_id}`, {
      cancelledItem: cancelledItemSnapshot,
      reason,
      cashierId: effectiveCashierId,
      newGrandTotal: order.grandTotal
    });

    // ── Audit log
    await createAuditLog({
      req,
      action: 'REMOVE_ITEM_OPEN_BILL',
      description: `Kasir ${cashierName || effectiveCashierId || 'unknown'} membatalkan item "${cancelledItemSnapshot.menuItemName}" x${cancelledItemSnapshot.quantity} (Rp${cancelledItemSnapshot.subtotal}) dari order ${order.order_id}. Alasan: ${reason}`,
      metadata: {
        orderId: id,
        order_id: order.order_id,
        itemId,
        cancelledItem: cancelledItemSnapshot,
        reason,
        cashierIdFromBody: cashierId,
        cashierName: cashierName || 'unknown',
        grandTotalAfter: order.grandTotal,
        softDelete: true
      }
    });

    const updatedOrder = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    res.json({
      success: true,
      message: 'Item berhasil dibatalkan (soft delete — data tetap tersimpan untuk audit)',
      data: updatedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error removing item from open bill:', error);
    await createAuditLog({
      req,
      action: 'REMOVE_ITEM_OPEN_BILL',
      description: `Gagal menghapus item dari open bill ID ${req.params.id}: ${error.message}`,
      status: 'FAILED',
      metadata: { orderId: req.params.id, itemId: req.params.itemId, error: error.message }
    });
    res.status(500).json({
      success: false,
      message: 'Error removing item from open bill',
      error: error.message
    });
  }
};

// Add custom amount to open bill
export const addCustomAmountToOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    console.log('📥 Received request to add custom amount:', {
      orderId: id,
      body: req.body
    });

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const { error, value } = customAmountSchema.validate(req.body);

    if (error) {
      await session.abortTransaction();
      session.endSession();
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { amount, name, description, dineType, originalAmount, discountApplied } = value;

    console.log('💰 Adding custom amount to open bill:', {
      orderId: id,
      amount,
      name,
      description,
      dineType
    });

    // Find the open bill order
    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    if (order.status === 'Completed' || order.status === 'Canceled' || order.status === 'Paid') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot add custom amount to completed or canceled order'
      });
    }

    // ✅ TAMBAHAN: Cek apakah sudah ada payment
    const hasPaidCA = order.payments && order.payments.length > 0;
    if (hasPaidCA) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot add custom amount to an order that already has payment records (FRAUD PREVENTION)'
      });
    }

    // Add new custom amount item
    const newCustomAmount = {
      amount: amount,
      name: name,
      description: description || '',
      dineType: dineType || 'Dine-In',
      appliedAt: getWIBNow(),
      originalAmount: originalAmount || amount,
      discountApplied: discountApplied || 0
    };

    order.customAmountItems.push(newCustomAmount);

    // Recalculate totals
    const itemsTotal = order.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const customAmountTotal = order.customAmountItems.reduce((sum, item) => sum + (item.amount || 0), 0);

    order.totalBeforeDiscount = itemsTotal;
    order.totalAfterDiscount = itemsTotal;
    order.totalCustomAmount = customAmountTotal;
    order.grandTotal = itemsTotal + customAmountTotal;

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Custom amount added to order ${order.order_id}`);

    // ── Audit log
    await createAuditLog({
      req,
      action: 'ADD_CUSTOM_AMOUNT_OPEN_BILL',
      description: `Kasir menambah custom amount "${value.name}" Rp${value.amount} ke order ${order.order_id}`,
      metadata: {
        orderId: id,
        order_id: order.order_id,
        customAmountName: value.name,
        amount: value.amount,
        dineType: value.dineType,
        grandTotalAfter: order.grandTotal
      }
    });

    // Populate the updated order
    const updatedOrder = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    res.json({
      success: true,
      message: 'Custom amount added successfully',
      data: updatedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error adding custom amount to open bill:', error);
    await createAuditLog({
      req,
      action: 'ADD_CUSTOM_AMOUNT_OPEN_BILL',
      description: `Gagal menambah custom amount ke open bill ID ${req.params.id}: ${error.message}`,
      status: 'FAILED',
      metadata: { orderId: req.params.id, body: req.body, error: error.message }
    });
    res.status(500).json({
      success: false,
      message: 'Error adding custom amount to open bill',
      error: error.message
    });
  }
};

// Update custom amount in open bill
export const updateCustomAmountInOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id, customAmountId } = req.params;

    console.log('📥 Received request to update custom amount:', {
      orderId: id,
      customAmountId: customAmountId,
      body: req.body
    });

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(customAmountId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID or custom amount ID format'
      });
    }

    const { error, value } = updateCustomAmountSchema.validate(req.body);

    if (error) {
      await session.abortTransaction();
      session.endSession();
      console.log('❌ Validation error:', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { amount, name, description, dineType, originalAmount, discountApplied } = value;

    // Find the open bill order
    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    // Find the custom amount item
    const customAmountItem = order.customAmountItems.id(customAmountId);
    if (!customAmountItem) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Custom amount item not found'
      });
    }

    // Update custom amount item
    customAmountItem.amount = amount;
    customAmountItem.name = name;
    customAmountItem.description = description || '';
    customAmountItem.dineType = dineType || 'Dine-In';
    customAmountItem.originalAmount = originalAmount || amount;
    customAmountItem.discountApplied = discountApplied || 0;

    // Recalculate totals
    const itemsTotal = order.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const customAmountTotal = order.customAmountItems.reduce((sum, item) => sum + (item.amount || 0), 0);

    order.totalBeforeDiscount = itemsTotal;
    order.totalAfterDiscount = itemsTotal;
    order.totalCustomAmount = customAmountTotal;
    order.grandTotal = itemsTotal + customAmountTotal;

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Custom amount updated in order ${order.order_id}`);

    // ── Audit log
    await createAuditLog({
      req,
      action: 'UPDATE_CUSTOM_AMOUNT_OPEN_BILL',
      description: `Kasir mengupdate custom amount "${name}" Rp${amount} (ID: ${customAmountId}) di order ${order.order_id}`,
      metadata: {
        orderId: id,
        order_id: order.order_id,
        customAmountId,
        updatedAmount: amount,
        updatedName: name,
        grandTotalAfter: order.grandTotal
      }
    });

    // Populate the updated order
    const updatedOrder = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    res.json({
      success: true,
      message: 'Custom amount updated successfully',
      data: updatedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error updating custom amount in open bill:', error);
    await createAuditLog({
      req,
      action: 'UPDATE_CUSTOM_AMOUNT_OPEN_BILL',
      description: `Gagal update custom amount ID ${req.params.customAmountId} di open bill ${req.params.id}: ${error.message}`,
      status: 'FAILED',
      metadata: { orderId: req.params.id, customAmountId: req.params.customAmountId, error: error.message }
    });
    res.status(500).json({
      success: false,
      message: 'Error updating custom amount in open bill',
      error: error.message
    });
  }
};

// Remove custom amount from open bill
export const removeCustomAmountFromOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id, customAmountId } = req.params;

    console.log('📥 Received request to remove custom amount:', {
      orderId: id,
      customAmountId: customAmountId
    });

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(customAmountId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID or custom amount ID format'
      });
    }

    // Find the open bill order
    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    // ✅ CRITICAL FIX: Block modification pada order yang sudah dibayar
    const hasPaid = order.payments && order.payments.length > 0;
    if (order.status === 'Completed' || order.status === 'Canceled' || order.status === 'Paid' || hasPaid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot remove custom amount from ${order.status} or paid order (FRAUD PREVENTION)`
      });
    }

    // Find and remove the custom amount item
    const customAmountItem = order.customAmountItems.id(customAmountId);
    if (!customAmountItem) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Custom amount item not found'
      });
    }

    customAmountItem.deleteOne();

    // Recalculate totals
    const itemsTotal = order.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const customAmountTotal = order.customAmountItems.reduce((sum, item) => sum + (item.amount || 0), 0);

    order.totalBeforeDiscount = itemsTotal;
    order.totalAfterDiscount = itemsTotal;
    order.totalCustomAmount = customAmountTotal;
    order.grandTotal = itemsTotal + customAmountTotal;

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Custom amount removed from order ${order.order_id}`);

    // ── Audit log
    await createAuditLog({
      req,
      action: 'REMOVE_CUSTOM_AMOUNT_OPEN_BILL',
      description: `Kasir menghapus custom amount ID ${customAmountId} dari order ${order.order_id}`,
      metadata: {
        orderId: id,
        order_id: order.order_id,
        customAmountId,
        removedAmount: customAmountItem.amount,
        removedName: customAmountItem.name,
        grandTotalAfter: order.grandTotal
      }
    });

    // Populate the updated order
    const updatedOrder = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    res.json({
      success: true,
      message: 'Custom amount removed successfully',
      data: updatedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error removing custom amount from open bill:', error);
    await createAuditLog({
      req,
      action: 'REMOVE_CUSTOM_AMOUNT_OPEN_BILL',
      description: `Gagal hapus custom amount ID ${req.params.customAmountId} dari open bill ${req.params.id}: ${error.message}`,
      status: 'FAILED',
      metadata: { orderId: req.params.id, customAmountId: req.params.customAmountId, error: error.message }
    });
    res.status(500).json({
      success: false,
      message: 'Error removing custom amount from open bill',
      error: error.message
    });
  }
};

// Get specific custom amount item
export const getCustomAmountFromOpenBill = async (req, res) => {
  try {
    const { id, customAmountId } = req.params;

    console.log('🔍 Fetching custom amount item:', {
      orderId: id,
      customAmountId: customAmountId
    });

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(customAmountId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID or custom amount ID format'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    // Find the custom amount item
    const customAmountItem = order.customAmountItems.id(customAmountId);
    if (!customAmountItem) {
      return res.status(404).json({
        success: false,
        message: 'Custom amount item not found'
      });
    }

    // ── Audit log
    await createAuditLog({
      req,
      action: 'GET_CUSTOM_AMOUNT_OPEN_BILL',
      description: `Kasir melihat custom amount ID ${customAmountId} dari order ${order.order_id}`,
      metadata: {
        orderId: id,
        order_id: order.order_id,
        customAmountId,
        customAmountName: customAmountItem.name,
        amount: customAmountItem.amount
      }
    });

    res.json({
      success: true,
      data: customAmountItem
    });

  } catch (error) {
    console.error('❌ Error getting custom amount from open bill:', error);
    await createAuditLog({
      req,
      action: 'GET_CUSTOM_AMOUNT_OPEN_BILL',
      description: `Gagal mengambil custom amount ID ${req.params.customAmountId} dari open bill ${req.params.id}: ${error.message}`,
      status: 'FAILED',
      metadata: { orderId: req.params.id, customAmountId: req.params.customAmountId, error: error.message }
    });
    res.status(500).json({
      success: false,
      message: 'Error getting custom amount from open bill',
      error: error.message
    });
  }
};


// Close Open Bill - VERSION FIXED
export const closeOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    console.log('💰 Closing open bill request:', {
      orderId: id,
      body: req.body
    });

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Validasi dengan Joi - dengan error handling yang lebih baik
    const { error, value } = closeOrderSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      await session.abortTransaction();
      session.endSession();
      console.log('❌ Validation error details:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details.map(detail => detail.message).join(', ')
      });
    }

    const { final_notes, payment_method, amount_paid, change } = value;

    console.log('💰 Processing close order:', {
      orderId: id,
      payment_method,
      amount_paid,
      change,
      final_notes
    });

    // Find the open bill order
    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    if (order.status === 'Completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Order is already completed'
      });
    }

    if (order.status === 'Canceled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot complete canceled order'
      });
    }

    // Validasi jumlah bayar
    if (amount_paid < order.grandTotal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Amount paid (${amount_paid}) is less than total amount (${order.grandTotal})`
      });
    }

    // ✅ CRITICAL FIX: Status harus 'Completed' BUKAN 'Pending'
    // Alasan: openBill removeItem cek 'Completed' — jika 'Pending' maka item bisa dihapus setelah bayar (FRAUD!)
    order.status = 'Completed';
    order.isOpenBill = false;
    order.paymentMethod = payment_method;
    order.change = change || 0;

    // ✅ TAMBAHAN: Audit trail — siapa, kapan, dan dari mana close terjadi
    order.openBillStatus = 'closed';
    order.openBillClosedAt = getWIBNow();
    const cashierIdFromReq = req.body.cashierId || req.user?._id || null;
    const cashierNameFromReq = req.body.cashierName || req.user?.username || 'unknown';
    order.closedBy = mongoose.Types.ObjectId.isValid(cashierIdFromReq) ? cashierIdFromReq : null;
    order.closedByName = cashierNameFromReq;
    order.paidAmount = amount_paid;

    // ✅ TAMBAHAN: Catat dalam modificationHistory
    if (!order.modificationHistory) order.modificationHistory = [];
    order.modificationHistory.push({
      action: 'status_changed',
      reason: `Bill ditutup oleh: ${cashierNameFromReq}`,
      cashierId: cashierIdFromReq,
      timestamp: getWIBNow(),
      details: {
        previousStatus: order.status,
        newStatus: 'Completed',
        grandTotal: order.grandTotal,
        amountPaid: amount_paid,
        paymentMethod: payment_method
      }
    });

    // Tambahkan catatan jika ada
    if (final_notes && final_notes.trim() !== '') {
      order.notes = order.notes ? `${order.notes}\n${final_notes}` : final_notes;
    }

    // Handle reservation jika ada
    if (order.reservation) {
      const reservation = await Reservation.findById(order.reservation).session(session);
      if (reservation) {
        // Update check_out_time tanpa mengubah status reservation
        reservation.check_out_time = getWIBNow();
        await reservation.save({ session });
        console.log(`✅ Updated reservation check_out_time for ${reservation._id}`);
      }
    }

    // ✅ TAMBAHAN: Buat snapshot HANYA dari items AKTIF (tidak cancelled) saat pembayaran — immutable untuk reconciliation
    const itemsSnapshot = order.items
      .filter(item => !item.isCancelled)
      .map(item => ({
        menuItemId: item.menuItem,
        menuItemName: item.menuItemData?.name || 'Unknown',
        quantity: item.quantity,
        subtotal: item.subtotal,
        unitPrice: item.quantity > 0 ? Math.round(item.subtotal / item.quantity) : 0,
        notes: item.notes || ''
      }));

    const paymentCode = `PAY-${order.order_id}-${Date.now()}`;

    const paymentRecord = new Payment({
      order_id: order.order_id,
      order: order._id,
      payment_code: paymentCode,
      method: payment_method,
      status: 'completed',
      paymentType: 'Full',
      amount: order.grandTotal,
      totalAmount: order.grandTotal,
      remainingAmount: 0,
      amount_paid: amount_paid,
      change: change || 0,
      tendered_amount: amount_paid,
      change_amount: change || 0,
      currency: 'IDR',
      // ✅ Snapshot immutable untuk reconciliation audit
      itemsSnapshot: itemsSnapshot,
      itemCountSnapshot: itemsSnapshot.length, // hanya item aktif
      totalSnapshot: {
        grandTotal: order.grandTotal,
        totalBeforeDiscount: order.totalBeforeDiscount,
        totalAfterDiscount: order.totalAfterDiscount
      },
      // ✅ Audit: siapa yang proses pembayaran
      paidBy: mongoose.Types.ObjectId.isValid(cashierIdFromReq) ? cashierIdFromReq : null,
      paidByName: cashierNameFromReq,
      paidAt: getWIBNow(),
      created_at: getWIBNow(),
      updated_at: getWIBNow()
    });

    await paymentRecord.save({ session });
    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Order ${order.order_id} closed successfully with Completed status [FRAUD PREVENTION ACTIVE]`);
    console.log(`✅ Payment record created: ${paymentRecord._id} | Cashier: ${cashierNameFromReq}`);

    // ── Audit log
    await createAuditLog({
      req,
      action: 'CLOSE_OPEN_BILL',
      description: `Kasir ${cashierNameFromReq} menutup open bill order ${order.order_id} | Metode: ${payment_method} | Total: Rp${order.grandTotal} | Dibayar: Rp${amount_paid}`,
      metadata: {
        orderId: id,
        order_id: order.order_id,
        cashierIdFromBody: cashierIdFromReq,
        cashierName: cashierNameFromReq,
        payment_method,
        grandTotal: order.grandTotal,
        amount_paid,
        change: change || 0,
        paymentRecordId: paymentRecord._id,
        paymentCode: paymentRecord.payment_code,
        itemCount: order.items.length
      }
    });

    // Populate the updated order untuk response
    const updatedOrder = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    res.json({
      success: true,
      message: 'Order closed successfully. Customer will pay at cashier.',
      data: {
        order: updatedOrder,
        payment: paymentRecord
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error closing open bill:', error);
    await createAuditLog({
      req,
      action: 'CLOSE_OPEN_BILL',
      description: `Gagal menutup open bill ID ${req.params.id}: ${error.message}`,
      status: 'FAILED',
      metadata: { orderId: req.params.id, body: req.body, error: error.message }
    });
    res.status(500).json({
      success: false,
      message: 'Error closing open bill',
      error: error.message
    });
  }
};

// Cancel open bill - FIXED VERSION
export const cancelOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    console.log('❌ Canceling open bill:', { orderId: id, cancellation_reason });

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.isOpenBill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This is not an open bill order'
      });
    }

    if (order.status === 'Completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed order'
      });
    }

    // Update order status
    order.status = 'Canceled';
    order.isOpenBill = false;
    order.openBillStatus = 'closed';
    order.openBillClosedAt = getWIBNow();

    // ✅ Siapa yang cancel
    const cancelCashierId = req.body?.cashierId || req.user?._id || req.user?.id || null;
    const cancelCashierName = req.body?.cashierName || req.user?.username || req.user?.name || 'unknown';
    order.closedBy = mongoose.Types.ObjectId.isValid(cancelCashierId) ? cancelCashierId : null;
    order.closedByName = cancelCashierName;

    if (cancellation_reason) {
      order.cancellationReason = cancellation_reason;
    }

    // ✅ Catat di modificationHistory
    if (!order.modificationHistory) order.modificationHistory = [];
    order.modificationHistory.push({
      action: 'status_changed',
      reason: `Bill dibatalkan oleh: ${cancelCashierName}. Alasan: ${cancellation_reason || 'tidak disebutkan'}`,
      cashierId: cancelCashierId,
      timestamp: getWIBNow(),
      details: {
        previousStatus: 'active',
        newStatus: 'Canceled',
        grandTotal: order.grandTotal,
        cancellation_reason: cancellation_reason || null
      }
    });

    // Update reservation status jika exists
    if (order.reservation) {
      const reservation = await Reservation.findById(order.reservation).session(session);
      if (reservation) {
        reservation.status = 'cancelled';
        await reservation.save({ session });
      }
    }

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Order ${order.order_id} canceled successfully`);

    // ── Audit log
    await createAuditLog({
      req,
      action: 'CANCEL_OPEN_BILL',
      description: `Kasir ${cancelCashierName} membatalkan open bill order ${order.order_id}. Alasan: ${cancellation_reason || 'tidak disebutkan'}`,
      metadata: {
        orderId: id,
        order_id: order.order_id,
        cashierIdFromBody: cancelCashierId,
        cashierName: cancelCashierName,
        cancellation_reason: cancellation_reason || null,
        previousStatus: 'active',
        newStatus: 'Canceled'
      }
    });

    res.json({
      success: true,
      message: 'Order canceled successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error canceling open bill:', error);
    await createAuditLog({
      req,
      action: 'CANCEL_OPEN_BILL',
      description: `Gagal membatalkan open bill ID ${req.params.id}: ${error.message}`,
      status: 'FAILED',
      metadata: { orderId: req.params.id, error: error.message }
    });
    res.status(500).json({
      success: false,
      message: 'Error canceling open bill',
      error: error.message
    });
  }
};

export default {
  getOpenBills,
  getOpenBillById,
  addItemToOpenBill,
  removeItemFromOpenBill,
  closeOpenBill,
  cancelOpenBill,
  addCustomAmountToOpenBill,
  updateCustomAmountInOpenBill,
  removeCustomAmountFromOpenBill,
  getCustomAmountFromOpenBill

};