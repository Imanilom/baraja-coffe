// controllers/refundController.js
import { RefundService } from '../services/refundService.js';

export const refundController = {
  // Request refund untuk single item
  async requestRefund(req, res) {
    try {
      const {
        orderId,
        orderItemId,
        refundQuantity,
        refundReason,
        refundReasonDescription
      } = req.body;

      const result = await RefundService.requestSingleItemRefund({
        orderId,
        orderItemId,
        refundQuantity,
        refundReason,
        refundReasonDescription,
        requestedBy: req.user.name,
        userId: req.user.id
      });

      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Approve refund
  async approveRefund(req, res) {
    try {
      const { refundId } = req.params;
      const { adminNotes } = req.body;

      const result = await RefundService.approveRefund(
        refundId, 
        req.user.id, 
        adminNotes
      );

      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Process refund
  async processRefund(req, res) {
    try {
      const { refundId } = req.params;
      const { refundMethod, bankDetails } = req.body;

      const result = await RefundService.processRefund(
        refundId, 
        refundMethod, 
        bankDetails
      );

      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Reject refund
  async rejectRefund(req, res) {
    try {
      const { refundId } = req.params;
      const { rejectionReason } = req.body;

      const result = await RefundService.rejectRefund(
        refundId,
        req.user.id,
        rejectionReason
      );

      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Check refundability
  async checkRefundability(req, res) {
    try {
      const { orderId, orderItemId } = req.params;

      const result = await RefundService.checkItemRefundability(
        orderId, 
        orderItemId
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get refund history
  async getRefundHistory(req, res) {
    try {
      const { orderId } = req.params;

      const refunds = await RefundService.getOrderRefundHistory(orderId);

      res.json({
        success: true,
        data: refunds
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};