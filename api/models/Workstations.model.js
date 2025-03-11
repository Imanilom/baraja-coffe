import mongoose from "mongoose";


const WorkstationsSchema = new mongoose.Schema({
    outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['Bar', 'Cashier', 'Kitchen'], required: true }, // Menentukan workstation untuk minuman/makanan
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }, // Bisa digunakan untuk maintenance
}, { timestamps: true });


export const Workstations = mongoose.model('Workstations', WorkstationsSchema);