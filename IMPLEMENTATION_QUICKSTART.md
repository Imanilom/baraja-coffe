# QUICK START: FRAUD PREVENTION IMPLEMENTATION GUIDE

## 📋 IMPLEMENTATION CHECKLIST (Copy & Paste Ready)

### PHASE 1: CRITICAL (Do Today) - EST 30 MINUTES

#### Fix #1: Change Order Status on Close (5 MIN)
- **File:** `api/controllers/openBill.controller.js`
- **Line:** 859
- **Change:**
  ```diff
  - order.status = 'Pending';
  + order.status = 'Completed';
  ```
- **Add:**
  ```javascript
  order.openBillStatus = 'closed';
  order.closedAt = new Date();
  order.closedBy = req.user._id || cashierId;
  order.paidAmount = amount_paid;
  ```
- ✅ **Test:** Try to remove item from closed order, should be blocked

---

#### Fix #2: Add Authorization Check (10 MIN)
- **File:** `api/controllers/openBill.controller.js`
- **Function:** `removeItemFromOpenBill`
- **Add at top of function:**
  ```javascript
  // ✅ Authorization check
  if (!req.user || !['supervisor', 'manager', 'admin'].includes(req.user.role)) {
    await session.abortTransaction();
    session.endSession();
    return res.status(403).json({
      success: false,
      message: 'Only supervisors/admins can remove items'
    });
  }
  ```
- ✅ **Test:** Try to remove item with cashier role, should be blocked

---

#### Fix #3: Add Removal Reason Parameter (5 MIN)
- **File:** `api/controllers/openBill.controller.js`
- **Function:** `removeItemFromOpenBill`
- **Add to validation:**
  ```javascript
  const { removalReason = 'Not specified' } = req.body;
  ```
- ✅ **Test:** Send removal request with reason parameter

---

#### Fix #4: Tighten Status Check (5 MIN)
- **File:** `api/controllers/openBill.controller.js`
- **Function:** `removeItemFromOpenBill`
- **Change:**
  ```diff
  - if (order.status === 'Completed' || order.status === 'Canceled') {
  + if (order.status === 'Completed' || order.status === 'Canceled' || order.status === 'Paid') {
  ```
- ✅ **Test:** Verify new status names are recognized

---

#### Fix #5: Add Deleted Items Tracking (5 MIN)
- **File:** `api/controllers/openBill.controller.js`
- **Function:** `removeItemFromOpenBill`
- **After storing removed item:**
  ```javascript
  if (!order.deletedItems) {
    order.deletedItems = [];
  }
  order.deletedItems.push({
    ...removedItem.toObject(),
    deletedAt: new Date(),
    deletedBy: req.user._id,
    deletionReason: removalReason
  });
  ```
- ✅ **Test:** Check deletedItems array after removal

---

### PHASE 2: HIGH PRIORITY (This Week) - EST 3 HOURS

#### Fix #6: Update Order Model Schema (1 HOUR)
- **File:** `api/models/order.model.js`
- **Add fields to items array:**
  ```javascript
  items: [{
    // ... existing fields ...
    addedBy: { type: ObjectId, ref: 'User', default: null },
    addedAt: { type: Date, default: Date.now },
    deletedBy: { type: ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null },
    deletionReason: String
  }]
  ```
- **Add new arrays to schema:**
  ```javascript
  deletedItems: [{
    // ... copy items structure ...
    deletedAt: Date,
    deletionReason: String
  }],
  
  modificationHistory: [{
    timestamp: Date,
    action: String,
    changedBy: ObjectId,
    changedByName: String,
    details: Object
  }]
  ```
- **Add indexes:**
  ```javascript
  orderSchema.index({ 'modificationHistory.timestamp': -1 });
  orderSchema.index({ closedBy: 1, closedAt: -1 });
  ```
- ✅ **Test:** Verify schema compiles, run migration script for existing documents

---

#### Fix #7: Implement Modification History Tracking (1 HOUR)
- **File:** `api/controllers/openBill.controller.js`
- **Function:** `removeItemFromOpenBill`
- **Add after storing removed item:**
  ```javascript
  if (!order.modificationHistory) {
    order.modificationHistory = [];
  }
  
  const totalBefore = order.grandTotal;
  const totalAfter = order.items.reduce((sum, item) => sum + item.subtotal, 0);
  
  order.modificationHistory.push({
    timestamp: new Date(),
    action: 'remove_item',
    changedBy: req.user._id,
    changedByName: req.user.name,
    changedByRole: req.user.role,
    details: {
      itemId: removedItem._id,
      itemName: removedItem.menuItemData?.name,
      quantity: removedItem.quantity,
      subtotal: removedItem.subtotal,
      reason: removalReason,
      totalBefore: totalBefore,
      totalAfter: totalAfter,
      difference: totalBefore - totalAfter
    }
  });
  ```
- ✅ **Test:** Verify modificationHistory is populated after removal

---

#### Fix #8: Implement Payment Snapshot (1 HOUR)
- **File:** `api/controllers/openBill.controller.js`
- **Function:** `closeOpenBill`
- **Replace payment creation logic:**
  ```javascript
  // Create snapshots BEFORE payment
  const itemsSnapshot = order.items.map(item => ({
    menuItem: item.menuItem,
    quantity: item.quantity,
    subtotal: item.subtotal,
    unitPrice: item.subtotal / item.quantity
  }));

  const totalSnapshot = {
    totalBeforeDiscount: order.totalBeforeDiscount,
    totalAfterDiscount: order.totalAfterDiscount,
    totalTax: order.totalTax || 0,
    totalServiceFee: order.totalServiceFee || 0,
    grandTotal: order.grandTotal
  };

  // Create payment with snapshots
  const paymentRecord = new Payment({
    order_id: order.order_id,
    order: order._id,
    itemsSnapshot: itemsSnapshot,
    totalSnapshot: totalSnapshot,
    itemCountSnapshot: order.items.length,
    method: payment_method,
    status: 'completed',
    amount: order.grandTotal,
    amount_paid: amount_paid,
    paidBy: cashierId,
    paidAt: new Date(),
    isLocked: true,
    lockedAt: new Date()
  });
  ```
- ✅ **Test:** Verify payment has snapshot fields after close

---

### PHASE 3: MONITORING (Next Week) - EST 4 HOURS

#### Fix #9: Create Reconciliation Endpoint (2 HOURS)
- **File:** `api/controllers/reconciliation.controller.js` (NEW FILE)
- **Copy from:** [FRAUD_PREVENTION_CODE_FIXES.md#5](FRAUD_PREVENTION_CODE_FIXES.md#5-tambah-reconciliation-endpoint)
- **Functions:**
  - `generateOpenBillReconciliation` - Find payment vs order discrepancies
  - `generateFraudAlerts` - Flag suspicious patterns
- ✅ **Test:** Run reconciliation on test data

---

#### Fix #10: Add Routes (1 HOUR)
- **File:** `api/routes/reconciliation.routes.js` (NEW FILE)
- **Copy from:** [FRAUD_PREVENTION_CODE_FIXES.md#6](FRAUD_PREVENTION_CODE_FIXES.md#6-tambah-routes)
- **Routes:**
  - `GET /reconciliation/open-bill-reconciliation` - Reconciliation report
  - `GET /reconciliation/fraud-alerts` - Fraud alerts
- ✅ **Test:** Call endpoints and verify responses

---

#### Fix #11: Add Dashboard Monitoring (1 HOUR)
- **Create simple alerts for:**
  - Orders with > 3 item removals
  - Payments with total mismatches
  - Items deleted by same cashier multiple times
- **Backend logging:** Add console.log for each removal
  ```javascript
  console.log(`🔴 FRAUD ALERT ITEM REMOVAL:`, {
    orderId: order.order_id,
    removedItem: removedItem.menuItemData?.name,
    removedBy: req.user.name,
    timestamp: new Date()
  });
  ```
- ✅ **Test:** Check logs when items are removed

---

## 🧪 TESTING SCENARIOS

### Test Case 1: Normal Flow (Should Work)
```javascript
// 1. Create open bill
POST /api/open-bills { tableNumber: "5", items: [...] }
// Expected: Order created, isOpenBill = true

// 2. Close bill (supervisor)
POST /api/open-bills/{id}/close { payment_method: "Cash", amount_paid: 500000 }
// Expected: status = "Completed", openBillStatus = "closed"

// 3. Try to remove item (should FAIL)
DELETE /api/open-bills/{id}/items/{itemId}
// Expected: 400 - "Cannot remove items from Completed order"
```

### Test Case 2: Fraud Attempt (Should Block)
```javascript
// 1. Create open bill
// 2. Close bill
// 3. Try to remove item AS CASHIER
DELETE /api/open-bills/{id}/items/{itemId}
// Expected: 403 - "Only supervisors/admins can remove items"
```

### Test Case 3: Legitimate Removal (Should Work)
```javascript
// 1. Create open bill
// 2. SUPERVISOR removes item BEFORE closing
DELETE /api/open-bills/{id}/items/{itemId}
// Expected: 200 - Item removed, modificationHistory updated

// 3. Close bill
POST /api/open-bills/{id}/close
// Expected: status = "Completed", payment created with snapshots
```

### Test Case 4: Reconciliation Check (Should Detect)
```javascript
// Assume:
// 1. Order created with 5 items = Rp 600k
// 2. Order paid and closed with payment snapshot = Rp 600k
// 3. Order items manually modified to Rp 100k (simulate database manipulation)

// Run reconciliation:
GET /reconciliation/open-bill-reconciliation?startDate=2026-04-01&endDate=2026-04-06
// Expected: discrepancies array with this order flagged as FRAUD_SUSPECTED
```

---

## 🐛 DEBUGGING TIPS

### Check Order Status:
```javascript
db.orders.findOne({ order_id: "ORD-..." })
  .then(order => console.log(order.status, order.closedAt, order.paidAmount))
```

### Check Modification History:
```javascript
db.orders.findOne({ order_id: "ORD-..." })
  .then(order => console.log(JSON.stringify(order.modificationHistory, null, 2)))
```

### Check Payment Snapshot:
```javascript
db.payments.findOne({ order_id: "ORD-..." })
  .then(payment => console.log({
    snapshotTotal: payment.totalSnapshot?.grandTotal,
    amountPaid: payment.amount_paid,
    itemsCount: payment.itemCountSnapshot
  }))
```

### Check Deleted Items:
```javascript
db.orders.findOne({ order_id: "ORD-..." })
  .then(order => console.log(JSON.stringify(order.deletedItems, null, 2)))
```

---

## ⚠️ COMMON MISTAKES TO AVOID

- ❌ DO NOT use status "Pending" for closed bills (use "Completed" or "Paid")
- ❌ DO NOT allow non-supervisors to remove items from paid orders
- ❌ DO NOT directly delete items (use soft delete)
- ❌ DO NOT skip payment snapshot when closing bill
- ❌ DO NOT forget to add request.user context in removal logs

---

## ✅ VALIDATION CHECKLIST

After each fix, verify:

- [ ] Code compiles without errors
- [ ] No SQL/injection vulnerabilities introduced
- [ ] Test passes with test data
- [ ] Logs show expected messages
- [ ] Database indexes created
- [ ] Performance acceptable (< 200ms response time)
- [ ] Backward compatibility maintained
- [ ] Documentation updated

---

## 🚀 DEPLOYMENT STEPS

1. **Create feature branch:** `git checkout -b fraud-prevention`
2. **Implement fixes** following checklist above
3. **Run tests:** `npm test`
4. **Code review** by team lead
5. **Deploy to staging:** Check all test cases pass
6. **Monitor for 24 hours** on staging
7. **Deploy to production:** During low-traffic hours
8. **Monitor production** for issues
9. **Run reconciliation report** on historical data
10. **Document** all changes in runbook

---

## 📊 SUCCESS METRICS

After implementation, verify:

- ✅ 0 items removed from closed orders
- ✅ All item removals logged in modificationHistory
- ✅ Payment snapshots match order totals at close time
- ✅ Reconciliation report shows 0 discrepancies
- ✅ Fraud alerts trigger correctly on suspicious patterns
- ✅ Non-supervisors blocked from item removal
- ✅ All tests passing

---

## 📞 SUPPORT

If you encounter issues:

1. Check [FRAUD_PREVENTION_CODE_FIXES.md](FRAUD_PREVENTION_CODE_FIXES.md) for detailed code
2. Review [SECURITY_FRAUD_ANALYSIS.md](SECURITY_FRAUD_ANALYSIS.md) for background
3. Check debug section above
4. Test with scenarios provided
5. Review logs for errors

---

**Last Updated:** April 2026  
**Status:** Ready for Implementation  
**Estimated Total Time:** 4-5 hours  
**Risk Level After Fix:** LOW ✅
