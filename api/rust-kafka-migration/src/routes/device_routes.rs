use axum::{
    Router,
    routing::{get, post, put, delete},
};
use std::sync::Arc;

use crate::AppState;
use crate::handlers::device;

pub fn device_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/devices", post(device::create_device))
        .route("/devices", get(device::get_devices_by_outlet))
        .route("/devices/:id", put(device::update_device))
        .route("/devices/:id", delete(device::delete_device))
        .route("/devices/quotas", post(device::set_device_quotas))
        .route("/devices/quotas", get(device::get_device_quotas))
}
