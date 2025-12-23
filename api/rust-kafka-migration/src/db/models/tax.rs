use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TaxAndService {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "type", default = "default_tax_type")]
    pub kind: String, // 'tax', 'service'
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub percentage: Option<f64>,
    #[serde(rename = "fixedFee", skip_serializing_if = "Option::is_none")]
    pub fixed_fee: Option<f64>,
    #[serde(rename = "appliesToOutlets", default)]
    pub applies_to_outlets: Vec<ObjectId>,
    #[serde(rename = "appliesToMenuItems", default)]
    pub applies_to_menu_items: Vec<ObjectId>,
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_tax_type() -> String { "tax".to_string() }
fn default_true() -> bool { true }
