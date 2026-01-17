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
  // Field untuk track jika item dibatalkan dalam open bill
  isCancelled: { type: Boolean, default: false },
  cancelledAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: { type: String }
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

const SelectedPromoSchema = new mongoose.Schema({
  promoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutoPromo',
    required: true
  },
  promoName: { type: String, required: true },
  promoType: {
    type: String,
    required: true,
    enum: ['bundling', 'buy_x_get_y', 'product_specific']
  },
  // Untuk bundling
  bundleSets: { type: Number, min: 1 },
  // Untuk semua jenis
  appliedDiscount: { type: Number, default: 0 },
  affectedItems: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    menuItemName: String,
    quantity: Number,
    originalSubtotal: Number,
    discountAmount: Number,
    discountedSubtotal: Number,
    discountType: String,
    discountValue: Number
  }],
  // Untuk Buy X Get Y
  freeItems: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    menuItemName: String,
    quantity: Number,
    price: Number,
    isFree: { type: Boolean, default: true }
  }],
  // Metadata
  selectedAt: {
    type: Date,
    default: () => new Date()
  },
  selectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});


// Model Order
const OrderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  // ✅ IDEMPOTENCY: Kunci unik untuk mencegah double order
  idempotencyKey: { type: String, index: true, unique: true, sparse: true },
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
  selectedPromos: [SelectedPromoSchema],

  status: {
    type: String,
    enum: ['Pending', 'Waiting', 'Reserved', 'OnProcess', 'Completed', 'Canceled'],
    default: 'Pending'
  },

  // ========== OPEN BILL FIELDS ==========
  isOpenBill: {
    type: Boolean,
    default: false
  },
  openBillStartedAt: {
    type: Date,
    default: null
  },
  openBillClosedAt: {
    type: Date,
    default: null
  },
  openBillStatus: {
    type: String,
    enum: ['active', 'closed', 'pending_payment'],
    default: 'active'
  },
  customersCount: {
    type: Number,
    default: 1
  },
  cashierNotes: {
    type: String,
    default: ''
  },
  serviceCharge: {
    type: Number,
    default: 0
  },
  taxPercentage: {
    type: Number,
    default: 10
  },
  taxAmount: {
    type: Number,
    default: 0
  },

  // ========== PAYMENT ==========
  payments: [SplitPaymentSchema],

  // Field legacy untuk kompatibilitas
  paymentMethod: {
    type: String,
    enum: ['Cash', 'cash', 'Card', 'QRIS', 'E-Wallet', 'Debit', 'Bank Transfer', 'No Payment'],
  },

  // ========== PARTIAL PAYMENTS TRACKING ==========
  partialPayments: [{
    amount: Number,
    method: String,
    paymentTime: {
      type: Date,
      default: () => getWIBNow()
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],

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
  originalReservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },

  // ========== TABLE MANAGEMENT ==========
  tableStatus: {
    type: String,
    enum: ['occupied', 'available', 'reserved', 'cleaning'],
    default: 'occupied'
  },

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

// Virtual untuk totalPrice dari items (exclude cancelled items)
OrderSchema.virtual('totalPrice').get(function () {
  if (!this.items || !Array.isArray(this.items)) {
    return 0;
  }
  return this.items.reduce((total, item) => {
    if (item.isCancelled) return total;
    return total + (item.subtotal || 0);
  }, 0);
});

// Virtual untuk active items count (exclude cancelled)
OrderSchema.virtual('activeItemsCount').get(function () {
  if (!this.items || !Array.isArray(this.items)) {
    return 0;
  }
  return this.items.filter(item => !item.isCancelled).length;
});

// Virtual untuk open bill duration
OrderSchema.virtual('openBillDuration').get(function () {
  if (!this.isOpenBill || !this.openBillStartedAt) {
    return null;
  }

  const endTime = this.openBillClosedAt || new Date();
  const diffMs = endTime - this.openBillStartedAt;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, totalMinutes: Math.floor(diffMs / (1000 * 60)) };
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

// Method untuk menambahkan item ke open bill
OrderSchema.methods.addItemToOpenBill = async function (itemData, cashierId) {
  try {
    const MenuItem = mongoose.model('MenuItem');
    const menuItem = await MenuItem.findById(itemData.menuItemId);

    if (!menuItem) {
      throw new Error('Menu item tidak ditemukan');
    }

    // Cek stok
    const primaryWarehouseId = menuItem.primaryWarehouseId;
    if (primaryWarehouseId) {
      const currentStock = menuItem.getStockForWarehouse(primaryWarehouseId);
      if (currentStock < itemData.quantity) {
        throw new Error(`Stok tidak cukup untuk ${menuItem.name}. Stok tersedia: ${currentStock}`);
      }
    }

    // Hitung subtotal
    let subtotal = menuItem.price * itemData.quantity;

    // Tambah addons
    if (itemData.addons && itemData.addons.length > 0) {
      itemData.addons.forEach(addon => {
        const menuAddon = menuItem.addons.find(a => a.name === addon.name);
        if (menuAddon) {
          const option = menuAddon.options.find(o => o.label === addon.selectedOption);
          if (option) {
            subtotal += option.price * itemData.quantity;
          }
        }
      });
    }

    // Tambah toppings
    if (itemData.toppings && itemData.toppings.length > 0) {
      itemData.toppings.forEach(topping => {
        const menuTopping = menuItem.toppings.find(t => t.name === topping.name);
        if (menuTopping) {
          subtotal += menuTopping.price * itemData.quantity;
        }
      });
    }

    // Buat order item
    const orderItem = {
      menuItem: itemData.menuItemId,
      menuItemData: {
        name: menuItem.name,
        price: menuItem.price,
        category: menuItem.category || menuItem.mainCategory,
        sku: menuItem.sku || '',
        selectedAddons: itemData.addons || [],
        selectedToppings: itemData.toppings || [],
        isActive: menuItem.isActive
      },
      quantity: itemData.quantity,
      subtotal: subtotal,
      addons: itemData.addons || [],
      toppings: itemData.toppings || [],
      notes: itemData.notes || '',
      guestName: itemData.guestName || '',
      dineType: itemData.dineType || 'Dine-In',
      batchNumber: this.currentBatch,
      addedAt: new Date(),
      kitchenStatus: 'pending',
      isPrinted: false,
      outletId: this.outletId
    };

    // Tambahkan item
    this.items.push(orderItem);

    // Update totals
    this.totalBeforeDiscount += subtotal;
    this.totalAfterDiscount = this.totalBeforeDiscount;
    this.taxAmount = this.totalBeforeDiscount * (this.taxPercentage / 100);
    this.grandTotal = this.totalBeforeDiscount + this.taxAmount + this.serviceCharge;

    this.lastItemAddedAt = new Date();

    // Kurangi stok
    if (primaryWarehouseId) {
      const newStock = currentStock - itemData.quantity;
      await menuItem.updateStockForWarehouse(primaryWarehouseId, newStock);
    }

    await this.save();

    return {
      success: true,
      item: orderItem,
      newTotal: this.grandTotal
    };

  } catch (error) {
    throw error;
  }
};

// Method untuk cancel item dalam open bill
OrderSchema.methods.cancelOpenBillItem = async function (itemIndex, cashierId, reason = '') {
  try {
    if (itemIndex < 0 || itemIndex >= this.items.length) {
      throw new Error('Item index tidak valid');
    }

    const item = this.items[itemIndex];

    // Mark item as cancelled
    item.isCancelled = true;
    item.cancelledAt = new Date();
    item.cancelledBy = cashierId;
    item.cancellationReason = reason;

    // Kembalikan stok
    if (item.menuItem) {
      const MenuItem = mongoose.model('MenuItem');
      const menuItem = await MenuItem.findById(item.menuItem);

      if (menuItem && menuItem.primaryWarehouseId) {
        const currentStock = menuItem.getStockForWarehouse(menuItem.primaryWarehouseId);
        await menuItem.updateStockForWarehouse(
          menuItem.primaryWarehouseId,
          currentStock + item.quantity
        );
      }
    }

    // Recalculate totals (exclude cancelled items)
    this.totalBeforeDiscount = this.items.reduce((total, item) => {
      if (item.isCancelled) return total;
      return total + (item.subtotal || 0);
    }, 0);

    this.totalAfterDiscount = this.totalBeforeDiscount;
    this.taxAmount = this.totalBeforeDiscount * (this.taxPercentage / 100);
    this.grandTotal = this.totalBeforeDiscount + this.taxAmount + this.serviceCharge;

    await this.save();

    return {
      success: true,
      cancelledItem: item,
      newTotal: this.grandTotal
    };

  } catch (error) {
    throw error;
  }
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

    // ✅ REMOVED: grandTotal recalculation
    // Controller (testapporder.controller.js, order.controller.js) already calculates
    // all totals correctly based on frontend input. Pre-save should NOT override
    // those values as it causes bugs (e.g., tax toggle OFF but saved with tax).
    // 
    // Previously this code would recalculate grandTotal for open bill orders,
    // but this created inconsistency between frontend display and saved values.
    // Now we trust the controller to set correct values.

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
        // ✅ REMOVED: Auto-calculation of isSplitPayment
        // Let controllers set this explicitly
      } else if (totalPaid < grandTotal) {
        this.splitPaymentStatus = 'partial';
        // ✅ REMOVED: this.isSplitPayment = this.payments.length > 1;
      } else if (totalPaid === grandTotal) {
        this.splitPaymentStatus = 'completed';
        // ✅ REMOVED: this.isSplitPayment = this.payments.length > 1;
      } else {
        this.splitPaymentStatus = 'overpaid';
        // ✅ REMOVED: this.isSplitPayment = this.payments.length > 1;
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

// Static method untuk mendapatkan active open bills
OrderSchema.statics.getActiveOpenBills = async function (outletId, filters = {}) {
  const query = {
    outletId,
    isOpenBill: true,
    openBillStatus: 'active',
    status: { $in: ['Pending', 'OnProcess'] }
  };

  if (filters.tableNumber) query.tableNumber = filters.tableNumber;
  if (filters.cashierId) query.cashierId = filters.cashierId;

  return this.find(query)
    .sort({ openBillStartedAt: -1 })
    .populate('cashierId', 'name email')
    .lean();
};

// Static method untuk mendapatkan open bill by ID
OrderSchema.statics.getOpenBillById = async function (orderId, outletId = null) {
  const query = {
    order_id: orderId,
    isOpenBill: true
  };

  if (outletId) query.outletId = outletId;

  return this.findOne(query)
    .populate('cashierId', 'name email')
    .populate('items.menuItem', 'name price')
    .lean();
};

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);