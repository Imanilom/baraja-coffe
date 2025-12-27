use axum::{
    routing::get,
    Router,
};
use std::sync::Arc;

use crate::AppState;
use crate::handlers::{sales_report, customer_report, profit_loss_report, export_report};

pub fn report_routes() -> Router<Arc<AppState>> {
    Router::new()
        // Sales Reports
        .route("/reports/sales", get(sales_report::get_sales_report))
        .route("/reports/sales/summary", get(sales_report::get_sales_summary))
        .route("/reports/sales/cashier-list", get(sales_report::get_cashiers_list))
        
        // Customer Reports
        .route("/reports/customers", get(customer_report::get_customer_reports))
        .route("/reports/customers/insights/overview", get(customer_report::get_customer_insights))
        
        // Profit/Loss Reports
        .route("/reports/main/profit-loss", get(profit_loss_report::get_profit_loss_report))
        .route("/reports/main/discount-usage", get(profit_loss_report::get_discount_usage_report))
        
        // Export Routes
        .route("/reports/sales/export-to-csv", get(export_report::export_sales_to_csv))
        .route("/reports/customers/export", get(export_report::export_customers_to_csv))
        .route("/reports/main/profit-loss/export", get(export_report::export_profit_loss_to_csv))
}

