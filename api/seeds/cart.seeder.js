import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Cart } from './models/cart.model.js';
import { User } from './models/user.model.js';
import { MenuItem } from './models/menuItem.model.js';
import { AddOn } from './models/addOn.model.js';
import { Topping } from './models/topping.model.js';
import { Voucher } from './models/voucher.model.js';

dotenv.config();

// Koneksi ke database MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const seedCart = async () => {
    try {
        // Hapus semua data cart yang ada sebelumnya
        await Cart.deleteMany();

        // Ambil satu pengguna sebagai contoh
        const user = await User.findOne();
        if (!user) throw new Error('User tidak ditemukan');

        // Ambil beberapa menu item sebagai contoh
        const menuItems = await MenuItem.find().limit(2);
        if (menuItems.length === 0) throw new Error('MenuItem tidak ditemukan');

        // Ambil beberapa addons & toppings sebagai contoh
        const addons = await AddOn.find().limit(2);
        const toppings = await Topping.find().limit(2);
        const voucher = await Voucher.findOne(); // Ambil satu voucher jika ada

        // Data Cart yang akan dimasukkan
        const cartData = {
            user: user._id,
            items: [
                {
                    menuItem: menuItems[0]._id,
                    addons: addons.length ? [addons[0]._id] : [],
                    toppings: toppings.length ? [toppings[0]._id] : [],
                    quantity: 2,
                    subtotal: 50000,
                },
                {
                    menuItem: menuItems[1]._id,
                    addons: addons.length > 1 ? [addons[1]._id] : [],
                    toppings: toppings.length > 1 ? [toppings[1]._id] : [],
                    quantity: 1,
                    subtotal: 30000,
                },
            ],
            voucher: voucher ? voucher._id : null,
        };

        // Simpan cart ke database
        await Cart.create(cartData);

        console.log('Seeder cart berhasil dijalankan!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Seeder gagal:', error);
        mongoose.connection.close();
    }
};

// Jalankan seeder
seedCart();
