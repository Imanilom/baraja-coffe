use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum StockUpdateType {
    Waste,
    Adjustment,
    Sale,
    Production,
    Transfer,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum StockReason {
    Busuk,
    TidakBagus,
    Kedaluwarsa,
    Rusak,
    Hilang,
    Lainnya,
    ManualAdjustment,
    InitialSetup,
    OrderFulfillment,
    TransferIn,
    TransferOut,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuStock {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "menuItemId")]
    pub menu_item_id: ObjectId,
    
    #[serde(rename = "warehouseId")]
    pub warehouse_id: ObjectId,
    
    #[serde(rename = "type", default = "default_stock_update_type")]
    pub update_type: StockUpdateType,
    
    #[serde(default)]
    pub quantity: f64,
    
    #[serde(default = "default_stock_reason")]
    pub reason: StockReason,
    
    #[serde(rename = "previousStock", default)]
    pub previous_stock: f64,
    
    #[serde(rename = "currentStock", default)]
    pub current_stock: f64,
    
    #[serde(rename = "calculatedStock", default)]
    pub calculated_stock: f64,
    
    #[serde(rename = "manualStock", skip_serializing_if = "Option::is_none")]
    pub manual_stock: Option<f64>,
    
    #[serde(rename = "adjustmentNote", skip_serializing_if = "Option::is_none")]
    pub adjustment_note: Option<String>,
    
    #[serde(rename = "adjustedBy", skip_serializing_if = "Option::is_none")]
    pub adjusted_by: Option<String>,
    
    #[serde(rename = "handledBy", default = "default_handled_by")]
    pub handled_by: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    
    #[serde(rename = "relatedWarehouse", skip_serializing_if = "Option::is_none")]
    pub related_warehouse: Option<ObjectId>,
    
    #[serde(rename = "transferId", skip_serializing_if = "Option::is_none")]
    pub transfer_id: Option<ObjectId>,
    
    #[serde(rename = "lastCalculatedAt", default = "Utc::now")]
    pub last_calculated_at: DateTime<Utc>,
    
    #[serde(rename = "lastAdjustedAt", default = "Utc::now")]
    pub last_adjusted_at: DateTime<Utc>,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_stock_update_type() -> StockUpdateType {
    StockUpdateType::Adjustment
}

fn default_stock_reason() -> StockReason {
    StockReason::InitialSetup
}

fn default_handled_by() -> String {
    "system".to_string()
}

impl MenuStock {
    pub fn get_effective_stock(&self) -> f64 {
        self.manual_stock.unwrap_or(self.calculated_stock)
    }
}
