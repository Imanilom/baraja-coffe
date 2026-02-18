use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Area {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,

    pub area_name: String,
    pub area_code: String,

    #[serde(default)]
    pub capacity: i32,

    #[serde(default = "default_true")]
    pub is_active: bool,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_true() -> bool {
    true
}

impl Area {
    pub fn new(area_name: String, area_code: String, capacity: i32) -> Self {
        let now = Utc::now();
        Self {
            id: None,
            area_name,
            area_code,
            capacity,
            is_active: true,
            description: None,
            created_at: Some(now),
            updated_at: Some(now),
        }
    }
}
