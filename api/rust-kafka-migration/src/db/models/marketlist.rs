use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PaymentMethod {
    Cash,
    Card,
    Transfer,
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PaymentStatus {
    Paid,
    Unpaid,
    Partial,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub method: PaymentMethod,
    
    #[serde(default = "default_payment_status")]
    pub status: PaymentStatus,
    
    #[serde(rename = "bankFrom", skip_serializing_if = "Option::is_none")]
    pub bank_from: Option<String>,
    
    #[serde(rename = "bankTo", skip_serializing_if = "Option::is_none")]
    pub bank_to: Option<String>,
    
    #[serde(rename = "recipientName", skip_serializing_if = "Option::is_none")]
    pub recipient_name: Option<String>,
    
    #[serde(rename = "proofOfPayment", skip_serializing_if = "Option::is_none")]
    pub proof_of_payment: Option<String>,
    
    pub notes: Option<String>,
    pub amount: f64,
    
    #[serde(rename = "amountPhysical", default)]
    pub amount_physical: f64,
    
    #[serde(rename = "amountNonPhysical", default)]
    pub amount_non_physical: f64,
    
    #[serde(default = "Utc::now")]
    pub date: DateTime<Utc>,
}

fn default_payment_status() -> PaymentStatus {
    PaymentStatus::Unpaid
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MarketListPurpose {
    Replenish,
    DirectPurchase,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketListItem {
    #[serde(rename = "productId")]
    pub product_id: ObjectId,
    
    #[serde(rename = "productName")]
    pub product_name: String,
    
    #[serde(rename = "productSku")]
    pub product_sku: String,
    
    pub category: String,
    pub unit: String,
    
    #[serde(rename = "quantityRequested")]
    pub quantity_requested: f64,
    
    #[serde(rename = "quantityPurchased", default)]
    pub quantity_purchased: f64,
    
    #[serde(rename = "pricePerUnit")]
    pub price_per_unit: f64,
    
    #[serde(rename = "supplierId", skip_serializing_if = "Option::is_none")]
    pub supplier_id: Option<ObjectId>,
    
    #[serde(rename = "supplierName")]
    pub supplier_name: String,
    
    pub warehouse: ObjectId,
    
    #[serde(rename = "amountCharged", default)]
    pub amount_charged: f64,
    
    #[serde(rename = "amountPaid", default)]
    pub amount_paid: f64,
    
    #[serde(rename = "remainingBalance", default)]
    pub remaining_balance: f64,
    
    pub payment: Option<Payment>,
    
    #[serde(rename = "requestId", skip_serializing_if = "Option::is_none")]
    pub request_id: Option<ObjectId>,
    
    #[serde(rename = "requestItemId", skip_serializing_if = "Option::is_none")]
    pub request_item_id: Option<String>,
    
    #[serde(default = "default_market_list_purpose")]
    pub purpose: MarketListPurpose,
}

fn default_market_list_purpose() -> MarketListPurpose {
    MarketListPurpose::DirectPurchase
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdditionalExpense {
    pub name: String,
    pub amount: f64,
    pub notes: Option<String>,
    pub payment: Option<Payment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketList {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(default = "Utc::now")]
    pub date: DateTime<Utc>,
    
    pub day: Option<String>,
    pub items: Vec<MarketListItem>,
    
    #[serde(rename = "additionalExpenses", default)]
    pub additional_expenses: Vec<AdditionalExpense>,
    
    #[serde(rename = "relatedRequests", default)]
    pub related_requests: Vec<ObjectId>,
    
    #[serde(rename = "createdBy")]
    pub created_by: String,
    
    #[serde(default = "default_market_list_purpose")]
    pub purpose: MarketListPurpose,
    
    #[serde(rename = "totalCharged", default)]
    pub total_charged: f64,
    
    #[serde(rename = "totalPaid", default)]
    pub total_paid: f64,
    
    #[serde(rename = "totalPhysical", default)]
    pub total_physical: f64,
    
    #[serde(rename = "totalNonPhysical", default)]
    pub total_non_physical: f64,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}
