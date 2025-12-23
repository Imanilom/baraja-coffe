use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Device {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "deviceId")]
    pub device_id: String,
    
    pub outlet: ObjectId,
    
    pub role: String, // cashier senior, cashier junior, kitchen, bar, etc.
    
    pub location: String,
    
    #[serde(rename = "deviceName")]
    pub device_name: String,
    
    #[serde(rename = "assignedAreas", default)]
    pub assigned_areas: Vec<String>,
    
    #[serde(rename = "assignedTables", default)]
    pub assigned_tables: Vec<String>,
    
    #[serde(rename = "orderTypes", default)]
    pub order_types: Vec<String>,
    
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    
    #[serde(rename = "lastLogin", skip_serializing_if = "Option::is_none")]
    pub last_login: Option<DateTime<Utc>>,
    
    #[serde(rename = "createdAt", default = "chrono::Utc::now")]
    pub created_at: DateTime<Utc>,
    
    #[serde(rename = "updatedAt", default = "chrono::Utc::now")]
    pub updated_at: DateTime<Utc>,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeviceQuota {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub outlet: ObjectId,
    
    pub quotas: Vec<RoleQuota>,
    
    #[serde(rename = "createdAt", default = "chrono::Utc::now")]
    pub created_at: DateTime<Utc>,
    
    #[serde(rename = "updatedAt", default = "chrono::Utc::now")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RoleQuota {
    pub role: String,
    
    #[serde(rename = "maxDevices")]
    pub max_devices: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeviceSession {
    #[serde(rename = "deviceId")]
    pub device_id: String,
    
    #[serde(rename = "outletId")]
    pub outlet_id: ObjectId,
    
    #[serde(rename = "sessionId")]
    pub session_id: String,
    
    pub role: String,
    
    #[serde(rename = "deviceName")]
    pub device_name: String,
    
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
    
    #[serde(rename = "expiresAt")]
    pub expires_at: DateTime<Utc>,
}
