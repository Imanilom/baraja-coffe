import mongoose from 'mongoose';

// Skema untuk tracking pengiriman barang
const deliveryTrackingSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  deliveryPerson: {
    type: String,
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,
    productSku: String,
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: String,
    notes: String
  }],
  deliveryDate: {
    type: Date,
    default: Date.now
  },
  receivedDate: Date,
  receivedBy: String,
  status: {
    type: String,
    enum: ['in_transit', 'delivered', 'received'],
    default: 'in_transit'
  },
  proofOfDelivery: String, // Foto bukti serah terima
  notes: String
}, {
  timestamps: true
});

const DeliveryTracking = mongoose.model('DeliveryTracking', deliveryTrackingSchema);

export default DeliveryTracking;