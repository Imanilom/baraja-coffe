import { Order } from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';
import { MenuItem } from "../models/MenuItem.model.js";
import { Topping } from "../models/Topping.model.js";
import  AddOn from "../models/Addons.model.js";
import { RawMaterial } from "../models/RawMaterial.model.js";

import { EWallet, Card } from '../utils/xenditConfig.js';

// Helper function to update raw material storage
const updateStorage = async (materialId, quantity) => {
  const storage = await RawMaterial.findOne({ materialId });
  if (!storage || storage.quantity < quantity) {
    throw new Error(`Insufficient stock for raw material: ${materialId}`);
  }
  storage.quantity -= quantity;
  await storage.save();
};

// Process Order Items
const processOrderItems = async (items) => {
  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItem);
    if (!menuItem) {
      throw new Error(`Menu item not found: ${item.menuItem}`);
    }

    // Update raw materials for the menu item
    for (const material of menuItem.rawMaterials) {
      const requiredQuantity = material.quantity * item.quantity;
      await updateStorage(material.materialId, requiredQuantity);
    }

       // Deduct raw materials for toppings
      for (const toppingId of item.toppings) {
        const topping = await Topping.findById(toppingId).populate("rawMaterials");
        if (!topping) {
          throw new Error(`Topping not found: ${toppingId}`);
        }
        for (const material of topping.rawMaterials) {
          const requiredQuantity = material.quantityRequired * item.quantity;
          await updateStorage(material.materialId, requiredQuantity);
        }
      }

    // Check addons and adjust cup usage
    for (const addonId of item.addons) {
      const addon = await AddOn.findById(addonId);
      if (addon && addon.adjustCupSize) {
        const cupsToReduce = addon.adjustCupSize === 'large' ? 1 : 0.5;
        const cupMaterial = await RawMaterial.findOne({ name: 'Cup' });
        if (!cupMaterial || cupMaterial.quantity < cupsToReduce * item.quantity) {
          throw new Error('Insufficient cups in stock');
        }
        cupMaterial.quantity -= cupsToReduce * item.quantity;
        await cupMaterial.save();
      }
    }
  }
};

// Cancel Order and Restock Materials
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.menuItem items.toppings items.addons");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Restock materials
    for (const item of order.items) {
      const menuItem = await MenuItem.findById(item.menuItem).populate("rawMaterials");
      for (const material of menuItem.rawMaterials) {
        const quantityToRestock = material.quantity * item.quantity;
        await updateStorage(material.materialId, -quantityToRestock);
      }

      for (const toppingId of item.toppings) {
        const topping = await Topping.findById(toppingId).populate("rawMaterials");
        for (const material of topping.rawMaterials) {
          const quantityToRestock = material.quantityRequired * item.quantity;
          await updateStorage(material.materialId, -quantityToRestock);
        }
      }
    }

    order.status = "Canceled";
    await order.save();

    res.status(200).json({ success: true, message: "Order canceled and materials restocked", order });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};


// Create Order and Initialize Payment
export const createOrderAndPayment = async (req, res) => {
  try {
    const {
      user,
      items,
      totalPrice,
      orderType,
      deliveryAddress,
      tableNumber,
      paymentMethod,
      cardDetails,
      phoneNumber,
    } = req.body;

    // Validate and process order items
    await processOrderItems(items);

    // Create Order
    const order = new Order({
      user,
      items,
      totalPrice,
      orderType,
      deliveryAddress,
      tableNumber,
      paymentMethod,
    });
    await order.save();

    let paymentResult;
    let paymentStatus = 'Pending';

    // Handle Payment Using Xendit
    if (paymentMethod === 'Cash') {
      paymentResult = { message: 'Payment will be made in cash upon delivery or at the counter.' };
      paymentStatus = 'Success'; // Assume cash payment is always successful
    } else if (paymentMethod === 'E-Wallet') {
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required for E-Wallet payment' });
      }
      const eWallet = new EWallet();
      paymentResult = await eWallet.createPayment({
        externalID: `order-${order._id}`,
        amount: totalPrice,
        phone: phoneNumber,
        ewalletType: paymentMethod.toUpperCase(),
      });
    } else if (paymentMethod === 'Card') {
      if (!cardDetails || !cardDetails.cardHolderName || !cardDetails.cardNumber || !cardDetails.expirationDate || !cardDetails.cvv) {
        return res.status(400).json({ message: 'Card details are required for card payment' });
      }
      const card = new Card();
      paymentResult = await card.createCharge({
        token: await card.createToken(cardDetails),
        externalID: `order-${order._id}`,
        amount: totalPrice,
      });
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Save Payment Data
    const payment = new Payment({
      order: order._id,
      amount: totalPrice,
      paymentMethod,
      status: paymentStatus,
    });
    await payment.save();

    res.status(200).json({
      order,
      payment,
      message: paymentResult.message,
      paymentLink: paymentResult.actions?.mobile_deeplink || paymentResult.qr_string,
      transactionId: paymentResult.id || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create order and payment', error });
  }
};



// Update Payment Status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.status = status;
    await payment.save();

    // Update Order Status if Payment is Successful
    if (status === 'Success') {
      const order = await Order.findById(payment.order);
      if (order) {
        order.status = 'Completed';
        await order.save();
      }
    }

    res.status(200).json({ message: 'Payment status updated', payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update payment status', error });
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ user: userId }).populate('items.menuItem').populate('items.toppings');

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};
