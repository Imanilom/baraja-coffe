import { Order } from "../models/Order.model.js";


export const billBar = async (req, res) => {
    try {
        const orderDrink = await Order.find({
            where: { category: 'drink' }
        });
        if (orderDrink.length === 0) {
            return res.status(404).send('Tidak ada minuman dalam order');
        }

        let billDrinks = '----- Struk Minuman -----\n';
        let totalDrinks = 0;

        orderDrink.forEach(item => {
            const subtotal = item.jumlah * item.harga;
            billDrinks += `${item.nama_item} x${item.jumlah} = ${subtotal}\n`;
            totalDrinks += subtotal;
        });

        billDrinks += `----------------------------\nTotal Minuman: ${totalDrinks}\n`;

        // Di sini Anda bisa menggunakan library `esc-pos` untuk mencetak ke printer
        // printer.text(billDrinks).cut().close();

        res.send(billDrinks); // Untuk testing response
        //   res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan saat mencetak struk minuman');
    }
};

export const billKitchen = async (req, res) => {
    try {
        const orderFood = await Order.find({
            where: { category: 'food' }
        });
        if (orderFood.length === 0) {
            return res.status(404).send('Tidak ada minuman dalam order');
        }

        let billFoods = '----- Struk Makanan -----\n';
        let totalDrinks = 0;

        orderFood.forEach(item => {
            const subtotal = item.jumlah * item.harga;
            billFoods += `${item.nama_item} x${item.jumlah} = ${subtotal}\n`;
            totalDrinks += subtotal;
        });

        billFoods += `----------------------------\nTotal Makanan: ${totalDrinks}\n`;

        // Di sini Anda bisa menggunakan library `esc-pos` untuk mencetak ke printer
        // printer.text(billFoods).cut().close();

        res.send(billFoods); // Untuk testing response
        //   res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan saat mencetak struk minuman');
    }
};