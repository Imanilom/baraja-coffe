import { Order } from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';
import { MenuItem } from "../models/MenuItem.model.js";
import { Topping } from "../models/Topping.model.js";
import  AddOn from "../models/Addons.model.js";
import { RawMaterial } from "../models/RawMaterial.model.js";
import midtransClient from 'midtrans-client';

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
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Stock Validation Logic
const validateStock = async (items) => {
  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItem).populate('rawMaterials');
    if (!menuItem) throw new Error(`Menu item not found: ${item.menuItem}`);

    // Validate main ingredients
    for (const material of menuItem.rawMaterials) {
      const required = material.quantity * item.quantity;
      const stock = await RawMaterial.findOne({ materialId: material.materialId });
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
        const stock = await RawMaterial.findOne({ materialId: material.materialId });
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
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem items.toppings items.addons');

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Restock materials
    for (const item of order.items) {
      const menuItem = await MenuItem.findById(item.menuItem).populate('rawMaterials');
      for (const material of menuItem.rawMaterials) {
        await updateStorage(material.materialId, -material.quantity * item.quantity);
      }

      for (const toppingId of item.toppings) {
        const topping = await Topping.findById(toppingId).populate('rawMaterials');
        for (const material of topping.rawMaterials) {
          await updateStorage(material.materialId, -material.quantityRequired * item.quantity);
        }
      }
    }

    order.status = "Canceled";
    await order.save();

    res.status(200).json({ success: true, message: "Order canceled", order });
  } catch (error) {
    console.error('Cancel Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Order Controller
export const createOrderAndPayment = async (req, res) => {
  try {
    const { user, items, totalPrice, orderType, deliveryAddress, tableNumber, paymentMethod, phoneNumber } = req.body;

    // Validate stock availability
    await validateStock(items);

    // Create order record
    const order = new Order({
      user,
      items,
      totalPrice,
      orderType,
      deliveryAddress,
      tableNumber,
      paymentMethod,
      status: 'Pending'
    });
    await order.save();

    // Handle cash payment
    if (paymentMethod.toLowerCase() === 'cash') {
      const payment = new Payment({
        order: order._id,
        amount: totalPrice,
        paymentMethod,
        status: 'Pending',
      });
      await payment.save();
      
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
    await payment.save();

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
      };
    } else if (['ovo', 'gopay', 'shopeepay'].includes(paymentMethod.toLowerCase())) {
      response.paymentDetails.deepLink = paymentResult.actions.find(a => a.name === 'deeplink-redirect')?.url;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Order Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      errorDetails: error.ApiResponse || null 
    });
  }
};

// Midtrans Webhook Handler
export const handleMidtransNotification = async (req, res) => {
  try {
    const notification = req.body;
    const statusResponse = await snap.transaction.notification(notification);
    
    // Validate critical parameters
    if (!statusResponse.order_id || !statusResponse.transaction_status) {
      return res.status(400).json({ message: 'Invalid notification' });
    }

    // Find related payment
    const payment = await Payment.findOne({ 
      'midtransResponse.order_id': statusResponse.order_id 
    }).populate('order');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Determine new status
    let newStatus;
    switch (statusResponse.transaction_status.toLowerCase()) {
      case 'capture':
        newStatus = statusResponse.fraud_status === 'challenge' ? 'Challenge' : 'Success';
        break;
      case 'settlement':
        newStatus = 'Success';
        break;
      case 'pending':
        newStatus = 'Pending';
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        newStatus = 'Failed';
        break;
      default:
        newStatus = 'Pending';
    }

    // Update payment status
    payment.status = newStatus;
    await payment.save();

    // Update order status and process stock
    if (newStatus === 'Success' && payment.order.status !== 'Completed') {
      await processOrderItems(payment.order.items);
      payment.order.status = 'Completed';
      await payment.order.save();
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get User Orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate('items.menuItem')
      .populate('items.toppings')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};