import mongoose from 'mongoose';

const addOnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['size', 'temperature', 'spiciness', 'custom'], // Jenis add-on
    required: true,
  },
  options: [
    {
      label: {
        type: String,
        required: true, // Contoh: "Small", "Hot", "Cheese"
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AddOn = mongoose.model('AddOn', addOnSchema);

export default AddOn;
