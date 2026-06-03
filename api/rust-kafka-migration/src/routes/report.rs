use axum::{
    routing::get,
    Router,
};
use std::sync::Arc;

use crate::{
    handlers::report::{dashboard, payment, sales},
    AppState,
};

pub fn report_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/dashboard", get(dashboard::get_dashboard_data))
        .route("/dashboard/quick-stats", get(dashboard::get_quick_stats))
        .route("/payment", get(payment::generate_sales_report))
        .route("/sales/summary", get(sales::get_sales_summary))
        .route("/sales/daily-profit", get(sales::get_daily_profit))
        .route("/sales/product", get(sales::get_product_sales_report))
}
