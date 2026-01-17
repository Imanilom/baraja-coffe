import { Order } from '../../models/order.model.js';
import Payment from '../../models/Payment.model.js';
import mongoose from 'mongoose';

export const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, outletId, groupBy = 'daily', includeTax = 'true' } = req.query;

    const shouldIncludeTax = includeTax === 'true';

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date dan end date harus diisi'
      });
    }

    // Parse tanggal dengan timezone +07:00 (WIB)
    const startDateStr = startDate;
    const endDateStr = endDate;
    const start = new Date(startDateStr + 'T00:00:00.000+07:00');
    const end = new Date(endDateStr + 'T23:59:59.999+07:00');

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

    // Build filter
    const filter = {
      status: 'Completed',
      createdAt: { $gte: start, $lte: end }
    };

    if (outletId) {
      filter.outlet = new mongoose.Types.ObjectId(outletId);
    }

    // ============================================
    // SUMMARY STATS - FIXED VERSION
    // ============================================
    const summaryPipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalSalesWithoutTax: { $sum: { $ifNull: ['$totalAfterDiscount', '$grandTotal'] } },
          totalTransactions: { $sum: 1 },
          totalTax: { $sum: '$tax' },
          totalServiceFee: { $sum: '$serviceCharge' },
          totalItems: { $sum: { $size: '$items' } },
          avgOrderValue: { $avg: '$grandTotal' },
          avgOrderValueWithoutTax: { $avg: { $ifNull: ['$totalAfterDiscount', '$grandTotal'] } },
          totalDiscount: { $sum: '$discount' },
          splitPaymentOrders: {
            $sum: { $cond: ['$isSplitPayment', 1, 0] }
          },
          singlePaymentOrders: {
            $sum: { $cond: ['$isSplitPayment', 0, 1] }
          },
          orderIds: { $addToSet: '$order_id' }
        }
      }
    ];

    // ============================================
    // PAYMENT METHOD BREAKDOWN - FIXED VERSION (WITH NULL)
    // ============================================
    const paymentBreakdownPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'payments',
          localField: 'order_id',
          foreignField: 'order_id',
          as: 'paymentRecords'
        }
      },
      {
        $addFields: {
          // Get main payment method - termasuk yang null dengan fallback ke method
          mainPaymentMethod: {
            $let: {
              vars: {
                validPayments: {
                  $filter: {
                    input: '$paymentRecords',
                    as: 'payment',
                    cond: {
                      $and: [
                        { $in: ['$$payment.status', ['settlement', 'paid', 'partial']] },
                        { $ne: ['$$payment.isAdjustment', true] }
                      ]
                    }
                  }
                }
              },
              in: {
                $cond: {
                  if: { $gt: [{ $size: '$$validPayments' }, 0] },
                  then: {
                    // ✅ PERBAIKAN: Fallback ke 'method' jika 'method_type' null
                    $let: {
                      vars: {
                        firstPayment: { $arrayElemAt: ['$$validPayments', 0] }
                      },
                      in: {
                        $ifNull: [
                          '$$firstPayment.method_type',
                          '$$firstPayment.method'
                        ]
                      }
                    }
                  },
                  // Jika tidak ada payment valid, set sebagai null
                  else: null
                }
              }
            }
          }
        }
      },
      // ✅ PERBAIKAN: Tidak filter out yang null, biarkan lewat
      // {
      //   $match: {
      //     mainPaymentMethod: { $exists: true, $ne: null }
      //   }
      // },
      // Group per order_id dulu untuk menghindari duplikasi
      {
        $group: {
          _id: '$order_id',
          paymentMethod: { $first: '$mainPaymentMethod' },
          amountWithTax: { $first: '$grandTotal' },
          amountWithoutTax: { $first: { $ifNull: ['$totalAfterDiscount', '$grandTotal'] } },
          isSplit: { $first: '$isSplitPayment' }
        }
      },
      // Kemudian group per payment method (termasuk null)
      {
        $group: {
          _id: { $ifNull: ['$paymentMethod', 'null'] }, // ✅ Convert null to string 'null'
          totalAmountWithTax: { $sum: '$amountWithTax' },
          totalAmountWithoutTax: { $sum: '$amountWithoutTax' },
          transactionCount: { $sum: 1 },
          orderIds: { $addToSet: '$_id' },
          splitCount: { $sum: { $cond: ['$isSplit', 1, 0] } }
        }
      },
      {
        $project: {
          _id: 1,
          totalAmountWithTax: 1,
          totalAmountWithoutTax: 1,
          totalAmount: shouldIncludeTax ? '$totalAmountWithTax' : '$totalAmountWithoutTax',
          transactionCount: 1,
          orderIds: 1,
          orderCount: { $size: '$orderIds' },
          splitPaymentCount: '$splitCount',
          singlePaymentCount: { $subtract: ['$transactionCount', '$splitCount'] }
        }
      },
      { $sort: { totalAmount: -1 } }
    ];

    // ============================================
    // PERIOD BREAKDOWN AGGREGATION (WITH NULL)
    // ============================================
    let dateFormat;
    switch (groupBy) {
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      case 'weekly':
        dateFormat = '%Y-W%V';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const periodBreakdownPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'payments',
          localField: 'order_id',
          foreignField: 'order_id',
          as: 'payments'
        }
      },
      {
        $addFields: {
          // ✅ PERBAIKAN: Tangani case ketika tidak ada payment, dengan fallback ke method
          actualPaymentMethod: {
            $cond: {
              if: { $gt: [{ $size: '$payments' }, 0] },
              then: {
                $let: {
                  vars: {
                    validPayments: {
                      $filter: {
                        input: '$payments',
                        as: 'payment',
                        cond: { $in: ['$$payment.status', ['settlement', 'paid', 'partial']] }
                      }
                    }
                  },
                  in: {
                    $cond: {
                      if: { $gt: [{ $size: '$$validPayments' }, 0] },
                      then: {
                        $let: {
                          vars: {
                            firstPayment: { $arrayElemAt: ['$$validPayments', 0] }
                          },
                          in: {
                            $ifNull: [
                              '$$firstPayment.method_type',
                              '$$firstPayment.method'
                            ]
                          }
                        }
                      },
                      else: null
                    }
                  }
                }
              },
              else: null
            }
          }
        }
      },
      {
        $group: {
          _id: {
            period: {
              $dateToString: {
                format: dateFormat,
                date: '$createdAt',
                timezone: 'Asia/Jakarta'
              }
            }
          },
          totalRevenueWithTax: { $sum: '$grandTotal' },
          totalRevenueWithoutTax: { $sum: { $ifNull: ['$totalAfterDiscount', '$grandTotal'] } },
          orderCount: { $sum: 1 },
          splitPaymentCount: { $sum: { $cond: ['$isSplitPayment', 1, 0] } },
          totalItems: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.quantity', 0] }] }
              }
            }
          },
          paymentMethods: {
            $push: {
              method: { $ifNull: ['$actualPaymentMethod', 'null'] }, // ✅ Handle null
              amountWithTax: '$grandTotal',
              amountWithoutTax: { $ifNull: ['$totalAfterDiscount', '$grandTotal'] },
              isSplit: '$isSplitPayment'
            }
          }
        }
      },
      { $sort: { '_id.period': 1 } }
    ];

    // ============================================
    // ITEM SALES BREAKDOWN AGGREGATION
    // ============================================
    const itemSalesBreakdownPipeline = [
      { $match: filter },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'menuData'
        }
      },
      {
        $group: {
          _id: '$items.menuItem',
          name: {
            $first: {
              $ifNull: [
                { $arrayElemAt: ['$menuData.name', 0] },
                'Menu Item Deleted'
              ]
            }
          },
          price: {
            $first: {
              $ifNull: [
                '$items.price',
                { $arrayElemAt: ['$menuData.price', 0] }
              ]
            }
          },
          totalQuantity: { $sum: { $ifNull: ['$items.quantity', 0] } },
          totalRevenue: {
            $sum: {
              $multiply: [
                { $ifNull: ['$items.quantity', 0] },
                { $ifNull: ['$items.price', { $arrayElemAt: ['$menuData.price', 0] }] }
              ]
            }
          },
          orderCount: { $sum: 1 },
          orders: { $addToSet: '$order_id' },
          isActive: {
            $first: {
              $ifNull: [
                { $arrayElemAt: ['$menuData.isActive', 0] },
                false
              ]
            }
          }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 100 }
    ];

    // ============================================
    // SPLIT PAYMENT ANALYSIS
    // ============================================
    const splitPaymentAnalysisPipeline = [
      { $match: { ...filter, isSplitPayment: true } },
      {
        $lookup: {
          from: 'payments',
          localField: 'order_id',
          foreignField: 'order_id',
          as: 'payments'
        }
      },
      {
        $project: {
          order_id: 1,
          grandTotal: shouldIncludeTax ? '$grandTotal' : { $ifNull: ['$totalAfterDiscount', '$grandTotal'] },
          paymentCount: { $size: { $ifNull: ['$payments', []] } },
          paymentMethods: {
            $map: {
              input: {
                $filter: {
                  input: '$payments',
                  as: 'p',
                  cond: { $in: ['$$p.status', ['settlement', 'paid', 'partial']] }
                }
              },
              as: 'payment',
              // ✅ PERBAIKAN: Fallback ke method jika method_type null
              in: { $ifNull: ['$$payment.method_type', '$$payment.method'] }
            }
          },
          paymentMethodsCombined: {
            $reduce: {
              input: {
                $map: {
                  input: {
                    $filter: {
                      input: '$payments',
                      as: 'p',
                      cond: { $in: ['$$p.status', ['settlement', 'paid', 'partial']] }
                    }
                  },
                  as: 'payment',
                  // ✅ PERBAIKAN: Fallback ke method jika method_type null
                  in: { $ifNull: ['$$payment.method_type', '$$payment.method'] }
                }
              },
              initialValue: '',
              in: {
                $concat: [
                  '$$value',
                  { $cond: [{ $eq: ['$$value', ''] }, '', ' + '] },
                  { $ifNull: ['$$this', 'Unknown'] }
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$paymentMethodsCombined',
          count: { $sum: 1 },
          totalAmount: { $sum: '$grandTotal' },
          avgPaymentCount: { $avg: '$paymentCount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ];

    // ============================================
    // EXECUTE ALL AGGREGATIONS IN PARALLEL
    // ============================================
    const [
      summaryResult,
      paymentBreakdown,
      periodBreakdown,
      itemSalesBreakdown,
      splitPaymentAnalysis
    ] = await Promise.all([
      Order.aggregate(summaryPipeline).allowDiskUse(true),
      Order.aggregate(paymentBreakdownPipeline).allowDiskUse(true),
      Order.aggregate(periodBreakdownPipeline).allowDiskUse(true),
      Order.aggregate(itemSalesBreakdownPipeline).allowDiskUse(true),
      Order.aggregate(splitPaymentAnalysisPipeline).allowDiskUse(true)
    ]);

    // ============================================
    // FORMAT RESULTS
    // ============================================
    const summary = summaryResult[0] || {
      totalSales: 0,
      totalSalesWithoutTax: 0,
      totalTransactions: 0,
      totalTax: 0,
      totalServiceFee: 0,
      avgOrderValue: 0,
      avgOrderValueWithoutTax: 0,
      totalDiscount: 0,
      totalItems: 0,
      splitPaymentOrders: 0,
      singlePaymentOrders: 0,
      orderIds: []
    };

    // Validasi: Bandingkan total dari payment breakdown dengan summary
    const totalPaymentAmount = paymentBreakdown.reduce((sum, pm) => sum + pm.totalAmount, 0);
    const expectedTotal = shouldIncludeTax ? summary.totalSales : summary.totalSalesWithoutTax;

    // Log untuk debugging
    console.log('Validation Check:');
    console.log('Summary Total:', expectedTotal);
    console.log('Payment Breakdown Total:', totalPaymentAmount);
    console.log('Difference:', Math.abs(expectedTotal - totalPaymentAmount));
    console.log('Total Orders in Summary:', summary.totalTransactions);
    console.log('Total Orders in Payment Breakdown:', paymentBreakdown.reduce((sum, pm) => sum + pm.orderCount, 0));

    // ✅ Merge payment methods yang memiliki nama sama setelah normalisasi
    const mergedPaymentBreakdown = mergeNormalizedPaymentMethods(paymentBreakdown);

    // Recalculate total after merge
    const totalPaymentAmountAfterMerge = mergedPaymentBreakdown.reduce((sum, pm) => sum + pm.totalAmount, 0);

    // ✅ Format payment method (termasuk null) dengan nama yang sudah dinormalisasi
    const paymentMethodData = mergedPaymentBreakdown.map(item => ({
      method: item._id === 'null' ? null : item._id,
      displayName: item._id === 'null' ? 'Pembayaran Tidak Terdeteksi / Null' : item._id,
      originalMethod: item._id === 'null' ? null : item._id,
      originalNames: item.originalNames || [item._id], // Track original names before merge
      totalAmount: item.totalAmount,
      amount: item.totalAmount,
      transactionCount: item.transactionCount,
      count: item.transactionCount,
      orderCount: item.orderCount,
      orderIds: item.orderIds || [],
      splitPaymentCount: item.splitPaymentCount || item.splitCount || 0,
      singlePaymentCount: item.singlePaymentCount || (item.transactionCount - (item.splitCount || 0)),
      averageTransaction: item.transactionCount > 0 ? item.totalAmount / item.transactionCount : 0,
      percentageOfTotal: totalPaymentAmountAfterMerge > 0 ? (item.totalAmount / totalPaymentAmountAfterMerge * 100) : 0,
      percentage: totalPaymentAmountAfterMerge > 0 ? ((item.totalAmount / totalPaymentAmountAfterMerge * 100).toFixed(2)) : '0.00',
      breakdown: []
    })).sort((a, b) => b.totalAmount - a.totalAmount); // Sort by amount descending

    // Format period breakdown
    const periodBreakdownData = periodBreakdown.map(p => {
      const methodMap = new Map();
      p.paymentMethods.forEach(pm => {
        // ✅ Normalisasi nama payment method
        let rawMethod = pm.method === 'null' ? 'Pembayaran Tidak Terdeteksi / Null' : (pm.method || 'Unknown');
        const method = rawMethod === 'Pembayaran Tidak Terdeteksi / Null'
          ? rawMethod
          : normalizePaymentMethodName(rawMethod);
        const amount = shouldIncludeTax ? pm.amountWithTax : pm.amountWithoutTax;

        if (!methodMap.has(method)) {
          methodMap.set(method, { amount: 0, count: 0, splitCount: 0 });
        }
        const data = methodMap.get(method);
        data.amount += amount;
        data.count += 1;
        if (pm.isSplit) data.splitCount += 1;
      });

      const totalRevenue = shouldIncludeTax ? p.totalRevenueWithTax : p.totalRevenueWithoutTax;

      return {
        period: p._id.period,
        totalRevenue: totalRevenue,
        totalRevenueWithTax: p.totalRevenueWithTax,
        totalRevenueWithoutTax: p.totalRevenueWithoutTax,
        orderCount: p.orderCount,
        splitPaymentCount: p.splitPaymentCount,
        totalItemsSold: p.totalItems,
        averageOrderValue: p.orderCount > 0 ? totalRevenue / p.orderCount : 0,
        averageItemsPerOrder: p.orderCount > 0 ? p.totalItems / p.orderCount : 0,
        splitPaymentPercentage: p.orderCount > 0 ? (p.splitPaymentCount / p.orderCount * 100) : 0,
        paymentMethods: Array.from(methodMap.entries()).map(([method, data]) => ({
          method,
          displayName: method,
          amount: data.amount,
          count: data.count,
          splitPaymentCount: data.splitCount
        })).sort((a, b) => b.amount - a.amount)
      };
    });

    // Format item sales
    const itemSalesData = itemSalesBreakdown.map(item => ({
      itemId: item._id ? item._id.toString() : 'deleted',
      name: item.name,
      price: item.price || 0,
      totalQuantity: item.totalQuantity,
      totalRevenue: item.totalRevenue,
      totalOrders: item.orderCount,
      isActive: item.isActive,
      averageQuantityPerOrder: item.orderCount > 0 ? item.totalQuantity / item.orderCount : 0,
      percentageOfTotalRevenue: summary.totalSales > 0 ? (item.totalRevenue / summary.totalSales * 100) : 0
    }));

    // Format split payment analysis
    const splitPaymentData = {
      totalSplitOrders: summary.splitPaymentOrders,
      totalOrders: summary.totalTransactions,
      percentageOfTotalOrders: summary.totalTransactions > 0 ?
        (summary.splitPaymentOrders / summary.totalTransactions * 100) : 0,
      methodCombinations: splitPaymentAnalysis.map(sp => ({
        combination: sp._id || 'Unknown',
        count: sp.count,
        totalAmount: sp.totalAmount,
        averageAmount: sp.totalAmount / sp.count,
        averagePaymentCount: sp.avgPaymentCount,
        percentageOfSplitOrders: summary.splitPaymentOrders > 0 ?
          (sp.count / summary.splitPaymentOrders * 100) : 0
      }))
    };

    // ============================================
    // FINAL REPORT
    // ============================================
    const finalReport = {
      period: {
        startDate,
        endDate,
        timezone: 'Asia/Jakarta',
        groupBy,
        includeTax: shouldIncludeTax
      },
      summary: {
        totalRevenue: shouldIncludeTax ? summary.totalSales : summary.totalSalesWithoutTax,
        totalRevenueWithTax: summary.totalSales,
        totalRevenueWithoutTax: summary.totalSalesWithoutTax,
        totalTax: summary.totalTax,
        totalServiceCharge: summary.totalServiceFee,
        totalDiscount: summary.totalDiscount,
        totalTransactions: summary.totalTransactions,
        totalOrders: summary.totalTransactions,
        totalItemsSold: summary.totalItems,
        averageTransaction: shouldIncludeTax ?
          Math.round(summary.avgOrderValue) :
          Math.round(summary.avgOrderValueWithoutTax),
        splitPaymentOrders: summary.splitPaymentOrders,
        singlePaymentOrders: summary.singlePaymentOrders
      },
      paymentMethods: paymentMethodData,
      splitPaymentAnalysis: splitPaymentData,
      itemSales: itemSalesData,
      periodBreakdown: periodBreakdownData,
      rawDataCount: summary.totalTransactions,
      validation: {
        summaryTotal: expectedTotal,
        paymentBreakdownTotal: totalPaymentAmount,
        difference: Math.abs(expectedTotal - totalPaymentAmount),
        isMatched: Math.abs(expectedTotal - totalPaymentAmount) < 1
      }
    };

    return res.status(200).json({
      success: true,
      data: finalReport
    });

  } catch (error) {
    console.error('Error generating sales report:', error);

    if (error.name === 'MongooseError' || error.message.includes('timed out')) {
      return res.status(504).json({
        success: false,
        message: 'Request timeout - data terlalu besar. Coba kurangi rentang tanggal.',
        error: 'Gateway Timeout'
      });
    }

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

// ============================================
// NORMALISASI NAMA METODE PEMBAYARAN
// Format: [Metode] [Bank] - contoh: "QRIS BRI", "Debit BCA", "Bank Transfer Mandiri"
// ============================================
const normalizePaymentMethodName = (methodName) => {
  if (!methodName || methodName === 'null' || methodName === null) {
    return methodName;
  }

  const name = methodName.trim();
  const nameUpper = name.toUpperCase();

  // Daftar metode pembayaran yang dikenali (urut prioritas)
  const paymentMethods = [
    { key: 'QRIS', display: 'QRIS' },
    { key: 'BANK TRANSFER', display: 'Bank Transfer' },
    { key: 'TRANSFER', display: 'Bank Transfer' },
    { key: 'DEBIT', display: 'Debit' },
    { key: 'CREDIT', display: 'Credit' },
    { key: 'E-WALLET', display: 'E-Wallet' },
    { key: 'EWALLET', display: 'E-Wallet' }
  ];

  // Daftar bank/provider yang dikenali
  const banks = [
    { key: 'BRI', display: 'BRI' },
    { key: 'BCA', display: 'BCA' },
    { key: 'BNI', display: 'BNI' },
    { key: 'MANDIRI', display: 'Mandiri' },
    { key: 'CIMB', display: 'CIMB' },
    { key: 'PERMATA', display: 'Permata' },
    { key: 'BSI', display: 'BSI' },
    { key: 'DANAMON', display: 'Danamon' },
    { key: 'GOPAY', display: 'GoPay' },
    { key: 'OVO', display: 'OVO' },
    { key: 'DANA', display: 'Dana' },
    { key: 'SHOPEEPAY', display: 'ShopeePay' },
    { key: 'LINKAJA', display: 'LinkAja' },
    { key: 'PT SCN', display: 'PT SCN' }
  ];

  // Cari metode pembayaran dalam string
  let foundMethod = null;
  for (const method of paymentMethods) {
    if (nameUpper.includes(method.key)) {
      foundMethod = method;
      break;
    }
  }

  // Cari bank/provider dalam string
  let foundBank = null;
  for (const bank of banks) {
    if (nameUpper.includes(bank.key)) {
      foundBank = bank;
      break;
    }
  }

  // Kasus khusus: Cash tetap Cash
  if (nameUpper === 'CASH' || name.toLowerCase() === 'cash') {
    return 'Cash';
  }

  // Format: [Metode] [Bank]
  if (foundMethod && foundBank) {
    return `${foundMethod.display} ${foundBank.display}`;
  }

  // Jika hanya ada metode tanpa bank
  if (foundMethod && !foundBank) {
    return foundMethod.display;
  }

  // Jika hanya ada bank tanpa metode yang jelas (kemungkinan Bank Transfer)
  if (!foundMethod && foundBank) {
    // Cek apakah ada kata-kata yang mengindikasikan tipe transaksi
    if (nameUpper.includes('TRANSFER') || nameUpper.includes('VA') || nameUpper.includes('VIRTUAL')) {
      return `Bank Transfer ${foundBank.display}`;
    }
    // Default: kembalikan dengan format Bank Transfer
    return `Bank Transfer ${foundBank.display}`;
  }

  // Tidak dikenali, kembalikan apa adanya dengan capitalize
  return name;
};

// Fungsi untuk merge payment methods yang memiliki nama sama setelah normalisasi
const mergeNormalizedPaymentMethods = (paymentData) => {
  const mergedMap = new Map();

  paymentData.forEach(item => {
    const originalId = item._id;
    const normalizedName = normalizePaymentMethodName(originalId);
    const key = normalizedName === null || normalizedName === 'null'
      ? 'null'
      : normalizedName;

    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key);
      existing.totalAmountWithTax += item.totalAmountWithTax || 0;
      existing.totalAmountWithoutTax += item.totalAmountWithoutTax || 0;
      existing.totalAmount += item.totalAmount || 0;
      existing.transactionCount += item.transactionCount || 0;
      existing.orderIds = [...(existing.orderIds || []), ...(item.orderIds || [])];
      existing.splitCount += item.splitCount || 0;
      existing.orderCount += item.orderCount || 0;
      existing.originalNames.push(originalId);
    } else {
      mergedMap.set(key, {
        ...item,
        _id: key,
        normalizedName: normalizedName,
        originalNames: [originalId],
        totalAmountWithTax: item.totalAmountWithTax || 0,
        totalAmountWithoutTax: item.totalAmountWithoutTax || 0,
        splitCount: item.splitCount || 0,
        orderCount: item.orderCount || 0
      });
    }
  });

  return Array.from(mergedMap.values());
};

// Function getDisplayName untuk generate display name yang lebih deskriptif
export const getDisplayName = (method, va_numbers = [], actions = [], method_type = null) => {
  // ✅ Prioritaskan method_type jika tersedia
  if (method_type) {
    return method_type;
  }

  // Fallback ke logic lama jika method_type tidak ada
  let displayName = method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown';

  if (method === 'Bank Transfer' || method === 'Debit') {
    const bankName = va_numbers && va_numbers.length > 0 ? va_numbers[0].bank : '';
    displayName = bankName ? `${method} - ${bankName.toUpperCase()}` : `${method}`;
  } else if (method === 'QRIS') {
    const actionName = actions && actions.length > 0 ? actions[0].name : '';
    displayName = actionName ? `${method} - ${actionName}` : `${method}`;
  } else if (method === 'Cash') {
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