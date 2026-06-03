use bson::oid::ObjectId;
// No longer using chrono here
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Supplier {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub name: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub address: Option<String>,
    
    #[serde(rename = "createdAt", default = "mongodb::bson::DateTime::now")]
    pub created_at: mongodb::bson::DateTime,
}
