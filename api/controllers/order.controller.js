import Payment from '../models/Payment.model.js';
import { MenuItem } from "../models/MenuItem.model.js";
import { Order } from "../models/order.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import AutoPromo from '../models/AutoPromo.model.js';
import Promo from '../models/Promo.model.js';
import { RawMaterial } from '../models/RawMaterial.model.js';
import { snap, coreApi } from '../utils/MidtransConfig.js';
import mongoose from 'mongoose';
import axios from 'axios';
import { v4 } from 'uuid';
import { format } from 'date-fns';
import Bull from 'bull';



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
    // console.log(pricing, orderDate, status);
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
      order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      user: userName || userExists.name || 'Guest',
      cashier: null,
      items: orderItems,
      status: 'Pending',
      paymentMethod: paymentDetails.methode,
      orderType: formattedOrderType,
      deliveryAddress: deliveryAddress || '',
      tableNumber: tableNumber || '',
      type: 'Indoor',
      voucher: voucherId,
      outlet: null,
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
      status: "Completed"
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

// Create queue
const orderQueue = new Bull('orderQueue', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  },
  limiter: {
    max: 10,
    duration: 1000
  }
});

// Unified order controller
export const createUnifiedOrder = async (req, res) => {
  try {
    const { source } = req.body; // mobile/web/cashier

    // Validasi input berdasarkan sumber
    const validatedData = validateOrderData(req.body, source);

    // Enqueue ke Bull
    const job = await orderQueue.add({
      ...validatedData,
      socketId: req.socketId || null
    });

    res.status(202).json({
      status: 'queued',
      jobId: job.id,
      message: 'Order sedang diproses'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Queue processor
orderQueue.process(async (job) => {
  const { data } = job;
  const {
    source,
    socketId,
    userId,
    userName,
    cashierId,
    items,
    orderType,
    tableNumber,
    deliveryAddress,
    pickupTime,
    paymentMethod,
    voucherCode,
    totalPrice,
    outlet,
    type
  } = data;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    // 1. Validasi & persiapan item
    const orderItems = await processOrderItems(items, session);

    // 2. Hitung total harga awal
    const baseTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Update stock for raw materials in the menu item
    for (const orderItem of orderItems) {
      const menuItem = await MenuItem.findById(orderItem.menuItem).session(session);
      if (!menuItem) throw new Error(`Menu item not found: ${orderItem.menuItem}`);

      // Update stock for raw materials in the menu item
      for (const material of menuItem.rawMaterials) {
        const rawMaterial = await RawMaterial.findById(material.materialId).session(session);
        if (rawMaterial) {
          const requiredQuantityInBaseUnit = convertToBaseUnit(material.quantityRequired * orderItem.quantity, material.unit);
          const availableQuantityInBaseUnit = convertToBaseUnit(rawMaterial.quantity, rawMaterial.unit);

          if (availableQuantityInBaseUnit >= requiredQuantityInBaseUnit) {
            rawMaterial.quantity -= convertToBaseUnit(material.quantityRequired * orderItem.quantity, material.unit);
            await rawMaterial.save({ session });
          } else {
            throw new Error(`Insufficient stock for raw material: ${rawMaterial.name}`);
          }
        } else {
          throw new Error(`Raw material not found: ${material.materialId}`);
        }
      }
    }

    // 3. Cek promo otomatis
    const {
      totalDiscount: autoPromoDiscount,
      appliedPromos
    } = await checkAutoPromos(orderItems, outlet, type);

    // 4. Cek voucher hanya jika tidak ada promo otomatis
    let voucherDiscount = 0;
    let voucher = null;

    if (appliedPromos.length === 0) {
      const voucherResult = await checkVoucher(voucherCode, baseTotal - autoPromoDiscount, outlet);
      voucherDiscount = voucherResult.discount;
      voucher = voucherResult.voucher;
    }

    // 5. Cek promo manual hanya jika tidak ada promo otomatis atau voucher
    let manualPromoDiscount = 0;
    let manualPromo = null;

    if (appliedPromos.length === 0 && voucherDiscount === 0) {
      const manualPromoResult = await checkManualPromo(baseTotal - autoPromoDiscount, outlet, userType);
      manualPromoDiscount = manualPromoResult.discount;
      manualPromo = manualPromoResult.appliedPromo;
    }

    // 6. Hitung total akhir
    const finalAmount = Math.max(baseTotal - autoPromoDiscount - voucherDiscount - manualPromoDiscount, 0);

    // 7. Buat order
    const newOrder = new Order({
      order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: userName || (await User.findById(userId))?.name || 'Guest',
      cashier: cashierId || null,
      items: orderItems,
      paymentMethod,
      orderType,
      tableNumber,
      deliveryAddress,
      pickupTime,
      voucher: voucher?._id || null,
      promotions: appliedPromos,
      outlet,
      type: type || (orderType === 'Dine-In' ? 'Indoor' : null),
      status: 'Pending',
      source
    });
    await newOrder.save({ session });

    // 8. Proses pembayaran
    const paymentResult = await processPayment({
      order: newOrder,
      paymentMethod,
      amount: source === 'web' ? totalWithServiceFee : (totalPrice || finalAmount),
      source
    });

    // 9. Update status order jika pembayaran langsung
    if (paymentMethod === 'Cash' || paymentMethod === 'EDC') {
      newOrder.status = 'Completed';
      await newOrder.save({ session });
    }

    // 10. Commit transaction
    await session.commitTransaction();

    // 11. Emit via socket.io
    if (socketId) {
      io.to(socketId).emit('orderCreated', newOrder);
    }
    io.emit('newOrder', newOrder); // Broadcast ke semua client

    return {
      order: newOrder,
      payment: paymentResult
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
});

// Fungsi validasi data berdasarkan sumber
function validateOrderData(data, source) {
  // Implementasi validasi berbeda untuk setiap sumber
  switch (source) {
    case 'mobile':
      // Validasi untuk aplikasi mobile
      if (!data.items || !data.userId || !data.paymentDetails) {
        throw new Error('Field wajib tidak lengkap untuk order mobile');
      }
      break;

    case 'cashier':
      // Validasi untuk kasir
      if (!data.items || !data.cashierId || !data.paymentMethod) {
        throw new Error('Field wajib tidak lengkap untuk order kasir');
      }
      break;

    case 'web':
      // Validasi untuk web
      if (!data.orders || !data.user || !data.paymentMethod) {
        throw new Error('Field wajib tidak lengkap untuk order web');
      }
      break;
  }

  return data;
}

// Fungsi proses item
async function processOrderItems(items, session) {
  const orderItems = [];

  for (const item of items) {
    const menuItem = await MenuItem.findById(item.id).session(session);
    if (!menuItem) throw new Error(`Menu item ${item.id} tidak ditemukan`);

    let itemPrice = menuItem.price;
    let addons = [];
    let toppings = [];

    // Proses addon
    if (item.selectedAddons && item.selectedAddons.length > 0) {
      for (const addon of item.selectedAddons) {
        const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
        if (!addonInfo) continue;

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

    // Proses topping
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

    const subtotal = itemPrice * item.quantity;

    orderItems.push({
      menuItem: item.id,
      quantity: item.quantity,
      subtotal,
      addons,
      toppings,
      isPrinted: false
    });
  }

  return orderItems;
}

// Fungsi cek promo otomatis
async function checkAutoPromos(orderItems, outlet, orderType) {
  const now = new Date();

  // Ambil semua promo aktif di outlet tersebut yang sedang berlaku
  const autoPromos = await AutoPromo.find({
    outlet,
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now }
  }).populate('conditions.buyProduct conditions.getProduct conditions.bundleProducts.product');

  let totalDiscount = 0;
  let appliedPromos = [];

  for (const promo of autoPromos) {
    let discountAmount = 0;

    switch (promo.promoType) {
      case 'discount_on_quantity': {
        // Cari apakah ada item yang cocok dengan syarat minimum quantity
        const conditionProduct = promo.conditions.buyProduct;
        if (!conditionProduct) break;

        const orderItem = orderItems.find(item => item.menuItemId.toString() === conditionProduct._id.toString());
        if (orderItem && orderItem.quantity >= promo.conditions.minQuantity) {
          discountAmount = (orderItem.price * orderItem.quantity) * (promo.discount / 100);
        }
        break;
      }

      case 'discount_on_total': {
        // Hitung total harga pesanan
        let totalOrderPrice = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (totalOrderPrice >= promo.conditions.minTotal) {
          discountAmount = totalOrderPrice * (promo.discount / 100);
        }
        break;
      }

      case 'buy_x_get_y': {
        const buyProduct = promo.conditions.buyProduct;
        const getProduct = promo.conditions.getProduct;

        if (!buyProduct || !getProduct) break;

        const buyItem = orderItems.find(item => item.menuItemId.toString() === buyProduct._id.toString());
        const getItem = orderItems.find(item => item.menuItemId.toString() === getProduct._id.toString());

        if (buyItem && getItem) {
          const freeCount = Math.floor(buyItem.quantity / 2); // Misalnya beli 2 dapat 1 gratis
          if (freeCount > 0) {
            discountAmount = freeCount * getItem.price;
          }
        }
        break;
      }

      case 'bundling': {
        const bundleProducts = promo.conditions.bundleProducts || [];
        let allInBundle = true;
        let minQty = Infinity;

        for (const bp of bundleProducts) {
          const item = orderItems.find(i => i.menuItemId.toString() === bp.product._id.toString());

          if (!item || item.quantity < bp.quantity) {
            allInBundle = false;
            break;
          }

          minQty = Math.min(minQty, Math.floor(item.quantity / bp.quantity));
        }

        if (allInBundle) {
          let bundleOriginalPrice = bundleProducts.reduce(
            (sum, bp) => sum + (bp.product.price * bp.quantity),
            0
          );

          discountAmount = bundleOriginalPrice * minQty - promo.bundlePrice * minQty;
        }
        break;
      }

      default:
        console.warn(`Unknown promo type: ${promo.promoType}`);
        break;
    }

    if (discountAmount > 0) {
      totalDiscount += discountAmount;
      appliedPromos.push({
        promoId: promo._id,
        name: promo.name,
        promoType: promo.promoType,
        discountAmount
      });
    }
  }

  return {
    totalDiscount: totalDiscount,
    appliedPromos
  };
}

// Fungsi cek voucher
async function checkVoucher(voucherCode, totalAmount, outlet) {
  let discount = 0;
  let voucher = null;

  if (voucherCode) {
    voucher = await Voucher.findOne({ code: voucherCode });
    if (voucher && voucher.isActive) {
      const isValidDate = new Date() >= voucher.validFrom && new Date() <= voucher.validTo;
      const isValidOutlet = voucher.applicableOutlets.length === 0 ||
        voucher.applicableOutlets.some(outletId => outletId.equals(outlet));

      if (isValidDate && isValidOutlet && voucher.quota > 0) {
        // Hitung diskon
        if (voucher.discountType === 'percentage') {
          discount = (totalAmount * voucher.discountAmount) / 100;
        } else if (voucher.discountType === 'fixed') {
          discount = voucher.discountAmount;
        }

        // Update kuota voucher
        voucher.quota -= 1;
        if (voucher.quota === 0) voucher.isActive = false;
        await voucher.save();
      }
    }
  }

  return { discount, voucher };
}

// Fungsi cek promo manual sesuai kriteria konsumen
async function checkManualPromo(totalAmount, outletId, customerType = 'all') {
  if (!totalAmount || !outletId) {
    return { discount: 0, appliedPromo: null };
  }

  const now = new Date();

  // Cari promo aktif di outlet ini yang cocok dengan customer type
  const promo = await Promo.findOne({
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now },
    outlet: outletId,
    $or: [
      { customerType: 'all' },
      { customerType }
    ]
  });

  if (!promo) {
    return { discount: 0, appliedPromo: null };
  }

  let discount = 0;

  if (promo.discountType === 'percentage') {
    discount = totalAmount * (promo.discountAmount / 100);
  } else if (promo.discountType === 'fixed') {
    discount = Math.min(promo.discountAmount, totalAmount);
  }

  return {
    discount,
    appliedPromo: {
      promoId: promo._id,
      name: promo.name,
      discountAmount: discount,
      discountType: promo.discountType
    }
  };
}


// Fungsi proses pembayaran
async function processPayment({ order, paymentMethod, amount, source }) {
  if (paymentMethod === 'Cash' || paymentMethod === 'EDC') {
    return {
      status: 'Completed',
      method: paymentMethod
    };
  }

  // Midtrans Core API untuk mobile
  if (source === 'mobile') {
    const parameter = {
      transaction_details: {
        order_id: order.order_id,
        gross_amount: amount
      },
      payment_type: paymentMethod
    };

    return await coreApi.charge(parameter);
  }

  // Midtrans Snap untuk web
  if (source === 'web') {
    const snapData = {
      transaction_details: {
        order_id: order.order_id,
        gross_amount: amount
      }
    };

    return await snap.createTransaction(snapData);
  }

  throw new Error('Metode pembayaran tidak didukung');
}

// Socket.io setup
// io.on('connection', (socket) => {
//   console.log('Client terhubung');

//   socket.on('createOrder', async (orderData) => {
//     try {
//       const job = await orderQueue.add({
//         ...orderData,
//         socketId: socket.id
//       });

//       const result = await job.finished();
//       io.to(socket.id).emit('orderResponse', result);
//     } catch (error) {
//       io.to(socket.id).emit('orderError', error.message);
//     }
//   });
// });

// Helper untuk konversi satuan unit
// Utility function to convert quantities to a common unit
function convertToBaseUnit(quantity, unit) {
  switch (unit) {
    case 'kg':
      return quantity * 1000; // Convert kg to grams
    case 'grams':
      return quantity; // Grams remain as is
    case 'liters':
      return quantity * 1000; // Convert liters to mililiters
    case 'ml':
      return quantity; // Milliliters remain as is
    case 'pieces':
      return quantity; // Pieces remain as is
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

// Helper untuk pembayaran di aplikasi
export const charge = async (req, res) => {
  try {
    const { payment_type, transaction_details, bank_transfer } = req.body;
    const { order_id, gross_amount } = transaction_details;
    if (payment_type == 'cash') {
      const transaction_id = uuidv4();
      const transaction_time = new Date();
      const expiry_time = new Date(transaction_time.getTime() + 15 * 60000);
      // const qr_string = `ORDER:${order_id}|AMOUNT:${gross_amount}|TXN_ID:${transaction_id}`;
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


    // Lakukan permintaan API untuk memproses pembayaran
    const response = await coreApi.charge(chargeParams);
    const payment = new Payment({
      transaction_id: response.transaction_id,
      order_id: order_id,
      amount: gross_amount,
      method: payment_type,
      status: 'pending',
      fraud_status: response.fraud_status,
      transaction_time: response.transaction_time,
      expiry_time: response.expiry_time
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

// Konfirmasi Order oleh kasir
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
    const orders = await Order.find({ user_id: userId })
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

export const getOrderById = async (req, res) => {

  try {
    const orderId = req.params.orderId; // Mengambil ID order dari parameter URL
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required.' });
    }

    // Mencari pesanan berdasarkan ID
    const order = await Order.findById(orderId)
      .populate('items.menuItem') // Mengisi detail menu item (opsional)
      .populate('voucher'); // Mengisi detail voucher (opsional)

    const payment = await Payment.findOne({ order_id: orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const orderDetails = {
      order_id: order.order_id,
      user: order.user,
      cashier: order.cashier,
      items: order.items,
      amount: payment.amount,
      paymentstatus: payment.status,
      paymentMethod: payment.paymentMethod,
      orderType: order.orderType,
      tableNumber: order.tableNumber,
      voucher: order.voucher,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }

    res.status(200).json({ orderDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

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