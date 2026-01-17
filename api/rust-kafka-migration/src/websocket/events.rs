use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintData {
    pub order_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub table_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub area_code: Option<String>,
    pub order_items: Vec<PrintItem>,
    pub source: String,
    pub order_type: String,
    pub timestamp: DateTime<Utc>,
    pub print_trigger: String,
    pub payment_method: String,
    pub is_open_bill: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintItem {
    pub name: String,
    pub quantity: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workstation: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub main_category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_custom_amount: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderData {
    pub order_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub table_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub area_code: Option<String>,
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_method: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusUpdate {
    pub order_id: String,
    pub order_status: String,
    pub payment_status: String,
    pub message: String,
    pub timestamp: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cashier: Option<CashierData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CashierData {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub device_id: String,
    pub role: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,
    pub outlet_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "event", content = "data")]
pub enum WebSocketMessage {
    #[serde(rename = "kitchen_immediate_print")]
    KitchenImmediatePrint(PrintData),
    
    #[serde(rename = "beverage_immediate_print")]
    BeverageImmediatePrint(PrintData),
    
    #[serde(rename = "new_order")]
    NewOrder(OrderData),
    
    #[serde(rename = "new_order_in_area")]
    NewOrderInArea(OrderData),
    
    #[serde(rename = "order_status_update")]
    OrderStatusUpdate(StatusUpdate),
    
    #[serde(rename = "order_confirmed")]
    OrderConfirmed(StatusUpdate),
    
    #[serde(rename = "device_registered")]
    DeviceRegistered { device_id: String, success: bool },
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    #[serde(rename = "register_device")]
    RegisterDevice { data: DeviceInfo },
    
    #[serde(rename = "join_room")]
    JoinRoom { room: String },
    
    #[serde(rename = "leave_room")]
    LeaveRoom { room: String },
    
    #[serde(rename = "ping")]
    Ping,
}
