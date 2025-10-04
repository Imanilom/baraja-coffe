import { Order } from '../models/order.model.js';
import Promo from '../models/Promo.model.js';
import Voucher from '../models/voucher.model.js';
import AutoPromo from '../models/AutoPromo.model.js';
import User from '../models/user.model.js';
import {Outlet} from '../models/Outlet.model.js'; // Pastikan model Outlet diimport
import LoyaltyLevel from '../models/LoyaltyLevel.model.js'; // Pastikan model LoyaltyLevel diimport

/**
 * Controller untuk Promo & Voucher Analytics dengan populate lengkap
 */
const AnalyticsController = {

  /**
   * 1. Promo Usage (berapa kali dipakai, total diskon, total revenue)
   */
  async promoUsage(req, res) {
    try {
      const data = await Order.aggregate([
        { $match: { appliedPromos: { $ne: null } } },
        { $unwind: "$appliedPromos" },
        {
          $group: {
            _id: "$appliedPromos",
            totalOrders: { $sum: 1 },
            totalDiscount: { $sum: "$discounts.autoPromoDiscount" },
            totalRevenue: { $sum: "$grandTotal" },
            avgOrderValue: { $avg: "$grandTotal" }
          }
        },
        {
          $lookup: {
            from: "promos",
            localField: "_id",
            foreignField: "_id",
            as: "promo"
          }
        },
        { $unwind: { path: "$promo", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "outlets",
            localField: "promo.outlet",
            foreignField: "_id",
            as: "outlets"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "promo.createdBy",
            foreignField: "_id",
            as: "creator"
          }
        },
        {
          $project: {
            promoId: "$promo._id",
            name: "$promo.name",
            discountAmount: "$promo.discountAmount",
            discountType: "$promo.discountType",
            customerType: "$promo.customerType",
            validFrom: "$promo.validFrom",
            validTo: "$promo.validTo",
            isActive: "$promo.isActive",
            outlets: {
              $map: {
                input: "$outlets",
                as: "outlet",
                in: {
                  outletId: "$$outlet._id",
                  outletName: "$$outlet.name"
                }
              }
            },
            createdBy: {
              $cond: {
                if: { $gt: [{ $size: "$creator" }, 0] },
                then: { 
                  userId: { $arrayElemAt: ["$creator._id", 0] },
                  username: { $arrayElemAt: ["$creator.username", 0] }
                },
                else: null
              }
            },
            totalOrders: 1,
            totalDiscount: 1,
            totalRevenue: 1,
            avgOrderValue: 1,
            discountEffectiveness: {
              $cond: [
                { $eq: ["$totalRevenue", 0] },
                0,
                { $multiply: [{ $divide: ["$totalDiscount", "$totalRevenue"] }, 100] }
              ]
            }
          }
        }
      ]);

      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 2. Voucher Usage & Redemption Rate dengan populate lengkap
   */
  async voucherUsage(req, res) {
    try {
      const data = await Voucher.aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "appliedVoucher",
            as: "usedOrders"
          }
        },
        {
          $lookup: {
            from: "outlets",
            localField: "applicableOutlets",
            foreignField: "_id",
            as: "applicableOutlets"
          }
        },
        {
          $project: {
            voucherId: "$_id",
            code: 1,
            name: 1,
            description: 1,
            discountAmount: 1,
            discountType: 1,
            validFrom: 1,
            validTo: 1,
            quota: 1,
            customerType: 1,
            printOnReceipt: 1,
            isActive: 1,
            applicableOutlets: {
              $map: {
                input: "$applicableOutlets",
                as: "outlet",
                in: {
                  outletId: "$$outlet._id",
                  outletName: "$$outlet.name"
                }
              }
            },
            usedCount: { $size: "$usedOrders" },
            remainingQuota: { $subtract: ["$quota", { $size: "$usedOrders" }] },
            totalDiscount: {
              $sum: "$usedOrders.discounts.voucherDiscount"
            },
            totalRevenue: {
              $sum: "$usedOrders.grandTotal"
            },
            avgOrderValue: {
              $cond: [
                { $gt: [{ $size: "$usedOrders" }, 0] },
                { $divide: [{ $sum: "$usedOrders.grandTotal" }, { $size: "$usedOrders" }] },
                0
              ]
            },
            redemptionRate: {
              $cond: [
                { $eq: ["$quota", 0] },
                0,
                { $multiply: [{ $divide: [{ $size: "$usedOrders" }, "$quota"] }, 100] }
              ]
            }
          }
        }
      ]);

      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 3. Revenue Impact (sebelum & sesudah diskon) dengan breakdown
   */
  async revenueImpact(req, res) {
    try {
      const data = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalBeforeDiscount: { $sum: "$totalBeforeDiscount" },
            totalAfterDiscount: { $sum: "$totalAfterDiscount" },
            totalGrand: { $sum: "$grandTotal" },
            totalVoucherDiscount: { $sum: "$discounts.voucherDiscount" },
            totalAutoPromoDiscount: { $sum: "$discounts.autoPromoDiscount" },
            totalManualDiscount: { $sum: "$discounts.manualDiscount" },
            totalTax: { $sum: "$totalTax" },
            totalServiceFee: { $sum: "$totalServiceFee" },
            totalOrders: { $sum: 1 }
          }
        },
        {
          $project: {
            totalBeforeDiscount: 1,
            totalAfterDiscount: 1,
            totalGrand: 1,
            totalDiscount: {
              $add: [
                "$totalVoucherDiscount",
                "$totalAutoPromoDiscount",
                "$totalManualDiscount"
              ]
            },
            totalVoucherDiscount: 1,
            totalAutoPromoDiscount: 1,
            totalManualDiscount: 1,
            totalTax: 1,
            totalServiceFee: 1,
            totalOrders: 1,
            discountRate: {
              $multiply: [
                { $divide: [
                  { $add: ["$totalVoucherDiscount", "$totalAutoPromoDiscount", "$totalManualDiscount"] },
                  "$totalBeforeDiscount"
                ] },
                100
              ]
            },
            avgOrderValue: { $divide: ["$totalGrand", "$totalOrders"] }
          }
        }
      ]);

      res.json({ success: true, data: data[0] || {} });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 4. Customer Segmentation dengan populate lengkap
   */
  async customerSegmentation(req, res) {
    try {
      const segments = await Order.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "loyaltylevels",
            localField: "user.loyaltyLevel",
            foreignField: "_id",
            as: "loyaltyLevel"
          }
        },
        {
          $lookup: {
            from: "roles",
            localField: "user.role",
            foreignField: "_id",
            as: "role"
          }
        },
        {
          $group: {
            _id: "$user_id",
            customerInfo: {
              $first: {
                userId: "$user._id",
                username: "$user.username",
                email: "$user.email",
                phone: "$user.phone",
                role: { $arrayElemAt: ["$role.name", 0] },
                loyaltyLevel: { 
                  $cond: {
                    if: { $gt: [{ $size: "$loyaltyLevel" }, 0] },
                    then: { 
                      levelName: { $arrayElemAt: ["$loyaltyLevel.name", 0] },
                      levelId: { $arrayElemAt: ["$loyaltyLevel._id", 0] }
                    },
                    else: null
                  }
                },
                loyaltyPoints: "$user.loyaltyPoints",
                profilePicture: "$user.profilePicture"
              }
            },
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$grandTotal" },
            avgOrderValue: { $avg: "$grandTotal" },
            promoUsageCount: { 
              $sum: { $cond: [{ $ne: ["$appliedPromos", null] }, 1, 0] }
            },
            voucherUsageCount: {
              $sum: { $cond: [{ $ne: ["$appliedVoucher", null] }, 1, 0] }
            },
            totalDiscountUsed: {
              $sum: {
                $add: [
                  "$discounts.autoPromoDiscount",
                  "$discounts.voucherDiscount"
                ]
              }
            },
            firstOrderDate: { $min: "$createdAt" },
            lastOrderDate: { $max: "$createdAt" }
          }
        },
      {
        $bucket: {
            groupBy: "$totalSpent",
            boundaries: [0, 500000, 1000000, 5000000, 10000000],
            default: "VIP",
            output: {
            segmentName: { $first: "$$ROOT._id" },
            count: { $sum: 1 },
            customers: { 
                $push: {
                customerInfo: "$customerInfo",
                totalSpent: "$totalSpent",
                totalOrders: "$totalOrders",
                avgOrderValue: "$avgOrderValue",
                promoUsageRate: {
                    $multiply: [{ $divide: ["$promoUsageCount", "$totalOrders"] }, 100]
                },
                voucherUsageRate: {
                    $multiply: [{ $divide: ["$voucherUsageCount", "$totalOrders"] }, 100]
                },
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
                }
                }
            },
            totalRevenue: { $sum: "$totalSpent" },
            avgOrderValue: { $avg: "$avgOrderValue" },
            avgOrdersPerCustomer: { $avg: "$totalOrders" },
            promoAdoptionRate: {
                $avg: { $divide: ["$promoUsageCount", "$totalOrders"] }
            },
            avgDiscountPerCustomer: { $avg: "$totalDiscountUsed" }
            }
        }
        },
        {
        $project: {
            segmentName: 1,
            count: 1,
            customers: 1,
            segmentMetrics: {
            totalRevenue: "$totalRevenue",
            avgOrderValue: "$avgOrderValue",
            avgOrdersPerCustomer: "$avgOrdersPerCustomer",
            promoAdoptionRate: "$promoAdoptionRate",
            avgDiscountPerCustomer: "$avgDiscountPerCustomer"
            }
        }
        }

      ]);

      res.json({ success: true, data: segments });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 5. Outlet & Source Effectiveness dengan populate lengkap
   */
  async outletAndSource(req, res) {
    try {
      const outletStats = await Order.aggregate([
        {
          $group: {
            _id: "$outlet",
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$grandTotal" },
            totalDiscount: {
              $sum: {
                $add: [
                  "$discounts.autoPromoDiscount",
                  "$discounts.manualDiscount",
                  "$discounts.voucherDiscount"
                ]
              }
            },
            promoOrders: {
              $sum: { $cond: [{ $ne: ["$appliedPromos", null] }, 1, 0] }
            },
            voucherOrders: {
              $sum: { $cond: [{ $ne: ["$appliedVoucher", null] }, 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: "outlets",
            localField: "_id",
            foreignField: "_id",
            as: "outlet"
          }
        },
        { $unwind: { path: "$outlet", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            outletId: "$_id",
            outletName: "$outlet.name",
            outletAddress: "$outlet.address",
            outletPhone: "$outlet.phone",
            totalOrders: 1,
            totalRevenue: 1,
            totalDiscount: 1,
            avgOrderValue: { $divide: ["$totalRevenue", "$totalOrders"] },
            promoAdoptionRate: {
              $multiply: [{ $divide: ["$promoOrders", "$totalOrders"] }, 100]
            },
            voucherAdoptionRate: {
              $multiply: [{ $divide: ["$voucherOrders", "$totalOrders"] }, 100]
            },
            discountRate: {
              $multiply: [{ $divide: ["$totalDiscount", "$totalRevenue"] }, 100]
            }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      const sourceStats = await Order.aggregate([
        {
          $group: {
            _id: "$source",
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$grandTotal" },
            totalDiscount: {
              $sum: {
                $add: [
                  "$discounts.autoPromoDiscount",
                  "$discounts.manualDiscount",
                  "$discounts.voucherDiscount"
                ]
              }
            },
            promoOrders: {
              $sum: { $cond: [{ $ne: ["$appliedPromos", null] }, 1, 0] }
            },
            voucherOrders: {
              $sum: { $cond: [{ $ne: ["$appliedVoucher", null] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            source: "$_id",
            totalOrders: 1,
            totalRevenue: 1,
            totalDiscount: 1,
            avgOrderValue: { $divide: ["$totalRevenue", "$totalOrders"] },
            promoAdoptionRate: {
              $multiply: [{ $divide: ["$promoOrders", "$totalOrders"] }, 100]
            },
            voucherAdoptionRate: {
              $multiply: [{ $divide: ["$voucherOrders", "$totalOrders"] }, 100]
            },
            discountRate: {
              $multiply: [{ $divide: ["$totalDiscount", "$totalRevenue"] }, 100]
            }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      res.json({ success: true, data: { outletStats, sourceStats } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 6. Time Based Promo Performance dengan detail lengkap
   */
  async timePerformance(req, res) {
    try {
      const { groupBy = 'daily' } = req.query;
      const format = groupBy === 'monthly' ? '%Y-%m' : 
                    groupBy === 'weekly' ? '%Y-%U' : '%Y-%m-%d';

      const timeData = await Order.aggregate([
        {
          $group: {
            _id: {
              period: { $dateToString: { format, date: "$createdAt" } },
              outlet: "$outlet"
            },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$grandTotal" },
            totalDiscount: {
              $sum: {
                $add: [
                  "$discounts.autoPromoDiscount",
                  "$discounts.manualDiscount",
                  "$discounts.voucherDiscount"
                ]
              }
            },
            promoOrders: {
              $sum: { $cond: [{ $ne: ["$appliedPromos", null] }, 1, 0] }
            },
            voucherOrders: {
              $sum: { $cond: [{ $ne: ["$appliedVoucher", null] }, 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: "outlets",
            localField: "_id.outlet",
            foreignField: "_id",
            as: "outlet"
          }
        },
        { $unwind: { path: "$outlet", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$_id.period",
            periods: {
              $push: {
                outlet: {
                  outletId: "$outlet._id",
                  outletName: "$outlet.name"
                },
                totalOrders: "$totalOrders",
                totalRevenue: "$totalRevenue",
                totalDiscount: "$totalDiscount",
                promoOrders: "$promoOrders",
                voucherOrders: "$voucherOrders"
              }
            },
            totalOrders: { $sum: "$totalOrders" },
            totalRevenue: { $sum: "$totalRevenue" },
            totalDiscount: { $sum: "$totalDiscount" },
            totalPromoOrders: { $sum: "$promoOrders" },
            totalVoucherOrders: { $sum: "$voucherOrders" }
          }
        },
        {
          $project: {
            period: "$_id",
            outlets: "$periods",
            totalOrders: 1,
            totalRevenue: 1,
            totalDiscount: 1,
            avgOrderValue: { $divide: ["$totalRevenue", "$totalOrders"] },
            promoAdoptionRate: {
              $multiply: [{ $divide: ["$totalPromoOrders", "$totalOrders"] }, 100]
            },
            voucherAdoptionRate: {
              $multiply: [{ $divide: ["$totalVoucherOrders", "$totalOrders"] }, 100]
            },
            discountRate: {
              $multiply: [{ $divide: ["$totalDiscount", "$totalRevenue"] }, 100]
            }
          }
        },
        { $sort: { period: 1 } }
      ]);

      res.json({ success: true, data: timeData });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * 7. Overview Metrics dengan populate lengkap
   */
  async overviewMetrics(req, res) {
    try {
      const [
        revenueData,
        promoData,
        voucherData,
        customerData,
        topPromos,
        topVouchers
      ] = await Promise.all([
        // Revenue Data
        Order.aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$grandTotal" },
              revenueBeforeDiscount: { $sum: "$totalBeforeDiscount" },
              totalDiscountGiven: { 
                $sum: { 
                  $add: [
                    "$discounts.autoPromoDiscount",
                    "$discounts.voucherDiscount",
                    "$discounts.manualDiscount"
                  ]
                }
              },
              totalOrders: { $sum: 1 },
              avgOrderValue: { $avg: "$grandTotal" }
            }
          }
        ]),
        
        // Promo Performance dengan populate
        Order.aggregate([
          { $match: { appliedPromos: { $ne: null } } },
          { $unwind: "$appliedPromos" },
          {
            $group: {
              _id: "$appliedPromos",
              usageCount: { $sum: 1 },
              totalDiscount: { $sum: "$discounts.autoPromoDiscount" },
              revenueGenerated: { $sum: "$grandTotal" }
            }
          },
          {
            $lookup: {
              from: "promos",
              localField: "_id",
              foreignField: "_id",
              as: "promo"
            }
          },
          { $unwind: "$promo" },
          {
            $project: {
              promoId: "$promo._id",
              promoName: "$promo.name",
              discountType: "$promo.discountType",
              discountAmount: "$promo.discountAmount",
              usageCount: 1,
              totalDiscount: 1,
              revenueGenerated: 1,
              effectiveness: {
                $cond: [
                  { $eq: ["$totalDiscount", 0] },
                  0,
                  { $divide: ["$revenueGenerated", "$totalDiscount"] }
                ]
              }
            }
          }
        ]),
        
        // Voucher Performance dengan populate
        Voucher.aggregate([
          {
            $lookup: {
              from: "orders",
              localField: "_id",
              foreignField: "appliedVoucher",
              as: "redemptions"
            }
          },
          {
            $project: {
              voucherId: "$_id",
              code: 1,
              name: 1,
              discountAmount: 1,
              discountType: 1,
              quota: 1,
              redemptionsCount: { $size: "$redemptions" },
              redemptionRate: {
                $cond: [
                  { $eq: ["$quota", 0] },
                  0,
                  { $multiply: [{ $divide: [{ $size: "$redemptions" }, "$quota"] }, 100] }
                ]
              },
              totalDiscount: { $sum: "$redemptions.discounts.voucherDiscount" },
              totalRevenue: { $sum: "$redemptions.grandTotal" }
            }
          }
        ]),
        
        // Customer Behavior
        Order.aggregate([
          {
            $group: {
              _id: "$user_id",
              orderCount: { $sum: 1 },
              totalSpent: { $sum: "$grandTotal" },
              avgDiscountUsed: {
                $avg: {
                  $add: [
                    "$discounts.autoPromoDiscount",
                    "$discounts.voucherDiscount"
                  ]
                }
              }
            }
          },
          {
            $group: {
              _id: null,
              totalCustomers: { $sum: 1 },
              repeatCustomers: { $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] } },
              avgCustomerValue: { $avg: "$totalSpent" },
              avgOrdersPerCustomer: { $avg: "$orderCount" }
            }
          }
        ]),
        
        // Top 5 Promos
        Order.aggregate([
          { $match: { appliedPromos: { $ne: null } } },
          { $unwind: "$appliedPromos" },
          {
            $group: {
              _id: "$appliedPromos",
              usageCount: { $sum: 1 },
              totalDiscount: { $sum: "$discounts.autoPromoDiscount" },
              revenueGenerated: { $sum: "$grandTotal" }
            }
          },
          { $sort: { usageCount: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "promos",
              localField: "_id",
              foreignField: "_id",
              as: "promo"
            }
          },
          { $unwind: "$promo" },
          {
            $project: {
              name: "$promo.name",
              usageCount: 1,
              totalDiscount: 1,
              revenueGenerated: 1
            }
          }
        ]),
        
        // Top 5 Vouchers
        Voucher.aggregate([
          {
            $lookup: {
              from: "orders",
              localField: "_id",
              foreignField: "appliedVoucher",
              as: "redemptions"
            }
          },
          {
            $project: {
              name: 1,
              code: 1,
              redemptionsCount: { $size: "$redemptions" },
              totalDiscount: { $sum: "$redemptions.discounts.voucherDiscount" }
            }
          },
          { $sort: { redemptionsCount: -1 } },
          { $limit: 5 }
        ])
      ]);

      const overview = revenueData[0] ? {
        revenue: {
          ...revenueData[0],
          discountRate: revenueData[0].totalDiscountGiven / revenueData[0].revenueBeforeDiscount * 100
        },
        promos: {
          totalActive: promoData.length,
          totalUsage: promoData.reduce((sum, promo) => sum + promo.usageCount, 0),
          totalDiscount: promoData.reduce((sum, promo) => sum + promo.totalDiscount, 0),
          details: promoData
        },
        vouchers: {
          totalActive: voucherData.length,
          totalRedemptions: voucherData.reduce((sum, voucher) => sum + voucher.redemptionsCount, 0),
          totalDiscount: voucherData.reduce((sum, voucher) => sum + voucher.totalDiscount, 0),
          details: voucherData
        },
        customers: customerData[0] || {},
        topPerformers: {
          topPromos: topPromos,
          topVouchers: topVouchers
        }
      } : {};

      res.json({ success: true, data: overview });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },


// Endpoint: GET /api/analytics/effectiveness
async effectivenessAnalysis(req, res) {
  try {
    // ROI per Promo/Voucher
    const promoROI = await Order.aggregate([
      { $match: { appliedPromos: { $ne: null } } },
      { $unwind: "$appliedPromos" },
      {
        $group: {
          _id: "$appliedPromos",
          totalDiscount: { $sum: "$discounts.autoPromoDiscount" },
          revenueGenerated: { $sum: "$grandTotal" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "promos",
          localField: "_id",
          foreignField: "_id",
          as: "promo"
        }
      },
      { $unwind: "$promo" },
      {
        $project: {
          name: "$promo.name",
          discountGiven: "$totalDiscount",
          revenueGenerated: 1,
          orderCount: 1,
          roi: {
            $cond: [
              { $eq: ["$totalDiscount", 0] },
              0,
              { $divide: ["$revenueGenerated", "$totalDiscount"] }
            ]
          },
          costPerAcquisition: {
            $cond: [
              { $eq: ["$orderCount", 0] },
              0,
              { $divide: ["$totalDiscount", "$orderCount"] }
            ]
          }
        }
      }
    ]);

    // Customer Acquisition Cost
    const cacAnalysis = await Order.aggregate([
      {
        $group: {
          _id: "$user_id",
          firstOrderDate: { $min: "$createdAt" },
          orderCount: { $sum: 1 },
          totalDiscountUsed: {
            $sum: {
              $add: [
                "$discounts.autoPromoDiscount",
                "$discounts.voucherDiscount"
              ]
            }
          },
          totalSpent: { $sum: "$grandTotal" }
        }
      },
      {
        $match: { orderCount: 1 } // New customers only
      },
      {
        $group: {
          _id: null,
          totalNewCustomers: { $sum: 1 },
          totalAcquisitionCost: { $sum: "$totalDiscountUsed" },
          avgCAC: { $avg: "$totalDiscountUsed" }
        }
      }
    ]);

    res.json({ success: true, data: { promoROI, cacAnalysis: cacAnalysis[0] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
},

// Endpoint: GET /api/analytics/trends?period=weekly|monthly
async trendAnalysis(req, res) {
  try {
    const { period = 'monthly' } = req.query;
    const format = period === 'weekly' ? '%Y-%U' : '%Y-%m';
    
    const trends = await Order.aggregate([
      {
        $group: {
          _id: {
            period: { $dateToString: { format, date: "$createdAt" } },
            hasPromo: { $ne: ["$appliedPromos", null] },
            hasVoucher: { $ne: ["$appliedVoucher", null] }
          },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
          totalDiscount: {
            $sum: {
              $add: [
                "$discounts.autoPromoDiscount",
                "$discounts.voucherDiscount"
              ]
            }
          },
          avgOrderValue: { $avg: "$grandTotal" }
        }
      },
      {
        $group: {
          _id: "$_id.period",
          totalOrders: { $sum: "$orderCount" },
          totalRevenue: { $sum: "$totalRevenue" },
          promoOrders: {
            $sum: {
              $cond: [{ $eq: ["$_id.hasPromo", true] }, "$orderCount", 0]
            }
          },
          voucherOrders: {
            $sum: {
              $cond: [{ $eq: ["$_id.hasVoucher", true] }, "$orderCount", 0]
            }
          },
          promoRevenue: {
            $sum: {
              $cond: [{ $eq: ["$_id.hasPromo", true] }, "$totalRevenue", 0]
            }
          },
          discountGiven: { $sum: "$totalDiscount" }
        }
      },
      {
        $project: {
          period: "$_id",
          totalOrders: 1,
          totalRevenue: 1,
          promoAdoptionRate: {
            $multiply: [{ $divide: ["$promoOrders", "$totalOrders"] }, 100]
          },
          voucherAdoptionRate: {
            $multiply: [{ $divide: ["$voucherOrders", "$totalOrders"] }, 100]
          },
          discountRate: {
            $multiply: [{ $divide: ["$discountGiven", "$totalRevenue"] }, 100]
          },
          avgDiscountPerOrder: { $divide: ["$discountGiven", "$totalOrders"] }
        }
      },
      { $sort: { period: 1 } }
    ]);

    res.json({ success: true, data: trends });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
},

// Endpoint: GET /api/analytics/channel-performance
async channelPerformance(req, res) {
  try {
    const performance = await Order.aggregate([
      {
        $group: {
          _id: {
            outlet: "$outlet",
            source: "$source",
            hasPromo: { $ne: ["$appliedPromos", null] }
          },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
          totalDiscount: {
            $sum: {
              $add: [
                "$discounts.autoPromoDiscount",
                "$discounts.voucherDiscount"
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "outlets",
          localField: "_id.outlet",
          foreignField: "_id",
          as: "outlet"
        }
      },
      { $unwind: { path: "$outlet", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            outlet: "$outlet.name",
            source: "$_id.source"
          },
          totalOrders: { $sum: "$orderCount" },
          promoOrders: {
            $sum: {
              $cond: [{ $eq: ["$_id.hasPromo", true] }, "$orderCount", 0]
            }
          },
          totalRevenue: { $sum: "$totalRevenue" },
          discountGiven: { $sum: "$totalDiscount" }
        }
      },
      {
        $project: {
          outlet: "$_id.outlet",
          source: "$_id.source",
          totalOrders: 1,
          promoAdoptionRate: {
            $multiply: [{ $divide: ["$promoOrders", "$totalOrders"] }, 100]
          },
          revenuePerOrder: { $divide: ["$totalRevenue", "$totalOrders"] },
          discountRate: {
            $multiply: [{ $divide: ["$discountGiven", "$totalRevenue"] }, 100]
          }
        }
      }
    ]);

    res.json({ success: true, data: performance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
},





};

export default AnalyticsController;
