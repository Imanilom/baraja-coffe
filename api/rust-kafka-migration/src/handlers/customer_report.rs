use axum::{
    extract::{State, Path, Query},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use mongodb::bson::{doc, oid::ObjectId, DateTime as BsonDateTime};
use serde::{Deserialize, Serialize};
use serde_json::json;
use chrono::{Utc, NaiveDate, Duration};

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::reports::*;

#[derive(Debug, Deserialize)]
pub struct CustomerReportQuery {
    #[serde(rename = "startDate", skip_serializing_if = "Option::is_none")]
    pub start_date: Option<String>,
    
    #[serde(rename = "endDate", skip_serializing_if = "Option::is_none")]
    pub end_date: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub outlet: Option<String>,
    
    #[serde(rename = "cashierId", skip_serializing_if = "Option::is_none")]
    pub cashier_id: Option<String>,
    
    #[serde(rename = "minOrders", skip_serializing_if = "Option::is_none")]
    pub min_orders: Option<i32>,
    
    #[serde(rename = "minSpent", skip_serializing_if = "Option::is_none")]
    pub min_spent: Option<f64>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub page: Option<i32>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<i32>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub search: Option<String>,
}

/// Get customer reports with order insights
pub async fn get_customer_reports(
    State(state): State<Arc<AppState>>,
    Query(query): Query<CustomerReportQuery>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    // Date range (default last 30 days)
    let end_date = Utc::now();
    let start_date = end_date - Duration::days(30);
    
    let start = if let Some(start_str) = &query.start_date {
        NaiveDate::parse_from_str(start_str, "%Y-%m-%d")
            .map_err(|_| AppError::BadRequest("Invalid start date".to_string()))?
            .and_hms_opt(0, 0, 0)
            .ok_or_else(|| AppError::BadRequest("Invalid start date".to_string()))?
            .and_utc()
    } else {
        start_date
    };
    
    let end = if let Some(end_str) = &query.end_date {
        NaiveDate::parse_from_str(end_str, "%Y-%m-%d")
            .map_err(|_| AppError::BadRequest("Invalid end date".to_string()))?
            .and_hms_opt(23, 59, 59)
            .ok_or_else(|| AppError::BadRequest("Invalid end date".to_string()))?
            .and_utc()
    } else {
        end_date
    };
    
    // Build match conditions
    let mut match_conditions = doc! {
        "createdAt": {
            "$gte": BsonDateTime::from_millis(start.timestamp_millis()),
            "$lte": BsonDateTime::from_millis(end.timestamp_millis())
        },
        "status": { "$in": ["Completed", "Reserved", "OnProcess"] }
    };
    
    if let Some(outlet_id) = &query.outlet {
        let outlet_oid = ObjectId::parse_str(outlet_id)
            .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;
        match_conditions.insert("outlet", outlet_oid);
    }
    
    if let Some(cashier_id) = &query.cashier_id {
        let cashier_oid = ObjectId::parse_str(cashier_id)
            .map_err(|_| AppError::BadRequest("Invalid cashier ID".to_string()))?;
        match_conditions.insert("cashierId", cashier_oid);
    }
    
    // Aggregation pipeline
    let pipeline = vec![
        doc! { "$match": match_conditions },
        doc! {
            "$group": {
                "_id": "$user_id",
                "orderCount": { "$sum": 1 },
                "totalSpent": { "$sum": "$grandTotal" },
                "avgOrderValue": { "$avg": "$grandTotal" },
                "firstOrderDate": { "$min": "$createdAt" },
                "lastOrderDate": { "$max": "$createdAt" },
                "customerNames": { "$addToSet": "$user" }
            }
        },
        doc! {
            "$match": {
                "orderCount": { "$gte": query.min_orders.unwrap_or(1) },
                "totalSpent": { "$gte": query.min_spent.unwrap_or(0.0) }
            }
        },
        doc! {
            "$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "_id",
                "as": "userDetails"
            }
        },
        doc! {
            "$unwind": {
                "path": "$userDetails",
                "preserveNullAndEmptyArrays": true
            }
        },
        doc! {
            "$project": {
                "userId": "$_id",
                "customerName": {
                    "$cond": {
                        "if": { "$eq": ["$_id", null] },
                        "then": "Guest Customer",
                        "else": {
                            "$ifNull": [
                                "$userDetails.username",
                                { "$arrayElemAt": ["$customerNames", 0] }
                            ]
                        }
                    }
                },
                "email": "$userDetails.email",
                "phone": "$userDetails.phone",
                "orderCount": 1,
                "totalSpent": 1,
                "avgOrderValue": { "$round": ["$avgOrderValue", 2] },
                "firstOrderDate": 1,
                "lastOrderDate": 1,
                "daysSinceLastOrder": {
                    "$divide": [
                        { "$subtract": [BsonDateTime::from_millis(Utc::now().timestamp_millis()), "$lastOrderDate"] },
                        86400000.0
                    ]
                },
                "customerSegment": {
                    "$switch": {
                        "branches": [
                            { "case": { "$gte": ["$totalSpent", 1000000.0] }, "then": "VIP" },
                            { "case": { "$gte": ["$totalSpent", 500000.0] }, "then": "Gold" },
                            { "case": { "$gte": ["$totalSpent", 100000.0] }, "then": "Silver" }
                        ],
                        "default": "Bronze"
                    }
                }
            }
        },
        doc! { "$sort": { "totalSpent": -1 } }
    ];
    
    let mut cursor = order_collection.aggregate(pipeline, None).await
        .map_err(|e| AppError::Database(e.to_string()))?;
    
    let mut customers = Vec::new();
    while cursor.advance().await.map_err(|e| AppError::Database(e.to_string()))? {
        let doc = cursor.deserialize_current()
            .map_err(|e| AppError::Database(e.to_string()))?;
        
        customers.push(json!({
            "userId": doc.get_object_id("userId").ok(),
            "customerName": doc.get_str("customerName").unwrap_or("Unknown"),
            "email": doc.get_str("email").ok(),
            "phone": doc.get_str("phone").ok(),
            "orderCount": doc.get_i32("orderCount").unwrap_or(0),
            "totalSpent": doc.get_f64("totalSpent").unwrap_or(0.0),
            "avgOrderValue": doc.get_f64("avgOrderValue").unwrap_or(0.0),
            "daysSinceLastOrder": doc.get_f64("daysSinceLastOrder").unwrap_or(0.0),
            "customerSegment": doc.get_str("customerSegment").unwrap_or("Bronze")
        }));
    }
    
    // Pagination
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20);
    let total_count = customers.len() as i64;
    let start_index = ((page - 1) * limit) as usize;
    let end_index = (start_index + limit as usize).min(customers.len());
    
    let paginated_customers = customers[start_index..end_index].to_vec();
    
    Ok(ApiResponse::success(json!({
        "data": paginated_customers,
        "pagination": {
            "totalCount": total_count,
            "page": page,
            "limit": limit,
            "totalPages": (total_count as f64 / limit as f64).ceil() as i32,
            "hasNextPage": end_index < customers.len(),
            "hasPrevPage": start_index > 0
        }
    })))
}

/// Get customer insights overview
pub async fn get_customer_insights(
    State(state): State<Arc<AppState>>,
    Query(query): Query<CustomerReportQuery>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let end_date = Utc::now();
    let start_date = end_date - Duration::days(30);
    
    let mut match_conditions = doc! {
        "createdAt": {
            "$gte": BsonDateTime::from_millis(start_date.timestamp_millis()),
            "$lte": BsonDateTime::from_millis(end_date.timestamp_millis())
        },
        "status": { "$in": ["Completed", "Reserved", "OnProcess"] }
    };
    
    if let Some(outlet_id) = &query.outlet {
        let outlet_oid = ObjectId::parse_str(outlet_id)
            .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;
        match_conditions.insert("outlet", outlet_oid);
    }
    
    // Basic metrics
    let metrics_pipeline = vec![
        doc! { "$match": match_conditions.clone() },
        doc! {
            "$group": {
                "_id": null,
                "totalOrders": { "$sum": 1 },
                "totalRevenue": { "$sum": "$grandTotal" },
                "uniqueCustomers": { "$addToSet": "$user_id" },
                "totalItemsSold": { "$sum": { "$size": "$items" } }
            }
        },
        doc! {
            "$project": {
                "totalOrders": 1,
                "totalRevenue": 1,
                "uniqueCustomers": { "$size": "$uniqueCustomers" },
                "totalItemsSold": 1,
                "avgOrderValue": {
                    "$cond": [
                        { "$eq": ["$totalOrders", 0] },
                        0.0,
                        { "$divide": ["$totalRevenue", "$totalOrders"] }
                    ]
                }
            }
        }
    ];
    
    let mut cursor = order_collection.aggregate(metrics_pipeline, None).await
        .map_err(|e| AppError::Database(e.to_string()))?;
    
    let overview = if cursor.advance().await.map_err(|e| AppError::Database(e.to_string()))? {
        let doc = cursor.deserialize_current()
            .map_err(|e| AppError::Database(e.to_string()))?;
        
        json!({
            "totalOrders": doc.get_i32("totalOrders").unwrap_or(0),
            "totalRevenue": doc.get_f64("totalRevenue").unwrap_or(0.0),
            "uniqueCustomers": doc.get_i32("uniqueCustomers").unwrap_or(0),
            "avgOrderValue": doc.get_f64("avgOrderValue").unwrap_or(0.0)
        })
    } else {
        json!({
            "totalOrders": 0,
            "totalRevenue": 0.0,
            "uniqueCustomers": 0,
            "avgOrderValue": 0.0
        })
    };
    
    // Top customers
    let top_customers_pipeline = vec![
        doc! { "$match": match_conditions },
        doc! {
            "$group": {
                "_id": "$user_id",
                "totalSpent": { "$sum": "$grandTotal" },
                "orderCount": { "$sum": 1 },
                "customerName": { "$first": "$user" }
            }
        },
        doc! { "$sort": { "totalSpent": -1 } },
        doc! { "$limit": 10 }
    ];
    
    let mut top_cursor = order_collection.aggregate(top_customers_pipeline, None).await
        .map_err(|e| AppError::Database(e.to_string()))?;
    
    let mut top_customers = Vec::new();
    while top_cursor.advance().await.map_err(|e| AppError::Database(e.to_string()))? {
        let doc = top_cursor.deserialize_current()
            .map_err(|e| AppError::Database(e.to_string()))?;
        
        top_customers.push(json!({
            "customerId": doc.get_object_id("_id").ok(),
            "customerName": doc.get_str("customerName").unwrap_or("Unknown"),
            "totalSpent": doc.get_f64("totalSpent").unwrap_or(0.0),
            "orderCount": doc.get_i32("orderCount").unwrap_or(0)
        }));
    }
    
    Ok(ApiResponse::success(json!({
        "overview": overview,
        "topCustomers": top_customers
    })))
}
