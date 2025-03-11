import { Order } from "../models/Order.model.js";
// const escpos = require('escpos');


// const printerMakanan = new escpos.Printer(deviceMakanan);
// const printerMinuman = new escpos.Printer(deviceMinuman);
// Fungsi untuk menyiapkan struk minuman (Bar)
const generateBarBill = (items) => {
    let billForBar = "";

    items.forEach(item => {
        const data = item.menuItem;
        const { subtotal, ...rest } = item;

        if (data.category === 'drink') {
            let itemDetails = `Nama Minuman: ${item.menuItem.name}\n`;
            itemDetails += `Jumlah: ${item.quantity}\n`;

            // Menambahkan addon untuk minuman
            if (item.addons && item.addons.length > 0) {
                itemDetails += "Addons:\n";
                item.addons.forEach(addon => {
                    const selectedOption = addon.options
                        ? addon.options.find(option => option._id.toString() === "67c7c48f67e7d718660a0779")
                        : null;
                    itemDetails += `  - ${addon.name}: ${selectedOption ? selectedOption.label : 'Tidak ada pilihan'}\n`;
                });
            }

            // Menambahkan topping untuk minuman
            if (item.toppings && item.toppings.length > 0) {
                itemDetails += "Toppings:\n";
                item.toppings.forEach(topping => {
                    itemDetails += `  - ${topping}\n`;
                });
            }

            // Menambahkan subtotal untuk minuman
            // itemDetails += `Subtotal: ${subtotal ? subtotal : 'N/A'}\n`;
            billForBar += itemDetails + "\n-----------------------\n";
        }
    });

    return billForBar;
};

// Fungsi untuk menyiapkan struk makanan (Kitchen)
const generateKitchenBill = (items) => {
    let billForKitchen = "";

    items.forEach(item => {
        const data = item.menuItem;
        const { subtotal, ...rest } = item;

        if (data.category === 'food') {
            let itemDetails = `Nama Makanan: ${item.menuItem.name}\n`;
            itemDetails += `Jumlah: ${item.quantity}\n`;

            // Menambahkan addon untuk makanan
            if (item.addons && item.addons.length > 0) {
                itemDetails += "Addons:\n";
                item.addons.forEach(addon => {
                    const selectedOption = addon.options
                        ? addon.options.find(option => option._id.toString() === "67c7c48f67e7d718660a0779")
                        : null;
                    itemDetails += `  - ${addon.name}: ${selectedOption ? selectedOption.label : 'Tidak ada pilihan'}\n`;
                });
            }

            // Menambahkan topping untuk makanan
            if (item.toppings && item.toppings.length > 0) {
                itemDetails += "Toppings:\n";
                item.toppings.forEach(topping => {
                    itemDetails += `  - ${topping}\n`;
                });
            }

            // Menambahkan subtotal untuk makanan
            // itemDetails += `Subtotal: ${subtotal ? subtotal : 'N/A'}\n`;
            billForKitchen += itemDetails + "\n-----------------------\n";
        }
    });

    return billForKitchen;
};

// Fungsi utama untuk memproses order dan menghasilkan struk
export const generateBill = async (req, res) => {
    try {
        // Ambil order dari database
        const order = await Order.findById('67c9285e9d3b8ce60dfaabfa')
            .populate('items.menuItem')
            .populate('items.addons')
            .lean();

        if (!order) {
            return res.status(404).send('Tidak ada item dalam order');
        }

        // Pisahkan struk berdasarkan kategori (minuman dan makanan)
        const billForBar = generateBarBill(order.items);
        const billForKitchen = generateKitchenBill(order.items);

        // Kirimkan struk ke Bar dan Kitchen
        if (billForBar) {
            // Simulasikan pengiriman struk ke Bar
            console.log("Struk untuk Bar:\n", billForBar);
        }

        if (billForKitchen) {
            // Simulasikan pengiriman struk ke Kitchen
            console.log("Struk untuk Kitchen:\n", billForKitchen);
        }

        // Kirim respons
        res.status(200).send({
            success: true,
            message: 'Struk berhasil dihasilkan untuk Bar dan Kitchen.',
            barBill: billForBar,
            kitchenBill: billForKitchen
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan saat mencetak struk');
    }
};



// export const billBar = async (req, res) => {
//     try {
//         // Ambil order dari database
//         const orderDrink = await Order.findById('67c9285e9d3b8ce60dfaabfa')
//             .populate('items.menuItem')
//             .populate('items.addons')
//             .lean();

//         if (!orderDrink) {
//             return res.status(404).send('Tidak ada minuman dalam order');
//         }

//         let drinkExists = false;
//         let billDetails = "";

//         // Proses items untuk menampilkan struk
//         orderDrink.items = orderDrink.items.map(item => {
//             const data = item.menuItem;
//             const { subtotal, ...rest } = item;  // Menghapus 'subtotal' dan mengambil sisanya

//             if (data.category === 'drink') {
//                 drinkExists = true; // Tandai ada minuman

//                 // Menyiapkan format struk untuk item minuman
//                 let itemDetails = `\nNama Minuman: ${item.menuItem.name}\n`;
//                 itemDetails += `Jumlah: ${item.quantity}\n`;

//                 // Menambahkan addon
//                 if (item.addons && item.addons.length > 0) {
//                     itemDetails += "Addons:\n";
//                     item.addons.forEach(addon => {
//                         const selectedOption = addon.options
//                             ? addon.options.find(option => option._id.toString() === "67c7c48f67e7d718660a0779")
//                             : null;
//                         itemDetails += `  - ${addon.name}: ${selectedOption ? selectedOption.label : 'Tidak ada pilihan'}\n`;
//                     });
//                 }

//                 // Menambahkan topping
//                 if (item.toppings && item.toppings.length > 0) {
//                     itemDetails += "Toppings:\n";
//                     item.toppings.forEach(topping => {
//                         itemDetails += `  - ${topping}\n`;
//                     });
//                 }

//                 // Menambahkan subtotal
//                 // itemDetails += `Subtotal: ${subtotal ? subtotal : 'N/A'}\n`;
//                 billDetails += itemDetails + "\n-----------------------\n";
//             }

//             return rest;
//         });

//         if (!drinkExists) {
//             // Jika tidak ada kategori minuman dalam order
//             return res.status(404).send('Tidak ada minuman dalam order');
//         }

//         // Kirimkan struk dalam format teks
//         res.status(200).send(`Struk Order Minuman:\n${billDetails}`);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Terjadi kesalahan saat mencetak struk minuman');
//     }
// };

// export const billKitchen = async (req, res) => {
//     try {
//         // Ambil order dari database
//         const orderFood = await Order.findById('67c9285e9d3b8ce60dfaabfa')
//             .populate('items.menuItem')
//             .populate('items.addons')
//             .lean();

//         if (!orderFood) {
//             return res.status(404).send('Tidak ada minuman dalam order');
//         }

//         let foodExists = false;
//         let billDetails = "";

//         // Proses items untuk menampilkan struk
//         orderFood.items = orderFood.items.map(item => {
//             const data = item.menuItem;
//             const { subtotal, ...rest } = item;  // Menghapus 'subtotal' dan mengambil sisanya

//             if (data.category === 'food') {
//                 foodExists = true; // Tandai ada minuman

//                 // Menyiapkan format struk untuk item minuman
//                 let itemDetails = `\nNama Minuman: ${item.menuItem.name}\n`;
//                 itemDetails += `Jumlah: ${item.quantity}\n`;

//                 // Menambahkan addon
//                 if (item.addons && item.addons.length > 0) {
//                     itemDetails += "Addons:\n";
//                     item.addons.forEach(addon => {
//                         const selectedOption = addon.options
//                             ? addon.options.find(option => option._id.toString() === "67c7c48f67e7d718660a0779")
//                             : null;
//                         itemDetails += `  - ${addon.name}: ${selectedOption ? selectedOption.label : 'Tidak ada pilihan'}\n`;
//                     });
//                 }

//                 // Menambahkan topping
//                 if (item.toppings && item.toppings.length > 0) {
//                     itemDetails += "Toppings:\n";
//                     item.toppings.forEach(topping => {
//                         itemDetails += `  - ${topping}\n`;
//                     });
//                 }

//                 // Menambahkan subtotal
//                 // itemDetails += `Subtotal: ${subtotal ? subtotal : 'N/A'}\n`;
//                 billDetails += itemDetails + "\n-----------------------\n";
//             }

//             return rest;
//         });

//         if (!foodExists) {
//             // Jika tidak ada kategori minuman dalam order
//             return res.status(404).send('Tidak ada minuman dalam order');
//         }

//         // Kirimkan struk dalam format teks
//         res.status(200).send(`Struk Order Minuman:\n${billDetails}`);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Terjadi kesalahan saat mencetak struk minuman');
//     }
// };