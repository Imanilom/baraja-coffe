import mongoose from 'mongoose';

// Helper function untuk mendapatkan waktu WIB sekarang
const getWIBNow = () => {
  const now = new Date();
  // Convert to WIB (UTC+7)
  return new Date(now.getTime() + (7 * 60 * 60 * 1000));
};

// Helper function untuk convert Date ke WIB
const toWIB = (date) => {
  if (!date) return date;
  const utcDate = new Date(date.toISOString());
  return new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
};

// Schema untuk split payment
const SplitPaymentSchema = new mongoose.Schema({
  paymentMethod: {
    type: String,
    enum: ['Cash', 'cash', 'Card', 'QRIS', 'E-Wallet', 'Debit', 'Bank Transfer', 'No Payment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  va_numbers: [{
    bank: String,
    va_number: String
  }],
  actions: [{
    name: String,
    method: String,
    url: String
  }],
  paymentDetails: {
    // Untuk cash
    cashTendered: { type: Number, default: 0 },
    change: { type: Number, default: 0 },

    // Untuk card
    cardType: { type: String },
    cardLast4: { type: String },
    cardTransactionId: { type: String },

    // Untuk QRIS/E-Wallet
    qrCode: { type: String },
    ewallets: {
      type: String,
      enum: ['Gopay', 'OVO', 'Dana', 'ShopeePay', 'LinkAja', 'Other']
    },
    transactionId: { type: String },

    // Untuk bank transfer
    bankName: { type: String },
    accountNumber: { type: String },
    transferReference: { type: String }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date,
    default: () => getWIBNow()
  },
  notes: {
    type: String,
    default: ''
  },
  refundDetails: {
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String },
    refundedAt: { type: Date },
    refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
});

const OrderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: false
  },
  // DATA DENORMALIZED UNTUK BACKUP - MENCEGAH ERROR SAAT MENU DIHAPUS
  menuItemData: {
    name: { type: String, default: '' },
    price: { type: Number, default: 0 },
    category: { type: String, default: '' },
    sku: { type: String, default: '' },
    selectedAddons: [{
      name: { type: String },
      price: { type: Number },
      options: [{
        label: { type: String },
        price: { type: Number }
      }]
    }],
    selectedToppings: [{
      _id: { type: String },
      name: { type: String },
      price: { type: Number }
    }],
    isActive: { type: Boolean, default: true }
  },
  quantity: { type: Number, min: 1 },
  subtotal: { type: Number, min: 0 },
  addons: [
    {
      name: String,
      price: Number,
      options: [
        {
          label: { type: String },
          price: { type: Number }
        }
      ]
    }
  ],
  toppings: [{
    _id: { type: String },
    name: String,
    price: Number
  }],
  notes: { type: String, default: '' },
  guestName: {
    type: String,
    default: ''
  },
  batchNumber: { type: Number, default: 1 },
  addedAt: {
    type: Date,
    default: () => getWIBNow()
  },
  kitchenStatus: {
    type: String,
    enum: ['pending', 'printed', 'cooking', 'ready', 'served'],
    default: 'pending'
  },
  isPrinted: { type: Boolean, default: false },
  printedAt: {
    type: Date,
    set: function (date) {
      return date ? toWIB(date) : date;
    }
  },
  dineType: {
    type: String,
    enum: ['Dine-In', 'Take Away'],
    default: 'Dine-In'
  },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  outletName: { type: String },
  // Hapus payment_id dari OrderItem karena sekarang payment di level order
});

// Schema untuk selected promo bundles
const SelectedPromoBundleSchema = new mongoose.Schema({
  promoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutoPromo',
    required: true
  },
  promoName: { type: String, required: true },
  bundleSets: { type: Number, required: true, min: 1 },
  appliedDiscount: { type: Number, default: 0 },
  affectedItems: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    menuItemName: String,
    quantityInBundle: Number,
    discountShare: Number,
    originalSubtotal: Number,
    discountedSubtotal: Number
  }]
});

// Model Order
const OrderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user: { type: String, required: true, default: 'Guest' },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  device_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', default: null },
  items: [OrderItemSchema],
  customAmountItems: [{
    amount: { type: Number, required: true },
    name: { type: String, default: 'Penyesuaian Pembayaran' },
    description: { type: String, default: '' },
    dineType: {
      type: String,
      enum: ['Dine-In', 'Take Away'],
      default: 'Dine-In'
    },
    appliedAt: {
      type: Date,
      default: () => getWIBNow()
    },
    originalAmount: { type: Number },
    discountApplied: { type: Number, default: 0 }
  }],

  // ✅ BARU: Field untuk selected promo bundles dari user
  selectedPromoBundles: [SelectedPromoBundleSchema],

  status: {
    type: String,
    enum: ['Pending', 'Waiting', 'Reserved', 'OnProcess', 'Completed', 'Canceled'],
    default: 'Pending'
  },

  // MODIFIKASI: Payment diubah menjadi array untuk split payment
  payments: [SplitPaymentSchema],

  // Field legacy untuk kompatibilitas (opsional)
  paymentMethod: {
    type: String,
    enum: ['Cash', 'cash', 'Card', 'QRIS', 'E-Wallet', 'Debit', 'Bank Transfer', 'No Payment'],
  },

  orderType: {
    type: String,
    enum: ['Dine-In', 'Pickup', 'Delivery', 'Take Away', 'Reservation', 'Event'],
    required: true
  },
  deliveryAddress: { type: String },
  tableNumber: { type: String },
  pickupTime: { type: String },
  type: { type: String, enum: ['Indoor', 'Outdoor'], default: 'Indoor' },
  cancellationReason: {
    type: String,
    default: null
  },
  isOpenBill: {
    type: Boolean,
    default: function () {
      return this.orderType === 'Dine-In' || this.orderType === 'Reservation';
    }
  },
  originalReservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },

  // Diskon & Promo
  discounts: {
    autoPromoDiscount: { type: Number, default: 0 },
    manualDiscount: { type: Number, default: 0 },
    voucherDiscount: { type: Number, default: 0 },
    selectedBundleDiscount: { type: Number, default: 0 } // ✅ BARU: Total discount dari selected bundles
  },
  appliedPromos: [{
    promoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AutoPromo',
      required: true
    },
    promoName: String,
    promoType: String,
    discount: Number,
    affectedItems: [{
      menuItem: mongoose.Schema.Types.ObjectId,
      menuItemName: String,
      quantity: Number,
      originalSubtotal: Number,
      discountAmount: Number,
      discountedSubtotal: Number,
      discountPercentage: Number
    }],
    freeItems: [{
      menuItem: mongoose.Schema.Types.ObjectId,
      menuItemName: String,
      quantity: Number,
      price: Number,
      isFree: Boolean
    }]
  }],

  appliedManualPromo: { type: mongoose.Schema.Types.ObjectId, ref: 'Promo' },
  appliedVoucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },

  // Pajak dan Service Fee
  taxAndServiceDetails: [{
    type: { type: String, enum: ['tax', 'service'], required: true },
    name: String,
    amount: Number
  }],
  totalTax: { type: Number, default: 0 },
  totalServiceFee: { type: Number, default: 0 },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },

  // Total akhir
  totalBeforeDiscount: { type: Number, required: true },
  totalAfterDiscount: { type: Number, required: true },
  totalCustomAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },

  // MODIFIKASI: Change sekarang dihitung dari total payments
  change: {
    type: Number,
    default: 0
  },

  // Sumber order
  source: { type: String, enum: ['Web', 'App', 'Cashier', 'Waiter', 'Gro'], required: true },
  created_by: {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    employee_name: {
      type: String,
      default: null
    },
    created_at: {
      type: Date,
      default: () => getWIBNow()
    }
  },
  currentBatch: { type: Number, default: 1 },
  lastItemAddedAt: {
    type: Date,
    set: function (date) {
      return date ? toWIB(date) : date;
    }
  },
  kitchenNotifications: [{
    batchNumber: Number,
    sentAt: {
      type: Date,
      default: () => getWIBNow()
    },
    type: { type: String, enum: ['new_batch', 'additional_items'] }
  }],

  // Reservation reference
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },

  // Waktu dalam WIB
  createdAtWIB: {
    type: Date,
    default: () => getWIBNow()
  },
  updatedAtWIB: {
    type: Date,
    default: () => getWIBNow()
  },

  // Delivery fields
  deliveryStatus: {
    type: String,
    default: false
  },
  deliveryProvider: {
    type: String,
    default: false
  },
  deliveryTracking: {
    provider: String,
    tracking_number: String,
    status: String,
    driver_name: String,
    driver_phone: String,
    live_tracking_url: String,
    estimated_arrival: Date
  },
  recipientInfo: {
    name: String,
    phone: String,
    address: String,
    coordinates: String,
    note: String
  },

  // MODIFIKASI: Tambah field untuk tracking split payment
  isSplitPayment: {
    type: Boolean,
    default: false
  },
  splitPaymentStatus: {
    type: String,
    enum: ['not_started', 'partial', 'completed', 'overpaid'],
    default: 'not_started'
  },

  // Riwayat pemindahan meja
  transferHistory: [{
    fromTable: String,
    toTable: String,
    transferredBy: String,
    reason: String,
    transferredAt: {
      type: Date,
      default: () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
    }
  }],
  stockRolledBack: {
    type: Boolean,
    default: false,
    index: true
  },
  stockRollbackAt: {
    type: Date,
    default: null
  },
  stockRollbackDetails: [{
    menuItemId: mongoose.Schema.Types.ObjectId,
    name: String,
    quantity: Number,
    success: Boolean,
    error: String
  }],
  tableReleased: {
    type: Boolean,
    default: false
  },
  tableReleasedAt: {
    type: Date,
    default: null
  },
  canceledBySystem: {
    type: Boolean,
    default: false
  },
  canceledAt: {
    type: Date,
    default: null
  },
  autoCompletedAt: {
    type: Date,
    default: null
  },
  autoCompletedReason: {
    type: String,
    default: null
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields untuk menampilkan waktu dalam WIB
OrderSchema.virtual('createdAtWIBFormatted').get(function () {
  return this.createdAt ? this.formatToWIB(this.createdAt) : null;
});

OrderSchema.virtual('updatedAtWIBFormatted').get(function () {
  return this.updatedAt ? this.formatToWIB(this.updatedAt) : null;
});

// Virtual untuk total selected bundle discount
OrderSchema.virtual('selectedBundleDiscount').get(function () {
  if (!this.selectedPromoBundles || !Array.isArray(this.selectedPromoBundles)) {
    return 0;
  }
  return this.selectedPromoBundles.reduce((total, bundle) => total + (bundle.appliedDiscount || 0), 0);
});

// Virtual untuk total paid amount dari semua payments
OrderSchema.virtual('totalPaid').get(function () {
  if (!this.payments || !Array.isArray(this.payments)) {
    return 0;
  }
  return this.payments.reduce((total, payment) => {
    if (payment.status === 'completed' || payment.status === 'pending') {
      return total + (payment.amount || 0);
    }
    return total;
  }, 0);
});

// Virtual untuk remaining balance
OrderSchema.virtual('remainingBalance').get(function () {
  const totalPaid = this.totalPaid;
  const grandTotal = this.grandTotal || 0;
  return Math.max(0, grandTotal - totalPaid);
});

// Virtual untuk totalPrice dari items
OrderSchema.virtual('totalPrice').get(function () {
  if (!this.items || !Array.isArray(this.items)) {
    return 0;
  }
  return this.items.reduce((total, item) => total + (item.subtotal || 0), 0);
});

// Method untuk format WIB
OrderSchema.methods.formatToWIB = function (date) {
  if (!date) return null;

  // Pastikan date adalah Date object
  const dateObj = new Date(date);

  // Format dengan timezone Asia/Jakarta
  return dateObj.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// Method untuk mendapatkan tanggal WIB (tanpa waktu)
OrderSchema.methods.getWIBDate = function () {
  const date = this.createdAt || new Date();
  return date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// MIDDLEWARE UTAMA: Backup data menu item secara otomatis dan update payment status
OrderSchema.pre('save', async function (next) {
  try {
    // Backup data menu item untuk setiap item yang ada
    if (this.items && Array.isArray(this.items)) {
      for (let item of this.items) {
        if (item.menuItem && (!item.menuItemData || !item.menuItemData.name)) {
          // Populate data menu item secara manual
          const MenuItem = mongoose.model('MenuItem');
          const menuItemDoc = await MenuItem.findById(item.menuItem).lean();

          if (menuItemDoc) {
            item.menuItemData = {
              name: menuItemDoc.name || 'Unknown Item',
              price: menuItemDoc.price || 0,
              category: menuItemDoc.category || 'Uncategorized',
              sku: menuItemDoc.sku || '',
              selectedAddons: item.addons || [],
              selectedToppings: item.toppings || [],
              isActive: menuItemDoc.isActive !== false,
            };
          } else {
            // Jika menu item tidak ditemukan, gunakan data fallback
            item.menuItemData = {
              name: 'Menu Item Deleted',
              price: item.subtotal / (item.quantity || 1) || 0,
              category: 'Deleted Items',
              sku: 'DELETED',
              selectedAddons: item.addons || [],
              selectedToppings: item.toppings || [],
              isActive: false,
            };
          }
        } else if (!item.menuItem && (!item.menuItemData || !item.menuItemData.name)) {
          // Untuk custom items tanpa menuItem reference
          item.menuItemData = {
            name: 'Custom Item',
            price: item.subtotal / (item.quantity || 1) || 0,
            category: 'Custom',
            sku: 'CUSTOM',
            selectedAddons: item.addons || [],
            selectedToppings: item.toppings || [],
            isActive: true
          };
        }
      }
    }

    this.updatedAtWIB = getWIBNow();

    // Hitung total dari semua custom amount items
    if (this.customAmountItems && Array.isArray(this.customAmountItems)) {
      this.totalCustomAmount = this.customAmountItems.reduce((total, item) => {
        return total + (item.amount || 0);
      }, 0);
    } else {
      this.totalCustomAmount = 0;
    }

    // Update split payment status
    if (this.payments && Array.isArray(this.payments)) {
      const totalPaid = this.payments.reduce((total, payment) => {
        if (payment.status === 'completed') {
          return total + (payment.amount || 0);
        }
        return total;
      }, 0);

      const grandTotal = this.grandTotal || 0;

      // Tentukan status split payment
      if (totalPaid === 0) {
        this.splitPaymentStatus = 'not_started';
        this.isSplitPayment = false;
      } else if (totalPaid < grandTotal) {
        this.splitPaymentStatus = 'partial';
        this.isSplitPayment = this.payments.length > 1;
      } else if (totalPaid === grandTotal) {
        this.splitPaymentStatus = 'completed';
        this.isSplitPayment = this.payments.length > 1;
      } else {
        this.splitPaymentStatus = 'overpaid';
        this.isSplitPayment = this.payments.length > 1;
        // Hitung change untuk overpayment
        this.change = totalPaid - grandTotal;
      }

      // Update legacy paymentMethod untuk kompatibilitas (gunakan metode pertama)
      if (this.payments.length > 0) {
        this.paymentMethod = this.payments[0].paymentMethod;
      }
    }

    // Update total selected bundle discount
    if (this.selectedPromoBundles && Array.isArray(this.selectedPromoBundles)) {
      const totalBundleDiscount = this.selectedPromoBundles.reduce((total, bundle) => {
        return total + (bundle.appliedDiscount || 0);
      }, 0);
      this.discounts.selectedBundleDiscount = totalBundleDiscount;
    }

    next();
  } catch (error) {
    console.error('Error in order pre-save middleware:', error);
    next();
  }
});

OrderSchema.pre('save', function (next) {
  const nowWIB = getWIBNow();

  // Update updatedAtWIB
  this.updatedAtWIB = nowWIB;

  // Ensure createdAtWIB is set
  if (!this.createdAtWIB && this.isNew) {
    this.createdAtWIB = nowWIB;
  }

  // Convert all Date fields that should be in WIB
  if (this.lastItemAddedAt && !(this.lastItemAddedAt instanceof Date)) {
    this.lastItemAddedAt = toWIB(new Date(this.lastItemAddedAt));
  }

  // For items array
  if (this.items && Array.isArray(this.items)) {
    this.items.forEach(item => {
      if (item.addedAt && !(item.addedAt instanceof Date)) {
        item.addedAt = toWIB(new Date(item.addedAt));
      }
      if (item.printedAt && !(item.printedAt instanceof Date)) {
        item.printedAt = toWIB(new Date(item.printedAt));
      }
    });
  }

  next();
});

// Indeks untuk performa
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ isOpenBill: 1, originalReservationId: 1 });
OrderSchema.index({ reservation: 1 });
OrderSchema.index({ createdAtWIB: -1 });
OrderSchema.index({ stockRolledBack: 1, status: 1 });
OrderSchema.index({ tableReleased: 1, orderType: 1 });
OrderSchema.index({ 'payments.status': 1 }); // Index untuk query payment status
OrderSchema.index({ splitPaymentStatus: 1 }); // Index untuk query split payment
OrderSchema.index({ 'selectedPromoBundles.promoId': 1 }); // Index untuk query selected bundles

// ✅ NEW: Compound indexes for GRO Dashboard performance
// Query: Order.find({ outlet, status: $in, orderType: $in, tableNumber: $exists, createdAt: $gte/$lt })
OrderSchema.index({ outlet: 1, orderType: 1, status: 1, createdAt: -1 }); // Main GRO query
OrderSchema.index({ outlet: 1, orderType: 1, tableNumber: 1, status: 1 }); // Table availability query
OrderSchema.index({ order_id: 1 }); // For Payment lookup by order_id

// Middleware untuk auto-sync table status
OrderSchema.post('save', async function (doc, next) {
  try {
    if ((doc.orderType === 'Dine-In' || doc.orderType === 'Reservation') &&
      doc.tableNumber && doc.outlet) {

      console.log(`🔄 Auto-syncing table status for order ${doc.order_id}`);

      setTimeout(async () => {
        try {
          await mongoose.model('Table').syncTableStatusWithActiveOrders(doc.outlet);
          console.log(`✅ Auto-sync completed for outlet ${doc.outlet}`);
        } catch (syncError) {
          console.error('❌ Auto-sync error:', syncError);
        }
      }, 1000);
    }

    next();
  } catch (error) {
    console.error('❌ Error in order save middleware:', error);
    next();
  }
});

// Juga trigger pada update
OrderSchema.post('findOneAndUpdate', async function (result, next) {
  try {
    if (result && result.outlet &&
      (result.orderType === 'Dine-In' || result.orderType === 'Reservation') &&
      result.tableNumber) {

      console.log(`🔄 Auto-syncing table status after order update: ${result.order_id}`);

      setTimeout(async () => {
        try {
          await mongoose.model('Table').syncTableStatusWithActiveOrders(result.outlet);
        } catch (syncError) {
          console.error('❌ Auto-sync error after update:', syncError);
        }
      }, 1000);
    }

    next();
  } catch (error) {
    console.error('❌ Error in order update middleware:', error);
    next();
  }
});

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);