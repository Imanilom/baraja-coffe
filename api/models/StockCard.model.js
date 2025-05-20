import mongoose from 'mongoose';

const StockCardSchema = new mongoose.Schema({
  product: {
    type: String,
    required: true
  },
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Outlet',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  initialStock: {
    type: Number,
    default: 0
  },
  stockIn: {
    type: Number,
    default: 0
  },
  stockOut: {
    type: Number,
    default: 0
  },
  sales: {
    type: Number,
    default: 0
  },
  transfer: {
    type: Number,
    default: 0
  },
  adjustment: {
    type: Number,
    default: 0
  },
  finalStock: {
    type: Number,
    default: function() {
      return this.initialStock + this.stockIn - this.stockOut - this.sales - this.transfer + this.adjustment;
    }
  },
  transactions: [{
    type: {
      type: String,
      enum: ['stock_in', 'stock_out', 'sale', 'transfer', 'adjustment'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, { timestamps: true });

const StockCard = mongoose.model('StockCard', StockCardSchema);

export default StockCard;