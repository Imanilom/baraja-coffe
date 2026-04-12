import mongoose from "mongoose";

const cateringOrderSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  foodPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodPackage',
    required: true
  },
  paxCount: {
    type: Number,
    required: true
  },
  selectedMenuItems: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    quantity: Number,
    notes: String
  }],
  selectedAddons: [{
    addon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    quantity: Number,
    price: Number
  }],
  specialRequests: String,
  dietaryRestrictions: [String],
  servingTime: String,
  setupRequirements: String,
  totalFoodPrice: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const CateringOrder = mongoose.model("CateringOrder", cateringOrderSchema);

export default CateringOrder;