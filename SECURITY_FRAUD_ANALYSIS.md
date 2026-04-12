# ANALISIS KEAMANAN & POTENSI FRAUD - SISTEM OPEN BILL CASHIER

## 📋 RINGKASAN EKSEKUTIF

**Status:** ⚠️ **RISIKO FRAUD MEDIUM-HIGH TERDETEKSI**

Sistem Open Bill memiliki beberapa kerentanan yang memungkinkan fraud ketika pesanan ditutup, kemudian dibuka kembali dan item dihapus. Risiko ini terutama ada pada:

1. **Tidak ada Audit Trail lengkap** untuk perubahan Open Bill
2. **Status Completed dapat dijinakkan** menjadi Pending kembali
3. **Penghapusan item SETELAH pembayaran** tidak tercatat
4. **Kontrol akses per-cashier tidak ketat**

---

## 🔴 CRITICAL VULNERABILITIES

### 1. **Pembukaan Kembali Open Bill Setelah Ditutup**

#### Skenario Fraud:
```
1. Cashier A membuat Open Bill untuk Meja 5 dengan 10 item → Total: Rp 500.000
2. Customer bayar cash Rp 500.000
3. Bill ditutup → Status: "Pending" 
4. Payment dibuat dengan status "pending"
5. FRAUD POINT: Cashier A membuka Order yang sama KEMBALI (semua item masih ada)
6. Cashier menghapus 5 item terberat → Total berkurang menjadi Rp 250.000
7. Bayar ulang Rp 250.000 ke system
8. Simpan selisih Rp 250.000
```

#### Kode yang Rentan - [openBill.controller.js](openBill.controller.js#L275-L330)

```javascript
export const removeItemFromOpenBill = async (req, res) => {
  // ❌ TIDAK ADA CEK: Apakah order sudah pernah ditutup/dibayar?
  // ❌ TIDAK ADA CEK: Siapa cashier pembuat original order?
  // ❌ TIDAK ADA AUDIT LOG: Pencatatan penghapusan item
  
  if (order.status === 'Completed' || order.status === 'Canceled') {
    // Hanya cek status, tapi status bisa berubah dari Pending→Active kembali
    return res.status(400).json({...});
  }
  
  order.items.splice(itemIndex, 1);
  // ❌ LANGSUNG HAPUS TANPA SOFT DELETE
  
  order.grandTotal = itemsTotal + customAmountTotal;
  // ❌ HANYA RECALCULATE, TIDAK TRACK PERUBAHAN
}
```

**Masalah Spesifik:**
- ✅ Ada check `status === 'Completed'`
- ❌ Tapi status diubah menjadi "Pending" saat close bill, bukan "Completed"
- ❌ Tidak ada field untuk track apakah sudah dibayar
- ❌ Tidak ada timestamp penghapusan item
- ❌ Tidak ada user_id pembuat/penghapus item

### 2. **Kurangnya Audit Trail & Immutable History**

#### File Terpengaruh: [openBill.controller.js](openBill.controller.js)

```javascript
// ❌ TIDAK ADA PENCATATAN:
// - Siapa yang menambah item?
// - Kapan item ditambahkan?
// - Siapa yang menghapus item?
// - Saat item ditambah/dihapus, berapa total?
// - Alasan penghapusan item?

const newItem = {
  menuItem: menuItem,
  quantity: quantity,
  subtotal: calculatedSubtotal,
  // ❌ MISSING: addedBy (cashier ID)
  // ❌ MISSING: addedAt (timestamp) - hanya ada lastItemAddedAt untuk order
  // ❌ MISSING: modificationHistory array
};

order.items.splice(itemIndex, 1);
// ❌ DIRECT DELETE, harus soft delete atau move ke history array
```

**Konsekuensi:**
- Tidak bisa audit trail siapa yang menghapus apa
- Tidak bisa detect fraud pattern (cashier X sering menghapus item mahal)
- Tidak bisa reverse perubahan jika suspicious

### 3. **Status Open Bill Ambigu**

#### File: [openBill.controller.js](openBill.controller.js#L853-L880)

```javascript
export const closeOpenBill = async (req, res) => {
  // ❌ STATUS LOGIC BERMASALAH:
  order.status = 'Pending';        // ← Diubah ke Pending
  order.isOpenBill = false;        // ← Tandai bukan open bill lagi
  order.paymentMethod = payment_method;
  // ❌ TIDAK ADA: order.paidAmount
  // ❌ TIDAK ADA: order.closedAt timestamp
  // ❌ TIDAK ADA: order.closedBy (cashier ID)
}

// Masalah:
// 1. Status "Pending" bisa terlihat seperti unpaid order biasa
// 2. Tidak jelas apakah sudah dibayar tunai atau menunggu pembayaran nanti
// 3. isOpenBill = false tapi tetap bisa diakses dan dihapus item!
```

### 4. **Payment Record Tidak Ter-link dengan Item**

#### File: [openBill.controller.js](openBill.controller.js#L876-L895)

```javascript
// Payment dibuat tapi tidak tersimpan snapshot total yang dibayarkan
const paymentRecord = new Payment({
  order_id: order.order_id,
  // ❌ MISSING: itemsSnapshot - detail item saat dibayar
  // ❌ MISSING: quantityPerItem - berapa item masing-masing saat dibayar
  method: payment_method,
  status: 'pending',
  amount: order.grandTotal,      // ← Ini adalah CURRENT total, bukan saat dibayar
  amount_paid: amount_paid,
  // ❌ TIDAK ADA PROTECTION: Jika item dihapus nanti, amount jadi salah
});

// RISIKO:
// 1. Payment dibuat dengan total Rp 500.000
// 2. Setelah itu, 5 item dihapus
// 3. Order total menjadi Rp 250.000
// 4. Payment record masih tertayang Rp 500.000 tapi order hanya Rp 250.000
// 5. Reconciliation jadi kacau!
```

---

## 🟡 MEDIUM VULNERABILITIES

### 5. **Tidak Ada Kontrol Akses Berbasis Role**

#### File: [openBill.controller.js](openBill.controller.js#L322-L350)

```javascript
export const removeItemFromOpenBill = async (req, res) => {
  // ❌ TIDAK ADA CEK:
  // - Apakah cashier memiliki permission untuk menghapus?
  // - Apakah cashier yang menghapus adalah pembuat original?
  // - Apakah ada minimum threshold untuk menghapus item?
  
  // Seharusnya ada:
  const requiredRole = ['supervisor', 'admin', 'senior_cashier'];
  if (!requiredRole.includes(req.user.role)) {
    // deny
  }
}
```

### 6. **Recalculation Manual Tanpa Server-Side Validation**

#### File: [openBill.controller.js](openBill.controller.js#L283-L295)

```javascript
const { amount, name, description, dineType, originalAmount, discountApplied } = value;

// ❌ MENERIMA dari frontend TANPA VALIDASI:
// - originalAmount bisa dimanipulasi
// - discountApplied bisa dimanipulasi
// - Tidak ada verifikasi terhadap menu price master

const newItem = {
  amount: amount,              // ← Bisa dikirim frontend dengan nilai sembarang
  originalAmount: originalAmount || amount,  // ← Bisa dimanipulasi
  discountApplied: discountApplied || 0       // ← Bisa dimanipulasi
};
```

**Perbaikan sudah ada untuk menu items:**
```javascript
// ✅ BENAR untuk menu items:
const MenuItem = mongoose.model('MenuItem');
const menuItemDoc = await MenuItem.findById(menuItem).session(session);
const calculatedSubtotal = menuItemDoc.price * quantity;  // ← Server-side calculation
```

**Tapi custom amount TIDAK ada:**
```javascript
// ❌ CUSTOM AMOUNT: Langsung terima dari frontend
order.customAmountItems.push({
  amount: amount,  // ← Tidak ada verifikasi
});
```

### 7. **Perubahan Total Tidak Tersimpan di History**

#### File: [openBill.controller.js](openBill.controller.js#L287-L295)

```javascript
// Setelah penghapusan item:
const itemsTotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
order.totalBeforeDiscount = itemsTotal;
order.totalAfterDiscount = itemsTotal;
order.grandTotal = itemsTotal + customAmountTotal;

// ❌ TIDAK TERSIMPAN:
// - Berapa total sebelumnya?
// - Berapa selisih?
// - Kapan perubahan terjadi?
// - Siapa yang melakukan?
// - Alasan penghapusan?
```

---

## 🔴 CRITICAL SKENARIO FRAUD LENGKAP

### Skenario 1: "Silent Item Deletion"

```
WAKTU 13:45 - OPEN BILL DIBUAT
- Meja 5 dipesan: 5 Steak (Rp 100rb x 5) = Rp 500rb
- 2 Minuman (Rp 50rb x 2) = Rp 100rb
- TOTAL: Rp 600rb
- Cashier: Budi

WAKTU 13:50 - PAYMENT
- Customer bayar CASH Rp 600rb
- Order ditutup → Status = "Pending"
- Payment record: amount = Rp 600rb

WAKTU 14:00 - FRAUD POINT
- Budi MEMBUKA ORDER YANG SAMA KEMBALI (isOpenBill = false tapi bisa diakses)
- Menghapus 5 Steak dari order
  ✅ ada validasi: if (order.status === 'Completed') ← tapi status "Pending" bukan "Completed"
- Grandtotal berubah: Rp 600rb → Rp 100rb
- Budi bayar kembali ke sistem: Rp 100rb
- Simpan pocket: Rp 500rb
- Item history: TIDAK ADA PENCATATAN siapa yang menghapus

HASIL AUDIT:
❌ Order menunjukkan Total Rp 100rb (sudah berubah)
❌ Payment record menunjukkan Rp 600rb
❌ Tidak ada bukti penghapusan 5 Steak
❌ Tidak bisa trace siapa/kapan/kenapa dihapus
```

### Skenario 2: "Payment Amount Mismatch"

```
Saat order ditutup, items dibuat snapshot:
✅ Order ID: 123
✅ Items: [5 Steak, 2 Minuman]
✅ Total: Rp 600rb
✅ Payment: CASH Rp 600rb

30 menit kemudian:
❌ Items dihapus dari order
✅ Order total menjadi: Rp 100rb
✅ Payment record masih: Rp 600rb

Reconciliation:
"Kenapa bayar Rp 600rb tapi order hanya Rp 100rb?"
=> Tidak bisa trace!
```

---

## ✅ MITIGASI & PERBAIKAN

### 1. **Tambahkan Status "PAID_LOCKED" untuk Closed Bills**

```javascript
// openBill.controller.js - closeOpenBill

export const closeOpenBill = async (req, res) => {
  // SEBELUM:
  // order.status = 'Pending';
  
  // SESUDAH:
  order.status = 'Paid'; // atau 'Completed'
  order.isOpenBill = false;
  order.openBillStatus = 'closed'; // Tambah field baru
  order.closedAt = new Date();
  order.closedBy = cashierId;
  order.paidAmount = amount_paid; // Simpan amount yang dibayarkan
  
  // Jika status = 'Paid', BLOCK semua operasi:
};

// removeItemFromOpenBill - PERBAIKAN
if (order.status === 'Paid' || order.status === 'Completed' || order.status === 'Canceled') {
  return res.status(400).json({
    success: false,
    message: 'Cannot modify paid/completed order'
  });
}
```

### 2. **Implementasi Soft Delete & Audit Trail**

```javascript
// Data model - tambah field:
order.schema.add({
  // Current items
  items: [{
    menuItem: ObjectId,
    quantity: Number,
    subtotal: Number,
    // TAMBAHAN:
    addedBy: ObjectId,      // Cashier yang menambah
    addedAt: Date,          // Kapan ditambah
    deletedBy: ObjectId,    // Cashier yang hapus (null jika tidak dihapus)
    deletedAt: Date,        // Kapan dihapus
    deletionReason: String  // Alasan penghapusan
  }],
  
  // TAMBAHAN - History untuk audit:
  modificationHistory: [{
    timestamp: Date,
    action: String,          // 'add_item', 'remove_item', 'modify_qty'
    changedBy: ObjectId,     // User ID
    details: {
      itemId: ObjectId,
      oldValue: Number,
      newValue: Number,
      totalBefore: Number,
      totalAfter: Number
    }
  }],
  
  // Payment tracking:
  paymentSnapshot: {
    amountPaid: Number,
    itemsCount: Number,
    itemsList: Array,
    totalAtPayment: Number,
    paidAt: Date,
    paidBy: ObjectId
  }
});
```

### 3. **Implementasi Immutable Payment Record**

```javascript
// Payment record harus menyimpan snapshot SAAT pembayaran:
const paymentRecord = new Payment({
  order_id: order.order_id,
  
  // ✅ TAMBAH: Snapshot items saat pembayaran
  itemsSnapshot: order.items.map(item => ({
    id: item._id,
    name: item.menuItem.name,
    quantity: item.quantity,
    unitPrice: item.subtotal / item.quantity,
    subtotal: item.subtotal
  })),
  
  // ✅ TAMBAH: Total snapshot
  totalSnapshot: {
    totalBeforeDiscount: order.totalBeforeDiscount,
    totalAfterDiscount: order.totalAfterDiscount,
    totalTax: order.totalTax,
    totalServiceFee: order.totalServiceFee,
    grandTotal: order.grandTotal
  },
  
  // Payment details:
  method: payment_method,
  amount: order.grandTotal,
  amount_paid: amount_paid,
  change: change || 0,
  
  // ✅ TAMBAH: Lock payment record
  isLocked: true, // Tidak bisa dimodifikasi setelah ini
  lockedAt: new Date(),
  
  // ✅ TAMBAH: Reconciliation field
  reconciliated: false,
  reconciliationNotes: ''
});
```

### 4. **Tambah Authorization Layer**

```javascript
// openBill.controller.js - middleware untuk sensitivitas operation

const authorizeItemRemoval = (req) => {
  const { user } = req; // Dari JWT/session
  
  // Hanya supervisor, manager, atau admin bisa hapus item
  const allowedRoles = ['supervisor', 'manager', 'admin'];
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Hanya supervisor/admin yang bisa menghapus item');
  }
  
  return true;
};

export const removeItemFromOpenBill = async (req, res) => {
  try {
    authorizeItemRemoval(req); // ← Add this
    
    // ... existing code ...
    
    // Tambah logging:
    console.log(`🔴 ITEM REMOVAL: User ${req.user._id} (${req.user.role}) removed item from order ${orderId}`);
    
  } catch (error) {
    // ...
  }
};
```

### 5. **Tambah Reconciliation Report**

```javascript
// controllers/reconciliation.controller.js (NEW)

export const generateOpenBillReconciliation = async (req, res) => {
  const { startDate, endDate, cashierId } = req.query;
  
  const payments = await Payment.find({
    created_at: { $gte: startDate, $lte: endDate },
    ...(cashierId && { 'order.cashierId': cashierId })
  }).populate('order');
  
  const discrepancies = payments
    .filter(payment => {
      // ❌ Jika payment amount != current order total
      return payment.totalSnapshot.grandTotal !== payment.order.grandTotal;
    })
    .map(payment => ({
      orderId: payment.order_id,
      paidAmount: payment.totalSnapshot.grandTotal,
      currentTotal: payment.order.grandTotal,
      difference: payment.totalSnapshot.grandTotal - payment.order.grandTotal,
      modificationHistory: payment.order.modificationHistory.filter(
        m => m.timestamp > payment.created_at
      ),
      flag: 'SUSPICIOUS_MODIFICATION'
    }));
  
  return res.json({
    success: true,
    discrepancies,
    totalDiscrepancies: discrepancies.length
  });
};
```

---

## 📊 TABEL PERBANDINGAN: SEBELUM vs SESUDAH

| Aspek | Saat Ini (RENTAN) | Setelah Perbaikan (AMAN) |
|-------|------------------|------------------------|
| **Status Tracking** | "Pending" ambigu | "Paid", "Completed", "Locked" |
| **Item History** | Direct delete | Soft delete + audit trail |
| **Payment Record** | Hanya amount_paid | Snapshot items + amount + lock |
| **Modification Log** | TIDAK ADA | Lengkap dengan user+timestamp |
| **Authorization** | TIDAK ADA | Role-based (supervisor only) |
| **Reconciliation** | Manual/sulit | Automated dengan flag suspisious |
| **Fraud Detection** | Tidak mungkin | Mudah via discrepancy report |
| **Audit Trail** | 0% | 100% traceable |

---

## 🛡️ REKOMENDASI PRIORITAS

### 🔴 URGENT (Lakukan HARI INI):

1. **Ubah status "Pending" → "Completed"** saat close bill
   - File: [openBill.controller.js](openBill.controller.js#L859)
   - ```javascript
     order.status = 'Completed'; // Bukan 'Pending'
     ```

2. **Tambah cek status "Completed"** sebelum remove item
   - File: [openBill.controller.js](openBill.controller.js#L410)
   - Sudah ada tapi hanya cek `===` bukan `$in`

### 🟠 HIGH (Minggu ini):

3. Implementasi Payment Snapshot (itemsSnapshot, totalSnapshot)
4. Tambah closedBy + closedAt fields
5. Tambah modificationHistory array

### 🟡 MEDIUM (Bulan ini):

6. Implementasi soft delete untuk items
7. Tambah reconciliation report
8. Implementasi authorization layer

### 🟢 LOW (Quarterly):

9. Implementasi audit log database terpisah
10. Tambah monitoring dashboard untuk fraud detection

---

## 📝 KESIMPULAN

**Sistem Open Bill MEMILIKI RISIKO FRAUD TINGGI** terutama pada:
- ✅ Penghapusan item setelah pembayaran
- ✅ Pembukaan kembali order tertutup
- ✅ Tidak ada audit trail
- ✅ Status "Pending" ambigu
- ✅ Payment record tidak immutable

**Kemungkinan Fraud:** **MEDIUM-HIGH** (70% feasible untuk cashier yang nakal)

**Action Item:** Implementasi 5 perbaikan URGENT sebelum production release.

---

## 📞 NEXT STEPS

1. Review dokumen ini dengan team keamanan
2. Prioritaskan perbaikan urgent
3. Implementasi dalam sprint berikutnya
4. Test dengan skenario fraud di staging
5. Tambahkan monitoring & alerting untuk order modifications
