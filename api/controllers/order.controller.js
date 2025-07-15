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
import { QueueEvents } from 'bullmq';
import { db } from '../utils/mongo.js';
//io
import { io, broadcastNewOrder } from '../index.js';
import Reservation from '../models/Reservation.model.js';

const queueEvents = new QueueEvents('orderQueue');

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
      outlet,
      reservationData,
      reservationType,
    } = req.body;

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
      case 'reservation':
        formattedOrderType = 'Reservation';
        if (!reservationData) {
          return res.status(400).json({ success: false, message: 'Reservation data is required for reservation orders' });
        }
        if (!reservationData.reservationTime) {
          return res.status(400).json({ success: false, message: 'Reservation time is required for reservation orders' });
        }
        if (!reservationData.guestCount) {
          return res.status(400).json({ success: false, message: 'Guest count is required for reservation orders' });
        }
        if (!reservationData.areaIds) {
          return res.status(400).json({ success: false, message: 'Area ID is required for reservation orders' });
        }
        if (!reservationData.tableIds) {
          return res.status(400).json({ success: false, message: 'Area code is required for reservation orders' });
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
      status: orderType === 'reservation' ? 'Reserved' : 'Pending',
      paymentMethod: paymentDetails.method,
      orderType: formattedOrderType,
      deliveryAddress: deliveryAddress || '',
      tableNumber: tableNumber || '',
      type: 'Indoor',
      voucher: voucherId,
      outlet: outlet,
      totalBeforeDiscount: orderItems.reduce((sum, item) => sum + item.subtotal, 0),
      totalAfterDiscount: orderItems.reduce((sum, item) => sum + item.subtotal, 0), // No discount applied yet
      totalTax: 0, // Assuming no tax for now
      totalServiceFee: 0, // Assuming no service fee for now
      discounts: {
        autoPromoDiscount: 0,
        manualDiscount: 0,
        voucherDiscount: 0
      },
      appliedPromos: [], // Will be filled with auto promos if any
      appliedManualPromo: null, // Will be filled if manual promo is applied
      appliedVoucher: voucherId, // Will be filled if voucher is applied
      taxAndServiceDetails: [], // Will be filled if tax or service fee is applied
      grandTotal: orderItems.reduce((sum, item) => sum + item.subtotal, 0), // Initial grand total
      promotions: [],
      source: 'App',
      reservation: null, // Will be set after reservation is created
    });

    await newOrder.save();

    // Handle reservation creation if orderType is reservation
    let reservationRecord = null;
    if (orderType === 'reservation') {
      try {
        // Create reservation record
        reservationRecord = new Reservation({
          reservation_date: reservationData.reservationDate || new Date().toISOString().split('T')[0],
          reservation_time: reservationData.reservationTime,
          area_id: reservationData.areaIds,
          table_id: reservationData.tableIds,
          guest_count: reservationData.guestCount,
          order_id: newOrder._id,
          status: 'pending',
          reservation_type: reservationType || 'nonBlocking', // Default to non-blocking
          notes: reservationData.notes || ''
        });

        await reservationRecord.save();

        // Update order with reservation reference
        newOrder.reservation = reservationRecord._id;
        await newOrder.save();

        console.log('Reservation created:', reservationRecord);
      } catch (reservationError) {
        console.error('Error creating reservation:', reservationError);
        // If reservation creation fails, we might want to rollback the order
        // or handle this error gracefully
        await Order.findByIdAndDelete(newOrder._id);
        return res.status(500).json({
          success: false,
          message: 'Error creating reservation',
          error: reservationError.message
        });
      }
    }

    // Prepare response data
    const responseData = {
      success: true,
      message: `${orderType === 'reservation' ? 'Reservation' : 'Order'} created successfully`,
      order: newOrder
    };

    // Add reservation data to response if it's a reservation order
    if (reservationRecord) {
      responseData.reservation = reservationRecord;
    }

    // Mapping data sesuai kebutuhan frontend
    const mappedOrders = {
      _id: newOrder._id,
      userId: newOrder.user_id, // renamed
      customerName: newOrder.user, // renamed
      cashierId: newOrder.cashier, // renamed
      items: newOrder.items.map(item => ({
        _id: item._id,
        quantity: item.quantity,
        subtotal: item.subtotal,
        isPrinted: item.isPrinted,
        menuItem: {
          ...item.menuItem,
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
      status: newOrder.status,
      orderType: newOrder.orderType,
      deliveryAddress: newOrder.deliveryAddress,
      tableNumber: newOrder.tableNumber,
      type: newOrder.type,
      paymentMethod: newOrder.paymentMethod || "Cash", // default value
      totalPrice: newOrder.items.reduce((total, item) => total + item.subtotal, 0), // dihitung dari item subtotal
      voucher: newOrder.voucher || null,
      outlet: newOrder.outlet || null,
      promotions: newOrder.promotions || [],
      createdAt: newOrder.createdAt,
      updatedAt: newOrder.updatedAt,
      __v: newOrder.__v
    };

    // Emit ke aplikasi kasir untuk menampilkan newOrder baru
    io.to('cashier_room').emit('new_order', { mappedOrders });
    res.status(201).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
  }
};


function mapOrderForFrontend(newOrder) {
  return {
    _id: newOrder._id,
    orderId: newOrder.order_id,
    userId: newOrder.user_id?._id || newOrder.user_id,
    customerName: newOrder.user_id?.name || newOrder.user,
    customerPhone: newOrder.user_id?.phone || newOrder.phoneNumber,
    cashierId: newOrder.cashierId?._id || newOrder.cashierId,
    cashierName: newOrder.cashierId?.name,
    items: newOrder.items.map(item => ({
      _id: item._id,
      menuItemId: item.menuItem,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      isPrinted: item.isPrinted || false,
      selectedAddons: item.selectedAddons || [],
      selectedToppings: item.selectedToppings || []
    })),
    status: newOrder.status,
    paymentStatus: newOrder.paymentStatus,
    orderType: newOrder.orderType,
    deliveryAddress: newOrder.deliveryAddress,
    tableNumber: newOrder.tableNumber,
    paymentMethod: newOrder.paymentMethod,
    totalBeforeDiscount: newOrder.totalBeforeDiscount,
    totalAfterDiscount: newOrder.totalAfterDiscount,
    taxAndService: newOrder.taxAndService,
    grandTotal: newOrder.grandTotal,
    appliedPromos: newOrder.appliedPromos || [],
    source: newOrder.source,
    notes: newOrder.notes,
    createdAt: newOrder.createdAt,
    updatedAt: newOrder.updatedAt
  };
}


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
  try {
    const { source } = req.body;
    const validated = validateOrderData(req.body, source);
    const { tableNumber } = validated;

    console.log('request body:', req.body);


    let orderId;
    if (tableNumber) {
      orderId = await generateOrderId(String(tableNumber));
    } else {
      orderId = `${source.toUpperCase()}-${Date.now()}`;
    }

    // Jangan mulai session dan transaksi di sini

    // Kirim ke job queue
    const job = await orderQueue.add('create_order', {
      type: 'create_order',
      payload: { orderId, orderData: validated, source }
    }, { jobId: orderId });

    // Tunggu job selesai
    let result;
    try {
      result = await job.waitUntilFinished(queueEvents);
    } catch (queueErr) {
      return res.status(500).json({
        success: false,
        message: `Order gagal diproses: ${queueErr.message}`
      });
    }

    // Hanya buat transaksi Midtrans kalau order berhasil diproses
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
    return res.status(400).json({ success: false, error: err.message });
  }
};



export const confirmOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    // 1. Find order and update status
    const order = await Order.findOneAndUpdate(
      { order_id: orderId },
      { $set: { status: 'Waiting' } },
      // { $set: { status: 'OnProcess' } },
      { new: true }
    ).populate('items.menuItem').populate('outlet');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // 2. Update payment status
    const payment = await Payment.findOneAndUpdate(
      { order_id: orderId },
      { $set: { status: 'settlement', paidAt: new Date() } },
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
    // Get all waiting and active jobs with pagination
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get jobs with additional status details
    const jobs = await orderQueue.getJobs(['waiting', 'active'], skip, skip + limit - 1);

    // Format response with more detailed order information
    const orders = await Promise.all(jobs.map(async job => {
      const orderDetails = await Order.findOne({ order_id: job.data?.order_id })
        .select('status source tableNumber createdAt')
        .lean();

      return {
        jobId: job.id,
        orderId: job.data?.order_id,
        status: job.data?.status || 'queued',
        attemptsMade: job.attemptsMade,
        claimedBy: job.data?.cashierId || null,
        timestamp: new Date(job.timestamp),
        orderDetails,
        data: {
          ...job.data,
          // Remove sensitive data if any
          paymentDetails: undefined
        }
      };
    }));

    // Get counts for pagination metadata
    const waitingCount = await orderQueue.getJobCountByTypes('waiting');
    const activeCount = await orderQueue.getJobCountByTypes('active');

    res.status(200).json({
      success: true,
      data: orders,
      meta: {
        total: waitingCount + activeCount,
        page: parseInt(page),
        limit: parseInt(limit),
        waitingCount,
        activeCount
      }
    });
  } catch (error) {
    console.error('Failed to get queued orders:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date()
    });
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil daftar order antrian',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/orders/:jobId/confirm
export const confirmOrderByCashier = async (req, res) => {
  const { jobId } = req.params;
  const { cashierId, cashierName } = req.body;

  // Enhanced validation
  if (!cashierId || !cashierName) {
    return res.status(400).json({
      success: false,
      error: 'cashierId dan cashierName wajib diisi',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  try {
    // Get job with lock to prevent race conditions
    const job = await orderQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job tidak ditemukan',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Validate job data
    const orderId = job.data?.order_id;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Data order tidak valid',
        code: 'INVALID_JOB_DATA'
      });
    }

    // Check if already claimed
    if (job.data?.cashierId) {
      const currentCashier = job.data.cashierId === cashierId ?
        'Anda' : `Kasir ${job.data.cashierName || job.data.cashierId}`;
      return res.status(409).json({
        success: false,
        error: `${currentCashier} sudah mengambil order ini`,
        code: 'ORDER_ALREADY_CLAIMED'
      });
    }

    // Start transaction for atomic updates
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update order status and assign cashier
      const order = await Order.findOneAndUpdate(
        { order_id: orderId },
        {
          status: 'OnProcess',
          cashier: {
            id: cashierId,
            name: cashierName
          },
          processingStartedAt: new Date()
        },
        { new: true, session }
      );

      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: 'Order tidak ditemukan di database',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Update job data with cashier info
      await job.update({
        ...job.data,
        cashierId,
        cashierName,
        status: 'processing'
      });

      await session.commitTransaction();

      // Log the claim event
      console.log('Order claimed by cashier:', {
        orderId,
        jobId,
        cashierId,
        cashierName,
        timestamp: new Date()
      });

      // Emit real-time update
      req.io.emit('order-status-updated', {
        orderId,
        status: 'OnProcess',
        cashier: { id: cashierId, name: cashierName }
      });

      res.status(200).json({
        success: true,
        message: 'Order berhasil diklaim dan akan diproses',
        data: {
          orderId,
          status: order.status,
          cashier: order.cashier,
          estimatedTime: '10-15 menit' // Could be dynamic based on order content
        }
      });

    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Failed to confirm order:', {
      jobId,
      cashierId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date()
    });

    const statusCode = error.code === 'ORDER_ALREADY_CLAIMED' ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      error: 'Gagal mengkonfirmasi order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code || 'INTERNAL_SERVER_ERROR'
    });
  }
};


export const charge = async (req, res) => {
  try {
    const { payment_type, is_down_payment, down_payment_amount, remaining_payment } = req.body;

    console.log('Received payment type:', payment_type);

    // Deteksi apakah ini cash payment atau payment lainnya
    if (payment_type === 'cash') {
      // Handle cash payment
      const { order_id, gross_amount } = req.body;
      console.log('Payment type:', payment_type, 'Order ID:', order_id, 'Gross Amount:', gross_amount);

      // Check if payment already exists for this order
      const existingPayment = await Payment.findOne({ order_id: order_id });
      if (existingPayment) {
        console.log('Payment already exists for order:', order_id);
        return res.status(200).json({
          success: true,
          message: 'Payment already processed',
          data: {
            payment_id: existingPayment._id,
            order_id: order_id,
            amount: existingPayment.amount,
            method: existingPayment.method,
            status: existingPayment.status,
            transaction_id: existingPayment._id.toString(),
            paymentType: existingPayment.paymentType,
            remainingAmount: existingPayment.remainingAmount,
            is_down_payment: existingPayment.is_down_payment || false,
          }
        });
      }

      // Log reservation payment details if present
      if (is_down_payment !== undefined) {
        console.log('Is Down Payment:', is_down_payment);
        console.log('Down Payment Amount:', down_payment_amount);
        console.log('Remaining Payment:', remaining_payment);
      }

      // Determine payment type and amounts based on reservation payment
      let paymentType = 'Full';
      let amount = gross_amount;
      let remainingAmount = 0;

      if (is_down_payment === true) {
        paymentType = 'Down Payment';
        amount = down_payment_amount || gross_amount;
        remainingAmount = remaining_payment || 0;
      }

      const payment = new Payment({
        order_id: order_id,
        amount: amount,
        method: payment_type,
        status: 'pending',
        paymentType: paymentType,
        remainingAmount: remainingAmount,
        is_down_payment: is_down_payment || false,
      });

      await payment.save();

      // Kirim response yang proper untuk cash payment
      return res.status(200).json({
        success: true,
        message: `Cash payment ${paymentType.toLowerCase()} processed successfully`,
        data: {
          payment_id: payment._id,
          order_id: order_id,
          amount: gross_amount,
          method: payment_type,
          status: 'pending',
          transaction_id: payment._id.toString(),
          paymentType: paymentType,
          remainingAmount: remainingAmount,
          is_down_payment: is_down_payment || false,
        }
      });
    } else {
      // Handle payment lainnya (bank_transfer, gopay, qris, dll)
      const { transaction_details, bank_transfer } = req.body;
      const { order_id, gross_amount } = transaction_details;

      // Check if payment already exists for this order
      const existingPayment = await Payment.findOne({ order_id: order_id });
      if (existingPayment) {
        console.log('Payment already exists for order:', order_id);
        return res.status(200).json({
          success: true,
          message: 'Payment already processed',
          data: existingPayment.raw_response || {
            payment_id: existingPayment._id,
            order_id: order_id,
            amount: existingPayment.amount,
            method: existingPayment.method,
            status: existingPayment.status,
            transaction_id: existingPayment.transaction_id,
            paymentType: existingPayment.paymentType,
            remainingAmount: existingPayment.remainingAmount,
            is_down_payment: existingPayment.is_down_payment || false,
          }
        });
      }

      // Log reservation payment details if present
      if (is_down_payment !== undefined) {
        console.log('Is Down Payment:', is_down_payment);
        console.log('Down Payment Amount:', down_payment_amount);
        console.log('Remaining Payment:', remaining_payment);
      }

      // Validasi input
      if (!order_id || !gross_amount) {
        return res.status(400).json({
          success: false,
          message: 'Order ID and gross amount are required'
        });
      }

      const id_order = await Order.findOne({ order_id: order_id });
      if (!id_order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      // Determine payment type and amounts based on reservation payment
      let paymentType = 'Full';
      let amount = gross_amount;
      let remainingAmount = 0;

      if (is_down_payment === true) {
        paymentType = 'Down Payment';
        amount = down_payment_amount || gross_amount;
        remainingAmount = remaining_payment || 0;
      }

      // Menyiapkan chargeParams dasar
      let chargeParams = {
        "payment_type": payment_type,
        "transaction_details": {
          "gross_amount": parseInt(amount),
          "order_id": order_id,
        },
      };

      // Kondisikan chargeParams berdasarkan payment_type
      if (payment_type === 'bank_transfer') {
        if (!bank_transfer || !bank_transfer.bank) {
          return res.status(400).json({
            success: false,
            message: 'Bank information is required for bank transfer'
          });
        }
        const { bank } = bank_transfer;
        chargeParams['bank_transfer'] = {
          "bank": bank
        };
      } else if (payment_type === 'gopay') {
        chargeParams['gopay'] = {
          // enable_callback: true,
          // callback_url: "https://yourdomain.com/callback"
        };
      } else if (payment_type === 'qris') {
        chargeParams['qris'] = {
          // enable_callback: true,
          // callback_url: "https://yourdomain.com/callback"
        };
      } else if (payment_type === 'shopeepay') {
        chargeParams['shopeepay'] = {};
      } else if (payment_type === 'credit_card') {
        chargeParams['credit_card'] = { secure: true };
      }

      // Lakukan permintaan API untuk memproses pembayaran
      const response = await coreApi.charge(chargeParams);

      console.log('Midtrans response:', response);

      const payment = new Payment({
        transaction_id: response.transaction_id,
        order_id: order_id.toString(),
        amount: parseInt(amount),
        method: payment_type,
        status: response.transaction_status || 'pending',
        fraud_status: response.fraud_status,
        transaction_time: response.transaction_time,
        expiry_time: response.expiry_time,
        settlement_time: response.settlement_time || null,
        va_numbers: response.va_numbers || [],
        permata_va_number: response.permata_va_number || null,
        bill_key: response.bill_key || null,
        biller_code: response.biller_code || null,
        pdf_url: response.pdf_url || null,
        currency: response.currency || 'IDR',
        merchant_id: response.merchant_id || null,
        signature_key: response.signature_key || null,
        actions: response.actions || [],
        paymentType: paymentType,
        remainingAmount: remainingAmount,
        is_down_payment: is_down_payment || false,
        raw_response: response
      });

      await payment.save();

      // Enhance response with reservation payment info
      const enhancedResponse = {
        ...response,
        paymentType: paymentType,
        remainingAmount: remainingAmount,
        is_down_payment: is_down_payment || false,
        down_payment_amount: is_down_payment === true ? down_payment_amount : null,
      };

      return res.status(200).json(enhancedResponse);
    }
  } catch (error) {
    console.error('Payment processing error:', error);

    // Enhanced error logging for reservation payments
    if (req.body.is_down_payment !== undefined) {
      console.error('Reservation payment error details:', {
        is_down_payment: req.body.is_down_payment,
        down_payment_amount: req.body.down_payment_amount,
        remaining_payment: req.body.remaining_payment,
      });
    }

    return res.status(500).json({
      success: false,
      message: payment_type === 'cash' ? 'Cash payment failed' : 'Payment failed',
      error: error.message || error
    });
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

// ! Start Kitchen sections
export const getKitchenOrder = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.menuItem')
      .lean();


    // Filter hanya orders yang memiliki setidaknya 1 item dengan workstation 'kitchen'
    const kitchenOrders = orders.filter(order =>
      order.items.some(item =>
        item.menuItem && item.menuItem.workstation === 'kitchen'
      )
    );

    res.status(200).json({ success: true, data: kitchenOrders });
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch kitchen orders' });
  }
}

export const updateKitchenOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  console.log('Updating kitchen order status for orderId:', orderId, 'to status:', status);
  if (!orderId || !status) {
    return res.status(400).json({ success: false, message: 'orderId and status are required' });
  }
  try {
    const order = await Order.findOneAndUpdate(
      { order_id: orderId },
      { $set: { status: status } },
      { new: true }
    ).populate('items.menuItem');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating kitchen order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update kitchen order status' });
  }
}



// ! End Kitchen sections

// Mengambil semua order
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.menuItem')
      .populate('user')
      .populate('cashierId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};


// Mengambil order yang pending
export const getPendingOrders = async (req, res) => {
  try {
    const { rawOutletId } = req.params;
    if (!rawOutletId) {
      return res.status(400).json({ message: 'outletId is required' });
    }

    const outletId = rawOutletId.trim(); // 🔧 TRIM SPASI / NEWLINE
    const outletObjectId = new mongoose.Types.ObjectId(outletId);

    // Ambil order pending d  ari outlet tertentu
    const pendingOrders = await Order.find({
      status: 'Pending',
      outlet: outletObjectId
    }).lean().sort({ createdAt: -1 });

    if (!pendingOrders.length) return res.status(200).json([]);

    const orderIds = pendingOrders.map(order => order._id);

    const payments = await Payment.find({
      order_id: { $in: orderIds }
    }).lean();

    const successfulPaymentOrderIds = new Set(
      payments.filter(p => p.status === 'Success' || p.status === 'settlement')
        .map(p => p.order_id.toString())
    );

    const unpaidOrders = pendingOrders.filter(
      order => !successfulPaymentOrderIds.has(order._id.toString())
    );

    const menuItemIds = [
      ...new Set(
        unpaidOrders.flatMap(order =>
          order.items.map(item => item.menuItem?.toString())
        ).filter(Boolean)
      )
    ];

    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } }).lean();
    const menuItemMap = new Map(menuItems.map(item => [item._id.toString(), item]));

    const enrichedOrders = unpaidOrders.map(order => {
      const updatedItems = order.items.map(item => {
        const menuItem = menuItemMap.get(item.menuItem?.toString());

        const enrichedAddons = (item.addons || []).map(addon => {
          const matchedAddon = menuItem?.addons?.find(ma => ma.name === addon.name);
          const matchedOption = matchedAddon?.options?.find(opt => opt.price === addon.price);
          return {
            name: addon.name,
            options: matchedOption
              ? [{ price: addon.price, label: matchedOption.label }]
              : addon.options || []
          };
        });

        return {
          menuItem: menuItem ? {
            _id: menuItem._id,
            name: menuItem.name,
            originalPrice: menuItem.price
          } : null,
          selectedToppings: item.toppings || [],
          selectedAddons: enrichedAddons,
          subtotal: item.subtotal,
          quantity: item.quantity,
          isPrinted: item.isPrinted,
          notes: item.notes
        };
      });

      return {
        ...order,
        items: updatedItems,
        userId: order.user_id,
        cashierId: order.cashier,
        customerName: order.user,
        user: undefined,
        user_id: undefined,
        cashier: undefined,
      };
    });

    res.status(200).json(enrichedOrders);
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
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Mencari semua pesanan dengan field "user_id" yang sesuai dengan ID user
    const orderHistorys = await Order.find({ user_id: userId })
      .populate('items.menuItem')
      .select('_id order_id user_id items status')
      .lean();

    console.log('Fetching order history for user:', orderHistorys);

    if (!orderHistorys || orderHistorys.length === 0) {
      return res.status(404).json({ message: 'No order history found for this user.' });
    }

    // Mengambil semua order_id untuk mencari payment status
    const orderIds = orderHistorys.map(order => order.order_id); // Use string-based order_id
    const payments = await Payment.find({ order_id: { $in: orderIds } });

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
      paymentStatus: paymentMap[order.order_id] || null,
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
      .populate('items.menuItem');

    // console.log('Order:', order);

    console.log('Order ID:', orderId);


    const payment = await Payment.findOne({ order_id: order.order_id });

    // Mencari reservasi berdasarkan order_id
    const reservation = await Reservation.findOne({ order_id: orderId })
      .populate('area_id')
      .populate('table_id');

    console.log('Payment:', payment);
    console.log('Order:', orderId);
    console.log('Reservation:', reservation);

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

    // Format tanggal untuk reservasi (tanpa jam)
    const formatReservationDate = (dateString) => {
      const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      };
      return new Intl.DateTimeFormat('id-ID', options).format(new Date(dateString));
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

    // Prepare reservation data jika ada
    let reservationData = null;
    if (reservation) {
      reservationData = {
        _id: reservation._id.toString(),
        reservationCode: reservation.reservation_code,
        reservationDate: formatReservationDate(reservation.reservation_date),
        reservationTime: reservation.reservation_time,
        guestCount: reservation.guest_count,
        status: reservation.status,
        reservationType: reservation.reservation_type,
        notes: reservation.notes,
        area: {
          _id: reservation.area_id?._id,
          name: reservation.area_id?.area_name || 'Unknown Area'
        },
        // PERBAIKAN: Pastikan tables di-map dengan benar
        tables: Array.isArray(reservation.table_id) ? reservation.table_id.map(table => ({
          _id: table._id.toString(),
          tableNumber: table.table_number || 'Unknown Table',
          seats: table.seats,
          tableType: table.table_type,
          isAvailable: table.is_available,
          isActive: table.is_active
        })) : []
      };

      // DEBUGGING: Log tables secara detail
      console.log('Tables detail:', JSON.stringify(reservationData.tables, null, 2));
    }

    console.log("Permata VA Number:", payment?.permata_va_number || 'N/A');
    // const banks = payment?.va_numbers?.map(item => item.bank) || [];
    // console.log("Banks:", banks);


    const orderData = {
      _id: order._id.toString(),
      orderId: order.order_id || order._id.toString(),
      orderNumber: generateOrderNumber(order.order_id || order._id),
      orderDate: formatDate(order.createdAt),
      items: formattedItems,
      total: payment?.amount || 0,
      orderStatus: order.status,
      paymentMethod: payment
        ? (payment?.permata_va_number || payment?.va_numbers?.[0]?.bank || payment?.method || 'Unknown').toUpperCase()
        : 'Unknown',
      paymentStatus: payment?.status || 'Unpaid',
      reservation: reservationData
    };

    // DEBUGGING: Log order data dengan format yang lebih readable
    console.log('Order Data:', JSON.stringify(orderData, null, 2));

    res.status(200).json({ orderData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getPendingPaymentOrders = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required.' });
    }
    console.log('Fetching order with ID:', orderId);

    // Mencari pesanan berdasarkan ID
    const order = await Order.findById(orderId)
      .populate('items.menuItem');

    const payment = await Payment.findOne({ order_id: order.order_id });

    res.status(200).json({ payment });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

// Get Cashier Order History
export const getCashierOrderHistory = async (req, res) => {
  try {
    const cashierId = req.params.cashierId; // Mengambil ID kasir dari parameter URL
    console.log(cashierId);
    if (!cashierId) {
      return res.status(400).json({ message: 'Cashier ID is required.' });
    }

    // Mencari semua pesanan dengan field "cashier" yang sesuai dengan ID kasir
    const orders = await Order.find({ cashierId: cashierId })
      // const orders = await Order.find();
      .populate('items.menuItem') // Mengisi detail menu item (opsional)
      // .populate('voucher')
      .sort({ createdAt: -1 }); // Mengisi detail voucher (opsional)
    console.log(orders.length);
    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: 'No order history found for this cashier.', orders });
    }

    // Mapping data sesuai kebutuhan frontend
    const mappedOrders = orders.map(order => ({
      _id: order._id,
      userId: order.user_id, // renamed
      customerName: order.user, // renamed
      cashierId: order.cashierId, // renamed
      items: order.items.map(item => ({
        _id: item._id,
        quantity: item.quantity,
        subtotal: item.subtotal,
        isPrinted: item.isPrinted,
        menuItem: {
          // ...item.menuItem.toObject(),
          _id: item.menuItem._id,
          name: item.menuItem.name,
          originalPrice: item.menuItem.price,
          discountedprice: item.menuItem.discountedPrice,
          description: item.menuItem.description,
          workstation: item.menuItem.workstation,
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
      paymentMethod: order.paymentMethod, // default value
      totalPrice: order.items.reduce((total, item) => total + item.subtotal, 0), // dihitung dari item subtotal
      voucher: order.voucher,
      outlet: order.outlet,
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
  const cashierRoom = io.to('cashier_room').emit('order_created', { message: 'Order created' });
  console.log('Emitting order created to cashier room success.');

  res.status(200).json({ success: cashierRoom });
}