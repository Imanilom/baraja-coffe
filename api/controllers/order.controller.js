import Payment from '../models/Payment.model.js';
import { MenuItem } from "../models/MenuItem.model.js";
import { Order } from "../models/order.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import AutoPromo from '../models/AutoPromo.model.js';
import { snap, coreApi } from '../utils/MidtransConfig.js';
import mongoose from 'mongoose';
import axios from 'axios';
import { validateOrderData, sanitizeForRedis, createMidtransCoreTransaction, createMidtransSnapTransaction } from '../validators/order.validator.js';
import { orderQueue } from '../queues/order.queue.js';
import { db } from '../utils/mongo.js';
//io
import { io, broadcastNewOrder  } from '../index.js';

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
      outlet
      // userName,
      // pricing,
      // orderDate,
      // status,

    } = req.body;
    // console.log(items);
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

    console.log('User exists:', userExists);

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
    // console.log('Order items:', items);
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
        notes: item.notes || '',
        isPrinted: false,
      });
    }

    console.log('Processed order items:', orderItems);

    // Create new order
    const newOrder = new Order({
      order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      user: userExists.username || 'Guest',
      cashier: null,
      items: orderItems,
      status: 'Pending',
      paymentMethod: paymentDetails.method,
      orderType: formattedOrderType,
      deliveryAddress: deliveryAddress || '',
      tableNumber: tableNumber || '',
      type: 'Indoor',
      voucher: voucherId,
      outlet: outlet,
      promotions: [],
      source: 'App',
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
      order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // ID order unik
      user: userName,                           // Sesuai dengan model, ini adalah nama user
      cashier: cashierId || null,               // ID kasir jika order melalui kasir
      items: orderItems,
      paymentMethod,
      orderType,
      tableNumber: orderType === 'Dine-In' ? tableNumber : null,
      type: orderType === 'Dine-In' ? 'Indoor' : null, // Default ke Indoor
      status: "Completed",
      source: "Cashier",
    });

    await order.save({ session });

    // Proses pembayaran
    let paymentResponse = {};
    let payment;


    if (paymentMethod === "Cash" || paymentMethod === "EDC") {
      payment = new Payment({
        order_id: order.order_id,
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
          order_id: order.order_id.toString(),
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
        order: order.order_id,
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
    const serviceFee = 0;
    const finalAmount = Math.max(totalAmount - totalDiscount, 0);
    const totalWithServiceFee = finalAmount + serviceFee;

    // Simpan order ke database
    const order = new Order({
      order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
    io.emit('newOrder', savedOrder);
    // Jika pembayaran tunai atau EDC, tidak perlu proses Midtrans
    if (paymentMethod === 'Cash' || paymentMethod === 'EDC') {
      // Update order status to 'Completed'
      savedOrder.status = 'Completed';
      await savedOrder.save();

      return res.json({
        message: 'Order placed successfully',
        order_id: savedOrder.order_id,
        total: finalAmount,
      });
    }

    // Data untuk Midtrans
    const transactionData = {
      payment_type: 'gopay',
      transaction_details: {
        order_id: savedOrder.order_id.toString(),
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
      order_id: savedOrder.order_id,
      amount: finalAmount,
      method: paymentMethod,
      status: 'pending',
      redirectUrl: midtransSnapResponse.data.redirect_url,
    });

    await payment.save();

    res.json({
      message: 'Midtrans transaction created',
      redirect_url: midtransSnapResponse.data.redirect_url,
      order_id: savedOrder.order_id,
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



// Fungsi untuk generate order ID dengan sequence harian per tableNumber
export async function generateOrderId(tableNumber) {
  // Dapatkan tanggal sekarang dalam format YYYYMMDD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`; // misal "20250605"

  // Kunci sequence unik per tableNumber dan tanggal
  const key = `order_seq_${tableNumber}_${dateStr}`;

  // Atomic increment dengan upsert dan reset setiap hari (jika document tidak ada, dibuat dengan seq=1)
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const seq = result.value.seq;

  // Format orderId sesuai yang kamu mau:
  // ORD-{day}{tableNumber}-{personNumber}
  // day = tanggal 2 digit (dd)
  // personNumber = seq 3 digit padStart
  return `ORD-${day}${tableNumber}-${String(seq).padStart(3, '0')}`;
}

export const createUnifiedOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let transactionCommitted = false;

  try {
    const { source } = req.body;
    const validated = validateOrderData(req.body, source);
    const { tableNumber } = validated;

    let orderId;
    if (tableNumber) {
      orderId = await generateOrderId(String(tableNumber));
    } else {
      orderId = `${source.toUpperCase()}-${Date.now()}`;
    }

    const items = [];
    for (const item of validated.items) {
      const menuItem = await MenuItem.findById(item.id).session(session);
      if (!menuItem) throw new Error('Menu item not found: ' + item.id);

      items.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        subtotal: menuItem.price * item.quantity,
      });
    }

    // Komit transaksi sebelum masuk queue
    await session.commitTransaction();
    transactionCommitted = true;

    const job = await orderQueue.add('create_order', {
      type: 'create_order',
      payload: { orderId, orderData: validated, source }
    }, { jobId: orderId });

    // Respons berdasarkan sumber
    if (source === 'Cashier') {
      return res.status(202).json({
        status: 'completed',
        orderId,
        jobId: job.id,
        message: 'Order kasir diproses dan sudah dibayar',
      });
    }

    if (source === 'App') {
      const midtransRes = await createMidtransCoreTransaction(
        orderId,
        validated.paymentDetails.amount,
        validated.paymentDetails.method
      );

      return res.status(200).json({
        status: 'waiting_payment',
        orderId,
        jobId: job.id,
        midtrans: midtransRes,
      });
    }

    if (source === 'Web') {
      const midtransRes = await createMidtransSnapTransaction(
        orderId,
        validated.paymentDetails.amount,
        validated.paymentDetails.method
      );

      return res.status(200).json({
        status: 'waiting_payment',
        orderId,
        jobId: job.id,
        snapToken: midtransRes.token,
        redirectUrl: midtransRes.redirect_url,
      });
    }

    throw new Error('Sumber order tidak valid');
  } catch (err) {
    if (!transactionCommitted) {
      await session.abortTransaction();
    }
    return res.status(400).json({ success: false, error: err.message });
  } finally {
    session.endSession();
  }
};

export const confirmOrder = async (req, res) => {
  const { orderId } = req.params;
  
  try {
    // 1. Find order and update status
    const order = await Order.findOneAndUpdate(
      { order_id: orderId },
      { $set: { status: 'OnProcess' } },
      { new: true }
    ).populate('items.menuItem').populate('outlet');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // 2. Update payment status
    const payment = await Payment.findOneAndUpdate(
      { order_id: orderId },
      { $set: { status: 'paid', paidAt: new Date() } },
      { new: true }
    );

    // 3. Send notification to cashier if order is from Web/App
    if (order.source === 'Web' || order.source === 'App') {
      const orderData = {
        orderId: order.order_id,
        source: order.source,
        orderType: order.orderType,
        tableNumber: order.tableNumber || null,
        items: order.items.map(item => ({
          name: item.menuItem?.name || 'Unknown Item',
          quantity: item.quantity
        })),
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod, // Use paymentMethod from order
        totalAmount: order.grandTotal,     // Use grandTotal from order
        outletId: order.outlet._id
      };

      // Broadcast to all cashiers in that outlet
      if (typeof broadcastNewOrder === 'function') {
        broadcastNewOrder(order.outlet._id.toString(), orderData);
      } else {
        console.error('broadcastNewOrder function not available');
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Order confirmed and being processed',
      order: order,
      payment: payment
    });

  } catch (err) {
    console.error('Error in confirmOrder:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};


// GET /api/orders/queued
export const getQueuedOrders = async (req, res) => {
  try {
    const jobs = await orderQueue.getJobs(['waiting', 'active']);

    const orders = jobs.map(job => ({
      jobId: job.id,
      data: job.data,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
    }));

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/orders/:jobId/confirm
export const confirmOrderByCashier = async (req, res) => {
  const { jobId } = req.params;
  const { cashierId } = req.body;

  if (!cashierId) {
    return res.status(400).json({ success: false, error: 'cashierId wajib diisi' });
  }

  try {
    const job = await orderQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job tidak ditemukan' });
    }

    const orderId = job.data?.order_id;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'order_id tidak ditemukan dalam job data' });
    }

    // Cegah jika sudah diklaim
    if (job.data?.cashierId) {
      return res.status(400).json({ success: false, error: 'Order sudah diklaim oleh kasir lain' });
    }

    // Update status order di MongoDB
    const order = await Order.findOneAndUpdate(
      { order_id: orderId },
      { status: 'OnProcess', cashier: cashierId },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order tidak ditemukan di database' });
    }

    // Tambahkan cashierId ke job data agar worker tahu siapa yang ambil
    await job.update({ ...job.data, cashierId });

    // TIDAK perlu job.process(), biarkan worker eksekusi otomatis
    res.status(200).json({
      success: true,
      message: 'Order diklaim dan akan segera diproses',
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// Helper untuk pembayaran di aplikasi
export const charge = async (req, res) => {
  try {
    const { payment_type, transaction_details, bank_transfer } = req.body;
    const { order_id, gross_amount } = transaction_details;
    if (payment_type == 'cash') {
      const transaction_id = uuidv4();
      const transaction_time = new Date();
      const expiry_time = new Date(transaction_time.getTime() + 15 * 60000);
      // const qr_string = ORDER:${order_id}|AMOUNT:${gross_amount}|TXN_ID:${transaction_id};
      const qr_code_url = await QRCode.toDataURL(order_id)
      // Generate QR code string
      const customResponse = {
        status_code: "201",
        status_message: "Cash transaction is created",
        transaction_id,
        order_id,
        merchant_id: "G711879663", // ubah sesuai kebutuhan
        gross_amount: gross_amount.toFixed(2),
        currency: "IDR",
        payment_type: "cash",
        transaction_time: transaction_time.toISOString().replace('T', ' ').slice(0, 19),
        transaction_status: "pending",
        fraud_status: "accept",
        actions: [
          {
            name: "generate-qr-code",
            method: "GET",
            url: qr_code_url
          }
        ],
        acquirer: "manual",
        // qr_string,
        expiry_time: expiry_time.toISOString().replace('T', ' ').slice(0, 19)
      };

      return res.status(200).json(customResponse);
    }

    // Menyiapkan chargeParams dasar
    let chargeParams = {
      "payment_type": payment_type,
      "transaction_details": {
        "gross_amount": gross_amount,
        "order_id": order_id,
      },
    };


    const bankValue = payment_type === 'bank_transfer'
      ? bank_transfer?.bank || null
      : payment_type;


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
        // "enable_callback": true,
        // "callback_url": "https://yourdomain.com/callback"
      };
    } else if (payment_type === 'qris') {
      // Untuk QRIS, juga bisa diatur di sini
      chargeParams['qris'] = {
        // misalnya parameter tambahan untuk QRIS
        // "enable_callback": true,
        // "callback_url": "https://yourdomain.com/callback"
      };
    }

    const id_order = await Order.findOne({ order_id: order_id });

    // Lakukan permintaan API untuk memproses pembayaran
    const response = await coreApi.charge(chargeParams);
    const payment = new Payment({
      transaction_id: response.transaction_id,
      order_id: id_order._id.toString(),
      amount: gross_amount,
      method: payment_type,
      status: 'pending',
      fraud_status: response.fraud_status,
      transaction_time: response.transaction_time,
      expiry_time: response.expiry_time,
      bank: bankValue
    });

    await payment.save();
    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      message: 'Payment failed',
      error: error.message || error
    });
  }
};

export const chargeCash = async (req, res) => {
  try {
    const { payment_type, order_id, gross_amount } = req.body;
    console.log('Payment type:', payment_type, 'Order ID:', order_id, 'Gross Amount:', gross_amount);

    const id_order = await Order.findOne({ order_id: order_id });
    console.log('Order found:', id_order._id.toString());

    const payment = new Payment({
      order_id: id_order._id.toString(),
      amount: gross_amount,
      method: payment_type,
      status: 'pending',
    });

    await payment.save();

    // ✅ PERBAIKAN: Kirim response yang proper
    return res.status(200).json({
      success: true,
      message: 'Cash payment processed successfully',
      data: {
        payment_id: payment._id,
        order_id: order_id,
        amount: gross_amount,
        method: payment_type,
        status: 'pending',
        transaction_id: payment._id.toString() // Tambahan untuk UI
      }
    });
  } catch (error) {
    console.error('Cash payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Cash payment failed',
      error: error.message || error
    });
  }
}


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

// Mengambil semua order
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


// Mengambil order yang pending
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
            const enrichAddonWithOptions = async (addon) => {
              if (!menuItem) {
                return addon; // Return original addon if menuItem is not found
              }

              const menuItemAddon = menuItem.addons.find((ma) => ma.name === addon.name);

              if (menuItemAddon) {
                const option = menuItemAddon.options.find((opt) => opt.price === addon.price);
                if (option) {
                  return {
                    name: addon.name,
                    options: [{
                      price: addon.price,
                      label: option.label,
                    }],
                  };
                }
              }
              return addon; // Return original addon if label is not found
            };

            // Enrich addons with labels
            const enrichedAddons = await Promise.all(item.addons.map(enrichAddonWithOptions));

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
        orderObj.cashierId = orderObj.cashier;
        orderObj.customerName = orderObj.user;
        delete orderObj.user;
        delete orderObj.user_id;
        delete orderObj.cashier;

        pendingOrdersWithUnpaidStatus.push(orderObj);
      }
    }

    res.status(200).json(pendingOrdersWithUnpaidStatus);
    // res.status(200).json(pendingOrders);
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

// // Get History User orders
// export const getUserOrderHistory = async (req, res) => {
//   try {
//     const userId = req.params.userId; // Mengambil ID user dari parameter URL
//     if (!userId) {
//       return res.status(400).json({ message: 'User ID is required.' });
//     }

//     // Mencari semua pesanan dengan field "user" yang sesuai dengan ID user
//     const orders = await Order.find({ user_id: userId })
//       .populate('items.menuItem') // Mengisi detail menu item (opsional)
//       .populate('voucher'); // Mengisi detail voucher (opsional)

//     if (!orders || orders.length === 0) {
//       return res.status(404).json({ message: 'No order history found for this user.' });
//     }

//     res.status(200).json({ orders });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };

// Get History User orders
export const getUserOrderHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Mencari semua pesanan dengan field "user_id" yang sesuai dengan ID user
    const orderHistorys = await Order.find({ user_id: userId })
      .populate('items.menuItem')
      .select('_id order_id user_id items status')
      .lean();

    if (!orderHistorys || orderHistorys.length === 0) {
      return res.status(404).json({ message: 'No order history found for this user.' });
    }

    // Mengambil semua order_id untuk mencari payment status
    const orderIds = orderHistorys.map(order => order._id);


    // Mencari payment data berdasarkan order_id (gunakan field 'status' bukan 'paymentStatus')
    const payments = await Payment.find({ order_id: orderIds })
      .select('order_id status')
      .lean();

    // Membuat mapping payment berdasarkan order_id untuk akses yang lebih cepat
    const paymentMap = {};
    payments.forEach(payment => {
      paymentMap[payment.order_id] = payment.status;
    });

    // Mapping data untuk mengcustom response
    const customOrderHistory = orderHistorys.map(order => ({
      _id: order._id,
      order_id: order.order_id,
      user_id: order.user_id,
      items: order.items.map(item => ({
        _id: item._id,
        menuItem: {
          _id: item.menuItem._id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          category: item.menuItem.category,
          imageURL: item.menuItem.imageURL
        },
        quantity: item.quantity,
        subtotal: item.subtotal,
        addons: item.addons,
        toppings: item.toppings
      })),
      status: order.status,
      paymentStatus: paymentMap[order._id] || null,
    }));

    res.status(200).json({
      success: true,
      count: customOrderHistory.length,
      orderHistory: customOrderHistory
    });
  } catch (error) {
    console.error('Error fetching user order history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required.' });
    }
    console.log('Fetching order with ID:', orderId);

    // Mencari pesanan berdasarkan ID
    const order = await Order.findById(orderId)
      .populate('items.menuItem')
    // .populate('voucher');
    // console.log('Order:', order);


    const payment = await Payment.findOne({ order_id: orderId });
    console.log('Payment:', payment);
    console.log('Order:', orderId);

    // Verify user exists
    const userExists = await User.findById(order.user_id);
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('User:', userExists);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Format tanggal
    const formatDate = (date) => {
      const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      };
      return new Intl.DateTimeFormat('id-ID', options).format(new Date(date));
    };

    const formattedItems = order.items.map(item => {
      const basePrice = item.price || item.menuItem?.price || 0;
      const quantity = item.quantity || 1;

      return {
        menuItemId: item.menuItem?._id || item.menuItem || item._id,
        name: item.menuItem?.name || item.name || 'Unknown Item',
        price: basePrice,
        quantity: quantity,
        addons: item.addons || [],
        toppings: item.toppings || [],
        notes: item.notes,
      };
    });


    // Generate order number dari order_id atau _id
    const generateOrderNumber = (orderId) => {
      if (typeof orderId === 'string' && orderId.includes('ORD-')) {
        // Extract number dari format ORD-2024-001234
        const parts = orderId.split('-');
        return parts.length > 2 ? `#${parts[parts.length - 1]}` : `#${orderId.slice(-4)}`;
      }
      // Jika menggunakan MongoDB ObjectId, ambil 4 digit terakhir
      return `#${orderId.toString().slice(-4)}`;
    };
    // console.log(payment);

    const orderData = {
      _id: order._id.toString(),
      orderId: order.order_id || order._id.toString(),
      orderNumber: generateOrderNumber(order.order_id || order._id),
      orderDate: formatDate(order.createdAt),
      items: formattedItems,
      total: payment.amount,
      orderStatus: order.status,
      paymentMethod: payment.bank.toUpperCase(),
      paymentStatus: payment.status
    };
    console.log('Order Data:', orderData);

    res.status(200).json({ orderData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get Cashier Order History
export const getCashierOrderHistory = async (req, res) => {
  try {
    const cashierId = req.params.cashierId; // Mengambil ID kasir dari parameter URL
    console.log(cashierId);
    if (!cashierId) {
      return res.status(400).json({ message: 'Cashier ID is required.' });
    }

    // Mencari semua pesanan dengan field "cashier" yang sesuai dengan ID kasir
    const orders = await Order.find({ cashier: cashierId })
      // const orders = await Order.find();
      .populate('items.menuItem') // Mengisi detail menu item (opsional)
    // .populate('voucher'); // Mengisi detail voucher (opsional)
    console.log(orders.length);
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No order history found for this cashier.' });
    }

    // Mapping data sesuai kebutuhan frontend
    const mappedOrders = orders.map(order => ({
      _id: order._id,
      userId: order.user_id, // renamed
      customerName: order.user, // renamed
      cashierId: order.cashier, // renamed
      items: order.items.map(item => ({
        _id: item._id,
        quantity: item.quantity,
        subtotal: item.subtotal,
        isPrinted: item.isPrinted,
        menuItem: {
          ...item.menuItem.toObject(),
          categories: item.menuItem.category, // renamed
        },
        selectedAddons: item.addons.length > 0 ? item.addons.map(addon => ({
          name: addon.name,
          _id: addon._id,
          options: [{
            id: addon._id, // assuming _id as id for options
            label: addon.label || addon.name, // fallback
            price: addon.price
          }]
        })) : [],
        selectedToppings: item.toppings.length > 0 ? item.toppings.map(topping => ({
          id: topping._id || topping.id, // fallback if structure changes
          name: topping.name,
          price: topping.price
        })) : []
      })),
      status: order.status,
      orderType: order.orderType,
      deliveryAddress: order.deliveryAddress,
      tableNumber: order.tableNumber,
      type: order.type,
      paymentMethod: order.paymentMethod || "Cash", // default value
      totalPrice: order.items.reduce((total, item) => total + item.subtotal, 0), // dihitung dari item subtotal
      voucher: order.voucher || null,
      outlet: order.outlet || null,
      promotions: order.promotions || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      __v: order.__v
    }));

    res.status(200).json({ orders: mappedOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// test socket
export const testSocket = async (req, res) => {
  console.log('Emitting order created to cashier room...');
  io.to('cashier_room').emit('order_created', { message: 'Order created' });
  console.log('Emitting order created to cashier room success.');

  res.status(200).json({ success: true });
}