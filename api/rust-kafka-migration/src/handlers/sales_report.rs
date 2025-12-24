use futures::stream::TryStreamExt;
use axum::{
    extract::{State, Query},
    response::IntoResponse,
    // Json,
};
use std::sync::Arc;
use mongodb::bson::{doc, oid::ObjectId, DateTime as BsonDateTime};
use serde::Deserialize;
use serde_json::json;
use chrono::NaiveDate;

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::reports::*;

#[derive(Debug, Deserialize)]
pub struct SalesReportQuery {
    #[serde(rename = "startDate", skip_serializing_if = "Option::is_none")]
    pub start_date: Option<String>,
    
    #[serde(rename = "endDate", skip_serializing_if = "Option::is_none")]
    pub end_date: Option<String>,
    
    #[serde(rename = "cashierId", skip_serializing_if = "Option::is_none")]
    pub cashier_id: Option<String>,
    
    #[serde(rename = "outletId", skip_serializing_if = "Option::is_none")]
    pub outlet_id: Option<String>,
    
    #[serde(rename = "paymentMethod", skip_serializing_if = "Option::is_none")]
    pub payment_method: Option<String>,
    
    #[serde(rename = "orderType", skip_serializing_if = "Option::is_none")]
    pub order_type: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub page: Option<i32>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<i32>,
}

/// Get all sales (simple list)
pub async fn get_sales_report(
    State(state): State<Arc<AppState>>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let mut cursor = order_collection
        .find(None, None)
        .await
        .map_err(|e| AppError::Database(e))?;

    let mut orders = Vec::new();
    while let Some(doc) = cursor.try_next().await.map_err(|e| AppError::Database(e))? {
        let order = doc; // already deserialized if typed, but here it's Document
        orders.push(order);
    }

    Ok(ApiResponse::success(json!({
        "data": orders
    })))
}

/// Get sales summary with breakdowns
pub async fn get_sales_summary(
    State(state): State<Arc<AppState>>,
    Query(query): Query<SalesReportQuery>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    // Build filter
    let mut filter = doc! { "status": "Completed" };
    
    // Date filter
    if let (Some(start), Some(end)) = (&query.start_date, &query.end_date) {
        let start_date = NaiveDate::parse_from_str(start, "%Y-%m-%d")
            .map_err(|_| AppError::BadRequest("Invalid start date format".to_string()))?
            .and_hms_opt(0, 0, 0)
            .ok_or_else(|| AppError::BadRequest("Invalid start date".to_string()))?;
        
        let end_date = NaiveDate::parse_from_str(end, "%Y-%m-%d")
            .map_err(|_| AppError::BadRequest("Invalid end date format".to_string()))?
            .and_hms_opt(23, 59, 59)
            .ok_or_else(|| AppError::BadRequest("Invalid end date".to_string()))?;
        
        filter.insert("createdAt", doc! {
            "$gte": BsonDateTime::from_millis(start_date.and_utc().timestamp_millis()),
            "$lte": BsonDateTime::from_millis(end_date.and_utc().timestamp_millis())
        });
    }
    
    // Cashier filter
    if let Some(cashier_id) = &query.cashier_id {
        let cashier_oid = ObjectId::parse_str(cashier_id)
            .map_err(|_| AppError::BadRequest("Invalid cashier ID".to_string()))?;
        filter.insert("cashierId", cashier_oid);
    }
    
    // Outlet filter
    if let Some(outlet_id) = &query.outlet_id {
        let outlet_oid = ObjectId::parse_str(outlet_id)
            .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;
        filter.insert("outlet", outlet_oid);
    }
    
    // Order type filter
    if let Some(order_type) = &query.order_type {
        let types: Vec<&str> = order_type.split(',').collect();
        filter.insert("orderType", doc! { "$in": types });
    }
    
    // Summary aggregation pipeline
    let summary_pipeline = vec![
        doc! { "$match": filter.clone() },
        doc! {
            "$lookup": {
                "from": "payments",
                "localField": "order_id",
                "foreignField": "order_id",
                "as": "payments"
            }
        },
        doc! {
            "$addFields": {
                "actualPaymentMethod": {
                    "$arrayElemAt": [
                        {
                            "$map": {
                                "input": {
                                    "$filter": {
                                        "input": "$payments",
                                        "as": "payment",
                                        "cond": { "$in": ["$$payment.status", ["settlement", "paid"]] }
                                    }
                                },
                                "as": "p",
                                "in": "$$p.method_type"
                            }
                        },
                        0
                    ]
                }
            }
        },
        doc! {
            "$group": {
                "_id": null,
                "totalSales": { "$sum": "$grandTotal" },
                "totalTransactions": { "$sum": 1 },
                "totalTax": { "$sum": "$totalTax" },
                "totalServiceFee": { "$sum": "$totalServiceFee" },
                "totalItems": { "$sum": { "$size": "$items" } },
                "avgOrderValue": { "$avg": "$grandTotal" },
                "totalDiscount": {
                    "$sum": {
                        "$add": [
                            "$discounts.autoPromoDiscount",
                            "$discounts.manualDiscount",
                            "$discounts.voucherDiscount"
                        ]
                    }
                }
            }
        }
    ];
    
    let mut cursor = order_collection.aggregate(summary_pipeline, None).await
        .map_err(|e| AppError::Database(e))?;
    
    let summary = if let Some(doc) = cursor.try_next().await.map_err(|e| AppError::Database(e))? {
        SalesSummary {
            total_sales: doc.get_f64("totalSales").unwrap_or(0.0),
            total_transactions: doc.get_i32("totalTransactions").unwrap_or(0),
            avg_order_value: doc.get_f64("avgOrderValue").unwrap_or(0.0),
            total_tax: doc.get_f64("totalTax").unwrap_or(0.0),
            total_service_fee: doc.get_f64("totalServiceFee").unwrap_or(0.0),
            total_discount: doc.get_f64("totalDiscount").unwrap_or(0.0),
            total_items: doc.get_i32("totalItems").unwrap_or(0),
        }
    } else {
        SalesSummary {
            total_sales: 0.0,
            total_transactions: 0,
            avg_order_value: 0.0,
            total_tax: 0.0,
            total_service_fee: 0.0,
            total_discount: 0.0,
            total_items: 0,
        }
    };
    
    // Payment breakdown
    let payment_pipeline = vec![
        doc! { "$match": filter.clone() },
        doc! {
            "$lookup": {
                "from": "payments",
                "localField": "order_id",
                "foreignField": "order_id",
                "as": "payments"
            }
        },
        doc! { "$unwind": "$payments" },
        doc! {
            "$match": {
                "payments.status": { "$in": ["settlement", "paid"] },
                "payments.isAdjustment": { "$ne": true }
            }
        },
        doc! {
            "$group": {
                "_id": "$payments.method_type",
                "total": { "$sum": "$payments.amount" },
                "count": { "$sum": 1 }
            }
        }
    ];
    
    let mut payment_cursor = order_collection.aggregate(payment_pipeline, None).await
        .map_err(|e| AppError::Database(e))?;
    
    let mut payment_breakdown = Vec::new();
    let mut total_payment_amount = 0.0;
    
    while let Some(doc) = payment_cursor.try_next().await.map_err(|e| AppError::Database(e))? {
        let amount = doc.get_f64("total").unwrap_or(0.0);
        total_payment_amount += amount;
        
        payment_breakdown.push(PaymentBreakdown {
            method: doc.get_str("_id").unwrap_or("Unknown").to_string(),
            amount,
            count: doc.get_i32("count").unwrap_or(0),
            percentage: 0.0, // Will calculate after
            breakdown: None,
        });
    }
    
    // Calculate percentages
    for item in &mut payment_breakdown {
        if total_payment_amount > 0.0 {
            item.percentage = (item.amount / total_payment_amount) * 100.0;
        }
    }
    
    // Order type breakdown
    let order_type_pipeline = vec![
        doc! { "$match": filter },
        doc! {
            "$group": {
                "_id": "$orderType",
                "count": { "$sum": 1 },
                "total": { "$sum": "$grandTotal" }
            }
        }
    ];
    
    let mut order_type_cursor = order_collection.aggregate(order_type_pipeline, None).await
        .map_err(|e| AppError::Database(e))?;
    
    let mut order_type_breakdown = Vec::new();
    let mut total_orders = 0;
    
    while let Some(doc) = order_type_cursor.try_next().await.map_err(|e| AppError::Database(e))? {
        let count = doc.get_i32("count").unwrap_or(0);
        total_orders += count;
        
        order_type_breakdown.push(OrderTypeBreakdown {
            order_type: doc.get_str("_id").unwrap_or("Unknown").to_string(),
            count,
            total: doc.get_f64("total").unwrap_or(0.0),
            percentage: 0.0, // Will calculate after
        });
    }
    
    // Calculate percentages
    for item in &mut order_type_breakdown {
        if total_orders > 0 {
            item.percentage = (item.count as f64 / total_orders as f64) * 100.0;
        }
    }
    
    Ok(ApiResponse::success(json!({
        "summary": summary,
        "paymentMethodBreakdown": payment_breakdown,
        "orderTypeBreakdown": order_type_breakdown
    })))
}

/// Get cashiers list
pub async fn get_cashiers_list(
    State(state): State<Arc<AppState>>,
) -> AppResult<impl IntoResponse> {
    let user_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("users");
    
    let mut cursor = user_collection
        .find(doc! { "role": "cashier" }, None)
        .await
        .map_err(|e| AppError::Database(e))?;

    let mut cashiers = Vec::new();
    while let Some(cashier) = cursor.try_next().await.map_err(|e| AppError::Database(e))? {
        cashiers.push(json!({
            "_id": cashier.get_object_id("_id").ok(),
            "username": cashier.get_str("username").unwrap_or("Unknown"),
            "email": cashier.get_str("email").ok(),
        }));
    }

    Ok(ApiResponse::success(json!({
        "cashiers": cashiers
    })))
}
