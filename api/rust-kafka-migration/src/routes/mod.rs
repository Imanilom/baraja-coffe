use axum::{
    routing::{get, post},
    Router,
    middleware,
};
use std::sync::Arc;

mod device_routes;
mod websocket_routes;
mod pos_routes;
mod webhook_routes_new;
mod advanced_pos_routes;
mod stock_routes;
mod report_routes;

use crate::error::ApiResponse;
use crate::handlers;
use crate::middleware::auth_middleware;
use crate::AppState;

/// Health check handler - matches Node.js format
async fn health_check() -> axum::Json<ApiResponse<serde_json::Value>> {
    axum::Json(ApiResponse::success(serde_json::json!({
        "status": "ok",
        "service": "baraja-coffee-api",
        "version": env!("CARGO_PKG_VERSION"),
    })))
}

/// Create auth routes
fn auth_routes(state: Arc<AppState>) -> Router<Arc<AppState>> {
    // Public routes (no authentication required)
    let public_routes = Router::new()
        .route("/signup", post(handlers::signup))
        .route("/signin", post(handlers::signin))
        .route("/signout", get(handlers::signout));

    // Protected routes (require authentication)
    let protected_routes = Router::new()
        .route("/me", get(handlers::get_me))
        .route("/update-profile", post(handlers::update_profile))
        .route("/change-password", post(handlers::change_password))
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware));

    // Combine routes
    public_routes.merge(protected_routes)
}

/// Create menu routes
fn menu_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(handlers::get_menu_items).post(handlers::create_menu_item))
        .route("/:id", get(handlers::get_menu_item).put(handlers::update_menu_item).delete(handlers::delete_menu_item))
        .route("/categories", get(handlers::get_categories))
}

/// Create inventory routes
fn inventory_routes(state: Arc<AppState>) -> Router<Arc<AppState>> {
    Router::new()
        .route("/menu-stock/:id", post(handlers::adjust_menu_stock))
        .route("/product-stock/:id", post(handlers::update_product_stock))
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware))
}

/// Create outlet routes
fn outlet_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(handlers::get_outlets))
        .route("/:id", get(handlers::get_outlet))
        .route("/warehouses", get(handlers::get_warehouses))
        .route("/suppliers", get(handlers::get_suppliers))
}

/// Create order routes
fn order_routes(state: Arc<AppState>) -> Router<Arc<AppState>> {
    Router::new()
        .route("/unified-order", post(handlers::create_unified_order))
        .with_state(state)
}

/// Create application routes
pub fn create_routes(state: Arc<AppState>) -> Router<Arc<AppState>> {
    Router::new()
        .route("/health", get(health_check))
        .route("/api/health", get(health_check))
        .nest("/api/auth", auth_routes(state.clone()))
        .nest("/api/menu", menu_routes())
        .nest("/api/inventory", inventory_routes(state.clone()))
        .nest("/api/outlets", outlet_routes())
        .nest("/api/order", order_routes(state.clone()))
        .nest("/api", device_routes::device_routes())
        .nest("/api", pos_routes::printer_routes())
        .nest("/api", pos_routes::order_operations_routes())
        .nest("/api", advanced_pos_routes::advanced_pos_routes())
        .nest("/api", stock_routes::stock_routes())
        .nest("/api", report_routes::report_routes())
        .merge(websocket_routes::websocket_routes())
        .merge(webhook_routes_new::webhook_routes())
}
