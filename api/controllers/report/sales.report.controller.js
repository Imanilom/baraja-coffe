import Category from '../../models/Category.model.js';
import { Order } from '../../models/order.model.js';
import Payment from '../../models/Payment.model.js';
import {
  processOrderItems,
  getSafeMenuItemData,
  getProductSummaryFromOrders
} from '../../utils/menuItemHelper.js';

class DailyProfitController {
  /**
   * Get daily profit summary for a specific date - DUKUNG SPLIT PAYMENT
   */
  async getDailyProfit(req, res) {
    try {
      const { startDate, endDate, outletId, includeDeleted = 'true' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate parameter is required (format: YYYY-MM-DD)'
        });
      }

      // Parse date and create date range for WIB timezone
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

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

      // Add outlet filter if provided
      if (outletId && outletId !== 'all') {
        filter.outlet = outletId;
      }

      // Query orders TANPA populate yang risky - gunakan data denormalized
      const orders = await Order.find(filter)
        .sort({ createdAtWIB: -1 })
        .lean();

      // Calculate profit metrics
      let totalRevenue = 0;
      let totalTax = 0;
      let totalServiceFee = 0;
      let totalDiscounts = 0;
      let totalNetProfit = 0;
      let totalOrders = 0;
      let totalItemsSold = 0;
      let totalPaidAmount = 0;

      const orderDetails = [];

      orders.forEach(order => {
        // MODIFIKASI: Hitung total payment dari array payments di order
        const completedPayments = order.payments?.filter(p =>
          p.status === 'completed' || p.status === 'pending'
        ) || [];

        const totalPaid = completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

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
          totalPaidAmount += totalPaid;

          // Count items sold menggunakan data yang aman
          const itemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          totalItemsSold += itemsCount;

          // Process items dengan handling untuk deleted menu items
          const processedItems = processOrderItems(order.items);

          // Filter items berdasarkan includeDeleted parameter
          const filteredItems = includeDeleted === 'true'
            ? processedItems
            : processedItems.filter(item => !item.isMenuDeleted);

          // MODIFIKASI: Process payments untuk split payment
          const paymentDetails = completedPayments.map(payment => ({
            method: payment.paymentMethod,
            amount: payment.amount,
            status: payment.status,
            details: payment.paymentDetails,
            processedAt: payment.processedAt
          }));

          orderDetails.push({
            order_id: order.order_id,
            createdAt: order.createdAtWIB,
            user: order.user,
            orderType: order.orderType,
            paymentMethod: order.paymentMethod, // legacy field untuk kompatibilitas
            revenue: orderRevenue,
            tax: orderTax,
            serviceFee: orderServiceFee,
            discounts: orderDiscounts,
            netProfit: orderNetProfit,
            itemsCount: itemsCount,
            status: order.status,
            splitPaymentStatus: order.splitPaymentStatus,
            isSplitPayment: order.isSplitPayment,
            totalPaid: totalPaid,
            remainingBalance: order.remainingBalance || 0,
            change: order.change || 0,
            items: filteredItems,
            payments: paymentDetails
          });
        }
      });

      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalNetProfit / totalOrders : 0;

      // MODIFIKASI: Payment method breakdown dari array payments
      const paymentMethodBreakdown = {};
      orders.forEach(order => {
        const completedPayments = order.payments?.filter(p =>
          p.status === 'completed' || p.status === 'pending'
        ) || [];

        completedPayments.forEach(payment => {
          const method = payment.paymentMethod || 'Unknown';
          paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + (payment.amount || 0);
        });
      });

      // Order type breakdown
      const orderTypeBreakdown = {};
      orderDetails.forEach(order => {
        const type = order.orderType || 'Unknown';
        orderTypeBreakdown[type] = (orderTypeBreakdown[type] || 0) + order.netProfit;
      });

      const result = {
        startDate: startDate,
        endDate: endDate,
        outlet: outletId || 'All Outlets',
        summary: {
          totalRevenue,
          totalTax,
          totalServiceFee,
          totalDiscounts,
          totalNetProfit,
          totalOrders,
          totalItemsSold,
          totalPaidAmount,
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
          dataSource: 'denormalized_safe',
          supportsSplitPayment: true
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
   * Get product sales report yang aman terhadap deleted items - DUKUNG SPLIT PAYMENT
   */
  // async getProductSalesReport(req, res) {
  //   try {
  //     const { startDate, endDate, outletId, includeDeleted = 'true' } = req.query;

  //     if (!startDate || !endDate) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'startDate and endDate parameters are required (format: YYYY-MM-DD)'
  //       });
  //     }

  //     const start = new Date(startDate);
  //     const end = new Date(endDate);
  //     end.setHours(23, 59, 59, 999);

  //     const filter = {
  //       createdAtWIB: { $gte: start, $lte: end },
  //       status: { $in: ['Completed', 'OnProcess'] }
  //     };

  //     if (outletId && outletId !== 'all') {
  //       filter.outlet = outletId;
  //     }

  //     const orders = await Order.find(filter).lean();

  //     // MODIFIKASI: Filter hanya orders dengan pembayaran yang berhasil
  //     const paidOrders = orders.filter(order => {
  //       const completedPayments = order.payments?.filter(p =>
  //         p.status === 'completed' || p.status === 'pending'
  //       ) || [];
  //       const totalPaid = completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  //       return totalPaid > 0;
  //     });

  //     // Get product summary menggunakan helper yang aman
  //     const productSummary = getProductSummaryFromOrders(paidOrders);

  //     // Filter berdasarkan includeDeleted parameter
  //     const filteredProducts = includeDeleted === 'true'
  //       ? productSummary
  //       : productSummary.filter(product => !product.isDeleted);

  //     // Sort by total revenue descending
  //     const sortedProducts = filteredProducts.sort((a, b) => b.totalRevenue - a.totalRevenue);

  //     res.json({
  //       success: true,
  //       data: {
  //         products: sortedProducts,
  //         summary: {
  //           totalProducts: sortedProducts.length,
  //           totalRevenue: sortedProducts.reduce((sum, product) => sum + product.totalRevenue, 0),
  //           totalQuantity: sortedProducts.reduce((sum, product) => sum + product.totalQuantity, 0),
  //           activeProducts: sortedProducts.filter(p => p.isActive && !p.isDeleted).length,
  //           deletedProducts: sortedProducts.filter(p => p.isDeleted).length
  //         },
  //         period: {
  //           startDate,
  //           endDate,
  //           outlet: outletId || 'All Outlets'
  //         }
  //       }
  //     });

  //   } catch (error) {
  //     console.error('Error in getProductSalesReport:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error',
  //       error: error.message
  //     });
  //   }
  // }

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

      const orders = await Order.find(filter)
        .populate('items.menuItem.category')
        .lean();

      // Filter hanya orders dengan pembayaran yang berhasil
      const paidOrders = orders.filter(order => {
        const completedPayments = order.payments?.filter(p =>
          p.status === 'completed' || p.status === 'pending'
        ) || [];
        const totalPaid = completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        return totalPaid > 0;
      });

      // Manual populate category dari menuItemData
      const categoryIds = new Set();

      paidOrders.forEach(order => {
        order.items?.forEach(item => {
          const categoryId = item.menuItemData?.category;
          if (categoryId) {
            categoryIds.add(categoryId.toString());
          }
        });
      });

      // Fetch semua categories sekaligus (tanpa mongoose.model)
      const categories = await Category.find({
        _id: { $in: Array.from(categoryIds) }
      }).lean();

      // Buat map untuk lookup cepat
      const categoryMap = new Map();
      categories.forEach(cat => {
        categoryMap.set(cat._id.toString(), cat.name);
      });

      // Proses product summary dengan addons separation
      const productMap = new Map();

      paidOrders.forEach(order => {
        order.items?.forEach(item => {
          const menuItem = item.menuItem;
          const menuItemData = item.menuItemData;

          // Skip kalau tidak ada data sama sekali
          if (!menuItem && !menuItemData) return;

          // Prioritas ambil dari menuItemData dulu, baru menuItem
          const productId = menuItem?._id?.toString() || menuItemData?._id?.toString() || 'unknown';
          const productName = menuItemData?.name || menuItem?.name || 'Unknown Product';

          // Untuk category: cek menuItemData dulu (pakai categoryMap), baru menuItem
          let categoryName = null;

          // 1. Cek menuItemData.category (ObjectId)
          if (menuItemData?.category) {
            const catId = menuItemData.category.toString();
            if (categoryMap.has(catId)) {
              categoryName = categoryMap.get(catId);
            }
          }

          // 2. Fallback ke menuItem.category (sudah di-populate)
          if (!categoryName && menuItem?.category) {
            if (typeof menuItem.category === 'object' && menuItem.category.name) {
              categoryName = menuItem.category.name;
            } else if (typeof menuItem.category === 'string' && menuItem.category !== '') {
              categoryName = menuItem.category;
            }
          }

          // Kalau masih null, skip item ini (jangan tampilkan "Uncategorized")
          if (!categoryName) return;

          // Hitung diskon per item (proporsional dari total diskon order)
          const itemSubtotal = item.subtotal || 0;
          const orderTotal = order.totalBeforeDiscount || order.total || 0;
          const totalDiscount = (order.discounts?.autoPromoDiscount || 0) +
            (order.discounts?.manualDiscount || 0) +
            (order.discounts?.voucherDiscount || 0);

          const itemDiscount = orderTotal > 0
            ? (itemSubtotal / orderTotal) * totalDiscount
            : 0;

          const itemTotal = itemSubtotal - itemDiscount;

          // Kumpulkan addons info dan buat unique key
          const addonsInfo = [];
          let addonsKey = '';

          if (item.addons && item.addons.length > 0) {
            item.addons.forEach(addon => {
              if (addon.options && addon.options.length > 0) {
                addon.options.forEach(option => {
                  if (option.label) {
                    addonsInfo.push({
                      label: option.label,
                      price: option.price || 0
                    });
                    addonsKey += `|${option.label}:${option.price}`;
                  }
                });
              }
            });
          }

          // Buat unique key: kombinasi product ID + addons (untuk pisahkan Hot/Iced dll)
          const uniqueKey = `${productId}${addonsKey}`;

          // Buat display name dengan variant
          let displayName = productName;
          if (addonsInfo.length > 0) {
            const variantLabels = addonsInfo.map(a => a.label).join(', ');
            displayName = `${displayName} (${variantLabels})`;
          }

          // Agregasi data produk dengan unique key
          if (productMap.has(uniqueKey)) {
            const existing = productMap.get(uniqueKey);
            existing.totalQuantity += item.quantity;
            existing.totalRevenue += itemTotal;
            existing.grossSales += itemSubtotal;
            existing.totalDiscount += itemDiscount;
          } else {
            productMap.set(uniqueKey, {
              productId: productId,
              productName: displayName,
              baseProductName: productName,
              category: categoryName,
              totalQuantity: item.quantity,
              totalRevenue: itemTotal,
              grossSales: itemSubtotal,
              totalDiscount: itemDiscount,
              addons: addonsInfo.length > 0 ? addonsInfo : null,
              isActive: menuItem?.isActive !== undefined ? menuItem.isActive : (menuItemData?.isActive !== false),
              isDeleted: menuItem?.isDeleted || menuItemData?.isDeleted || false
            });
          }
        });

        // Proses custom amount items
        if (order.customAmountItems && order.customAmountItems.length > 0) {
          order.customAmountItems.forEach(customItem => {
            const customId = `custom_${customItem._id}`;
            const customAmount = customItem.amount || 0;
            const customDiscount = customItem.discountApplied || 0;
            const customTotal = customAmount - customDiscount;

            if (productMap.has(customId)) {
              const existing = productMap.get(customId);
              existing.totalQuantity += 1;
              existing.totalRevenue += customTotal;
              existing.grossSales += customAmount;
              existing.totalDiscount += customDiscount;
            } else {
              productMap.set(customId, {
                productId: customId,
                productName: customItem.name || 'Custom Amount',
                baseProductName: customItem.name || 'Custom Amount',
                category: 'Custom',
                totalQuantity: 1,
                totalRevenue: customTotal,
                grossSales: customAmount,
                totalDiscount: customDiscount,
                addons: null,
                isActive: true,
                isDeleted: false
              });
            }
          });
        }
      });

      // Convert map to array dan format angka
      const productSummary = Array.from(productMap.values()).map(product => ({
        productId: product.productId,
        productName: product.productName,
        baseProductName: product.baseProductName,
        category: product.category,
        totalQuantity: product.totalQuantity,
        totalRevenue: Math.round(product.totalRevenue),
        grossSales: Math.round(product.grossSales),
        totalDiscount: Math.round(product.totalDiscount),
        addons: product.addons,
        isActive: product.isActive,
        isDeleted: product.isDeleted
      }));

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
            totalGrossSales: sortedProducts.reduce((sum, product) => sum + product.grossSales, 0),
            totalDiscount: sortedProducts.reduce((sum, product) => sum + product.totalDiscount, 0),
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
   * Get daily profit for a date range - DUKUNG SPLIT PAYMENT
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

      // Group by date
      const dailyProfits = {};

      orders.forEach(order => {
        // MODIFIKASI: Hitung total payment dari array payments
        const completedPayments = order.payments?.filter(p =>
          p.status === 'completed' || p.status === 'pending'
        ) || [];

        const totalPaid = completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

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
              totalItemsSold: 0,
              totalPaidAmount: 0
            };
          }

          dailyProfits[orderDate].totalRevenue += orderRevenue;
          dailyProfits[orderDate].totalNetProfit += orderNetProfit;
          dailyProfits[orderDate].totalOrders += 1;
          dailyProfits[orderDate].totalPaidAmount += totalPaid;

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
   * Get today's profit summary - DUKUNG SPLIT PAYMENT
   */
  async getTodayProfit(req, res) {
    try {
      const { outletId, includeDeleted } = req.query;

      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // Create mock request object
      const mockReq = {
        query: {
          startDate: todayString,
          endDate: todayString,
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
  * Get order report - DUKUNG SPLIT PAYMENT
  */
  // async getOrdersWithPayments(req, res) {
  //   try {
  //     // Ambil query params
  //     const page = parseInt(req.query.page) || 1;
  //     const limit = parseInt(req.query.limit) || 20;
  //     const mode = req.query.mode || 'paginated'; // paginated, all, recent, count, ids

  //     // Setup filters dari query params
  //     const filters = {};

  //     if (req.query.status) filters.status = req.query.status;
  //     if (req.query.orderType) filters.orderType = req.query.orderType;
  //     if (req.query.outlet) filters.outlet = req.query.outlet;

  //     // Date range filter - FIXED TIMEZONE HANDLING
  //     if (req.query.startDate || req.query.endDate) {
  //       filters.createdAt = {};

  //       if (req.query.startDate) {
  //         // Parse tanggal dengan asumsi input dalam format YYYY-MM-DD (lokal)
  //         // Buat Date object di timezone lokal (Asia/Jakarta = UTC+7)
  //         const startDateStr = req.query.startDate; // Format: YYYY-MM-DD
  //         const startDate = new Date(startDateStr + 'T00:00:00.000+07:00'); // Explicitly set timezone offset

  //         console.log('Start Date Filter:', {
  //           input: req.query.startDate,
  //           parsed: startDate.toISOString(),
  //           local: startDate.toString()
  //         });

  //         filters.createdAt.$gte = startDate;
  //       }

  //       if (req.query.endDate) {
  //         // Parse tanggal dengan asumsi input dalam format YYYY-MM-DD (lokal)
  //         const endDateStr = req.query.endDate; // Format: YYYY-MM-DD
  //         const endDate = new Date(endDateStr + 'T23:59:59.999+07:00'); // Explicitly set timezone offset

  //         console.log('End Date Filter:', {
  //           input: req.query.endDate,
  //           parsed: endDate.toISOString(),
  //           local: endDate.toString()
  //         });

  //         filters.createdAt.$lte = endDate;
  //       }
  //     }

  //     // Base query builder function
  //     const buildQuery = () => {
  //       return Order.find(filters)
  //         .populate('items.menuItem')
  //         .populate({
  //           path: 'items.menuItem',
  //           populate: {
  //             path: 'category',
  //             model: 'Category',
  //             select: 'name'
  //           }
  //         })
  //         .populate('outlet')
  //         .populate('user_id')
  //         .populate({
  //           path: 'cashierId',
  //           populate: {
  //             path: 'outlet.outletId',
  //             model: 'Outlet',
  //             select: 'name address',
  //           },
  //         })
  //         .sort({ createdAt: -1 })
  //         .lean();
  //     };

  //     let orders, totalOrders, paginationInfo = null;

  //     // Eksekusi berdasarkan mode
  //     switch (mode) {
  //       case 'all':
  //         // Ambil semua data (untuk export)
  //         orders = await buildQuery();
  //         totalOrders = orders.length;
  //         console.log(`Fetching ALL orders: ${totalOrders} records`);
  //         break;

  //       case 'recent':
  //         // Ambil 10 data terbaru
  //         orders = await buildQuery().limit(10);
  //         totalOrders = await Order.countDocuments(filters);
  //         paginationInfo = {
  //           mode: 'recent',
  //           showing: orders.length,
  //           total: totalOrders
  //         };
  //         break;

  //       case 'count':
  //         // Hanya hitung jumlah
  //         totalOrders = await Order.countDocuments(filters);
  //         return res.status(200).json({
  //           success: true,
  //           count: totalOrders
  //         });

  //       case 'ids':
  //         // Ambil hanya order IDs
  //         const orderIds = await Order.find(filters)
  //           .select('order_id createdAt status')
  //           .sort({ createdAt: -1 })
  //           .lean();
  //         return res.status(200).json({
  //           success: true,
  //           data: orderIds
  //         });

  //       case 'paginated':
  //       default:
  //         // Mode pagination (default)
  //         const skip = (page - 1) * limit;

  //         totalOrders = await Order.countDocuments(filters);
  //         const totalPages = Math.ceil(totalOrders / limit);

  //         orders = await buildQuery().skip(skip).limit(limit);

  //         console.log(`Fetching page ${page}: ${orders.length} records (Total: ${totalOrders})`);

  //         paginationInfo = {
  //           currentPage: page,
  //           totalPages: totalPages,
  //           totalOrders: totalOrders,
  //           limit: limit,
  //           hasNextPage: page < totalPages,
  //           hasPrevPage: page > 1
  //         };
  //         break;
  //     }

  //     // Fetch payments hanya untuk orders yang ditampilkan
  //     const orderIds = orders.map(order => order.order_id);
  //     const allPayments = await Payment.find({
  //       order_id: { $in: orderIds }
  //     }).lean();

  //     // Buat payment map
  //     const paymentMap = {};
  //     allPayments.forEach(payment => {
  //       if (!paymentMap[payment.order_id]) {
  //         paymentMap[payment.order_id] = [];
  //       }
  //       paymentMap[payment.order_id].push(payment);
  //     });

  //     // Combine orders dengan payments dan populate menuItemData
  //     const ordersWithPayments = orders.map(order => {
  //       // Populate menuItemData jika kosong (untuk order lama)
  //       if (order.items && Array.isArray(order.items)) {
  //         order.items = order.items.map(item => {
  //           if (!item.menuItemData || !item.menuItemData.name) {
  //             if (item.menuItem) {
  //               item.menuItemData = {
  //                 name: item.menuItem.name || 'Unknown Item',
  //                 price: item.menuItem.price || 0,
  //                 category: item.menuItem.category?.name || item.menuItem.mainCategory || 'Uncategorized',
  //                 sku: item.menuItem.sku || '',
  //                 isActive: item.menuItem.isActive !== false,
  //                 selectedAddons: item.addons || [],
  //                 selectedToppings: item.toppings || []
  //               };
  //             } else {
  //               item.menuItemData = {
  //                 name: 'Unknown Item',
  //                 price: item.subtotal / (item.quantity || 1) || 0,
  //                 category: 'Unknown',
  //                 sku: 'N/A',
  //                 isActive: false,
  //                 selectedAddons: item.addons || [],
  //                 selectedToppings: item.toppings || []
  //               };
  //             }
  //           } else if (!item.menuItemData.selectedAddons) {
  //             item.menuItemData.selectedAddons = item.addons || [];
  //             item.menuItemData.selectedToppings = item.toppings || [];
  //           }
  //           return item;
  //         });
  //       }

  //       const relatedPayments = paymentMap[order.order_id] || [];
  //       let paymentDetails = null;
  //       let actualPaymentMethod = order.paymentMethod || 'N/A';

  //       if (order.orderType !== "Reservation") {
  //         paymentDetails = relatedPayments.find(p =>
  //           p.status === 'pending' || p.status === 'settlement' || p.status === 'partial'
  //         );
  //       } else {
  //         paymentDetails = relatedPayments.find(p => p.status === 'pending') ||
  //           relatedPayments.find(p => p.status === 'psrtisl') ||
  //           relatedPayments.find(p => p.status === 'settlement') ||
  //           relatedPayments.find(p =>
  //             p.paymentType === 'Final Payment' &&
  //             p.relatedPaymentId &&
  //             (p.status === 'pending' || p.status === 'settlement' || p.status === 'partial')
  //           );
  //       }

  //       if (paymentDetails) {
  //         actualPaymentMethod = paymentDetails.method_type || actualPaymentMethod;
  //       }

  //       return {
  //         ...order,
  //         paymentDetails: paymentDetails || null,
  //         actualPaymentMethod
  //       };
  //     });

  //     // Response
  //     const response = {
  //       success: true,
  //       data: ordersWithPayments
  //     };

  //     if (paginationInfo) {
  //       response.pagination = paginationInfo;
  //     }

  //     res.status(200).json(response);

  //   } catch (error) {
  //     console.error('Get orders with payments error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Failed to fetch orders with payments',
  //       error: error.message
  //     });
  //   }
  // }

  async getOrdersWithPayments(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const mode = req.query.mode || 'paginated';

      // PERBAIKAN: Tambah search parameter
      const searchTerm = req.query.search || '';

      const filters = {};

      if (req.query.status) filters.status = req.query.status;
      if (req.query.orderType) filters.orderType = req.query.orderType;
      if (req.query.outlet) filters.outlet = req.query.outlet;

      // Date range filter
      if (req.query.startDate || req.query.endDate) {
        filters.createdAt = {};

        if (req.query.startDate) {
          const startDateStr = req.query.startDate;
          const startDate = new Date(startDateStr + 'T00:00:00.000+07:00');
          filters.createdAt.$gte = startDate;
        }

        if (req.query.endDate) {
          const endDateStr = req.query.endDate;
          const endDate = new Date(endDateStr + 'T23:59:59.999+07:00');
          filters.createdAt.$lte = endDate;
        }
      }

      // PERBAIKAN: Tambah search filter ke MongoDB query
      if (searchTerm) {
        filters.$or = [
          { order_id: { $regex: searchTerm, $options: 'i' } },
          { user: { $regex: searchTerm, $options: 'i' } },
          { 'items.menuItemData.name': { $regex: searchTerm, $options: 'i' } },
        ];
      }

      const buildQuery = () => {
        return Order.find(filters)
          .populate('items.menuItem')
          .populate({
            path: 'items.menuItem',
            populate: {
              path: 'category',
              model: 'Category',
              select: 'name'
            }
          })
          .populate('outlet')
          .populate('user_id')
          .populate({
            path: 'cashierId',
            populate: {
              path: 'outlet.outletId',
              model: 'Outlet',
              select: 'name address',
            },
          })
          .sort({ createdAt: -1 })
          .lean();
      };

      let orders, totalOrders, paginationInfo = null;

      switch (mode) {
        case 'all':
          // PERBAIKAN: Pastikan tidak ada limit MongoDB default
          const allOrdersQuery = buildQuery();
          // Set maxTimeMS untuk query besar
          allOrdersQuery.maxTimeMS(60000);
          orders = await allOrdersQuery.exec();
          totalOrders = orders.length;
          console.log(`[EXPORT MODE] Fetching ALL orders: ${totalOrders} records`);
          break;

        case 'recent':
          orders = await buildQuery().limit(10);
          totalOrders = await Order.countDocuments(filters);
          paginationInfo = {
            mode: 'recent',
            showing: orders.length,
            total: totalOrders
          };
          break;

        case 'count':
          totalOrders = await Order.countDocuments(filters);
          return res.status(200).json({
            success: true,
            count: totalOrders
          });

        case 'ids':
          const orderIds = await Order.find(filters)
            .select('order_id createdAt status')
            .sort({ createdAt: -1 })
            .lean();
          return res.status(200).json({
            success: true,
            data: orderIds
          });

        case 'paginated':
        default:
          const skip = (page - 1) * limit;
          totalOrders = await Order.countDocuments(filters);
          const totalPages = Math.ceil(totalOrders / limit);

          orders = await buildQuery().skip(skip).limit(limit);

          console.log(`Fetching page ${page}: ${orders.length} records (Total: ${totalOrders})`);

          paginationInfo = {
            currentPage: page,
            totalPages: totalPages,
            totalOrders: totalOrders,
            limit: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          };
          break;
      }

      // Fetch payments
      const orderIds = orders.map(order => order.order_id);
      const allPayments = await Payment.find({
        order_id: { $in: orderIds }
      }).lean();

      const paymentMap = {};
      allPayments.forEach(payment => {
        if (!paymentMap[payment.order_id]) {
          paymentMap[payment.order_id] = [];
        }
        paymentMap[payment.order_id].push(payment);
      });

      // PERBAIKAN: Pastikan semua items memiliki menuItemData
      const ordersWithPayments = orders.map(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items = order.items.map(item => {
            // Prioritas: menuItemData > menuItem > default
            if (!item.menuItemData || !item.menuItemData.name) {
              if (item.menuItem) {
                item.menuItemData = {
                  name: item.menuItem.name || 'Unknown Item',
                  price: item.menuItem.price || 0,
                  category: item.menuItem.category?.name || item.menuItem.mainCategory || 'Uncategorized',
                  sku: item.menuItem.sku || '',
                  isActive: item.menuItem.isActive !== false,
                  selectedAddons: item.addons || [],
                  selectedToppings: item.toppings || []
                };
              } else {
                // Fallback untuk item yang tidak memiliki menuItem reference
                item.menuItemData = {
                  name: 'Unknown Item',
                  price: item.subtotal / (item.quantity || 1) || 0,
                  category: 'Unknown',
                  sku: 'N/A',
                  isActive: false,
                  selectedAddons: item.addons || [],
                  selectedToppings: item.toppings || []
                };
              }
            } else if (!item.menuItemData.selectedAddons) {
              // Pastikan addons dan toppings selalu ada
              item.menuItemData.selectedAddons = item.addons || [];
              item.menuItemData.selectedToppings = item.toppings || [];
            }
            return item;
          });
        }

        const relatedPayments = paymentMap[order.order_id] || [];
        let paymentDetails = null;
        let actualPaymentMethod = order.paymentMethod || 'N/A';

        if (order.orderType !== "Reservation") {
          paymentDetails = relatedPayments.find(p =>
            p.status === 'pending' || p.status === 'settlement' || p.status === 'partial'
          );
        } else {
          paymentDetails = relatedPayments.find(p => p.status === 'pending') ||
            relatedPayments.find(p => p.status === 'partial') ||
            relatedPayments.find(p => p.status === 'settlement') ||
            relatedPayments.find(p =>
              p.paymentType === 'Final Payment' &&
              p.relatedPaymentId &&
              (p.status === 'pending' || p.status === 'settlement' || p.status === 'partial')
            );
        }

        if (paymentDetails) {
          actualPaymentMethod = paymentDetails.method_type || actualPaymentMethod;
        }

        return {
          ...order,
          paymentDetails: paymentDetails || null,
          actualPaymentMethod
        };
      });

      const response = {
        success: true,
        data: ordersWithPayments,
        // PERBAIKAN: Tambah metadata untuk debugging
        metadata: {
          mode: mode,
          filters: {
            status: req.query.status || 'all',
            outlet: req.query.outlet || 'all',
            dateRange: req.query.startDate && req.query.endDate
              ? `${req.query.startDate} to ${req.query.endDate}`
              : 'all',
            search: searchTerm || 'none'
          },
          resultCount: ordersWithPayments.length
        }
      };

      if (paginationInfo) {
        response.pagination = paginationInfo;
      }

      res.status(200).json(response);

    } catch (error) {
      console.error('Get orders with payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders with payments',
        error: error.message
      });
    }
  }

  /**
   * Get detailed order report dengan handling deleted items - DUKUNG SPLIT PAYMENT
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

      // MODIFIKASI: Gunakan payments dari order langsung
      const completedPayments = order.payments?.filter(p =>
        p.status === 'completed' || p.status === 'pending'
      ) || [];

      const totalPaid = completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

      // Process items dengan handling untuk deleted menu items
      const processedItems = processOrderItems(order.items);

      const result = {
        order_id: order.order_id,
        createdAt: order.createdAtWIB,
        user: order.user,
        orderType: order.orderType,
        paymentMethod: order.paymentMethod, // legacy field
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

        // MODIFIKASI: Split payment details
        isSplitPayment: order.isSplitPayment || false,
        splitPaymentStatus: order.splitPaymentStatus || 'not_started',
        totalPaid: totalPaid,
        remainingBalance: order.remainingBalance || 0,
        change: order.change || 0,

        // Processed items
        items: processedItems,

        // MODIFIKASI: Payments dari array payments
        payments: completedPayments.map(p => ({
          method: p.paymentMethod,
          amount: p.amount,
          status: p.status,
          details: p.paymentDetails,
          processedBy: p.processedBy,
          processedAt: p.processedAt,
          notes: p.notes
        })),

        // Metadata
        metadata: {
          totalItems: processedItems.length,
          deletedItemsCount: processedItems.filter(item => item.isMenuDeleted).length,
          dataSource: 'denormalized_safe',
          supportsSplitPayment: true
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
   * Get profit statistics for dashboard - DUKUNG SPLIT PAYMENT
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

      // Build query filter
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

      // Calculate dashboard metrics
      let totalRevenue = 0;
      let totalOrders = 0;
      let totalItemsSold = 0;
      let totalPaidAmount = 0;
      const dailyData = {};

      orders.forEach(order => {
        // MODIFIKASI: Hitung payment dari array payments
        const completedPayments = order.payments?.filter(p =>
          p.status === 'completed' || p.status === 'pending'
        ) || [];

        const totalPaid = completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        if (totalPaid > 0) {
          const orderDate = order.createdAtWIB.toISOString().split('T')[0];
          const orderRevenue = order.grandTotal || 0;
          const orderDiscounts = (order.discounts?.autoPromoDiscount || 0) +
            (order.discounts?.manualDiscount || 0) +
            (order.discounts?.voucherDiscount || 0);
          const orderNetProfit = orderRevenue - orderDiscounts;

          totalRevenue += orderNetProfit;
          totalOrders += 1;
          totalPaidAmount += totalPaid;

          // Count items
          const itemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          totalItemsSold += itemsCount;

          // Daily data
          if (!dailyData[orderDate]) {
            dailyData[orderDate] = {
              date: orderDate,
              revenue: 0,
              orders: 0,
              items: 0,
              paidAmount: 0
            };
          }
          dailyData[orderDate].revenue += orderNetProfit;
          dailyData[orderDate].orders += 1;
          dailyData[orderDate].items += itemsCount;
          dailyData[orderDate].paidAmount += totalPaid;
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
            totalPaidAmount: Math.round(totalPaidAmount),
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

  /**
   * NEW: Get split payment analysis report
   */
  async getSplitPaymentAnalysis(req, res) {
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

      const filter = {
        createdAtWIB: { $gte: start, $lte: end },
        status: { $in: ['Completed', 'OnProcess'] }
      };

      if (outletId && outletId !== 'all') {
        filter.outlet = outletId;
      }

      const orders = await Order.find(filter).lean();

      // Analysis data
      const analysis = {
        totalOrders: orders.length,
        splitPaymentOrders: 0,
        singlePaymentOrders: 0,
        paymentMethodDistribution: {},
        averagePaymentsPerOrder: 0,
        ordersByStatus: {
          not_started: 0,
          partial: 0,
          completed: 0,
          overpaid: 0
        },
        ordersData: []
      };

      let totalPaymentCount = 0;

      orders.forEach(order => {
        const isSplitPayment = order.isSplitPayment || false;
        const splitStatus = order.splitPaymentStatus || 'not_started';

        if (isSplitPayment) {
          analysis.splitPaymentOrders++;
        } else {
          analysis.singlePaymentOrders++;
        }

        // Track orders by split payment status
        analysis.ordersByStatus[splitStatus] = (analysis.ordersByStatus[splitStatus] || 0) + 1;

        // Track payment methods
        const completedPayments = order.payments?.filter(p =>
          p.status === 'completed' || p.status === 'pending'
        ) || [];

        totalPaymentCount += completedPayments.length;

        completedPayments.forEach(payment => {
          const method = payment.paymentMethod || 'Unknown';
          analysis.paymentMethodDistribution[method] =
            (analysis.paymentMethodDistribution[method] || 0) + 1;
        });

        // Add order data for detailed analysis
        const totalPaid = completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        analysis.ordersData.push({
          order_id: order.order_id,
          createdAt: order.createdAtWIB,
          isSplitPayment: isSplitPayment,
          splitPaymentStatus: splitStatus,
          totalPayments: completedPayments.length,
          totalAmount: order.grandTotal || 0,
          totalPaid: totalPaid,
          remainingBalance: order.remainingBalance || 0,
          paymentMethods: completedPayments.map(p => p.paymentMethod)
        });
      });

      // Calculate averages
      analysis.averagePaymentsPerOrder = analysis.totalOrders > 0
        ? (totalPaymentCount / analysis.totalOrders).toFixed(2)
        : 0;

      // Sort orders by split payment count
      analysis.ordersData.sort((a, b) => b.totalPayments - a.totalPayments);

      res.json({
        success: true,
        data: {
          analysis,
          period: {
            startDate,
            endDate,
            outlet: outletId || 'All Outlets'
          },
          summary: {
            splitPaymentRate: analysis.totalOrders > 0
              ? ((analysis.splitPaymentOrders / analysis.totalOrders) * 100).toFixed(2) + '%'
              : '0%',
            averagePaymentCount: analysis.averagePaymentsPerOrder
          }
        }
      });

    } catch (error) {
      console.error('Error in getSplitPaymentAnalysis:', error);
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