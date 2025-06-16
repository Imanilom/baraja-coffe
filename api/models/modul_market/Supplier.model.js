import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  phone: String,
  email: String,
  address: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;