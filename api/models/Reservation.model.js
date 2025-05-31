import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId, // Menunjuk ke section & table (dapat dari TableLayout)
    ref: 'TableLayout.sections.tables._id', // opsional, tapi bisa juga diatur via logika
    required: false
  },
  peopleCount: { type: Number, required: true, min: 1 },
  checkInTime: { type: Date, default: Date.now },
  checkOutTime: { type: Date, required: false }, // Opsional, bisa diisi saat check-out
  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
      },
      quantity: { type: Number, required: true, min: 1 },
      selectedAddons: [
        {
          name: { type: String, required: true },
          option: { type: String, required: true },
          price: { type: Number, required: true }
        }
      ],
      selectedToppings: [
        {
          name: { type: String, required: true },
          price: { type: Number, required: true }
        }
      ],
      notes: { type: String }
    }
  ],
  totalPrice: { type: Number, required: true, min: 0 },
  paymentType: { type: String, enum: ['full', 'partial'], default: 'full' },
  downPayment: { type: Number, default: 0, min: 0 },
  isDownPaymentPaid: { type: Boolean, default: false },
  remainingBalance: { type: Number, default: 0, min: 0 },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'dp_paid', 'paid'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'qris', 'credit_card', 'debit_card'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  reservedAt: { type: Date, default: Date.now },
  completedAt: Date
}, { timestamps: true });

// Middleware to auto-calculate remaining balance
ReservationSchema.pre('save', function (next) {
  if (this.paymentType === 'partial') {
    this.remainingBalance = this.totalPrice - this.downPayment;
    if (this.isDownPaymentPaid) {
      this.paymentStatus = 'dp_paid';
    }
  } else {
    this.remainingBalance = 0;
    this.downPayment = this.totalPrice;
    this.isDownPaymentPaid = true;
    this.paymentStatus = 'paid';
  }
  next();
});

const Reservation = mongoose.model('Reservation', ReservationSchema);
export default Reservation;
