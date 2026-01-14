# Implementation Plan: WebSocket & Print System in Rust

## 🎯 Objective

Implement critical missing features in Rust to achieve feature parity with Node.js:
1. WebSocket server for real-time communication
2. Print order system
3. Enhanced order processing
4. Order confirmation flow

---

## 📦 Dependencies Required

### Add to Cargo.toml:
```toml
# WebSocket support
axum-tungstenite = "0.1"
tokio-tungstenite = "0.21"
futures-util = "0.3"

# Additional utilities
dashmap = "5.5"  # Thread-safe HashMap for connection management
```

---

## 🏗️ Architecture Design

### 1. WebSocket Module Structure

```
src/
├── websocket/
│   ├── mod.rs              # Module exports
│   ├── handler.rs          # WebSocket connection handler
│   ├── manager.rs          # Connection & room management
│   ├── events.rs           # Event types & serialization
│   └── broadcaster.rs      # Broadcasting utilities
├── services/
│   ├── print_service.rs    # Print order logic
│   └── notification_service.rs  # FCM notifications (future)
└── handlers/
    └── order.rs            # Enhanced order handlers
```

### 2. WebSocket Room System

**Rooms to Implement**:
- `kitchen_room` - All kitchen devices
- `bar_depan` - Front bar devices
- `bar_belakang` - Back bar devices
- `cashier_room` - All cashier devices
- `area_{A-O}` - Area-specific rooms
- `outlet_{id}` - Outlet-specific rooms
- `order_{id}` - Order-specific rooms

### 3. Event Types

```rust
pub enum WebSocketEvent {
    // Print events
    KitchenImmediatePrint(PrintData),
    BeverageImmediatePrint(PrintData),
    
    // Order events
    NewOrder(OrderData),
    NewOrderInArea(OrderData),
    OrderStatusUpdate(StatusUpdate),
    OrderConfirmed(ConfirmData),
    
    // Device events
    DeviceRegistered(DeviceInfo),
    DeviceDisconnected(String),
}
```

---

## 📝 Implementation Steps

### Phase 1: WebSocket Infrastructure (Priority: CRITICAL)

#### Step 1.1: Create WebSocket Event Types
**File**: `src/websocket/events.rs`

```rust
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintData {
    pub order_id: String,
    pub table_number: Option<String>,
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
    pub workstation: Option<String>,
    pub main_category: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderData {
    pub order_id: String,
    pub table_number: Option<String>,
    pub area_code: Option<String>,
    pub source: String,
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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub device_id: String,
    pub role: String,
    pub location: Option<String>,
    pub outlet_id: String,
}
```

#### Step 1.2: Create Connection Manager
**File**: `src/websocket/manager.rs`

```rust
use dashmap::DashMap;
use tokio::sync::mpsc;
use std::sync::Arc;

pub type ClientId = String;
pub type RoomName = String;

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
        self.clients.insert(client_id, sender);
    }

    pub fn unregister_client(&self, client_id: &ClientId) {
        self.clients.remove(client_id);
        self.devices.remove(client_id);
        
        // Remove from all rooms
        for mut room in self.rooms.iter_mut() {
            room.value_mut().retain(|id| id != client_id);
        }
    }

    pub fn join_room(&self, client_id: ClientId, room: RoomName) {
        self.rooms.entry(room).or_insert_with(Vec::new).push(client_id);
    }

    pub fn leave_room(&self, client_id: &ClientId, room: &RoomName) {
        if let Some(mut clients) = self.rooms.get_mut(room) {
            clients.retain(|id| id != client_id);
        }
    }

    pub fn broadcast_to_room(&self, room: &RoomName, message: String) {
        if let Some(client_ids) = self.rooms.get(room) {
            for client_id in client_ids.value() {
                if let Some(sender) = self.clients.get(client_id) {
                    let _ = sender.send(message.clone());
                }
            }
        }
    }

    pub fn register_device(&self, client_id: ClientId, device_info: DeviceInfo) {
        self.devices.insert(client_id.clone(), device_info.clone());
        
        // Auto-join rooms based on device info
        self.join_room(client_id.clone(), format!("outlet_{}", device_info.outlet_id));
        
        match device_info.role.as_str() {
            "kitchen" => self.join_room(client_id.clone(), "kitchen_room".to_string()),
            "bar" => {
                if let Some(location) = &device_info.location {
                    let room = if location == "depan" {
                        "bar_depan"
                    } else {
                        "bar_belakang"
                    };
                    self.join_room(client_id.clone(), room.to_string());
                }
            }
            "cashier" => {
                self.join_room(client_id.clone(), "cashier_room".to_string());
                if let Some(location) = &device_info.location {
                    self.join_room(client_id, format!("area_{}", location));
                }
            }
            _ => {}
        }
    }

    pub fn get_room_size(&self, room: &RoomName) -> usize {
        self.rooms.get(room).map(|r| r.len()).unwrap_or(0)
    }
}
```

#### Step 1.3: Create WebSocket Handler
**File**: `src/websocket/handler.rs`

```rust
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{error, info, warn};

use super::{events::*, manager::ConnectionManager};
use crate::AppState;

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();
    
    let client_id = uuid::Uuid::new_v4().to_string();
    
    info!("WebSocket client connected: {}", client_id);
    
    // Register client
    state.ws_manager.register_client(client_id.clone(), tx);
    
    // Spawn task to send messages to client
    let client_id_clone = client_id.clone();
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });
    
    // Handle incoming messages
    let ws_manager = state.ws_manager.clone();
    let client_id_clone2 = client_id.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                if let Err(e) = handle_client_message(&text, &client_id_clone2, &ws_manager).await {
                    error!("Error handling message: {:?}", e);
                }
            }
        }
    });
    
    // Wait for either task to finish
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }
    
    // Cleanup
    state.ws_manager.unregister_client(&client_id);
    info!("WebSocket client disconnected: {}", client_id);
}

async fn handle_client_message(
    text: &str,
    client_id: &str,
    manager: &Arc<ConnectionManager>,
) -> Result<(), Box<dyn std::error::Error>> {
    let msg: serde_json::Value = serde_json::from_str(text)?;
    
    match msg.get("type").and_then(|t| t.as_str()) {
        Some("register_device") => {
            if let Ok(device_info) = serde_json::from_value::<DeviceInfo>(msg["data"].clone()) {
                manager.register_device(client_id.to_string(), device_info);
                info!("Device registered: {}", client_id);
            }
        }
        Some("join_room") => {
            if let Some(room) = msg.get("room").and_then(|r| r.as_str()) {
                manager.join_room(client_id.to_string(), room.to_string());
                info!("Client {} joined room: {}", client_id, room);
            }
        }
        Some("leave_room") => {
            if let Some(room) = msg.get("room").and_then(|r| r.as_str()) {
                manager.leave_room(client_id, &room.to_string());
                info!("Client {} left room: {}", client_id, room);
            }
        }
        _ => {
            warn!("Unknown message type from client {}", client_id);
        }
    }
    
    Ok(())
}
```

#### Step 1.4: Create Broadcaster Utility
**File**: `src/websocket/broadcaster.rs`

```rust
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
        let message = serde_json::json!({
            "event": "kitchen_immediate_print",
            "data": data
        });
        
        self.manager.broadcast_to_room(
            &"kitchen_room".to_string(),
            message.to_string()
        );
        
        info!("Broadcasted kitchen print for order: {}", data.order_id);
    }

    pub fn emit_beverage_print(&self, data: PrintData, bar_room: &str) {
        let message = serde_json::json!({
            "event": "beverage_immediate_print",
            "data": data
        });
        
        self.manager.broadcast_to_room(
            &bar_room.to_string(),
            message.to_string()
        );
        
        info!("Broadcasted beverage print to {} for order: {}", bar_room, data.order_id);
    }

    pub fn emit_new_order(&self, data: OrderData) {
        let message = serde_json::json!({
            "event": "new_order",
            "data": data
        });
        
        // Broadcast to multiple rooms
        self.manager.broadcast_to_room(&"cashier_room".to_string(), message.to_string());
        
        if let Some(area_code) = &data.area_code {
            self.manager.broadcast_to_room(
                &format!("area_{}", area_code),
                message.to_string()
            );
        }
        
        info!("Broadcasted new order: {}", data.order_id);
    }

    pub fn emit_order_status_update(&self, order_id: &str, data: StatusUpdate) {
        let message = serde_json::json!({
            "event": "order_status_update",
            "data": data
        });
        
        self.manager.broadcast_to_room(
            &format!("order_{}", order_id),
            message.to_string()
        );
        
        info!("Broadcasted status update for order: {}", order_id);
    }

    pub fn get_room_size(&self, room: &str) -> usize {
        self.manager.get_room_size(&room.to_string())
    }
}
```

---

### Phase 2: Print Service (Priority: CRITICAL)

#### Step 2.1: Create Print Service
**File**: `src/services/print_service.rs`

```rust
use crate::websocket::{broadcaster::WebSocketBroadcaster, events::*};
use bson::Document;
use std::sync::Arc;
use tracing::{error, info};

pub struct PrintService {
    broadcaster: Arc<WebSocketBroadcaster>,
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
```

---

### Phase 3: Integration with AppState

#### Step 3.1: Update AppState
**File**: `src/main.rs`

```rust
// Add to AppState
pub struct AppState {
    // ... existing fields ...
    pub ws_manager: Arc<ConnectionManager>,
    pub ws_broadcaster: Arc<WebSocketBroadcaster>,
    pub print_service: PrintService,
}

// In main():
let ws_manager = Arc::new(ConnectionManager::new());
let ws_broadcaster = Arc::new(WebSocketBroadcaster::new(ws_manager.clone()));
let print_service = PrintService::new(ws_broadcaster.clone());

let state = Arc::new(AppState {
    // ... existing fields ...
    ws_manager,
    ws_broadcaster,
    print_service,
});
```

#### Step 3.2: Add WebSocket Route
**File**: `src/routes/mod.rs`

```rust
use crate::websocket::handler::websocket_handler;

fn websocket_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(websocket_handler))
}

// In create_routes():
.nest("/ws", websocket_routes())
```

---

### Phase 4: Enhanced Order Processing

#### Step 4.1: Update Order Handler
**File**: `src/handlers/order.rs`

Add after order creation:
```rust
// Trigger print for cash orders
if payment_method == "Cash" {
    let print_info = PrintOrderInfo {
        order_id: order_id.clone(),
        table_number: Some(table_number.clone()),
        items: /* convert items to PrintItem */,
        source: source.clone(),
        order_type: order_type.clone(),
        payment_method: "Cash".to_string(),
        is_open_bill: false,
    };
    
    if let Err(e) = state.print_service.trigger_immediate_print(print_info).await {
        error!("Failed to trigger print: {}", e);
    }
}

// Broadcast new order
let order_data = OrderData {
    order_id: order_id.clone(),
    table_number: Some(table_number.clone()),
    area_code: Some(table_number.chars().next().unwrap().to_string()),
    source: source.clone(),
    payment_method: Some(payment_method.clone()),
    timestamp: chrono::Utc::now(),
    message: format!("New order from {}", source),
};

state.print_service.broadcast_new_order(order_data);
```

---

## ✅ Verification Steps

1. **Test WebSocket Connection**
   ```bash
   # Use wscat or similar tool
   wscat -c ws://localhost:8081/ws
   ```

2. **Test Device Registration**
   ```json
   {
     "type": "register_device",
     "data": {
       "device_id": "kitchen-1",
       "role": "kitchen",
       "location": null,
       "outlet_id": "outlet-123"
     }
   }
   ```

3. **Test Print Trigger**
   - Create order with Cash payment
   - Verify print event received on kitchen device
   - Verify print event received on bar device

4. **Test Room Broadcasting**
   - Register multiple devices
   - Create order
   - Verify all devices in room receive event

---

## 📊 Success Criteria

- [ ] WebSocket server accepts connections
- [ ] Devices can register and join rooms
- [ ] Print events broadcast to correct rooms
- [ ] Kitchen receives kitchen items
- [ ] Bar receives beverage items (correct bar based on area)
- [ ] Cashier room receives new order notifications
- [ ] Order status updates broadcast correctly
- [ ] Connection cleanup works properly

---

## 🚨 Important Notes

1. **Thread Safety**: Use `Arc` and `DashMap` for shared state
2. **Error Handling**: Don't panic on WebSocket errors
3. **Logging**: Comprehensive logging for debugging
4. **Performance**: Non-blocking message sending
5. **Cleanup**: Proper cleanup on disconnect

