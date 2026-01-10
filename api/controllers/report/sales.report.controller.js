import mongoose from "mongoose";
import Category from '../../models/Category.model.js';
import { Order } from '../../models/order.model.js';
import Payment from '../../models/Payment.model.js';
import {
  processOrderItems,
  getSafeMenuItemData,
  getProductSummaryFromOrders
} from '../../utils/menuItemHelper.js';


// Helper to extract issuer and acquirer
const extractBankInfo = (payment) => {
  let issuer = '';
  let acquirer = '';

  const vaNumbers = payment.va_numbers || [];
  const actions = payment.actions || [];

  // Try to get issuer from va_numbers or actions
  if (vaNumbers.length > 0) {
    issuer = vaNumbers[0].bank || '';
    acquirer = vaNumbers[0].bank || '';
  } else if (actions.length > 0) {
    const actionName = actions[0].name || '';
    if (actionName.includes('BNI')) {
      issuer = 'BNI';
      acquirer = 'BNI';
    } else if (actionName.includes('BRI')) {
      issuer = 'BRI';
      acquirer = 'BRI';
    } else if (actionName.includes('BCA')) {
      issuer = 'BCA';
      acquirer = 'BCA';
    }
  }

  return { issuer, acquirer };
};

class DailyProfitController {

  async getSalesSummary(req, res) {
    try {
      const { startDate, endDate, cashierId, outletId, paymentMethod, orderType } = req.query;

      // Build filter
      const filter = { status: 'Completed' };

      // Date filter dengan timezone +07:00 (WIB)
      if (startDate || endDate) {
        filter.createdAt = {};

        if (startDate) {
          const startDateStr = startDate;
          const start = new Date(startDateStr + 'T00:00:00.000+07:00');
          filter.createdAt.$gte = start;
        }

        if (endDate) {
          const endDateStr = endDate;
          const end = new Date(endDateStr + 'T23:59:59.999+07:00');
          filter.createdAt.$lte = end;
        }
      }

      // Convert ObjectId fields properly
      if (cashierId) {
        const cashierObjectId = toObjectId(cashierId);
        if (cashierObjectId) {
          filter.cashierId = cashierObjectId;
        }
      }

      if (outletId) {
        const outletObjectId = toObjectId(outletId);
        if (outletObjectId) {
          filter.outlet = outletObjectId;
        }
      }

      if (orderType) filter.orderType = { $in: orderType.split(',') };

      // Summary stats dengan lookup ke Payment
      const summaryPipeline = [
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
            // Ambil method_type dari payment yang settled/paid
            actualPaymentMethod: {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: '$payments',
                        as: 'payment',
                        cond: { $in: ['$$payment.status', ['settlement', 'paid', 'partial']] }
                      }
                    },
                    as: 'p',
                    in: '$$p.method_type'
                  }
                },
                0
              ]
            }
          }
        },
        // Filter berdasarkan method_type jika ada
        ...(paymentMethod ? [{ $match: { actualPaymentMethod: { $in: paymentMethod.split(',') } } }] : []),
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' },
            totalTransactions: { $sum: 1 },
            totalTax: { $sum: '$totalTax' },
            totalServiceFee: { $sum: '$totalServiceFee' },
            // ✅ FIXED: Hitung berdasarkan quantity items + customAmountItems (count as 1 each)
            totalItems: {
              $sum: {
                $add: [
                  // Sum quantity dari regular items
                  {
                    $reduce: {
                      input: { $ifNull: ['$items', []] },
                      initialValue: 0,
                      in: { $add: ['$$value', { $ifNull: ['$$this.quantity', 0] }] }
                    }
                  },
                  // Count customAmountItems (setiap item = 1)
                  { $size: { $ifNull: ['$customAmountItems', []] } }
                ]
              }
            },
            avgOrderValue: { $avg: '$grandTotal' },
            totalDiscount: {
              $sum: {
                $add: [
                  '$discounts.autoPromoDiscount',
                  '$discounts.manualDiscount',
                  '$discounts.voucherDiscount'
                ]
              }
            }
          }
        }
      ];

      // Payment method breakdown dengan detail payment type (menggunakan method_type)
      const paymentBreakdownPipeline = [
        { $match: filter },
        {
          $lookup: {
            from: 'payments',
            localField: 'order_id',
            foreignField: 'order_id',
            as: 'payments'
          }
        },
        { $unwind: '$payments' },
        {
          $match: {
            'payments.status': { $in: ['settlement', 'paid', 'partial'] },
            'payments.isAdjustment': { $ne: true }, // Exclude adjustment payments
            ...(paymentMethod && { 'payments.method_type': { $in: paymentMethod.split(',') } })
          }
        },
        {
          $group: {
            _id: {
              method_type: '$payments.method_type',
              paymentType: '$payments.paymentType'
            },
            total: { $sum: '$payments.amount' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.method_type',
            total: { $sum: '$total' },
            count: { $sum: '$count' },
            breakdown: {
              $push: {
                paymentType: '$_id.paymentType',
                amount: '$total',
                count: '$count'
              }
            }
          }
        }
      ];

      // Order type breakdown
      const orderTypeBreakdownPipeline = [
        { $match: filter },
        ...(paymentMethod ? [{
          $lookup: {
            from: 'payments',
            localField: 'order_id',
            foreignField: 'order_id',
            as: 'payments'
          }
        }, {
          $match: {
            'payments.method_type': { $in: paymentMethod.split(',') },
            'payments.status': { $in: ['settlement', 'paid', 'partial'] }
          }
        }] : []),
        {
          $group: {
            _id: '$orderType',
            count: { $sum: 1 },
            total: { $sum: '$grandTotal' }
          }
        }
      ];

      const [summaryResult, paymentBreakdown, orderTypeBreakdown] = await Promise.all([
        Order.aggregate(summaryPipeline),
        Order.aggregate(paymentBreakdownPipeline),
        Order.aggregate(orderTypeBreakdownPipeline)
      ]);

      const summary = summaryResult[0] || {
        totalSales: 0,
        totalTransactions: 0,
        totalTax: 0,
        totalServiceFee: 0,
        totalItems: 0,
        avgOrderValue: 0,
        totalDiscount: 0
      };

      // Calculate percentages for payment methods
      const totalSalesForPayment = paymentBreakdown.reduce((sum, item) => sum + item.total, 0);
      const paymentMethodData = paymentBreakdown.map(item => ({
        method: item._id,
        amount: item.total,
        count: item.count,
        percentage: totalSalesForPayment > 0 ? ((item.total / totalSalesForPayment) * 100).toFixed(1) : '0.0',
        breakdown: item.breakdown
      }));

      // Calculate percentages for order types
      const totalOrdersForType = orderTypeBreakdown.reduce((sum, item) => sum + item.count, 0);
      const orderTypeData = orderTypeBreakdown.map(item => ({
        type: item._id,
        count: item.count,
        total: item.total,
        percentage: totalOrdersForType > 0 ? ((item.count / totalOrdersForType) * 100).toFixed(1) : '0.0'
      }));

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalSales: summary.totalSales,
            totalTransactions: summary.totalTransactions,
            avgOrderValue: Math.round(summary.avgOrderValue),
            totalTax: summary.totalTax,
            totalServiceFee: summary.totalServiceFee,
            totalDiscount: summary.totalDiscount,
            totalItems: summary.totalItems // ✅ Sekarang berdasarkan quantity
          },
          paymentMethodBreakdown: paymentMethodData,
          orderTypeBreakdown: orderTypeData
        }
      });
    } catch (error) {
      console.error('Error in getSalesSummary:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };
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
  //     const productSearch = req.query.product || '';

  //     // Build match stage untuk filter
  //     const matchStage = {
  //       status: 'Completed'
  //     };

  //     // Filter by outlet
  //     if (req.query.outlet) {
  //       try {
  //         const mongoose = require('mongoose');
  //         matchStage.outlet = mongoose.Types.ObjectId(req.query.outlet);
  //       } catch (err) {
  //         matchStage.outlet = req.query.outlet;
  //       }
  //     }

  //     // Filter by date range
  //     if (req.query.startDate || req.query.endDate) {
  //       matchStage.createdAt = {};

  //       if (req.query.startDate) {
  //         const startDateStr = req.query.startDate;
  //         const startDate = new Date(startDateStr + 'T00:00:00.000+07:00');
  //         matchStage.createdAt.$gte = startDate;
  //       }

  //       if (req.query.endDate) {
  //         const endDateStr = req.query.endDate;
  //         const endDate = new Date(endDateStr + 'T23:59:59.999+07:00');
  //         matchStage.createdAt.$lte = endDate;
  //       }
  //     }

  //     console.log('Match Stage:', JSON.stringify(matchStage, null, 2));

  //     // ✅ Pipeline untuk items regular + customAmountItems dengan addon separation
  //     const pipeline = [
  //       // Stage 1: Filter orders
  //       {
  //         $match: matchStage
  //       },

  //       // Stage 2: Project untuk combine items + customAmountItems
  //       {
  //         $project: {
  //           outlet: 1,
  //           createdAt: 1,
  //           allItems: {
  //             $concatArrays: [
  //               // Regular items - tandai dengan type: 'regular'
  //               {
  //                 $map: {
  //                   input: { $ifNull: ['$items', []] },
  //                   as: 'item',
  //                   in: {
  //                     type: 'regular',
  //                     menuItem: '$$item.menuItem',
  //                     menuItemData: '$$item.menuItemData',
  //                     quantity: '$$item.quantity',
  //                     subtotal: '$$item.subtotal',
  //                     addons: '$$item.addons'
  //                   }
  //                 }
  //               },
  //               // Custom amount items - tandai dengan type: 'custom'
  //               {
  //                 $map: {
  //                   input: { $ifNull: ['$customAmountItems', []] },
  //                   as: 'custom',
  //                   in: {
  //                     type: 'custom',
  //                     quantity: 1,
  //                     subtotal: '$$custom.amount',
  //                     name: '$$custom.name',
  //                     addons: []
  //                   }
  //                 }
  //               }
  //             ]
  //           }
  //         }
  //       },

  //       // Stage 3: Unwind allItems
  //       {
  //         $unwind: {
  //           path: '$allItems',
  //           preserveNullAndEmptyArrays: false
  //         }
  //       },

  //       // Stage 4: Lookup menuItem (hanya untuk regular items)
  //       {
  //         $lookup: {
  //           from: 'menuitems',
  //           let: { itemType: '$allItems.type', menuItemId: '$allItems.menuItem' },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: {
  //                   $and: [
  //                     { $eq: ['$$itemType', 'regular'] },
  //                     { $eq: ['$_id', '$$menuItemId'] }
  //                   ]
  //                 }
  //               }
  //             }
  //           ],
  //           as: 'menuItemInfo'
  //         }
  //       },

  //       // Stage 5: Unwind menuItemInfo
  //       {
  //         $unwind: {
  //           path: '$menuItemInfo',
  //           preserveNullAndEmptyArrays: true
  //         }
  //       },

  //       // Stage 6: Add computed fields dengan addon variant
  //       {
  //         $addFields: {
  //           // Base product name
  //           baseProductName: {
  //             $cond: [
  //               { $eq: ['$allItems.type', 'custom'] },
  //               { $ifNull: ['$allItems.name', 'Custom Item'] },
  //               {
  //                 $cond: [
  //                   { $ne: ['$menuItemInfo.name', null] },
  //                   '$menuItemInfo.name',
  //                   {
  //                     $cond: [
  //                       { $ne: ['$allItems.menuItemData.name', null] },
  //                       '$allItems.menuItemData.name',
  //                       'Unknown Product'
  //                     ]
  //                   }
  //                 ]
  //               }
  //             ]
  //           },
  //           // Extract addon variant (Hot/Iced/etc)
  //           addonVariant: {
  //             $cond: [
  //               {
  //                 $and: [
  //                   { $isArray: '$allItems.addons' },
  //                   { $gt: [{ $size: { $ifNull: ['$allItems.addons', []] } }, 0] }
  //                 ]
  //               },
  //               {
  //                 $reduce: {
  //                   input: { $ifNull: ['$allItems.addons', []] },
  //                   initialValue: '',
  //                   in: {
  //                     $concat: [
  //                       '$$value',
  //                       {
  //                         $cond: [
  //                           { $eq: ['$$value', ''] },
  //                           '',
  //                           ' - '
  //                         ]
  //                       },
  //                       {
  //                         $reduce: {
  //                           input: { $ifNull: ['$$this.options', []] },
  //                           initialValue: '',
  //                           in: {
  //                             $concat: [
  //                               '$$value',
  //                               {
  //                                 $cond: [
  //                                   { $eq: ['$$value', ''] },
  //                                   '',
  //                                   ', '
  //                                 ]
  //                               },
  //                               { $ifNull: ['$$this.label', ''] }
  //                             ]
  //                           }
  //                         }
  //                       }
  //                     ]
  //                   }
  //                 }
  //               },
  //               ''
  //             ]
  //           },
  //           itemQuantity: { $ifNull: ['$allItems.quantity', 0] },
  //           itemSubtotal: { $ifNull: ['$allItems.subtotal', 0] }
  //         }
  //       },

  //       // Stage 7: Create full product name with variant
  //       {
  //         $addFields: {
  //           computedProductName: {
  //             $cond: [
  //               { $eq: ['$addonVariant', ''] },
  //               '$baseProductName',
  //               { $concat: ['$baseProductName', ' (', '$addonVariant', ')'] }
  //             ]
  //           }
  //         }
  //       }
  //     ];

  //     // Add product search filter if exists
  //     if (productSearch) {
  //       pipeline.push({
  //         $match: {
  //           computedProductName: { $regex: productSearch, $options: 'i' }
  //         }
  //       });
  //     }

  //     // Add grouping and calculation stages
  //     pipeline.push(
  //       // Group by product name WITH variant
  //       {
  //         $group: {
  //           _id: '$computedProductName',
  //           quantity: { $sum: '$itemQuantity' },
  //           subtotal: { $sum: '$itemSubtotal' }
  //         }
  //       },

  //       // Project final structure
  //       {
  //         $project: {
  //           _id: 0,
  //           productName: '$_id',
  //           quantity: 1,
  //           subtotal: 1,
  //           average: {
  //             $cond: {
  //               if: { $gt: ['$quantity', 0] },
  //               then: { $divide: ['$subtotal', '$quantity'] },
  //               else: 0
  //             }
  //           }
  //         }
  //       },

  //       // Sort by product name
  //       {
  //         $sort: { productName: 1 }
  //       }
  //     );

  //     console.log('Executing aggregation pipeline...');

  //     // Execute pipeline
  //     const productData = await Order.aggregate(pipeline)
  //       .allowDiskUse(true)
  //       .exec();

  //     // ✅ Grand Total - items.subtotal + customAmountItems.amount
  //     const grandTotalPipeline = [
  //       { $match: matchStage },
  //       {
  //         $project: {
  //           allItems: {
  //             $concatArrays: [
  //               {
  //                 $map: {
  //                   input: { $ifNull: ['$items', []] },
  //                   as: 'item',
  //                   in: {
  //                     quantity: '$$item.quantity',
  //                     subtotal: '$$item.subtotal'
  //                   }
  //                 }
  //               },
  //               {
  //                 $map: {
  //                   input: { $ifNull: ['$customAmountItems', []] },
  //                   as: 'custom',
  //                   in: {
  //                     quantity: 1,
  //                     subtotal: '$$custom.amount'
  //                   }
  //                 }
  //               }
  //             ]
  //           }
  //         }
  //       },
  //       { $unwind: '$allItems' },
  //       {
  //         $group: {
  //           _id: null,
  //           totalQuantity: { $sum: { $ifNull: ['$allItems.quantity', 0] } },
  //           totalSubtotal: { $sum: { $ifNull: ['$allItems.subtotal', 0] } },
  //           totalItems: { $sum: 1 }
  //         }
  //       }
  //     ];

  //     const grandTotalResult = await Order.aggregate(grandTotalPipeline);

  //     // Count unique orders
  //     const orderCountResult = await Order.countDocuments(matchStage);

  //     const grandTotal = grandTotalResult.length > 0 ? {
  //       quantity: grandTotalResult[0].totalQuantity || 0,
  //       subtotal: grandTotalResult[0].totalSubtotal || 0,
  //       average: grandTotalResult[0].totalQuantity > 0
  //         ? grandTotalResult[0].totalSubtotal / grandTotalResult[0].totalQuantity
  //         : 0
  //     } : {
  //       quantity: 0,
  //       subtotal: 0,
  //       average: 0
  //     };

  //     // Response
  //     const response = {
  //       success: true,
  //       data: productData,
  //       grandTotal: grandTotal,
  //       metadata: {
  //         filters: {
  //           outlet: req.query.outlet || 'all',
  //           dateRange: req.query.startDate && req.query.endDate
  //             ? `${req.query.startDate} to ${req.query.endDate}`
  //             : 'all',
  //           product: productSearch || 'all'
  //         },
  //         totalOrders: orderCountResult,
  //         totalProducts: productData.length,
  //         processedAt: new Date().toISOString()
  //       }
  //     };

  //     res.status(200).json(response);

  //   } catch (error) {
  //     console.error('Get product sales report error:', error);
  //     console.error('Error stack:', error.stack);

  //     res.status(500).json({
  //       success: false,
  //       message: 'Failed to fetch product sales report',
  //       error: error.message,
  //       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  //     });
  //   }
  // }

  async getProductSalesReport(req, res) {
    try {
      const productSearch = req.query.product || '';

      // Build match stage untuk filter
      const matchStage = {
        status: 'Completed'
      };

      // Filter by outlet
      if (req.query.outlet) {
        try {
          const mongoose = require('mongoose');
          matchStage.outlet = mongoose.Types.ObjectId(req.query.outlet);
        } catch (err) {
          matchStage.outlet = req.query.outlet;
        }
      }

      // Filter by date range
      if (req.query.startDate || req.query.endDate) {
        matchStage.createdAt = {};

        if (req.query.startDate) {
          const startDateStr = req.query.startDate;
          const startDate = new Date(startDateStr + 'T00:00:00.000+07:00');
          matchStage.createdAt.$gte = startDate;
        }

        if (req.query.endDate) {
          const endDateStr = req.query.endDate;
          const endDate = new Date(endDateStr + 'T23:59:59.999+07:00');
          matchStage.createdAt.$lte = endDate;
        }
      }

      console.log('Match Stage:', JSON.stringify(matchStage, null, 2));

      // ✅ Pipeline untuk items regular + customAmountItems dengan addon separation
      const pipeline = [
        // Stage 1: Filter orders
        {
          $match: matchStage
        },

        // Stage 2: Project untuk combine items + customAmountItems
        {
          $project: {
            outlet: 1,
            createdAt: 1,
            allItems: {
              $concatArrays: [
                // Regular items - tandai dengan type: 'regular'
                {
                  $map: {
                    input: { $ifNull: ['$items', []] },
                    as: 'item',
                    in: {
                      type: 'regular',
                      menuItem: '$$item.menuItem',
                      menuItemData: '$$item.menuItemData',
                      quantity: '$$item.quantity',
                      subtotal: '$$item.subtotal',
                      addons: '$$item.addons'
                    }
                  }
                },
                // Custom amount items - tandai dengan type: 'custom'
                {
                  $map: {
                    input: { $ifNull: ['$customAmountItems', []] },
                    as: 'custom',
                    in: {
                      type: 'custom',
                      quantity: 1,
                      subtotal: '$$custom.amount',
                      name: '$$custom.name',
                      addons: [],
                      menuItemData: null // Custom items tidak punya menuItemData
                    }
                  }
                }
              ]
            }
          }
        },

        // Stage 3: Unwind allItems
        {
          $unwind: {
            path: '$allItems',
            preserveNullAndEmptyArrays: false
          }
        },

        // Stage 4: Lookup menuItem (hanya untuk regular items)
        {
          $lookup: {
            from: 'menuitems',
            let: { itemType: '$allItems.type', menuItemId: '$allItems.menuItem' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$itemType', 'regular'] },
                      { $eq: ['$_id', '$$menuItemId'] }
                    ]
                  }
                }
              }
            ],
            as: 'menuItemInfo'
          }
        },

        // Stage 5: Unwind menuItemInfo
        {
          $unwind: {
            path: '$menuItemInfo',
            preserveNullAndEmptyArrays: true
          }
        },

        // ✅ Stage 6: Lookup category dari menuItemInfo.category (jika ObjectId)
        {
          $lookup: {
            from: 'categories', // Sesuaikan dengan nama collection kategori Anda
            let: {
              categoryFromLookup: '$menuItemInfo.category',
              categoryFromData: '$allItems.menuItemData.category'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$_id', '$$categoryFromLookup'] },
                      { $eq: ['$_id', '$$categoryFromData'] }
                    ]
                  }
                }
              }
            ],
            as: 'categoryInfo'
          }
        },

        // ✅ Stage 7: Unwind categoryInfo
        {
          $unwind: {
            path: '$categoryInfo',
            preserveNullAndEmptyArrays: true
          }
        },

        // Stage 8: Add computed fields dengan addon variant dan kategori
        {
          $addFields: {
            // Base product name
            baseProductName: {
              $cond: [
                { $eq: ['$allItems.type', 'custom'] },
                { $ifNull: ['$allItems.name', 'Custom Item'] },
                {
                  $cond: [
                    { $ne: ['$menuItemInfo.name', null] },
                    '$menuItemInfo.name',
                    {
                      $cond: [
                        { $ne: ['$allItems.menuItemData.name', null] },
                        '$allItems.menuItemData.name',
                        'Unknown Product'
                      ]
                    }
                  ]
                }
              ]
            },
            // ✅ Extract category name dari categoryInfo
            category: {
              $cond: [
                { $eq: ['$allItems.type', 'custom'] },
                'Custom Items', // Kategori default untuk custom items
                {
                  $cond: [
                    { $ne: ['$categoryInfo.name', null] },
                    '$categoryInfo.name', // Ambil name dari hasil lookup
                    {
                      $cond: [
                        // Check jika category adalah string (bukan ObjectId)
                        { $eq: [{ $type: '$menuItemInfo.category' }, 'string'] },
                        '$menuItemInfo.category',
                        {
                          $cond: [
                            { $eq: [{ $type: '$allItems.menuItemData.category' }, 'string'] },
                            '$allItems.menuItemData.category',
                            'Uncategorized'
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            // Extract addon variant (Hot/Iced/etc)
            addonVariant: {
              $cond: [
                {
                  $and: [
                    { $isArray: '$allItems.addons' },
                    { $gt: [{ $size: { $ifNull: ['$allItems.addons', []] } }, 0] }
                  ]
                },
                {
                  $reduce: {
                    input: { $ifNull: ['$allItems.addons', []] },
                    initialValue: '',
                    in: {
                      $concat: [
                        '$$value',
                        {
                          $cond: [
                            { $eq: ['$$value', ''] },
                            '',
                            ' - '
                          ]
                        },
                        {
                          $reduce: {
                            input: { $ifNull: ['$$this.options', []] },
                            initialValue: '',
                            in: {
                              $concat: [
                                '$$value',
                                {
                                  $cond: [
                                    { $eq: ['$$value', ''] },
                                    '',
                                    ', '
                                  ]
                                },
                                { $ifNull: ['$$this.label', ''] }
                              ]
                            }
                          }
                        }
                      ]
                    }
                  }
                },
                ''
              ]
            },
            itemQuantity: { $ifNull: ['$allItems.quantity', 0] },
            itemSubtotal: { $ifNull: ['$allItems.subtotal', 0] }
          }
        },

        // Stage 9: Create full product name with variant
        {
          $addFields: {
            computedProductName: {
              $cond: [
                { $eq: ['$addonVariant', ''] },
                '$baseProductName',
                { $concat: ['$baseProductName', ' (', '$addonVariant', ')'] }
              ]
            }
          }
        }
      ];

      // Add product search filter if exists
      if (productSearch) {
        pipeline.push({
          $match: {
            computedProductName: { $regex: productSearch, $options: 'i' }
          }
        });
      }

      // Add grouping and calculation stages
      pipeline.push(
        // Group by product name WITH variant
        {
          $group: {
            _id: '$computedProductName',
            category: { $first: '$category' }, // ✅ Ambil kategori pertama (sudah dalam bentuk string)
            quantity: { $sum: '$itemQuantity' },
            subtotal: { $sum: '$itemSubtotal' }
          }
        },

        // Project final structure
        {
          $project: {
            _id: 0,
            productName: '$_id',
            category: 1, // ✅ Include kategori di output
            quantity: 1,
            subtotal: 1,
            average: {
              $cond: {
                if: { $gt: ['$quantity', 0] },
                then: { $divide: ['$subtotal', '$quantity'] },
                else: 0
              }
            }
          }
        },

        // Sort by category first, then product name
        {
          $sort: { category: 1, productName: 1 }
        }
      );

      console.log('Executing aggregation pipeline...');

      // Execute pipeline
      const productData = await Order.aggregate(pipeline)
        .allowDiskUse(true)
        .exec();

      // ✅ Grand Total - items.subtotal + customAmountItems.amount
      const grandTotalPipeline = [
        { $match: matchStage },
        {
          $project: {
            allItems: {
              $concatArrays: [
                {
                  $map: {
                    input: { $ifNull: ['$items', []] },
                    as: 'item',
                    in: {
                      quantity: '$$item.quantity',
                      subtotal: '$$item.subtotal'
                    }
                  }
                },
                {
                  $map: {
                    input: { $ifNull: ['$customAmountItems', []] },
                    as: 'custom',
                    in: {
                      quantity: 1,
                      subtotal: '$$custom.amount'
                    }
                  }
                }
              ]
            }
          }
        },
        { $unwind: '$allItems' },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: { $ifNull: ['$allItems.quantity', 0] } },
            totalSubtotal: { $sum: { $ifNull: ['$allItems.subtotal', 0] } },
            totalItems: { $sum: 1 }
          }
        }
      ];

      const grandTotalResult = await Order.aggregate(grandTotalPipeline);

      // Count unique orders
      const orderCountResult = await Order.countDocuments(matchStage);

      const grandTotal = grandTotalResult.length > 0 ? {
        quantity: grandTotalResult[0].totalQuantity || 0,
        subtotal: grandTotalResult[0].totalSubtotal || 0,
        average: grandTotalResult[0].totalQuantity > 0
          ? grandTotalResult[0].totalSubtotal / grandTotalResult[0].totalQuantity
          : 0
      } : {
        quantity: 0,
        subtotal: 0,
        average: 0
      };

      // Response
      const response = {
        success: true,
        data: productData,
        grandTotal: grandTotal,
        metadata: {
          filters: {
            outlet: req.query.outlet || 'all',
            dateRange: req.query.startDate && req.query.endDate
              ? `${req.query.startDate} to ${req.query.endDate}`
              : 'all',
            product: productSearch || 'all'
          },
          totalOrders: orderCountResult,
          totalProducts: productData.length,
          processedAt: new Date().toISOString()
        }
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('Get product sales report error:', error);
      console.error('Error stack:', error.stack);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch product sales report',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get daily profit for a date range - DUKUNG SPLIT PAYMENT
   */

  async getDailyProfitRange(req, res) {
    try {
      const filters = { status: 'Completed' };

      if (req.query.outlet) filters.outlet = req.query.outlet;

      // Date range filter
      if (req.query.startDate || req.query.endDate) {
        filters.createdAt = {};

        if (req.query.startDate) {
          const startDate = new Date(req.query.startDate + 'T00:00:00.000+07:00');
          filters.createdAt.$gte = startDate;
        }

        if (req.query.endDate) {
          const endDate = new Date(req.query.endDate + 'T23:59:59.999+07:00');
          filters.createdAt.$lte = endDate;
        }
      }

      // AGGREGATION PIPELINE - Grouping di database, bukan di aplikasi!
      const dailySales = await Order.aggregate([
        // Stage 1: Filter
        { $match: filters },

        // Stage 2: Project hanya field yang dibutuhkan
        {
          $project: {
            grandTotal: 1,
            createdAt: 1,
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Jakarta"
              }
            }
          }
        },

        // Stage 3: Group by date
        {
          $group: {
            _id: "$date",
            count: { $sum: 1 },
            penjualanTotal: { $sum: "$grandTotal" },
            timestamp: { $first: "$createdAt" }
          }
        },

        // Stage 4: Sort by date (descending)
        { $sort: { timestamp: -1 } },

        // Stage 5: Format output
        {
          $project: {
            _id: 0,
            date: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: { $dateFromString: { dateString: "$_id" } },
                timezone: "Asia/Jakarta"
              }
            },
            count: 1,
            penjualanTotal: { $round: ["$penjualanTotal", 0] },
            timestamp: 1
          }
        }
      ]);

      // Calculate grand totals
      const grandTotalItems = dailySales.reduce((sum, day) => sum + day.count, 0);
      const grandTotalPenjualan = dailySales.reduce((sum, day) => sum + day.penjualanTotal, 0);

      res.status(200).json({
        success: true,
        data: dailySales,
        metadata: {
          totalDays: dailySales.length,
          grandTotalItems,
          grandTotalPenjualan,
          filters: {
            outlet: req.query.outlet || 'all',
            dateRange: req.query.startDate && req.query.endDate
              ? `${req.query.startDate} to ${req.query.endDate}`
              : 'all'
          }
        }
      });

    } catch (error) {
      console.error('Get daily sales aggregated error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch daily sales',
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

  async getOrdersWithPayments(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const mode = req.query.mode || 'paginated';

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

      // Search filter
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
          .populate({
            path: 'user_id',
            select: 'name email phone role outlet username'
          })
          .populate({
            path: 'cashierId',
            select: 'name email phone role outlet username',
            populate: {
              path: 'outlet.outletId',
              model: 'Outlet',
              select: 'name address',
            },
          })
          .populate({
            path: 'groId',
            select: 'name email phone role outlet username',
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
          const allOrdersQuery = buildQuery();
          allOrdersQuery.maxTimeMS(60000);
          orders = await allOrdersQuery.exec();
          totalOrders = orders.length;
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

      // Process orders with payments
      const ordersWithPayments = orders.map(order => {
        // Ensure menuItemData is properly populated
        if (order.items && Array.isArray(order.items)) {
          order.items = order.items.map(item => {
            if (!item.menuItemData) {
              item.menuItemData = {};
            }

            // Sync from populated menuItem
            if (item.menuItem) {
              item.menuItemData.name = item.menuItem.name || item.menuItemData.name || 'Unknown Item';
              item.menuItemData.price = item.menuItem.price || item.menuItemData.price || 0;

              // Get category name, not ID
              if (item.menuItem.category && typeof item.menuItem.category === 'object') {
                item.menuItemData.category = item.menuItem.category.name;
              } else {
                item.menuItemData.category = item.menuItemData.category || 'Uncategorized';
              }

              item.menuItemData.sku = item.menuItem.sku || '';
              item.menuItemData.isActive = item.menuItem.isActive !== false;
            }

            // Ensure addons & toppings always exist
            item.menuItemData.selectedAddons = item.addons || [];
            item.menuItemData.selectedToppings = item.toppings || [];

            return item;
          });
        }

        // Get related payments
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
          // Eksplisit include field staff (meskipun null)
          user_id: order.user_id || null,
          cashierId: order.cashierId || null,
          groId: order.groId || null,
          paymentDetails: paymentDetails || null,
          actualPaymentMethod
        };
      });

      const response = {
        success: true,
        data: ordersWithPayments,
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

  // Optimized getOrdersWithPayments untuk export berat

  // SAFER VERSION - Optimized getOrdersWithPayments dengan error handling

  // async getOrdersWithPayments(req, res) {
  //   try {
  //     const page = parseInt(req.query.page) || 1;
  //     const limit = parseInt(req.query.limit) || 20;
  //     const mode = req.query.mode || 'paginated';

  //     const searchTerm = req.query.search || '';

  //     const filters = {};

  //     if (req.query.status) filters.status = req.query.status;
  //     if (req.query.orderType) filters.orderType = req.query.orderType;
  //     if (req.query.outlet) filters.outlet = req.query.outlet;

  //     // Date range filter
  //     if (req.query.startDate || req.query.endDate) {
  //       filters.createdAt = {};

  //       if (req.query.startDate) {
  //         const startDateStr = req.query.startDate;
  //         const startDate = new Date(startDateStr + 'T00:00:00.000+07:00');
  //         filters.createdAt.$gte = startDate;
  //       }

  //       if (req.query.endDate) {
  //         const endDateStr = req.query.endDate;
  //         const endDate = new Date(endDateStr + 'T23:59:59.999+07:00');
  //         filters.createdAt.$lte = endDate;
  //       }
  //     }

  //     // Search filter
  //     if (searchTerm) {
  //       filters.$or = [
  //         { order_id: { $regex: searchTerm, $options: 'i' } },
  //         { user: { $regex: searchTerm, $options: 'i' } },
  //         { 'items.menuItemData.name': { $regex: searchTerm, $options: 'i' } },
  //       ];
  //     }

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
  //         .populate({
  //           path: 'user_id',
  //           select: 'name email phone role outlet username'
  //         })
  //         .populate({
  //           path: 'cashierId',
  //           select: 'name email phone role outlet username',
  //           populate: {
  //             path: 'outlet.outletId',
  //             model: 'Outlet',
  //             select: 'name address',
  //           },
  //         })
  //         .populate({
  //           path: 'groId',
  //           select: 'name email phone role outlet username',
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

  //     switch (mode) {
  //       case 'all':
  //         console.log('🔄 Fetching ALL orders for export...');
  //         const allOrdersQuery = buildQuery();
  //         allOrdersQuery.maxTimeMS(180000); // 3 minutes timeout

  //         try {
  //           orders = await allOrdersQuery.exec();
  //           totalOrders = orders.length;
  //           console.log(`✅ Fetched ${totalOrders} orders successfully`);
  //         } catch (queryError) {
  //           console.error('❌ Error in ALL mode query:', queryError);
  //           // Fallback: try without maxTimeMS
  //           orders = await buildQuery().exec();
  //           totalOrders = orders.length;
  //           console.log(`✅ Fallback successful: ${totalOrders} orders`);
  //         }
  //         break;

  //       case 'recent':
  //         orders = await buildQuery().limit(10);
  //         totalOrders = await Order.countDocuments(filters);
  //         paginationInfo = {
  //           mode: 'recent',
  //           showing: orders.length,
  //           total: totalOrders
  //         };
  //         break;

  //       case 'count':
  //         totalOrders = await Order.countDocuments(filters);
  //         return res.status(200).json({
  //           success: true,
  //           count: totalOrders
  //         });

  //       case 'ids':
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
  //         const skip = (page - 1) * limit;
  //         totalOrders = await Order.countDocuments(filters);
  //         const totalPages = Math.ceil(totalOrders / limit);

  //         orders = await buildQuery().skip(skip).limit(limit);

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

  //     // Fetch payments
  //     console.log(`🔄 Fetching payments for ${orders.length} orders...`);
  //     const orderIds = orders.map(order => order.order_id);

  //     let allPayments = [];
  //     try {
  //       allPayments = await Payment.find({
  //         order_id: { $in: orderIds }
  //       }).lean();
  //       console.log(`✅ Fetched ${allPayments.length} payments`);
  //     } catch (paymentError) {
  //       console.error('❌ Error fetching payments:', paymentError);
  //       // Continue without payments
  //       allPayments = [];
  //     }

  //     // Build payment map
  //     const paymentMap = {};
  //     allPayments.forEach(payment => {
  //       if (!paymentMap[payment.order_id]) {
  //         paymentMap[payment.order_id] = [];
  //       }
  //       paymentMap[payment.order_id].push(payment);
  //     });

  //     // Process orders with payments
  //     console.log(`🔄 Processing ${orders.length} orders...`);
  //     const ordersWithPayments = orders.map(order => {
  //       // Ensure menuItemData is properly populated
  //       if (order.items && Array.isArray(order.items)) {
  //         order.items = order.items.map(item => {
  //           if (!item.menuItemData) {
  //             item.menuItemData = {};
  //           }

  //           // Sync from populated menuItem
  //           if (item.menuItem) {
  //             item.menuItemData.name = item.menuItem.name || item.menuItemData.name || 'Unknown Item';
  //             item.menuItemData.price = item.menuItem.price || item.menuItemData.price || 0;

  //             // Get category name, not ID
  //             if (item.menuItem.category && typeof item.menuItem.category === 'object') {
  //               item.menuItemData.category = item.menuItem.category.name;
  //             } else {
  //               item.menuItemData.category = item.menuItemData.category || 'Uncategorized';
  //             }

  //             item.menuItemData.sku = item.menuItem.sku || '';
  //             item.menuItemData.isActive = item.menuItem.isActive !== false;
  //           }

  //           // Ensure addons & toppings always exist
  //           item.menuItemData.selectedAddons = item.addons || [];
  //           item.menuItemData.selectedToppings = item.toppings || [];

  //           return item;
  //         });
  //       }

  //       // Get related payments
  //       const relatedPayments = paymentMap[order.order_id] || [];
  //       let paymentDetails = null;
  //       let actualPaymentMethod = order.paymentMethod || 'N/A';

  //       if (order.orderType !== "Reservation") {
  //         paymentDetails = relatedPayments.find(p =>
  //           p.status === 'pending' || p.status === 'settlement' || p.status === 'partial'
  //         );
  //       } else {
  //         paymentDetails = relatedPayments.find(p => p.status === 'pending') ||
  //           relatedPayments.find(p => p.status === 'partial') ||
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

  //       // FIX: Gunakan afterDiscount untuk grand total yang benar
  //       const grandTotal = order.afterDiscount !== undefined && order.afterDiscount !== null
  //         ? order.afterDiscount
  //         : order.total;

  //       return {
  //         ...order,
  //         grandTotal, // Tambahkan field grandTotal yang sudah termasuk diskon
  //         user_id: order.user_id || null,
  //         cashierId: order.cashierId || null,
  //         groId: order.groId || null,
  //         paymentDetails: paymentDetails || null,
  //         actualPaymentMethod
  //       };
  //     });

  //     console.log(`✅ Successfully processed all orders`);

  //     const response = {
  //       success: true,
  //       data: ordersWithPayments,
  //       metadata: {
  //         mode: mode,
  //         filters: {
  //           status: req.query.status || 'all',
  //           outlet: req.query.outlet || 'all',
  //           dateRange: req.query.startDate && req.query.endDate
  //             ? `${req.query.startDate} to ${req.query.endDate}`
  //             : 'all',
  //           search: searchTerm || 'none'
  //         },
  //         resultCount: ordersWithPayments.length
  //       }
  //     };

  //     if (paginationInfo) {
  //       response.pagination = paginationInfo;
  //     }

  //     res.status(200).json(response);

  //   } catch (error) {
  //     console.error('❌ Get orders with payments error:', error);
  //     console.error('❌ Error stack:', error.stack);

  //     res.status(500).json({
  //       success: false,
  //       message: 'Failed to fetch orders with payments',
  //       error: error.message,
  //       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  //     });
  //   }
  // }

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

  // Helper function to get display name from payment method
  async getDisplayName(method, vaNumbers = [], actions = []) {
    if (!method) return 'Cash';

    const methodLower = method.toLowerCase();

    // QRIS detection
    if (methodLower.includes('qris')) {
      if (vaNumbers && vaNumbers.length > 0) {
        const acquirer = vaNumbers[0]?.bank?.toUpperCase();
        if (acquirer) return `QRIS ${acquirer}`;
      }
      if (actions && actions.length > 0) {
        const acquirer = actions[0]?.name?.toUpperCase();
        if (acquirer && acquirer.includes('BNI')) return 'QRIS BNI';
        if (acquirer && acquirer.includes('BRI')) return 'QRIS BRI';
        if (acquirer && acquirer.includes('BCA')) return 'QRIS BCA';
      }
      return 'QRIS';
    }

    // Debit/Credit Card detection
    if (methodLower.includes('debit') || methodLower.includes('credit') || methodLower.includes('card')) {
      if (vaNumbers && vaNumbers.length > 0) {
        const bank = vaNumbers[0]?.bank?.toUpperCase();
        if (bank) {
          const cardType = methodLower.includes('credit') ? 'Credit' : 'Debit';
          return `${cardType} ${bank}`;
        }
      }
      return method;
    }

    return method;
  };

  async getPaymentMethodDetailReport(req, res) {
    try {
      const { startDate, endDate, outletId, paymentMethod } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date dan end date harus diisi'
        });
      }

      // Parse dates
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

      const start = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0) - (7 * 60 * 60 * 1000));
      const end = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999) - (7 * 60 * 60 * 1000));

      // Query orders
      const orderQuery = {
        createdAt: { $gte: start, $lte: end },
        status: { $in: ['Completed'] },
        ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) })
      };

      const orders = await Order.find(orderQuery)
        .populate('outlet', 'name')
        .populate('items.menuItem', 'name')
        .lean();

      // Fetch all payment records
      const orderIds = orders.map(o => o.order_id).filter(id => id);
      const allPaymentRecords = await Payment.find({
        order_id: { $in: orderIds }
      }).lean();

      // Create payment record map
      const paymentRecordMap = {};
      allPaymentRecords.forEach(payment => {
        if (!paymentRecordMap[payment.order_id]) {
          paymentRecordMap[payment.order_id] = [];
        }
        paymentRecordMap[payment.order_id].push(payment);
      });

      // Process payments with details
      const allPayments = [];

      orders.forEach(order => {
        const relatedPayments = paymentRecordMap[order.order_id] || [];
        const mainPaymentRecord = relatedPayments.find(p =>
          p.status === 'settlement' || p.status === 'pending' || p.status === 'partial'
        );

        if (order.isSplitPayment && order.payments && Array.isArray(order.payments)) {
          // Split payment handling
          order.payments.forEach(payment => {
            const matchingRecord = relatedPayments.find(ep =>
              ep.method === payment.paymentMethod &&
              Math.abs(ep.amount - (payment.amount || 0)) < 100
            );

            const paymentRecord = matchingRecord || mainPaymentRecord;
            const displayName = paymentRecord?.method_type ||
              payment.paymentDetails?.method_type ||
              getDisplayName(
                payment.paymentMethod,
                paymentRecord?.va_numbers || [],
                paymentRecord?.actions || []
              );

            const { issuer, acquirer } = extractBankInfo(paymentRecord || payment);

            allPayments.push({
              order_id: order.order_id,
              date: order.createdAt,
              outlet: order.outlet?.name || 'N/A',
              method: payment.paymentMethod || 'Cash',
              displayName: displayName,
              amount: payment.amount || 0,
              isSplitPayment: true,
              orderTotal: order.grandTotal || 0,
              items: order.items?.length || 0,
              subtotal: order.totalBeforeDiscount || 0,
              tax: order.totalTax || 0,
              serviceCharge: order.totalServiceFee || 0,
              discount: (order.discounts?.autoPromoDiscount || 0) +
                (order.discounts?.manualDiscount || 0) +
                (order.discounts?.voucherDiscount || 0),
              status: order.status,
              issuer: issuer,
              acquirer: acquirer
            });
          });
        } else {
          // Single payment handling
          const displayName = mainPaymentRecord?.method_type ||
            order.payments?.[0]?.paymentDetails?.method_type ||
            getDisplayName(
              order.paymentMethod || 'Cash',
              mainPaymentRecord?.va_numbers || [],
              mainPaymentRecord?.actions || []
            );

          const { issuer, acquirer } = extractBankInfo(mainPaymentRecord || {});

          allPayments.push({
            order_id: order.order_id,
            date: order.createdAt,
            outlet: order.outlet?.name || 'N/A',
            method: order.paymentMethod || 'Cash',
            displayName: displayName,
            amount: order.grandTotal || 0,
            isSplitPayment: false,
            orderTotal: order.grandTotal || 0,
            items: order.items?.length || 0,
            subtotal: order.totalBeforeDiscount || 0,
            tax: order.totalTax || 0,
            serviceCharge: order.totalServiceFee || 0,
            discount: (order.discounts?.autoPromoDiscount || 0) +
              (order.discounts?.manualDiscount || 0) +
              (order.discounts?.voucherDiscount || 0),
            status: order.status,
            issuer: issuer,
            acquirer: acquirer
          });
        }
      });

      // Group by displayName
      const groupedByMethod = {};
      allPayments.forEach(payment => {
        const key = payment.displayName;
        if (!groupedByMethod[key]) {
          groupedByMethod[key] = {
            method: payment.method,
            displayName: payment.displayName,
            totalAmount: 0,
            transactionCount: 0,
            orderCount: 0,
            splitPaymentCount: 0,
            orders: []
          };
        }

        groupedByMethod[key].totalAmount += payment.amount;
        groupedByMethod[key].transactionCount += 1;
        if (!payment.isSplitPayment) {
          groupedByMethod[key].orderCount += 1;
        } else {
          groupedByMethod[key].splitPaymentCount += 1;
        }

        groupedByMethod[key].orders.push({
          order_id: payment.order_id,
          amount: payment.amount,
          isSplitPayment: payment.isSplitPayment,
          date: payment.date,
          outlet: payment.outlet,
          items: payment.items,
          subtotal: payment.subtotal,
          tax: payment.tax,
          serviceCharge: payment.serviceCharge,
          discount: payment.discount,
          total: payment.orderTotal,
          status: payment.status,
          issuer: payment.issuer,
          acquirer: payment.acquirer
        });
      });

      // Convert to array and sort
      const breakdown = Object.values(groupedByMethod).map(item => ({
        ...item,
        averageAmount: item.transactionCount > 0 ? item.totalAmount / item.transactionCount : 0,
        splitPaymentPercentage: item.transactionCount > 0
          ? (item.splitPaymentCount / item.transactionCount) * 100
          : 0,
        orders: item.orders.slice(0, 10) // Return only first 10 for preview
      })).sort((a, b) => b.totalAmount - a.totalAmount);

      // If specific paymentMethod is requested, return detailed orders
      if (paymentMethod) {
        const methodData = groupedByMethod[paymentMethod];
        if (methodData) {
          return res.status(200).json({
            success: true,
            data: {
              method: methodData.displayName,
              orders: methodData.orders // Return all orders for this method
            }
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          period: {
            startDate: startDate,
            endDate: endDate
          },
          summary: {
            totalTransactions: allPayments.length,
            totalRevenue: allPayments.reduce((sum, p) => sum + p.amount, 0),
            totalOrders: [...new Set(allPayments.map(p => p.order_id))].length,
            splitPaymentTransactions: allPayments.filter(p => p.isSplitPayment).length,
            singlePaymentTransactions: allPayments.filter(p => !p.isSplitPayment).length
          },
          breakdown: breakdown
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

  async getHourlySalesRange(req, res) {
    try {
      const filters = { status: 'Completed' };

      if (req.query.outlet) filters.outlet = req.query.outlet;

      // Date range filter with Jakarta timezone
      if (req.query.startDate || req.query.endDate) {
        filters.createdAt = {};

        if (req.query.startDate) {
          const startDate = new Date(req.query.startDate + 'T00:00:00.000+07:00');
          filters.createdAt.$gte = startDate;
        }

        if (req.query.endDate) {
          const endDate = new Date(req.query.endDate + 'T23:59:59.999+07:00');
          filters.createdAt.$lte = endDate;
        }
      }

      // AGGREGATION PIPELINE - Group by hour
      const hourlySales = await Order.aggregate([
        // Stage 1: Filter
        { $match: filters },

        // Stage 2: Project fields yang dibutuhkan dan extract hour
        {
          $project: {
            grandTotal: 1,
            createdAt: 1,
            hour: {
              $dateToString: {
                format: "%H:00",
                date: "$createdAt",
                timezone: "Asia/Jakarta"
              }
            }
          }
        },

        // Stage 3: Group by hour
        {
          $group: {
            _id: "$hour",
            count: { $sum: 1 },
            grandTotalSum: { $sum: "$grandTotal" },
            products: { $push: "$$ROOT" }
          }
        },

        // Stage 4: Sort by hour (ascending: 00:00 to 23:00)
        { $sort: { _id: 1 } },

        // Stage 5: Format output
        {
          $project: {
            _id: 0,
            hour: "$_id",
            count: 1,
            grandTotalSum: { $round: ["$grandTotalSum", 0] },
            products: 1
          }
        }
      ]);

      // Calculate grand totals
      const grandTotalItems = hourlySales.reduce((sum, hour) => sum + hour.count, 0);
      const grandTotalPenjualan = hourlySales.reduce((sum, hour) => sum + hour.grandTotalSum, 0);

      res.status(200).json({
        success: true,
        data: hourlySales,
        metadata: {
          totalHours: hourlySales.length,
          grandTotalItems,
          grandTotalPenjualan,
          averagePerTransaction: grandTotalItems > 0
            ? Math.round(grandTotalPenjualan / grandTotalItems)
            : 0,
          filters: {
            outlet: req.query.outlet || 'all',
            dateRange: req.query.startDate && req.query.endDate
              ? `${req.query.startDate} to ${req.query.endDate}`
              : 'all'
          }
        }
      });

    } catch (error) {
      console.error('Get hourly sales aggregated error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch hourly sales',
        error: error.message
      });
    }
  };

  async getCategorySalesReport(req, res) {
    try {
      const categorySearch = req.query.category || '';

      // Build match stage untuk filter
      const matchStage = {
        status: 'Completed'
      };

      // Filter by outlet
      if (req.query.outlet) {
        try {
          const mongoose = require('mongoose');
          matchStage.outlet = mongoose.Types.ObjectId(req.query.outlet);
        } catch (err) {
          matchStage.outlet = req.query.outlet;
        }
      }

      // Filter by date range
      if (req.query.startDate || req.query.endDate) {
        matchStage.createdAt = {};

        if (req.query.startDate) {
          const startDateStr = req.query.startDate;
          const startDate = new Date(startDateStr + 'T00:00:00.000+07:00');
          matchStage.createdAt.$gte = startDate;
        }

        if (req.query.endDate) {
          const endDateStr = req.query.endDate;
          const endDate = new Date(endDateStr + 'T23:59:59.999+07:00');
          matchStage.createdAt.$lte = endDate;
        }
      }

      console.log('Match Stage:', JSON.stringify(matchStage, null, 2));

      // ✅ Pipeline untuk items regular + customAmountItems
      const pipeline = [
        // Stage 1: Filter orders
        {
          $match: matchStage
        },

        // Stage 2: Project untuk combine items + customAmountItems
        {
          $project: {
            outlet: 1,
            createdAt: 1,
            allItems: {
              $concatArrays: [
                // Regular items - tandai dengan type: 'regular'
                {
                  $map: {
                    input: { $ifNull: ['$items', []] },
                    as: 'item',
                    in: {
                      type: 'regular',
                      menuItem: '$$item.menuItem',
                      menuItemData: '$$item.menuItemData',
                      quantity: '$$item.quantity',
                      subtotal: '$$item.subtotal'
                    }
                  }
                },
                // Custom amount items - tandai dengan type: 'custom'
                {
                  $map: {
                    input: { $ifNull: ['$customAmountItems', []] },
                    as: 'custom',
                    in: {
                      type: 'custom',
                      quantity: 1,
                      subtotal: '$$custom.amount',
                      name: '$$custom.name'
                    }
                  }
                }
              ]
            }
          }
        },

        // Stage 3: Unwind allItems
        {
          $unwind: {
            path: '$allItems',
            preserveNullAndEmptyArrays: false
          }
        },

        // Stage 4: Lookup menuItem (hanya untuk regular items)
        {
          $lookup: {
            from: 'menuitems',
            let: { itemType: '$allItems.type', menuItemId: '$allItems.menuItem' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$itemType', 'regular'] },
                      { $eq: ['$_id', '$$menuItemId'] }
                    ]
                  }
                }
              }
            ],
            as: 'menuItemInfo'
          }
        },

        // Stage 5: Unwind menuItemInfo
        {
          $unwind: {
            path: '$menuItemInfo',
            preserveNullAndEmptyArrays: true
          }
        },

        // Stage 6: Lookup category (hanya untuk regular items)
        {
          $lookup: {
            from: 'categories',
            localField: 'menuItemInfo.category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },

        // Stage 7: Add computed fields
        {
          $addFields: {
            computedCategory: {
              $cond: [
                // Jika type = custom, langsung "Custom"
                { $eq: ['$allItems.type', 'custom'] },
                'Custom',
                // Jika type = regular, cari kategori dari lookup
                {
                  $cond: [
                    { $gt: [{ $size: { $ifNull: ['$categoryInfo', []] } }, 0] },
                    { $arrayElemAt: ['$categoryInfo.name', 0] },
                    {
                      $cond: [
                        { $eq: [{ $type: '$menuItemInfo.category' }, 'string'] },
                        '$menuItemInfo.category',
                        {
                          $cond: [
                            { $ne: ['$allItems.menuItemData.category', null] },
                            '$allItems.menuItemData.category',
                            'Uncategorized'
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            itemQuantity: { $ifNull: ['$allItems.quantity', 0] },
            itemSubtotal: { $ifNull: ['$allItems.subtotal', 0] }
          }
        }
      ];

      // Add category search filter if exists
      if (categorySearch) {
        pipeline.push({
          $match: {
            computedCategory: { $regex: categorySearch, $options: 'i' }
          }
        });
      }

      // Add grouping and calculation stages
      pipeline.push(
        // Group by category
        {
          $group: {
            _id: '$computedCategory',
            quantity: { $sum: '$itemQuantity' },
            subtotal: { $sum: '$itemSubtotal' }
          }
        },

        // Project final structure
        {
          $project: {
            _id: 0,
            category: '$_id',
            quantity: 1,
            subtotal: 1,
            average: {
              $cond: {
                if: { $gt: ['$quantity', 0] },
                then: { $divide: ['$subtotal', '$quantity'] },
                else: 0
              }
            }
          }
        },

        // Sort by category
        {
          $sort: { category: 1 }
        }
      );

      console.log('Executing aggregation pipeline...');

      // Execute pipeline
      const categoryData = await Order.aggregate(pipeline)
        .allowDiskUse(true)
        .exec();

      console.log('Category data fetched:', categoryData.length, 'categories');
      console.log('Category data detail:', JSON.stringify(categoryData, null, 2));

      // ✅ Grand Total - items.subtotal + customAmountItems.amount
      const grandTotalPipeline = [
        { $match: matchStage },
        {
          $project: {
            allItems: {
              $concatArrays: [
                {
                  $map: {
                    input: { $ifNull: ['$items', []] },
                    as: 'item',
                    in: {
                      quantity: '$$item.quantity',
                      subtotal: '$$item.subtotal'
                    }
                  }
                },
                {
                  $map: {
                    input: { $ifNull: ['$customAmountItems', []] },
                    as: 'custom',
                    in: {
                      quantity: 1,
                      subtotal: '$$custom.amount'
                    }
                  }
                }
              ]
            }
          }
        },
        { $unwind: '$allItems' },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: { $ifNull: ['$allItems.quantity', 0] } },
            totalSubtotal: { $sum: { $ifNull: ['$allItems.subtotal', 0] } },
            totalItems: { $sum: 1 }
          }
        }
      ];

      const grandTotalResult = await Order.aggregate(grandTotalPipeline);

      console.log('Grand total result:', JSON.stringify(grandTotalResult, null, 2));

      // ✅ DEBUGGING: Cek total dengan field lain
      const debugPipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalBeforeDiscount: { $sum: '$totalBeforeDiscount' },
            totalAfterDiscount: { $sum: '$totalAfterDiscount' },
            totalTax: { $sum: '$totalTax' },
            grandTotal: { $sum: '$grandTotal' },
            itemsSubtotal: { $sum: { $sum: '$items.subtotal' } },
            customAmountTotal: {
              $sum: {
                $sum: {
                  $map: {
                    input: { $ifNull: ['$customAmountItems', []] },
                    as: 'custom',
                    in: '$$custom.amount'
                  }
                }
              }
            }
          }
        }
      ];

      const debugResult = await Order.aggregate(debugPipeline);
      console.log('🔍 DEBUG - Comparison:', JSON.stringify(debugResult, null, 2));

      // Count unique orders
      const orderCountResult = await Order.countDocuments(matchStage);

      const grandTotal = grandTotalResult.length > 0 ? {
        quantity: grandTotalResult[0].totalQuantity || 0,
        subtotal: grandTotalResult[0].totalSubtotal || 0,
        average: grandTotalResult[0].totalQuantity > 0
          ? grandTotalResult[0].totalSubtotal / grandTotalResult[0].totalQuantity
          : 0
      } : {
        quantity: 0,
        subtotal: 0,
        average: 0
      };

      // Response
      const response = {
        success: true,
        data: categoryData,
        grandTotal: grandTotal,
        debug: debugResult.length > 0 ? debugResult[0] : null,
        metadata: {
          filters: {
            outlet: req.query.outlet || 'all',
            dateRange: req.query.startDate && req.query.endDate
              ? `${req.query.startDate} to ${req.query.endDate}`
              : 'all',
            category: categorySearch || 'all'
          },
          totalOrders: orderCountResult,
          totalCategories: categoryData.length,
          processedAt: new Date().toISOString()
        }
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('Get category sales report error:', error);
      console.error('Error stack:', error.stack);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch category sales report',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async getTypeSalesReport(req, res) {
    try {
      const {
        startDate,
        endDate,
        outletId,
        search,
        page = 1,
        limit = 50
      } = req.query;

      // Validasi dan set default date range menggunakan native Date
      let dateFilter = {};
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Validasi tanggal
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Format tanggal tidak valid'
          });
        }

        dateFilter = {
          createdAt: {
            $gte: start,
            $lte: end
          }
        };
      } else {
        // Default: hari ini (WIB timezone)
        const today = new Date();

        // Set start of day
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        // Set end of day
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        dateFilter = {
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        };
      }

      // Build match stage
      const matchStage = {
        status: 'Completed',
        ...dateFilter
      };

      // Filter by outlet if provided
      if (outletId) {
        matchStage['cashier.outlet.0.outletId'] = outletId;
      }

      // Filter by search term (orderType) if provided
      if (search) {
        matchStage.orderType = {
          $regex: search,
          $options: 'i'
        };
      }

      // Aggregation pipeline untuk grouping
      const aggregationPipeline = [
        // Stage 1: Match documents
        {
          $match: matchStage
        },
        // Stage 2: Group by orderType
        {
          $group: {
            _id: '$orderType',
            orderType: { $first: '$orderType' },
            penjualanTotal: { $sum: '$grandTotal' },
            count: { $sum: 1 }
          }
        },
        // Stage 3: Sort by orderType
        {
          $sort: { orderType: 1 }
        },
        // Stage 4: Project final shape
        {
          $project: {
            _id: 0,
            orderType: 1,
            penjualanTotal: 1,
            count: 1
          }
        }
      ];

      // Execute aggregation
      const groupedData = await Order.aggregate(aggregationPipeline);

      // Calculate grand totals
      const grandTotal = groupedData.reduce((acc, curr) => {
        acc.penjualanTotal += curr.penjualanTotal || 0;
        acc.count += curr.count || 0;
        return acc;
      }, {
        penjualanTotal: 0,
        count: 0
      });

      // Pagination
      const totalItems = groupedData.length;
      const totalPages = Math.ceil(totalItems / limit);
      const currentPage = parseInt(page);
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedData = groupedData.slice(startIndex, endIndex);

      // Response
      res.status(200).json({
        success: true,
        data: {
          items: paginatedData,
          grandTotal,
          pagination: {
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage: parseInt(limit),
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1
          }
        }
      });

    } catch (error) {
      console.error('Error in getTypeSalesReport:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data',
        error: error.message
      });
    }
  }

  async getSalesOutlet(req, res) {
    try {
      const {
        startDate,
        endDate,
        outletId,
        page = 1,
        limit = 50
      } = req.query;

      // Validasi dan set default date range menggunakan native Date
      let dateFilter = {};
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Validasi tanggal
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Format tanggal tidak valid'
          });
        }

        dateFilter = {
          createdAt: {
            $gte: start,
            $lte: end
          }
        };
      } else {
        // Default: hari ini
        const today = new Date();

        // Set start of day
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        // Set end of day
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        dateFilter = {
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        };
      }

      // Build match stage
      const matchStage = {
        status: 'Completed',
        ...dateFilter
      };

      // Filter by outlet if provided
      if (outletId) {
        matchStage.$or = [
          { 'outlet': outletId },
          { 'cashier.outlet.0.outletId': outletId }
        ];
      }

      // Aggregation pipeline untuk grouping dan kalkulasi
      const aggregationPipeline = [
        // Stage 1: Match documents
        {
          $match: matchStage
        },
        // Stage 2: Lookup untuk populate outlet info
        {
          $lookup: {
            from: 'outlets', // nama collection outlets
            localField: 'outlet',
            foreignField: '_id',
            as: 'outletInfo'
          }
        },
        // Stage 3: Unwind outlet info
        {
          $unwind: {
            path: '$outletInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        // Stage 4: Group by outlet
        {
          $group: {
            _id: {
              outletId: { $ifNull: ['$outletInfo._id', '$cashier.outlet.0.outletId._id'] },
              outletName: { $ifNull: ['$outletInfo.name', '$cashier.outlet.0.outletId.name'] }
            },
            count: { $sum: 1 },
            subtotalTotal: {
              $sum: {
                $ifNull: ['$grandTotal', '$totalPrice']
              }
            }
          }
        },
        // Stage 5: Project untuk format output
        {
          $project: {
            _id: 0,
            outletId: '$_id.outletId',
            outletName: { $ifNull: ['$_id.outletName', 'Unknown'] },
            count: 1,
            subtotalTotal: 1,
            averagePerTransaction: {
              $cond: {
                if: { $gt: ['$count', 0] },
                then: { $divide: ['$subtotalTotal', '$count'] },
                else: 0
              }
            }
          }
        },
        // Stage 6: Sort berdasarkan total penjualan (descending)
        { $sort: { subtotalTotal: -1 } }
      ];

      // Execute aggregation
      const allResults = await Order.aggregate(aggregationPipeline);

      // Calculate grand totals
      const grandTotal = allResults.reduce((acc, curr) => {
        acc.totalOutlets += 1;
        acc.totalTransactions += curr.count || 0;
        acc.totalSales += curr.subtotalTotal || 0;
        return acc;
      }, {
        totalOutlets: 0,
        totalTransactions: 0,
        totalSales: 0
      });

      grandTotal.averagePerTransaction = grandTotal.totalTransactions > 0
        ? grandTotal.totalSales / grandTotal.totalTransactions
        : 0;

      // Pagination
      const totalItems = allResults.length;
      const totalPages = Math.ceil(totalItems / limit);
      const currentPage = parseInt(page);
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedData = allResults.slice(startIndex, endIndex);

      // Response
      res.status(200).json({
        success: true,
        data: {
          items: paginatedData,
          allData: allResults, // Untuk export
          grandTotal,
          pagination: {
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage: parseInt(limit),
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1
          },
          filters: {
            startDate: startDate || null,
            endDate: endDate || null,
            outletId: outletId || null
          }
        }
      });

    } catch (error) {
      console.error('Error in getSalesOutlet:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data penjualan',
        error: error.message
      });
    }
  };

  /**
     * Delete Multiple Orders
     * @route   DELETE /api/report/sales-report/bulk
     * @access  Private (Admin/Superadmin)
     * @body    { orderIds: [id1, id2, id3, ...] }
     */
  async deleteMultipleOrders(req, res) {
    try {
      const { orderIds } = req.body;

      console.log('📥 Delete request received:', { orderIds, count: orderIds?.length });

      // ====================================
      // 1. VALIDASI INPUT
      // ====================================
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'orderIds harus berupa array dan tidak boleh kosong'
        });
      }

      // Validasi maksimal item untuk keamanan
      if (orderIds.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Maksimal 100 transaksi dapat dihapus sekaligus'
        });
      }

      // Validasi format ObjectId
      const invalidIds = orderIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        console.log('❌ Invalid IDs detected:', invalidIds);
        return res.status(400).json({
          success: false,
          message: 'Beberapa ID tidak valid',
          invalidIds
        });
      }

      // ====================================
      // 2. CEK ORDERS YANG AKAN DIHAPUS
      // ====================================
      const ordersToDelete = await Order.find({
        _id: { $in: orderIds }
      });

      console.log('🔍 Found orders:', ordersToDelete.length);

      if (ordersToDelete.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tidak ada transaksi yang ditemukan'
        });
      }

      // ====================================
      // 3. CEK PROTECTED ORDERS (OPTIONAL)
      // ====================================
      // Order dengan status tertentu tidak boleh dihapus
      const protectedOrders = ordersToDelete.filter(order =>
        order.status === 'Processing' || order.status === 'Pending'
      );

      if (protectedOrders.length > 0) {
        console.log('⚠️ Protected orders detected:', protectedOrders.length);
        return res.status(400).json({
          success: false,
          message: `${protectedOrders.length} transaksi tidak dapat dihapus karena masih dalam proses`,
          protectedOrderIds: protectedOrders.map(o => o._id)
        });
      }

      // ====================================
      // 4. HARD DELETE (PERMANENT)
      // ====================================
      const deleteResult = await Order.deleteMany({
        _id: { $in: orderIds }
      });

      console.log('✅ Delete result:', deleteResult);

      // ====================================
      // 5. RESPONSE
      // ====================================
      return res.status(200).json({
        success: true,
        message: `Berhasil menghapus ${deleteResult.deletedCount} transaksi`,
        data: {
          deletedCount: deleteResult.deletedCount,
          requestedCount: orderIds.length,
          notFoundCount: orderIds.length - ordersToDelete.length
        }
      });

    } catch (error) {
      console.error('❌ Error deleting multiple orders:', error);
      console.error('Error stack:', error.stack);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus transaksi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  } // ← HAPUS SEMICOLON (;) DISINI

  /**
   * Delete Single Order
   * @route   DELETE /api/report/sales-report/:id
   * @access  Private (Admin/Superadmin)
   */
  async deleteSingleOrder(req, res) {
    try {
      const { id } = req.params;

      console.log('📥 Single delete request for ID:', id);

      // ====================================
      // 1. VALIDASI OBJECTID
      // ====================================
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID transaksi tidak valid'
        });
      }

      // ====================================
      // 2. CEK APAKAH ORDER EXISTS
      // ====================================
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Transaksi tidak ditemukan'
        });
      }

      // ====================================
      // 3. VALIDASI STATUS
      // ====================================
      if (order.status === 'Processing' || order.status === 'Pending') {
        return res.status(400).json({
          success: false,
          message: 'Transaksi tidak dapat dihapus karena masih dalam proses'
        });
      }

      // ====================================
      // 4. HARD DELETE
      // ====================================
      await Order.findByIdAndDelete(id);

      console.log('✅ Order deleted:', id);

      return res.status(200).json({
        success: true,
        message: 'Berhasil menghapus transaksi',
        data: { orderId: id }
      });

    } catch (error) {
      console.error('❌ Error deleting order:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus transaksi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  } // ← HAPUS SEMICOLON (;) DISINI

  // ============================================
  // ALTERNATIVE: SOFT DELETE VERSION
  // ============================================

  /**
   * Soft Delete Multiple Orders
   * @route   DELETE /api/report/sales-report/bulk/soft
   * @access  Private (Admin/Superadmin)
   */
  async softDeleteMultipleOrders(req, res) {
    try {
      const { orderIds } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'orderIds harus berupa array dan tidak boleh kosong'
        });
      }

      if (orderIds.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Maksimal 100 transaksi dapat dihapus sekaligus'
        });
      }

      const invalidIds = orderIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Beberapa ID tidak valid',
          invalidIds
        });
      }

      const ordersToDelete = await Order.find({
        _id: { $in: orderIds }
      });

      if (ordersToDelete.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tidak ada transaksi yang ditemukan'
        });
      }

      const protectedOrders = ordersToDelete.filter(order =>
        order.status === 'Processing' || order.status === 'Pending'
      );

      if (protectedOrders.length > 0) {
        return res.status(400).json({
          success: false,
          message: `${protectedOrders.length} transaksi tidak dapat dihapus karena masih dalam proses`,
          protectedOrderIds: protectedOrders.map(o => o._id)
        });
      }

      // Soft delete dengan menambahkan field deletedAt
      const deleteResult = await Order.updateMany(
        { _id: { $in: orderIds } },
        {
          $set: {
            deletedAt: new Date(),
            deletedBy: req.user?.id || null
          }
        }
      );

      return res.status(200).json({
        success: true,
        message: `Berhasil menghapus ${deleteResult.modifiedCount} transaksi`,
        data: {
          deletedCount: deleteResult.modifiedCount,
          requestedCount: orderIds.length,
          notFoundCount: orderIds.length - ordersToDelete.length
        }
      });

    } catch (error) {
      console.error('❌ Error soft deleting multiple orders:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus transaksi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  } // ← HAPUS SEMICOLON (;) DISINI

  /**
   * Restore Multiple Orders (untuk soft delete)
   * @route   POST /api/report/sales-report/restore
   * @access  Private (Admin/Superadmin)
   */
  async restoreMultipleOrders(req, res) {
    try {
      const { orderIds } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'orderIds harus berupa array dan tidak boleh kosong'
        });
      }

      const restoreResult = await Order.updateMany(
        { _id: { $in: orderIds }, deletedAt: { $ne: null } },
        {
          $set: {
            deletedAt: null,
            deletedBy: null
          }
        }
      );

      return res.status(200).json({
        success: true,
        message: `Berhasil restore ${restoreResult.modifiedCount} transaksi`,
        data: {
          restoredCount: restoreResult.modifiedCount
        }
      });

    } catch (error) {
      console.error('❌ Error restoring orders:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat restore transaksi',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  } // ← HAPUS SEMICOLON (;) DISINI

  async getDeviceSalesReport(req, res) {
    try {
      const { startDate, endDate, outletId } = req.query;

      // Build match stage
      const matchStage = {
        status: 'Completed'
      };

      if (outletId) {
        matchStage.outlet = mongoose.Types.ObjectId(outletId);
      }

      if (startDate && endDate) {
        const start = new Date(startDate + 'T00:00:00.000+07:00');
        const end = new Date(endDate + 'T23:59:59.999+07:00');
        matchStage.createdAt = { $gte: start, $lte: end };
      }

      const pipeline = [
        // Match completed orders
        { $match: matchStage },

        // Lookup cashier details
        {
          $lookup: {
            from: 'users',
            localField: 'cashierId',
            foreignField: '_id',
            as: 'cashierDetails'
          }
        },

        // Lookup GRO details
        {
          $lookup: {
            from: 'users',
            localField: 'groId',
            foreignField: '_id',
            as: 'groDetails'
          }
        },

        // Lookup outlet details
        {
          $lookup: {
            from: 'outlets',
            localField: 'outlet',
            foreignField: '_id',
            as: 'outletDetails'
          }
        },

        // Unwind arrays (keep nulls)
        { $unwind: { path: '$cashierDetails', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$groDetails', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$outletDetails', preserveNullAndEmptyArrays: true } },

        // Lookup cashier's outlet
        {
          $lookup: {
            from: 'outlets',
            localField: 'cashierDetails.outlet.outletId',
            foreignField: '_id',
            as: 'cashierOutletDetails'
          }
        },

        // Lookup GRO's outlet
        {
          $lookup: {
            from: 'outlets',
            localField: 'groDetails.outlet.outletId',
            foreignField: '_id',
            as: 'groOutletDetails'
          }
        },

        // Create documents - PRIORITIZE GRO over Cashier
        {
          $facet: {
            // GRO Sales - Process first to take priority
            groSales: [
              { $match: { groId: { $exists: true, $ne: null } } },
              {
                $group: {
                  _id: '$groId',
                  deviceName: { $first: { $ifNull: ['$groDetails.name', { $ifNull: ['$groDetails.username', 'Unknown GRO'] }] } },
                  deviceType: { $first: 'GRO' },
                  outlet: { $first: { $arrayElemAt: ['$groOutletDetails.name', 0] } },
                  source: { $first: 'Gro' },
                  transactionCount: { $sum: 1 },
                  totalSales: { $sum: '$grandTotal' },
                  orders: {
                    $push: {
                      orderId: '$order_id',
                      grandTotal: '$grandTotal',
                      createdAt: '$createdAt'
                    }
                  }
                }
              },
              {
                $project: {
                  deviceId: { $concat: ['gro_', { $toString: '$_id' }] },
                  deviceName: 1,
                  deviceType: 1,
                  outlet: { $ifNull: ['$outlet', ''] },
                  source: 1,
                  transactionCount: 1,
                  totalSales: 1,
                  averagePerTransaction: {
                    $cond: [
                      { $gt: ['$transactionCount', 0] },
                      { $divide: ['$totalSales', '$transactionCount'] },
                      0
                    ]
                  },
                  orders: 1
                }
              }
            ],

            // Cashier Sales - Only if NO groId
            cashierSales: [
              {
                $match: {
                  $and: [
                    { cashierId: { $exists: true, $ne: null } },
                    { $or: [{ groId: { $exists: false } }, { groId: null }] }
                  ]
                }
              },
              {
                $group: {
                  _id: '$cashierId',
                  deviceName: { $first: { $ifNull: ['$cashierDetails.name', { $ifNull: ['$cashierDetails.username', 'Unknown Cashier'] }] } },
                  deviceType: { $first: { $ifNull: ['$cashierDetails.cashierType', 'Cashier'] } },
                  outlet: { $first: { $arrayElemAt: ['$cashierOutletDetails.name', 0] } },
                  source: { $first: 'Cashier' },
                  transactionCount: { $sum: 1 },
                  totalSales: { $sum: '$grandTotal' },
                  orders: {
                    $push: {
                      orderId: '$order_id',
                      grandTotal: '$grandTotal',
                      createdAt: '$createdAt'
                    }
                  }
                }
              },
              {
                $project: {
                  deviceId: { $concat: ['cashier_', { $toString: '$_id' }] },
                  deviceName: 1,
                  deviceType: 1,
                  outlet: { $ifNull: ['$outlet', ''] },
                  source: 1,
                  transactionCount: 1,
                  totalSales: 1,
                  averagePerTransaction: {
                    $cond: [
                      { $gt: ['$transactionCount', 0] },
                      { $divide: ['$totalSales', '$transactionCount'] },
                      0
                    ]
                  },
                  orders: 1
                }
              }
            ],

            // Unknown Sales - No groId AND no cashierId
            unknownSales: [
              {
                $match: {
                  $and: [
                    { $or: [{ cashierId: { $exists: false } }, { cashierId: null }] },
                    { $or: [{ groId: { $exists: false } }, { groId: null }] }
                  ]
                }
              },
              {
                $group: {
                  _id: 'unknown',
                  deviceName: { $first: 'Unknown Device' },
                  deviceType: { $first: 'Unknown' },
                  outlet: { $first: '$outletDetails.name' },
                  source: { $first: { $ifNull: ['$source', 'Unknown'] } },
                  transactionCount: { $sum: 1 },
                  totalSales: { $sum: '$grandTotal' },
                  orders: {
                    $push: {
                      orderId: '$order_id',
                      grandTotal: '$grandTotal',
                      createdAt: '$createdAt'
                    }
                  }
                }
              },
              {
                $project: {
                  deviceId: 'unknown',
                  deviceName: 1,
                  deviceType: 1,
                  outlet: { $ifNull: ['$outlet', ''] },
                  source: 1,
                  transactionCount: 1,
                  totalSales: 1,
                  averagePerTransaction: {
                    $cond: [
                      { $gt: ['$transactionCount', 0] },
                      { $divide: ['$totalSales', '$transactionCount'] },
                      0
                    ]
                  },
                  orders: 1
                }
              }
            ]
          }
        },

        // Combine all sales data
        {
          $project: {
            allSales: {
              $concatArrays: ['$groSales', '$cashierSales', '$unknownSales']
            }
          }
        },

        // Unwind to sort
        { $unwind: '$allSales' },

        // Sort by deviceType then deviceName
        {
          $sort: {
            'allSales.deviceType': 1,
            'allSales.deviceName': 1
          }
        },

        // Group back to calculate summary
        {
          $group: {
            _id: null,
            deviceSales: { $push: '$allSales' },
            totalDevices: { $sum: 1 },
            totalTransactions: { $sum: '$allSales.transactionCount' },
            totalSales: { $sum: '$allSales.totalSales' }
          }
        },

        // Final projection
        {
          $project: {
            _id: 0,
            deviceSales: 1,
            summary: {
              totalDevices: '$totalDevices',
              totalTransactions: '$totalTransactions',
              totalSales: '$totalSales',
              averagePerTransaction: {
                $cond: [
                  { $gt: ['$totalTransactions', 0] },
                  { $divide: ['$totalSales', '$totalTransactions'] },
                  0
                ]
              }
            }
          }
        }
      ];

      const result = await Order.aggregate(pipeline);

      // Handle empty result
      const response = result.length > 0 ? result[0] : {
        deviceSales: [],
        summary: {
          totalDevices: 0,
          totalTransactions: 0,
          totalSales: 0,
          averagePerTransaction: 0
        }
      };

      res.status(200).json({
        success: true,
        data: response.deviceSales,
        summary: response.summary,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          outletId: outletId || null
        }
      });

    } catch (error) {
      console.error('Get device sales report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch device sales report',
        error: error.message
      });
    }
  }

  async getCustomerSalesReport(req, res) {
    try {
      const { startDate, endDate, outletId, search, page = 1, limit = 10 } = req.query;

      // Build match stage
      const matchStage = {
        status: 'Completed'
      };

      // Filter by outlet
      if (outletId) {
        matchStage.outlet = mongoose.Types.ObjectId(outletId);
      }

      // Filter by date range
      if (startDate && endDate) {
        const start = new Date(startDate + 'T00:00:00.000+07:00');
        const end = new Date(endDate + 'T23:59:59.999+07:00');
        matchStage.createdAt = { $gte: start, $lte: end };
      }

      const pipeline = [
        // Match completed orders with filters
        { $match: matchStage },

        // Lookup customer details (optional, hanya untuk ambil phone dan type)
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'customerDetails'
          }
        },

        // Unwind customer details (preserve null)
        { $unwind: { path: '$customerDetails', preserveNullAndEmptyArrays: true } },

        // Add computed field for customer name
        {
          $addFields: {
            customerName: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$user', null] },
                    { $ne: ['$user', ''] }
                  ]
                },
                '$user',
                'Walk-in Customer'
              ]
            }
          }
        },

        // Group by customer name from 'user' field
        {
          $group: {
            _id: '$customerName',
            customerId: { $first: { $ifNull: ['$user_id', null] } },
            customerName: { $first: '$customerName' },
            customerPhone: { $first: { $ifNull: ['$customerDetails.phone', null] } },
            customerType: { $first: { $ifNull: ['$customerDetails.consumerType', '-'] } },
            transactionCount: { $sum: 1 },
            totalSales: { $sum: '$grandTotal' },
            firstTransaction: { $min: '$createdAt' },
            lastTransaction: { $max: '$createdAt' }
          }
        },

        // Add search filter if provided
        ...(search ? [{
          $match: {
            $or: [
              { customerName: { $regex: search, $options: 'i' } },
              { customerPhone: { $regex: search, $options: 'i' } }
            ]
          }
        }] : []),

        // Sort by total sales descending
        { $sort: { totalSales: -1 } },

        // Facet for pagination, summary, and top customers
        {
          $facet: {
            metadata: [
              { $count: 'total' },
              {
                $addFields: {
                  page: parseInt(page),
                  limit: parseInt(limit),
                  totalPages: { $ceil: { $divide: ['$total', parseInt(limit)] } }
                }
              }
            ],
            data: [
              { $skip: (parseInt(page) - 1) * parseInt(limit) },
              { $limit: parseInt(limit) },
              {
                $project: {
                  _id: 0,
                  customerId: 1,
                  customerName: 1,
                  customerPhone: 1,
                  customerType: 1,
                  transactionCount: 1,
                  totalSales: 1,
                  averagePerTransaction: {
                    $cond: [
                      { $gt: ['$transactionCount', 0] },
                      { $divide: ['$totalSales', '$transactionCount'] },
                      0
                    ]
                  },
                  firstTransaction: 1,
                  lastTransaction: 1
                }
              }
            ],
            allData: [
              {
                $project: {
                  _id: 0,
                  customerId: 1,
                  customerName: 1,
                  customerPhone: 1,
                  customerType: 1,
                  transactionCount: 1,
                  totalSales: 1,
                  averagePerTransaction: {
                    $cond: [
                      { $gt: ['$transactionCount', 0] },
                      { $divide: ['$totalSales', '$transactionCount'] },
                      0
                    ]
                  }
                }
              }
            ],
            summary: [
              {
                $group: {
                  _id: null,
                  totalCustomers: { $sum: 1 },
                  totalTransactions: { $sum: '$transactionCount' },
                  totalSales: { $sum: '$totalSales' }
                }
              },
              {
                $project: {
                  _id: 0,
                  totalCustomers: 1,
                  totalTransactions: 1,
                  totalSales: 1,
                  averagePerCustomer: {
                    $cond: [
                      { $gt: ['$totalCustomers', 0] },
                      { $divide: ['$totalSales', '$totalCustomers'] },
                      0
                    ]
                  },
                  averagePerTransaction: {
                    $cond: [
                      { $gt: ['$totalTransactions', 0] },
                      { $divide: ['$totalSales', '$totalTransactions'] },
                      0
                    ]
                  }
                }
              }
            ],
            topCustomerByTransaction: [
              { $sort: { transactionCount: -1 } },
              { $limit: 1 },
              {
                $project: {
                  _id: 0,
                  customerName: 1,
                  transactionCount: 1,
                  totalSales: 1
                }
              }
            ],
            topCustomerBySales: [
              { $sort: { totalSales: -1 } },
              { $limit: 1 },
              {
                $project: {
                  _id: 0,
                  customerName: 1,
                  transactionCount: 1,
                  totalSales: 1
                }
              }
            ]
          }
        }
      ];

      const result = await Order.aggregate(pipeline);

      // Extract results
      const metadata = result[0].metadata[0] || {
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 0
      };
      const data = result[0].data || [];
      const allData = result[0].allData || [];
      const summary = result[0].summary[0] || {
        totalCustomers: 0,
        totalTransactions: 0,
        totalSales: 0,
        averagePerCustomer: 0,
        averagePerTransaction: 0
      };
      const topCustomerByTransaction = result[0].topCustomerByTransaction[0] || null;
      const topCustomerBySales = result[0].topCustomerBySales[0] || null;

      res.status(200).json({
        success: true,
        data,
        allData, // Include all data for export
        summary: {
          ...summary,
          topCustomers: {
            byTransactionCount: topCustomerByTransaction,
            bySales: topCustomerBySales
          }
        },
        pagination: {
          currentPage: metadata.page,
          totalPages: metadata.totalPages,
          totalItems: metadata.total,
          itemsPerPage: metadata.limit
        },
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          outletId: outletId || null,
          search: search || null
        }
      });

    } catch (error) {
      console.error('Get customer sales report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer sales report',
        error: error.message
      });
    }
  }

}

// EKSPOR YANG BENAR - Pastikan ini ada di akhir file
const dailyProfitController = new DailyProfitController();
export default dailyProfitController;