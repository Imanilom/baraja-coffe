use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RequestItemStatus {
    Approved,
    Fulfilled,
    Partial,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RequestType {
    Transfer,
    Purchase,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RequestStatus {
    Approved,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FulfillmentStatus {
    Pending,
    Partial,
    Fulfilled,
    Excess,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestItem {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "productId")]
    pub product_id: ObjectId,
    
    #[serde(rename = "productName")]
    pub product_name: String,
    
    #[serde(rename = "productSku")]
    pub product_sku: String,
    
    pub category: String,
    pub quantity: f64,
    pub unit: String,
    pub notes: Option<String>,
    
    #[serde(default = "default_item_status")]
    pub status: RequestItemStatus,
    
    #[serde(rename = "fulfilledQuantity", default)]
    pub fulfilled_quantity: f64,
    
    #[serde(rename = "availableStock", default)]
    pub available_stock: f64,
    
    #[serde(rename = "minimumRequest", default)]
    pub minimum_request: f64,
    
    #[serde(rename = "sourceWarehouse", skip_serializing_if = "Option::is_none")]
    pub source_warehouse: Option<ObjectId>,
    
    #[serde(rename = "destinationWarehouse", skip_serializing_if = "Option::is_none")]
    pub destination_warehouse: Option<ObjectId>,
    
    #[serde(rename = "processedAt", skip_serializing_if = "Option::is_none")]
    pub processed_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "processedBy", skip_serializing_if = "Option::is_none")]
    pub processed_by: Option<String>,
    
    #[serde(rename = "type", default = "default_request_type")]
    pub request_type: RequestType,
}

fn default_item_status() -> RequestItemStatus {
    RequestItemStatus::Approved
}

fn default_request_type() -> RequestType {
    RequestType::Transfer
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Request {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "requestedWarehouse")]
    pub requested_warehouse: ObjectId,
    
    pub requester: String,
    
    #[serde(rename = "transferItems", default)]
    pub transfer_items: Vec<RequestItem>,
    
    #[serde(rename = "purchaseItems", default)]
    pub purchase_items: Vec<RequestItem>,
    
    #[serde(default = "default_request_status")]
    pub status: RequestStatus,
    
    #[serde(rename = "fulfillmentStatus", default = "default_fulfillment_status")]
    pub fulfillment_status: FulfillmentStatus,
    
    #[serde(rename = "processedBy", skip_serializing_if = "Option::is_none")]
    pub processed_by: Option<String>,
    
    #[serde(rename = "processedAt", skip_serializing_if = "Option::is_none")]
    pub processed_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "reviewedBy", skip_serializing_if = "Option::is_none")]
    pub reviewed_by: Option<String>,
    
    #[serde(rename = "reviewedAt", skip_serializing_if = "Option::is_none")]
    pub reviewed_at: Option<mongodb::bson::DateTime>,
    
    #[serde(default = "mongodb::bson::DateTime::now")]
    pub date: mongodb::bson::DateTime,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

fn default_request_status() -> RequestStatus {
    RequestStatus::Approved
}

fn default_fulfillment_status() -> FulfillmentStatus {
    FulfillmentStatus::Pending
}
