#![allow(dead_code)]
use axum::{
    extract::{ws::{WebSocket, WebSocketUpgrade, Message}, State},
    response::IntoResponse,
    // http::StatusCode,
};
use futures::{sink::SinkExt, stream::StreamExt};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use uuid::Uuid;

use crate::AppState;
use crate::websocket::socket_state::{SocketState, ConnectedDevice};
use crate::error::{AppResult, AppError};

#[derive(Debug, Deserialize)]
pub struct DeviceConnectRequest {
    #[serde(rename = "deviceId")]
    pub device_id: String,
    
    #[serde(rename = "outletId")]
    pub outlet_id: String,
    
    pub role: String,
    
    pub location: String,
    
    #[serde(rename = "deviceName")]
    pub device_name: String,
    
    #[serde(rename = "assignedAreas", default)]
    pub assigned_areas: Vec<String>,
    
    #[serde(rename = "assignedTables", default)]
    pub assigned_tables: Vec<String>,
    
    #[serde(rename = "orderTypes", default)]
    pub order_types: Vec<String>,
    
    #[serde(rename = "sessionId")]
    pub session_id: String,
}

#[derive(Debug, Serialize)]
pub struct DeviceConnectResponse {
    pub success: bool,
    pub message: String,
    #[serde(rename = "socketId", skip_serializing_if = "Option::is_none")]
    pub socket_id: Option<String>,
}

/// WebSocket upgrade handler for device connections
pub async fn handle_device_connection(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_device_socket(socket, state))
}

/// Handle WebSocket connection for a device
async fn handle_device_socket(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();
    let socket_id = Uuid::new_v4().to_string();

    tracing::info!("🔌 New WebSocket connection: {}", socket_id);

    // Wait for device registration message
    if let Some(Ok(Message::Text(text))) = receiver.next().await {
        match serde_json::from_str::<DeviceConnectRequest>(&text) {
            Ok(device_data) => {
                // Validate device exists in database
                match validate_device(&state, &device_data).await {
                    Ok(outlet_id) => {
                        // Register device in socket state
                        let device = ConnectedDevice {
                            socket_id: socket_id.clone(),
                            device_id: device_data.device_id.clone(),
                            outlet_id,
                            role: device_data.role.clone(),
                            location: device_data.location.clone(),
                            device_name: device_data.device_name.clone(),
                            assigned_areas: device_data.assigned_areas.clone(),
                            assigned_tables: device_data.assigned_tables.clone(),
                            order_types: device_data.order_types.clone(),
                            session_id: device_data.session_id.clone(),
                            connected_at: chrono::Utc::now(),
                        };

                        state.socket_state.register_device(device.clone()).await;

                        // Send success response
                        let response = DeviceConnectResponse {
                            success: true,
                            message: "Device connected successfully".to_string(),
                            socket_id: Some(socket_id.clone()),
                        };

                        if let Ok(msg) = serde_json::to_string(&response) {
                            let _ = sender.send(Message::Text(msg)).await;
                        }

                        // Handle incoming messages
                        handle_device_messages(
                            socket_id.clone(),
                            sender,
                            receiver,
                            state.clone(),
                        ).await;
                    }
                    Err(e) => {
                        tracing::error!("Device validation failed: {:?}", e);
                        let response = DeviceConnectResponse {
                            success: false,
                            message: format!("Device validation failed: {}", e),
                            socket_id: None,
                        };
                        if let Ok(msg) = serde_json::to_string(&response) {
                            let _ = sender.send(Message::Text(msg)).await;
                        }
                    }
                }
            }
            Err(e) => {
                tracing::error!("Failed to parse device registration: {:?}", e);
                let response = DeviceConnectResponse {
                    success: false,
                    message: "Invalid registration data".to_string(),
                    socket_id: None,
                };
                if let Ok(msg) = serde_json::to_string(&response) {
                    let _ = sender.send(Message::Text(msg)).await;
                }
            }
        }
    }
}

/// Validate device exists and is active
async fn validate_device(
    state: &AppState,
    device_data: &DeviceConnectRequest,
) -> AppResult<ObjectId> {
    let outlet_id = ObjectId::parse_str(&device_data.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let collection: mongodb::Collection<crate::db::models::device::Device> = 
        state.db.collection("devices");

    let filter = mongodb::bson::doc! {
        "deviceId": &device_data.device_id,
        "outlet": outlet_id,
        "role": &device_data.role,
        "isActive": true,
    };

    let device = collection.find_one(filter, None)
        .await
        .map_err(|e| AppError::Database(e))?
        .ok_or_else(|| AppError::Unauthorized("Device not registered or inactive".to_string()))?;

    Ok(outlet_id)
}

/// Handle incoming messages from device
async fn handle_device_messages(
    socket_id: String,
    mut sender: futures::stream::SplitSink<WebSocket, Message>,
    mut receiver: futures::stream::SplitStream<WebSocket>,
    state: Arc<AppState>,
) {
    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                tracing::debug!("Received message from {}: {}", socket_id, text);
                
                // Handle different message types
                if let Ok(msg_data) = serde_json::from_str::<DeviceMessage>(&text) {
                    handle_device_message(&socket_id, msg_data, &state).await;
                }
            }
            Ok(Message::Ping(data)) => {
                // Respond to ping with pong
                let _ = sender.send(Message::Pong(data)).await;
            }
            Ok(Message::Close(_)) => {
                tracing::info!("Device {} closed connection", socket_id);
                break;
            }
            Err(e) => {
                tracing::error!("WebSocket error for {}: {:?}", socket_id, e);
                break;
            }
            _ => {}
        }
    }

    // Clean up on disconnect
    state.socket_state.handle_disconnection(&socket_id).await;
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
enum DeviceMessage {
    #[serde(rename = "heartbeat")]
    Heartbeat,
    
    #[serde(rename = "status_update")]
    StatusUpdate { status: String },
    
    #[serde(rename = "print_complete")]
    PrintComplete { 
        #[serde(rename = "orderId")]
        order_id: String 
    },
}

async fn handle_device_message(
    socket_id: &str,
    message: DeviceMessage,
    state: &AppState,
) {
    match message {
        DeviceMessage::Heartbeat => {
            tracing::debug!("Heartbeat from {}", socket_id);
        }
        DeviceMessage::StatusUpdate { status } => {
            tracing::info!("Device {} status update: {}", socket_id, status);
        }
        DeviceMessage::PrintComplete { order_id } => {
            tracing::info!("Device {} completed printing order: {}", socket_id, order_id);
            // TODO: Update order print status in database
        }
    }
}

/// Broadcast message to specific device
pub async fn broadcast_to_device(
    socket_state: &SocketState,
    socket_id: &str,
    event: &str,
    data: serde_json::Value,
) -> AppResult<()> {
    // In a real implementation, we'd need to store sender channels
    // For now, this is a placeholder that shows the structure
    tracing::info!("Broadcasting {} to device {}", event, socket_id);
    Ok(())
}
