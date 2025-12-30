use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ProductMovementType {
    In,
    Out,
    Adjustment,
    Transfer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductMovement {
    pub quantity: f64,
    
    #[serde(rename = "type")]
    pub movement_type: ProductMovementType,
    
    #[serde(rename = "referenceId", skip_serializing_if = "Option::is_none")]
    pub reference_id: Option<ObjectId>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    
    #[serde(rename = "sourceWarehouse", skip_serializing_if = "Option::is_none")]
    pub source_warehouse: Option<ObjectId>,
    
    #[serde(rename = "destinationWarehouse", skip_serializing_if = "Option::is_none")]
    pub destination_warehouse: Option<ObjectId>,
    
    #[serde(rename = "handledBy", skip_serializing_if = "Option::is_none")]
    pub handled_by: Option<String>,
    
    #[serde(default = "Utc::now")]
    pub date: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductStock {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "productId")]
    pub product_id: ObjectId,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    
    #[serde(rename = "currentStock", default)]
    pub current_stock: f64,
    
    #[serde(rename = "minStock", default)]
    pub min_stock: f64,
    
    pub warehouse: ObjectId,
    
    #[serde(default)]
    pub movements: Vec<ProductMovement>,
    
    #[serde(rename = "version", default)]
    pub version: i32,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}
