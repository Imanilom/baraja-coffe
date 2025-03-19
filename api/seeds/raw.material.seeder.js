import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { RawMaterial } from './models/rawMaterial.model.js';
import { Outlet } from './models/outlet.model.js';

dotenv.config();

// Koneksi ke database MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const seedRawMaterials = async () => {
    try {
        // Hapus semua data RawMaterial yang ada sebelumnya
        await RawMaterial.deleteMany();

        // Ambil semua outlet yang tersedia
        const outlets = await Outlet.find();

        if (outlets.length === 0) throw new Error('Outlet tidak ditemukan, buat outlet terlebih dahulu');

        // Data RawMaterial yang akan dimasukkan
        const rawMaterials = [
            {
                name: 'Tepung Terigu',
                category: 'Bahan Pokok',
                quantity: 50,
                unit: 'kg',
                minimumStock: 10,
                maximumStock: 100,
                costPerUnit: 8000,
                supplier: 'PT Sumber Jaya',
                expiryDate: new Date('2025-12-31'),
                availableAt: [outlets[0]._id], // Outlet pertama
            },
            {
                name: 'Gula Pasir',
                category: 'Bahan Pokok',
                quantity: 20,
                unit: 'kg',
                minimumStock: 5,
                maximumStock: 50,
                costPerUnit: 12000,
                supplier: 'PT Manis Sejahtera',
                expiryDate: new Date('2025-06-30'),
                availableAt: [outlets[0]._id, outlets[1]?._id].filter(Boolean), // Outlet pertama & kedua jika ada
            },
            {
                name: 'Susu Cair',
                category: 'Bahan Cair',
                quantity: 30,
                unit: 'liter',
                minimumStock: 5,
                maximumStock: 40,
                costPerUnit: 15000,
                supplier: 'Dairy Farm Indonesia',
                expiryDate: new Date('2024-10-15'),
                availableAt: [outlets[1]?._id].filter(Boolean), // Outlet kedua jika ada
            },
            {
                name: 'Mentega',
                category: 'Bahan Tambahan',
                quantity: 15,
                unit: 'kg',
                minimumStock: 3,
                maximumStock: 30,
                costPerUnit: 25000,
                supplier: 'PT Butter Lestari',
                expiryDate: new Date('2024-12-01'),
                availableAt: [outlets[0]._id, outlets[1]?._id, outlets[2]?._id].filter(Boolean),
            },
        ];

        // Simpan data ke database
        await RawMaterial.insertMany(rawMaterials);

        console.log('Seeder RawMaterial berhasil dijalankan!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Seeder gagal:', error);
        mongoose.connection.close();
    }
};

// Jalankan seeder
seedRawMaterials();
