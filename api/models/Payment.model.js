
import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  // Basic payment info
  order_id: { type: String, ref: 'Order', required: true },
  payment_code: { type: String },
  transaction_id: { type: String },
  method: { type: String, required: true },
  status: { type: String, default: 'pending' },

  // ✅ PERBAIKAN: Payment type yang lebih spesifik
  paymentType: {
    type: String,
    enum: ['Down Payment', 'Final Payment', 'Full'],
    required: true
  },

  amount: { type: Number, required: true },

  // ✅ TAMBAHAN: Total amount keseluruhan order (untuk tracking)
  totalAmount: { type: Number },

  remainingAmount: { type: Number, default: 0 },

  // ✅ TAMBAHAN: Reference ke payment terkait (untuk Final Payment)
  relatedPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },

  phone: { type: String },
  discount: { type: Number, default: 0 },
  midtransRedirectUrl: { type: String },

  // Midtrans fields
  fraud_status: { type: String },
  transaction_time: { type: String },
  expiry_time: { type: String },
  settlement_time: { type: String },
  paidAt: { type: Date },

  va_numbers: [{
    bank: { type: String },
    va_number: { type: String }
  }],
  permata_va_number: { type: String },
  bill_key: { type: String },
  biller_code: { type: String },
  pdf_url: { type: String },
  currency: { type: String, default: "IDR" },
  merchant_id: { type: String },
  signature_key: { type: String },

  // GoPay/QRIS actions
  actions: [{
    name: { type: String },
    method: { type: String },
    url: { type: String }
  }],

  raw_response: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
  index: {
    order_id: 1,
    transaction_id: 1,
    status: 1,
    paymentType: 1,
    relatedPaymentId: 1, // ✅ TAMBAH index
    createdAt: -1
  }
});

PaymentSchema.index({
  order_id: 1,
  transaction_id: 1,
  status: 1,
  paymentType: 1,
  relatedPaymentId: 1,
  createdAt: -1,
});

// Supaya virtual ikut ke JSON/obj
PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });

// ✅ PERBAIKAN: Virtual untuk check payment status
PaymentSchema.virtual('isFullyPaid').get(function () {
  return (this.status === 'paid' || this.status === 'settlement') && this.remainingAmount === 0;
});

// ✅ TAMBAHAN: Virtual untuk check if this is down payment
PaymentSchema.virtual('isDownPayment').get(function () {
  return this.paymentType === 'Down Payment';
});

// ✅ TAMBAHAN: Virtual untuk check if this is final payment
PaymentSchema.virtual('isFinalPayment').get(function () {
  return this.paymentType === 'Final Payment';
});

// Methods
PaymentSchema.methods.markAsPaid = function () {
  this.status = 'settlement';
  this.paidAt = new Date();
  return this.save();
};

PaymentSchema.methods.updateRemainingAmount = function (newRemainingAmount) {
  this.remainingAmount = newRemainingAmount;
  return this.save();
};

// ✅ TAMBAHAN: Method untuk update final payment
PaymentSchema.methods.markAsFullyPaid = async function () {
  this.status = 'settlement';
  this.remainingAmount = 0;
  this.paidAt = new Date();

  // Jika ini Final Payment, update Down Payment terkait
  if (this.paymentType === 'Final Payment' && this.relatedPaymentId) {
    const downPayment = await this.constructor.findById(this.relatedPaymentId);
    if (downPayment) {
      downPayment.remainingAmount = 0;
      await downPayment.save();
    }
  }

  return this.save();
};

// Statics
PaymentSchema.statics.findByOrderId = function (orderId) {
  return this.find({ order_id: orderId }).sort({ createdAt: -1 });
};

// ✅ PERBAIKAN: Find pending down payments yang lebih akurat
PaymentSchema.statics.findPendingDownPayments = function () {
  return this.find({
    paymentType: 'Down Payment',
    status: 'settlement',
    remainingAmount: { $gt: 0 }
  });
};

// ✅ TAMBAHAN: Find payment summary untuk order
PaymentSchema.statics.getPaymentSummary = async function (orderId) {
  const payments = await this.find({ order_id: orderId }).sort({ createdAt: 1 });

  if (payments.length === 0) {
    return null;
  }

  const downPayment = payments.find(p => p.paymentType === 'Down Payment');
  const finalPayment = payments.find(p => p.paymentType === 'Final Payment');
  const fullPayment = payments.find(p => p.paymentType === 'Full');

  const totalPaid = payments
    .filter(p => p.status === 'settlement')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalAmount = downPayment?.totalAmount || fullPayment?.totalAmount || 0;
  const remainingAmount = Math.max(0, totalAmount - totalPaid);
  const isFullyPaid = remainingAmount === 0;

  return {
    payments,
    downPayment,
    finalPayment,
    fullPayment,
    summary: {
      totalAmount,
      totalPaid,
      remainingAmount,
      isFullyPaid,
      paymentCount: payments.length,
      paymentType: downPayment ? 'Multiple' : 'Single',
      paymentHistory: payments.map(p => ({
        type: p.paymentType,
        method: p.method,
        amount: p.amount,
        status: p.status,
        date: p.createdAt
      }))
    }
  };
};

// ✅ TAMBAHAN: Check if order can receive final payment
PaymentSchema.statics.canReceiveFinalPayment = async function (orderId) {
  const downPayment = await this.findOne({
    order_id: orderId,
    paymentType: 'Down Payment',
    status: 'settlement'
  });

  return downPayment && downPayment.remainingAmount > 0;
};

// ✅ TAMBAHAN: Get required final payment amount
PaymentSchema.statics.getRequiredFinalPaymentAmount = async function (orderId) {
  const downPayment = await this.findOne({
    order_id: orderId,
    paymentType: 'Down Payment',
    status: 'settlement'
  });

  return downPayment ? downPayment.remainingAmount : 0;
};

export default mongoose.model('Payment', PaymentSchema);





















// ! Backup of Payment model before major changes



// import mongoose from 'mongoose';

// const PaymentSchema = new mongoose.Schema({
//   // Basic payment info
//   order_id: { type: String, ref: 'Order', required: true },
//   payment_code: { type: String },
//   transaction_id: { type: String },
//   method: { type: String, required: true },
//   status: { type: String, default: 'pending' },
//   paymentType: {
//     type: String,
//   },
//   amount: { type: Number, required: true },
//   remainingAmount: { type: Number, default: 0 },
//   phone: { type: String },
//   discount: { type: Number, default: 0 },
//   midtransRedirectUrl: { type: String },

//   // Midtrans fields
//   fraud_status: { type: String },
//   transaction_time: { type: String },
//   expiry_time: { type: String },
//   settlement_time: { type: String },
//   paidAt: { type: Date },

//   va_numbers: [{
//     bank: { type: String },
//     va_number: { type: String }
//   }],
//   permata_va_number: { type: String },
//   bill_key: { type: String },
//   biller_code: { type: String },
//   pdf_url: { type: String },
//   currency: { type: String, default: "IDR" },
//   merchant_id: { type: String },
//   signature_key: { type: String },

//   // NEW: Store GoPay/QRIS actions
//   actions: [{
//     name: { type: String },
//     method: { type: String },
//     url: { type: String }
//   }],

//   raw_response: { type: mongoose.Schema.Types.Mixed },
// }, {
//   timestamps: true,
//   index: {
//     order_id: 1,
//     transaction_id: 1,
//     status: 1,
//     paymentType: 1,
//     createdAt: -1
//   }
// });

// // Virtual untuk lunas
// PaymentSchema.virtual('isFullyPaid').get(function () {
//   return (this.status === 'paid' || this.status === 'settlement') && this.remainingAmount === 0;
// });

// // Methods
// PaymentSchema.methods.markAsPaid = function () {
//   this.status = 'settlement';
//   this.paidAt = new Date();
//   return this.save();
// };

// PaymentSchema.methods.updateRemainingAmount = function (newRemainingAmount) {
//   this.remainingAmount = newRemainingAmount;
//   return this.save();
// };

// // Statics
// PaymentSchema.statics.findByOrderId = function (orderId) {
//   return this.find({ order_id: orderId }).sort({ createdAt: -1 });
// };

// PaymentSchema.statics.findPendingDownPayments = function () {
//   return this.find({
//     paymentType: 'Down Payment',
//     status: 'settlement',
//     remainingAmount: { $gt: 0 }
//   });
// };

// export default mongoose.model('Payment', PaymentSchema);


