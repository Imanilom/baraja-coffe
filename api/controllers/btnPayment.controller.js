import btnQrisService from '../services/btnQris.service.js';
import { Order } from '../models/order.model.js';
// import OrderWeb from '../models/OrderWeb.model.js'; // Model ini tidak ada
import Payment from '../models/Payment.model.js';

export const generateBtnQris = async (req, res) => {
  try {
    const { orderId, amount, isWebOrder } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ success: false, message: 'orderId and amount are required' });
    }

    // Convert orderId to string in case it's ObjectId
    const partnerReferenceNo = orderId.toString();

    // Call BTN Service to generate QR
    const result = await btnQrisService.generateQR(partnerReferenceNo, amount);

    // Note: The response usually contains qrContent, referenceNo, etc.
    // Example response structure from BTN (based on docs):
    // {
    //   "responseCode": "2004700",
    //   "responseMessage": "Request has been processed successfully",
    //   "referenceNo": "2020102977770000000009",
    //   "partnerReferenceNo": "2020102900000000000001",
    //   "qrContent": "00020101021226650013ID.CO.BTN...",
    //   ...
    // }

    if (result.responseCode && result.responseCode.startsWith('200')) {
      // Create Payment record
      const payment = new Payment({
        order_id: partnerReferenceNo,
        payment_code: partnerReferenceNo,
        transaction_id: result.referenceNo,
        method: 'BTN_QRIS',
        status: 'pending',
        paymentType: 'Full',
        amount: parseFloat(amount),
        totalAmount: parseFloat(amount),
        remainingAmount: parseFloat(amount),
        raw_response: result
      });
      await payment.save();

      // Update the order with payment reference so we know it's pending BTN QRIS
      // const OrderModel = isWebOrder ? OrderWeb : Order;
      const OrderModel = Order; // Fallback ke Order karena OrderWeb tidak ditemukan
      await OrderModel.findByIdAndUpdate(orderId, {
        paymentStatus: 'pending',
        paymentMethod: 'BTN_QRIS',
        'paymentDetails.referenceNo': result.referenceNo,
        'paymentDetails.qrContent': result.qrContent
      });

      return res.status(200).json({
        success: true,
        data: {
          qrString: result.qrContent,
          referenceNo: result.referenceNo,
          amount: amount,
          rawResponse: result
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.responseMessage || 'Failed to generate QRIS',
        data: result
      });
    }

  } catch (error) {
    console.error('Error generating BTN QRIS:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const queryBtnPayment = async (req, res) => {
  try {
    const { orderId, referenceNo } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const partnerReferenceNo = orderId.toString();

    const result = await btnQrisService.queryPayment(partnerReferenceNo, referenceNo);

    // 00 - Success, 01 - Initiated, 02 - Paying, 03 - Pending, etc.
    if (result.responseCode && result.responseCode.startsWith('200')) {
      return res.status(200).json({
        success: true,
        status: result.latestTransactionStatus, // "00" is success
        statusDesc: result.transactionStatusDesc,
        data: result
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.responseMessage || 'Failed to query payment status',
        data: result
      });
    }
  } catch (error) {
    console.error('Error querying BTN payment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const cancelBtnPayment = async (req, res) => {
  try {
    const { originalPartnerReferenceNo, amount, reason, generateTime, terminalId, originalReferenceNo } = req.body;

    if (!originalPartnerReferenceNo || !amount || !reason || !generateTime) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const result = await btnQrisService.cancelPayment(
      originalPartnerReferenceNo.toString(),
      amount,
      reason,
      generateTime,
      terminalId,
      originalReferenceNo
    );

    if (result.responseCode && result.responseCode.startsWith('200')) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return res.status(400).json({ success: false, message: result.responseMessage || 'Failed to cancel payment', data: result });
    }
  } catch (error) {
    console.error('Error canceling BTN payment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const refundBtnPayment = async (req, res) => {
  try {
    const { originalPartnerReferenceNo, partnerRefundNo, refundAmount, reason, generateTime, terminalId, originalReferenceNo } = req.body;

    if (!originalPartnerReferenceNo || !partnerRefundNo || !refundAmount || !reason || !generateTime) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const result = await btnQrisService.refundPayment(
      originalPartnerReferenceNo.toString(),
      partnerRefundNo.toString(),
      refundAmount,
      reason,
      generateTime,
      terminalId,
      originalReferenceNo
    );

    if (result.responseCode && result.responseCode.startsWith('200')) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return res.status(400).json({ success: false, message: result.responseMessage || 'Failed to refund payment', data: result });
    }
  } catch (error) {
    console.error('Error refunding BTN payment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
