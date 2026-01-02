use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Voucher {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub code: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "discountAmount")]
    pub discount_amount: f64,
    #[serde(rename = "discountType")]
    pub discount_type: String, // 'percentage', 'fixed'
    #[serde(rename = "validFrom")]
    pub valid_from: DateTime<Utc>,
    #[serde(rename = "validTo")]
    pub valid_to: DateTime<Utc>,
    pub quota: i32,
    #[serde(rename = "oneTimeUse", default)]
    pub one_time_use: bool,
    #[serde(rename = "usedBy", default)]
    pub used_by: Vec<VoucherUsage>,
    #[serde(rename = "applicableOutlets", default)]
    pub applicable_outlets: Vec<ObjectId>,
    #[serde(rename = "customerType")]
    pub customer_type: String,
    #[serde(rename = "printOnReceipt", default)]
    pub print_on_receipt: bool,
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_true() -> bool { true }

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VoucherUsage {
    #[serde(rename = "userId", skip_serializing_if = "Option::is_none")]
    pub user_id: Option<ObjectId>,
    #[serde(rename = "usedAt", default = "chrono::Utc::now")]
    pub used_at: DateTime<Utc>,
}
