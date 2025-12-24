use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum PrinterType {
    Thermal,
    Network,
    Bluetooth,
    USB,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionType {
    IP,
    Bluetooth,
    USB,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum HealthStatus {
    Healthy,
    Warning,
    Critical,
    Offline,
    Unknown,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrinterConfig {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub outlet: ObjectId,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub device: Option<ObjectId>,
    
    #[serde(rename = "printerName")]
    pub printer_name: String,
    
    #[serde(rename = "printerType")]
    pub printer_type: PrinterType,
    
    #[serde(rename = "connectionType")]
    pub connection_type: ConnectionType,
    
    #[serde(rename = "ipAddress", skip_serializing_if = "Option::is_none")]
    pub ip_address: Option<String>,
    
    #[serde(rename = "macAddress", skip_serializing_if = "Option::is_none")]
    pub mac_address: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<i32>,
    
    pub workstation: String, // kitchen, bar, cashier
    
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    
    #[serde(rename = "healthStatus", default)]
    pub health_status: HealthStatus,
    
    #[serde(rename = "lastPrintAt", skip_serializing_if = "Option::is_none")]
    pub last_print_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "consecutiveFailures", default)]
    pub consecutive_failures: i32,
    
    #[serde(rename = "createdAt", default = "chrono::Utc::now")]
    pub created_at: DateTime<Utc>,
    
    #[serde(rename = "updatedAt", default = "chrono::Utc::now")]
    pub updated_at: DateTime<Utc>,
}

fn default_true() -> bool {
    true
}

impl Default for HealthStatus {
    fn default() -> Self {
        HealthStatus::Unknown
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum PrintStatus {
    Pending,
    Printing,
    Success,
    Failed,
    Skipped,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrintLog {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "orderId")]
    pub order_id: String,
    
    pub outlet: ObjectId,
    
    pub workstation: String,
    
    #[serde(rename = "printerType", skip_serializing_if = "Option::is_none")]
    pub printer_type: Option<String>,
    
    #[serde(rename = "printerInfo", skip_serializing_if = "Option::is_none")]
    pub printer_info: Option<String>,
    
    pub status: PrintStatus,
    
    #[serde(rename = "attemptCount", default)]
    pub attempt_count: i32,
    
    #[serde(rename = "failureReason", skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
    
    #[serde(rename = "printedAt", skip_serializing_if = "Option::is_none")]
    pub printed_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "itemId", skip_serializing_if = "Option::is_none")]
    pub item_id: Option<ObjectId>,
    
    #[serde(rename = "itemName", skip_serializing_if = "Option::is_none")]
    pub item_name: Option<String>,
    
    #[serde(rename = "printerHealth", skip_serializing_if = "Option::is_none")]
    pub printer_health: Option<String>,
    
    #[serde(rename = "createdAt", default = "chrono::Utc::now")]
    pub created_at: DateTime<Utc>,
}
