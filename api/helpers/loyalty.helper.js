// helpers/loyalty.helper.js
import LoyaltyProgram from '../models/LoyaltyProgram.model.js';
import LoyaltyLevel from '../models/LoyaltyLevel.model.js';
import CustomerLoyalty from '../models/CustomerLoyalty.model.js';

/**
 * Calculate loyalty points for an order
 */
export async function calculateLoyaltyPoints(orderAmount, customerId, outletId, session) {
  try {
    if (!customerId) {
      return { pointsEarned: 0, loyaltyDetails: null };
    }

    // Find active loyalty program for the outlet
    const loyaltyProgram = await LoyaltyProgram.findOne({
      isActive: true,
      $or: [
        { outlet: outletId },
        { outlet: { $exists: false } }
      ]
    }).session(session);

    if (!loyaltyProgram) {
      return { pointsEarned: 0, loyaltyDetails: null };
    }

    // Get customer loyalty data
    let customerLoyalty = await CustomerLoyalty.findOne({
      customer: customerId,
      loyaltyProgram: loyaltyProgram._id
    }).session(session);

    // Calculate base points
    const basePoints = Math.floor(orderAmount / loyaltyProgram.pointsPerRp);
    
    // Check for first transaction bonus
    let bonusPoints = 0;
    let isFirstTransaction = false;

    if (!customerLoyalty) {
      // Create new customer loyalty record
      customerLoyalty = new CustomerLoyalty({
        customer: customerId,
        loyaltyProgram: loyaltyProgram._id,
        currentPoints: loyaltyProgram.registrationPoints,
        totalPointsEarned: loyaltyProgram.registrationPoints,
        isFirstTransaction: true,
        transactionCount: 0
      });
      await customerLoyalty.save({ session });
    }

    if (customerLoyalty.isFirstTransaction) {
      bonusPoints = loyaltyProgram.firstTransactionPoints;
      isFirstTransaction = true;
      customerLoyalty.isFirstTransaction = false;
    }

    const totalPointsEarned = basePoints + bonusPoints;

    // Update customer loyalty
    customerLoyalty.currentPoints += totalPointsEarned;
    customerLoyalty.totalPointsEarned += totalPointsEarned;
    customerLoyalty.transactionCount += 1;
    customerLoyalty.lastTransactionDate = new Date();

    // Check and update loyalty level
    const newLevel = await updateLoyaltyLevel(customerLoyalty, session);
    
    await customerLoyalty.save({ session });

    return {
      pointsEarned: totalPointsEarned,
      loyaltyDetails: {
        basePoints,
        bonusPoints,
        isFirstTransaction,
        currentLevel: newLevel,
        totalPoints: customerLoyalty.currentPoints,
        programName: loyaltyProgram.name
      }
    };
  } catch (error) {
    console.error('Error calculating loyalty points:', error);
    return { pointsEarned: 0, loyaltyDetails: null };
  }
}

/**
 * Update customer loyalty level based on points
 */
async function updateLoyaltyLevel(customerLoyalty, session) {
  const levels = await LoyaltyLevel.find()
    .sort({ requiredPoints: 1 })
    .session(session);

  let newLevel = null;
  
  for (const level of levels) {
    if (customerLoyalty.currentPoints >= level.requiredPoints) {
      newLevel = level;
    } else {
      break;
    }
  }

  // Check if level changed and add bonus points
  if (newLevel && 
      (!customerLoyalty.currentLevel || 
       !newLevel._id.equals(customerLoyalty.currentLevel))) {
    
    if (newLevel.levelUpBonusPoints > 0) {
      customerLoyalty.currentPoints += newLevel.levelUpBonusPoints;
      customerLoyalty.totalPointsEarned += newLevel.levelUpBonusPoints;
    }
    
    customerLoyalty.currentLevel = newLevel._id;
  }

  return newLevel;
}

/**
 * Redeem loyalty points for discount
 */
export async function redeemLoyaltyPoints(customerId, pointsToRedeem, outletId, session) {
  try {
    if (!customerId || pointsToRedeem <= 0) {
      return { discountAmount: 0, pointsUsed: 0 };
    }

    const loyaltyProgram = await LoyaltyProgram.findOne({
      isActive: true,
      $or: [
        { outlet: outletId },
        { outlet: { $exists: false } }
      ]
    }).session(session);

    if (!loyaltyProgram) {
      return { discountAmount: 0, pointsUsed: 0 };
    }

    const customerLoyalty = await CustomerLoyalty.findOne({
      customer: customerId,
      loyaltyProgram: loyaltyProgram._id
    }).session(session);

    if (!customerLoyalty || customerLoyalty.currentPoints < pointsToRedeem) {
      return { discountAmount: 0, pointsUsed: 0 };
    }

    // Calculate discount amount
    const discountAmount = pointsToRedeem * loyaltyProgram.discountValuePerPoint;
    
    // Update customer loyalty points
    customerLoyalty.currentPoints -= pointsToRedeem;
    customerLoyalty.totalPointsRedeemed += pointsToRedeem;
    await customerLoyalty.save({ session });

    return {
      discountAmount,
      pointsUsed: pointsToRedeem,
      remainingPoints: customerLoyalty.currentPoints
    };
  } catch (error) {
    console.error('Error redeeming loyalty points:', error);
    return { discountAmount: 0, pointsUsed: 0 };
  }
}

/**
 * Check available loyalty points for customer
 */
export async function getCustomerLoyaltyPoints(customerId, outletId, session) {
  try {
    if (!customerId) {
      return { availablePoints: 0, currentLevel: null };
    }

    const loyaltyProgram = await LoyaltyProgram.findOne({
      isActive: true,
      $or: [
        { outlet: outletId },
        { outlet: { $exists: false } }
      ]
    }).session(session);

    if (!loyaltyProgram) {
      return { availablePoints: 0, currentLevel: null };
    }

    const customerLoyalty = await CustomerLoyalty.findOne({
      customer: customerId,
      loyaltyProgram: loyaltyProgram._id
    })
    .populate('currentLevel')
    .session(session);

    if (!customerLoyalty) {
      return { availablePoints: 0, currentLevel: null };
    }

    return {
      availablePoints: customerLoyalty.currentPoints,
      currentLevel: customerLoyalty.currentLevel,
      totalEarned: customerLoyalty.totalPointsEarned,
      totalRedeemed: customerLoyalty.totalPointsRedeemed
    };
  } catch (error) {
    console.error('Error getting customer loyalty points:', error);
    return { availablePoints: 0, currentLevel: null };
  }
}