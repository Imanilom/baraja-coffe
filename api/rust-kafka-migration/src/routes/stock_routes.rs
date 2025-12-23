use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;

use crate::AppState;
use crate::handlers::stock_management;

pub fn stock_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/stock/check-availability", post(stock_management::check_stock_availability))
        .route("/stock/deduct", post(stock_management::deduct_stock))
        .route("/stock/restore/:orderId", post(stock_management::restore_stock))
}
