use axum::{
    routing::{get, post, put},
    Router,
};
use std::sync::Arc;

use crate::AppState;
use crate::handlers::{table_management, workstation, analytics};

pub fn advanced_pos_routes() -> Router<Arc<AppState>> {
    Router::new()
        // Table Management (GRO)
        .route("/tables/available", get(table_management::get_available_tables))
        .route("/table-occupancy/:outletId", get(table_management::get_table_occupancy))
        .route("/orders/:orderId/transfer-table", post(table_management::transfer_order_table))
        .route("/orders/:orderId/table-history", get(table_management::get_table_history))
        .route("/tables/bulk-update-status", post(table_management::bulk_update_table_status))
        
        // Workstation (Kitchen/Bar)
        .route("/workstation/:workstationType/orders", get(workstation::get_workstation_orders))
        .route("/workstation/orders/:orderId/items/:itemId/status", put(workstation::update_workstation_item_status))
        .route("/workstation/orders/:orderId/items/bulk-update", put(workstation::bulk_update_workstation_items))
        .route("/orders/kitchen", get(workstation::get_kitchen_orders))
        .route("/orders/bar/:barType", get(workstation::get_bar_orders))
        
        // Analytics
        .route("/analytics/cashier/:cashierId/metrics", get(analytics::get_cashier_metrics))
        .route("/analytics/print-failure-analysis", get(analytics::get_print_failure_analysis))
        .route("/analytics/order-completion-metrics", get(analytics::get_order_completion_metrics))
}
