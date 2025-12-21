use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ProductCategory {
    Food,
    Beverages,
    Packaging,
    Instan,
    Perlengkapan,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductSupplier {
    #[serde(rename = "supplierId")]
    pub supplier_id: ObjectId,
    
    #[serde(rename = "supplierName", skip_serializing_if = "Option::is_none")]
    pub supplier_name: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub price: Option<f64>,
    
    #[serde(rename = "lastPurchaseDate", skip_serializing_if = "Option::is_none")]
    pub last_purchase_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub sku: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub barcode: Option<String>,
    
    pub name: String,
    pub category: ProductCategory,
    pub unit: String,
    
    #[serde(default = "default_minimum_request")]
    pub minimumrequest: i32,
    
    #[serde(default = "default_limit_per_request")]
    pub limitperrequest: i32,
    
    #[serde(default)]
    pub suppliers: Vec<ProductSupplier>,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_minimum_request() -> i32 {
    1
}

fn default_limit_per_request() -> i32 {
    1
}
