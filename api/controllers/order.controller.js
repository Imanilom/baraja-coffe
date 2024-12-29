import { Order } from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';

import { EWallet, Card, QRCode } from '../utils/xenditConfig.js';

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
      phoneNumber 
    } = req.body;

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
    } 
    else if (paymentMethod === 'E-Wallet') {
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required for E-Wallet payment' });
      }

      // E-Wallet Payment via Xendit
      const eWallet = new EWallet();
      paymentResult = await eWallet.createPayment({
        externalID: `order-${order._id}`,
        amount: totalPrice,
        phone: phoneNumber,
        ewalletType: paymentMethod.toUpperCase(), // 'OVO', 'DANA', 'SHOPEEPAY', etc.
      });
    } 
    else if (paymentMethod === 'Card') {
      if (!cardDetails || !cardDetails.cardHolderName || !cardDetails.cardNumber || !cardDetails.expirationDate || !cardDetails.cvv) {
        return res.status(400).json({ message: 'Card details are required for card payment' });
      }

      // Card Payment via Xendit
      const card = new Card();
      paymentResult = await card.createCharge({
        token: await card.createToken(cardDetails), // Generate token for card
        externalID: `order-${order._id}`,
        amount: totalPrice,
      });
    } 
    else if (paymentMethod === 'Debit') {
      if (!cardDetails || !cardDetails.cardHolderName || !cardDetails.cardNumber || !cardDetails.expirationDate || !cardDetails.cvv) {
        return res.status(400).json({ message: 'Card details are required for debit payment' });
      }

      // Debit Payment via Xendit
      const card = new Card();
      paymentResult = await card.createCharge({
        token: await card.createToken(cardDetails), // Generate token for debit card
        externalID: `order-${order._id}`,
        amount: totalPrice,
      });
    } 
    else {
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
