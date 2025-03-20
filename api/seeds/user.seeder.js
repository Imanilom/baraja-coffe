import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/user.model.js';
import { Outlet } from './models/outlet.model.js';

dotenv.config();

// Koneksi ke database MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const seedUsers = async () => {
    try {
        // Hapus semua data User yang ada sebelumnya
        await User.deleteMany();

        // Ambil satu outlet untuk dikaitkan dengan kasir/staff
        const outlet = await Outlet.findOne();
        if (!outlet) throw new Error('Outlet tidak ditemukan, buat outlet terlebih dahulu');

        // Data User yang akan dimasukkan
        const users = [
            {
                username: 'Admin Utama',
                email: 'admin@example.com',
                phone: '081234567890',
                password: bcrypt.hashSync('admin123', 10),
                role: 'admin',
                outlet: [],
            },
            {
                username: 'Kasir Senior',
                email: 'kasirsenior@example.com',
                phone: '081298765432',
                password: bcrypt.hashSync('kasir123', 10),
                role: 'cashier senior',
                cashierType: 'bar-1-amphi',
                outlet: [{ outletId: outlet._id }],
            },
            {
                username: 'Kasir Junior',
                email: 'kasirjunior@example.com',
                phone: '081245678901',
                password: bcrypt.hashSync('kasir123', 10),
                role: 'cashier junior',
                cashierType: 'bar-tp',
                outlet: [{ outletId: outlet._id }],
            },
            {
                username: 'Customer Biasa',
                email: 'customer@example.com',
                phone: '081234123456',
                password: bcrypt.hashSync('customer123', 10),
                role: 'customer',
                outlet: [],
            },
        ];

        // Simpan data ke database
        await User.insertMany(users);

        console.log('Seeder User berhasil dijalankan!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Seeder gagal:', error);
        mongoose.connection.close();
    }
};

// Jalankan seeder
seedUsers();
