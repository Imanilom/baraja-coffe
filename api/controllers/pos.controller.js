import { Order } from "../models/Order.model.js";


export const billBar = async (req, res) => {
    try {
        // Ambil order dari database
        const orderDrink = await Order.findById("67c9285e9d3b8ce60dfaabfa")
            .populate('items.menuItem')
            .populate({
                path: 'items.addons', // Memastikan addons dipopulate
                populate: {
                    path: 'options' // Pastikan field options juga dipopulate jika ada
                }

            })
            .lean();

        if (!orderDrink) {
            return res.status(404).send('Tidak ada minuman dalam order');
        }

        // Memfilter item yang memiliki kategori 'drink' dan memprosesnya
        const drinkItems = orderDrink.items.filter(item => item.menuItem.category === 'drink');

        // Jika tidak ada item kategori 'drink', kirimkan pesan tidak ada data makanan
        if (drinkItems.length === 0) {
            return res.status(404).send('Tidak ada data makanan');
        }

        // Proses data untuk item kategori 'drink' (filter addons dan options)
        orderDrink.items = drinkItems.map(item => {
            // Filter addons dengan ID tertentu
            item.addons = item.addons.filter(addon => addon._id.toString() === '67c7c48f67e7d718660a0777');

            // Di dalam addons yang telah difilter, kita pastikan hanya menampilkan option dengan ID yang dipilih
            item.addons = item.addons.map(addon => {
                addon.options = addon.options.filter(option => option._id.toString() === '67c7c48f67e7d718660a0779');
                return addon;
            });

            return item;
        });

        res.status(200).json(orderDrink);
    } catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan saat mencetak struk minuman');
    }
};

export const billKitchen = async (req, res) => {
    try {
        // Ambil order dari database
        const orderFood = await Order.findById('67c9285e9d3b8ce60dfaabfa')
            .populate('items.menuItem')
            .populate('items.addons')
            .lean();

        if (!orderFood) {
            return res.status(404).send('Tidak ada minuman dalam order');
        }

        // Memfilter item yang memiliki kategori 'food' dan memprosesnya
        const foodItems = orderFood.items.filter(item => item.menuItem.category === 'food');

        // Jika tidak ada item kategori 'food', kirimkan pesan tidak ada data makanan
        if (foodItems.length === 0) {
            return res.status(404).send('Tidak ada data makanan');
        }

        // Proses data untuk item kategori 'food' (filter addons dan options)
        orderFood.items = foodItems.map(item => {
            // Filter addons dengan ID tertentu
            item.addons = item.addons.filter(addon => addon._id.toString() === '67c7c48f67e7d718660a0777');

            // Di dalam addons yang telah difilter, kita pastikan hanya menampilkan option dengan ID yang dipilih
            item.addons = item.addons.map(addon => {
                addon.options = addon.options.filter(option => option._id.toString() === '67c7c48f67e7d718660a0779');
                return addon;
            });

            return item;
        });

        res.status(200).json(orderFood);
    } catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan saat mencetak struk makanan');
    }
};