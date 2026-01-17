use bson::oid::ObjectId;
// No longer using chrono here
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub name: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub category_type: Option<String>,
    
    #[serde(rename = "parentCategory", default, skip_serializing_if = "Option::is_none")]
    pub parent_category: Option<ObjectId>,
    
    #[serde(rename = "lastUpdated", default = "mongodb::bson::DateTime::now")]
    pub last_updated: mongodb::bson::DateTime,
    
    #[serde(rename = "lastUpdatedBy", skip_serializing_if = "Option::is_none")]
    pub last_updated_by: Option<ObjectId>,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}
