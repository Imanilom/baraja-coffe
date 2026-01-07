use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Outlet {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub name: String,
    pub address: String,
    pub city: String,
    pub location: String,
    
    #[serde(rename = "contactNumber")]
    pub contact_number: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub admin: Option<ObjectId>,
    
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    
    #[serde(rename = "outletPictures", default = "default_outlet_pictures")]
    pub outlet_pictures: Vec<String>,
    
    #[serde(rename = "openTime")]
    pub open_time: String,
    
    #[serde(rename = "closeTime")]
    pub close_time: String,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

fn default_true() -> bool {
    true
}

fn default_outlet_pictures() -> Vec<String> {
    vec!["https://placehold.co/1920x1080/png".to_string()]
}
