use dashmap::DashMap;
use tokio::sync::mpsc;
use std::sync::Arc;
use tracing::{info, warn};

use super::events::DeviceInfo;

pub type ClientId = String;
pub type RoomName = String;

#[derive(Clone)]
pub struct ConnectionManager {
    // client_id -> sender
    clients: Arc<DashMap<ClientId, mpsc::UnboundedSender<String>>>,
    // room_name -> set of client_ids
    rooms: Arc<DashMap<RoomName, Vec<ClientId>>>,
    // client_id -> device_info
    devices: Arc<DashMap<ClientId, DeviceInfo>>,
}

impl ConnectionManager {
    pub fn new() -> Self {
        Self {
            clients: Arc::new(DashMap::new()),
            rooms: Arc::new(DashMap::new()),
            devices: Arc::new(DashMap::new()),
        }
    }

    pub fn register_client(&self, client_id: ClientId, sender: mpsc::UnboundedSender<String>) {
        self.clients.insert(client_id.clone(), sender);
        info!("Client registered: {}", client_id);
    }

    pub fn unregister_client(&self, client_id: &ClientId) {
        self.clients.remove(client_id);
        self.devices.remove(client_id);
        
        // Remove from all rooms
        for mut room in self.rooms.iter_mut() {
            room.value_mut().retain(|id| id != client_id);
        }
        
        info!("Client unregistered: {}", client_id);
    }

    pub fn join_room(&self, client_id: ClientId, room: RoomName) {
        self.rooms
            .entry(room.clone())
            .or_insert_with(Vec::new)
            .push(client_id.clone());
        
        info!("Client {} joined room: {}", client_id, room);
    }

    pub fn leave_room(&self, client_id: &ClientId, room: &RoomName) {
        if let Some(mut clients) = self.rooms.get_mut(room) {
            clients.retain(|id| id != client_id);
            info!("Client {} left room: {}", client_id, room);
        }
    }

    pub fn broadcast_to_room(&self, room: &RoomName, message: String) {
        if let Some(client_ids) = self.rooms.get(room) {
            let mut sent_count = 0;
            for client_id in client_ids.value() {
                if let Some(sender) = self.clients.get(client_id) {
                    if sender.send(message.clone()).is_ok() {
                        sent_count += 1;
                    }
                }
            }
            
            if sent_count > 0 {
                info!("Broadcasted to room '{}': {} clients", room, sent_count);
            } else {
                warn!("No clients received message in room '{}'", room);
            }
        } else {
            warn!("Room '{}' does not exist or is empty", room);
        }
    }

    pub fn register_device(&self, client_id: ClientId, device_info: DeviceInfo) {
        self.devices.insert(client_id.clone(), device_info.clone());
        
        // Auto-join rooms based on device info
        self.join_room(client_id.clone(), format!("outlet_{}", device_info.outlet_id));
        
        match device_info.role.as_str() {
            "kitchen" => {
                self.join_room(client_id.clone(), "kitchen_room".to_string());
                info!("Kitchen device registered: {}", client_id);
            }
            "bar" => {
                if let Some(location) = &device_info.location {
                    let room = if location == "depan" {
                        "bar_depan"
                    } else {
                        "bar_belakang"
                    };
                    self.join_room(client_id.clone(), room.to_string());
                    info!("Bar device registered: {} ({})", client_id, room);
                }
            }
            "cashier" => {
                self.join_room(client_id.clone(), "cashier_room".to_string());
                if let Some(location) = &device_info.location {
                    self.join_room(client_id.clone(), format!("area_{}", location));
                }
                info!("Cashier device registered: {}", client_id);
            }
            _ => {
                warn!("Unknown device role: {}", device_info.role);
            }
        }
    }

    pub fn get_room_size(&self, room: &RoomName) -> usize {
        self.rooms.get(room).map(|r| r.len()).unwrap_or(0)
    }

    pub fn get_connected_clients_count(&self) -> usize {
        self.clients.len()
    }

    pub fn get_device_info(&self, client_id: &ClientId) -> Option<DeviceInfo> {
        self.devices.get(client_id).map(|d| d.clone())
    }
}

impl Default for ConnectionManager {
    fn default() -> Self {
        Self::new()
    }
}
