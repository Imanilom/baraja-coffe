import { Order } from '../models/order.model.js';
import Promo from '../models/Promo.model.js';
import Voucher from '../models/voucher.model.js';
import AutoPromo from '../models/AutoPromo.model.js';
import User from '../models/user.model.js';
import { Outlet } from '../models/Outlet.model.js';
import LoyaltyLevel from '../models/LoyaltyLevel.model.js';
import LoyaltyProgram from '../models/LoyaltyProgram.model.js';

/**
 * Service class untuk analytics recommendations
 */
class AnalyticsRecommendationService {
  
  /**
   * Generate promo recommendations
   */
  static generatePromoRecommendations(promos) {
    const recommendations = [];
    
    const lowUsage = promos.filter(p => p.status === 'LOW_USAGE' && p.isActive);
    const poorPerformance = promos.filter(p => p.status === 'POOR' && p.isActive);
    const excellentPromos = promos.filter(p => p.status === 'EXCELLENT');

    if (lowUsage.length > 0) {
      recommendations.push({
        type: 'LOW_USAGE_ALERT',
        message: `${lowUsage.length} promos have low usage but are active`,
        action: 'Consider increasing visibility or extending validity',
        promos: lowUsage.map(p => ({ id: p.promoId, name: p.name }))
      });
    }

    if (poorPerformance.length > 0) {
      recommendations.push({
        type: 'POOR_PERFORMANCE',
        message: `${poorPerformance.length} promos are underperforming`,
        action: 'Review discount structure or target audience',
        promos: poorPerformance.map(p => ({ id: p.promoId, name: p.name }))
      });
    }

    if (excellentPromos.length > 0) {
      recommendations.push({
        type: 'BEST_PRACTICES',
        message: `${excellentPromos.length} promos are performing excellently`,
        action: 'Consider replicating these successful strategies',
        promos: excellentPromos.map(p => ({ id: p.promoId, name: p.name }))
      });
    }

    return recommendations;
  }

  /**
   * Generate voucher alerts
   */
  static generateVoucherAlerts(vouchers) {
    const alerts = [];
    
    const expiringSoon = vouchers.filter(v => 
      v.daysRemaining !== null && v.daysRemaining <= 7 && v.isActive && !v.isExpired
    );
    
    const nearlyDepleted = vouchers.filter(v => v.status === 'NEARLY_DEPLETED');
    const unusedActive = vouchers.filter(v => v.status === 'UNUSED' && v.isActive);

    if (expiringSoon.length > 0) {
      alerts.push({
        type: 'EXPIRING_SOON',
        message: `${expiringSoon.length} vouchers are expiring within 7 days`,
        severity: 'MEDIUM',
        vouchers: expiringSoon.map(v => ({ 
          id: v.voucherId, 
          code: v.code, 
          daysRemaining: v.daysRemaining 
        }))
      });
    }

    if (nearlyDepleted.length > 0) {
      alerts.push({
        type: 'LOW_QUOTA',
        message: `${nearlyDepleted.length} vouchers are nearly depleted`,
        severity: 'LOW',
        vouchers: nearlyDepleted.map(v => ({ 
          id: v.voucherId, 
          code: v.code, 
          remainingQuota: v.remainingQuota 
        }))
      });
    }

    if (unusedActive.length > 0) {
      alerts.push({
        type: 'UNUSED_ACTIVE',
        message: `${unusedActive.length} active vouchers have never been used`,
        severity: 'HIGH',
        vouchers: unusedActive.map(v => ({ 
          id: v.voucherId, 
          code: v.code,
          validTo: v.validTo
        }))
      });
    }

    return alerts;
  }

  /**
   * Generate voucher recommendations
   */
  static generateVoucherRecommendations(vouchers) {
    const recommendations = [];
    
    const highPerforming = vouchers.filter(v => v.status === 'HIGH_PERFORMANCE');
    const lowPerforming = vouchers.filter(v => v.status === 'LOW_PERFORMANCE' && v.isActive);
    const optimalUtilization = vouchers.filter(v => v.utilizationHealth === 'OPTIMAL');

    if (highPerforming.length > 0) {
      recommendations.push({
        type: 'SUCCESSFUL_STRATEGY',
        message: `Found ${highPerforming.length} high-performing vouchers`,
        action: 'Consider creating similar vouchers or extending these campaigns',
        examples: highPerforming.slice(0, 3).map(v => ({
          code: v.code,
          redemptionRate: v.redemptionRate,
          revenueImpact: v.revenueImpact
        }))
      });
    }

    if (lowPerforming.length > 0) {
      recommendations.push({
        type: 'OPTIMIZATION_NEEDED',
        message: `${lowPerforming.length} vouchers have low performance`,
        action: 'Review discount amounts, eligibility criteria, or promotion channels',
        vouchers: lowPerforming.map(v => ({
          code: v.code,
          redemptionRate: v.redemptionRate,
          usageCount: v.usedCount
        }))
      });
    }

    if (optimalUtilization.length > 0) {
      recommendations.push({
        type: 'BALANCED_UTILIZATION',
        message: `${optimalUtilization.length} vouchers have optimal utilization`,
        action: 'Maintain current strategy for these vouchers',
        vouchers: optimalUtilization.slice(0, 5).map(v => ({
          code: v.code,
          utilization: v.utilizationHealth,
          redemptionRate: v.redemptionRate
        }))
      });
    }

    return recommendations;
  }
}

/**
 * Service class untuk customer segmentation - COMPLETELY FIXED VERSION
 */
class CustomerSegmentationService {
  
  /**
   * Segmentasi berdasarkan Loyalty Level yang sudah ada - FIXED
   */
  static segmentByLoyaltyLevel(customers, loyaltyLevels) {
    // Create segments based on loyalty levels
    const segments = loyaltyLevels.map(level => ({
      name: level.name,
      levelId: level._id,
      requiredPoints: level.requiredPoints,
      description: level.description,
      customers: [],
      levelMetrics: {
        pointsPerCurrency: level.pointsPerCurrency,
        currencyUnit: level.currencyUnit,
        benefits: level.benefits
      }
    }));

    // Add customers to their respective loyalty level segments - FIXED LOGIC
    customers.forEach(customer => {
      if (!customer._id) {
        console.log('Skipping customer with null _id:', customer);
        return; // Skip customers with null _id
      }

      // Prioritize calculated loyalty level, fallback to customerInfo.loyaltyLevel
      let customerLevel = customer.calculatedLoyaltyLevel;
      
      // If no calculated level, try to get from customerInfo
      if (!customerLevel && customer.customerInfo && customer.customerInfo.loyaltyLevel) {
        customerLevel = customer.customerInfo.loyaltyLevel;
      }
      
      // If still no level, determine based on points
      if (!customerLevel && customer.customerInfo) {
        const customerPoints = customer.customerInfo.loyaltyPoints || 0;
        customerLevel = this.determineLoyaltyLevelByPoints(customerPoints, loyaltyLevels);
      }

      if (customerLevel && customerLevel.levelId) {
        const segment = segments.find(seg => 
          seg.levelId && seg.levelId.toString() === customerLevel.levelId.toString()
        );
        
        if (segment) {
          segment.customers.push(customer);
        }
      } else {
        // Handle customers without loyalty level (assign to bronze)
        const bronzeSegment = segments.find(seg => seg.name === 'bronze');
        if (bronzeSegment) {
          bronzeSegment.customers.push(customer);
        }
      }
    });

    // Add behavioral segments within each loyalty level - FIXED: use static method call
    segments.forEach(segment => {
      if (segment.customers.length > 0) {
        segment.behavioralSegments = CustomerSegmentationService.segmentByBehaviorWithinLevel(segment.customers);
      }
    });

    return segments;
  }

  /**
   * Segmentasi perilaku dalam setiap loyalty level - FIXED
   */
  static segmentByBehaviorWithinLevel(customers) {
    const behavioralSegments = [
      { name: 'VIP', description: 'High frequency & high spending', customers: [] },
      { name: 'Loyal', description: 'Regular customers with good frequency', customers: [] },
      { name: 'Occasional', description: 'Infrequent but valuable customers', customers: [] },
      { name: 'At Risk', description: 'Declining activity', customers: [] },
      { name: 'New', description: 'Recent customers', customers: [] }
    ];

    customers.forEach(customer => {
      const spendingScore = (customer.totalSpent || 0) / 1000000; // Normalize spending
      const frequencyScore = (customer.orderFrequency || 0) * 30; // Normalize to monthly frequency
      const recencyScore = 30 - Math.min(customer.daysSinceLastOrder || 999, 30); // Recent activity
      
      const behaviorScore = (spendingScore * 0.4) + (frequencyScore * 0.3) + (recencyScore * 0.3);

      if (behaviorScore >= 0.7) {
        behavioralSegments[0].customers.push(customer); // VIP
      } else if (behaviorScore >= 0.5) {
        behavioralSegments[1].customers.push(customer); // Loyal
      } else if (behaviorScore >= 0.3) {
        behavioralSegments[2].customers.push(customer); // Occasional
      } else if ((customer.daysSinceLastOrder || 999) > 60) {
        behavioralSegments[3].customers.push(customer); // At Risk
      } else {
        behavioralSegments[4].customers.push(customer); // New
      }
    });

    return behavioralSegments;
  }

  /**
   * Determine loyalty level based on points
   */
  static determineLoyaltyLevelByPoints(points, loyaltyLevels) {
    // Sort levels by required points ascending
    const sortedLevels = [...loyaltyLevels].sort((a, b) => a.requiredPoints - b.requiredPoints);
    
    let assignedLevel = sortedLevels[0]; // Default to lowest level
    
    for (let i = sortedLevels.length - 1; i >= 0; i--) {
      if (points >= sortedLevels[i].requiredPoints) {
        assignedLevel = sortedLevels[i];
        break;
      }
    }
    
    return {
      levelId: assignedLevel._id,
      levelName: assignedLevel.name,
      requiredPoints: assignedLevel.requiredPoints
    };
  }

  /**
   * Analisis efektivitas program loyalty - FIXED
   */
  static analyzeLoyaltyEffectiveness(customers, loyaltyLevels) {
    const analysis = {
      levelDistribution: {},
      spendingByLevel: {},
      retentionByLevel: {},
      promotionEffectiveness: {}
    };

    // Analyze distribution and spending by level
    loyaltyLevels.forEach(level => {
      const levelCustomers = customers.filter(customer => {
        if (!customer._id) return false; // Skip invalid customers
        
        const customerLevel = customer.calculatedLoyaltyLevel || customer.customerInfo?.loyaltyLevel;
        if (!customerLevel) return false;
        
        return customerLevel.levelId?.toString() === level._id.toString();
      });

      analysis.levelDistribution[level.name] = levelCustomers.length;
      
      if (levelCustomers.length > 0) {
        analysis.spendingByLevel[level.name] = {
          totalSpent: levelCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
          avgSpent: levelCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / levelCustomers.length,
          avgOrderValue: levelCustomers.reduce((sum, c) => sum + (c.avgOrderValue || 0), 0) / levelCustomers.length,
          avgOrders: levelCustomers.reduce((sum, c) => sum + (c.totalOrders || 0), 0) / levelCustomers.length
        };

        // Calculate retention rate for this level
        const activeCustomers = levelCustomers.filter(c => (c.daysSinceLastOrder || 999) <= 30);
        analysis.retentionByLevel[level.name] = levelCustomers.length > 0 ? 
          (activeCustomers.length / levelCustomers.length) * 100 : 0;
      }
    });

    // Analyze promotion effectiveness across levels
    loyaltyLevels.forEach(level => {
      const levelCustomers = customers.filter(customer => {
        if (!customer._id) return false;
        
        const customerLevel = customer.calculatedLoyaltyLevel || customer.customerInfo?.loyaltyLevel;
        if (!customerLevel) return false;
        
        return customerLevel.levelId?.toString() === level._id.toString();
      });

      if (levelCustomers.length > 0) {
        analysis.promotionEffectiveness[level.name] = {
          promoUsageRate: levelCustomers.reduce((sum, c) => {
            const orders = c.totalOrders || 1;
            const promoCount = c.promoUsageCount || 0;
            return sum + (promoCount / orders);
          }, 0) / levelCustomers.length * 100,
          
          voucherUsageRate: levelCustomers.reduce((sum, c) => {
            const orders = c.totalOrders || 1;
            const voucherCount = c.voucherUsageCount || 0;
            return sum + (voucherCount / orders);
          }, 0) / levelCustomers.length * 100,
          
          discountSensitivity: levelCustomers.reduce((sum, c) => {
            const spent = c.totalSpent || 1;
            const discount = c.totalDiscountUsed || 0;
            return sum + (discount / spent);
          }, 0) / levelCustomers.length * 100
        };
      }
    });

    return analysis;
  }

  /**
   * Distribusi loyalty customers - FIXED
   */
  static getLoyaltyDistribution(customers, loyaltyLevels) {
    const distribution = {};
    
    // Filter out invalid customers first
    const validCustomers = customers.filter(c => c._id);
    
    loyaltyLevels.forEach(level => {
      const levelCustomers = validCustomers.filter(customer => {
        const customerLevel = customer.calculatedLoyaltyLevel || customer.customerInfo?.loyaltyLevel;
        if (!customerLevel) return false;
        
        return customerLevel.levelId?.toString() === level._id.toString();
      });
      
      distribution[level.name] = {
        count: levelCustomers.length,
        percentage: validCustomers.length > 0 ? (levelCustomers.length / validCustomers.length) * 100 : 0,
        requiredPoints: level.requiredPoints
      };
    });

    return distribution;
  }

  /**
   * Segment customers by different criteria
   */
  static segmentCustomers(customers, segmentBy) {
    switch (segmentBy) {
      case 'spending':
        return CustomerSegmentationService.segmentBySpending(customers);
      case 'frequency':
        return CustomerSegmentationService.segmentByFrequency(customers);
      case 'recency':
        return CustomerSegmentationService.segmentByRecency(customers);
      default:
        return CustomerSegmentationService.segmentByRFM(customers);
    }
  }

  static segmentBySpending(customers) {
    const segments = [
      { name: 'VIP', range: [1000000, Infinity], customers: [] },
      { name: 'High Value', range: [500000, 1000000], customers: [] },
      { name: 'Medium Value', range: [200000, 500000], customers: [] },
      { name: 'Low Value', range: [0, 200000], customers: [] }
    ];

    customers.forEach(customer => {
      if (!customer._id) return; // Skip invalid customers
      
      const totalSpent = customer.totalSpent || 0;
      for (const segment of segments) {
        if (totalSpent >= segment.range[0] && totalSpent < segment.range[1]) {
          segment.customers.push(customer);
          break;
        }
      }
    });

    return segments;
  }

  static segmentByFrequency(customers) {
    const segments = [
      { name: 'Very Frequent', range: [10, Infinity], customers: [] },
      { name: 'Frequent', range: [5, 10], customers: [] },
      { name: 'Regular', range: [2, 5], customers: [] },
      { name: 'Occasional', range: [1, 2], customers: [] }
    ];

    customers.forEach(customer => {
      if (!customer._id) return; // Skip invalid customers
      
      const totalOrders = customer.totalOrders || 0;
      for (const segment of segments) {
        if (totalOrders >= segment.range[0] && totalOrders < segment.range[1]) {
          segment.customers.push(customer);
          break;
        }
      }
    });

    return segments;
  }

  static segmentByRecency(customers) {
    const segments = [
      { name: 'Active', range: [0, 7], customers: [] },
      { name: 'Recent', range: [7, 30], customers: [] },
      { name: 'Dormant', range: [30, 90], customers: [] },
      { name: 'Inactive', range: [90, Infinity], customers: [] }
    ];

    customers.forEach(customer => {
      if (!customer._id) return; // Skip invalid customers
      
      const daysSinceLastOrder = customer.daysSinceLastOrder || 999;
      for (const segment of segments) {
        if (daysSinceLastOrder >= segment.range[0] && daysSinceLastOrder < segment.range[1]) {
          segment.customers.push(customer);
          break;
        }
      }
    });

    return segments;
  }

  static segmentByRFM(customers) {
    // Implement RFM segmentation logic here
    return CustomerSegmentationService.segmentBySpending(customers); // Default to spending for now
  }

  /**
   * Calculate segment insights - FIXED
   */
  static calculateSegmentInsights(segments) {
    return segments.map(segment => {
      // Filter out invalid customers
      const validCustomers = segment.customers.filter(c => c._id);
      const customerCount = validCustomers.length;
      
      if (customerCount === 0) return { ...segment, insights: {} };

      const totalRevenue = validCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
      const avgOrderValue = validCustomers.reduce((sum, c) => sum + (c.avgOrderValue || 0), 0) / customerCount;
      const avgOrders = validCustomers.reduce((sum, c) => sum + (c.totalOrders || 0), 0) / customerCount;
      
      const promoUsageRate = validCustomers.reduce((sum, c) => {
        const orders = c.totalOrders || 1;
        const promoCount = c.promoUsageCount || 0;
        return sum + (promoCount / orders);
      }, 0) / customerCount * 100;

      return {
        ...segment,
        insights: {
          customerCount,
          totalRevenue,
          avgOrderValue: Math.round(avgOrderValue),
          avgOrders: Math.round(avgOrders * 100) / 100,
          promoUsageRate: Math.round(promoUsageRate * 100) / 100,
          customerValue: customerCount > 0 ? totalRevenue / customerCount : 0
        }
      };
    });
  }

  /**
   * Calculate Customer Lifetime Value - FIXED
   */
  static calculateCLV(customers) {
    const validCustomers = customers.filter(c => c._id);
    
    if (validCustomers.length === 0) {
      return {
        averageCLV: 0,
        totalCLV: 0,
        customerCount: 0
      };
    }

    const totalCLV = validCustomers.reduce((sum, customer) => {
      const monthsSinceFirstOrder = customer.firstOrderDate ? 
        (new Date() - new Date(customer.firstOrderDate)) / (30 * 24 * 60 * 60 * 1000) : 1;
      return sum + ((customer.totalSpent || 0) / Math.max(1, monthsSinceFirstOrder));
    }, 0);

    return {
      averageCLV: Math.round(totalCLV / validCustomers.length),
      totalCLV: Math.round(totalCLV),
      customerCount: validCustomers.length
    };
  }

  /**
   * Calculate retention rate - FIXED
   */
  static calculateRetentionRate(customers) {
    const validCustomers = customers.filter(c => c._id);
    
    if (validCustomers.length === 0) return 0;

    const recentCustomers = validCustomers.filter(c => {
      if (!c.lastOrderDate) return false;
      const daysSinceLastOrder = (new Date() - new Date(c.lastOrderDate)) / (24 * 60 * 60 * 1000);
      return daysSinceLastOrder <= 30;
    });

    return (recentCustomers.length / validCustomers.length) * 100;
  }
}

/**
 * Service class untuk loyalty analytics
 */
class LoyaltyAnalyticsService {
  
  static async getLoyaltyCustomerActivities(period) {
    // Implementation untuk mendapatkan aktivitas customer loyalty
    return Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$user._id",
          loyaltyPoints: "$user.loyaltyPoints",
          loyaltyLevel: "$user.loyaltyLevel",
          orderAmount: "$grandTotal",
          pointsEarned: { $divide: ["$grandTotal", 1000] }, // 1 point per Rp1000
          orderDate: "$createdAt",
          hasPromo: { $ne: ["$appliedPromos", null] },
          hasVoucher: { $ne: ["$appliedVoucher", null] }
        }
      }
    ]);
  }

  static analyzeLevelPerformance(loyaltyLevels, customerActivities) {
    const performance = {};
    
    loyaltyLevels.forEach(level => {
      const levelCustomers = customerActivities.filter(activity => 
        activity.loyaltyLevel?.toString() === level._id.toString()
      );
      
      performance[level.name] = {
        customerCount: levelCustomers.length,
        totalSpent: levelCustomers.reduce((sum, c) => sum + c.orderAmount, 0),
        avgOrderValue: levelCustomers.reduce((sum, c) => sum + c.orderAmount, 0) / levelCustomers.length || 0,
        pointsEarned: levelCustomers.reduce((sum, c) => sum + c.pointsEarned, 0),
        promotionUsage: {
          withPromo: levelCustomers.filter(c => c.hasPromo).length,
          withVoucher: levelCustomers.filter(c => c.hasVoucher).length
        }
      };
    });
    
    return performance;
  }

  static analyzeCustomerJourney(customerActivities, loyaltyLevels) {
    const journey = {
      levelProgression: {},
      upgradePatterns: {},
      churnRisks: {}
    };

    // Analyze movement between levels
    loyaltyLevels.forEach((level, index) => {
      if (index < loyaltyLevels.length - 1) {
        const nextLevel = loyaltyLevels[index + 1];
        const customersNearUpgrade = customerActivities.filter(activity => {
          const points = activity.loyaltyPoints || 0;
          return points >= level.requiredPoints && points < nextLevel.requiredPoints;
        });
        
        journey.levelProgression[level.name] = {
          nextLevel: nextLevel.name,
          customersNearUpgrade: customersNearUpgrade.length,
          pointsToUpgrade: nextLevel.requiredPoints - level.requiredPoints,
          upgradeRate: customersNearUpgrade.length / customerActivities.filter(a => 
            a.loyaltyLevel?.toString() === level._id.toString()
          ).length * 100 || 0
        };
      }
    });

    return journey;
  }

  static analyzePointsEconomics(customerActivities, loyaltyProgram) {
    const totalPointsEarned = customerActivities.reduce((sum, activity) => sum + (activity.pointsEarned || 0), 0);
    const totalPointsValue = totalPointsEarned * (loyaltyProgram?.discountValuePerPoint || 50);
    const totalRevenue = customerActivities.reduce((sum, activity) => sum + activity.orderAmount, 0);
    
    return {
      totalPointsEarned,
      totalPointsValue,
      pointsToRevenueRatio: totalPointsEarned / totalRevenue,
      costOfLoyalty: (totalPointsValue / totalRevenue) * 100,
      pointsEfficiency: totalRevenue / totalPointsEarned
    };
  }

  static generateLoyaltyRecommendations(loyaltyLevels, customerActivities) {
    const recommendations = [];
    
    // Analyze level distribution
    const levelDistribution = {};
    loyaltyLevels.forEach(level => {
      const count = customerActivities.filter(a => 
        a.loyaltyLevel?.toString() === level._id.toString()
      ).length;
      levelDistribution[level.name] = count;
    });

    // Check if too many customers are stuck in lower levels
    const lowerLevels = ['bronze', 'silver'];
    const higherLevels = ['gold', 'platinum', 'black', 'blackChroma'];
    
    const lowerLevelCount = lowerLevels.reduce((sum, level) => sum + (levelDistribution[level] || 0), 0);
    const higherLevelCount = higherLevels.reduce((sum, level) => sum + (levelDistribution[level] || 0), 0);
    
    if (lowerLevelCount > higherLevelCount * 2) {
      recommendations.push({
        type: 'LEVEL_UP_OPPORTUNITY',
        message: 'Many customers are in lower loyalty levels',
        action: 'Consider creating promotions to help customers level up',
        details: {
          lowerLevelCustomers: lowerLevelCount,
          higherLevelCustomers: higherLevelCount
        }
      });
    }

    // Check points accumulation rate
    const avgPointsPerOrder = customerActivities.reduce((sum, activity) => 
      sum + (activity.pointsEarned || 0), 0) / customerActivities.length;
    
    if (avgPointsPerOrder < 10) {
      recommendations.push({
        type: 'POINTS_ACCUMULATION',
        message: 'Low points accumulation per order',
        action: 'Consider increasing points per transaction or adding bonus point promotions',
        details: {
          avgPointsPerOrder: Math.round(avgPointsPerOrder * 100) / 100
        }
      });
    }

    return recommendations;
  }
}

/**
 * Service class untuk category analytics
 */
class CategoryAnalyticsService {
  
  /**
   * Analytics berdasarkan main kategori
   */
  static async getMainCategoryAnalytics(req, res) {
    try {
      const { startDate, endDate, outletId, groupBy = 'mainCategory' } = req.query;
      
      const matchStage = {};
      
      // Filter berdasarkan tanggal
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }
      
      if (outletId) matchStage.outlet = outletId;

      const analytics = await Order.aggregate([
        { $match: matchStage },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "menuitems",
            localField: "items.menuItem",
            foreignField: "_id",
            as: "menuItemData"
          }
        },
        { $unwind: "$menuItemData" },
        {
          $group: {
            _id: `$${groupBy === 'subCategory' ? 'menuItemData.subCategory' : 'menuItemData.mainCategory'}`,
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
            totalOrders: { $addToSet: "$_id" },
            uniqueCustomers: { $addToSet: "$user_id" },
            avgPrice: { $avg: "$items.price" },
            minPrice: { $min: "$items.price" },
            maxPrice: { $max: "$items.price" },
            totalCost: {
              $sum: {
                $multiply: [
                  "$items.quantity",
                  { $ifNull: ["$menuItemData.costPrice", 0] }
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: groupBy === 'subCategory' ? "categories" : "menuitems",
            localField: "_id",
            foreignField: groupBy === 'subCategory' ? "_id" : "mainCategory",
            as: "categoryInfo"
          }
        },
        {
          $project: {
            categoryId: "$_id",
            categoryName: {
              $cond: {
                if: { $eq: [groupBy, 'subCategory'] },
                then: { $arrayElemAt: ["$categoryInfo.name", 0] },
                else: "$_id"
              }
            },
            mainCategory: {
              $cond: {
                if: { $eq: [groupBy, 'subCategory'] },
                then: { $arrayElemAt: ["$categoryInfo.mainCategory", 0] },
                else: "$_id"
              }
            },
            totalQuantity: 1,
            totalRevenue: 1,
            totalCost: 1,
            totalOrders: { $size: "$totalOrders" },
            uniqueCustomers: { $size: "$uniqueCustomers" },
            avgPrice: { $round: ["$avgPrice", 2] },
            priceRange: {
              min: { $round: ["$minPrice", 2] },
              max: { $round: ["$maxPrice", 2] }
            },
            // Profit calculations
            grossProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
            profitMargin: {
              $cond: [
                { $eq: ["$totalRevenue", 0] },
                0,
                { $multiply: [{ $divide: [{ $subtract: ["$totalRevenue", "$totalCost"] }, "$totalRevenue"] }, 100] }
              ]
            },
            // Performance metrics
            revenuePerOrder: {
              $cond: [
                { $eq: [{ $size: "$totalOrders" }, 0] },
                0,
                { $divide: ["$totalRevenue", { $size: "$totalOrders" }] }
              ]
            },
            avgQuantityPerOrder: {
              $cond: [
                { $eq: [{ $size: "$totalOrders" }, 0] },
                0,
                { $divide: ["$totalQuantity", { $size: "$totalOrders" }] }
              ]
            }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      // Generate insights
      const insights = this.generateCategoryInsights(analytics, groupBy);

      res.json({
        success: true,
        data: analytics,
        insights,
        metadata: {
          totalCategories: analytics.length,
          period: { startDate, endDate },
          filters: { outletId, groupBy }
        }
      });

    } catch (err) {
      console.error('Main Category Analytics Error:', err);
      throw err;
    }
  }

  /**
   * Trend analysis untuk kategori
   */
  static async getCategoryTrends(req, res) {
    try {
      const { period = 'monthly', mainCategory, limit = 10 } = req.query;
      
      const format = period === 'weekly' ? '%Y-%U' : '%Y-%m';
      
      const matchStage = {};
      if (mainCategory) matchStage["menuItemData.mainCategory"] = mainCategory;

      const trends = await Order.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "menuitems",
            localField: "items.menuItem",
            foreignField: "_id",
            as: "menuItemData"
          }
        },
        { $unwind: "$menuItemData" },
        { $match: matchStage },
        {
          $group: {
            _id: {
              period: { $dateToString: { format, date: "$createdAt" } },
              mainCategory: "$menuItemData.mainCategory"
            },
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
            totalOrders: { $addToSet: "$_id" },
            avgPrice: { $avg: "$items.price" }
          }
        },
        {
          $group: {
            _id: "$_id.period",
            categories: {
              $push: {
                mainCategory: "$_id.mainCategory",
                totalQuantity: "$totalQuantity",
                totalRevenue: "$totalRevenue",
                orderCount: { $size: "$totalOrders" },
                avgPrice: "$avgPrice"
              }
            },
            totalPeriodRevenue: { $sum: "$totalRevenue" },
            totalPeriodQuantity: { $sum: "$totalQuantity" }
          }
        },
        {
          $project: {
            period: "$_id",
            categories: {
              $map: {
                input: "$categories",
                as: "cat",
                in: {
                  mainCategory: "$$cat.mainCategory",
                  totalQuantity: "$$cat.totalQuantity",
                  totalRevenue: "$$cat.totalRevenue",
                  orderCount: "$$cat.orderCount",
                  avgPrice: { $round: ["$$cat.avgPrice", 2] },
                  revenueShare: {
                    $multiply: [
                      { $divide: ["$$cat.totalRevenue", "$totalPeriodRevenue"] },
                      100
                    ]
                  },
                  quantityShare: {
                    $multiply: [
                      { $divide: ["$$cat.totalQuantity", "$totalPeriodQuantity"] },
                      100
                    ]
                  }
                }
              }
            },
            totalPeriodRevenue: 1,
            totalPeriodQuantity: 1
          }
        },
        { $sort: { period: 1 } },
        { $limit: parseInt(limit) }
      ]);

      res.json({
        success: true,
        data: trends,
        period
      });

    } catch (err) {
      console.error('Category Trends Analytics Error:', err);
      throw err;
    }
  }

  /**
   * Top performing items dalam setiap kategori
   */
  static async getTopItemsByCategory(req, res) {
    try {
      const { mainCategory, limit = 5, sortBy = 'revenue' } = req.query;
      
      const matchStage = {};
      if (mainCategory) matchStage["menuItemData.mainCategory"] = mainCategory;

      const sortStage = {};
      sortStage[sortBy === 'quantity' ? 'totalQuantity' : 'totalRevenue'] = -1;

      const topItems = await Order.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "menuitems",
            localField: "items.menuItem",
            foreignField: "_id",
            as: "menuItemData"
          }
        },
        { $unwind: "$menuItemData" },
        { $match: matchStage },
        {
          $group: {
            _id: "$items.menuItem",
            mainCategory: { $first: "$menuItemData.mainCategory" },
            itemName: { $first: "$menuItemData.name" },
            itemPrice: { $first: "$menuItemData.price" },
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
            totalOrders: { $addToSet: "$_id" },
            uniqueCustomers: { $addToSet: "$user_id" },
            costPrice: { $first: "$menuItemData.costPrice" }
          }
        },
        {
          $project: {
            itemId: "$_id",
            mainCategory: 1,
            itemName: 1,
            itemPrice: 1,
            totalQuantity: 1,
            totalRevenue: 1,
            totalOrders: { $size: "$totalOrders" },
            uniqueCustomers: { $size: "$uniqueCustomers" },
            costPrice: 1,
            grossProfit: { $subtract: ["$totalRevenue", { $multiply: ["$totalQuantity", "$costPrice"] }] },
            profitMargin: {
              $cond: [
                { $eq: ["$totalRevenue", 0] },
                0,
                { $multiply: [{ $divide: [{ $subtract: ["$totalRevenue", { $multiply: ["$totalQuantity", "$costPrice"] }] }, "$totalRevenue"] }, 100] }
              ]
            },
            popularityScore: {
              $add: [
                { $multiply: [{ $divide: ["$totalQuantity", 100] }, 40] },
                { $multiply: [{ $divide: ["$totalRevenue", 10000] }, 30] },
                { $multiply: [{ $divide: [{ $size: "$uniqueCustomers" }, 10] }, 30] }
              ]
            }
          }
        },
        { $sort: sortStage },
        { $limit: parseInt(limit) }
      ]);

      res.json({
        success: true,
        data: topItems,
        metadata: {
          mainCategory,
          limit,
          sortBy
        }
      });

    } catch (err) {
      console.error('Top Items Analytics Error:', err);
      throw err;
    }
  }

  /**
   * Category performance comparison
   */
  static async getCategoryComparison(req, res) {
    try {
      const { startDate, endDate, metrics = 'revenue' } = req.query;
      
      const matchStage = {};
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      const comparison = await Order.aggregate([
        { $match: matchStage },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "menuitems",
            localField: "items.menuItem",
            foreignField: "_id",
            as: "menuItemData"
          }
        },
        { $unwind: "$menuItemData" },
        {
          $group: {
            _id: "$menuItemData.mainCategory",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
            totalCost: {
              $sum: {
                $multiply: [
                  "$items.quantity",
                  { $ifNull: ["$menuItemData.costPrice", 0] }
                ]
              }
            },
            totalOrders: { $addToSet: "$_id" },
            uniqueCustomers: { $addToSet: "$user_id" },
            avgOrderValue: { $avg: "$grandTotal" }
          }
        },
        {
          $project: {
            mainCategory: "$_id",
            totalQuantity: 1,
            totalRevenue: 1,
            totalCost: 1,
            grossProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
            profitMargin: {
              $cond: [
                { $eq: ["$totalRevenue", 0] },
                0,
                { $multiply: [{ $divide: [{ $subtract: ["$totalRevenue", "$totalCost"] }, "$totalRevenue"] }, 100] }
              ]
            },
            totalOrders: { $size: "$totalOrders" },
            uniqueCustomers: { $size: "$uniqueCustomers" },
            avgOrderValue: { $round: ["$avgOrderValue", 2] },
            revenuePerCustomer: {
              $cond: [
                { $eq: [{ $size: "$uniqueCustomers" }, 0] },
                0,
                { $divide: ["$totalRevenue", { $size: "$uniqueCustomers" }] }
              ]
            },
            ordersPerCustomer: {
              $cond: [
                { $eq: [{ $size: "$uniqueCustomers" }, 0] },
                0,
                { $divide: [{ $size: "$totalOrders" }, { $size: "$uniqueCustomers" }] }
              ]
            },
            // Performance scores
            performanceScore: {
              $add: [
                { $multiply: [{ $divide: ["$totalRevenue", 1000000] }, 35] },
                { $multiply: ["$profitMargin", 0.4] },
                { $multiply: [{ $divide: [{ $size: "$uniqueCustomers" }, 100] }, 25] }
              ]
            }
          }
        },
        { $sort: { performanceScore: -1 } }
      ]);

      const insights = this.generateComparisonInsights(comparison);

      res.json({
        success: true,
        data: comparison,
        insights,
        metadata: {
          totalCategories: comparison.length,
          period: { startDate, endDate }
        }
      });

    } catch (err) {
      console.error('Category Comparison Analytics Error:', err);
      throw err;
    }
  }

  /**
   * Generate insights untuk kategori analytics
   */
  static generateCategoryInsights(analytics, groupBy) {
    if (!analytics || analytics.length === 0) {
      return {
        summary: {},
        topPerformers: {},
        recommendations: []
      };
    }

    const totalRevenue = analytics.reduce((sum, cat) => sum + cat.totalRevenue, 0);
    const totalQuantity = analytics.reduce((sum, cat) => sum + cat.totalQuantity, 0);
    const totalProfit = analytics.reduce((sum, cat) => sum + cat.grossProfit, 0);

    return {
      summary: {
        totalCategories: analytics.length,
        totalRevenue,
        totalQuantity,
        totalProfit,
        avgProfitMargin: analytics.reduce((sum, cat) => sum + cat.profitMargin, 0) / analytics.length,
        bestPerformingCategory: analytics[0],
        mostProfitableCategory: [...analytics].sort((a, b) => b.profitMargin - a.profitMargin)[0]
      },
      topPerformers: {
        byRevenue: analytics.slice(0, 3),
        byQuantity: [...analytics].sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 3),
        byProfit: [...analytics].sort((a, b) => b.grossProfit - a.grossProfit).slice(0, 3)
      },
      recommendations: this.generateCategoryRecommendations(analytics)
    };
  }

  /**
   * Generate comparison insights
   */
  static generateComparisonInsights(comparison) {
    if (!comparison || comparison.length === 0) {
      return {
        summary: {},
        opportunities: [],
        alerts: []
      };
    }

    const highMarginCategories = comparison.filter(cat => cat.profitMargin > 50);
    const lowMarginCategories = comparison.filter(cat => cat.profitMargin < 20);
    const highGrowthCategories = comparison.filter(cat => cat.uniqueCustomers > 100);

    return {
      summary: {
        totalCategories: comparison.length,
        highMarginCategories: highMarginCategories.length,
        lowMarginCategories: lowMarginCategories.length,
        highGrowthCategories: highGrowthCategories.length,
        averagePerformanceScore: comparison.reduce((sum, cat) => sum + cat.performanceScore, 0) / comparison.length
      },
      opportunities: highMarginCategories.map(cat => ({
        category: cat.mainCategory,
        type: 'HIGH_MARGIN',
        message: `${cat.mainCategory} has high profit margin (${cat.profitMargin.toFixed(1)}%)`,
        action: 'Consider increasing promotion and visibility'
      })),
      alerts: lowMarginCategories.map(cat => ({
        category: cat.mainCategory,
        type: 'LOW_MARGIN',
        message: `${cat.mainCategory} has low profit margin (${cat.profitMargin.toFixed(1)}%)`,
        action: 'Review pricing strategy or cost structure'
      }))
    };
  }

  /**
   * Generate category recommendations
   */
  static generateCategoryRecommendations(analytics) {
    const recommendations = [];
    
    const lowVolumeHighMargin = analytics.filter(cat => 
      cat.totalQuantity < 100 && cat.profitMargin > 40
    );
    
    const highVolumeLowMargin = analytics.filter(cat => 
      cat.totalQuantity > 500 && cat.profitMargin < 20
    );

    if (lowVolumeHighMargin.length > 0) {
      recommendations.push({
        type: 'UNDER_PROMOTED',
        message: `${lowVolumeHighMargin.length} categories have high margins but low volume`,
        action: 'Increase marketing and promotion for these categories',
        categories: lowVolumeHighMargin.map(cat => ({
          name: cat.categoryName,
          profitMargin: cat.profitMargin,
          volume: cat.totalQuantity
        }))
      });
    }

    if (highVolumeLowMargin.length > 0) {
      recommendations.push({
        type: 'PRICING_OPTIMIZATION',
        message: `${highVolumeLowMargin.length} categories have high volume but low margins`,
        action: 'Review pricing or reduce costs for these categories',
        categories: highVolumeLowMargin.map(cat => ({
          name: cat.categoryName,
          profitMargin: cat.profitMargin,
          volume: cat.totalQuantity
        }))
      });
    }

    // Find categories with high customer engagement
    const highEngagement = analytics.filter(cat => 
      cat.uniqueCustomers > 50 && cat.avgQuantityPerOrder > 2
    );

    if (highEngagement.length > 0) {
      recommendations.push({
        type: 'CUSTOMER_FAVORITE',
        message: `${highEngagement.length} categories show high customer engagement`,
        action: 'Leverage these categories for cross-selling and bundling',
        categories: highEngagement.map(cat => ({
          name: cat.categoryName,
          engagement: cat.avgQuantityPerOrder,
          customers: cat.uniqueCustomers
        }))
      });
    }

    return recommendations;
  }
}

/**
 * Main Analytics Controller
 */
const AnalyticsController = {

  /**
   * 1. Promo Usage Analytics dengan insight yang lebih detail
   */
  async promoUsage(req, res) {
    try {
      const { startDate, endDate, minUsage = 0, outletId, customerType } = req.query;
      
      const matchStage = {
        appliedPromos: { $ne: null, $exists: true, $not: { $size: 0 } }
      };

      // Filter berdasarkan parameter
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      if (outletId) matchStage.outlet = outletId;
      if (customerType) matchStage.customerType = customerType;

      const data = await Order.aggregate([
        { $match: matchStage },
        { $unwind: "$appliedPromos" },
        {
          $group: {
            _id: "$appliedPromos",
            totalOrders: { $sum: 1 },
            totalDiscount: { $sum: "$discounts.autoPromoDiscount" },
            totalRevenue: { $sum: "$grandTotal" },
            totalOriginalAmount: { $sum: "$totalBeforeDiscount" },
            uniqueCustomers: { $addToSet: "$user_id" },
            avgOrderValue: { $avg: "$grandTotal" },
            minOrderValue: { $min: "$grandTotal" },
            maxOrderValue: { $max: "$grandTotal" },
            outletUsage: { $addToSet: "$outlet" }
          }
        },
        { $match: { totalOrders: { $gte: parseInt(minUsage) } } },
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
          $lookup: {
            from: "outlets",
            localField: "outletUsage",
            foreignField: "_id",
            as: "usedOutlets"
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
            minOrderAmount: "$promo.minOrderAmount",
            maxDiscountAmount: "$promo.maxDiscountAmount",
            promoType: "$promo.promoType",
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
            usedOutlets: {
              $map: {
                input: "$usedOutlets",
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
            // Metrics
            totalOrders: 1,
            totalDiscount: 1,
            totalRevenue: 1,
            totalOriginalAmount: 1,
            uniqueCustomersCount: { $size: "$uniqueCustomers" },
            outletCount: { $size: "$usedOutlets" },
            avgOrderValue: { $round: ["$avgOrderValue", 2] },
            orderValueRange: {
              min: { $round: ["$minOrderValue", 2] },
              max: { $round: ["$maxOrderValue", 2] }
            },
            // Insightful Calculations
            discountEffectiveness: {
              $cond: [
                { $eq: ["$totalRevenue", 0] },
                0,
                { $round: [{ $multiply: [{ $divide: ["$totalDiscount", "$totalRevenue"] }, 100] }, 2] }
              ]
            },
            revenueLift: {
              $cond: [
                { $eq: ["$totalOriginalAmount", 0] },
                0,
                { $round: [{ $multiply: [{ $divide: [{ $subtract: ["$totalRevenue", "$totalOriginalAmount"] }, "$totalOriginalAmount"] }, 100] }, 2] }
              ]
            },
            avgDiscountPerOrder: {
              $cond: [
                { $eq: ["$totalOrders", 0] },
                0,
                { $round: [{ $divide: ["$totalDiscount", "$totalOrders"] }, 2] }
              ]
            },
            customerAcquisitionRate: {
              $cond: [
                { $eq: ["$totalOrders", 0] },
                0,
                { $round: [{ $multiply: [{ $divide: [{ $size: "$uniqueCustomers" }, "$totalOrders"] }, 100] }, 2] }
              ]
            },
            // Performance Indicators
            performanceScore: {
              $add: [
                { $multiply: [{ $divide: ["$totalOrders", 100] }, 25] }, // Usage weight 25%
                { $multiply: [{ $divide: ["$discountEffectiveness", 100] }, 35] }, // Effectiveness weight 35%
                { $multiply: [{ $divide: ["$revenueLift", 100] }, 40] } // Revenue lift weight 40%
              ]
            },
            status: {
              $switch: {
                branches: [
                  { case: { $and: [{ $gte: ["$performanceScore", 80] }, { $gte: ["$totalOrders", 10] }] }, then: "EXCELLENT" },
                  { case: { $and: [{ $gte: ["$performanceScore", 60] }, { $gte: ["$totalOrders", 5] }] }, then: "GOOD" },
                  { case: { $and: [{ $gte: ["$performanceScore", 40] }, { $gte: ["$totalOrders", 3] }] }, then: "AVERAGE" },
                  { case: { $lt: ["$totalOrders", 3] }, then: "LOW_USAGE" }
                ],
                default: "POOR"
              }
            }
          }
        },
        { $sort: { performanceScore: -1 } }
      ]);

      // Additional insights calculation
      const totalPromoOrders = data.reduce((sum, promo) => sum + promo.totalOrders, 0);
      const totalPromoDiscount = data.reduce((sum, promo) => sum + promo.totalDiscount, 0);
      const totalPromoRevenue = data.reduce((sum, promo) => sum + promo.totalRevenue, 0);
      
      const insights = {
        summary: {
          totalPromosAnalyzed: data.length,
          totalPromoOrders,
          totalPromoDiscount,
          totalPromoRevenue,
          averageEffectiveness: data.length > 0 ? 
            data.reduce((sum, promo) => sum + promo.discountEffectiveness, 0) / data.length : 0,
          averagePerformanceScore: data.length > 0 ?
            data.reduce((sum, promo) => sum + promo.performanceScore, 0) / data.length : 0
        },
        performanceBreakdown: {
          EXCELLENT: data.filter(p => p.status === 'EXCELLENT').length,
          GOOD: data.filter(p => p.status === 'GOOD').length,
          AVERAGE: data.filter(p => p.status === 'AVERAGE').length,
          POOR: data.filter(p => p.status === 'POOR').length,
          LOW_USAGE: data.filter(p => p.status === 'LOW_USAGE').length
        },
        topPerformers: {
          mostUsed: data[0] || null,
          mostEffective: [...data].sort((a, b) => b.discountEffectiveness - a.discountEffectiveness)[0] || null,
          highestRevenue: [...data].sort((a, b) => b.totalRevenue - a.totalRevenue)[0] || null,
          bestROI: [...data].sort((a, b) => b.revenueLift - a.revenueLift)[0] || null
        },
        recommendations: AnalyticsRecommendationService.generatePromoRecommendations(data)
      };

      res.json({ 
        success: true, 
        data,
        insights,
        metadata: {
          totalCount: data.length,
          period: { startDate, endDate },
          filters: { minUsage, outletId, customerType }
        }
      });
    } catch (err) {
      console.error('Promo Usage Analytics Error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to analyze promo usage',
        error: err.message 
      });
    }
  },

  /**
   * 2. Voucher Usage & Redemption Rate dengan insight yang lebih baik
   */
  async voucherUsage(req, res) {
    try {
      const { minRedemption = 0, sortBy = 'redemptionRate', status, outletId } = req.query;
      
      const matchStage = {};
      if (status) matchStage.status = status;
      if (outletId) {
        matchStage.applicableOutlets = outletId;
      }

      const data = await Voucher.aggregate([
        { $match: matchStage },
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
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "creator"
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
            minOrderAmount: 1,
            maxDiscountAmount: 1,
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
            // Usage Metrics
            usedCount: { $size: "$usedOrders" },
            remainingQuota: { $subtract: ["$quota", { $size: "$usedOrders" }] },
            totalDiscount: {
              $sum: "$usedOrders.discounts.voucherDiscount"
            },
            totalRevenue: {
              $sum: "$usedOrders.grandTotal"
            },
            totalOriginalAmount: {
              $sum: "$usedOrders.totalBeforeDiscount"
            },
            uniqueCustomers: {
              $reduce: {
                input: "$usedOrders",
                initialValue: [],
                in: { $setUnion: ["$$value", ["$$this.user_id"]] }
              }
            },
            // Insightful Calculations
            avgOrderValue: {
              $cond: [
                { $gt: [{ $size: "$usedOrders" }, 0] },
                { $round: [{ $divide: [{ $sum: "$usedOrders.grandTotal" }, { $size: "$usedOrders" }] }, 2] },
                0
              ]
            },
            redemptionRate: {
              $cond: [
                { $eq: ["$quota", 0] },
                0,
                { $round: [{ $multiply: [{ $divide: [{ $size: "$usedOrders" }, "$quota"] }, 100] }, 2] }
              ]
            },
            discountEfficiency: {
              $cond: [
                { $eq: ["$totalRevenue", 0] },
                0,
                { $round: [{ $multiply: [{ $divide: ["$totalDiscount", "$totalRevenue"] }, 100] }, 2] }
              ]
            },
            revenueImpact: {
              $cond: [
                { $eq: ["$totalOriginalAmount", 0] },
                0,
                { $round: [{ $multiply: [{ $divide: [{ $subtract: ["$totalRevenue", "$totalOriginalAmount"] }, "$totalOriginalAmount"] }, 100] }, 2] }
              ]
            },
            avgDiscountPerUse: {
              $cond: [
                { $eq: [{ $size: "$usedOrders" }, 0] },
                0,
                { $round: [{ $divide: ["$totalDiscount", { $size: "$usedOrders" }] }, 2] }
              ]
            },
            customerReach: { $size: "$uniqueCustomers" },
            usagePerCustomer: {
              $cond: [
                { $eq: [{ $size: "$uniqueCustomers" }, 0] },
                0,
                { $round: [{ $divide: [{ $size: "$usedOrders" }, { $size: "$uniqueCustomers" }] }, 2] }
              ]
            },
            // Performance Scoring
            performanceScore: {
              $add: [
                { $multiply: ["$redemptionRate", 0.4] }, // 40% weight to redemption rate
                { $multiply: ["$revenueImpact", 0.3] }, // 30% weight to revenue impact
                { $multiply: [{ $divide: ["$usedCount", 100] }, 30] } // 30% weight to usage count
              ]
            },
            // Status Assessment
            status: {
              $switch: {
                branches: [
                  { 
                    case: { $and: [
                      { $gte: ["$performanceScore", 80] },
                      { $gte: ["$usedCount", 20] }
                    ]},
                    then: "HIGH_PERFORMANCE"
                  },
                  { 
                    case: { $and: [
                      { $gte: ["$redemptionRate", 70] },
                      { $gte: ["$usedCount", 10] }
                    ]},
                    then: "HIGH_DEMAND"
                  },
                  { 
                    case: { $and: [
                      { $gt: ["$usedCount", 0] },
                      { $lt: ["$redemptionRate", 20] }
                    ]},
                    then: "LOW_PERFORMANCE"
                  },
                  { 
                    case: { $eq: ["$usedCount", 0] },
                    then: "UNUSED"
                  },
                  {
                    case: { $and: [
                      { $lt: ["$remainingQuota", 5] },
                      { $gt: ["$usedCount", 0] }
                    ]},
                    then: "NEARLY_DEPLETED"
                  }
                ],
                default: "NORMAL"
              }
            },
            daysRemaining: {
              $cond: [
                { $and: ["$validTo", { $ne: ["$validTo", null] }] },
                { $ceil: { $divide: [{ $subtract: ["$validTo", new Date()] }, 1000 * 60 * 60 * 24] } },
                null
              ]
            },
            isExpired: {
              $cond: [
                { $and: ["$validTo", { $lt: [new Date(), "$validTo"] }] },
                false,
                true
              ]
            },
            utilizationHealth: {
              $cond: [
                { $eq: ["$quota", 0] },
                "NO_QUOTA",
                { $switch: {
                  branches: [
                    { case: { $gte: ["$redemptionRate", 80] }, then: "OVER_UTILIZED" },
                    { case: { $gte: ["$redemptionRate", 50] }, then: "OPTIMAL" },
                    { case: { $gte: ["$redemptionRate", 20] }, then: "UNDER_UTILIZED" }
                  ],
                  default: "POOR_UTILIZATION"
                }}
              ]
            }
          }
        },
        { $match: { usedCount: { $gte: parseInt(minRedemption) } } },
        { $sort: { [sortBy]: -1 } }
      ]);

      // Generate comprehensive insights
      const activeVouchers = data.filter(v => v.isActive && !v.isExpired);
      const expiredVouchers = data.filter(v => v.isExpired);
      const highPerforming = data.filter(v => v.status === 'HIGH_PERFORMANCE');
      const unusedVouchers = data.filter(v => v.status === 'UNUSED');
      
      const insights = {
        summary: {
          totalVouchers: data.length,
          activeVouchers: activeVouchers.length,
          expiredVouchers: expiredVouchers.length,
          highPerformingVouchers: highPerforming.length,
          unusedVouchers: unusedVouchers.length,
          totalRedemptions: data.reduce((sum, v) => sum + v.usedCount, 0),
          totalDiscountGiven: data.reduce((sum, v) => sum + v.totalDiscount, 0),
          totalRevenueGenerated: data.reduce((sum, v) => sum + v.totalRevenue, 0),
          averageRedemptionRate: data.length > 0 ? 
            data.reduce((sum, v) => sum + v.redemptionRate, 0) / data.length : 0,
          averagePerformanceScore: data.length > 0 ?
            data.reduce((sum, v) => sum + v.performanceScore, 0) / data.length : 0
        },
        performanceBreakdown: {
          byStatus: {
            HIGH_PERFORMANCE: highPerforming.length,
            HIGH_DEMAND: data.filter(v => v.status === 'HIGH_DEMAND').length,
            NORMAL: data.filter(v => v.status === 'NORMAL').length,
            LOW_PERFORMANCE: data.filter(v => v.status === 'LOW_PERFORMANCE').length,
            UNUSED: unusedVouchers.length,
            NEARLY_DEPLETED: data.filter(v => v.status === 'NEARLY_DEPLETED').length
          },
          byUtilization: {
            OVER_UTILIZED: data.filter(v => v.utilizationHealth === 'OVER_UTILIZED').length,
            OPTIMAL: data.filter(v => v.utilizationHealth === 'OPTIMAL').length,
            UNDER_UTILIZED: data.filter(v => v.utilizationHealth === 'UNDER_UTILIZED').length,
            POOR_UTILIZATION: data.filter(v => v.utilizationHealth === 'POOR_UTILIZATION').length
          }
        },
        topPerformers: {
          mostRedeemed: [...data].sort((a, b) => b.usedCount - a.usedCount).slice(0, 5),
          highestRevenue: [...data].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5),
          bestROI: [...data].sort((a, b) => b.revenueImpact - a.revenueImpact).slice(0, 5)
        },
        alerts: AnalyticsRecommendationService.generateVoucherAlerts(data),
        recommendations: AnalyticsRecommendationService.generateVoucherRecommendations(data)
      };

      res.json({ 
        success: true, 
        data,
        insights,
        metadata: {
          totalCount: data.length,
          filters: { minRedemption, sortBy, status, outletId }
        }
      });
    } catch (err) {
      console.error('Voucher Usage Analytics Error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to analyze voucher usage',
        error: err.message 
      });
    }
  },

  /**
   * 3. Customer Segmentation berdasarkan Loyalty Level dengan insight yang lebih mendalam
   */
  async customerSegmentation(req, res) {
    try {
      const { segmentBy = 'loyalty', minOrders = 1, includeLoyaltyLevels = true } = req.query;
      
      // Get loyalty levels data
      const loyaltyLevels = await LoyaltyLevel.find().sort({ requiredPoints: 1 }).lean();
      
      // Simplified aggregation pipeline
      const customerData = await Order.aggregate([
        // Stage 1: Filter orders with valid users
        {
          $match: {
            user_id: { $ne: null, $exists: true }
          }
        },
        
        // Stage 2: Lookup user data
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user"
          }
        },
        
        // Stage 3: Unwind and filter valid users
        {
          $unwind: "$user"
        },
        {
          $match: {
            "user._id": { $ne: null }
          }
        },
        
        // Stage 4: Group by user to get customer metrics
        {
          $group: {
            _id: "$user_id",
            customerInfo: {
              $first: {
                userId: "$user._id",
                username: "$user.username",
                email: "$user.email",
                phone: "$user.phone",
                loyaltyLevel: "$user.loyaltyLevel",
                loyaltyPoints: "$user.loyaltyPoints",
                profilePicture: "$user.profilePicture",
                joinDate: "$user.createdAt",
                lastLogin: "$user.lastLogin",
                isActive: "$user.isActive"
              }
            },
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$grandTotal" },
            avgOrderValue: { $avg: "$grandTotal" },
            minOrderValue: { $min: "$grandTotal" },
            maxOrderValue: { $max: "$grandTotal" },
            promoUsageCount: { 
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $ne: ["$appliedPromos", null] },
                      { $ne: ["$appliedPromos", []] }
                    ]
                  }, 
                  1, 
                  0
                ]
              }
            },
            voucherUsageCount: {
              $sum: { 
                $cond: [
                  { $ne: ["$appliedVoucher", null] }, 
                  1, 
                  0
                ]
              }
            },
            totalDiscountUsed: {
              $sum: {
                $add: [
                  { $ifNull: ["$discounts.autoPromoDiscount", 0] },
                  { $ifNull: ["$discounts.voucherDiscount", 0] },
                  { $ifNull: ["$discounts.manualDiscount", 0] }
                ]
              }
            },
            firstOrderDate: { $min: "$createdAt" },
            lastOrderDate: { $max: "$createdAt" }
          }
        },
        
        // Stage 5: Filter by minimum orders
        {
          $match: {
            totalOrders: { $gte: parseInt(minOrders) },
            _id: { $ne: null }
          }
        },
        
        // Stage 6: Add calculated fields
        {
          $addFields: {
            // Customer behavior metrics
            customerTenure: {
              $cond: [
                { $ne: ["$firstOrderDate", null] },
                {
                  $divide: [
                    { $subtract: [new Date(), "$firstOrderDate"] },
                    1000 * 60 * 60 * 24 // Convert to days
                  ]
                },
                0
              ]
            },
            daysSinceLastOrder: {
              $cond: [
                { $ne: ["$lastOrderDate", null] },
                {
                  $divide: [
                    { $subtract: [new Date(), "$lastOrderDate"] },
                    1000 * 60 * 60 * 24
                  ]
                },
                999 // Large number for customers without orders
              ]
            },
            orderFrequency: {
              $cond: [
                { $gt: ["$customerTenure", 0] },
                { $divide: ["$totalOrders", "$customerTenure"] },
                0
              ]
            }
          }
        }
      ]);

      console.log(`Processed ${customerData.length} valid customers`);
      
      // Calculate loyalty levels for each customer
      const customersWithLoyalty = customerData.map(customer => {
        const points = customer.customerInfo.loyaltyPoints || 0;
        const calculatedLoyaltyLevel = CustomerSegmentationService.determineLoyaltyLevelByPoints(points, loyaltyLevels);
        
        return {
          ...customer,
          calculatedLoyaltyLevel
        };
      });

      // Enhanced segmentation based on loyalty levels
      const segments = includeLoyaltyLevels ? 
        CustomerSegmentationService.segmentByLoyaltyLevel(customersWithLoyalty, loyaltyLevels) : 
        CustomerSegmentationService.segmentCustomers(customersWithLoyalty, segmentBy);
      
      // Calculate segment insights
      const segmentInsights = CustomerSegmentationService.calculateSegmentInsights(segments);
      
      // Customer lifetime value calculation
      const clvAnalysis = CustomerSegmentationService.calculateCLV(customersWithLoyalty);

      // Loyalty program effectiveness
      const loyaltyEffectiveness = CustomerSegmentationService.analyzeLoyaltyEffectiveness(customersWithLoyalty, loyaltyLevels);

      res.json({
        success: true,
        data: {
          segments,
          loyaltyLevels: includeLoyaltyLevels ? loyaltyLevels : undefined,
          insights: segmentInsights,
          clvAnalysis,
          loyaltyEffectiveness,
          summary: {
            totalCustomers: customersWithLoyalty.length,
            segmentedCustomers: segments.reduce((sum, seg) => sum + seg.customers.length, 0),
            averageCLV: clvAnalysis.averageCLV,
            retentionRate: CustomerSegmentationService.calculateRetentionRate(customersWithLoyalty),
            loyaltyDistribution: CustomerSegmentationService.getLoyaltyDistribution(customersWithLoyalty, loyaltyLevels)
          }
        }
      });
    } catch (err) {
      console.error('Customer Segmentation Analytics Error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze customer segmentation',
        error: err.message
      });
    }
  },

  /**
   * 4. Loyalty Program Performance Analysis
   */
  async loyaltyPerformance(req, res) {
    try {
      const { period = 'month' } = req.query;
      
      // Get loyalty levels and program data
      const [loyaltyLevels, loyaltyProgram, customerActivities] = await Promise.all([
        LoyaltyLevel.find().sort({ requiredPoints: 1 }).lean(),
        LoyaltyProgram.findOne({ isActive: true }).lean(),
        LoyaltyAnalyticsService.getLoyaltyCustomerActivities(period)
      ]);

      const analysis = {
        programOverview: loyaltyProgram,
        levelPerformance: LoyaltyAnalyticsService.analyzeLevelPerformance(loyaltyLevels, customerActivities),
        customerJourney: LoyaltyAnalyticsService.analyzeCustomerJourney(customerActivities, loyaltyLevels),
        pointsEconomics: LoyaltyAnalyticsService.analyzePointsEconomics(customerActivities, loyaltyProgram),
        recommendations: LoyaltyAnalyticsService.generateLoyaltyRecommendations(loyaltyLevels, customerActivities)
      };

      res.json({
        success: true,
        data: analysis,
        period
      });
    } catch (err) {
      console.error('Loyalty Performance Analytics Error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze loyalty program performance',
        error: err.message
      });
    }
  },

  /**
   * 5. Revenue Impact Analysis
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
   * 6. Outlet & Source Effectiveness
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

  async mainCategoryAnalytics(req, res) {
    try {
      await CategoryAnalyticsService.getMainCategoryAnalytics(req, res);
    } catch (err) {
      console.error('Main Category Analytics Error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze main categories',
        error: err.message
      });
    }
  },

  /**
   * 9. Category Trends Analysis
   */
  async categoryTrends(req, res) {
    try {
      await CategoryAnalyticsService.getCategoryTrends(req, res);
    } catch (err) {
      console.error('Category Trends Analytics Error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze category trends',
        error: err.message
      });
    }
  },

  /**
   * 10. Top Items by Category
   */
  async topItemsByCategory(req, res) {
    try {
      await CategoryAnalyticsService.getTopItemsByCategory(req, res);
    } catch (err) {
      console.error('Top Items Analytics Error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze top items by category',
        error: err.message
      });
    }
  },

  /**
   * 11. Category Performance Comparison
   */
  async categoryComparison(req, res) {
    try {
      await CategoryAnalyticsService.getCategoryComparison(req, res);
    } catch (err) {
      console.error('Category Comparison Analytics Error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze category comparison',
        error: err.message
      });
    }
  }
};

export default AnalyticsController;