use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum TableStatus {
    Available,
    Occupied,
    Reserved,
    Cleaning,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Table {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub outlet: ObjectId,
    
    #[serde(rename = "tableNumber")]
    pub table_number: String,
    
    pub area: String, // A, B, C, etc.
    
    pub capacity: i32,
    
    pub status: TableStatus,
    
    #[serde(rename = "currentOrder", skip_serializing_if = "Option::is_none")]
    pub current_order: Option<ObjectId>,
    
    #[serde(rename = "occupiedAt", skip_serializing_if = "Option::is_none")]
    pub occupied_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "occupiedBy", skip_serializing_if = "Option::is_none")]
    pub occupied_by: Option<String>, // Customer name
    
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TableTransferHistory {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "orderId")]
    pub order_id: ObjectId,
    
    #[serde(rename = "fromTable")]
    pub from_table: String,
    
    #[serde(rename = "toTable")]
    pub to_table: String,
    
    pub reason: Option<String>,
    
    #[serde(rename = "transferredBy")]
    pub transferred_by: ObjectId, // User/Cashier ID
    
    #[serde(rename = "transferredAt", default = "chrono::Utc::now")]
    pub transferred_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ItemStatus {
    Pending,
    Preparing,
    Ready,
    Served,
    Cancelled,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorkstationItem {
    #[serde(rename = "itemId")]
    pub item_id: ObjectId,
    
    #[serde(rename = "menuItemName")]
    pub menu_item_name: String,
    
    pub quantity: i32,
    
    pub status: ItemStatus,
    
    #[serde(rename = "preparedBy", skip_serializing_if = "Option::is_none")]
    pub prepared_by: Option<ObjectId>,
    
    #[serde(rename = "startedAt", skip_serializing_if = "Option::is_none")]
    pub started_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "readyAt", skip_serializing_if = "Option::is_none")]
    pub ready_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "servedAt", skip_serializing_if = "Option::is_none")]
    pub served_at: Option<DateTime<Utc>>,
    
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrintQueue {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "orderId")]
    pub order_id: String,
    
    pub outlet: ObjectId,
    
    #[serde(rename = "printerId")]
    pub printer_id: ObjectId,
    
    pub workstation: String,
    
    #[serde(rename = "printData")]
    pub print_data: serde_json::Value,
    
    pub status: PrintQueueStatus,
    
    #[serde(rename = "attemptCount", default)]
    pub attempt_count: i32,
    
    #[serde(rename = "maxRetries", default = "default_max_retries")]
    pub max_retries: i32,
    
    #[serde(rename = "lastError", skip_serializing_if = "Option::is_none")]
    pub last_error: Option<String>,
    
    #[serde(rename = "scheduledFor", skip_serializing_if = "Option::is_none")]
    pub scheduled_for: Option<DateTime<Utc>>,
    
    #[serde(rename = "createdAt", default = "chrono::Utc::now")]
    pub created_at: DateTime<Utc>,
    
    #[serde(rename = "completedAt", skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<DateTime<Utc>>,
}

fn default_max_retries() -> i32 {
    3
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum PrintQueueStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Retrying,
}
