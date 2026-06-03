use super::{events::*, manager::ConnectionManager};
use std::sync::Arc;
use tracing::info;

pub struct WebSocketBroadcaster {
    manager: Arc<ConnectionManager>,
}

impl WebSocketBroadcaster {
    pub fn new(manager: Arc<ConnectionManager>) -> Self {
        Self { manager }
    }

    pub fn emit_kitchen_print(&self, data: PrintData) {
        let message = WebSocketMessage::KitchenImmediatePrint(data.clone());
        
        if let Ok(json) = serde_json::to_string(&message) {
            self.manager.broadcast_to_room(
                &"kitchen_room".to_string(),
                json
            );
            
            info!("Broadcasted kitchen print for order: {}", data.order_id);
        }
    }

    pub fn emit_beverage_print(&self, data: PrintData, bar_room: &str) {
        let message = WebSocketMessage::BeverageImmediatePrint(data.clone());
        
        if let Ok(json) = serde_json::to_string(&message) {
            self.manager.broadcast_to_room(
                &bar_room.to_string(),
                json
            );
            
            info!("Broadcasted beverage print to {} for order: {}", bar_room, data.order_id);
        }
    }

    pub fn emit_new_order(&self, data: OrderData) {
        let message = WebSocketMessage::NewOrder(data.clone());
        
        if let Ok(json) = serde_json::to_string(&message) {
            // Broadcast to cashier room
            self.manager.broadcast_to_room(&"cashier_room".to_string(), json.clone());
            
            // Broadcast to area room if applicable
            if let Some(area_code) = &data.area_code {
                self.manager.broadcast_to_room(
                    &format!("area_{}", area_code),
                    json
                );
            }
            
            info!("Broadcasted new order: {}", data.order_id);
        }
    }

    pub fn emit_order_status_update(&self, order_id: &str, data: StatusUpdate) {
        let message = WebSocketMessage::OrderStatusUpdate(data);
        
        if let Ok(json) = serde_json::to_string(&message) {
            self.manager.broadcast_to_room(
                &format!("order_{}", order_id),
                json
            );
            
            info!("Broadcasted status update for order: {}", order_id);
        }
    }

    pub fn get_room_size(&self, room: &str) -> usize {
        self.manager.get_room_size(&room.to_string())
    }
}
