import mongoose from 'mongoose';

// Check if the model is already registered
const Promotion = mongoose.models.Promotion || mongoose.model('Promotion', new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  applicableItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  }],
}, { timestamps: true }));

export default Promotion;
