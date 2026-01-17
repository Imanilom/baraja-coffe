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
    
    // Generate a unique Client ID
    let client_id = uuid::Uuid::new_v4().to_string();
    
    info!("WebSocket client connected: {}", client_id);
    
    // Register client
    state.ws_manager.register_client(client_id.clone(), tx);
    
    // Spawn task to send messages to client
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });
    
    // Handle incoming messages
    let ws_manager = state.ws_manager.clone();
    let client_id_clone = client_id.clone();
    
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                if let Err(e) = handle_client_message(&text, &client_id_clone, &ws_manager).await {
                    error!("Error handling message from {}: {:?}", client_id_clone, e);
                }
            } else if let Message::Close(_) = msg {
                break;
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
    let msg: ClientMessage = serde_json::from_str(text)?;
    
    match msg {
        ClientMessage::RegisterDevice { data } => {
            manager.register_device(client_id.to_string(), data);
            
            // Send acknowledgement
            let ack = WebSocketMessage::DeviceRegistered { 
                device_id: client_id.to_string(), 
                success: true 
            };
            if let Ok(json) = serde_json::to_string(&ack) {
                if let Some(sender) = manager.clients.get(client_id) {
                    let _ = sender.send(json);
                }
            }
        }
        ClientMessage::JoinRoom { room } => {
            manager.join_room(client_id.to_string(), room);
        }
        ClientMessage::LeaveRoom { room } => {
            manager.leave_room(&client_id.to_string(), &room);
        }
        ClientMessage::Ping => {
            // Optional: Send pong or just verify connection
        }
    }
    
    Ok(())
}
