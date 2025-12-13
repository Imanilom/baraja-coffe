import { Order } from '../models/order.model.js';
import { TaxAndService } from '../models/TaxAndService.model.js';
import AutoPromo from '../models/AutoPromo.model.js';
import Promo from '../models/Promo.model.js';
import Voucher from '../models/voucher.model.js';
import mongoose from 'mongoose';

/**
 * @desc    Generate Profit & Loss Report
 * @route   GET /api/reports/profit-loss
 * @access  Private (Admin/Manager)
 */
export const getProfitLossReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      outletId,
      groupBy = 'daily',
      includeDetails = false
    } = req.query;

    // Validasi tanggal
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date dan end date harus diisi'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format tanggal tidak valid'
      });
    }

    // Build match conditions
    const matchConditions = {
      createdAtWIB: { $gte: start, $lte: end },
      status: 'Completed',
      ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) })
    };

    // Aggregation pipeline untuk laporan laba rugi (SEDERHANAKAN)
    const aggregationPipeline = [
      // Stage 1: Match orders
      { $match: matchConditions },

      // Stage 2: Add fields untuk perhitungan
      {
        $addFields: {
          // Hitung total cost (asumsi: cost = 40% dari totalBeforeDiscount)
          estimatedCost: {
            $multiply: ['$totalBeforeDiscount', 0.4]
          },
          
          // Hitung total diskon
          totalDiscounts: {
            $add: [
              { $ifNull: ['$discounts.autoPromoDiscount', 0] },
              { $ifNull: ['$discounts.manualDiscount', 0] },
              { $ifNull: ['$discounts.voucherDiscount', 0] }
            ]
          },
          
          // Hitung komisi yang hilang (10% dari total diskon)
          lostCommission: {
            $multiply: [
              {
                $add: [
                  { $ifNull: ['$discounts.autoPromoDiscount', 0] },
                  { $ifNull: ['$discounts.manualDiscount', 0] },
                  { $ifNull: ['$discounts.voucherDiscount', 0] }
                ]
              },
              0.1
            ]
          },
          
          // Net revenue (totalAfterDiscount + pajak + service fee)
          netRevenue: {
            $add: [
              '$totalAfterDiscount',
              { $ifNull: ['$totalTax', 0] },
              { $ifNull: ['$totalServiceFee', 0] }
            ]
          },
          
          // Gross profit (revenue - cost)
          grossProfit: {
            $subtract: ['$totalAfterDiscount', { $multiply: ['$totalBeforeDiscount', 0.4] }]
          },
          
          // Net profit (net revenue - cost)
          netProfit: {
            $subtract: [
              {
                $add: [
                  '$totalAfterDiscount',
                  { $ifNull: ['$totalTax', 0] },
                  { $ifNull: ['$totalServiceFee', 0] }
                ]
              },
              { $multiply: ['$totalBeforeDiscount', 0.4] }
            ]
          }
        }
      },

      // Stage 3: Group by period (SIMPLE VERSION)
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAtWIB'
            }
          },
          
          // Summary metrics
          totalOrders: { $sum: 1 },
          totalRevenueBeforeDiscount: { $sum: '$totalBeforeDiscount' },
          totalRevenueAfterDiscount: { $sum: '$totalAfterDiscount' },
          totalDiscounts: { $sum: '$totalDiscounts' },
          totalTax: { $sum: { $ifNull: ['$totalTax', 0] } },
          totalServiceFee: { $sum: { $ifNull: ['$totalServiceFee', 0] } },
          totalNetRevenue: { $sum: '$netRevenue' },
          totalEstimatedCost: { $sum: '$estimatedCost' },
          totalGrossProfit: { $sum: '$grossProfit' },
          totalNetProfit: { $sum: '$netProfit' },
          totalLostCommission: { $sum: '$lostCommission' },
          
          // Average metrics
          avgOrderValue: { $avg: '$grandTotal' },
          avgDiscountPerOrder: { $avg: '$totalDiscounts' },
          
          // Most common order type (SIMPLE VERSION)
          orderTypes: { $push: '$orderType' },
          
          // Most common payment method (SIMPLE VERSION)
          paymentMethods: { $push: '$paymentMethod' }
        }
      },

      // Stage 4: Additional calculations (FIXED VERSION)
      {
        $addFields: {
          period: '$_id',
          
          // Calculate profit margins
          grossProfitMargin: {
            $cond: {
              if: { $eq: ['$totalRevenueAfterDiscount', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$totalGrossProfit', '$totalRevenueAfterDiscount'] },
                  100
                ]
              }
            }
          },
          
          netProfitMargin: {
            $cond: {
              if: { $eq: ['$totalRevenueAfterDiscount', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$totalNetProfit', '$totalRevenueAfterDiscount'] },
                  100
                ]
              }
            }
          },
          
          // Calculate discount impact
          discountImpactPercentage: {
            $cond: {
              if: { $eq: ['$totalRevenueBeforeDiscount', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$totalDiscounts', '$totalRevenueBeforeDiscount'] },
                  100
                ]
              }
            }
          },
          
          // Calculate commission loss impact
          commissionLossPercentage: {
            $cond: {
              if: { $eq: ['$totalRevenueBeforeDiscount', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$totalLostCommission', '$totalRevenueBeforeDiscount'] },
                  100
                ]
              }
            }
          },
          
          // Most common order type (FIXED - SIMPLIFIED)
          mostCommonOrderType: {
            $let: {
              vars: {
                orderTypesArray: {
                  $filter: {
                    input: '$orderTypes',
                    as: 'type',
                    cond: { $ne: ['$$type', null] }
                  }
                }
              },
              in: {
                $cond: {
                  if: { $gt: [{ $size: '$$orderTypesArray' }, 0] },
                  then: {
                    $arrayElemAt: [
                      '$$orderTypesArray',
                      0
                    ]
                  },
                  else: 'Not available'
                }
              }
            }
          },
          
          // Most common payment method (FIXED - SIMPLIFIED)
          mostCommonPaymentMethod: {
            $let: {
              vars: {
                paymentMethodsArray: {
                  $filter: {
                    input: '$paymentMethods',
                    as: 'method',
                    cond: { $ne: ['$$method', null] }
                  }
                }
              },
              in: {
                $cond: {
                  if: { $gt: [{ $size: '$$paymentMethodsArray' }, 0] },
                  then: {
                    $arrayElemAt: [
                      '$$paymentMethodsArray',
                      0
                    ]
                  },
                  else: 'Not available'
                }
              }
            }
          }
        }
      },

      // Stage 5: Final projection
      {
        $project: {
          _id: 0,
          period: 1,
          summary: {
            totalOrders: 1,
            totalRevenueBeforeDiscount: { $round: ['$totalRevenueBeforeDiscount', 2] },
            totalRevenueAfterDiscount: { $round: ['$totalRevenueAfterDiscount', 2] },
            totalDiscounts: { $round: ['$totalDiscounts', 2] },
            totalTax: { $round: ['$totalTax', 2] },
            totalServiceFee: { $round: ['$totalServiceFee', 2] },
            totalNetRevenue: { $round: ['$totalNetRevenue', 2] },
            totalEstimatedCost: { $round: ['$totalEstimatedCost', 2] },
            totalGrossProfit: { $round: ['$totalGrossProfit', 2] },
            totalNetProfit: { $round: ['$totalNetProfit', 2] },
            totalLostCommission: { $round: ['$totalLostCommission', 2] },
            
            // Averages
            avgOrderValue: { $round: ['$avgOrderValue', 2] },
            avgDiscountPerOrder: { $round: ['$avgDiscountPerOrder', 2] },
            
            // Percentages
            grossProfitMargin: { $round: ['$grossProfitMargin', 2] },
            netProfitMargin: { $round: ['$netProfitMargin', 2] },
            discountImpactPercentage: { $round: ['$discountImpactPercentage', 2] },
            commissionLossPercentage: { $round: ['$commissionLossPercentage', 2] },
            
            // Most common
            mostCommonOrderType: 1,
            mostCommonPaymentMethod: 1
          }
        }
      },

      // Stage 6: Sort by period
      {
        $sort: { period: 1 }
      }
    ];

    // Execute aggregation
    const profitLossReport = await Order.aggregate(aggregationPipeline);

    // Calculate overall summary
    const overallSummary = {
      totalOrders: 0,
      totalRevenueBeforeDiscount: 0,
      totalRevenueAfterDiscount: 0,
      totalDiscounts: 0,
      totalTax: 0,
      totalServiceFee: 0,
      totalNetRevenue: 0,
      totalEstimatedCost: 0,
      totalGrossProfit: 0,
      totalNetProfit: 0,
      totalLostCommission: 0,
      avgOrderValue: 0,
      avgDiscountPerOrder: 0,
      grossProfitMargin: 0,
      netProfitMargin: 0,
      discountImpactPercentage: 0,
      commissionLossPercentage: 0
    };

    if (profitLossReport.length > 0) {
      // Sum all metrics
      profitLossReport.forEach(period => {
        overallSummary.totalOrders += period.summary.totalOrders;
        overallSummary.totalRevenueBeforeDiscount += period.summary.totalRevenueBeforeDiscount;
        overallSummary.totalRevenueAfterDiscount += period.summary.totalRevenueAfterDiscount;
        overallSummary.totalDiscounts += period.summary.totalDiscounts;
        overallSummary.totalTax += period.summary.totalTax;
        overallSummary.totalServiceFee += period.summary.totalServiceFee;
        overallSummary.totalNetRevenue += period.summary.totalNetRevenue;
        overallSummary.totalEstimatedCost += period.summary.totalEstimatedCost;
        overallSummary.totalGrossProfit += period.summary.totalGrossProfit;
        overallSummary.totalNetProfit += period.summary.totalNetProfit;
        overallSummary.totalLostCommission += period.summary.totalLostCommission;
      });

      // Calculate averages
      overallSummary.avgOrderValue = profitLossReport.reduce((sum, period) => 
        sum + period.summary.avgOrderValue, 0) / profitLossReport.length;
      
      overallSummary.avgDiscountPerOrder = profitLossReport.reduce((sum, period) => 
        sum + period.summary.avgDiscountPerOrder, 0) / profitLossReport.length;

      // Calculate percentages
      if (overallSummary.totalRevenueBeforeDiscount > 0) {
        overallSummary.discountImpactPercentage = 
          (overallSummary.totalDiscounts / overallSummary.totalRevenueBeforeDiscount) * 100;
        overallSummary.commissionLossPercentage = 
          (overallSummary.totalLostCommission / overallSummary.totalRevenueBeforeDiscount) * 100;
      }

      if (overallSummary.totalRevenueAfterDiscount > 0) {
        overallSummary.grossProfitMargin = 
          (overallSummary.totalGrossProfit / overallSummary.totalRevenueAfterDiscount) * 100;
        overallSummary.netProfitMargin = 
          (overallSummary.totalNetProfit / overallSummary.totalRevenueAfterDiscount) * 100;
      }

      // Round all numbers
      Object.keys(overallSummary).forEach(key => {
        if (typeof overallSummary[key] === 'number') {
          overallSummary[key] = Math.round(overallSummary[key] * 100) / 100;
        }
      });
    }

    // Analyze trends
    const trends = analyzeProfitTrends(profitLossReport);

    res.status(200).json({
      success: true,
      data: {
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          groupBy,
          totalPeriods: profitLossReport.length
        },
        overallSummary,
        periodBreakdown: profitLossReport,
        metrics: {
          kpis: {
            netProfitMargin: overallSummary.netProfitMargin,
            grossProfitMargin: overallSummary.grossProfitMargin,
            avgOrderValue: overallSummary.avgOrderValue,
            discountImpact: overallSummary.discountImpactPercentage,
            commissionLoss: overallSummary.commissionLossPercentage
          },
          trends
        }
      }
    });

  } catch (error) {
    console.error('Error in getProfitLossReport:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get Discount Usage Report
 * @route   GET /api/reports/discount-usage
 * @access  Private (Admin/Manager)
 */
export const getDiscountUsageReport = async (req, res) => {
  try {
    const { startDate, endDate, outletId, discountType } = req.query;

    // Validasi parameter wajib
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date dan end date harus diisi'
      });
    }

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

    const matchConditions = {
      createdAtWIB: { $gte: start, $lte: end },
      status: 'Completed',
      ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) })
    };

    // Filter berdasarkan discount type jika ada
    if (discountType && discountType !== 'all') {
      switch (discountType) {
        case 'autoPromo':
          matchConditions['discounts.autoPromoDiscount'] = { $gt: 0 };
          break;
        case 'manual':
          matchConditions['discounts.manualDiscount'] = { $gt: 0 };
          break;
        case 'voucher':
          matchConditions['discounts.voucherDiscount'] = { $gt: 0 };
          break;
      }
    }

    const aggregationPipeline = [
      // Stage 1: Match orders
      { $match: matchConditions },

      // Stage 2: Hitung total discount per order
      {
        $addFields: {
          totalDiscount: {
            $add: [
              { $ifNull: ['$discounts.autoPromoDiscount', 0] },
              { $ifNull: ['$discounts.manualDiscount', 0] },
              { $ifNull: ['$discounts.voucherDiscount', 0] }
            ]
          },
          discountPercentage: {
            $cond: {
              if: { $eq: ['$totalBeforeDiscount', 0] },
              then: 0,
              else: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $add: [
                          { $ifNull: ['$discounts.autoPromoDiscount', 0] },
                          { $ifNull: ['$discounts.manualDiscount', 0] },
                          { $ifNull: ['$discounts.voucherDiscount', 0] }
                        ]
                      },
                      '$totalBeforeDiscount'
                    ]
                  },
                  100
                ]
              }
            }
          },
          hasDiscount: {
            $cond: {
              if: {
                $gt: [{
                  $add: [
                    { $ifNull: ['$discounts.autoPromoDiscount', 0] },
                    { $ifNull: ['$discounts.manualDiscount', 0] },
                    { $ifNull: ['$discounts.voucherDiscount', 0] }
                  ]
                }, 0]
              },
              then: true,
              else: false
            }
          }
        }
      },

      // Stage 3: Group untuk summary (DIPERBAIKI)
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          ordersWithDiscount: {
            $sum: {
              $cond: ['$hasDiscount', 1, 0]
            }
          },
          totalRevenueBeforeDiscount: { $sum: '$totalBeforeDiscount' },
          totalRevenueAfterDiscount: { $sum: '$totalAfterDiscount' },
          totalDiscountAmount: { $sum: '$totalDiscount' },
          autoPromoDiscount: { $sum: { $ifNull: ['$discounts.autoPromoDiscount', 0] } },
          manualDiscount: { $sum: { $ifNull: ['$discounts.manualDiscount', 0] } },
          voucherDiscount: { $sum: { $ifNull: ['$discounts.voucherDiscount', 0] } },
          
          // Detail per discount type
          autoPromoOrders: {
            $sum: {
              $cond: [
                { $gt: [{ $ifNull: ['$discounts.autoPromoDiscount', 0] }, 0] },
                1,
                0
              ]
            }
          },
          manualPromoOrders: {
            $sum: {
              $cond: [
                { $gt: [{ $ifNull: ['$discounts.manualDiscount', 0] }, 0] },
                1,
                0
              ]
            }
          },
          voucherOrders: {
            $sum: {
              $cond: [
                { $gt: [{ $ifNull: ['$discounts.voucherDiscount', 0] }, 0] },
                1,
                0
              ]
            }
          },
          
          // Average discount per order
          avgDiscountPerOrder: { $avg: '$totalDiscount' },
          avgDiscountPercentage: { $avg: '$discountPercentage' },
          avgRevenueBeforeDiscount: { $avg: '$totalBeforeDiscount' },
          avgRevenueAfterDiscount: { $avg: '$totalAfterDiscount' },
          
          // Orders untuk detail
          discountOrders: {
            $push: {
              orderId: '$order_id',
              orderDate: '$createdAtWIB',
              customer: '$user',
              totalBeforeDiscount: '$totalBeforeDiscount',
              totalAfterDiscount: '$totalAfterDiscount',
              discounts: {
                autoPromo: { $ifNull: ['$discounts.autoPromoDiscount', 0] },
                manual: { $ifNull: ['$discounts.manualDiscount', 0] },
                voucher: { $ifNull: ['$discounts.voucherDiscount', 0] },
                total: '$totalDiscount'
              },
              discountPercentage: '$discountPercentage',
              hasDiscount: '$hasDiscount'
            }
          },
          
          // Untuk trend analysis
          minDiscount: { $min: '$totalDiscount' },
          maxDiscount: { $max: '$totalDiscount' }
        }
      },

      // Stage 4: Project untuk format response (DIPERBAIKI)
      {
        $project: {
          _id: 0,
          summary: {
            totalOrders: 1,
            ordersWithDiscount: 1,
            ordersWithoutDiscount: {
              $subtract: ['$totalOrders', '$ordersWithDiscount']
            },
            discountPenetrationRate: {
              $cond: {
                if: { $eq: ['$totalOrders', 0] },
                then: 0,
                else: {
                  $round: [{
                    $multiply: [
                      { $divide: ['$ordersWithDiscount', '$totalOrders'] },
                      100
                    ]
                  }, 2]
                }
              }
            },
            totalRevenueBeforeDiscount: {
              $round: ['$totalRevenueBeforeDiscount', 2]
            },
            totalRevenueAfterDiscount: {
              $round: ['$totalRevenueAfterDiscount', 2]
            },
            totalDiscountAmount: {
              $round: ['$totalDiscountAmount', 2]
            },
            discountPercentageOfRevenue: {
              $cond: {
                if: { $eq: ['$totalRevenueBeforeDiscount', 0] },
                then: 0,
                else: {
                  $round: [{
                    $multiply: [
                      {
                        $divide: ['$totalDiscountAmount', '$totalRevenueBeforeDiscount']
                      },
                      100
                    ]
                  }, 2]
                }
              }
            },
            avgDiscountPerOrder: {
              $round: ['$avgDiscountPerOrder', 2]
            },
            avgDiscountPercentage: {
              $round: ['$avgDiscountPercentage', 2]
            },
            avgRevenueBeforeDiscount: {
              $round: ['$avgRevenueBeforeDiscount', 2]
            },
            avgRevenueAfterDiscount: {
              $round: ['$avgRevenueAfterDiscount', 2]
            },
            minDiscount: { $round: ['$minDiscount', 2] },
            maxDiscount: { $round: ['$maxDiscount', 2] }
          },
          breakdown: {
            autoPromo: {
              totalAmount: { $round: ['$autoPromoDiscount', 2] },
              orderCount: '$autoPromoOrders',
              percentageOfTotalDiscount: {
                $cond: {
                  if: { $eq: ['$totalDiscountAmount', 0] },
                  then: 0,
                  else: {
                    $round: [{
                      $multiply: [
                        { $divide: ['$autoPromoDiscount', '$totalDiscountAmount'] },
                        100
                      ]
                    }, 2]
                  }
                }
              },
              avgDiscountPerOrder: {
                $cond: {
                  if: { $eq: ['$autoPromoOrders', 0] },
                  then: 0,
                  else: {
                    $round: [{
                      $divide: ['$autoPromoDiscount', '$autoPromoOrders']
                    }, 2]
                  }
                }
              }
            },
            manual: {
              totalAmount: { $round: ['$manualDiscount', 2] },
              orderCount: '$manualPromoOrders',
              percentageOfTotalDiscount: {
                $cond: {
                  if: { $eq: ['$totalDiscountAmount', 0] },
                  then: 0,
                  else: {
                    $round: [{
                      $multiply: [
                        { $divide: ['$manualDiscount', '$totalDiscountAmount'] },
                        100
                      ]
                    }, 2]
                  }
                }
              },
              avgDiscountPerOrder: {
                $cond: {
                  if: { $eq: ['$manualPromoOrders', 0] },
                  then: 0,
                  else: {
                    $round: [{
                      $divide: ['$manualDiscount', '$manualPromoOrders']
                    }, 2]
                  }
                }
              }
            },
            voucher: {
              totalAmount: { $round: ['$voucherDiscount', 2] },
              orderCount: '$voucherOrders',
              percentageOfTotalDiscount: {
                $cond: {
                  if: { $eq: ['$totalDiscountAmount', 0] },
                  then: 0,
                  else: {
                    $round: [{
                      $multiply: [
                        { $divide: ['$voucherDiscount', '$totalDiscountAmount'] },
                        100
                      ]
                    }, 2]
                  }
                }
              },
              avgDiscountPerOrder: {
                $cond: {
                  if: { $eq: ['$voucherOrders', 0] },
                  then: 0,
                  else: {
                    $round: [{
                      $divide: ['$voucherDiscount', '$voucherOrders']
                    }, 2]
                  }
                }
              }
            }
          },
          detailedOrders: {
            $slice: [
              {
                $sortArray: {
                  input: '$discountOrders',
                  sortBy: { 'discounts.total': -1 }
                }
              },
              100
            ]
          }
        }
      }
    ];

    // Execute aggregation
    const result = await Order.aggregate(aggregationPipeline);
    
    // Default report jika tidak ada data
    const defaultReport = {
      summary: {
        totalOrders: 0,
        ordersWithDiscount: 0,
        ordersWithoutDiscount: 0,
        discountPenetrationRate: 0,
        totalRevenueBeforeDiscount: 0,
        totalRevenueAfterDiscount: 0,
        totalDiscountAmount: 0,
        discountPercentageOfRevenue: 0,
        avgDiscountPerOrder: 0,
        avgDiscountPercentage: 0,
        avgRevenueBeforeDiscount: 0,
        avgRevenueAfterDiscount: 0,
        minDiscount: 0,
        maxDiscount: 0
      },
      breakdown: {
        autoPromo: {
          totalAmount: 0,
          orderCount: 0,
          percentageOfTotalDiscount: 0,
          avgDiscountPerOrder: 0
        },
        manual: {
          totalAmount: 0,
          orderCount: 0,
          percentageOfTotalDiscount: 0,
          avgDiscountPerOrder: 0
        },
        voucher: {
          totalAmount: 0,
          orderCount: 0,
          percentageOfTotalDiscount: 0,
          avgDiscountPerOrder: 0
        }
      },
      detailedOrders: []
    };

    const report = result[0] || defaultReport;

    // Tambahkan analytics tambahan
    const analytics = {
      discountEffectiveness: calculateDiscountEffectiveness(report),
      recommendation: generateDiscountRecommendation(report)
    };

    res.status(200).json({
      success: true,
      data: {
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        },
        filters: {
          outletId,
          discountType: discountType || 'all'
        },
        report,
        analytics
      }
    });

  } catch (error) {
    console.error('Error in getDiscountUsageReport:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Helper function untuk menghitung efektivitas diskon
const calculateDiscountEffectiveness = (report) => {
  const { summary, breakdown } = report;
  
  if (summary.totalOrders === 0) {
    return {
      effectiveness: 0,
      grade: 'N/A',
      description: 'Tidak ada data yang cukup'
    };
  }

  // Hitung effectiveness score (0-100)
  const penetrationScore = summary.discountPenetrationRate;
  const revenueImpactScore = 100 - summary.discountPercentageOfRevenue;
  const avgDiscountScore = Math.max(0, 100 - (summary.avgDiscountPercentage || 0) * 2);

  const effectiveness = Math.round(
    (penetrationScore + revenueImpactScore + avgDiscountScore) / 3
  );

  // Tentukan grade
  let grade, description;
  if (effectiveness >= 80) {
    grade = 'Excellent';
    description = 'Penggunaan diskon sangat efektif';
  } else if (effectiveness >= 60) {
    grade = 'Good';
    description = 'Penggunaan diskon cukup efektif';
  } else if (effectiveness >= 40) {
    grade = 'Fair';
    description = 'Penggunaan diskon perlu perbaikan';
  } else {
    grade = 'Poor';
    description = 'Penggunaan diskon tidak efektif';
  }

  return {
    effectiveness,
    grade,
    description,
    metrics: {
      penetrationScore,
      revenueImpactScore,
      avgDiscountScore
    }
  };
};

// Helper function untuk generate recommendation
const generateDiscountRecommendation = (report) => {
  const { summary, breakdown } = report;
  
  const recommendations = [];
  
  if (summary.totalOrders === 0) {
    return recommendations;
  }

  // Analisis berdasarkan penetration rate
  if (summary.discountPenetrationRate < 20) {
    recommendations.push({
      type: 'penetration',
      priority: 'high',
      message: 'Tingkat penggunaan diskon sangat rendah. Pertimbangkan untuk meningkatkan promosi.',
      suggestion: 'Lakukan kampanye promosi untuk meningkatkan awareness diskon'
    });
  } else if (summary.discountPenetrationRate > 60) {
    recommendations.push({
      type: 'penetration',
      priority: 'medium',
      message: 'Tingkat penggunaan diskon sangat tinggi. Perhatikan dampak terhadap profit margin.',
      suggestion: 'Evaluasi profitabilitas order dengan diskon tinggi'
    });
  }

  // Analisis berdasarkan discount percentage of revenue
  if (summary.discountPercentageOfRevenue > 10) {
    recommendations.push({
      type: 'revenue_impact',
      priority: 'high',
      message: 'Dampak diskon terhadap revenue terlalu tinggi.',
      suggestion: 'Review diskon-diskon besar dan pertimbangkan untuk membatasi maksimal discount'
    });
  }

  // Analisis breakdown per jenis diskon
  const sortedBreakdown = Object.entries(breakdown)
    .map(([type, data]) => ({ type, ...data }))
    .sort((a, b) => b.percentageOfTotalDiscount - a.percentageOfTotalDiscount);

  if (sortedBreakdown.length > 0) {
    const highest = sortedBreakdown[0];
    recommendations.push({
      type: 'discount_type',
      priority: 'medium',
      message: `${highest.type} memberikan kontribusi diskon terbesar (${highest.percentageOfTotalDiscount}%)`,
      suggestion: `Evaluasi efektivitas ${highest.type} programs`
    });
  }

  return recommendations;
};

/**
 * @desc    Get Commission Loss Report due to Discounts
 * @route   GET /api/reports/commission-loss
 * @access  Private (Admin/Manager)
 */
export const getCommissionLossReport = async (req, res) => {
  try {
    const { startDate, endDate, outletId } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const matchConditions = {
      createdAtWIB: { $gte: start, $lte: end },
      status: 'Completed',
      ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) })
    };

    // Aggregation untuk commission loss
    const aggregationPipeline = [
      { $match: matchConditions },

      // Filter hanya orders dengan discount
      {
        $match: {
          $or: [
            { 'discounts.autoPromoDiscount': { $gt: 0 } },
            { 'discounts.manualDiscount': { $gt: 0 } },
            { 'discounts.voucherDiscount': { $gt: 0 } }
          ]
        }
      },

      // Hitung commission loss (asumsi 10% dari discount amount)
      {
        $addFields: {
          totalDiscount: {
            $add: [
              { $ifNull: ['$discounts.autoPromoDiscount', 0] },
              { $ifNull: ['$discounts.manualDiscount', 0] },
              { $ifNull: ['$discounts.voucherDiscount', 0] }
            ]
          },
          commissionLoss: {
            $multiply: [
              {
                $add: [
                  { $ifNull: ['$discounts.autoPromoDiscount', 0] },
                  { $ifNull: ['$discounts.manualDiscount', 0] },
                  { $ifNull: ['$discounts.voucherDiscount', 0] }
                ]
              },
              0.1 // 10% commission rate
            ]
          }
        }
      },

      // Group untuk summary
      {
        $group: {
          _id: null,
          totalOrdersWithDiscount: { $sum: 1 },
          totalDiscountAmount: { $sum: '$totalDiscount' },
          totalCommissionLoss: { $sum: '$commissionLoss' },
          totalRevenueBeforeDiscount: { $sum: '$totalBeforeDiscount' },
          totalRevenueAfterDiscount: { $sum: '$totalAfterDiscount' },
          
          // Breakdown by discount type
          autoPromoDiscount: { $sum: { $ifNull: ['$discounts.autoPromoDiscount', 0] } },
          manualDiscount: { $sum: { $ifNull: ['$discounts.manualDiscount', 0] } },
          voucherDiscount: { $sum: { $ifNull: ['$discounts.voucherDiscount', 0] } },
          
          autoPromoCommissionLoss: {
            $sum: { $multiply: [{ $ifNull: ['$discounts.autoPromoDiscount', 0] }, 0.1] }
          },
          manualCommissionLoss: {
            $sum: { $multiply: [{ $ifNull: ['$discounts.manualDiscount', 0] }, 0.1] }
          },
          voucherCommissionLoss: {
            $sum: { $multiply: [{ $ifNull: ['$discounts.voucherDiscount', 0] }, 0.1] }
          },
          
          // Average metrics
          avgDiscountPerOrder: { $avg: '$totalDiscount' },
          avgCommissionLossPerOrder: { $avg: '$commissionLoss' },
          
          // Detailed orders
          orders: {
            $push: {
              orderId: '$order_id',
              orderDate: '$createdAtWIB',
              customer: '$user',
              cashier: '$cashierId',
              totalBeforeDiscount: '$totalBeforeDiscount',
              totalDiscount: '$totalDiscount',
              commissionLoss: '$commissionLoss',
              discountBreakdown: {
                autoPromo: { $ifNull: ['$discounts.autoPromoDiscount', 0] },
                manual: { $ifNull: ['$discounts.manualDiscount', 0] },
                voucher: { $ifNull: ['$discounts.voucherDiscount', 0] }
              },
              commissionLossPercentage: {
                $cond: {
                  if: { $eq: ['$totalBeforeDiscount', 0] },
                  then: 0,
                  else: {
                    $multiply: [
                      { $divide: ['$commissionLoss', '$totalBeforeDiscount'] },
                      100
                    ]
                  }
                }
              }
            }
          }
        }
      },

      // Project untuk response
      {
        $project: {
          _id: 0,
          summary: {
            totalOrdersWithDiscount: 1,
            totalDiscountAmount: { $round: ['$totalDiscountAmount', 2] },
            totalCommissionLoss: { $round: ['$totalCommissionLoss', 2] },
            totalRevenueBeforeDiscount: { $round: ['$totalRevenueBeforeDiscount', 2] },
            totalRevenueAfterDiscount: { $round: ['$totalRevenueAfterDiscount', 2] },
            avgDiscountPerOrder: { $round: ['$avgDiscountPerOrder', 2] },
            avgCommissionLossPerOrder: { $round: ['$avgCommissionLossPerOrder', 2] },
            commissionLossPercentage: {
              $cond: {
                if: { $eq: ['$totalRevenueBeforeDiscount', 0] },
                then: 0,
                else: {
                  $round: [{
                    $multiply: [
                      { $divide: ['$totalCommissionLoss', '$totalRevenueBeforeDiscount'] },
                      100
                    ]
                  }, 2]
                }
              }
            }
          },
          breakdown: {
            autoPromo: {
              discountAmount: { $round: ['$autoPromoDiscount', 2] },
              commissionLoss: { $round: ['$autoPromoCommissionLoss', 2] },
              percentageOfTotal: {
                $cond: {
                  if: { $eq: ['$totalCommissionLoss', 0] },
                  then: 0,
                  else: {
                    $round: [{
                      $multiply: [
                        { $divide: ['$autoPromoCommissionLoss', '$totalCommissionLoss'] },
                        100
                      ]
                    }, 2]
                  }
                }
              }
            },
            manual: {
              discountAmount: { $round: ['$manualDiscount', 2] },
              commissionLoss: { $round: ['$manualCommissionLoss', 2] },
              percentageOfTotal: {
                $cond: {
                  if: { $eq: ['$totalCommissionLoss', 0] },
                  then: 0,
                  else: {
                    $round: [{
                      $multiply: [
                        { $divide: ['$manualCommissionLoss', '$totalCommissionLoss'] },
                        100
                      ]
                    }, 2]
                  }
                }
              }
            },
            voucher: {
              discountAmount: { $round: ['$voucherDiscount', 2] },
              commissionLoss: { $round: ['$voucherCommissionLoss', 2] },
              percentageOfTotal: {
                $cond: {
                  if: { $eq: ['$totalCommissionLoss', 0] },
                  then: 0,
                  else: {
                    $round: [{
                      $multiply: [
                        { $divide: ['$voucherCommissionLoss', '$totalCommissionLoss'] },
                        100
                      ]
                    }, 2]
                  }
                }
              }
            }
          },
          topOrdersByLoss: {
            $slice: [{
              $sortArray: {
                input: '$orders',
                sortBy: { commissionLoss: -1 }
              }
            }, 10]
          }
        }
      }
    ];

    const result = await Order.aggregate(aggregationPipeline);
    const report = result[0] || {
      summary: {
        totalOrdersWithDiscount: 0,
        totalDiscountAmount: 0,
        totalCommissionLoss: 0,
        totalRevenueBeforeDiscount: 0,
        totalRevenueAfterDiscount: 0,
        avgDiscountPerOrder: 0,
        avgCommissionLossPerOrder: 0,
        commissionLossPercentage: 0
      },
      breakdown: {
        autoPromo: { discountAmount: 0, commissionLoss: 0, percentageOfTotal: 0 },
        manual: { discountAmount: 0, commissionLoss: 0, percentageOfTotal: 0 },
        voucher: { discountAmount: 0, commissionLoss: 0, percentageOfTotal: 0 }
      },
      topOrdersByLoss: []
    };

    res.status(200).json({
      success: true,
      data: {
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        ...report
      }
    });

  } catch (error) {
    console.error('Error in getCommissionLossReport:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get Daily Profit & Loss Report
 * @route   GET /api/reports/profit-loss/daily
 * @access  Private (Admin/Manager)
 */
export const getDailyProfitLossReport = async (req, res) => {
  try {
    const { date, outletId } = req.query;
    
    let start, end;
    
    if (date) {
      // Use specific date
      start = new Date(date);
      end = new Date(date);
    } else {
      // Default to yesterday
      start = new Date();
      start.setDate(start.getDate() - 1);
      end = new Date(start);
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const report = await generateProfitLossReportForPeriod(start, end, outletId, 'daily');
    
    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error in getDailyProfitLossReport:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get Weekly Profit & Loss Report
 * @route   GET /api/reports/profit-loss/weekly
 * @access  Private (Admin/Manager)
 */
export const getWeeklyProfitLossReport = async (req, res) => {
  try {
    const { weekStart, outletId } = req.query;
    
    let start, end;
    
    if (weekStart) {
      start = new Date(weekStart);
    } else {
      // Default to current week
      start = new Date();
      start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
    }
    
    end = new Date(start);
    end.setDate(end.getDate() + 6); // End of week (Saturday)
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const report = await generateProfitLossReportForPeriod(start, end, outletId, 'weekly');
    
    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error in getWeeklyProfitLossReport:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get Monthly Profit & Loss Report
 * @route   GET /api/reports/profit-loss/monthly
 * @access  Private (Admin/Manager)
 */
export const getMonthlyProfitLossReport = async (req, res) => {
  try {
    const { year, month, outletId } = req.query;
    
    let start, end;
    
    if (year && month) {
      start = new Date(year, month - 1, 1);
    } else {
      // Default to current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // Last day of month
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const report = await generateProfitLossReportForPeriod(start, end, outletId, 'monthly');
    
    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error in getMonthlyProfitLossReport:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Export Profit & Loss Report to Excel/CSV
 * @route   GET /api/reports/profit-loss/export
 * @access  Private (Admin/Manager)
 */
export const exportProfitLossReport = async (req, res) => {
  try {
    const { startDate, endDate, outletId, format = 'csv' } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const report = await generateProfitLossReportForPeriod(start, end, outletId, 'daily');

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'Date', 'Total Orders', 'Revenue Before Discount', 'Revenue After Discount',
        'Total Discounts', 'Total Tax', 'Total Service Fee', 'Gross Revenue',
        'Net Revenue', 'Estimated Cost', 'Gross Profit', 'Net Profit',
        'Gross Profit Margin %', 'Net Profit Margin %', 'Lost Commission'
      ];

      const csvData = report.periodBreakdown.map(period => [
        period.period,
        period.summary.totalOrders,
        period.summary.totalRevenueBeforeDiscount,
        period.summary.totalRevenueAfterDiscount,
        period.summary.totalDiscounts,
        period.summary.totalTax,
        period.summary.totalServiceFee,
        period.summary.totalGrossRevenue,
        period.summary.totalNetRevenue,
        period.summary.totalEstimatedCost,
        period.summary.totalGrossProfit,
        period.summary.totalNetProfit,
        period.summary.overallGrossProfitMargin,
        period.summary.overallNetProfitMargin,
        period.summary.totalLostCommission
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=profit-loss-report-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.csv`);
      return res.send(csvContent);
    }

    // Return JSON as default
    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error in exportProfitLossReport:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper Functions
/**
 * Generate profit loss report for a specific period
 */
const generateProfitLossReportForPeriod = async (start, end, outletId, groupBy) => {
  const matchConditions = {
    createdAtWIB: { $gte: start, $lte: end },
    status: 'Completed',
    ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) })
  };

  const aggregationPipeline = [
    { $match: matchConditions },
    {
      $group: {
        _id: {
          $dateToString: {
            format: getDateFormat(groupBy),
            date: '$createdAtWIB'
          }
        },
        totalOrders: { $sum: 1 },
        totalRevenueBeforeDiscount: { $sum: '$totalBeforeDiscount' },
        totalRevenueAfterDiscount: { $sum: '$totalAfterDiscount' },
        totalDiscounts: {
          $sum: {
            $add: [
              { $ifNull: ['$discounts.autoPromoDiscount', 0] },
              { $ifNull: ['$discounts.manualDiscount', 0] },
              { $ifNull: ['$discounts.voucherDiscount', 0] }
            ]
          }
        },
        totalTax: { $sum: { $ifNull: ['$totalTax', 0] } },
        totalServiceFee: { $sum: { $ifNull: ['$totalServiceFee', 0] } },
        totalGrossRevenue: { $sum: '$totalAfterDiscount' },
        totalNetRevenue: {
          $sum: {
            $add: [
              '$totalAfterDiscount',
              { $ifNull: ['$totalTax', 0] },
              { $ifNull: ['$totalServiceFee', 0] }
            ]
          }
        },
        totalEstimatedCost: {
          $sum: { $multiply: ['$totalBeforeDiscount', 0.4] }
        },
        totalGrossProfit: {
          $sum: {
            $subtract: [
              '$totalAfterDiscount',
              { $multiply: ['$totalBeforeDiscount', 0.4] }
            ]
          }
        },
        totalNetProfit: {
          $sum: {
            $subtract: [
              {
                $add: [
                  '$totalAfterDiscount',
                  { $ifNull: ['$totalTax', 0] },
                  { $ifNull: ['$totalServiceFee', 0] }
                ]
              },
              { $multiply: ['$totalBeforeDiscount', 0.4] }
            ]
          }
        },
        totalLostCommission: {
          $sum: {
            $multiply: [
              {
                $add: [
                  { $ifNull: ['$discounts.autoPromoDiscount', 0] },
                  { $ifNull: ['$discounts.manualDiscount', 0] },
                  { $ifNull: ['$discounts.voucherDiscount', 0] }
                ]
              },
              0.1
            ]
          }
        }
      }
    },
    {
      $addFields: {
        period: '$_id',
        grossProfitMargin: {
          $cond: {
            if: { $eq: ['$totalGrossRevenue', 0] },
            then: 0,
            else: {
              $multiply: [
                { $divide: ['$totalGrossProfit', '$totalGrossRevenue'] },
                100
              ]
            }
          }
        },
        netProfitMargin: {
          $cond: {
            if: { $eq: ['$totalGrossRevenue', 0] },
            then: 0,
            else: {
              $multiply: [
                { $divide: ['$totalNetProfit', '$totalGrossRevenue'] },
                100
              ]
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        period: 1,
        summary: {
          totalOrders: 1,
          totalRevenueBeforeDiscount: { $round: ['$totalRevenueBeforeDiscount', 2] },
          totalRevenueAfterDiscount: { $round: ['$totalRevenueAfterDiscount', 2] },
          totalDiscounts: { $round: ['$totalDiscounts', 2] },
          totalTax: { $round: ['$totalTax', 2] },
          totalServiceFee: { $round: ['$totalServiceFee', 2] },
          totalGrossRevenue: { $round: ['$totalGrossRevenue', 2] },
          totalNetRevenue: { $round: ['$totalNetRevenue', 2] },
          totalEstimatedCost: { $round: ['$totalEstimatedCost', 2] },
          totalGrossProfit: { $round: ['$totalGrossProfit', 2] },
          totalNetProfit: { $round: ['$totalNetProfit', 2] },
          totalLostCommission: { $round: ['$totalLostCommission', 2] },
          overallGrossProfitMargin: { $round: ['$grossProfitMargin', 2] },
          overallNetProfitMargin: { $round: ['$netProfitMargin', 2] }
        }
      }
    },
    { $sort: { period: 1 } }
  ];

  const periodBreakdown = await Order.aggregate(aggregationPipeline);

  // Calculate overall summary
  const overallSummary = periodBreakdown.reduce((summary, period) => {
    summary.totalOrders += period.summary.totalOrders;
    summary.totalRevenueBeforeDiscount += period.summary.totalRevenueBeforeDiscount;
    summary.totalRevenueAfterDiscount += period.summary.totalRevenueAfterDiscount;
    summary.totalDiscounts += period.summary.totalDiscounts;
    summary.totalTax += period.summary.totalTax;
    summary.totalServiceFee += period.summary.totalServiceFee;
    summary.totalGrossRevenue += period.summary.totalGrossRevenue;
    summary.totalNetRevenue += period.summary.totalNetRevenue;
    summary.totalEstimatedCost += period.summary.totalEstimatedCost;
    summary.totalGrossProfit += period.summary.totalGrossProfit;
    summary.totalNetProfit += period.summary.totalNetProfit;
    summary.totalLostCommission += period.summary.totalLostCommission;
    return summary;
  }, {
    totalOrders: 0,
    totalRevenueBeforeDiscount: 0,
    totalRevenueAfterDiscount: 0,
    totalDiscounts: 0,
    totalTax: 0,
    totalServiceFee: 0,
    totalGrossRevenue: 0,
    totalNetRevenue: 0,
    totalEstimatedCost: 0,
    totalGrossProfit: 0,
    totalNetProfit: 0,
    totalLostCommission: 0
  });

  // Calculate overall percentages
  if (overallSummary.totalRevenueBeforeDiscount > 0) {
    overallSummary.discountImpactPercentage =
      (overallSummary.totalDiscounts / overallSummary.totalRevenueBeforeDiscount) * 100;
    overallSummary.commissionLossPercentage =
      (overallSummary.totalLostCommission / overallSummary.totalRevenueBeforeDiscount) * 100;
  } else {
    overallSummary.discountImpactPercentage = 0;
    overallSummary.commissionLossPercentage = 0;
  }

  if (overallSummary.totalGrossRevenue > 0) {
    overallSummary.overallGrossProfitMargin =
      (overallSummary.totalGrossProfit / overallSummary.totalGrossRevenue) * 100;
    overallSummary.overallNetProfitMargin =
      (overallSummary.totalNetProfit / overallSummary.totalGrossRevenue) * 100;
  } else {
    overallSummary.overallGrossProfitMargin = 0;
    overallSummary.overallNetProfitMargin = 0;
  }

  // Round all numbers
  Object.keys(overallSummary).forEach(key => {
    if (typeof overallSummary[key] === 'number') {
      overallSummary[key] = Math.round(overallSummary[key] * 100) / 100;
    }
  });

  return {
    period: {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      groupBy,
      totalPeriods: periodBreakdown.length
    },
    overallSummary,
    periodBreakdown,
    metrics: {
      kpis: {
        netProfitMargin: overallSummary.overallNetProfitMargin,
        grossProfitMargin: overallSummary.overallGrossProfitMargin,
        avgOrderValue: periodBreakdown.length > 0 ?
          periodBreakdown.reduce((sum, p) => sum + p.summary.totalGrossRevenue / p.summary.totalOrders, 0) / periodBreakdown.length : 0,
        discountImpact: overallSummary.discountImpactPercentage,
        commissionLoss: overallSummary.commissionLossPercentage
      },
      trends: analyzeProfitTrends(periodBreakdown)
    }
  };
};

/**
 * Get date format string based on grouping
 */
const getDateFormat = (groupBy) => {
  switch (groupBy) {
    case 'daily':
      return '%Y-%m-%d';
    case 'weekly':
      return '%Y-W%V';
    case 'monthly':
      return '%Y-%m';
    default:
      return '%Y-%m-%d';
  }
};

/**
 * Analyze profit trends from period breakdown
 */
const analyzeProfitTrends = (periodBreakdown) => {
  if (periodBreakdown.length < 2) {
    return {
      hasEnoughData: false,
      message: 'Not enough data for trend analysis'
    };
  }

  const periods = periodBreakdown.map(p => p.period);
  const netProfits = periodBreakdown.map(p => p.summary.totalNetProfit);
  const grossProfits = periodBreakdown.map(p => p.summary.totalGrossProfit);
  const revenues = periodBreakdown.map(p => p.summary.totalGrossRevenue);

  // Calculate trends
  const netProfitTrend = calculateTrend(netProfits);
  const grossProfitTrend = calculateTrend(grossProfits);
  const revenueTrend = calculateTrend(revenues);

  // Find best and worst performing periods
  const bestPeriod = periodBreakdown.reduce((best, current) => 
    current.summary.totalNetProfit > best.summary.totalNetProfit ? current : best
  );
  
  const worstPeriod = periodBreakdown.reduce((worst, current) => 
    current.summary.totalNetProfit < worst.summary.totalNetProfit ? current : worst
  );

  return {
    hasEnoughData: true,
    netProfitTrend,
    grossProfitTrend,
    revenueTrend,
    bestPeriod: {
      period: bestPeriod.period,
      netProfit: bestPeriod.summary.totalNetProfit,
      margin: bestPeriod.summary.overallNetProfitMargin
    },
    worstPeriod: {
      period: worstPeriod.period,
      netProfit: worstPeriod.summary.totalNetProfit,
      margin: worstPeriod.summary.overallNetProfitMargin
    },
    averageNetProfit: netProfits.reduce((a, b) => a + b, 0) / netProfits.length,
    averageGrossProfit: grossProfits.reduce((a, b) => a + b, 0) / grossProfits.length,
    averageRevenue: revenues.reduce((a, b) => a + b, 0) / revenues.length,
    volatility: calculateVolatility(netProfits)
  };
};

/**
 * Calculate trend (positive/negative/stable)
 */
const calculateTrend = (values) => {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const percentageChange = ((avgSecond - avgFirst) / Math.abs(avgFirst)) * 100;
  
  if (percentageChange > 5) return 'positive';
  if (percentageChange < -5) return 'negative';
  return 'stable';
};

/**
 * Calculate volatility (standard deviation)
 */
const calculateVolatility = (values) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
};