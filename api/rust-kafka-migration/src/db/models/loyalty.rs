use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LoyaltyProgram {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "consumerType", default = "default_consumer_type")]
    pub consumer_type: String,
    #[serde(rename = "pointsPerRp", default = "default_points_per_rp")]
    pub points_per_rp: f64,
    #[serde(rename = "registrationPoints", default = "default_registration_points")]
    pub registration_points: f64,
    #[serde(rename = "firstTransactionPoints", default = "default_first_transaction_points")]
    pub first_transaction_points: f64,
    #[serde(rename = "pointsToDiscountRatio", default = "default_points_to_discount_ratio")]
    pub points_to_discount_ratio: f64,
    #[serde(rename = "discountValuePerPoint", default = "default_discount_value_per_point")]
    pub discount_value_per_point: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub outlet: Option<ObjectId>,
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_consumer_type() -> String { "member".to_string() }
fn default_points_per_rp() -> f64 { 100.0 }
fn default_registration_points() -> f64 { 50.0 }
fn default_first_transaction_points() -> f64 { 100.0 }
fn default_points_to_discount_ratio() -> f64 { 100.0 }
fn default_discount_value_per_point() -> f64 { 50.0 }
fn default_true() -> bool { true }

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LoyaltyLevel {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub name: String,
    #[serde(rename = "requiredPoints", default)]
    pub required_points: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "pointsPerCurrency", default = "default_points_per_currency")]
    pub points_per_currency: f64,
    #[serde(rename = "currencyUnit", default = "default_currency_unit")]
    pub currency_unit: f64,
    #[serde(rename = "levelUpBonusPoints", default)]
    pub level_up_bonus_points: f64,
    #[serde(default)]
    pub benefits: Vec<String>,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_points_per_currency() -> f64 { 1.0 }
fn default_currency_unit() -> f64 { 1000.0 }

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomerLoyalty {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub customer: ObjectId,
    #[serde(rename = "loyaltyProgram")]
    pub loyalty_program: ObjectId,
    #[serde(rename = "currentPoints", default)]
    pub current_points: f64,
    #[serde(rename = "totalPointsEarned", default)]
    pub total_points_earned: f64,
    #[serde(rename = "totalPointsRedeemed", default)]
    pub total_points_redeemed: f64,
    #[serde(rename = "currentLevel", skip_serializing_if = "Option::is_none")]
    pub current_level: Option<ObjectId>,
    #[serde(rename = "isFirstTransaction", default = "default_true")]
    pub is_first_transaction: bool,
    #[serde(rename = "lastTransactionDate", skip_serializing_if = "Option::is_none")]
    pub last_transaction_date: Option<DateTime<Utc>>,
    #[serde(rename = "transactionCount", default)]
    pub transaction_count: i32,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}
