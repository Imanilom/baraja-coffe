use axum::{
    routing::{get, post, put, delete},
    Router,
};
use std::sync::Arc;

use crate::AppState;
use crate::handlers::{printer, order_operations};

pub fn printer_routes() -> Router<Arc<AppState>> {
    Router::new()
        // Printer configuration
        .route("/printers", post(printer::create_printer_config))
        .route("/printers", get(printer::get_printer_configs))
        .route("/printers/:id", get(printer::get_printer_by_id))
        .route("/printers/:id", put(printer::update_printer_config))
        .route("/printers/:id", delete(printer::delete_printer_config))
        .route("/printers/:id/test", post(printer::test_printer_connection))
        .route("/printers/:id/health", get(printer::get_printer_health))
        
        // Print logging
        .route("/print/log-attempt", post(printer::log_print_attempt))
        .route("/print/log-success", post(printer::log_print_success))
        .route("/print/log-failure", post(printer::log_print_failure))
        .route("/print/stats", get(printer::get_print_stats))
        .route("/print/order/:orderId/history", get(printer::get_order_print_history))
}

pub fn order_operations_routes() -> Router<Arc<AppState>> {
    Router::new()
        // Get orders
        .route("/orders/pending/:outletId", get(order_operations::get_pending_orders))
        .route("/orders/active/:outletId", get(order_operations::get_active_orders))
        .route("/orders/:orderId", get(order_operations::get_order_by_id))
        .route("/orders/cashier/:cashierId", get(order_operations::get_cashier_orders))
        
        // Order confirmation
        .route("/orders/:orderId/confirm", post(order_operations::confirm_order))
        .route("/orders/:jobId/confirm-cashier", post(order_operations::confirm_order_by_cashier))
        .route("/orders/batch-confirm", post(order_operations::batch_confirm_orders))
        
        // Order editing
        .route("/orders/:orderId/edit", put(order_operations::edit_order))
        .route("/orders/delete-item", post(order_operations::delete_order_item))
        
        // Payment
        .route("/orders/cashier/process-payment", post(order_operations::process_payment_cashier))
        .route("/orders/:orderId/payment-status", get(order_operations::get_payment_status))
        
        // Status updates
        .route("/orders/:orderId/status", put(order_operations::update_order_status))
        .route("/orders/:orderId/items/:itemId/status", put(order_operations::update_item_status))
}
