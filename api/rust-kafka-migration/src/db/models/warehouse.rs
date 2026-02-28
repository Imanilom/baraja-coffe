use bson::oid::ObjectId;
// No longer using chrono here
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum WarehouseType {
    Central,
    Department,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Warehouse {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub code: String,
    pub name: String,
    
    #[serde(rename = "type")]
    pub warehouse_type: WarehouseType,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub admin: Option<ObjectId>,
    
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

fn default_true() -> bool {
    true
}
