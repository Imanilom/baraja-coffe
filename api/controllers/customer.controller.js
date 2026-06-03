// controllers/customerReportController.js
import { Order } from '../models/order.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';

/**
 * @desc    Get customer reports with orders and insights
 * @route   GET /api/reports/customers
 * @access  Private (Admin/Manager)
 */
export const getCustomerReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      outlet,
      cashierId,
      minOrders = 1,
      minSpent = 0,
      page = 1,
      limit = 20,
      sortBy = 'totalSpent',
      sortOrder = 'desc',
      search,
      loyaltyLevel,
      isActive
    } = req.query;

    // Calculate date range (default last 30 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;
    
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    // Build match conditions for orders
    const orderMatchConditions = {
      createdAtWIB: { $gte: start, $lte: end },
      status: { $in: ['Completed', 'Reserved', 'OnProcess'] } // Exclude canceled
    };

    if (outlet) {
      orderMatchConditions.outlet = new mongoose.Types.ObjectId(outlet);
    }

    if (cashierId) {
      orderMatchConditions.cashierId = new mongoose.Types.ObjectId(cashierId);
    }

    // Aggregation pipeline untuk mendapatkan data customer dengan order mereka
    const aggregationPipeline = [
      // Stage 1: Cari semua order dalam periode
      {
        $match: orderMatchConditions
      },
      
      // Stage 2: Group by user_id (customer)
      {
        $group: {
          _id: "$user_id",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$grandTotal" },
          avgOrderValue: { $avg: "$grandTotal" },
          firstOrderDate: { $min: "$createdAtWIB" },
          lastOrderDate: { $max: "$createdAtWIB" },
          orders: {
            $push: {
              order_id: "$order_id",
              createdAt: "$createdAtWIB",
              grandTotal: "$grandTotal",
              status: "$status",
              orderType: "$orderType",
              outlet: "$outlet",
              cashierId: "$cashierId",
              itemsCount: { $size: "$items" },
              payments: "$payments",
              user: "$user" // Tambah field user untuk guest
            }
          },
          paymentMethods: {
            $push: "$payments.paymentMethod"
          },
          orderTypes: {
            $push: "$orderType"
          },
          customerNames: {
            $addToSet: "$user"
          }
        }
      },
      
      // Stage 3: Filter berdasarkan minimum orders/spent
      {
        $match: {
          orderCount: { $gte: parseInt(minOrders) },
          totalSpent: { $gte: parseFloat(minSpent) }
        }
      },
      
      // Stage 4: Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      
      // Stage 5: Unwind user details
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true // Include guests (user_id = null)
        }
      },
      
      // Stage 6: Project dengan data yang dibutuhkan
      {
        $project: {
          userId: "$_id",
          customerName: {
            $cond: {
                if: { $eq: ["$_id", null] },
                then: "Guest Customer",
                else: {
                $ifNull: [
                    "$userDetails.username",
                    {
                    $cond: {
                        if: { $and: [
                        { $isArray: "$customerNames" },
                        { $gt: [{ $size: "$customerNames" }, 0] }
                        ]},
                        then: { $arrayElemAt: ["$customerNames", 0] },
                        else: "Unknown Customer"
                    }
                    }
                ]
                }
            }
          },
          email: "$userDetails.email",
          phone: "$userDetails.phone",
          loyaltyPoints: "$userDetails.loyaltyPoints",
          loyaltyLevel: "$userDetails.loyaltyLevel",
          profilePicture: "$userDetails.profilePicture",
          isActive: "$userDetails.isActive",
          orderCount: 1,
          totalSpent: 1,
          avgOrderValue: { $round: ["$avgOrderValue", 2] },
          firstOrderDate: 1,
          lastOrderDate: 1,
          daysSinceLastOrder: {
            $cond: {
              if: "$lastOrderDate",
              then: {
                $divide: [
                  { $subtract: [new Date(), "$lastOrderDate"] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: null
            }
          },
          // Hitung frequency (orders per month)
          orderFrequency: {
            $cond: {
              if: "$firstOrderDate",
              then: {
                $divide: [
                  "$orderCount",
                  {
                    $divide: [
                      { $subtract: [new Date(), "$firstOrderDate"] },
                      1000 * 60 * 60 * 30 // Approx month
                    ]
                  }
                ]
              },
              else: 0
            }
          },
          // Calculate customer value segments
          customerSegment: {
            $switch: {
              branches: [
                {
                  case: { $gte: ["$totalSpent", 1000000] },
                  then: "VIP"
                },
                {
                  case: { $gte: ["$totalSpent", 500000] },
                  then: "Gold"
                },
                {
                  case: { $gte: ["$totalSpent", 100000] },
                  then: "Silver"
                }
              ],
              default: "Bronze"
            }
          },
          // Analyze payment methods (simplified version)
         preferredPaymentMethod: {
            $let: {
                vars: {
                // Flatten payment methods dengan cara yang lebih aman
                allMethods: {
                    $reduce: {
                    input: {
                        $map: {
                        input: "$paymentMethods",
                        as: "methodArray",
                        in: { $ifNull: ["$$methodArray", []] }
                        }
                    },
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this"] }
                    }
                }
                },
                in: {
                $cond: [
                    { $gt: [{ $size: "$$allMethods" }, 0] },
                    {
                    $arrayElemAt: [
                        "$$allMethods",
                        0
                    ]
                    },
                    "Not available"
                ]
                }
            }
         },
          // Most common order type (simplified)
          preferredOrderType: {
            $let: {
              vars: {
                // Hitung frequency untuk setiap order type
                orderTypeStats: {
                  $reduce: {
                    input: "$orderTypes",
                    initialValue: [],
                    in: {
                      $let: {
                        vars: {
                          type: "$$this",
                          found: {
                            $filter: {
                              input: "$$value",
                              as: "stat",
                              cond: { $eq: ["$$stat.type", "$$this"] }
                            }
                          }
                        },
                        in: {
                          $cond: [
                            { $eq: [{ $size: "$$found" }, 0] },
                            { $concatArrays: ["$$value", [{ type: "$$this", count: 1 }]] },
                            {
                              $map: {
                                input: "$$value",
                                as: "stat",
                                in: {
                                  $cond: [
                                    { $eq: ["$$stat.type", "$$this"] },
                                    { type: "$$stat.type", count: { $add: ["$$stat.count", 1] } },
                                    "$$stat"
                                  ]
                                }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              },
              in: {
                $let: {
                  vars: {
                    sortedTypes: {
                      $sortArray: {
                        input: "$$orderTypeStats",
                        sortBy: { count: -1 }
                      }
                    }
                  },
                  in: {
                    $ifNull: [
                      { $arrayElemAt: [{ $map: { input: "$$sortedTypes", as: "st", in: "$$st.type" } }, 0] },
                      "Not available"
                    ]
                  }
                }
              }
            }
          },
          orders: 1
        }
      },
      
      // Stage 7: Filter berdasarkan search
      {
        $match: search ? {
          $or: [
            { customerName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ]
        } : {}
      },
      
      // Stage 8: Filter berdasarkan loyaltyLevel
      {
        $match: loyaltyLevel ? {
          "userDetails.loyaltyLevel": new mongoose.Types.ObjectId(loyaltyLevel)
        } : {}
      },
      
      // Stage 9: Filter berdasarkan isActive
      {
        $match: isActive !== undefined ? {
          "userDetails.isActive": isActive === 'true'
        } : {}
      },
      
      // Stage 10: Sort
      {
        $sort: {
          [sortBy]: sortOrder === 'desc' ? -1 : 1
        }
      }
    ];

    // Eksekusi aggregation untuk data
    const customers = await Order.aggregate(aggregationPipeline);

    // Hitung total count secara terpisah untuk pagination
    const countPipeline = [
      ...aggregationPipeline.slice(0, -1), // Ambil semua stage kecuali sort
      { $count: "totalCount" }
    ];

    const countResult = await Order.aggregate(countPipeline);
    const totalCount = countResult[0]?.totalCount || 0;

    // Apply pagination secara manual
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedCustomers = customers.slice(startIndex, endIndex);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage: endIndex < totalCount,
        hasPrevPage: startIndex > 0
      },
      dateRange: {
        start: start,
        end: end,
        startFormatted: start.toLocaleDateString('id-ID'),
        endFormatted: end.toLocaleDateString('id-ID')
      },
      filters: {
        startDate,
        endDate,
        outlet,
        cashierId,
        minOrders,
        minSpent,
        search,
        loyaltyLevel,
        isActive
      }
    });

  } catch (error) {
    console.error('Error in getCustomerReports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get detailed customer report by ID
 * @route   GET /api/reports/customers/:customerId
 * @access  Private (Admin/Manager)
 */
export const getCustomerDetailReport = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate, outlet } = req.query;

    const start = startDate ? new Date(startDate) : new Date('1970-01-01');
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Build match conditions
    const matchConditions = {
      createdAtWIB: { $gte: start, $lte: end }
    };

    if (customerId !== 'guest') {
      matchConditions.user_id = new mongoose.Types.ObjectId(customerId);
    } else {
      matchConditions.user_id = null; // Guest orders
    }

    if (outlet) {
      matchConditions.outlet = new mongoose.Types.ObjectId(outlet);
    }

    // Get customer details (if not guest)
    let customerDetails = null;
    if (customerId !== 'guest') {
      customerDetails = await User.findById(customerId)
        .populate('role', 'name')
        .populate('loyaltyLevel', 'name level requirements benefits')
        .populate('claimedVouchers', 'code name discountType discountValue')
        .populate('favorites', 'name price category')
        .lean();
    }

    // Get all orders for this customer
    const orders = await Order.find(matchConditions)
      .populate('cashierId', 'username email')
      .populate('outlet', 'name address')
      .populate('items.menuItem', 'name price category')
      .sort({ createdAtWIB: -1 })
      .lean();

    // Calculate statistics
    const statistics = orders.reduce((stats, order) => {
      stats.totalOrders++;
      stats.totalSpent += order.grandTotal || 0;
      stats.avgOrderValue = stats.totalSpent / stats.totalOrders;
      
      // Count by status
      stats.statusCount[order.status] = (stats.statusCount[order.status] || 0) + 1;
      
      // Count by order type
      stats.orderTypeCount[order.orderType] = (stats.orderTypeCount[order.orderType] || 0) + 1;
      
      // Count by payment method
      if (order.payments && order.payments.length > 0) {
        order.payments.forEach(payment => {
          stats.paymentMethodCount[payment.paymentMethod] = 
            (stats.paymentMethodCount[payment.paymentMethod] || 0) + 1;
        });
      }
      
      // Track favorite items
      order.items.forEach(item => {
        const itemName = item.menuItemData?.name || item.menuItem?.name || 'Unknown';
        stats.favoriteItems[itemName] = (stats.favoriteItems[itemName] || 0) + item.quantity;
      });
      
      return stats;
    }, {
      totalOrders: 0,
      totalSpent: 0,
      avgOrderValue: 0,
      statusCount: {},
      orderTypeCount: {},
      paymentMethodCount: {},
      favoriteItems: {}
    });

    // Calculate average days between orders
    const orderDates = orders.map(o => o.createdAtWIB).sort((a, b) => a - b);
    let avgDaysBetweenOrders = 0;
    if (orderDates.length > 1) {
      const timeDiffs = [];
      for (let i = 1; i < orderDates.length; i++) {
        const diff = (orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24);
        timeDiffs.push(diff);
      }
      avgDaysBetweenOrders = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    }

    // Determine customer segment
    const customerSegment = statistics.totalSpent >= 1000000 ? 'VIP' :
                          statistics.totalSpent >= 500000 ? 'Gold' :
                          statistics.totalSpent >= 100000 ? 'Silver' : 'Bronze';

    // Get most used payment method
    const preferredPaymentMethod = Object.entries(statistics.paymentMethodCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Not available';

    // Get most ordered items (top 5)
    const topItems = Object.entries(statistics.favoriteItems)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Calculate monthly spending trend
    const monthlySpending = orders.reduce((acc, order) => {
      const monthYear = order.createdAtWIB.toLocaleString('id-ID', {
        month: 'short',
        year: 'numeric'
      });
      acc[monthYear] = (acc[monthYear] || 0) + order.grandTotal;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        customer: customerDetails || {
          _id: 'guest',
          username: 'Guest Customer',
          email: null,
          phone: null,
          isGuest: true
        },
        statistics: {
          ...statistics,
          avgOrderValue: parseFloat(statistics.avgOrderValue.toFixed(2)),
          avgDaysBetweenOrders: parseFloat(avgDaysBetweenOrders.toFixed(1)),
          customerSegment,
          preferredPaymentMethod,
          topItems,
          monthlySpending
        },
        orders: orders,
        dateRange: {
          start: start,
          end: end,
          startFormatted: start.toLocaleDateString('id-ID'),
          endFormatted: end.toLocaleDateString('id-ID')
        }
      }
    });

  } catch (error) {
    console.error('Error in getCustomerDetailReport:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get customer insights and analytics (SIMPLIFIED VERSION)
 * @route   GET /api/reports/customers/insights/overview
 * @access  Private (Admin/Manager)
 */
export const getCustomerInsightsOverview = async (req, res) => {
  try {
    const { startDate, endDate, outlet } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30); // Default last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const matchConditions = {
      createdAtWIB: { $gte: start, $lte: end },
      status: { $in: ['Completed', 'Reserved', 'OnProcess'] }
    };

    if (outlet) {
      matchConditions.outlet = new mongoose.Types.ObjectId(outlet);
    }

    // Get basic metrics
    const basicMetrics = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
          uniqueCustomers: { $addToSet: "$user_id" },
          totalItemsSold: { $sum: { $size: "$items" } }
        }
      },
      {
        $project: {
          totalOrders: 1,
          totalRevenue: 1,
          uniqueCustomers: { $size: "$uniqueCustomers" },
          totalItemsSold: 1,
          avgOrderValue: {
            $cond: [
              { $eq: ["$totalOrders", 0] },
              0,
              { $divide: ["$totalRevenue", "$totalOrders"] }
            ]
          },
          avgItemsPerOrder: {
            $cond: [
              { $eq: ["$totalOrders", 0] },
              0,
              { $divide: ["$totalItemsSold", "$totalOrders"] }
            ]
          }
        }
      }
    ]);

    // Get customer segments (simplified)
    const customerSegments = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$user_id",
          totalSpent: { $sum: "$grandTotal" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $bucket: {
          groupBy: "$totalSpent",
          boundaries: [0, 100000, 500000, 1000000, Infinity],
          default: "Other",
          output: {
            count: { $sum: 1 },
            totalSpent: { $sum: "$totalSpent" },
            avgOrders: { $avg: "$orderCount" }
          }
        }
      }
    ]);

    // Get top 10 customers
    const topCustomers = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$user_id",
          totalSpent: { $sum: "$grandTotal" },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: "$createdAtWIB" },
          customerName: { $first: "$user" }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          customerId: "$_id",
          customerName: {
            $cond: {
              if: { $eq: ["$_id", null] },
              then: "$customerName",
              else: { $ifNull: ["$userDetails.username", "$customerName"] }
            }
          },
          email: "$userDetails.email",
          phone: "$userDetails.phone",
          totalSpent: 1,
          orderCount: 1,
          avgOrderValue: {
            $cond: [
              { $eq: ["$orderCount", 0] },
              0,
              { $divide: ["$totalSpent", "$orderCount"] }
            ]
          },
          lastOrderDate: 1,
          daysSinceLastOrder: {
            $cond: [
              { $eq: ["$lastOrderDate", null] },
              null,
              {
                $divide: [
                  { $subtract: [new Date(), "$lastOrderDate"] },
                  1000 * 60 * 60 * 24
                ]
              }
            ]
          }
        }
      }
    ]);

    // Get monthly trend
    const monthlyTrend = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            year: { $year: "$createdAtWIB" },
            month: { $month: "$createdAtWIB" }
          },
          revenue: { $sum: "$grandTotal" },
          orders: { $sum: 1 },
          customers: { $addToSet: "$user_id" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          monthYear: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              { $toString: { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] } }
            ]
          },
          revenue: 1,
          orders: 1,
          uniqueCustomers: { $size: "$customers" }
        }
      }
    ]);

    const overview = basicMetrics[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      uniqueCustomers: 0,
      totalItemsSold: 0,
      avgOrderValue: 0,
      avgItemsPerOrder: 0
    };

    // Format numbers
    overview.avgOrderValue = parseFloat(overview.avgOrderValue.toFixed(2));
    overview.avgItemsPerOrder = parseFloat(overview.avgItemsPerOrder.toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        overview,
        customerSegments,
        topCustomers,
        monthlyTrend,
        dateRange: {
          start: start,
          end: end,
          startFormatted: start.toLocaleDateString('id-ID'),
          endFormatted: end.toLocaleDateString('id-ID')
        }
      }
    });

  } catch (error) {
    console.error('Error in getCustomerInsightsOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get cashier performance report
 * @route   GET /api/reports/cashiers/performance
 * @access  Private (Admin/Manager)
 */
export const getCashierPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, outlet } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const matchConditions = {
      createdAtWIB: { $gte: start, $lte: end },
      cashierId: { $ne: null },
      status: { $in: ['Completed', 'Reserved', 'OnProcess'] }
    };

    if (outlet) {
      matchConditions.outlet = new mongoose.Types.ObjectId(outlet);
    }

    const cashierPerformance = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$cashierId",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
          avgOrderValue: { $avg: "$grandTotal" },
          firstOrderDate: { $min: "$createdAtWIB" },
          lastOrderDate: { $max: "$createdAtWIB" },
          // Count order types
          dineInCount: {
            $sum: { $cond: [{ $eq: ["$orderType", "Dine-In"] }, 1, 0] }
          },
          takeAwayCount: {
            $sum: { $cond: [{ $eq: ["$orderType", "Take Away"] }, 1, 0] }
          },
          deliveryCount: {
            $sum: { $cond: [{ $eq: ["$orderType", "Delivery"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "cashierDetails"
        }
      },
      { $unwind: "$cashierDetails" },
      {
        $project: {
          cashierId: "$_id",
          cashierName: "$cashierDetails.username",
          cashierEmail: "$cashierDetails.email",
          cashierType: "$cashierDetails.cashierType",
          totalOrders: 1,
          totalRevenue: 1,
          avgOrderValue: { $round: ["$avgOrderValue", 2] },
          dineInOrders: "$dineInCount",
          takeAwayOrders: "$takeAwayCount",
          deliveryOrders: "$deliveryCount",
          workDurationDays: {
            $ceil: {
              $divide: [
                { $subtract: ["$lastOrderDate", "$firstOrderDate"] },
                1000 * 60 * 60 * 24
              ]
            }
          },
          ordersPerDay: {
            $round: [{
              $divide: [
                "$totalOrders",
                {
                  $max: [
                    1,
                    {
                      $divide: [
                        { $subtract: ["$lastOrderDate", "$firstOrderDate"] },
                        1000 * 60 * 60 * 24
                      ]
                    }
                  ]
                }
              ]
            }, 2]
          }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Calculate summary
    const summary = cashierPerformance.reduce((acc, cashier) => {
      acc.totalCashiers++;
      acc.totalRevenue += cashier.totalRevenue;
      acc.totalOrders += cashier.totalOrders;
      return acc;
    }, {
      totalCashiers: 0,
      totalRevenue: 0,
      totalOrders: 0
    });

    // Add averages
    if (summary.totalCashiers > 0) {
      summary.averageRevenuePerCashier = summary.totalRevenue / summary.totalCashiers;
      summary.averageOrdersPerCashier = summary.totalOrders / summary.totalCashiers;
    }

    res.status(200).json({
      success: true,
      data: {
        cashiers: cashierPerformance,
        summary,
        dateRange: {
          start: start,
          end: end,
          startFormatted: start.toLocaleDateString('id-ID'),
          endFormatted: end.toLocaleDateString('id-ID')
        }
      }
    });

  } catch (error) {
    console.error('Error in getCashierPerformanceReport:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Export customer report to CSV
 * @route   GET /api/reports/customers/export
 * @access  Private (Admin/Manager)
 */
export const exportCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get aggregated customer data (simplified for export)
    const customers = await Order.aggregate([
      {
        $match: {
          createdAtWIB: { $gte: start, $lte: end },
          status: { $in: ['Completed', 'Reserved', 'OnProcess'] }
        }
      },
      {
        $group: {
          _id: "$user_id",
          customerName: { $first: "$user" },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$grandTotal" },
          avgOrderValue: { $avg: "$grandTotal" },
          firstOrderDate: { $min: "$createdAtWIB" },
          lastOrderDate: { $max: "$createdAtWIB" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          customerId: { $ifNull: ["$_id", "GUEST"] },
          customerName: {
            $cond: {
              if: { $eq: ["$_id", null] },
              then: "Guest Customer",
              else: { $ifNull: ["$userDetails.username", "$customerName"] }
            }
          },
          email: "$userDetails.email",
          phone: "$userDetails.phone",
          loyaltyPoints: "$userDetails.loyaltyPoints",
          orderCount: 1,
          totalSpent: 1,
          avgOrderValue: { $round: ["$avgOrderValue", 2] },
          firstOrderDate: { $dateToString: { format: "%Y-%m-%d", date: "$firstOrderDate" } },
          lastOrderDate: { $dateToString: { format: "%Y-%m-%d", date: "$lastOrderDate" } },
          daysSinceLastOrder: {
            $ceil: {
              $divide: [
                { $subtract: [new Date(), "$lastOrderDate"] },
                1000 * 60 * 60 * 24
              ]
            }
          },
          customerValue: {
            $switch: {
              branches: [
                { case: { $gte: ["$totalSpent", 1000000] }, then: "VIP" },
                { case: { $gte: ["$totalSpent", 500000] }, then: "Gold" },
                { case: { $gte: ["$totalSpent", 100000] }, then: "Silver" }
              ],
              default: "Bronze"
            }
          }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'Customer ID', 'Customer Name', 'Email', 'Phone',
        'Loyalty Points', 'Order Count', 'Total Spent',
        'Average Order Value', 'First Order Date',
        'Last Order Date', 'Days Since Last Order', 'Customer Value'
      ];

      const csvData = customers.map(customer => [
        customer.customerId,
        customer.customerName,
        customer.email || '',
        customer.phone || '',
        customer.loyaltyPoints || 0,
        customer.orderCount,
        customer.totalSpent,
        customer.avgOrderValue,
        customer.firstOrderDate,
        customer.lastOrderDate,
        customer.daysSinceLastOrder,
        customer.customerValue
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=customer-report-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csvContent);
    }

    // Return JSON
    res.status(200).json({
      success: true,
      data: customers,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Error in exportCustomerReport:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};