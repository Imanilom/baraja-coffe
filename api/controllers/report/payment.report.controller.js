import { Order } from '../../models/order.model.js';
import Payment from '../../models/Payment.model.js';
import mongoose from 'mongoose';

export const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, outletId, groupBy = 'daily' } = req.query;

    // Validasi tanggal
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date dan end date harus diisi'
      });
    }

    // Parse tanggal
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Validasi tanggal
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format tanggal tidak valid'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date tidak boleh lebih besar dari end date'
      });
    }

    // Build query untuk orders dalam periode
    const orderQuery = {
      createdAt: { $gte: start, $lte: end },
      status: { $in: ['Completed'] },
      ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) })
    };

    // Find orders yang completed dengan populate
    const orders = await Order.find(orderQuery)
      .populate({
        path: 'items.menuItem',
        model: 'MenuItem',
        select: 'name price isActive',
        options: { allowNull: true }
      })
      .populate('outlet', 'name location')
      .populate('cashierId', 'name username')
      .lean();

    console.log(`📊 Found ${orders.length} orders for report`);

    // Process orders untuk menangani split payment dan single payment
    const processedOrders = orders.map(order => {
      // Process items untuk handle deleted menu items
      const processedItems = order.items.map(item => {
        const menuItem = item.menuItem;

        // Jika menuItem null atau deleted, create fallback object
        if (!menuItem) {
          return {
            ...item,
            menuItem: {
              _id: null,
              name: 'Menu Item Deleted',
              price: item.price || item.subtotal || 0,
              isActive: false
            }
          };
        }

        return {
          ...item,
          menuItem: {
            _id: menuItem._id,
            name: menuItem.name || 'Unknown Menu Item',
            price: menuItem.price || item.price || 0,
            isActive: menuItem.isActive !== false
          }
        };
      });

      // HITUNG PAYMENT DETAILS DARI ORDER
      let paymentDetails = [];
      let totalOrderPaid = 0;

      if (order.isSplitPayment && order.payments && Array.isArray(order.payments)) {
        // SPLIT PAYMENT: Gunakan data dari order.payments
        paymentDetails = order.payments.map(payment => {
          const amount = payment.amount || 0;
          totalOrderPaid += amount;

          return {
            method: payment.paymentMethod || order.paymentMethod || 'Cash',
            displayName: getDisplayName(
              payment.paymentMethod || order.paymentMethod || 'Cash',
              payment.va_numbers || [],
              payment.actions || []
            ),
            amount: amount,
            status: payment.status || 'completed',
            isSplitPayment: true,
            splitIndex: payment._id ? payment._id.toString() : null,
            tenderedAmount: payment.paymentDetails?.cashTendered || amount,
            changeAmount: payment.paymentDetails?.change || 0,
            processedAt: payment.processedAt || order.createdAt,
            va_numbers: payment.va_numbers || [],
            actions: payment.actions || []
          };
        });
      } else {
        // SINGLE PAYMENT: Cek payment dari collection Payment atau dari order
        const singlePaymentAmount = order.grandTotal || 0;
        totalOrderPaid = singlePaymentAmount;

        paymentDetails = [{
          method: order.paymentMethod || 'Cash',
          displayName: getDisplayName(
            order.paymentMethod || 'Cash',
            order.payments?.[0]?.va_numbers || [],
            order.payments?.[0]?.actions || []
          ),
          amount: singlePaymentAmount,
          status: 'completed',
          isSplitPayment: false,
          tenderedAmount: order.payments?.[0]?.paymentDetails?.cashTendered || singlePaymentAmount,
          changeAmount: order.payments?.[0]?.paymentDetails?.change || 0,
          processedAt: order.createdAt,
          va_numbers: order.payments?.[0]?.va_numbers || [],
          actions: order.payments?.[0]?.actions || []
        }];
      }

      return {
        ...order,
        items: processedItems,
        paymentDetails: paymentDetails,
        totalPaid: totalOrderPaid,
        // Flag untuk menunjukkan ini adalah single atau split payment
        hasSplitPayment: order.isSplitPayment || false,
        splitPaymentCount: order.isSplitPayment ? (order.payments?.length || 0) : 1
      };
    });

    // Cari payment records untuk cross-check dan tambahan info
    const orderIds = orders.map(o => o.order_id).filter(id => id);
    const paymentRecords = await Payment.find({
      order_id: { $in: orderIds },
      status: { $in: ['settlement', 'paid', 'capture'] },
      isAdjustment: { $ne: true }
    }).lean();

    // Combine payment records dengan orders
    const paymentRecordMap = new Map();
    paymentRecords.forEach(payment => {
      if (!paymentRecordMap.has(payment.order_id)) {
        paymentRecordMap.set(payment.order_id, []);
      }
      paymentRecordMap.get(payment.order_id).push(payment);
    });

    // Merge payment records dengan processed orders
    const finalOrders = processedOrders.map(order => {
      const externalPayments = paymentRecordMap.get(order.order_id) || [];

      // Jika ada payment records external, merge dengan order payment details
      if (externalPayments.length > 0) {
        const mergedPaymentDetails = [...order.paymentDetails];

        externalPayments.forEach(extPayment => {
          // Cek apakah payment ini sudah ada di order.paymentDetails
          const existingIndex = mergedPaymentDetails.findIndex(p =>
            p.method === extPayment.method &&
            Math.abs(p.amount - extPayment.amount) < 100
          );

          if (existingIndex === -1) {
            // Tambahkan sebagai payment tambahan
            mergedPaymentDetails.push({
              method: extPayment.method,
              displayName: getDisplayName(
                extPayment.method,
                extPayment.va_numbers || [],
                extPayment.actions || []
              ),
              amount: extPayment.amount,
              status: extPayment.status,
              isExternalPayment: true,
              paymentType: extPayment.paymentType,
              transaction_id: extPayment.transaction_id,
              processedAt: extPayment.createdAt,
              va_numbers: extPayment.va_numbers || [],
              actions: extPayment.actions || []
            });
          }
        });

        return {
          ...order,
          paymentDetails: mergedPaymentDetails,
          externalPayments: externalPayments,
          totalPaid: mergedPaymentDetails.reduce((sum, p) => sum + p.amount, 0)
        };
      }

      return order;
    });

    // GENERATE REPORTS
    // 1. Payment Method Breakdown dengan handling split payment
    const paymentMethodBreakdown = generateDetailedPaymentMethodBreakdown(finalOrders);

    // 2. Group by period
    const periodSummary = generatePeriodSummary(finalOrders, groupBy);

    // 3. Item sales breakdown
    const itemSalesBreakdown = generateItemSalesBreakdown(finalOrders);

    // 4. Split payment analysis
    const splitPaymentAnalysis = generateSplitPaymentAnalysis(finalOrders);

    // Final report
    const finalReport = {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        timezone: 'Asia/Jakarta',
        groupBy
      },
      summary: {
        totalRevenue: finalOrders.reduce((sum, order) => sum + order.totalPaid, 0),
        totalTransactions: finalOrders.reduce((sum, order) => sum + order.splitPaymentCount, 0),
        totalOrders: finalOrders.length,
        totalItemsSold: finalOrders.reduce((sum, order) =>
          sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0), 0),
        averageTransaction: finalOrders.length > 0 ?
          finalOrders.reduce((sum, order) => sum + order.totalPaid, 0) / finalOrders.length : 0,
        splitPaymentOrders: finalOrders.filter(o => o.hasSplitPayment).length,
        singlePaymentOrders: finalOrders.filter(o => !o.hasSplitPayment).length
      },
      paymentMethods: paymentMethodBreakdown,
      splitPaymentAnalysis: splitPaymentAnalysis,
      itemSales: itemSalesBreakdown,
      periodBreakdown: periodSummary,
      rawDataCount: finalOrders.length
    };

    return res.status(200).json({
      success: true,
      data: finalReport
    });

  } catch (error) {
    console.error('Error generating sales report:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function untuk breakdown payment method dengan handling split payment
const generateDetailedPaymentMethodBreakdown = (orders) => {
  const paymentMethodMap = new Map();
  const allPayments = [];

  // Collect all payments from orders
  orders.forEach(order => {
    order.paymentDetails.forEach(payment => {
      allPayments.push({
        ...payment,
        order_id: order.order_id,
        order_date: order.createdAt,
        order_total: order.grandTotal
      });
    });
  });

  // Group by payment method dengan displayName
  allPayments.forEach(payment => {
    const method = payment.method || 'Unknown';
    const displayName = payment.displayName || method;
    const normalizedMethod = normalizePaymentMethodForReport(method);
    const amount = payment.amount || 0;
    const orderId = payment.order_id;

    // Gunakan displayName sebagai key untuk grouping yang lebih spesifik
    const groupKey = displayName;

    if (!paymentMethodMap.has(groupKey)) {
      paymentMethodMap.set(groupKey, {
        method: normalizedMethod,
        displayName: displayName,
        originalMethod: method,
        totalAmount: 0,
        transactionCount: 0,
        orderCount: new Set(),
        splitPaymentCount: 0,
        singlePaymentCount: 0,
        averageTransaction: 0,
        percentageOfTotal: 0
      });
    }

    const methodData = paymentMethodMap.get(groupKey);
    methodData.totalAmount += amount;
    methodData.transactionCount += 1;
    methodData.orderCount.add(orderId);

    // Track split vs single
    if (payment.isSplitPayment) {
      methodData.splitPaymentCount += 1;
    } else {
      methodData.singlePaymentCount += 1;
    }
  });

  // Calculate totals for percentage
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPaid, 0);

  // Convert Map to Array and calculate additional metrics
  const result = Array.from(paymentMethodMap.values()).map(methodData => {
    const orderCount = methodData.orderCount.size;
    methodData.orderCount = orderCount;
    methodData.averageTransaction = methodData.transactionCount > 0 ?
      methodData.totalAmount / methodData.transactionCount : 0;
    methodData.percentageOfTotal = totalRevenue > 0 ?
      (methodData.totalAmount / totalRevenue) * 100 : 0;

    return methodData;
  });

  // Sort by total amount descending
  return result.sort((a, b) => b.totalAmount - a.totalAmount);
};

// Helper function untuk split payment analysis
const generateSplitPaymentAnalysis = (orders) => {
  const splitOrders = orders.filter(o => o.hasSplitPayment);

  if (splitOrders.length === 0) {
    return {
      totalSplitOrders: 0,
      percentageOfTotalOrders: 0,
      averagePaymentsPerOrder: 0,
      methodCombinations: [],
      revenueFromSplitPayments: 0,
      percentageOfTotalRevenue: 0
    };
  }

  // Analyze method combinations dengan displayName
  const methodCombinationMap = new Map();
  const methodFrequency = new Map();

  splitOrders.forEach(order => {
    const methods = order.paymentDetails
      .map(p => p.displayName || p.method || 'Unknown')
      .sort()
      .join(' + ');

    if (!methodCombinationMap.has(methods)) {
      methodCombinationMap.set(methods, {
        combination: methods,
        count: 0,
        totalAmount: 0,
        averageAmount: 0,
        orders: []
      });
    }

    const comboData = methodCombinationMap.get(methods);
    comboData.count += 1;
    comboData.totalAmount += order.totalPaid;
    comboData.orders.push({
      order_id: order.order_id,
      amount: order.totalPaid,
      paymentCount: order.paymentDetails.length,
      methods: order.paymentDetails.map(p => ({
        method: p.method,
        displayName: p.displayName,
        amount: p.amount,
        status: p.status
      }))
    });

    // Count individual method frequency in split payments
    order.paymentDetails.forEach(payment => {
      const displayName = payment.displayName || payment.method || 'Unknown';
      if (!methodFrequency.has(displayName)) {
        methodFrequency.set(displayName, {
          method: payment.method,
          displayName: displayName,
          count: 0,
          totalAmount: 0
        });
      }
      const freqData = methodFrequency.get(displayName);
      freqData.count += 1;
      freqData.totalAmount += payment.amount;
    });
  });

  // Calculate averages and percentages
  const totalRevenueFromSplit = splitOrders.reduce((sum, o) => sum + o.totalPaid, 0);
  const totalRevenueAll = orders.reduce((sum, o) => sum + o.totalPaid, 0);

  const combinations = Array.from(methodCombinationMap.values()).map(combo => ({
    ...combo,
    averageAmount: combo.totalAmount / combo.count,
    percentageOfSplitOrders: (combo.count / splitOrders.length) * 100,
    percentageOfTotalRevenue: totalRevenueFromSplit > 0 ? (combo.totalAmount / totalRevenueFromSplit) * 100 : 0,
    orders: combo.orders.slice(0, 5)
  })).sort((a, b) => b.count - a.count);

  const methodFrequencyArray = Array.from(methodFrequency.values())
    .map(freq => ({
      ...freq,
      averageAmount: freq.totalAmount / freq.count,
      percentageOfSplitPayments: (freq.count / splitOrders.reduce((sum, o) => sum + o.paymentDetails.length, 0)) * 100
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalSplitOrders: splitOrders.length,
    percentageOfTotalOrders: (splitOrders.length / orders.length) * 100,
    averagePaymentsPerOrder: splitOrders.reduce((sum, o) => sum + o.paymentDetails.length, 0) / splitOrders.length,
    methodCombinations: combinations,
    methodFrequency: methodFrequencyArray,
    revenueFromSplitPayments: totalRevenueFromSplit,
    percentageOfTotalRevenue: totalRevenueAll > 0 ? (totalRevenueFromSplit / totalRevenueAll) * 100 : 0,
    splitOrdersSample: splitOrders.slice(0, 10).map(o => ({
      order_id: o.order_id,
      totalAmount: o.totalPaid,
      paymentCount: o.paymentDetails.length,
      payments: o.paymentDetails.map(p => ({
        method: p.method,
        displayName: p.displayName,
        amount: p.amount,
        status: p.status
      }))
    }))
  };
};

// Helper function untuk summary berdasarkan periode
const generatePeriodSummary = (orders, groupBy) => {
  const periodMap = new Map();

  orders.forEach(order => {
    const date = new Date(order.createdAt);
    let periodKey;

    switch (groupBy) {
      case 'daily':
        periodKey = date.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = `Week-${weekStart.toISOString().split('T')[0]}`;
        break;
      case 'monthly':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        periodKey = date.toISOString().split('T')[0];
    }

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        period: periodKey,
        totalRevenue: 0,
        transactionCount: 0,
        orderCount: new Set(),
        splitPaymentCount: 0,
        totalItemsSold: 0,
        paymentMethods: new Map()
      });
    }

    const periodData = periodMap.get(periodKey);

    periodData.totalRevenue += order.totalPaid;
    periodData.orderCount.add(order.order_id);

    // Calculate total transactions (including split payments)
    const transactionCount = order.hasSplitPayment ? order.paymentDetails.length : 1;
    periodData.transactionCount += transactionCount;

    if (order.hasSplitPayment) {
      periodData.splitPaymentCount += 1;
    }

    // Calculate items sold for this period
    const itemsCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    periodData.totalItemsSold += itemsCount;

    // Track payment methods within period dengan displayName
    order.paymentDetails.forEach(payment => {
      const displayName = payment.displayName || payment.method || 'Unknown';
      if (!periodData.paymentMethods.has(displayName)) {
        periodData.paymentMethods.set(displayName, {
          method: payment.method,
          displayName: displayName,
          amount: 0,
          count: 0,
          splitPaymentCount: 0
        });
      }

      const methodData = periodData.paymentMethods.get(displayName);
      methodData.amount += payment.amount || 0;
      methodData.count += 1;

      if (order.hasSplitPayment) {
        methodData.splitPaymentCount += 1;
      }
    });
  });

  // Convert Map to Array and format
  return Array.from(periodMap.values()).map(periodData => {
    periodData.orderCount = periodData.orderCount.size;

    // Convert paymentMethods Map to Array
    periodData.paymentMethods = Array.from(periodData.paymentMethods.values())
      .sort((a, b) => b.amount - a.amount);

    periodData.averageTransaction = periodData.transactionCount > 0 ?
      periodData.totalRevenue / periodData.transactionCount : 0;

    periodData.averageOrderValue = periodData.orderCount > 0 ?
      periodData.totalRevenue / periodData.orderCount : 0;

    periodData.averageItemsPerOrder = periodData.orderCount > 0 ?
      periodData.totalItemsSold / periodData.orderCount : 0;

    periodData.splitPaymentPercentage = periodData.orderCount > 0 ?
      (periodData.splitPaymentCount / periodData.orderCount) * 100 : 0;

    return periodData;
  }).sort((a, b) => a.period.localeCompare(b.period));
};

// Helper function untuk breakdown item sales
const generateItemSalesBreakdown = (orders) => {
  const itemMap = new Map();

  orders.forEach(order => {
    order.items.forEach(item => {
      const menuItem = item.menuItem;
      const itemId = menuItem?._id ? menuItem._id.toString() : 'deleted_' + Math.random().toString(36).substr(2, 9);
      const itemName = menuItem?.name || 'Menu Item Deleted';
      const itemPrice = item.price || menuItem?.price || 0;
      const quantity = item.quantity || 0;

      if (!itemMap.has(itemId)) {
        itemMap.set(itemId, {
          itemId: itemId,
          name: itemName,
          price: itemPrice,
          totalQuantity: 0,
          totalRevenue: 0,
          orders: new Set(),
          isActive: menuItem?.isActive !== false
        });
      }

      const itemData = itemMap.get(itemId);
      itemData.totalQuantity += quantity;
      itemData.totalRevenue += itemPrice * quantity;
      itemData.orders.add(order.order_id);
    });
  });

  const result = Array.from(itemMap.values()).map(itemData => ({
    ...itemData,
    totalOrders: itemData.orders.size,
    orders: Array.from(itemData.orders).slice(0, 10),
    averageQuantityPerOrder: itemData.totalOrders > 0 ? itemData.totalQuantity / itemData.totalOrders : 0,
    percentageOfTotalRevenue: orders.reduce((sum, o) => sum + o.totalPaid, 0) > 0 ?
      (itemData.totalRevenue / orders.reduce((sum, o) => sum + o.totalPaid, 0)) * 100 : 0
  }));

  return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
};

// Normalize payment method for reporting
const normalizePaymentMethodForReport = (method) => {
  const methodLower = method.toLowerCase();

  switch (methodLower) {
    case 'cash':
      return 'Cash';
    case 'qris':
      return 'QRIS';
    case 'debit':
    case 'credit':
    case 'card':
      return 'Card';
    case 'transfer':
    case 'bank_transfer':
    case 'bank transfer':
      return 'Bank Transfer';
    case 'gopay':
    case 'ovo':
    case 'dana':
    case 'shopeepay':
    case 'linkaja':
      return 'E-Wallet';
    default:
      return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  }
};

// Function getDisplayName untuk generate display name yang lebih deskriptif
export const getDisplayName = (method, va_numbers = [], actions = []) => {
  let displayName = method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown';

  if (method === 'Bank Transfer' || method === 'Debit') {
    // Append bank name dari va_numbers
    const bankName = va_numbers && va_numbers.length > 0 ? va_numbers[0].bank : '';
    displayName = bankName ? `${method} - ${bankName.toUpperCase()}` : `${method}`;
  } else if (method === 'QRIS') {
    // Gunakan name dari actions
    const actionName = actions && actions.length > 0 ? actions[0].name : '';
    displayName = actionName ? `${method} - ${actionName}` : `${method}`;
  } else if (method === 'Cash') {
    // Cash tetap menggunakan method name saja
    displayName = method;
  }

  return displayName;
};

// Controller untuk mendapatkan detail transaksi
export const getPaymentDetails = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      outletId,
      paymentMethod,
      limit = 50,
      page = 1,
      includeSplitDetails = false
    } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const skip = (page - 1) * limit;

    // Build query untuk orders
    const orderQuery = {
      createdAt: { $gte: start, $lte: end },
      status: { $in: ['Completed'] },
      ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) })
    };

    const orders = await Order.find(orderQuery)
      .populate({
        path: 'items.menuItem',
        model: 'MenuItem',
        select: 'name price isActive',
        options: { allowNull: true }
      })
      .populate('outlet', 'name location')
      .populate('cashierId', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Process orders untuk payment details
    const processedOrders = orders.map(order => {
      // Process items
      const processedItems = order.items.map(item => {
        const menuItem = item.menuItem;

        if (!menuItem) {
          return {
            ...item,
            menuItem: {
              _id: null,
              name: 'Menu Item Deleted',
              price: item.price || item.subtotal || 0,
              isActive: false
            }
          };
        }

        return {
          ...item,
          menuItem: {
            _id: menuItem._id,
            name: menuItem.name || 'Unknown Menu Item',
            price: menuItem.price || item.price || 0,
            isActive: menuItem.isActive !== false
          }
        };
      });

      // Get payment details
      let paymentDetails = [];

      if (order.isSplitPayment && order.payments && Array.isArray(order.payments)) {
        paymentDetails = order.payments.map(payment => ({
          method: payment.paymentMethod || order.paymentMethod || 'Cash',
          displayName: getDisplayName(
            payment.paymentMethod || order.paymentMethod || 'Cash',
            payment.va_numbers || [],
            payment.actions || []
          ),
          amount: payment.amount || 0,
          status: payment.status || 'completed',
          isSplitPayment: true,
          tenderedAmount: payment.paymentDetails?.cashTendered || payment.amount || 0,
          changeAmount: payment.paymentDetails?.change || 0,
          processedAt: payment.processedAt || order.createdAt
        }));
      } else {
        paymentDetails = [{
          method: order.paymentMethod || 'Cash',
          displayName: getDisplayName(
            order.paymentMethod || 'Cash',
            order.payments?.[0]?.va_numbers || [],
            order.payments?.[0]?.actions || []
          ),
          amount: order.grandTotal || 0,
          status: 'completed',
          isSplitPayment: false,
          tenderedAmount: order.payments?.[0]?.paymentDetails?.cashTendered || order.grandTotal || 0,
          changeAmount: order.payments?.[0]?.paymentDetails?.change || 0,
          processedAt: order.createdAt
        }];
      }

      // Filter by payment method if specified
      const filteredPaymentDetails = paymentMethod && paymentMethod !== 'all' ?
        paymentDetails.filter(p => p.method.toLowerCase().includes(paymentMethod.toLowerCase())) :
        paymentDetails;

      const totalPaid = filteredPaymentDetails.reduce((sum, p) => sum + p.amount, 0);

      return {
        order_id: order.order_id,
        createdAt: order.createdAt,
        user: order.user || 'Customer',
        tableNumber: order.tableNumber || '-',
        orderType: order.orderType || 'Dine-In',
        outlet: order.outlet || {},
        cashier: order.cashierId || {},
        grandTotal: order.grandTotal || 0,
        totalPaid: totalPaid,
        hasSplitPayment: order.isSplitPayment || false,
        paymentDetails: filteredPaymentDetails,
        items: processedItems.map(item => ({
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          isActive: item.menuItem.isActive
        }))
      };
    });

    // Filter out orders with no matching payment method
    const filteredOrders = paymentMethod && paymentMethod !== 'all' ?
      processedOrders.filter(o => o.paymentDetails.length > 0) :
      processedOrders;

    const total = await Order.countDocuments(orderQuery);

    return res.status(200).json({
      success: true,
      data: {
        payments: filteredOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          totalOrders: filteredOrders.length,
          totalRevenue: filteredOrders.reduce((sum, o) => sum + o.totalPaid, 0),
          splitPaymentOrders: filteredOrders.filter(o => o.hasSplitPayment).length,
          singlePaymentOrders: filteredOrders.filter(o => !o.hasSplitPayment).length
        }
      }
    });

  } catch (error) {
    console.error('Error getting payment details:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Controller untuk mendapatkan payment method report yang detail
export const getPaymentMethodDetailReport = async (req, res) => {
  try {
    const { startDate, endDate, outletId, groupBy = 'method' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date dan end date harus diisi'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Query orders
    const orderQuery = {
      createdAt: { $gte: start, $lte: end },
      status: { $in: ['Completed'] },
      ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) })
    };

    const orders = await Order.find(orderQuery)
      .select('order_id createdAt grandTotal isSplitPayment payments paymentMethod')
      .lean();

    // Process untuk extract payment details
    const allPayments = [];

    orders.forEach(order => {
      if (order.isSplitPayment && order.payments && Array.isArray(order.payments)) {
        order.payments.forEach(payment => {
          allPayments.push({
            order_id: order.order_id,
            createdAt: order.createdAt,
            method: payment.paymentMethod || order.paymentMethod || 'Cash',
            displayName: getDisplayName(
              payment.paymentMethod || order.paymentMethod || 'Cash',
              payment.va_numbers || [],
              payment.actions || []
            ),
            amount: payment.amount || 0,
            isSplitPayment: true,
            orderTotal: order.grandTotal || 0
          });
        });
      } else {
        allPayments.push({
          order_id: order.order_id,
          createdAt: order.createdAt,
          method: order.paymentMethod || 'Cash',
          displayName: getDisplayName(
            order.paymentMethod || 'Cash',
            order.payments?.[0]?.va_numbers || [],
            order.payments?.[0]?.actions || []
          ),
          amount: order.grandTotal || 0,
          isSplitPayment: false,
          orderTotal: order.grandTotal || 0
        });
      }
    });

    // Group berdasarkan parameter groupBy
    let groupedResults;

    switch (groupBy) {
      case 'method':
        groupedResults = groupPaymentsByMethod(allPayments);
        break;
      case 'day':
        groupedResults = groupPaymentsByDay(allPayments);
        break;
      case 'hour':
        groupedResults = groupPaymentsByHour(allPayments);
        break;
      default:
        groupedResults = groupPaymentsByMethod(allPayments);
    }

    return res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        summary: {
          totalTransactions: allPayments.length,
          totalRevenue: allPayments.reduce((sum, p) => sum + p.amount, 0),
          totalOrders: [...new Set(allPayments.map(p => p.order_id))].length,
          splitPaymentTransactions: allPayments.filter(p => p.isSplitPayment).length,
          singlePaymentTransactions: allPayments.filter(p => !p.isSplitPayment).length
        },
        breakdown: groupedResults
      }
    });

  } catch (error) {
    console.error('Error generating payment method detail report:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Group payments by method
const groupPaymentsByMethod = (payments) => {
  const methodMap = new Map();

  payments.forEach(payment => {
    const displayName = payment.displayName || payment.method || 'Unknown';
    if (!methodMap.has(displayName)) {
      methodMap.set(displayName, {
        method: payment.method,
        displayName: displayName,
        totalAmount: 0,
        transactionCount: 0,
        orderCount: new Set(),
        splitPaymentCount: 0,
        averageAmount: 0,
        orders: []
      });
    }

    const methodData = methodMap.get(displayName);
    methodData.totalAmount += payment.amount;
    methodData.transactionCount += 1;
    methodData.orderCount.add(payment.order_id);

    if (payment.isSplitPayment) {
      methodData.splitPaymentCount += 1;
    }

    // Keep sample of orders
    if (methodData.orders.length < 10) {
      methodData.orders.push({
        order_id: payment.order_id,
        amount: payment.amount,
        isSplitPayment: payment.isSplitPayment,
        date: payment.createdAt
      });
    }
  });

  // Convert to array and calculate averages
  return Array.from(methodMap.values()).map(data => ({
    ...data,
    orderCount: data.orderCount.size,
    averageAmount: data.transactionCount > 0 ? data.totalAmount / data.transactionCount : 0,
    splitPaymentPercentage: data.transactionCount > 0 ? (data.splitPaymentCount / data.transactionCount) * 100 : 0
  })).sort((a, b) => b.totalAmount - a.totalAmount);
};

// Group payments by day
const groupPaymentsByDay = (payments) => {
  const dayMap = new Map();

  payments.forEach(payment => {
    const date = new Date(payment.createdAt);
    const dayKey = date.toISOString().split('T')[0];

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, {
        date: dayKey,
        totalAmount: 0,
        transactionCount: 0,
        orderCount: new Set(),
        methods: new Map()
      });
    }

    const dayData = dayMap.get(dayKey);
    dayData.totalAmount += payment.amount;
    dayData.transactionCount += 1;
    dayData.orderCount.add(payment.order_id);

    // Track methods for this day
    const displayName = payment.displayName || payment.method || 'Unknown';
    if (!dayData.methods.has(displayName)) {
      dayData.methods.set(displayName, {
        method: payment.method,
        displayName: displayName,
        amount: 0,
        count: 0
      });
    }
    const methodData = dayData.methods.get(displayName);
    methodData.amount += payment.amount;
    methodData.count += 1;
  });

  // Convert to array
  return Array.from(dayMap.values()).map(data => ({
    ...data,
    orderCount: data.orderCount.size,
    averageTransaction: data.transactionCount > 0 ? data.totalAmount / data.transactionCount : 0,
    methods: Array.from(data.methods.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5) // Top 5 methods per day
  })).sort((a, b) => a.date.localeCompare(b.date));
};

// Group payments by hour
const groupPaymentsByHour = (payments) => {
  const hourMap = new Map();

  for (let i = 0; i < 24; i++) {
    hourMap.set(i, {
      hour: i,
      hourDisplay: `${String(i).padStart(2, '0')}:00`,
      totalAmount: 0,
      transactionCount: 0,
      orderCount: new Set(),
      peakAmount: 0
    });
  }

  payments.forEach(payment => {
    const date = new Date(payment.createdAt);
    const hour = date.getHours();

    const hourData = hourMap.get(hour);
    hourData.totalAmount += payment.amount;
    hourData.transactionCount += 1;
    hourData.orderCount.add(payment.order_id);

    if (payment.amount > hourData.peakAmount) {
      hourData.peakAmount = payment.amount;
    }
  });

  // Convert to array
  return Array.from(hourMap.values()).map(data => ({
    ...data,
    orderCount: data.orderCount.size,
    averageTransaction: data.transactionCount > 0 ? data.totalAmount / data.transactionCount : 0,
    averageAmount: data.transactionCount > 0 ? data.totalAmount / data.transactionCount : 0
  })).sort((a, b) => a.hour - b.hour);
};

// Controller untuk mendapatkan available payment methods
export const getAvailablePaymentMethods = async (req, res) => {
  try {
    const { startDate, endDate, outletId } = req.query;

    const orderQuery = {
      status: { $in: ['Completed'] },
      ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) })
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      orderQuery.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(orderQuery)
      .select('paymentMethod isSplitPayment payments')
      .lean();

    // Extract all unique payment methods dengan displayName
    const methodSet = new Set();
    const methodDetails = new Map();

    orders.forEach(order => {
      if (order.isSplitPayment && order.payments && Array.isArray(order.payments)) {
        order.payments.forEach(payment => {
          const method = payment.paymentMethod || order.paymentMethod;
          const displayName = getDisplayName(
            method,
            payment.va_numbers || [],
            payment.actions || []
          );

          if (method) {
            methodSet.add(displayName);

            if (!methodDetails.has(displayName)) {
              methodDetails.set(displayName, {
                method: method,
                displayName: displayName,
                count: 0,
                splitPaymentCount: 0,
                singlePaymentCount: 0
              });
            }
            const detail = methodDetails.get(displayName);
            detail.count += 1;
            detail.splitPaymentCount += 1;
          }
        });
      } else {
        const method = order.paymentMethod;
        const displayName = getDisplayName(
          method,
          order.payments?.[0]?.va_numbers || [],
          order.payments?.[0]?.actions || []
        );

        if (method) {
          methodSet.add(displayName);

          if (!methodDetails.has(displayName)) {
            methodDetails.set(displayName, {
              method: method,
              displayName: displayName,
              count: 0,
              splitPaymentCount: 0,
              singlePaymentCount: 0
            });
          }
          const detail = methodDetails.get(displayName);
          detail.count += 1;
          detail.singlePaymentCount += 1;
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        methods: Array.from(methodDetails.values()).sort((a, b) => b.count - a.count)
      }
    });

  } catch (error) {
    console.error('Error getting available payment methods:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};