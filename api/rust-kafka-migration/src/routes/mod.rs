use axum::{
    routing::{get, post, put, delete},
    Router,
    middleware,
};
use std::sync::Arc;

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
        .route("/categories", get(handlers::menu::get_categories))
        .route("/debug/db", get(handlers::menu::list_collections_debug))
}

/// Create product routes
fn product_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(handlers::get_products).post(handlers::create_product))
        .route("/bulk", post(handlers::bulk_create_products))
        .route("/search", get(handlers::search_products))
        .route("/:id", get(handlers::get_product).put(handlers::update_product).delete(handlers::delete_product))
        .route("/:id/price", put(handlers::update_product_price))
}

/// Create supplier routes
fn supplier_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(handlers::supplier::get_suppliers).post(handlers::create_supplier))
        .route("/bulk", post(handlers::bulk_create_suppliers))
        .route("/:id", put(handlers::update_supplier).delete(handlers::delete_supplier))
}

/// Create marketlist routes
fn marketlist_routes(state: Arc<AppState>) -> Router<Arc<AppState>> {
    Router::new()
        .route("/requests", get(handlers::get_requests).post(handlers::create_request))
        .route("/requests/:id", get(handlers::get_request))
        .route("/requests/:id/approve", post(handlers::approve_request_items))
        .route("/purchase", post(handlers::record_purchase))
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware))
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
        .route("/suppliers", get(handlers::supplier::get_suppliers))
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
        .nest("/api/products", product_routes())
        .nest("/api/suppliers", supplier_routes())
        .nest("/api/marketlist", marketlist_routes(state.clone()))
}
