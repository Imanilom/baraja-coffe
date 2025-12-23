use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ChangeType {
    ItemAdded,
    ItemRemoved,
    QuantityChanged,
    PriceAdjusted,
    DiscountApplied,
    CustomAmountAdded,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RevisionChange {
    #[serde(rename = "changeType")]
    pub change_type: ChangeType,
    
    #[serde(rename = "itemId", skip_serializing_if = "Option::is_none")]
    pub item_id: Option<ObjectId>,
    
    #[serde(rename = "oldValue", skip_serializing_if = "Option::is_none")]
    pub old_value: Option<serde_json::Value>,
    
    #[serde(rename = "newValue", skip_serializing_if = "Option::is_none")]
    pub new_value: Option<serde_json::Value>,
    
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderRevision {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "orderId")]
    pub order_id: ObjectId,
    
    #[serde(rename = "revisionNumber")]
    pub revision_number: i32,
    
    pub changes: Vec<RevisionChange>,
    
    pub reason: String,
    
    #[serde(rename = "createdBy")]
    pub created_by: ObjectId,
    
    #[serde(rename = "createdAt", default = "chrono::Utc::now")]
    pub created_at: DateTime<Utc>,
    
    #[serde(rename = "previousTotal", skip_serializing_if = "Option::is_none")]
    pub previous_total: Option<f64>,
    
    #[serde(rename = "newTotal", skip_serializing_if = "Option::is_none")]
    pub new_total: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaymentAdjustment {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "orderId")]
    pub order_id: ObjectId,
    
    #[serde(rename = "paymentId")]
    pub payment_id: ObjectId,
    
    #[serde(rename = "adjustmentAmount")]
    pub adjustment_amount: f64,
    
    pub reason: String,
    
    #[serde(rename = "adjustmentType")]
    pub adjustment_type: String, // refund, additional_charge
    
    #[serde(rename = "capturedAt", skip_serializing_if = "Option::is_none")]
    pub captured_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "createdBy")]
    pub created_by: ObjectId,
    
    #[serde(rename = "createdAt", default = "chrono::Utc::now")]
    pub created_at: DateTime<Utc>,
}
