import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorCategory',
    required: true
  },
  address: {
    street: String,
    city: String,
    province: String,
    zipCode: String
  },
  contact: {
    instagram: String, 
    email: String
  },
  socialMedia: {
    instagram: String,
    facebook: String,
    tiktok: String
  },
  pricing: {
    startingPrice: Number,
    currency: {
      type: String,
      default: 'IDR'
    },
    priceUnit: {
      type: String,
      enum: ['per_pax', 'per_package', 'per_hour', 'per_day'],
      default: 'per_package'
    }
  },
  services: [{
    name: String,
    description: String,
    price: Number,
    duration: Number // in minutes
  }],
  availability: [{
    date: Date,
    timeSlots: [String]
  }],
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;