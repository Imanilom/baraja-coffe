use axum::{
    routing::post,
    Router,
};
use std::sync::Arc;

use crate::AppState;
use crate::handlers::webhook;

pub fn webhook_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/webhooks/midtrans", post(webhook::midtrans_webhook))
        .route("/webhooks/midtrans-reservation", post(webhook::midtrans_webhook))
}
