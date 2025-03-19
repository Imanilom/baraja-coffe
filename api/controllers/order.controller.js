import { Order } from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';
import { MenuItem } from "../models/MenuItem.model.js";
import { RawMaterial } from "../models/RawMaterial.model.js";
<<<<<<< Updated upstream
import {snap, coreApi } from '../utils/MidtransConfig.js';
import mongoose from 'mongoose';

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
=======
import midtransClient from 'midtrans-client';
import mongoose from 'mongoose';


export const getOrderAll = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(
      {
        success: true, data: orders
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
// Helper function to update raw material storage
const updateStorage = async (materialId, quantity) => {
  const storage = await RawMaterial.findOne({ materialId });
  if (!storage) {
    throw new Error(`Raw material not found: ${materialId}`);
  }

  if (quantity > 0 && storage.quantity < quantity) {
    throw new Error(`Insufficient stock for ${storage.name || materialId}`);
  }

  storage.quantity -= quantity;
  await storage.save();
};

// Midtrans Configuration
const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'sandbox',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// // Stock Validation Logic
const validateStock = async (items) => {
  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItem).populate('rawMaterials');
    if (!menuItem) throw new Error(`Menu item not found: ${item.menuItem}`);

    // Validate main ingredients
    for (const material of menuItem.rawMaterials) {

      const required = material.quantity * item.quantity;
      const stock = await RawMaterial.findOne({ _id: material.materialId });

      if (!stock || stock.quantity < required) {
        throw new Error(`Insufficient ${stock?.name || material.materialId}`);
      }
    }

    // Validate toppings
    for (const toppingId of item.toppings) {
      const topping = await Topping.findById(toppingId).populate('rawMaterials');
      if (!topping) throw new Error(`Topping not found: ${toppingId}`);

      for (const material of topping.rawMaterials) {
        const required = material.quantityRequired * item.quantity;
        const stock = await RawMaterial.findOne({ _id: material.materialId });
        if (!stock || stock.quantity < required) {
          throw new Error(`Insufficient ${stock?.name || material.materialId}`);
        }
      }
    }

    // Validate addons
    for (const addonId of item.addons) {
      const addon = await AddOn.findById(addonId);
      if (addon?.adjustCupSize) {
        const cupsNeeded = addon.adjustCupSize === 'large' ? 1 : 0.5;
        const cupStock = await RawMaterial.findOne({ name: 'Cup' });
        if (!cupStock || cupStock.quantity < cupsNeeded * item.quantity) {
          throw new Error('Insufficient cups');
        }
      }
    }
  }
};

// const validateStock = async (items) => {
//   for (const item of items) {
//     const menuItem = await MenuItem.findById(item.menuItem).populate('rawMaterials');
//     if (!menuItem) throw new Error(`Menu item not found: ${item.menuItem}`);
//     // console.log(menuItem.rawMaterials);

//     // Validate main ingredients
//     for (const material of menuItem.rawMaterials) {
//       const required = material.quantityRequired * item.quantity;  // Adjusted 'quantity' to 'quantityRequired' if needed
//       const stock = await RawMaterial.findById(material.materialId);
//       if (!stock || stock.quantity < required) {
//         throw new Error(`Insufficient ${stock?.name || material.materialId}`);
//       }
//     }

//     // Validate toppings
//     for (const toppingId of item.toppings) {
//       if (!toppingId) continue;  // Skip empty topping IDs
//       const topping = await Topping.findById(toppingId).populate('rawMaterials');
//       if (!topping) throw new Error(`Topping not found: ${toppingId}`);

//       for (const material of topping.rawMaterials) {
//         const required = material.quantityRequired * item.quantity;
//         const stock = await RawMaterial.findOne({ materialId: material.materialId });
//         if (!stock || stock.quantity < required) {
//           throw new Error(`Insufficient ${stock?.name || material.materialId}`);
//         }
//       }
//     }

//     // Validate addons
//     for (const addonId of item.addons) {
//       if (!addonId) continue;  // Skip empty addon IDs
//       const addon = await AddOn.findById(addonId);
//       if (addon?.adjustCupSize) {
//         const cupsNeeded = addon.adjustCupSize === 'large' ? 1 : 0.5;
//         const cupStock = await RawMaterial.findOne({ name: 'Cup' });
//         if (!cupStock || cupStock.quantity < cupsNeeded * item.quantity) {
//           throw new Error('Insufficient cups');
//         }
//       }
//     }
//   }
// };


// Process Order Items (Deduct Stock)
const processOrderItems = async (items) => {
  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItem).populate('rawMaterials');

    // Process main ingredients
    for (const material of menuItem.rawMaterials) {
      await updateStorage(material.materialId, material.quantity * item.quantity);
    }

    // Process toppings
    for (const toppingId of item.toppings) {
      const topping = await Topping.findById(toppingId).populate('rawMaterials');
      for (const material of topping.rawMaterials) {
        await updateStorage(material.materialId, material.quantityRequired * item.quantity);
      }
    }

    // Process addons
    for (const addonId of item.addons) {
      const addon = await AddOn.findById(addonId);
      if (addon?.adjustCupSize) {
        const cupsNeeded = addon.adjustCupSize === 'large' ? 1 : 0.5;
        const cupMaterial = await RawMaterial.findOne({ name: 'Cup' });
        cupMaterial.quantity -= cupsNeeded * item.quantity;
        await cupMaterial.save();
      }
    }
  }
};

// Cancel Order Controller
export const cancelOrder = async (req, res) => {
>>>>>>> Stashed changes
  try {
    const orderData = req.body.order;
    const { userId, user, cashier, items, paymentMethod, orderType, outlet, deliveryAddress, tableNumber, type, voucher } = orderData;

    // Validasi dasar
    if (!items || items.length === 0) {
      throw new Error("Order items cannot be empty");
    }

    // Hitung total harga dan validasi item
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem).session(session);
      if (!menuItem) {
        throw new Error(`Menu item ${item.menuItem} not found`);
      }

      orderItems.push({
        menuItem: item.menuItem,
        toppings: item.toppings || [],
        quantity: item.quantity,
        subtotal,
        isPrinted: false,
      });

<<<<<<< Updated upstream
      totalPrice += subtotal;
    }

    // Pastikan gross_amount adalah integer
    totalPrice = Math.round(totalPrice);

    // Buat order
=======
    // for (let item of items) {
    //   // Proses addons untuk setiap item
    //   for (let addon of item.addons) {
    //     // Proses setiap opsi di dalam addon
    //     const addonDetail = await AddOn.findById(addon._id);
    //     if (addonDetail) {
    //       // Ganti _id dengan data terkait secara langsung, seperti name dan price
    //       addon.name = addonDetail.name; // Menambahkan nama addon
    //       addon.type = addonDetail.type; // Menambahkan type addon
    //       delete addon._id; // Hapus _id setelah menambahkan name
    //     } else {
    //       addon.name = 'Addon not found'; // Jika addon tidak ditemukan
    //     }
    //     // Proses setiap opsi di dalam addon
    //     for (let option of addon.option) {
    //       // Di sini kita cek apakah _id dari option sesuai dengan yang ada di request
    //       const matchingOption = addonDetail.options.find(opt => opt._id.toString() === option._id.toString());
    //       if (matchingOption) {
    //         // Update option dengan label dan price
    //         option.label = matchingOption.label || 'Option not found';
    //         option.price = matchingOption.price || 0;
    //       } else {
    //         // Jika option tidak ditemukan dalam addonDetail.options
    //         option.label = 'Option not found';
    //         option.price = 0;
    //       }
    //     }
    //   }

    //   // Proses toppings untuk setiap item
    //   for (let topping of item.toppings) {
    //     const toppingDetail = await Topping.findById(topping._id);
    //     if (toppingDetail) {
    //       // Menyalin semua properti dari toppingDetail ke objek topping
    //       Object.assign(topping, toppingDetail.toObject());
    //     } else {
    //       // Jika topping tidak ditemukan, beri nilai default
    //       topping.name = 'Topping not found';
    //       topping.price = 0;
    //       // Anda bisa mengisi properti lainnya sesuai kebutuhan jika topping tidak ditemukan.
    //     }
    //   }
    // }

    // Response dengan data yang sudah diproses
    // const responseBody = {
    //   customerId,
    //   customer,
    //   cashier,
    //   items,
    //   totalPrice,
    //   orderType,
    //   deliveryAddress,
    //   tableNumber,
    //   paymentMethod,
    //   phoneNumber
    // };

    // res.json(responseBody);

    // Membuat ObjectId untuk setiap elemen yang diperlukan dan memastikan validitas ID
    const updatedItems = await Promise.all(items.map(async (item) => {
      // Handle menuItem dan addons
      const updatedAddons = await Promise.all(item.addons?.map(async (addon) => {
        const addonDetails = await AddOn.findById(addon._id);  // Ambil informasi addon berdasarkan _id
        console.log(addon._id);
        const updatedOptions = addon.option?.map(option => ({
          _id: new mongoose.Types.ObjectId(option._id), // Pastikan optionId adalah ObjectId
          label: option.label,
          price: option.price
        })) || [];

        return {
          addonId: addonDetails._id,
          options: updatedOptions
        };
      }) || []);

      // Handle toppings
      const updatedToppings = item.toppings?.map(topping => new mongoose.Types.ObjectId(topping._id)) || [];

      return {
        ...item,
        menuItem: new mongoose.Types.ObjectId(item.menuItem), // Pastikan menuItem adalah ObjectId
        addons: updatedAddons,
        toppings: updatedToppings
      };
    }));

    // Create order record
>>>>>>> Stashed changes
    const order = new Order({
      userId,
      user,
      cashier,
<<<<<<< Updated upstream
      items: orderItems,
=======
      items: updatedItems,
>>>>>>> Stashed changes
      totalPrice,
      paymentMethod,
      orderType,
      outlet,
      deliveryAddress: orderType === 'Delivery' ? deliveryAddress : undefined,
      tableNumber: orderType === 'Dine-In' ? tableNumber : undefined,
      type: orderType === 'Dine-In' ? type : undefined,
      voucher: voucher || undefined,
      status: "Pending",
    });
<<<<<<< Updated upstream
=======
    // await order.save();
>>>>>>> Stashed changes

    await order.save({ session });

    // Proses pembayaran
    let paymentResponse = {};
    let payment;
    
    if (paymentMethod === "Cash") {
      payment = new Payment({
        order: order._id,
        amount: totalPrice,
        paymentMethod,
        status: "Pending",
      });
<<<<<<< Updated upstream
      await payment.save({ session });
      paymentResponse = { cashPayment: "Pending confirmation" };
    } else {

      // Parameter transaksi
      const parameter = {
        transaction_details: {
          order_id: order._id.toString(),
          gross_amount: totalPrice,
        },
        customer_details: {
          first_name: user.name || 'Customer',
          email: user.email || 'customer@example.com',
        }
=======
      // await payment.save();

      return res.status(200).json({
        order,
        payment,
        message: 'Cash payment pending confirmation'
      });
    }

    // Midtrans payment processing
    const transactionDetails = {
      order_id: `ORDER-${order._id}-${Date.now()}`,
      gross_amount: totalPrice
    };

    const customerDetails = {
      first_name: user.name.split(' ')[0],
      last_name: user.name.split(' ')[1] || '',
      email: user.email,
      phone: phoneNumber || user.phone
    };

    const params = {
      transaction_details: transactionDetails,
      customer_details: customerDetails,
    };

    // Payment method specific config
    switch (paymentMethod.toLowerCase()) {
      case 'ovo':
        if (!phoneNumber) throw new Error('Phone number required for OVO');
        params.payment_type = 'ewallet';
        params.ewallet = { channel: 'ovo', mobile: phoneNumber };
        break;

      case 'gopay':
        params.payment_type = 'gopay';
        break;

      case 'shopeepay':
        params.payment_type = 'shopeepay';
        break;

      case 'qris':
        params.payment_type = 'qris';
        params.qris = { acquirer: 'gopay' };
        break;

      default:
        throw new Error('Unsupported payment method');
    }

    // Create Midtrans transaction
    const paymentResult = await snap.createTransaction(params);

    // Save payment record
    const payment = new Payment({
      order: order._id,
      amount: totalPrice,
      paymentMethod,
      status: 'Pending',
      midtransResponse: paymentResult
    });
    // await payment.save();

    // Prepare response
    const response = {
      order,
      payment,
      paymentDetails: {
        method: paymentMethod,
        transactionId: paymentResult.transaction_id,
        status: 'Pending'
      }
    };

    // Add payment specific details
    if (paymentMethod.toLowerCase() === 'qris') {
      response.paymentDetails.qrCode = {
        url: paymentResult.actions.find(a => a.name === 'qr-code')?.url,
        raw: paymentResult.qr_string
>>>>>>> Stashed changes
      };

      // Tentukan payment type
      switch(paymentMethod.toLowerCase()) {
        case 'qris':
          parameter.payment_type = 'qris';
          break;
        case 'gopay':
          parameter.payment_type = 'gopay';
          parameter.gopay = {
            enable_callback: true,
            callback_url: 'yourapp://callback'
          };
          break;
        case 'credit_card':
          parameter.payment_type = 'credit_card';
          parameter.credit_card = {
            secure: true
          };
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      // Create Midtrans transaction
      const midtransResponse = await coreApi.charge(parameter);

      // Simpan detail pembayaran
      payment = new Payment({
        order: order._id,
        amount: totalPrice,
        paymentMethod,
        status: "Pending",
        paymentDate: new Date(),
        transactionId: midtransResponse.transaction_id,
        paymentDetails: midtransResponse,
      });
      
      await payment.save({ session });
      paymentResponse = midtransResponse;
    }

    // Update stok bahan baku
    await updateStock(order, session);

    await session.commitTransaction();
    res.status(201).json({ 
      success: true,
      order: order.toJSON(),
      payment: paymentResponse 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Order Error:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};


async function updateStock(order, session) {
  if (!Array.isArray(order.items)) {
    throw new Error("Order items must be an array");
  }

  for (const item of order.items) {
    const menuItem = await MenuItem.findById(item.menuItem).session(session);
    if (!menuItem) {
      throw new Error(`Menu item ${item.menuItem} not found`);
    }

    // Update stok bahan baku untuk menu item
    for (const material of menuItem.rawMaterials) {
      await mongoose.model("RawMaterial").updateOne(
        { _id: material.materialId },
        { $inc: { quantity: -material.quantityRequired * item.quantity } },
        { session }
      );
    }
  }
}

export const handleMidtransNotification = async (req, res) => {
  try {
    const { order_id, transaction_status } = req.body;
    
    const payment = await Payment.findOne({ order: order_id });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    payment.status = transaction_status === 'settlement' ? 'Success' : 'Failed';
    await payment.save();
    
    res.status(200).json({ message: 'Payment status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get User Orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};


// Get History User orders
export const getUserOrderHistory = async (req, res) => {
  try {
      const userId = req.params.userId; // Mengambil ID user dari parameter URL
      if (!userId) {
          return res.status(400).json({ message: 'User ID is required.' });
      }

      // Mencari semua pesanan dengan field "user" yang sesuai dengan ID user
      const orders = await Order.find({ customerId: userId })
          .populate('items.menuItem') // Mengisi detail menu item (opsional)
          .populate('voucher'); // Mengisi detail voucher (opsional)

      if (!orders || orders.length === 0) {
          return res.status(404).json({ message: 'No order history found for this user.' });
      }

      res.status(200).json({ orders });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get Cashier Order History
export const getCashierOrderHistory = async (req, res) => {
  try {
      const cashierId = req.params.cashierId; // Mengambil ID kasir dari parameter URL
      if (!cashierId) {
          return res.status(400).json({ message: 'Cashier ID is required.' });
      }

      // Mencari semua pesanan dengan field "cashier" yang sesuai dengan ID kasir
      const orders = await Order.find({ cashier: cashierId })
          .populate('items.menuItem') // Mengisi detail menu item (opsional)
          .populate('voucher'); // Mengisi detail voucher (opsional)

      if (!orders || orders.length === 0) {
          return res.status(404).json({ message: 'No order history found for this cashier.' });
      }

      res.status(200).json({ orders });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error.' });
  }
};