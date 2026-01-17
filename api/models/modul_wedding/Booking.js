import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  eventTime: String,
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  guestCount: {
    type: Number,
    required: true
  },
  // Food & Catering
  foodPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodPackage'
  },
  cateringOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CateringOrder'
  },
  selectedMenuAddons: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    quantity: Number,
    notes: String
  }],
  // Other vendors
  vendors: [{
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    service: String,
    price: Number,
    notes: String,
    payoutStatus: {
      type: String,
      enum: ['pending', 'scheduled', 'processing', 'paid', 'cancelled'],
      default: 'pending'
    },
    payoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payout'
    }
  }],
  // Food package payout info
  foodPayoutStatus: {
    type: String,
    enum: ['pending', 'scheduled', 'processing', 'paid', 'cancelled'],
    default: 'pending'
  },
  foodPayoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payout'
  },
  // Packages for other services
  packages: [{
    name: String,
    type: {
      type: String,
      enum: ['decoration', 'photography', 'makeup', 'entertainment', 'other']
    },
    price: Number,
    description: String
  }],
  // Pricing
  venuePrice: Number,
  foodPrice: Number,
  vendorPrice: Number,
  totalPrice: Number,
  amountPaid: {
    type: Number,
    default: 0
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'confirmed', 'paid', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'refunded'],
    default: 'pending'
  },
  depositAmount: Number,
  notes: String,
  specialRequests: String,
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Pre-save middleware untuk menghitung total harga
bookingSchema.pre('save', async function(next) {
  if (this.isModified('venue') || this.isModified('foodPackage') || 
      this.isModified('vendors') || this.isModified('packages') ||
      this.isModified('selectedMenuAddons') || this.isModified('guestCount')) {
    
    let total = 0;

    // Hitung harga venue
    if (this.venue) {
      const venue = await mongoose.model('Venue').findById(this.venue);
      if (venue) {
        const eventDate = new Date(this.eventDate);
        const day = eventDate.getDay();
        const isWeekend = day === 0 || day === 6;
        this.venuePrice = isWeekend ? venue.pricing.weekendPrice : venue.pricing.weekdayPrice;
        total += this.venuePrice;
      }
    }

    // Hitung harga food package
    if (this.foodPackage) {
      const foodPackage = await mongoose.model('FoodPackage').findById(this.foodPackage);
      if (foodPackage) {
        this.foodPrice = foodPackage.pricePerPax * this.guestCount;
        total += this.foodPrice;
      }
    }

    // Hitung harga vendors
    this.vendorPrice = this.vendors.reduce((sum, vendor) => sum + (vendor.price || 0), 0);
    total += this.vendorPrice;

    // Hitung harga packages lain
    const packagesPrice = this.packages.reduce((sum, pkg) => sum + (pkg.price || 0), 0);
    total += packagesPrice;

    // Hitung harga addons menu
    if (this.selectedMenuAddons && this.selectedMenuAddons.length > 0) {
      for (let addon of this.selectedMenuAddons) {
        const menuItem = await mongoose.model('MenuItem').findById(addon.menuItem);
        if (menuItem) {
          total += menuItem.price * (addon.quantity || 1);
        }
      }
    }

    this.totalPrice = total;
  }
  next();
});

// Method untuk membuat payout setelah event selesai
bookingSchema.methods.createPayouts = async function() {
  const Payout = mongoose.model('Payout');
  const payoutPromises = [];

  // Buat payout untuk food package
  if (this.foodPackage && this.foodPrice > 0) {
    const foodPackage = await mongoose.model('FoodPackage').findById(this.foodPackage);
    if (foodPackage) {
      const payout = new Payout({
        vendor: foodPackage.vendor,
        booking: this._id,
        foodPackage: this.foodPackage,
        amount: this.foodPrice,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari setelah event
        status: 'pending',
        timeline: [{
          status: 'pending',
          notes: 'Payout scheduled for food package'
        }]
      });
      payoutPromises.push(payout.save());
      
      this.foodPayoutStatus = 'scheduled';
      this.foodPayoutId = payout._id;
    }
  }

  // Buat payout untuk vendors lain
  for (let vendorBooking of this.vendors) {
    if (vendorBooking.price > 0) {
      const payout = new Payout({
        vendor: vendorBooking.vendor,
        booking: this._id,
        amount: vendorBooking.price,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        timeline: [{
          status: 'pending',
          notes: `Payout scheduled for ${vendorBooking.service}`
        }]
      });
      payoutPromises.push(payout.save());
      
      vendorBooking.payoutStatus = 'scheduled';
      vendorBooking.payoutId = payout._id;
    }
  }

  await Promise.all(payoutPromises);
  await this.save();
};

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;