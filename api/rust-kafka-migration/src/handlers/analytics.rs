use axum::{
    extract::{State, Path, Query},
    response::IntoResponse,
};
use std::sync::Arc;
use mongodb::bson::{doc, oid::ObjectId};
use serde::Deserialize;
use serde_json::json;
use chrono::{Utc, Duration, Timelike};
// // use futures::stream::TryStreamExt;

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
// // use crate::db::models::analytics::{CashierMetrics, PrintFailureAnalysis, OrderCompletionMetrics};

#[derive(Debug, Deserialize)]
pub struct GetMetricsQuery {
    #[serde(rename = "outletId")]
    pub outlet_id: String,
    
    #[serde(rename = "startDate", skip_serializing_if = "Option::is_none")]
    pub start_date: Option<String>,
    
    #[serde(rename = "endDate", skip_serializing_if = "Option::is_none")]
    pub end_date: Option<String>,
}

/// Get cashier performance metrics
pub async fn get_cashier_metrics(
    State(state): State<Arc<AppState>>,
    Path(cashier_id): Path<String>,
    Query(query): Query<GetMetricsQuery>,
) -> AppResult<impl IntoResponse> {
    let cashier_oid = ObjectId::parse_str(&cashier_id)
        .map_err(|_| AppError::BadRequest("Invalid cashier ID".to_string()))?;
    
    let outlet_oid = ObjectId::parse_str(&query.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    // Get orders for cashier
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let start_date = Utc::now() - Duration::days(30); // Default last 30 days
    
    let mut cursor = order_collection
        .find(doc! {
            "cashierId": cashier_oid,
            "outlet": outlet_oid,
            "createdAt": { "$gte": start_date }
        }, None)
        .await?;

    let mut total_orders = 0;
    let mut completed_orders = 0;
    let mut cancelled_orders = 0;
    let mut total_revenue = 0.0;
    let mut completion_times: Vec<f64> = Vec::new();

    while cursor.advance().await? {
        let order = cursor.deserialize_current()?;
        total_orders += 1;

        let status = order.get_str("status").unwrap_or("");
        match status {
            "Completed" => completed_orders += 1,
            "Cancelled" => cancelled_orders += 1,
            _ => {}
        }

        if let Ok(grand_total) = order.get_f64("grandTotal") {
            total_revenue += grand_total;
        }

        // Calculate completion time
        if let (Ok(created_at), Ok(confirmed_at)) = (
            order.get_datetime("createdAt"),
            order.get_datetime("confirmedAt")
        ) {
            let duration = confirmed_at.to_chrono().signed_duration_since(created_at.to_chrono());
            completion_times.push(duration.num_seconds() as f64);
        }
    }

    let avg_order_value = if total_orders > 0 {
        total_revenue / total_orders as f64
    } else {
        0.0
    };

    let avg_completion_time = if !completion_times.is_empty() {
        completion_times.iter().sum::<f64>() / completion_times.len() as f64
    } else {
        0.0
    };

    let fastest_order = completion_times.iter().cloned().fold(f64::INFINITY, f64::min);
    let slowest_order = completion_times.iter().cloned().fold(f64::NEG_INFINITY, f64::max);

    Ok(ApiResponse::success(json!({
        "cashierId": cashier_id,
        "totalOrders": total_orders,
        "completedOrders": completed_orders,
        "cancelledOrders": cancelled_orders,
        "totalRevenue": total_revenue,
        "averageOrderValue": avg_order_value,
        "averageCompletionTime": avg_completion_time,
        "fastestOrder": if fastest_order.is_finite() { Some(fastest_order) } else { None },
        "slowestOrder": if slowest_order.is_finite() { Some(slowest_order) } else { None },
        "completionRate": if total_orders > 0 {
            (completed_orders as f64 / total_orders as f64) * 100.0
        } else {
            0.0
        }
    })))
}

/// Get print failure analysis
pub async fn get_print_failure_analysis(
    State(state): State<Arc<AppState>>,
    Query(query): Query<GetMetricsQuery>,
) -> AppResult<impl IntoResponse> {
    let outlet_oid = ObjectId::parse_str(&query.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let log_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("printlogs");
    
    let start_date = Utc::now() - Duration::days(7); // Last 7 days
    
    // Get all print logs
    let mut cursor = log_collection
        .find(doc! {
            "outlet": outlet_oid,
            "createdAt": { "$gte": start_date }
        }, None)
        .await?;

    let mut total_attempts = 0;
    let mut successful_prints = 0;
    let mut failed_prints = 0;
    let mut error_counts: std::collections::HashMap<String, i32> = std::collections::HashMap::new();
    let mut failure_hours: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();

    while cursor.advance().await? {
        let log = cursor.deserialize_current()?;
        total_attempts += 1;

        let status = log.get_str("status").unwrap_or("");
        match status {
            "success" => successful_prints += 1,
            "failed" => {
                failed_prints += 1;
                
                if let Ok(error) = log.get_str("failureReason") {
                    *error_counts.entry(error.to_string()).or_insert(0) += 1;
                }

                if let Ok(created_at) = log.get_datetime("createdAt") {
                    let hour = created_at.to_chrono().hour() as i32;
                    *failure_hours.entry(hour).or_insert(0) += 1;
                }
            }
            _ => {}
        }
    }

    let success_rate = if total_attempts > 0 {
        (successful_prints as f64 / total_attempts as f64) * 100.0
    } else {
        0.0
    };

    // Convert error counts to sorted vec
    let mut common_errors: Vec<_> = error_counts.into_iter()
        .map(|(error, count)| {
            let percentage = if total_attempts > 0 {
                (count as f64 / total_attempts as f64) * 100.0
            } else {
                0.0
            };
            json!({
                "error": error,
                "count": count,
                "percentage": percentage
            })
        })
        .collect();
    common_errors.sort_by(|a, b| {
        b["count"].as_i64().unwrap_or(0).cmp(&a["count"].as_i64().unwrap_or(0))
    });

    // Get peak failure hours
    let mut peak_hours: Vec<_> = failure_hours.into_iter().collect();
    peak_hours.sort_by(|a, b| b.1.cmp(&a.1));
    let peak_failure_hours: Vec<i32> = peak_hours.iter().take(3).map(|(h, _)| *h).collect();

    Ok(ApiResponse::success(json!({
        "totalAttempts": total_attempts,
        "successfulPrints": successful_prints,
        "failedPrints": failed_prints,
        "successRate": success_rate,
        "commonErrors": common_errors,
        "peakFailureHours": peak_failure_hours
    })))
}

/// Get order completion time metrics
pub async fn get_order_completion_metrics(
    State(state): State<Arc<AppState>>,
    Query(query): Query<GetMetricsQuery>,
) -> AppResult<impl IntoResponse> {
    let outlet_oid = ObjectId::parse_str(&query.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let start_date = Utc::now() - Duration::days(7);
    
    let mut cursor = order_collection
        .find(doc! {
            "outlet": outlet_oid,
            "status": "Completed",
            "createdAt": { "$gte": start_date }
        }, None)
        .await?;

    let mut completion_times: Vec<f64> = Vec::new();
    let mut order_type_times: std::collections::HashMap<String, Vec<f64>> = std::collections::HashMap::new();
    let mut hour_metrics: std::collections::HashMap<i32, Vec<f64>> = std::collections::HashMap::new();

    while cursor.advance().await? {
        let order = cursor.deserialize_current()?;

        if let (Ok(created_at), Ok(confirmed_at)) = (
            order.get_datetime("createdAt"),
            order.get_datetime("confirmedAt")
        ) {
            let duration_secs = confirmed_at.to_chrono().signed_duration_since(created_at.to_chrono()).num_seconds() as f64;
            let duration_mins = duration_secs / 60.0;
            
            completion_times.push(duration_mins);

            // By order type
            if let Ok(order_type) = order.get_str("orderType") {
                order_type_times.entry(order_type.to_string())
                    .or_insert_with(Vec::new)
                    .push(duration_mins);
            }

            // By hour
            let hour = created_at.to_chrono().hour() as i32;
            hour_metrics.entry(hour)
                .or_insert_with(Vec::new)
                .push(duration_mins);
        }
    }

    let total_orders = completion_times.len();
    let avg_completion = if !completion_times.is_empty() {
        completion_times.iter().sum::<f64>() / completion_times.len() as f64
    } else {
        0.0
    };

    let mut sorted_times = completion_times.clone();
    sorted_times.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let median = if !sorted_times.is_empty() {
        sorted_times[sorted_times.len() / 2]
    } else {
        0.0
    };

    let fastest = sorted_times.first().cloned().unwrap_or(0.0);
    let slowest = sorted_times.last().cloned().unwrap_or(0.0);

    // By order type
    let by_order_type: Vec<_> = order_type_times.into_iter()
        .map(|(order_type, times)| {
            let avg = times.iter().sum::<f64>() / times.len() as f64;
            json!({
                "orderType": order_type,
                "count": times.len(),
                "averageTime": avg
            })
        })
        .collect();

    // Peak hours
    let peak_hours: Vec<_> = hour_metrics.into_iter()
        .map(|(hour, times)| {
            let avg = times.iter().sum::<f64>() / times.len() as f64;
            json!({
                "hour": hour,
                "orderCount": times.len(),
                "averageTime": avg
            })
        })
        .collect();

    Ok(ApiResponse::success(json!({
        "totalOrders": total_orders,
        "averageCompletionTime": avg_completion,
        "medianCompletionTime": median,
        "fastestCompletion": fastest,
        "slowestCompletion": slowest,
        "byOrderType": by_order_type,
        "peakHours": peak_hours
    })))
}
