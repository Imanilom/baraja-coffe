use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MainCategory {
    Makanan,
    Minuman,
    Instan,
    Dessert,
    Snack,
    Event,
    Bazar,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum EventType {
    Paid,
    Free,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Workstation {
    Kitchen,
    Bar,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WarehouseStock {
    #[serde(rename = "warehouseId")]
    pub warehouse_id: ObjectId,
    
    #[serde(default)]
    pub stock: f64,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workstation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkstationMapping {
    pub workstation: Workstation,
    
    #[serde(rename = "warehouseId")]
    pub warehouse_id: ObjectId,
    
    #[serde(rename = "isPrimary", default = "default_true")]
    pub is_primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Topping {
    pub name: String,
    pub price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddonOptionDetail {
    pub label: String,
    pub price: f64,
    
    #[serde(rename = "isDefault", default)]
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Addon {
    pub name: String,
    pub options: Vec<AddonOptionDetail>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuItem {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub name: String,
    pub price: f64,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    
    #[serde(rename = "mainCategory", default = "default_main_category")]
    pub main_category: MainCategory,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<ObjectId>,
    
    #[serde(rename = "subCategory", skip_serializing_if = "Option::is_none")]
    pub sub_category: Option<ObjectId>,
    
    #[serde(rename = "imageURL", default = "default_image_url")]
    pub image_url: String,
    
    #[serde(rename = "costPrice", default)]
    pub cost_price: f64,
    
    #[serde(rename = "availableStock", default)]
    pub available_stock: f64,
    
    #[serde(rename = "warehouseStocks", default)]
    pub warehouse_stocks: Vec<WarehouseStock>,
    
    #[serde(rename = "workstationMapping", default)]
    pub workstation_mapping: Vec<WorkstationMapping>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event: Option<ObjectId>,
    
    #[serde(rename = "isEventItem", default)]
    pub is_event_item: bool,
    
    #[serde(rename = "eventType", default = "default_event_type")]
    pub event_type: EventType,
    
    #[serde(default)]
    pub toppings: Vec<Topping>,
    
    #[serde(default)]
    pub addons: Vec<Addon>,
    
    #[serde(rename = "availableAt", default)]
    pub available_at: Vec<ObjectId>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workstation: Option<Workstation>,
    
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_true() -> bool {
    true
}

fn default_main_category() -> MainCategory {
    MainCategory::Makanan
}

fn default_image_url() -> String {
    "https://placehold.co/1920x1080/png".to_string()
}

fn default_event_type() -> EventType {
    EventType::Paid
}

impl MenuItem {
    pub fn get_primary_warehouse_id(&self) -> Option<ObjectId> {
        let ws = self.workstation.as_ref()?;
        self.workstation_mapping
            .iter()
            .find(|m| &m.workstation == ws && m.is_primary)
            .map(|m| m.warehouse_id)
    }

    pub fn get_stock_for_warehouse(&self, warehouse_id: &ObjectId) -> f64 {
        self.warehouse_stocks
            .iter()
            .find(|ws| &ws.warehouse_id == warehouse_id)
            .map(|ws| ws.stock)
            .unwrap_or(0.0)
    }
}
