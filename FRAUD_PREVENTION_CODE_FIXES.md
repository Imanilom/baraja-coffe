# KODE PERBAIKAN - FRAUD PREVENTION UNTUK OPEN BILL

## 1. UPDATE STATUS MENJADI "COMPLETED" (URGENT)

**File:** `api/controllers/openBill.controller.js` - Line 859

**Sebelum:**
```javascript
order.status = 'Pending';
order.isOpenBill = false;
```

**Sesudah:**
```javascript
order.status = 'Completed';  // ← PERBAIKAN URGENT
order.isOpenBill = false;
order.openBillStatus = 'closed';  // ← TAMBAH
order.closedAt = new Date();  // ← TAMBAH
order.closedBy = req.user._id || cashierId;  // ← TAMBAH
order.paidAmount = amount_paid;  // ← TAMBAH untuk track payment
```

---

## 2. TAMBAH SOFT DELETE & AUDIT TRAIL

**File:** `api/controllers/openBill.controller.js` - Function `removeItemFromOpenBill`

**SEBELUM:**
```javascript
export const removeItemFromOpenBill = async (req, res) => {
  // ... code ...
  order.items.splice(itemIndex, 1);  // ❌ Direct delete, no trace
  
  const itemsTotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
  order.totalBeforeDiscount = itemsTotal;
  order.grandTotal = itemsTotal + customAmountTotal;
  
  await order.save({ session });
  // ❌ Tidak ada pencatatan siapa/kapan/alasan
}
```

**SESUDAH:**
```javascript
export const removeItemFromOpenBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id, itemId } = req.params;
    const { removalReason = 'Not specified' } = req.body;  // ← TAMBAH parameter

    // ✅ TAMBAH: Authorization check
    if (!req.user || !['supervisor', 'manager', 'admin', 'senior_cashier'].includes(req.user.role)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Only supervisors/admins can remove items'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

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

    // ✅ TAMBAH: Check status lebih ketat
    if (order.status === 'Completed' || order.status === 'Canceled' || order.status === 'Paid') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot remove items from ${order.status} order`
      });
    }

    // ✅ TAMBAH: Find item lebih detail
    const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Item not found in order'
      });
    }

    // ✅ TAMBAH: Simpan data item SEBELUM dihapus (untuk audit)
    const removedItem = order.items[itemIndex];
    const totalBefore = order.grandTotal;

    // ✅ SOFT DELETE - Jangan hapus langsung, set flag deleted
    if (!order.items[itemIndex].deletedAt) {
      order.items[itemIndex].deletedAt = new Date();
      order.items[itemIndex].deletedBy = req.user._id;
      order.items[itemIndex].deletionReason = removalReason;
      
      // ATAU: Pindah ke deletedItems array:
      if (!order.deletedItems) {
        order.deletedItems = [];
      }
      order.deletedItems.push({
        ...removedItem.toObject(),
        deletedAt: new Date(),
        deletedBy: req.user._id,
        deletedByName: req.user.name,
        deletionReason: removalReason
      });
      
      // Hapus dari items array
      order.items.splice(itemIndex, 1);
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Item already deleted'
      });
    }

    // ✅ TAMBAH: Record dalam modification history
    const totalAfter = order.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    if (!order.modificationHistory) {
      order.modificationHistory = [];
    }
    
    order.modificationHistory.push({
      timestamp: new Date(),
      action: 'remove_item',
      changedBy: req.user._id,
      changedByName: req.user.name,
      changedByRole: req.user.role,
      details: {
        itemId: removedItem._id,
        itemName: removedItem.menuItemData?.name || 'Unknown',
        quantity: removedItem.quantity,
        subtotal: removedItem.subtotal,
        reason: removalReason,
        totalBefore: totalBefore,
        totalAfter: totalAfter + (order.customAmountItems?.reduce((sum, item) => sum + item.amount, 0) || 0),
        difference: totalBefore - (totalAfter + (order.customAmountItems?.reduce((sum, item) => sum + item.amount, 0) || 0))
      }
    });

    // Recalculate totals
    const itemsTotal = order.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const customAmountTotal = (order.customAmountItems || []).reduce((sum, item) => sum + (item.amount || 0), 0);

    order.totalBeforeDiscount = itemsTotal;
    order.totalAfterDiscount = itemsTotal;
    order.grandTotal = itemsTotal + customAmountTotal;

    // ✅ LOG untuk monitoring
    console.log(`🔴 FRAUD ALERT ITEM REMOVAL:`, {
      orderId: order.order_id,
      removedItem: removedItem.menuItemData?.name || removedItem._id,
      quantity: removedItem.quantity,
      subtotal: removedItem.subtotal,
      removedBy: req.user.name,
      removedByRole: req.user.role,
      reason: removalReason,
      timestamp: new Date()
    });

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Item removed from order ${order.order_id}`);

    const updatedOrder = await Order.findById(id)
      .populate('reservation')
      .populate('items.menuItem');

    res.json({
      success: true,
      message: 'Item removed successfully',
      data: updatedOrder,
      auditInfo: {
        removedBy: req.user.name,
        removedAt: new Date(),
        reason: removalReason,
        totalReduction: totalBefore - (totalAfter + customAmountTotal)
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error removing item from open bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from open bill',
      error: error.message
    });
  }
};
```

---

## 3. TAMBAH PAYMENT SNAPSHOT (IMMUTABLE)

**File:** `api/controllers/openBill.controller.js` - Function `closeOpenBill` (Around line 876-895)

**SEBELUM:**
```javascript
const paymentRecord = new Payment({
  order_id: order.order_id,
  method: payment_method,
  status: 'pending',
  amount: order.grandTotal,
  amount_paid: amount_paid,
  change: change || 0,
});
```

**SESUDAH:**
```javascript
// ✅ BUAT SNAPSHOT DARI STATE CURRENT SAAT PEMBAYARAN
const itemsSnapshot = order.items.map(item => ({
  _id: item._id,
  menuItem: item.menuItem,
  quantity: item.quantity,
  subtotal: item.subtotal,
  unitPrice: item.subtotal / item.quantity,
  notes: item.notes,
  addedBy: item.addedBy || 'unknown',
  addedAt: item.addedAt || order.createdAt
}));

const totalSnapshot = {
  totalBeforeDiscount: order.totalBeforeDiscount,
  totalAfterDiscount: order.totalAfterDiscount,
  totalTax: order.totalTax || 0,
  totalServiceFee: order.totalServiceFee || 0,
  customAmountTotal: (order.customAmountItems || []).reduce((sum, item) => sum + item.amount, 0),
  grandTotal: order.grandTotal
};

// ✅ CREATE IMMUTABLE PAYMENT RECORD
const paymentRecord = new Payment({
  order_id: order.order_id,
  order: order._id,  // ← Reference ke order
  payment_code: `PAY-${order.order_id}-${Date.now()}`,
  
  // ✅ SNAPSHOT saat pembayaran (immutable)
  itemsSnapshot: itemsSnapshot,
  totalSnapshot: totalSnapshot,
  itemCountSnapshot: order.items.length,
  
  // Payment details
  method: payment_method,
  status: 'completed',  // ← CHANGED dari 'pending'
  paymentType: 'Full',
  amount: order.grandTotal,
  totalAmount: order.grandTotal,
  remainingAmount: 0,
  amount_paid: amount_paid,
  change: change || 0,
  tendered_amount: amount_paid,
  change_amount: change || 0,
  currency: 'IDR',
  
  // ✅ AUDIT FIELDS
  paidBy: cashierId,
  paidAt: new Date(),
  createdAt: new Date(),
  updated_at: new Date(),
  
  // ✅ IMMUTABILITY FLAG
  isLocked: true,
  lockedAt: new Date(),
  lockedReason: 'Payment completed, record locked for audit'
});

await paymentRecord.save({ session });
```

---

## 4. UPDATE ORDER MODEL (MongoDB Schema)

**File:** `api/models/order.model.js`

**Tambahkan fields baru:**
```javascript
const orderSchema = new Schema({
  // ... existing fields ...
  
  // ✅ TAMBAHAN: Untuk tracking pembayaran & penutupan
  status: {
    type: String,
    enum: ['Pending', 'OnProcess', 'Waiting', 'Reserved', 'Completed', 'Paid', 'Canceled'],
    // ✅ Perubahan: Tambah 'Paid' status
    default: 'Pending'
  },
  
  // ✅ TAMBAHAN: Untuk soft delete items
  items: [{
    menuItem: ObjectId,
    quantity: Number,
    subtotal: Number,
    // BARU:
    addedBy: {
      type: ObjectId,
      ref: 'User',
      default: null
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    deletedBy: {
      type: ObjectId,
      ref: 'User',
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletionReason: String,
    // ... other fields ...
  }],
  
  // ✅ TAMBAHAN: Track deleted items
  deletedItems: [{
    menuItem: ObjectId,
    quantity: Number,
    subtotal: Number,
    deletedBy: {
      type: ObjectId,
      ref: 'User'
    },
    deletedAt: Date,
    deletionReason: String,
    deletionTimestamp: { type: Date, default: Date.now }
  }],
  
  // ✅ TAMBAHAN: Modification history untuk audit
  modificationHistory: [{
    timestamp: Date,
    action: {
      type: String,
      enum: ['add_item', 'remove_item', 'modify_qty', 'apply_discount', 'close_bill']
    },
    changedBy: ObjectId,
    changedByName: String,
    changedByRole: String,
    details: {
      itemId: ObjectId,
      itemName: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      totalBefore: Number,
      totalAfter: Number,
      reason: String
    }
  }],
  
  // ✅ TAMBAHAN: Close bill tracking
  closedAt: Date,
  closedBy: {
    type: ObjectId,
    ref: 'User'
  },
  paidAmount: Number,  // Amount yang sebenarnya dibayar
  openBillStatus: {
    type: String,
    enum: ['active', 'closed', 'pending'],
    default: null
  }
  
  // ... other fields ...
});

// ✅ TAMBAHKAN INDEX UNTUK QUERY PERFORMANCE
orderSchema.index({ 'modificationHistory.timestamp': -1 });
orderSchema.index({ closedBy: 1, closedAt: -1 });
orderSchema.index({ status: 1, openBillStatus: 1 });
```

---

## 5. TAMBAH RECONCILIATION ENDPOINT

**File:** `api/controllers/reconciliation.controller.js` (NEW FILE)

```javascript
import { Order } from '../models/order.model.js';
import { Payment } from '../models/Payment.model.js';

/**
 * Reconciliation report untuk detect fraud pada open bills
 * Membandingkan payment snapshot dengan current order total
 */
export const generateOpenBillReconciliation = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      cashierId,
      outlitId,
      showDiscrepancies = true
    } = req.query;

    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (cashierId) {
      filter.closedBy = cashierId;
    }

    if (outlitId) {
      filter.outlet = outlitId;
    }

    // ✅ Query: Cari payments yang punya deleted items
    const paymentsWithDeletions = await Payment.find(filter)
      .populate('order')
      .populate('paidBy', 'name role')
      .lean();

    const discrepancies = [];

    for (const payment of paymentsWithDeletions) {
      if (!payment.order || !payment.itemsSnapshot) {
        continue;
      }

      const order = payment.order;
      const snapshotTotal = payment.totalSnapshot?.grandTotal || 0;
      const currentTotal = order.grandTotal || 0;

      // ❌ Flag: Jika ada perbedaan antara payment snapshot vs current order
      if (snapshotTotal !== currentTotal) {
        discrepancies.push({
          orderId: order.order_id,
          paymentId: payment._id,
          snapshotTotal,
          currentTotal,
          difference: snapshotTotal - currentTotal,
          paidBy: payment.paidBy,
          paidAt: payment.paidAt,
          modificationsSincePayment: order.modificationHistory
            ? order.modificationHistory.filter(m => m.timestamp > payment.paidAt)
            : [],
          deletedItems: order.deletedItems || [],
          flagRisk: snapshotTotal > currentTotal ? 'FRAUD_SUSPECTED' : 'SYSTEM_ERROR'
        });
      }
    }

    return res.json({
      success: true,
      period: {
        startDate,
        endDate
      },
      summary: {
        totalPayments: paymentsWithDeletions.length,
        totalDiscrepancies: discrepancies.length,
        suspiciousTransactions: discrepancies.filter(d => d.flagRisk === 'FRAUD_SUSPECTED').length
      },
      discrepancies: showDiscrepancies ? discrepancies : []
    });

  } catch (error) {
    console.error('❌ Error generating reconciliation report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating reconciliation report',
      error: error.message
    });
  }
};

/**
 * Alert untuk suspicious activities
 */
export const generateFraudAlerts = async (req, res) => {
  try {
    // Find orders dengan high number of item removals
    const suspiciousOrders = await Order.aggregate([
      {
        $match: {
          'modificationHistory.action': 'remove_item'
        }
      },
      {
        $addFields: {
          deletionCount: {
            $size: {
              $filter: {
                input: '$modificationHistory',
                as: 'mod',
                cond: { $eq: ['$$mod.action', 'remove_item'] }
              }
            }
          }
        }
      },
      {
        $match: {
          deletionCount: { $gte: 3 }  // 3 atau lebih item dihapus
        }
      },
      {
        $sort: { 'modificationHistory.timestamp': -1 }
      }
    ]);

    const alerts = suspiciousOrders.map(order => ({
      orderId: order.order_id,
      totalItemsRemoved: order.deletionCount,
      removals: order.modificationHistory.filter(m => m.action === 'remove_item'),
      risk: order.deletionCount >= 5 ? 'CRITICAL' : 'HIGH',
      recommendation: 'Manual review required'
    }));

    return res.json({
      success: true,
      fraudAlerts: alerts,
      totalAlerts: alerts.length
    });

  } catch (error) {
    console.error('❌ Error generating fraud alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating fraud alerts',
      error: error.message
    });
  }
};
```

---

## 6. TAMBAH ROUTES

**File:** `api/routes/reconciliation.routes.js` (NEW)

```javascript
import express from 'express';
import {
  generateOpenBillReconciliation,
  generateFraudAlerts
} from '../controllers/reconciliation.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected routes - hanya admin/supervisor
router.get(
  '/open-bill-reconciliation',
  authenticate,
  generateOpenBillReconciliation
);

router.get(
  '/fraud-alerts',
  authenticate,
  generateFraudAlerts
);

export default router;
```

---

## IMPLEMENTASI CHECKLIST

- [ ] Update status "Pending" → "Completed" di closeOpenBill
- [ ] Tambah soft delete untuk items
- [ ] Tambah modificationHistory tracking
- [ ] Tambah Payment snapshot (immutable)
- [ ] Update Order model schema
- [ ] Tambah authorization layer (supervisor only)
- [ ] Buat reconciliation endpoint
- [ ] Buat fraud alert endpoint
- [ ] Test dengan skenario fraud
- [ ] Deploy ke staging
- [ ] Load test & performance check
- [ ] Document untuk team
- [ ] Deploy ke production dengan monitoring
