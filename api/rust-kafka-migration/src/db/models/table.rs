use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TableStatus {
    Available,
    Occupied,
    Reserved,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusHistoryEntry {
    #[serde(rename = "fromStatus")]
    pub from_status: String,
    #[serde(rename = "toStatus")]
    pub to_status: String,
    #[serde(rename = "updatedBy")]
    pub updated_by: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Table {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,

    pub table_number: String,
    pub seats: i32,
    pub area_id: ObjectId,

    #[serde(default = "default_status")]
    pub status: TableStatus,

    #[serde(default = "default_true")]
    pub is_active: bool,

    #[serde(default = "default_true")]
    pub is_available: bool,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    #[serde(default, rename = "statusHistory")]
    pub status_history: Vec<StatusHistoryEntry>,

    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_status() -> TableStatus {
    TableStatus::Available
}

fn default_true() -> bool {
    true
}

impl Table {
    pub fn new(table_number: String, seats: i32, area_id: ObjectId) -> Self {
        let now = Utc::now();
        Self {
            id: None,
            table_number,
            seats,
            area_id,
            status: TableStatus::Available,
            is_active: true,
            is_available: true,
            description: None,
            status_history: Vec::new(),
            created_at: Some(now),
            updated_at: Some(now),
        }
    }

    pub fn add_status_history(
        &mut self,
        from_status: String,
        to_status: String,
        updated_by: String,
        notes: Option<String>,
    ) {
        self.status_history.push(StatusHistoryEntry {
            from_status,
            to_status,
            updated_by,
            notes,
            updated_at: Utc::now(),
        });
    }
}
