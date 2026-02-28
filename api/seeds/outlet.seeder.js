import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Outlet } from './models/outlet.model.js';
import { User } from './models/user.model.js';

dotenv.config();

// Koneksi ke database MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const seedOutlets = async () => {
    try {
        // Hapus semua data Outlet yang ada sebelumnya
        await Outlet.deleteMany();

        // Ambil satu admin sebagai contoh
        const admin = await User.findOne();
        if (!admin) throw new Error('Admin tidak ditemukan, buat admin terlebih dahulu');

        // Data Outlet yang akan dimasukkan
        const outletData = [
            {
                name: 'Outlet Jakarta',
                address: 'Jl. Sudirman No. 10',
                city: 'Jakarta',
                location: 'Jl. Sudirman No. 10, Jakarta',
                latitude: -6.200000,
                longitude: 106.816666,
                contactNumber: '081234567890',
                admin: admin._id,
                isActive: true,
                outletPictures: [
                    'https://placehold.co/1920x1080/png',
                    'https://example.com/outlet1.jpg',
                ],
            },
            {
                name: 'Outlet Bandung',
                address: 'Jl. Asia Afrika No. 15',
                city: 'Bandung',
                location: 'Jl. Asia Afrika No. 15, Bandung',
                latitude: -6.914744,
                longitude: 107.609810,
                contactNumber: '081298765432',
                admin: admin._id,
                isActive: true,
                outletPictures: [
                    'https://placehold.co/1920x1080/png',
                    'https://example.com/outlet2.jpg',
                ],
            },
        ];

        // Simpan data ke database
        await Outlet.insertMany(outletData);

        console.log('Seeder Outlet berhasil dijalankan!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Seeder gagal:', error);
        mongoose.connection.close();
    }
};

// Jalankan seeder
seedOutlets();
