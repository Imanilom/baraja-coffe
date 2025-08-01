  import mongoose from 'mongoose';

  const TableSchema = new mongoose.Schema({
    tableNumber: { type: Number, required: true },
    capacity: { type: Number, required: true }, // jumlah kursi per meja
    shape: { 
      type: String,
      enum: ['square', 'rectangle', 'circle', 'oval', 'custom'], 
      default: 'rectangle'
    },
   
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available'
    },
    notes: { type: String },
  });

  const SectionSchema = new mongoose.Schema({
    name: { type: String, required: true }, // misalnya "Indoor", "Outdoor"
    description: { type: String },
    colorCode: { type: String, default: '#FFFFFF' }, // untuk UI
    tables: [TableSchema],
    totalTables: { type: Number, default: 0 },
    totalCapacity: { type: Number, default: 0 },
  });

  const LayoutSchema = new mongoose.Schema({
    outletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      required: true,
      unique: true
    },
    sections: [SectionSchema],
    layoutImage: { 
      type: String,
      default: 'https://placehold.co/1920x1080/png?text=No+Layout+Image'
    }, // gambar visual layout
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  }, { timestamps: true });

  // Hitung total tables & capacity setiap kali update
  LayoutSchema.pre('save', function(next) {
    this.sections.forEach(section => {
      const totalTables = section.tables.length;
      const totalCapacity = section.tables.reduce((sum, t) => sum + t.capacity, 0);
      section.totalTables = totalTables;
      section.totalCapacity = totalCapacity;
    });
    next();
  });

  export const TableLayout = mongoose.model('TableLayout', LayoutSchema);