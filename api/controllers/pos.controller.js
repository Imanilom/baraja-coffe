import { Order } from "../models/order.model.js";
import Printer from "node-thermal-printer";
import { MenuItem } from "../models/MenuItem.model.js";

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


const createPrinter = (interfacePath) =>
  new Printer.printer({
    type: Printer.types.EPSON,
    interface: interfacePath,
    characterSet: "SLOVENIA",
    removeSpecialCharacters: false,
    lineCharacter: "-",
    options: { timeout: 5000 },
  });

export const acceptOrderAndPrint = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) return res.status(400).send("ID pesanan diperlukan");

    const order = await Order.findById(orderId)
      .populate("items.menuItem")
      .populate("cashier")
      .lean();

    if (!order) return res.status(404).send("Pesanan tidak ditemukan");

    // Ambil hanya item yang belum dicetak
    const unprintedItems = order.items.filter(item => !item.isPrinted);

    if (unprintedItems.length === 0) {
      return res.status(200).send("Tidak ada item baru untuk dicetak");
    }

    const foodItems = unprintedItems.filter(item =>
      item.menuItem.category.includes("food")
    );
    const drinkItems = unprintedItems.filter(item =>
      item.menuItem.category.includes("drink")
    );

    const printHeader = (printer, title) => {
      printer.alignCenter();
      printer.println(`=== ${title} ===`);
      printer.drawLine();
      printer.alignLeft();
      printer.println(`Order ID  : ${order._id}`);
      printer.println(`Kasir     : ${order.cashier.name || "Kasir"}`);
      printer.println(`Customer  : ${order.user}`);
      printer.println(`Tipe Order: ${order.orderType}`);
      printer.println(`Waktu     : ${new Date(order.createdAt).toLocaleString()}`);
      printer.drawLine();
    };

    const printItems = (printer, items) => {
      items.forEach(item => {
        printer.println(`${item.menuItem.name} x${item.quantity}`);
        printer.println(`Subtotal: Rp${item.subtotal.toLocaleString()}`);
      });
    };

    const printFooter = (printer, items, isCustomer = false) => {
      if (isCustomer) {
        printer.drawLine();
        printer.println(
          `Total: Rp${items.reduce((sum, i) => sum + i.subtotal, 0).toLocaleString()}`
        );
        printer.drawLine();
        printer.println("Terima kasih!");
      }
      printer.cut();
    };

    const interfaceBar = "usb://bar-printer"; // printer minuman
    const interfaceKitchen = "usb://kitchen-printer"; // printer makanan
    const interfaceCashier = "usb://cashier-printer"; // printer kasir

    // =======================
    // 🔹 CETAK BAR (Minuman)
    // =======================
    if (drinkItems.length > 0) {
      const printerBar = createPrinter(interfaceBar);
      if (await printerBar.isPrinterConnected()) {
        printHeader(printerBar, "BAR - MINUMAN");
        printItems(printerBar, drinkItems);
        printFooter(printerBar, drinkItems);
        await printerBar.execute();
      } else {
        console.warn("Printer BAR tidak terhubung");
      }
    }

    // ===========================
    // 🔹 CETAK KITCHEN (Makanan)
    // ===========================
    if (foodItems.length > 0) {
      const printerKitchen = createPrinter(interfaceKitchen);
      if (await printerKitchen.isPrinterConnected()) {
        printHeader(printerKitchen, "DAPUR - MAKANAN");
        printItems(printerKitchen, foodItems);
        printFooter(printerKitchen, foodItems);
        await printerKitchen.execute();
      } else {
        console.warn("Printer DAPUR tidak terhubung");
      }
    }

    // ===========================
    // 🔹 CETAK KASIR (Struk lengkap)
    // ===========================
    const printerCashier = createPrinter(interfaceCashier);
    if (await printerCashier.isPrinterConnected()) {
      printHeader(printerCashier, "STRUK CUSTOMER");
      printItems(printerCashier, unprintedItems);
      printFooter(printerCashier, unprintedItems, true);
      await printerCashier.execute();
    } else {
      console.warn("Printer KASIR tidak terhubung");
    }

    // ===========================
    // 🔄 Update status item jadi sudah dicetak
    // ===========================
    await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          "items.$[elem].isPrinted": true
        }
      },
      {
        arrayFilters: [
          { "elem.isPrinted": false }
        ]
      }
    );

    // Ubah status jadi OnProcess
    await Order.findByIdAndUpdate(orderId, { status: "OnProcess" });

    return res.status(200).send("Struk berhasil dikirim dan status item diperbarui");

  } catch (error) {
    console.error("❌ Gagal mencetak:", error);
    return res.status(500).send("Terjadi kesalahan saat mencetak");
  }
};
