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


tableSchema.statics.syncTableStatus = async function (outletId) {
  return {
    totalTables: 0,
    occupiedTables: 0,
    updatedTables: 0,
    details: [],
    skipped: true,
    reason: "Auto-sync disabled per user request"
  };
};

tableSchema.statics.syncTableStatusWithActiveOrders = async function (outletId) {
  return {
    totalTables: 0, occupiedTables: 0, updatedTables: 0, details: [], skipped: true, reason: 'Auto-sync disabled per user request'
  };
};

tableSchema.statics.forceResetTableStatus = async function (tableNumber, outletId) {
  try {
    console.log(`🔄 Force resetting table ${tableNumber} to available for outlet ${outletId}`);

    // Cari meja berdasarkan nomor dan outlet
    const areas = await mongoose.model('Area').find({ outlet_id: outletId }).select('_id');
    const areaIds = areas.map(area => area._id);

    const table = await this.findOne({
      table_number: tableNumber.toUpperCase(),
      area_id: { $in: areaIds },
      is_active: true
    });

    if (!table) {
      throw new Error(`Table ${tableNumber} not found in outlet ${outletId}`);
    }

    // ✅ HAPUS CEK ORDER AKTIF - GRO bisa reset kapan saja
    const oldStatus = table.status;

    // Reset ke available
    table.status = 'available';
    table.is_available = true;
    table.updatedAt = new Date();

    // Tambahkan history
    if (!table.statusHistory) table.statusHistory = [];
    table.statusHistory.push({
      fromStatus: oldStatus,
      toStatus: 'available',
      updatedBy: 'GRO Manual Reset',
      notes: 'Manual reset by GRO - no time restrictions',
      updatedAt: new Date()
    });

    await table.save();

    console.log(`✅ Table ${tableNumber} force reset from ${oldStatus} to available`);

    return {
      success: true,
      table: table.table_number,
      fromStatus: oldStatus,
      toStatus: 'available',
      outletId: outletId,
      message: `Meja ${tableNumber} berhasil direset ke status available`
    };

  } catch (error) {
    console.error('❌ Error force resetting table:', error);
    throw error;
  }
};

const Table = mongoose.model('Table', tableSchema);
export default Table;