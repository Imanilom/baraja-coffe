#![allow(dead_code)]
use futures::stream::TryStreamExt;
use axum::{
    extract::{State, Query},
    response::Response,
    http::{header, StatusCode},
};
use std::sync::Arc;
use mongodb::bson::{doc, oid::ObjectId, DateTime as BsonDateTime};
use serde::Deserialize;
use chrono::NaiveDate;

use crate::AppState;
use crate::error::{AppResult, AppError};

#[derive(Debug, Deserialize)]
pub struct ExportQuery {
    #[serde(rename = "startDate")]
    pub start_date: String,
    
    #[serde(rename = "endDate")]
    pub end_date: String,
    
    #[serde(rename = "outletId", skip_serializing_if = "Option::is_none")]
    pub outlet_id: Option<String>,
    
    #[serde(rename = "reportType", skip_serializing_if = "Option::is_none")]
    pub report_type: Option<String>,
}

/// Export sales data to CSV
pub async fn export_sales_to_csv(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ExportQuery>,
) -> AppResult<Response> {
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let start = NaiveDate::parse_from_str(&query.start_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid start date format".to_string()))?
        .and_hms_opt(0, 0, 0)
        .ok_or_else(|| AppError::BadRequest("Invalid start date".to_string()))?
        .and_utc();
    
    let end = NaiveDate::parse_from_str(&query.end_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid end date format".to_string()))?
        .and_hms_opt(23, 59, 59)
        .ok_or_else(|| AppError::BadRequest("Invalid end date".to_string()))?
        .and_utc();
    
    let mut filter = doc! {
        "createdAt": {
            "$gte": BsonDateTime::from_millis(start.timestamp_millis()),
            "$lte": BsonDateTime::from_millis(end.timestamp_millis())
        },
        "status": "Completed"
    };
    
    if let Some(outlet_id) = &query.outlet_id {
        let outlet_oid = ObjectId::parse_str(outlet_id)
            .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;
        filter.insert("outlet", outlet_oid);
    }
    
    let mut cursor = order_collection.find(filter, None).await
        .map_err(|e| AppError::Database(e))?;
    
    // Build CSV
    let mut csv_content = String::from("Order ID,Date,Customer,Order Type,Payment Method,Total Before Discount,Total Discount,Tax,Service Fee,Grand Total\n");
    
    while let Some(doc) = cursor.try_next().await.map_err(|e| AppError::Database(e))? {
        let order_id = doc.get_str("order_id").unwrap_or("");
        let created_at = doc.get_datetime("createdAt").ok()
            .map(|dt| dt.to_chrono().to_rfc3339())
            .unwrap_or_default();
        let customer = doc.get_str("user").unwrap_or("Guest");
        let order_type = doc.get_str("orderType").unwrap_or("");
        let payment_method = doc.get_str("paymentMethod").unwrap_or("");
        let total_before = doc.get_f64("totalBeforeDiscount").unwrap_or(0.0);
        
        let discounts = doc.get_document("discounts").ok();
        let total_discount = if let Some(disc) = discounts {
            disc.get_f64("autoPromoDiscount").unwrap_or(0.0) +
            disc.get_f64("manualDiscount").unwrap_or(0.0) +
            disc.get_f64("voucherDiscount").unwrap_or(0.0)
        } else {
            0.0
        };
        
        let tax = doc.get_f64("totalTax").unwrap_or(0.0);
        let service_fee = doc.get_f64("totalServiceFee").unwrap_or(0.0);
        let grand_total = doc.get_f64("grandTotal").unwrap_or(0.0);
        
        csv_content.push_str(&format!(
            "{},{},{},{},{},{},{},{},{},{}\n",
            order_id, created_at, customer, order_type, payment_method,
            total_before, total_discount, tax, service_fee, grand_total
        ));
    }
    
    let response = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/csv")
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"sales_report_{}_{}.csv\"", query.start_date, query.end_date)
        )
        .body(csv_content.into())
        .map_err(|e| AppError::Internal(e.to_string()))?;
    
    Ok(response)
}

/// Export customer data to CSV
pub async fn export_customers_to_csv(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ExportQuery>,
) -> AppResult<Response> {
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let start = NaiveDate::parse_from_str(&query.start_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid start date format".to_string()))?
        .and_hms_opt(0, 0, 0)
        .ok_or_else(|| AppError::BadRequest("Invalid start date".to_string()))?
        .and_utc();
    
    let end = NaiveDate::parse_from_str(&query.end_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid end date format".to_string()))?
        .and_hms_opt(23, 59, 59)
        .ok_or_else(|| AppError::BadRequest("Invalid end date".to_string()))?
        .and_utc();
    
    let match_conditions = doc! {
        "createdAt": {
            "$gte": BsonDateTime::from_millis(start.timestamp_millis()),
            "$lte": BsonDateTime::from_millis(end.timestamp_millis())
        },
        "status": { "$in": ["Completed", "Reserved", "OnProcess"] }
    };
    
    let pipeline = vec![
        doc! { "$match": match_conditions },
        doc! {
            "$group": {
                "_id": "$user_id",
                "customerName": { "$first": "$user" },
                "orderCount": { "$sum": 1 },
                "totalSpent": { "$sum": "$grandTotal" },
                "avgOrderValue": { "$avg": "$grandTotal" }
            }
        },
        doc! { "$sort": { "totalSpent": -1 } }
    ];
    
    let mut cursor = order_collection.aggregate(pipeline, None).await
        .map_err(|e| AppError::Database(e))?;
    
    // Build CSV
    let mut csv_content = String::from("Customer Name,Order Count,Total Spent,Average Order Value\n");
    
    while let Some(doc) = cursor.try_next().await.map_err(|e| AppError::Database(e))? {
        let customer_name = doc.get_str("customerName").unwrap_or("Unknown");
        let order_count = doc.get_i32("orderCount").unwrap_or(0);
        let total_spent = doc.get_f64("totalSpent").unwrap_or(0.0);
        let avg_order_value = doc.get_f64("avgOrderValue").unwrap_or(0.0);
        
        csv_content.push_str(&format!(
            "{},{},{:.2},{:.2}\n",
            customer_name, order_count, total_spent, avg_order_value
        ));
    }
    
    let response = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/csv")
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"customers_report_{}_{}.csv\"", query.start_date, query.end_date)
        )
        .body(csv_content.into())
        .map_err(|e| AppError::Internal(e.to_string()))?;
    
    Ok(response)
}

/// Export profit/loss data to CSV
pub async fn export_profit_loss_to_csv(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ExportQuery>,
) -> AppResult<Response> {
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let start = NaiveDate::parse_from_str(&query.start_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid start date format".to_string()))?
        .and_hms_opt(0, 0, 0)
        .ok_or_else(|| AppError::BadRequest("Invalid start date".to_string()))?
        .and_utc();
    
    let end = NaiveDate::parse_from_str(&query.end_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid end date format".to_string()))?
        .and_hms_opt(23, 59, 59)
        .ok_or_else(|| AppError::BadRequest("Invalid end date".to_string()))?
        .and_utc();
    
    let match_conditions = doc! {
        "createdAt": {
            "$gte": BsonDateTime::from_millis(start.timestamp_millis()),
            "$lte": BsonDateTime::from_millis(end.timestamp_millis())
        },
        "status": "Completed"
    };
    
    let pipeline = vec![
        doc! { "$match": match_conditions },
        doc! {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$createdAt"
                    }
                },
                "totalOrders": { "$sum": 1 },
                "totalRevenue": { "$sum": "$grandTotal" },
                "totalCost": { "$sum": { "$multiply": ["$totalBeforeDiscount", 0.4] } },
                "totalProfit": {
                    "$sum": {
                        "$subtract": [
                            "$grandTotal",
                            { "$multiply": ["$totalBeforeDiscount", 0.4] }
                        ]
                    }
                }
            }
        },
        doc! { "$sort": { "_id": 1 } }
    ];
    
    let mut cursor = order_collection.aggregate(pipeline, None).await
        .map_err(|e| AppError::Database(e))?;
    
    // Build CSV
    let mut csv_content = String::from("Date,Total Orders,Total Revenue,Total Cost,Total Profit,Profit Margin %\n");
    
    while let Some(doc) = cursor.try_next().await.map_err(|e| AppError::Database(e))? {
        let date = doc.get_str("_id").unwrap_or("");
        let total_orders = doc.get_i32("totalOrders").unwrap_or(0);
        let total_revenue = doc.get_f64("totalRevenue").unwrap_or(0.0);
        let total_cost = doc.get_f64("totalCost").unwrap_or(0.0);
        let total_profit = doc.get_f64("totalProfit").unwrap_or(0.0);
        let profit_margin = if total_revenue > 0.0 {
            (total_profit / total_revenue) * 100.0
        } else {
            0.0
        };
        
        csv_content.push_str(&format!(
            "{},{},{:.2},{:.2},{:.2},{:.2}\n",
            date, total_orders, total_revenue, total_cost, total_profit, profit_margin
        ));
    }
    
    let response = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/csv")
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"profit_loss_report_{}_{}.csv\"", query.start_date, query.end_date)
        )
        .body(csv_content.into())
        .map_err(|e| AppError::Internal(e.to_string()))?;
    
    Ok(response)
}
