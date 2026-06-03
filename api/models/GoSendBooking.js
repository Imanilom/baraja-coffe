// models/GoSendBooking.js
import mongoose from 'mongoose';

const goSendBookingSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  goSend_order_no: { type: String }, // GK-xxxxxxx
  store_order_id: { type: String, required: true }, // Unique ID dari sistem cafe
  shipment_method: { 
    type: String, 
    enum: ['Instant', 'SameDay', 'InstantCar'],
    default: 'Instant'
  },
  status: {
    type: String,
    enum: [
      'confirmed', 'allocated', 'out_for_pickup', 'picked',
      'out_for_delivery', 'on_hold', 'cancelled', 'delivered',
      'rejected', 'no_driver'
    ],
    default: 'confirmed'
  },
  routes: {
    origin: {
      name: String,
      note: String,
      contact_name: String,
      contact_phone: String,
      latlong: String,
      address: String
    },
    destination: {
      name: String,
      note: String,
      contact_name: String,
      contact_phone: String,
      latlong: String,
      address: String
    }
  },
  item: String, // Masked package name (gunakan order ID internal)
  driver_info: {
    driver_id: String,
    driver_name: String,
    driver_phone: String,
    driver_photo: String,
    vehicle_number: String
  },
  pricing: {
    total_price: Number,
    distance: Number,
    shipment_method_description: String
  },
  timestamps: {
    order_created: Date,
    order_dispatch: Date,
    order_arrival: Date,
    order_closed: Date
  },
  live_tracking_url: String,
  insurance_details: {
    applied: { type: Boolean, default: false },
    fee: { type: Number, default: 0 },
    product_description: String,
    product_price: String
  }
}, { timestamps: true });

export default mongoose.model('GoSendBooking', goSendBookingSchema);
