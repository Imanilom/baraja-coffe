use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

/// Fingerprint model for device integration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Fingerprint {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    /// Reference to Employee
    pub employee: ObjectId,
    
    /// Device user ID (unique identifier for fingerprint device)
    #[serde(rename = "deviceUserId")]
    pub device_user_id: String,
    
    /// Fingerprint data (optional, may be stored on device only)
    #[serde(rename = "fingerprintData", skip_serializing_if = "Option::is_none")]
    pub fingerprint_data: Option<String>,
    
    /// Active status
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    
    /// Registration timestamp
    #[serde(rename = "registeredAt", skip_serializing_if = "Option::is_none")]
    pub registered_at: Option<mongodb::bson::DateTime>,
    
    /// Last sync timestamp
    #[serde(rename = "lastSyncAt", skip_serializing_if = "Option::is_none")]
    pub last_sync_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

fn default_true() -> bool {
    true
}

impl Fingerprint {
    pub fn new(employee: ObjectId, device_user_id: String) -> Self {
        Self {
            id: None,
            employee,
            device_user_id,
            fingerprint_data: None,
            is_active: true,
            registered_at: Some(mongodb::bson::DateTime::now()),
            last_sync_at: None,
            created_at: None,
            updated_at: None,
        }
    }
}

/// Raw fingerprint model for unmapped fingerprint data
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawFingerprint {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    /// Device user ID from fingerprint device
    #[serde(rename = "deviceUserId")]
    pub device_user_id: String,
    
    /// Raw fingerprint data
    #[serde(rename = "rawData")]
    pub raw_data: String,
    
    /// Mapped employee (if mapped)
    #[serde(rename = "mappedToEmployee", skip_serializing_if = "Option::is_none")]
    pub mapped_to_employee: Option<ObjectId>,
    
    /// Mapping status
    #[serde(rename = "isMapped", default)]
    pub is_mapped: bool,
    
    /// Capture timestamp
    #[serde(rename = "capturedAt", skip_serializing_if = "Option::is_none")]
    pub captured_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

impl RawFingerprint {
    pub fn new(device_user_id: String, raw_data: String) -> Self {
        Self {
            id: None,
            device_user_id,
            raw_data,
            mapped_to_employee: None,
            is_mapped: false,
            captured_at: Some(mongodb::bson::DateTime::now()),
            created_at: None,
            updated_at: None,
        }
    }
    
    pub fn map_to_employee(&mut self, employee_id: ObjectId) {
        self.mapped_to_employee = Some(employee_id);
        self.is_mapped = true;
    }
}
