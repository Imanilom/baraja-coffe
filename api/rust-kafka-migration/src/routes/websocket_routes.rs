use axum::{
    Router,
    routing::get,
};
use std::sync::Arc;

use crate::AppState;
use crate::websocket::device_socket;

pub fn websocket_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/ws/device", get(device_socket::handle_device_connection))
}
