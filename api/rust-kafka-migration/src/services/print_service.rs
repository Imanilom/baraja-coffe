use crate::websocket::{broadcaster::WebSocketBroadcaster, events::*};
use std::sync::Arc;
use tracing::info;

#[derive(Clone)]
pub struct PrintService {
    broadcaster: Arc<WebSocketBroadcaster>,
}

#[derive(Debug, Clone)]
pub struct PrintOrderInfo {
    pub order_id: String,
    pub table_number: Option<String>,
    pub items: Vec<PrintItem>,
    pub source: String,
    pub order_type: String,
    pub payment_method: String,
    pub is_open_bill: bool,
}

impl PrintService {
    pub fn new(broadcaster: Arc<WebSocketBroadcaster>) -> Self {
        Self { broadcaster }
    }

    pub async fn trigger_immediate_print(&self, order_info: PrintOrderInfo) -> Result<(), String> {
        info!("\n🖨️ ========== PRINT TRIGGER ==========");
        info!("📋 Order ID: {}", order_info.order_id);
        info!("🪑 Table: {:?}", order_info.table_number);
        info!("📱 Source: {}", order_info.source);
        
        let area_code = order_info.table_number.as_ref()
            .and_then(|t| t.chars().next())
            .map(|c| c.to_uppercase().to_string());

        // Separate items by workstation
        let kitchen_items: Vec<PrintItem> = order_info.items.iter()
            .filter(|item| {
                item.workstation.as_deref() == Some("kitchen")
            })
            .cloned()
            .collect();

        let beverage_items: Vec<PrintItem> = order_info.items.iter()
            .filter(|item| {
                let ws = item.workstation.as_deref().unwrap_or("");
                let cat = item.main_category.as_deref().unwrap_or("");
                ws.contains("bar") || cat.contains("beverage") || cat.contains("minuman")
            })
            .cloned()
            .collect();

        // Emit kitchen print
        if !kitchen_items.is_empty() {
            let print_data = PrintData {
                order_id: order_info.order_id.clone(),
                table_number: order_info.table_number.clone(),
                area_code: area_code.clone(),
                order_items: kitchen_items.clone(),
                source: order_info.source.clone(),
                order_type: order_info.order_type.clone(),
                timestamp: chrono::Utc::now(),
                print_trigger: "immediate".to_string(),
                payment_method: order_info.payment_method.clone(),
                is_open_bill: order_info.is_open_bill,
            };
            
            self.broadcaster.emit_kitchen_print(print_data);
            info!("🍳 → Kitchen: {} items sent to kitchen_room", kitchen_items.len());
        }

        // Emit beverage print
        if !beverage_items.is_empty() && area_code.is_some() {
            let area = area_code.as_ref().unwrap();
            let bar_room = if area.as_str() <= "I" {
                "bar_depan"
            } else {
                "bar_belakang"
            };

            let print_data = PrintData {
                order_id: order_info.order_id.clone(),
                table_number: order_info.table_number.clone(),
                area_code: area_code.clone(),
                order_items: beverage_items.clone(),
                source: order_info.source.clone(),
                order_type: order_info.order_type.clone(),
                timestamp: chrono::Utc::now(),
                print_trigger: "immediate".to_string(),
                payment_method: order_info.payment_method.clone(),
                is_open_bill: order_info.is_open_bill,
            };
            
            self.broadcaster.emit_beverage_print(print_data, bar_room);
            info!("🍹 → Bar: {} items sent to {}", beverage_items.len(), bar_room);
        }

        info!("✅ Print commands sent successfully");
        info!("====================================\n");
        
        Ok(())
    }

    pub fn broadcast_new_order(&self, order_data: OrderData) {
        self.broadcaster.emit_new_order(order_data);
    }

    pub fn broadcast_order_status(&self, order_id: &str, status_update: StatusUpdate) {
        self.broadcaster.emit_order_status_update(order_id, status_update);
    }
}
