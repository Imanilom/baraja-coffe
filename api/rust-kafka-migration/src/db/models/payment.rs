use serde::{Deserialize, Serialize};
use mongodb::bson::{oid::ObjectId, DateTime, doc};
use serde_json::Value;
use crate::db::models::order::{VaNumber, PaymentAction};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payment {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub order_id: String,
    
    #[serde(rename = "payment_code", skip_serializing_if = "Option::is_none")]
    pub payment_code: Option<String>,
    
    #[serde(rename = "transaction_id", skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,
    
    pub method: String,
    
    #[serde(default = "default_status_pending")]
    pub status: String,
    
    #[serde(rename = "method_type", default)]
    pub method_type: Option<String>,
    
    #[serde(rename = "paymentType")]
    pub payment_type: String, // Down Payment, Final Payment, Full
    
    pub amount: f64,
    
    #[serde(rename = "totalAmount", skip_serializing_if = "Option::is_none")]
    pub total_amount: Option<f64>,
    
    #[serde(rename = "remainingAmount", default)]
    pub remaining_amount: f64,
    
    #[serde(rename = "relatedPaymentId", skip_serializing_if = "Option::is_none")]
    pub related_payment_id: Option<ObjectId>,
    
    pub phone: Option<String>,
    
    #[serde(default)]
    pub discount: f64,
    
    #[serde(rename = "midtransRedirectUrl", skip_serializing_if = "Option::is_none")]
    pub midtrans_redirect_url: Option<String>,
    
    #[serde(rename = "fraud_status", skip_serializing_if = "Option::is_none")]
    pub fraud_status: Option<String>,
    
    #[serde(rename = "transaction_time", skip_serializing_if = "Option::is_none")]
    pub transaction_time: Option<String>,
    
    #[serde(rename = "expiry_time", skip_serializing_if = "Option::is_none")]
    pub expiry_time: Option<String>,
    
    #[serde(rename = "settlement_time", skip_serializing_if = "Option::is_none")]
    pub settlement_time: Option<String>,
    
    #[serde(rename = "paidAt", skip_serializing_if = "Option::is_none")]
    pub paid_at: Option<DateTime>,
    
    #[serde(default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub va_numbers: Vec<VaNumber>,
    
    #[serde(rename = "permata_va_number", skip_serializing_if = "Option::is_none")]
    pub permata_va_number: Option<String>,
    
    #[serde(rename = "bill_key", skip_serializing_if = "Option::is_none")]
    pub bill_key: Option<String>,
    
    #[serde(rename = "biller_code", skip_serializing_if = "Option::is_none")]
    pub biller_code: Option<String>,
    
    #[serde(rename = "pdf_url", skip_serializing_if = "Option::is_none")]
    pub pdf_url: Option<String>,
    
    #[serde(default = "default_currency")]
    pub currency: String,
    
    #[serde(rename = "merchant_id", skip_serializing_if = "Option::is_none")]
    pub merchant_id: Option<String>,
    
    #[serde(rename = "signature_key", skip_serializing_if = "Option::is_none")]
    pub signature_key: Option<String>,
    
    #[serde(default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub actions: Vec<PaymentAction>,
    
    #[serde(rename = "raw_response", skip_serializing_if = "Option::is_none")]
    pub raw_response: Option<Value>,
    
    #[serde(rename = "isAdjustment", default)]
    pub is_adjustment: bool,
    
    pub direction: Option<String>, // charge, refund
    
    #[serde(rename = "revisionId", skip_serializing_if = "Option::is_none")]
    pub revision_id: Option<ObjectId>,
    
    #[serde(rename = "adjustmentId", skip_serializing_if = "Option::is_none")]
    pub adjustment_id: Option<ObjectId>,
    
    #[serde(rename = "tendered_amount", default)]
    pub tendered_amount: f64,
    
    #[serde(rename = "change_amount", default)]
    pub change_amount: f64,
    
    #[serde(rename = "processedExpiry", default)]
    pub processed_expiry: bool,
    
    #[serde(rename = "expiredAt", skip_serializing_if = "Option::is_none")]
    pub expired_at: Option<DateTime>,
    
    #[serde(rename = "orphanedAt", skip_serializing_if = "Option::is_none")]
    pub orphaned_at: Option<DateTime>,
    
    pub notes: Option<String>,
    
    #[serde(rename = "createdAt", default = "DateTime::now")]
    pub created_at: DateTime,
    
    #[serde(rename = "updatedAt", default = "DateTime::now")]
    pub updated_at: DateTime,
}

fn default_status_pending() -> String { "pending".to_string() }
fn default_currency() -> String { "IDR".to_string() }

impl Default for Payment {
    fn default() -> Self {
        Self {
            id: None,
            order_id: String::new(),
            payment_code: None,
            transaction_id: None,
            method: String::new(),
            status: default_status_pending(),
            method_type: None,
            payment_type: "Full".to_string(),
            amount: 0.0,
            total_amount: None,
            remaining_amount: 0.0,
            related_payment_id: None,
            phone: None,
            discount: 0.0,
            midtrans_redirect_url: None,
            fraud_status: None,
            transaction_time: None,
            expiry_time: None,
            settlement_time: None,
            paid_at: None,
            va_numbers: Vec::new(),
            permata_va_number: None,
            bill_key: None,
            biller_code: None,
            pdf_url: None,
            currency: default_currency(),
            merchant_id: None,
            signature_key: None,
            actions: Vec::new(),
            raw_response: None,
            is_adjustment: false,
            direction: None,
            revision_id: None,
            adjustment_id: None,
            tendered_amount: 0.0,
            change_amount: 0.0,
            processed_expiry: false,
            expired_at: None,
            orphaned_at: None,
            notes: None,
            created_at: DateTime::now(),
            updated_at: DateTime::now(),
        }
    }
}
