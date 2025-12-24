use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

/// Connected device information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectedDevice {
    #[serde(rename = "socketId")]
    pub socket_id: String,
    
    #[serde(rename = "deviceId")]
    pub device_id: String,
    
    #[serde(rename = "outletId")]
    pub outlet_id: ObjectId,
    
    pub role: String,
    
    pub location: String,
    
    #[serde(rename = "deviceName")]
    pub device_name: String,
    
    #[serde(rename = "assignedAreas")]
    pub assigned_areas: Vec<String>,
    
    #[serde(rename = "assignedTables")]
    pub assigned_tables: Vec<String>,
    
    #[serde(rename = "orderTypes")]
    pub order_types: Vec<String>,
    
    #[serde(rename = "sessionId")]
    pub session_id: String,
    
    #[serde(rename = "connectedAt")]
    pub connected_at: DateTime<Utc>,
}

/// Shared WebSocket state for managing connected devices
#[derive(Clone)]
pub struct SocketState {
    // Main device storage: socket_id -> ConnectedDevice
    connected_devices: Arc<RwLock<HashMap<String, ConnectedDevice>>>,
    
    // Optimized indexes for fast lookups
    devices_by_role: Arc<RwLock<HashMap<String, Vec<String>>>>, // role -> [socket_ids]
    devices_by_outlet: Arc<RwLock<HashMap<String, Vec<String>>>>, // outlet_id -> [socket_ids]
}

impl SocketState {
    pub fn new() -> Self {
        Self {
            connected_devices: Arc::new(RwLock::new(HashMap::new())),
            devices_by_role: Arc::new(RwLock::new(HashMap::new())),
            devices_by_outlet: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register a new device connection
    pub async fn register_device(&self, device: ConnectedDevice) {
        let socket_id = device.socket_id.clone();
        let role = device.role.clone();
        let outlet_id = device.outlet_id.to_string();

        // Add to main storage
        let mut devices = self.connected_devices.write().await;
        devices.insert(socket_id.clone(), device.clone());
        drop(devices);

        // Update role index
        let mut by_role = self.devices_by_role.write().await;
        by_role.entry(role).or_insert_with(Vec::new).push(socket_id.clone());
        drop(by_role);

        // Update outlet index
        let mut by_outlet = self.devices_by_outlet.write().await;
        by_outlet.entry(outlet_id).or_insert_with(Vec::new).push(socket_id.clone());
        drop(by_outlet);

        tracing::info!(
            "✅ Device registered: {} ({}), Role: {}, Socket: {}",
            device.device_name,
            device.device_id,
            device.role,
            socket_id
        );
    }

    /// Handle device disconnection
    pub async fn handle_disconnection(&self, socket_id: &str) {
        let mut devices = self.connected_devices.write().await;
        
        if let Some(device) = devices.remove(socket_id) {
            drop(devices);

            // Clean up role index
            let mut by_role = self.devices_by_role.write().await;
            if let Some(sockets) = by_role.get_mut(&device.role) {
                sockets.retain(|id| id != socket_id);
                if sockets.is_empty() {
                    by_role.remove(&device.role);
                }
            }
            drop(by_role);

            // Clean up outlet index
            let outlet_key = device.outlet_id.to_string();
            let mut by_outlet = self.devices_by_outlet.write().await;
            if let Some(sockets) = by_outlet.get_mut(&outlet_key) {
                sockets.retain(|id| id != socket_id);
                if sockets.is_empty() {
                    by_outlet.remove(&outlet_key);
                }
            }
            drop(by_outlet);

            tracing::info!("❌ Device disconnected: {}", device.device_name);
        }
    }

    /// Get device by socket ID
    pub async fn get_device(&self, socket_id: &str) -> Option<ConnectedDevice> {
        let devices = self.connected_devices.read().await;
        devices.get(socket_id).cloned()
    }

    /// Get device by device ID
    pub async fn get_device_by_device_id(&self, device_id: &str) -> Option<ConnectedDevice> {
        let devices = self.connected_devices.read().await;
        devices.values().find(|d| d.device_id == device_id).cloned()
    }

    /// Get all devices for an outlet
    pub async fn get_devices_by_outlet(&self, outlet_id: &ObjectId) -> Vec<ConnectedDevice> {
        let outlet_key = outlet_id.to_string();
        let by_outlet = self.devices_by_outlet.read().await;
        
        if let Some(socket_ids) = by_outlet.get(&outlet_key) {
            let devices = self.connected_devices.read().await;
            socket_ids.iter()
                .filter_map(|id| devices.get(id).cloned())
                .collect()
        } else {
            Vec::new()
        }
    }

    /// Get devices by role (optionally filtered by outlet)
    pub async fn get_devices_by_role(&self, role: &str, outlet_id: Option<&ObjectId>) -> Vec<ConnectedDevice> {
        let by_role = self.devices_by_role.read().await;
        
        if let Some(socket_ids) = by_role.get(role) {
            let devices = self.connected_devices.read().await;
            socket_ids.iter()
                .filter_map(|id| devices.get(id))
                .filter(|d| {
                    if let Some(oid) = outlet_id {
                        &d.outlet_id == oid
                    } else {
                        true
                    }
                })
                .cloned()
                .collect()
        } else {
            Vec::new()
        }
    }

    /// Get all connected devices
    pub async fn get_all_devices(&self) -> Vec<ConnectedDevice> {
        let devices = self.connected_devices.read().await;
        devices.values().cloned().collect()
    }

    /// Get connection status
    pub async fn get_status(&self) -> SocketStatus {
        let devices = self.connected_devices.read().await;
        let device_list: Vec<DeviceStatus> = devices.values()
            .map(|d| DeviceStatus {
                device_id: d.device_id.clone(),
                device_name: d.device_name.clone(),
                role: d.role.clone(),
                location: d.location.clone(),
                outlet_id: d.outlet_id,
                connected_at: d.connected_at,
                socket_id: d.socket_id.clone(),
                assigned_areas: d.assigned_areas.clone(),
                assigned_tables: d.assigned_tables.clone(),
            })
            .collect();

        SocketStatus {
            total_connected: device_list.len(),
            devices: device_list,
        }
    }

    /// Check if table is assigned to device
    pub fn is_table_assigned_to_device(&self, table_number: &str, device: &ConnectedDevice) -> bool {
        // If no assignments, accept all (backward compatibility)
        if device.assigned_areas.is_empty() && device.assigned_tables.is_empty() {
            return true;
        }

        // Check exact table match
        if device.assigned_tables.contains(&table_number.to_string()) {
            return true;
        }

        // Check area prefix match
        if !device.assigned_areas.is_empty() && !table_number.is_empty() {
            let area_prefix = table_number.chars().next().unwrap().to_uppercase().to_string();
            if device.assigned_areas.contains(&area_prefix) {
                return true;
            }
        }

        false
    }
}

impl Default for SocketState {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Serialize)]
pub struct SocketStatus {
    #[serde(rename = "totalConnected")]
    pub total_connected: usize,
    pub devices: Vec<DeviceStatus>,
}

#[derive(Debug, Serialize)]
pub struct DeviceStatus {
    #[serde(rename = "deviceId")]
    pub device_id: String,
    #[serde(rename = "deviceName")]
    pub device_name: String,
    pub role: String,
    pub location: String,
    #[serde(rename = "outletId")]
    pub outlet_id: ObjectId,
    #[serde(rename = "connectedAt")]
    pub connected_at: DateTime<Utc>,
    #[serde(rename = "socketId")]
    pub socket_id: String,
    #[serde(rename = "assignedAreas")]
    pub assigned_areas: Vec<String>,
    #[serde(rename = "assignedTables")]
    pub assigned_tables: Vec<String>,
}
