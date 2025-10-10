// services/refundService.js
import { Order } from '../models/order.model.js';
import { Refund } from '../models/Refund.model.js';
import Payment from '../models/Payment.model.js';
import mongoose from 'mongoose';

export class RefundService {
  // Generate unique refund ID
  static generateRefundId() {
    return `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Request refund untuk satu item
  static async requestSingleItemRefund({
    orderId,
    orderItemId,
    refundQuantity,
    refundReason,
    refundReasonDescription,
    requestedBy,
    userId = null
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Cari order
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new Error('Order tidak ditemukan');
      }

      // Cari item yang ingin di-refund
      const orderItem = order.items.id(orderItemId);
      if (!orderItem) {
        throw new Error('Item tidak ditemukan dalam order');
      }

      // Validasi quantity
      if (refundQuantity > orderItem.quantity) {
        throw new Error('Quantity refund melebihi quantity order');
      }

      // Cek status kitchen
      if (this.isKitchenStatusNonRefundable(orderItem.kitchenStatus)) {
        throw new Error(`Tidak dapat refund item dengan status: ${orderItem.kitchenStatus}`);
      }

      // Hitung refund amount
      const unitPrice = orderItem.subtotal / orderItem.quantity;
      const refundAmount = unitPrice * refundQuantity;

      // Buat refund record
      const refund = new Refund({
        refundId: this.generateRefundId(),
        order_id: order.order_id,
        order: orderId,
        user_id: userId,
        requestedBy,
        refundItems: [{
          orderItemId,
          menuItem: orderItem.menuItem,
          menuItemName: await this.getMenuItemName(orderItem.menuItem),
          quantity: orderItem.quantity,
          refundQuantity,
          unitPrice,
          subtotal: orderItem.subtotal,
          refundAmount,
          addons: orderItem.addons,
          toppings: orderItem.toppings,
          notes: orderItem.notes,
          refundReason,
          refundReasonDescription,
          kitchenStatus: orderItem.kitchenStatus
        }],
        totalRefundAmount: refundAmount,
        originalPaymentMethod: order.paymentMethod
      });

      await refund.save({ session });

      // Update order status atau tambahkan refund flag
      await this.updateOrderRefundStatus(order, session);

      await session.commitTransaction();
      
      return {
        success: true,
        refund,
        message: 'Permintaan refund berhasil diajukan'
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Approve refund
  static async approveRefund(refundId, processedBy, adminNotes = '') {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const refund = await Refund.findById(refundId).session(session);
      if (!refund) {
        throw new Error('Refund tidak ditemukan');
      }

      // Cek apakah semua item bisa di-refund
      for (const item of refund.refundItems) {
        if (this.isKitchenStatusNonRefundable(item.kitchenStatus)) {
          throw new Error(`Item "${item.menuItemName}" tidak dapat di-refund karena status: ${item.kitchenStatus}`);
        }
      }

      // Update status refund
      refund.status = 'approved';
      refund.processedBy = processedBy;
      refund.adminNotes = adminNotes;
      refund.updatedAt = new Date();

      // Update status setiap item
      refund.refundItems.forEach(item => {
        item.status = 'approved';
        item.updatedAt = new Date();
      });

      await refund.save({ session });

      await session.commitTransaction();
      
      return {
        success: true,
        refund,
        message: 'Refund berhasil disetujui'
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Process refund (setelah approve)
  static async processRefund(refundId, refundMethod, bankDetails = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const refund = await Refund.findById(refundId).session(session);
      if (!refund) {
        throw new Error('Refund tidak ditemukan');
      }

      if (refund.status !== 'approved') {
        throw new Error('Refund harus disetujui terlebih dahulu');
      }

      // Process payment refund berdasarkan method
      const paymentResult = await this.processPaymentRefund(refund, refundMethod, bankDetails);

      // Update refund status
      refund.status = 'processed';
      refund.refundMethod = refundMethod;
      refund.processedAt = new Date();
      
      if (bankDetails) {
        refund.bankAccount = bankDetails;
      }

      // Update item status
      refund.refundItems.forEach(item => {
        item.status = 'processed';
        item.processedAt = new Date();
      });

      await refund.save({ session });

      // Update order items quantity atau status
      await this.updateOrderAfterRefund(refund, session);

      await session.commitTransaction();
      
      return {
        success: true,
        refund,
        paymentResult,
        message: 'Refund berhasil diproses'
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Reject refund
  static async rejectRefund(refundId, processedBy, rejectionReason) {
    const refund = await Refund.findById(refundId);
    if (!refund) {
      throw new Error('Refund tidak ditemukan');
    }

    refund.status = 'rejected';
    refund.processedBy = processedBy;
    refund.rejectionReason = rejectionReason;
    refund.processedAt = new Date();

    // Update item status
    refund.refundItems.forEach(item => {
      item.status = 'rejected';
      item.processedAt = new Date();
    });

    await refund.save();

    return {
      success: true,
      refund,
      message: 'Refund berhasil ditolak'
    };
  }

  // Helper methods
  static isKitchenStatusNonRefundable(kitchenStatus) {
    const nonRefundableStatuses = ['cooking', 'ready', 'served'];
    return nonRefundableStatuses.includes(kitchenStatus);
  }

  static async getMenuItemName(menuItemId) {
    // Implementasi untuk mendapatkan nama menu item
    // Anda perlu menyesuaikan dengan model MenuItem Anda
    const menuItem = await mongoose.model('MenuItem').findById(menuItemId);
    return menuItem ? menuItem.name : 'Unknown Item';
  }

  static async updateOrderRefundStatus(order, session) {
    // Tambahkan flag atau update status order untuk menandai ada refund
    order.hasPendingRefund = true;
    await order.save({ session });
  }

  static async processPaymentRefund(refund, refundMethod, bankDetails) {
    // Implementasi refund payment berdasarkan method
    // Ini akan tergantung pada payment gateway yang Anda gunakan
    
    const refundData = {
      refundId: refund.refundId,
      orderId: refund.order_id,
      amount: refund.totalRefundAmount,
      method: refundMethod,
      bankDetails,
      originalPaymentMethod: refund.originalPaymentMethod
    };

    // Simulasi proses refund payment
    // Dalam implementasi nyata, ini akan memanggil API payment gateway
    console.log('Processing payment refund:', refundData);

    return {
      paymentRefundId: `PAYREF-${Date.now()}`,
      status: 'success',
      processedAt: new Date()
    };
  }

  static async updateOrderAfterRefund(refund, session) {
    const order = await Order.findById(refund.order).session(session);
    
    for (const refundItem of refund.refundItems) {
      const orderItem = order.items.id(refundItem.orderItemId);
      
      if (orderItem) {
        if (refundItem.refundQuantity === orderItem.quantity) {
          // Hapus item jika semua quantity di-refund
          order.items.pull({ _id: refundItem.orderItemId });
        } else {
          // Kurangi quantity
          orderItem.quantity -= refundItem.refundQuantity;
          orderItem.subtotal = (orderItem.subtotal / orderItem.quantity) * orderItem.quantity;
        }
      }
    }

    // Recalculate order totals
    await this.recalculateOrderTotals(order, session);
    
    // Check if all refunds are processed
    const pendingRefunds = await Refund.countDocuments({
      order: refund.order,
      status: { $in: ['pending', 'approved'] }
    }).session(session);

    order.hasPendingRefund = pendingRefunds > 0;
    await order.save({ session });
  }

  static async recalculateOrderTotals(order, session) {
    // Recalculate order totals setelah refund
    const totalBeforeDiscount = order.items.reduce((total, item) => total + item.subtotal, 0);
    
    // Apply discounts, taxes, etc.
    // Implementasi sesuai dengan logic bisnis Anda
    
    order.totalBeforeDiscount = totalBeforeDiscount;
    // ... recalculate other totals
    
    await order.save({ session });
  }

  // Get refund history untuk order
  static async getOrderRefundHistory(orderId) {
    return await Refund.find({ order: orderId })
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  // Check if item can be refunded
  static async checkItemRefundability(orderId, orderItemId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order tidak ditemukan');
    }

    const orderItem = order.items.id(orderItemId);
    if (!orderItem) {
      throw new Error('Item tidak ditemukan');
    }

    const isRefundable = !this.isKitchenStatusNonRefundable(orderItem.kitchenStatus);
    const maxRefundQuantity = isRefundable ? orderItem.quantity : 0;

    return {
      isRefundable,
      maxRefundQuantity,
      kitchenStatus: orderItem.kitchenStatus,
      itemName: await this.getMenuItemName(orderItem.menuItem),
      currentQuantity: orderItem.quantity
    };
  }
}