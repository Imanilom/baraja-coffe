import Payment from '../models/Payment.model.js';
import { MenuItem } from "../models/MenuItem.model.js";
import { RawMaterial } from "../models/RawMaterial.model.js";
import { Order } from "../models/order.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import AutoPromo from '../models/AutoPromo.model.js';
import { snap, coreApi } from '../utils/MidtransConfig.js';
import mongoose from 'mongoose';
import axios from 'axios';


export const createAppOrder = async (req, res) => {
  try {
    const {
      items,
      orderType,
      tableNumber,
      deliveryAddress,
      pickupTime,
      paymentDetails,
      voucherCode,
      userId,
      userName,
      pricing,
      orderDate,
      status,
    } = req.body;
    console.log(pricing, orderDate, status);
    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }
    if (!orderType) {
      return res.status(400).json({ success: false, message: 'Order type is required' });
    }
    console.log('Payment method:', paymentDetails);
    if (!paymentDetails?.method) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Verify user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Format orderType
    let formattedOrderType = '';
    switch (orderType) {
      case 'dineIn':
        formattedOrderType = 'Dine-In';
        if (!tableNumber) {
          return res.status(400).json({ success: false, message: 'Table number is required for dine-in orders' });
        }
        break;
      case 'delivery':
        formattedOrderType = 'Delivery';
        if (!deliveryAddress) {
          return res.status(400).json({ success: false, message: 'Delivery address is required for delivery orders' });
        }
        break;
      case 'pickup':
        formattedOrderType = 'Pickup';
        if (!pickupTime) {
          return res.status(400).json({ success: false, message: 'Pickup time is required for pickup orders' });
        }
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid order type' });
    }

    // Find voucher if provided
    let voucherId = null;
    if (voucherCode) {
      const voucher = await Voucher.findOne({ code: voucherCode });
      if (voucher) {
        voucherId = voucher._id;
      }
    }

    // Process items
    const orderItems = [];
    console.log('Order items:', items);
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.productId);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item not found: ${item.productId}`
        });
      }

      const processedAddons = item.addons?.map(addon => ({
        name: addon.name,
        price: addon.price
      })) || [];

      const processedToppings = item.toppings?.map(topping => ({
        name: topping.name,
        price: topping.price
      })) || [];

      const addonsTotal = processedAddons.reduce((sum, addon) => sum + addon.price, 0);
      const toppingsTotal = processedToppings.reduce((sum, topping) => sum + topping.price, 0);
      const itemSubtotal = item.quantity * (menuItem.price + addonsTotal + toppingsTotal);

      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        addons: processedAddons,
        toppings: processedToppings,
        isPrinted: false,
      });
    }

    // Create new order
    const newOrder = new Order({
      user_id: userId,
      user: userName || userExists.name || 'Guest',
      cashier: null, // Default kosong, karena tidak ada input cashier di request
      items: orderItems,
      status: 'Pending',
      paymentMethod: paymentDetails.methode,
      orderType: formattedOrderType,
      deliveryAddress: deliveryAddress || '',
      tableNumber: tableNumber || '',
      type: 'Indoor', // default seperti di model
      voucher: voucherId,
      outlet: null, // default kosong, karena tidak ada input outlet di request
      promotions: [],
    });

    await newOrder.save();

    res.status(201).json({ success: true, message: 'Order created successfully', order: newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
  }
};


export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      userId,         // Diubah dari customerId menjadi userId
      customerName,   // Nama yang akan diubah menjadi user
      cashierId,
      phoneNumber,
      items,
      orderType,
      tableNumber,
      paymentMethod,
      totalPrice
    } = req.body;

    // Tentukan apakah order dilakukan melalui kasir atau aplikasi
    let finalUserId = null;
    let userName = "Guest";

    if (cashierId) {
      // Order dilakukan melalui kasir
      // Cari informasi kasir
      const cashier = await User.findById(cashierId).session(session);
      if (!cashier) {
        throw new Error("Kasir tidak ditemukan");
      }

      // Untuk order melalui kasir, gunakan nama pelanggan yang disediakan
      userName = customerName || "Guest";

      // Buat ID user jika tidak disediakan
      finalUserId = userId || `USER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Opsional: Simpan informasi dasar pelanggan jika Anda ingin melacak mereka
      if (phoneNumber) {
        // Di sini Anda bisa menyimpan informasi pelanggan ke koleksi terpisah jika diperlukan
        // Contoh: await CashierCustomer.findOneAndUpdate(
        //   { phoneNumber },
        //   { name: userName, phoneNumber },
        //   { upsert: true, new: true, session }
        // );
      }
    } else {
      // Order dilakukan melalui aplikasi - user seharusnya sudah ada
      if (!userId) {
        throw new Error("ID user diperlukan untuk order melalui aplikasi");
      }

      // Verifikasi user ada di database
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error("User tidak ditemukan");
      }

      finalUserId = userId;
      userName = user.name || "Pengguna Aplikasi";
    }

    // Validasi dasar
    if (!items || items.length === 0) {
      throw new Error("Item order tidak boleh kosong");
    }

    // Proses item order
    const orderItems = [];
    let calculatedTotalPrice = 0;

    for (const item of items) {
      // Ambil detail menu item
      const menuItem = await MenuItem.findById(item.id).session(session);
      if (!menuItem) {
        throw new Error(`Menu item ${item.id} tidak ditemukan`);
      }

      // Hitung harga item termasuk addons dan toppings
      let itemPrice = menuItem.price;
      let addons = [];
      let toppings = [];

      // Proses addon yang dipilih
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        for (const addon of item.selectedAddons) {
          const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
          if (!addonInfo) continue;

          // Proses opsi yang dipilih
          if (addon.options && addon.options.length > 0) {
            for (const option of addon.options) {
              const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
              if (optionInfo) {
                addons.push({
                  name: `${addonInfo.name}: ${optionInfo.name}`,
                  price: optionInfo.price || 0
                });
                itemPrice += optionInfo.price || 0;
              }
            }
          }
        }
      }

      // Proses topping yang dipilih
      if (item.selectedToppings && item.selectedToppings.length > 0) {
        for (const topping of item.selectedToppings) {
          const toppingInfo = menuItem.toppings.find(t => t._id.toString() === topping.id);
          if (toppingInfo) {
            toppings.push({
              name: toppingInfo.name,
              price: toppingInfo.price || 0
            });
            itemPrice += toppingInfo.price || 0;
          }
        }
      }

      // Hitung subtotal untuk item ini
      const subtotal = itemPrice * item.quantity;
      calculatedTotalPrice += subtotal;

      // Tambahkan ke item order
      orderItems.push({
        menuItem: item.id,
        quantity: item.quantity,
        subtotal,
        addons,
        toppings,
        isPrinted: false
      });
    }

    // Buat ID order unik
    // const order_id = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Buat dokumen order
    const order = new Order({
      // order_id,
      user: userName,                           // Sesuai dengan model, ini adalah nama user
      cashier: cashierId || null,               // ID kasir jika order melalui kasir
      items: orderItems,
      paymentMethod,
      orderType,
      tableNumber: orderType === 'Dine-In' ? tableNumber : null,
      type: orderType === 'Dine-In' ? 'Indoor' : null, // Default ke Indoor
      status: "Completed"
    });

    await order.save({ session });

    // Proses pembayaran
    let paymentResponse = {};
    let payment;


    if (paymentMethod === "Cash" || paymentMethod === "EDC") {
      payment = new Payment({
        order_id: order._id,
        amount: parseInt(totalPrice) || calculatedTotalPrice,
        method: paymentMethod,
        status: "Completed",
      });
      await payment.save({ session });
      paymentResponse = { cashPayment: "Menunggu konfirmasi" };
    } else {
      // Kode pemrosesan pembayaran yang ada
      // Parameter transaksi
      const parameter = {
        transaction_details: {
          order_id: order._id.toString(),
          gross_amount: parseInt(totalPrice) || calculatedTotalPrice,
        },
        customer_details: {
          first_name: userName || 'Customer',
          email: 'customer@example.com', // Tambahkan email jika tersedia
        }
      };

      // Tentukan payment type
      switch (paymentMethod.toLowerCase()) {
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
          throw new Error('Metode pembayaran tidak didukung');
      }

      // Buat transaksi Midtrans
      // Asumsikan coreApi telah diimpor dan dikonfigurasi sebelumnya
      const midtransResponse = await coreApi.charge(parameter);

      // Simpan detail pembayaran
      payment = new Payment({
        order: order._id,
        amount: parseInt(totalPrice) || calculatedTotalPrice,
        paymentMethod,
        status: "Pending",
        paymentDate: new Date(),
        transactionId: midtransResponse.transaction_id,
        paymentDetails: midtransResponse,
      });

      await payment.save({ session });
      paymentResponse = midtransResponse;
    }

    // Perbarui stok jika diperlukan
    // await updateStock(order, session);

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

export const charge = async (req, res) => {
  try {
    const { payment_type, transaction_details, bank_transfer } = req.body;
    const { order_id, gross_amount } = transaction_details;

    // Menyiapkan chargeParams dasar
    let chargeParams = {
      "payment_type": payment_type,
      "transaction_details": {
        "gross_amount": gross_amount,
        "order_id": order_id,
      },
    };

    // Kondisikan chargeParams berdasarkan payment_type
    if (payment_type === 'bank_transfer') {
      const { bank } = bank_transfer;
      chargeParams['bank_transfer'] = {
        "bank": bank
      };
    } else if (payment_type === 'gopay') {
      // Untuk Gopay, tidak perlu menambahkan 'bank_transfer'
      // Anda bisa menambahkan parameter lain jika diperlukan
      chargeParams['gopay'] = {
        // misalnya, menambahkan enable_callback untuk Gopay
        "enable_callback": true,
        "callback_url": "https://yourdomain.com/callback"
      };
    } else if (payment_type === 'qris') {
      // Untuk QRIS, juga bisa diatur di sini
      chargeParams['qris'] = {
        // misalnya parameter tambahan untuk QRIS
        "enable_callback": true,
        "callback_url": "https://yourdomain.com/callback"
      };
    }
    // Tambahkan kondisi lainnya sesuai dengan payment_type yang tersedia

    // Lakukan permintaan API untuk memproses pembayaran
    const response = await coreApi.charge(chargeParams);
    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      message: 'Payment failed',
      error: error.message || error
    });
  }
};


export const checkout = async (req, res) => {
  const { orders, user, cashier, outlet, table, paymentMethod, orderType, type, voucher } = req.body;

  try {
    const now = new Date();
    const orderItems = orders.map(order => {
      const basePrice = order.item.price || 0;
      const addons = order.item.addons || [];
      const toppings = order.item.toppings || [];

      const addonsTotal = addons.reduce((sum, a) => sum + (a.price || 0), 0);
      const toppingsTotal = toppings.reduce((sum, t) => sum + (t.price || 0), 0);
      const itemTotal = basePrice + addonsTotal + toppingsTotal;

      return {
        menuItem: order.item.id,
        quantity: 1,
        subtotal: itemTotal,
        addons,
        toppings,
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // AutoPromo
    const autoPromos = await AutoPromo.find({
      outlet: outlet,
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now }
    })
      .populate('conditions.buyProduct')
      .populate('conditions.getProduct')
      .populate('conditions.bundleProducts.product');

    let autoPromoDiscount = 0;
    let appliedPromos = [];

    for (const promo of autoPromos) {
      const itemsMap = {};
      for (const item of orderItems) {
        const id = item.menuItem.toString();
        itemsMap[id] = (itemsMap[id] || 0) + item.quantity;
      }

      let promoApplied = false;

      switch (promo.promoType) {
        case 'discount_on_quantity':
          for (const item of orderItems) {
            if (promo.conditions.minQuantity && itemsMap[item.menuItem.toString()] >= promo.conditions.minQuantity) {
              autoPromoDiscount += (item.subtotal * promo.discount) / 100;
              promoApplied = true;
            }
          }
          break;

        case 'discount_on_total':
          if (promo.conditions.minTotal && totalAmount >= promo.conditions.minTotal) {
            autoPromoDiscount += (totalAmount * promo.discount) / 100;
            promoApplied = true;
          }
          break;

        case 'buy_x_get_y':
          const buyId = promo.conditions.buyProduct?._id?.toString();
          const getId = promo.conditions.getProduct?._id?.toString();
          if (buyId && getId && itemsMap[buyId]) {
            const getItem = orderItems.find(i => i.menuItem.toString() === getId);
            if (getItem) {
              autoPromoDiscount += getItem.subtotal;
              promoApplied = true;
            }
          }
          break;

        case 'bundling':
          const bundleMatch = promo.conditions.bundleProducts.every(bundle => {
            return itemsMap[bundle.product._id.toString()] >= bundle.quantity;
          });
          if (bundleMatch) {
            const bundleValue = promo.conditions.bundleProducts.reduce((sum, bundle) => {
              const item = orderItems.find(i => i.menuItem.toString() === bundle.product._id.toString());
              return sum + ((item?.subtotal || 0) * bundle.quantity);
            }, 0);
            autoPromoDiscount += Math.max(bundleValue - promo.bundlePrice, 0);
            promoApplied = true;
          }
          break;
      }

      if (promoApplied) {
        appliedPromos.push(promo.name);
      }
    }

    // Voucher Discount
    let discount = 0;
    let foundVoucher = null;
    if (voucher) {
      foundVoucher = await Voucher.findOne({ code: voucher, isActive: true });


      if (foundVoucher) {

        const isValidDate = now >= foundVoucher.validFrom && now <= foundVoucher.validTo;
        const isValidOutlet = foundVoucher.applicableOutlets.length === 0 ||
          foundVoucher.applicableOutlets.some(outletId => outletId.equals(outlet));
        const hasQuota = foundVoucher.quota > 0;

        if (!isValidDate || !isValidOutlet || !hasQuota) {
          foundVoucher = null;
        } else {
          // Apply discount
          if (foundVoucher.discountType === 'percentage') {
            discount = (totalAmount * foundVoucher.discountAmount) / 100;
          } else if (foundVoucher.discountType === 'fixed') {
            discount = foundVoucher.discountAmount;
          }

          // Update quota
          foundVoucher.quota -= 1;
          if (foundVoucher.quota === 0) {
            foundVoucher.isActive = false;
          }
          await foundVoucher.save();
        }
      }
    }

    const totalDiscount = Math.floor(discount + autoPromoDiscount);
    const serviceFee = 3000;
    const finalAmount = Math.max(totalAmount - totalDiscount, 0);
    const totalWithServiceFee = finalAmount + serviceFee;

    // Simpan order ke database
    const order = new Order({
      user,
      cashier,
      items: orderItems,
      paymentMethod,
      orderType,
      type,
      tableNumber: table,
      voucher: foundVoucher ? foundVoucher._id : null,
    });

    const savedOrder = await order.save();

    // Jika pembayaran tunai atau EDC, tidak perlu proses Midtrans
    if (paymentMethod === 'Cash' || paymentMethod === 'EDC') {
      // Update order status to 'Completed'
      savedOrder.status = 'Completed';
      await savedOrder.save();

      return res.json({
        message: 'Order placed successfully',
        order_id: savedOrder._id,
        total: finalAmount,
      });
    }

    // Data untuk Midtrans
    const transactionData = {
      payment_type: 'gopay',
      transaction_details: {
        order_id: savedOrder._id.toString(),
        gross_amount: totalWithServiceFee,
      },
      item_details: [
        ...orderItems.map(item => ({
          id: item.menuItem.toString(),
          name: 'Menu Item',
          price: Math.floor(item.subtotal),
          quantity: item.quantity,
        })),
        ...(totalDiscount > 0 ? [{
          id: 'discount',
          name: 'Auto Promo & Voucher',
          price: -totalDiscount,
          quantity: 1,
        }] : []),
        {
          id: 'service_fee',
          name: 'Service Fee',
          price: serviceFee, 
          quantity: 1,
        },
      ],
      customer_details: {
        name: 'Customer',
        email: 'customer@example.com',
        phone: '081234567890',
      },
    };

    // Request ke Midtrans
    const midtransSnapResponse = await axios.post(
      process.env.MIDTRANS_SANDBOX_ENDPOINT_TRANSACTION,
      transactionData,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
        },
      }
    );

    // Simpan data Payment
    const payment = new Payment({
      order_id: savedOrder._id,
      amount: finalAmount,
      method: paymentMethod,
      status: 'pending',
      redirectUrl: midtransSnapResponse.data.redirect_url,
    });

    await payment.save();

    res.json({
      message: 'Midtrans transaction created',
      redirect_url: midtransSnapResponse.data.redirect_url,
      order_id: savedOrder._id,
    });

  } catch (error) {
    console.error('Checkout Error:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Payment processing failed.',
      });
    } else {
      return res.status(500).json({ message: 'An error occurred while processing your checkout.' });
    }
  }
};



// Handling Midtrans Notification 
export const paymentNotification = async (req, res) => {
  const notification = req.body;

  // Log the notification for debugging
  // console.log('Payment notification received:', notification);

  // Extract relevant information from the notification
  const { transaction_status, order_id, gross_amount, payment_type } = notification;

  try {
    // Update the payment record in the database based on the transaction status
    let status;
    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        // Payment has been captured or settled
        status = 'Success';
        break;
      case 'pending':
        // Payment is pending
        status = 'Pending';
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        // Payment was denied, canceled, or expired
        status = 'Failed';
        break;
      default:
        console.log('Unknown transaction status:', transaction_status);
        return res.status(400).json({ message: 'Unknown transaction status' });
    }

    // Update or create a payment record
    await Payment.updateOne(
      { order_id: order_id },
      {
        $set: {
          amount: parseFloat(gross_amount),
          paymentDate: new Date(),
          paymentMethod: payment_type,
          status: status,
        },
        $setOnInsert: {
          order_id: order_id, // Insert if not exists
        },
      },
      { upsert: true }
    );

    // console.log('Payment record updated successfully for order:', order_id);
    res.status(200).json({ message: 'Notification processed and database updated' });

  } catch (error) {
    console.error('Error updating payment record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.menuItem')
      .populate('user')
      .populate('cashier')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};
export const confirmOrder = async (req, res) => {
  const { cashierId, orderId } = req.body;

  try {
    // Pastikan cashierId dan orderId valid
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(cashierId)) {
      return res.status(400).json({ message: 'Invalid orderId or cashierId' });
    }

    // Update status dan set kasir
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'Completed',
        cashier: cashierId
      },
      { new: true }
    ).populate('cashier', 'name') // Jika ingin menampilkan info kasir
      .populate('items.menuItem'); // Jika ingin detail item

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order confirmed and assigned to cashier',
      order
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error confirming order',
      error: error.message
    });
  }
};


export const getPendingOrders = async (req, res) => {
  try {
    // Ambil semua order dengan status "Pending"
    const pendingOrders = await Order.find({ status: 'Pending' });

    const pendingOrdersWithUnpaidStatus = [];

    for (const order of pendingOrders) {
      const payment = await Payment.findOne({ order_id: order._id });

      if (!payment || (payment.status !== 'Success' && payment.status !== 'paid')) {
        const orderObj = order.toObject();

        // Ubah struktur items
        const updatedItems = await Promise.all(
          orderObj.items.map(async (item) => {
            const menuItem = await MenuItem.findById(item.menuItem); // Asumsikan ada model MenuItem

            // Function to enrich addon with label
            const enrichAddonWithLabel = async (addon) => {
              if (!menuItem) {
                return addon; // Return original addon if menuItem is not found
              }

              const menuItemAddon = menuItem.addons.find((ma) => ma.name === addon.name);

              if (menuItemAddon) {
                const option = menuItemAddon.options.find((opt) => opt.price === addon.price);
                if (option) {
                  return {
                    ...addon,
                    options: option.label,
                  };
                }
              }
              return addon; // Return original addon if label is not found
            };

            // Enrich addons with labels
            const enrichedAddons = await Promise.all(item.addons.map(enrichAddonWithLabel));

            return {
              menuItem: menuItem ? {
                _id: menuItem._id,
                name: menuItem.name,
                price: menuItem.price
              } : null,
              selectedToppings: item.toppings || [],
              selectedAddons: enrichedAddons || [], // Use enriched addons here
              subtotal: item.subtotal,
              quantity: item.quantity,
              isPrinted: item.isPrinted
            };
          })
        );

        orderObj.items = updatedItems;

        // Rename user_id ke userId dan ubah user jadi customerName
        orderObj.userId = orderObj.user_id;
        orderObj.consumerName = orderObj.user;
        delete orderObj.user;
        delete orderObj.user_id;

        pendingOrdersWithUnpaidStatus.push(orderObj);
      }
    }

    res.status(200).json(pendingOrdersWithUnpaidStatus);
  } catch (error) {
    console.error('Error fetching pending unpaid orders:', error);
    res.status(500).json({ message: 'Error fetching pending orders', error });
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