import { Order } from '../../models/order.model.js';
import Payment from '../../models/Payment.model.js';
import {
  processOrderItems,
  getSafeMenuItemData,
  getProductSummaryFromOrders
} from '../../utils/menuItemHelper.js';

class DailyProfitController {
  /**
   * Get daily profit summary for a specific date - VERSION AMAN
   */
  async getDailyProfit(req, res) {
    try {
      const { date, outletId, includeDeleted = 'true' } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required (format: YYYY-MM-DD)'
        });
      }

      // Parse date and create date range for WIB timezone
      const targetDate = new Date(date);
      const startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);

      // Build query filter
      const filter = {
        createdAtWIB: {
          $gte: startDate,
          $lte: endDate
        },
        status: { $in: ['Completed', 'OnProcess'] }
      };

      // Add outlet filter if provided
      if (outletId && outletId !== 'all') {
        filter.outlet = outletId;
      }

      // Query orders TANPA populate yang risky - gunakan data denormalized
      const orders = await Order.find(filter)
        .sort({ createdAtWIB: -1 })
        .lean();

      // Get all successful payments for these orders
      const orderIds = orders.map(order => order.order_id);
      const payments = await Payment.find({
        order_id: { $in: orderIds },
        status: 'settlement'
      }).lean();

      // Create payment map for quick lookup
      const paymentMap = {};
      payments.forEach(payment => {
        if (!paymentMap[payment.order_id]) {
          paymentMap[payment.order_id] = [];
        }
        paymentMap[payment.order_id].push(payment);
      });

      // Calculate profit metrics
      let totalRevenue = 0;
      let totalTax = 0;
      let totalServiceFee = 0;
      let totalDiscounts = 0;
      let totalNetProfit = 0;
      let totalOrders = 0;
      let totalItemsSold = 0;

      const orderDetails = [];

      orders.forEach(order => {
        const orderPayments = paymentMap[order.order_id] || [];
        const totalPaid = orderPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Only count orders with successful payments
        if (totalPaid > 0) {
          const orderRevenue = order.grandTotal || 0;
          const orderTax = order.totalTax || 0;
          const orderServiceFee = order.totalServiceFee || 0;
          const orderDiscounts = (order.discounts?.autoPromoDiscount || 0) +
            (order.discounts?.manualDiscount || 0) +
            (order.discounts?.voucherDiscount || 0);

          const orderNetProfit = orderRevenue - orderDiscounts;

          totalRevenue += orderRevenue;
          totalTax += orderTax;
          totalServiceFee += orderServiceFee;
          totalDiscounts += orderDiscounts;
          totalNetProfit += orderNetProfit;
          totalOrders++;

          // Count items sold menggunakan data yang aman
          const itemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          totalItemsSold += itemsCount;

          // Process items dengan handling untuk deleted menu items
          const processedItems = processOrderItems(order.items);

          // Filter items berdasarkan includeDeleted parameter
          const filteredItems = includeDeleted === 'true'
            ? processedItems
            : processedItems.filter(item => !item.isMenuDeleted);

          orderDetails.push({
            order_id: order.order_id,
            createdAt: order.createdAtWIB,
            user: order.user,
            orderType: order.orderType,
            paymentMethod: order.paymentMethod,
            revenue: orderRevenue,
            tax: orderTax,
            serviceFee: orderServiceFee,
            discounts: orderDiscounts,
            netProfit: orderNetProfit,
            itemsCount: itemsCount,
            status: order.status,
            items: filteredItems,
            payments: orderPayments.map(p => ({
              method: p.method,
              amount: p.amount,
              status: p.status
            }))
          });
        }
      });

      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalNetProfit / totalOrders : 0;

      // Payment method breakdown
      const paymentMethodBreakdown = {};
      payments.forEach(payment => {
        const method = payment.method || 'Unknown';
        paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + (payment.amount || 0);
      });

      // Order type breakdown
      const orderTypeBreakdown = {};
      orderDetails.forEach(order => {
        const type = order.orderType || 'Unknown';
        orderTypeBreakdown[type] = (orderTypeBreakdown[type] || 0) + order.netProfit;
      });

      const result = {
        date: date,
        outlet: outletId || 'All Outlets',
        summary: {
          totalRevenue,
          totalTax,
          totalServiceFee,
          totalDiscounts,
          totalNetProfit,
          totalOrders,
          totalItemsSold,
          averageOrderValue: Math.round(averageOrderValue)
        },
        breakdown: {
          paymentMethods: paymentMethodBreakdown,
          orderTypes: orderTypeBreakdown
        },
        orders: orderDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        metadata: {
          includeDeleted: includeDeleted === 'true',
          totalProcessedOrders: orders.length,
          dataSource: 'denormalized_safe'
        }
      };

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error in getDailyProfit:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get product sales report yang aman terhadap deleted items
   */
  async getProductSalesReport(req, res) {
    try {
      const { startDate, endDate, outletId, includeDeleted = 'true' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate parameters are required (format: YYYY-MM-DD)'
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filter = {
        createdAtWIB: { $gte: start, $lte: end },
        status: { $in: ['Completed', 'OnProcess'] }
      };

      if (outletId && outletId !== 'all') {
        filter.outlet = outletId;
      }

      const orders = await Order.find(filter).lean();

      // Get product summary menggunakan helper yang aman
      const productSummary = getProductSummaryFromOrders(orders);

      // Filter berdasarkan includeDeleted parameter
      const filteredProducts = includeDeleted === 'true'
        ? productSummary
        : productSummary.filter(product => !product.isDeleted);

      // Sort by total revenue descending
      const sortedProducts = filteredProducts.sort((a, b) => b.totalRevenue - a.totalRevenue);

      res.json({
        success: true,
        data: {
          products: sortedProducts,
          summary: {
            totalProducts: sortedProducts.length,
            totalRevenue: sortedProducts.reduce((sum, product) => sum + product.totalRevenue, 0),
            totalQuantity: sortedProducts.reduce((sum, product) => sum + product.totalQuantity, 0),
            activeProducts: sortedProducts.filter(p => p.isActive && !p.isDeleted).length,
            deletedProducts: sortedProducts.filter(p => p.isDeleted).length
          },
          period: {
            startDate,
            endDate,
            outlet: outletId || 'All Outlets'
          }
        }
      });

    } catch (error) {
      console.error('Error in getProductSalesReport:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get daily profit for a date range
   */
  async getDailyProfitRange(req, res) {
    try {
      const { startDate, endDate, outletId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate parameters are required (format: YYYY-MM-DD)'
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Build query filter
      const filter = {
        createdAtWIB: {
          $gte: start,
          $lte: end
        },
        status: { $in: ['Completed', 'OnProcess'] }
      };

      if (outletId && outletId !== 'all') {
        filter.outlet = outletId;
      }

      // Gunakan data denormalized tanpa populate
      const orders = await Order.find(filter).lean();

      const orderIds = orders.map(order => order.order_id);

      const payments = await Payment.find({
        order_id: { $in: orderIds },
        status: 'settlement'
      }).lean();

      // Create payment map
      const paymentMap = {};
      payments.forEach(payment => {
        if (!paymentMap[payment.order_id]) {
          paymentMap[payment.order_id] = [];
        }
        paymentMap[payment.order_id].push(payment);
      });

      // Group by date
      const dailyProfits = {};

      orders.forEach(order => {
        const orderPayments = paymentMap[order.order_id] || [];
        const totalPaid = orderPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        if (totalPaid > 0) {
          const orderDate = order.createdAtWIB.toISOString().split('T')[0];
          const orderRevenue = order.grandTotal || 0;
          const orderDiscounts = (order.discounts?.autoPromoDiscount || 0) +
            (order.discounts?.manualDiscount || 0) +
            (order.discounts?.voucherDiscount || 0);
          const orderNetProfit = orderRevenue - orderDiscounts;

          if (!dailyProfits[orderDate]) {
            dailyProfits[orderDate] = {
              date: orderDate,
              totalRevenue: 0,
              totalNetProfit: 0,
              totalOrders: 0,
              totalItemsSold: 0
            };
          }

          dailyProfits[orderDate].totalRevenue += orderRevenue;
          dailyProfits[orderDate].totalNetProfit += orderNetProfit;
          dailyProfits[orderDate].totalOrders += 1;

          // Count items - ini akan bekerja bahkan jika menuItems dihapus
          const itemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          dailyProfits[orderDate].totalItemsSold += itemsCount;
        }
      });

      // Convert to array and sort by date
      const result = Object.values(dailyProfits).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error in getDailyProfitRange:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get today's profit summary
   */
  async getTodayProfit(req, res) {
    try {
      const { outletId, includeDeleted } = req.query;

      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // Create mock request object
      const mockReq = {
        query: {
          date: todayString,
          outletId: outletId,
          includeDeleted: includeDeleted
        }
      };

      return this.getDailyProfit(mockReq, res);
    } catch (error) {
      console.error('Error in getTodayProfit:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get detailed order report dengan handling deleted items
   */
  async getOrderDetailReport(req, res) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
      }

      // Find order tanpa populate yang risky
      const order = await Order.findOne({ order_id: orderId }).lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Get payments for this order
      const payments = await Payment.find({
        order_id: orderId,
        status: 'settlement'
      }).lean();

      // Process items dengan handling untuk deleted menu items
      const processedItems = processOrderItems(order.items);

      const result = {
        order_id: order.order_id,
        createdAt: order.createdAtWIB,
        user: order.user,
        orderType: order.orderType,
        paymentMethod: order.paymentMethod,
        status: order.status,
        tableNumber: order.tableNumber,
        outlet: order.outlet,

        // Financial details
        revenue: order.grandTotal || 0,
        tax: order.totalTax || 0,
        serviceFee: order.totalServiceFee || 0,
        discounts: (order.discounts?.autoPromoDiscount || 0) +
          (order.discounts?.manualDiscount || 0) +
          (order.discounts?.voucherDiscount || 0),
        netProfit: (order.grandTotal || 0) -
          ((order.discounts?.autoPromoDiscount || 0) +
            (order.discounts?.manualDiscount || 0) +
            (order.discounts?.voucherDiscount || 0)),

        // Processed items
        items: processedItems,

        // Payments
        payments: payments.map(p => ({
          method: p.method,
          amount: p.amount,
          status: p.status,
          paymentDate: p.paymentDate
        })),

        // Metadata
        metadata: {
          totalItems: processedItems.length,
          deletedItemsCount: processedItems.filter(item => item.isMenuDeleted).length,
          dataSource: 'denormalized_safe'
        }
      };

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error in getOrderDetailReport:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get profit statistics for dashboard
   */
  async getProfitDashboard(req, res) {
    try {
      const { outletId, days = 7 } = req.query;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Format dates for the query
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];

      // Use getDailyProfitRange method
      const filter = {
        createdAtWIB: {
          $gte: startDate,
          $lte: endDate
        },
        status: { $in: ['Completed', 'OnProcess'] }
      };

      if (outletId && outletId !== 'all') {
        filter.outlet = outletId;
      }

      const orders = await Order.find(filter).lean();
      const orderIds = orders.map(order => order.order_id);

      const payments = await Payment.find({
        order_id: { $in: orderIds },
        status: 'settlement'
      }).lean();

      // Create payment map
      const paymentMap = {};
      payments.forEach(payment => {
        if (!paymentMap[payment.order_id]) {
          paymentMap[payment.order_id] = [];
        }
        paymentMap[payment.order_id].push(payment);
      });

      // Calculate dashboard metrics
      let totalRevenue = 0;
      let totalOrders = 0;
      let totalItemsSold = 0;
      const dailyData = {};

      orders.forEach(order => {
        const orderPayments = paymentMap[order.order_id] || [];
        const totalPaid = orderPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        if (totalPaid > 0) {
          const orderDate = order.createdAtWIB.toISOString().split('T')[0];
          const orderRevenue = order.grandTotal || 0;
          const orderDiscounts = (order.discounts?.autoPromoDiscount || 0) +
            (order.discounts?.manualDiscount || 0) +
            (order.discounts?.voucherDiscount || 0);
          const orderNetProfit = orderRevenue - orderDiscounts;

          totalRevenue += orderNetProfit;
          totalOrders += 1;

          // Count items
          const itemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          totalItemsSold += itemsCount;

          // Daily data
          if (!dailyData[orderDate]) {
            dailyData[orderDate] = {
              date: orderDate,
              revenue: 0,
              orders: 0,
              items: 0
            };
          }
          dailyData[orderDate].revenue += orderNetProfit;
          dailyData[orderDate].orders += 1;
          dailyData[orderDate].items += itemsCount;
        }
      });

      const dailyDataArray = Object.values(dailyData).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      );

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      res.json({
        success: true,
        data: {
          summary: {
            totalRevenue: Math.round(totalRevenue),
            totalOrders,
            totalItemsSold,
            averageOrderValue: Math.round(averageOrderValue)
          },
          dailyData: dailyDataArray,
          period: {
            days,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            outlet: outletId || 'All Outlets'
          }
        }
      });

    } catch (error) {
      console.error('Error in getProfitDashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

// EKSPOR YANG BENAR - Pastikan ini ada di akhir file
const dailyProfitController = new DailyProfitController();
export default dailyProfitController;