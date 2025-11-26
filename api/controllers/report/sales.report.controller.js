import { Order } from '../../models/order.model.js';
import Payment from '../../models/Payment.model.js';

class DailyProfitController {
  /**
   * Get daily profit summary for a specific date
   */
  async getDailyProfit(req, res) {
    try {
      const { date, outletId } = req.query;
      
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
        status: { $in: ['Completed', 'OnProcess'] } // Only completed and active orders
      };

      // Add outlet filter if provided
      if (outletId) {
        filter.outlet = outletId;
      }

      // Get all orders for the date - modified populate to handle deleted menu items
      const orders = await Order.find(filter)
        .populate({
          path: 'items.menuItem',
          model: 'MenuItem',
          // Just get the name and price, don't fail if menuItem is deleted
          select: 'name price isActive',
          // This ensures that even if menuItem is deleted, the order won't fail
          options: { allowNull: true }
        })
        .lean();

      // Get all successful payments for these orders
      const orderIds = orders.map(order => order.order_id);
      const payments = await Payment.find({
        order_id: { $in: orderIds },
        status: 'settlement' // Only settled payments
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
        const totalPaid = orderPayments.reduce((sum, payment) => sum + payment.amount, 0);

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

          // Count items sold and handle deleted menu items
          const itemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          totalItemsSold += itemsCount;

          // Process items with handling for deleted menu items
          const processedItems = order.items.map(item => {
            const menuItem = item.menuItem;
            
            // If menuItem is null or deleted, create a fallback object
            if (!menuItem) {
              return {
                menuItem: {
                  _id: null,
                  name: 'Menu Item Deleted',
                  price: item.price || 0,
                  isActive: false
                },
                quantity: item.quantity,
                price: item.price || 0,
                notes: item.notes
              };
            }

            return {
              menuItem: {
                _id: menuItem._id,
                name: menuItem.name || 'Unknown Menu Item',
                price: menuItem.price || item.price || 0,
                isActive: menuItem.isActive !== false // Default to true if not specified
              },
              quantity: item.quantity,
              price: item.price || menuItem.price || 0,
              notes: item.notes
            };
          });

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
            items: processedItems, // Include processed items in response
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
        paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + payment.amount;
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
        orders: orderDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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

      if (outletId) {
        filter.outlet = outletId;
      }

      // Modified to handle deleted menu items
      const orders = await Order.find(filter)
        .populate({
          path: 'items.menuItem',
          model: 'MenuItem',
          select: 'name price isActive',
          options: { allowNull: true }
        })
        .lean();

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
        const totalPaid = orderPayments.reduce((sum, payment) => sum + payment.amount, 0);

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
          
          // Count items - this will work even if menuItems are deleted
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
      const { outletId } = req.query;
      
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      req.query.date = todayString;
      if (outletId) req.query.outletId = outletId;
      
      return this.getDailyProfit(req, res);
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

      // Create mock request object for getDailyProfitRange
      const mockReq = {
        query: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          outletId: outletId
        }
      };

      const mockRes = {
        json: (data) => data,
        status: () => mockRes
      };

      // Call getDailyProfitRange directly
      const rangeResult = await this.getDailyProfitRange(mockReq, mockRes);
      
      res.json({
        success: true,
        data: rangeResult
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

export default new DailyProfitController();