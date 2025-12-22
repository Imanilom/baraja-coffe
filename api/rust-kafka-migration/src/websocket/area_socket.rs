use std::sync::Arc;
use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;

use crate::websocket::socket_state::{SocketState, ConnectedDevice};
use crate::db::models::order::OrderItem;
use crate::error::AppResult;

#[derive(Debug, Serialize)]
pub struct BroadcastOrderData {
    #[serde(rename = "orderId")]
    pub order_id: String,
    
    #[serde(rename = "tableNumber", skip_serializing_if = "Option::is_none")]
    pub table_number: Option<String>,
    
    #[serde(rename = "orderType")]
    pub order_type: String,
    
    pub source: String,
    
    pub name: String,
    
    pub service: String,
    
    #[serde(rename = "orderItems")]
    pub order_items: Vec<OrderItem>,
    
    #[serde(rename = "deviceId")]
    pub device_id: String,
    
    #[serde(rename = "targetDevice")]
    pub target_device: String,
    
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct BroadcastResult {
    pub success: bool,
    
    #[serde(rename = "devicesNotified")]
    pub devices_notified: usize,
    
    #[serde(rename = "barDevicesFirst", skip_serializing_if = "Option::is_none")]
    pub bar_devices_first: Option<usize>,
    
    #[serde(rename = "kitchenDevicesAfter", skip_serializing_if = "Option::is_none")]
    pub kitchen_devices_after: Option<usize>,
    
    #[serde(rename = "kitchenItems")]
    pub kitchen_items: usize,
    
    #[serde(rename = "beverageItems")]
    pub beverage_items: usize,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Main broadcast function with bar-first priority
pub async fn broadcast_order(
    socket_state: &SocketState,
    order_id: &str,
    table_number: Option<&str>,
    items: &[OrderItem],
    outlet_id: &ObjectId,
    source: &str,
    order_type: &str,
    customer_name: &str,
) -> AppResult<BroadcastResult> {
    tracing::info!(
        "📡 BROADCASTING ORDER: {} (Table: {:?}, Items: {})",
        order_id,
        table_number,
        items.len()
    );

    // Separate items by workstation type
    let (beverage_items, kitchen_items) = separate_items_by_workstation(items);

    tracing::info!(
        "   Kitchen Items: {}, Beverage Items: {}",
        kitchen_items.len(),
        beverage_items.len()
    );

    // Get all connected devices for this outlet
    let all_devices = socket_state.get_devices_by_outlet(outlet_id).await;
    
    tracing::info!("📱 Total connected devices: {}", all_devices.len());

    // Separate devices by type
    let (bar_devices, kitchen_devices, other_devices) = separate_devices_by_type(&all_devices);

    tracing::info!(
        "   Bar Devices: {}, Kitchen Devices: {}, Other: {}",
        bar_devices.len(),
        kitchen_devices.len(),
        other_devices.len()
    );

    let mut sent_count = 0;

    // STEP 1: Send to BAR devices FIRST
    tracing::info!("🍹 STEP 1: Broadcasting to BAR devices...");
    for device in &bar_devices {
        if beverage_items.is_empty() {
            continue;
        }

        // Check table assignment
        if let Some(table) = table_number {
            if !socket_state.is_table_assigned_to_device(table, device) {
                tracing::debug!("   ⏭️  Skipping {} - Table {} not assigned", device.device_name, table);
                continue;
            }
        }

        // TODO: Actually send via WebSocket
        tracing::info!(
            "   ✅ [BAR FIRST] Would send to: {} ({} items)",
            device.device_name,
            beverage_items.len()
        );
        sent_count += 1;
    }

    // STEP 2: Send to KITCHEN devices (with delay if bar items exist)
    if !bar_devices.is_empty() && !beverage_items.is_empty() && !kitchen_items.is_empty() {
        tracing::info!("⏱️  STEP 2: Scheduling kitchen broadcast with delay...");
        
        // In production, use tokio::time::sleep for non-blocking delay
        // For now, send immediately
        send_to_kitchen_devices(
            socket_state,
            &kitchen_devices,
            &kitchen_items,
            order_id,
            table_number,
            order_type,
            source,
            customer_name,
        ).await;
    } else {
        tracing::info!("🍳 STEP 2: Broadcasting to KITCHEN devices (immediate)...");
        send_to_kitchen_devices(
            socket_state,
            &kitchen_devices,
            &kitchen_items,
            order_id,
            table_number,
            order_type,
            source,
            customer_name,
        ).await;
        sent_count += kitchen_devices.len();
    }

    // STEP 3: Send to OTHER devices
    if !other_devices.is_empty() {
        tracing::info!("📋 STEP 3: Broadcasting to OTHER devices...");
        for device in &other_devices {
            tracing::info!("   ✅ [OTHER] Would send to: {}", device.device_name);
            sent_count += 1;
        }
    }

    tracing::info!("📊 BROADCAST SUMMARY: Sent to {} device(s)", sent_count);

    Ok(BroadcastResult {
        success: true,
        devices_notified: sent_count,
        bar_devices_first: Some(bar_devices.len()),
        kitchen_devices_after: Some(kitchen_devices.len()),
        kitchen_items: kitchen_items.len(),
        beverage_items: beverage_items.len(),
        error: None,
    })
}

/// Separate items into beverage and kitchen categories
fn separate_items_by_workstation(items: &[OrderItem]) -> (Vec<OrderItem>, Vec<OrderItem>) {
    let mut beverage_items = Vec::new();
    let mut kitchen_items = Vec::new();

    for item in items {
        // Check if item is beverage/bar item
        // This would need to check the actual menu item data
        // For now, simplified logic
        let is_beverage = false; // TODO: Implement actual check

        if is_beverage {
            beverage_items.push(item.clone());
        } else {
            kitchen_items.push(item.clone());
        }
    }

    (beverage_items, kitchen_items)
}

/// Separate devices into bar, kitchen, and other categories
fn separate_devices_by_type(
    devices: &[ConnectedDevice],
) -> (Vec<ConnectedDevice>, Vec<ConnectedDevice>, Vec<ConnectedDevice>) {
    let mut bar_devices = Vec::new();
    let mut kitchen_devices = Vec::new();
    let mut other_devices = Vec::new();

    for device in devices {
        if device.role.to_lowercase().contains("bar") {
            bar_devices.push(device.clone());
        } else if device.role.to_lowercase().contains("kitchen") {
            kitchen_devices.push(device.clone());
        } else {
            other_devices.push(device.clone());
        }
    }

    (bar_devices, kitchen_devices, other_devices)
}

/// Send orders to kitchen devices
async fn send_to_kitchen_devices(
    _socket_state: &SocketState,
    kitchen_devices: &[ConnectedDevice],
    kitchen_items: &[OrderItem],
    order_id: &str,
    table_number: Option<&str>,
    order_type: &str,
    source: &str,
    customer_name: &str,
) {
    for device in kitchen_devices {
        if kitchen_items.is_empty() {
            continue;
        }

        // TODO: Actually send via WebSocket
        tracing::info!(
            "   ✅ [KITCHEN] Would send to: {} ({} items)",
            device.device_name,
            kitchen_items.len()
        );
    }
}

/// Broadcast to specific workstation type
pub async fn broadcast_to_workstation(
    socket_state: &SocketState,
    workstation_type: &str,
    outlet_id: &ObjectId,
    event_name: &str,
    data: serde_json::Value,
) -> AppResult<BroadcastResult> {
    let devices = socket_state.get_devices_by_role(workstation_type, Some(outlet_id)).await;

    tracing::info!(
        "📡 Broadcasting to {}: {} device(s)",
        workstation_type,
        devices.len()
    );

    for device in &devices {
        // TODO: Actually send via WebSocket
        tracing::info!("   ✅ Would send {} to: {}", event_name, device.device_name);
    }

    Ok(BroadcastResult {
        success: true,
        devices_notified: devices.len(),
        bar_devices_first: None,
        kitchen_devices_after: None,
        kitchen_items: 0,
        beverage_items: 0,
        error: None,
    })
}
