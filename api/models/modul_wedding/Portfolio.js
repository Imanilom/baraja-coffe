import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  projectDate: Date,
  category: String,
  venue: String,
  budget: Number,
  clientName: String,
  servicesProvided: [String],
  tags: [String],
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

export default Portfolio;