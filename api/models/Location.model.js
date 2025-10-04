import mongoose from 'mongoose';

const { Schema } = mongoose;

const locationSchema = new Schema({
  // Reference to user or outlet (flexible)
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.outlet; }
  },
  outlet: {
    type: Schema.Types.ObjectId,
    ref: 'Outlet',
    required: function() { return !this.user; }
  },

  // Location details
  label: {
    type: String,
    enum: ['Rumah', 'Kantor', 'Outlet', 'Lainnya'],
    default: 'Rumah'
  },
  recipientName: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  
  // Address details
  address: {
    type: String
  },
  province: {
    type: String
  },
  city: {
    type: String
  },
  district: {
    type: String
  },
  postalCode: {
    type: String
  },
  details: {
    type: String,
    required: false
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    }
  },

  // Flags
  isPrimary: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
locationSchema.index({ coordinates: '2dsphere' });

// Middleware to ensure only one primary address per user/outlet
locationSchema.pre('save', async function(next) {
  if (this.isPrimary) {
    const owner = this.user || this.outlet;
    const ownerField = this.user ? 'user' : 'outlet';
    
    try {
      // Set all other addresses of this user/outlet to non-primary
      await this.constructor.updateMany(
        { 
          [ownerField]: owner,
          _id: { $ne: this._id } 
        },
        { $set: { isPrimary: false } }
      );
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Update the updatedAt field on document updates
locationSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Location = mongoose.model('Location', locationSchema);

export default Location;