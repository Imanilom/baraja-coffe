import mongoose from 'mongoose';
import Area from './Area.model.js';

const tableSchema = new mongoose.Schema({
    table_number: {
        type: String,
        required: true,
        uppercase: true
    },
    area_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area',
        required: true
    },
    seats: {
        type: Number,
        required: true,
        min: 1,
        default: 4
    },
    table_type: {
        type: String,
        enum: ['regular', 'vip', 'family', 'couple'],
        default: 'regular'
    },
    shape: {
        type: String,
        enum: ['square', 'rectangle', 'circle', 'oval', 'custom'],
        default: 'rectangle'
    },
    position: {
        x: { type: Number, default: 0, min: 0 },
        y: { type: Number, default: 0, min: 0 }
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'reserved', 'maintenance'],
        default: 'available'
    },
    is_available: {
        type: Boolean,
        default: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index untuk memastikan table_number unik per area
tableSchema.index({ table_number: 1, area_id: 1 }, { unique: true });

// Virtual untuk mendapatkan full table code
tableSchema.virtual('table_code').get(function () {
    return this.table_number;
});

// Validasi posisi meja tidak melebihi ukuran ruangan
tableSchema.pre('save', async function (next) {
    try {
        const area = await Area.findById(this.area_id);
        if (!area) {
            return next(new Error('Area tidak ditemukan'));
        }

        if (this.position.x > area.roomSize.width || this.position.y > area.roomSize.height) {
            return next(new Error(`Posisi meja (${this.position.x}, ${this.position.y}) melebihi ukuran area (${area.roomSize.width}, ${area.roomSize.height})`));
        }

        next();
    } catch (err) {
        next(err);
    }
});

tableSchema.add({
  statusHistory: [{
    fromStatus: String,
    toStatus: String,
    updatedBy: String, // Nama GRO yang mengupdate
    notes: String,
    updatedAt: {
      type: Date,
      default: () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
    }
  }]
});


// 🔁 Sinkronisasi status meja berdasarkan pesanan aktif (<4 jam)
tableSchema.statics.syncTableStatusWithActiveOrders = async function(outletId) {
  const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const fourHoursAgo = new Date(nowWIB.getTime() - 4 * 60 * 60 * 1000);

  // Ambil semua nomor meja yang punya pesanan aktif <4 jam
  const activeOrders = await mongoose.model('Order').find({
    outlet: outletId,
    status: { $in: ['Pending', 'Waiting', 'OnProcess'] },
    orderType: 'Dine-In',
    tableNumber: { $exists: true, $ne: null },
    createdAtWIB: { $gte: fourHoursAgo }
  }).select('tableNumber');

  const occupiedTableNumbers = activeOrders
    .map(order => order.tableNumber?.toUpperCase())
    .filter(Boolean);

  // 1. Set meja dengan pesanan aktif → 'occupied'
  if (occupiedTableNumbers.length > 0) {
    await this.updateMany(
      {
        table_number: { $in: occupiedTableNumbers },
        is_active: true,
        status: { $ne: 'occupied' } // hanya update jika belum occupied
      },
      { 
        status: 'occupied',
        updatedAt: new Date()
      }
    );
  }

  // 2. Set meja TANPA pesanan aktif → 'available'
  const filterForAvailable = {
    is_active: true,
    status: { $ne: 'available' }, // hindari update berlebihan
    table_number: { $nin: occupiedTableNumbers }
  };

  // Jika tidak ada occupiedTableNumbers, pastikan filter tetap valid
  if (occupiedTableNumbers.length === 0) {
    delete filterForAvailable.table_number;
  }

  await this.updateMany(
    filterForAvailable,
    { 
      status: 'available',
      updatedAt: new Date()
    }
  );
};

const Table = mongoose.model('Table', tableSchema);
export default Table;