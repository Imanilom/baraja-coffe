use axum::{
    extract::{State, Path, Query},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use mongodb::bson::{doc, oid::ObjectId};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::printer::{PrinterConfig, PrintLog, PrintStatus, HealthStatus};

#[derive(Debug, Deserialize)]
pub struct GetPrintersQuery {
    #[serde(rename = "outletId")]
    pub outlet_id: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workstation: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TestPrinterRequest {
    #[serde(rename = "testMessage", default = "default_test_message")]
    pub test_message: String,
}

fn default_test_message() -> String {
    "Test Print".to_string()
}

/// Create printer configuration
pub async fn create_printer_config(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PrinterConfig>,
) -> AppResult<impl IntoResponse> {
    let outlet_id = payload.outlet;

    // Validate outlet exists
    let outlet_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("outlets");
    
    if outlet_collection.find_one(doc! { "_id": outlet_id }, None).await?.is_none() {
        return Err(AppError::NotFound("Outlet not found".to_string()));
    }

    // Check for duplicate printer name in outlet
    let printer_collection: mongodb::Collection<PrinterConfig> = 
        state.db.collection("printers");
    
    if printer_collection
        .find_one(doc! {
            "outlet": outlet_id,
            "printerName": &payload.printer_name
        }, None)
        .await?
        .is_some()
    {
        return Err(AppError::BadRequest("Printer name already exists in this outlet".to_string()));
    }

    let mut new_printer = payload;
    new_printer.id = None;
    new_printer.created_at = chrono::Utc::now();
    new_printer.updated_at = chrono::Utc::now();

    let result = printer_collection.insert_one(&new_printer, None).await?;
    new_printer.id = Some(result.inserted_id.as_object_id().unwrap());

    Ok(ApiResponse::success(json!({
        "message": "Printer configuration created successfully",
        "data": new_printer
    })))
}

/// Get printer configurations
pub async fn get_printer_configs(
    State(state): State<Arc<AppState>>,
    Query(query): Query<GetPrintersQuery>,
) -> AppResult<impl IntoResponse> {
    let outlet_id = ObjectId::parse_str(&query.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let printer_collection: mongodb::Collection<PrinterConfig> = 
        state.db.collection("printers");
    
    let mut filter = doc! { "outlet": outlet_id, "isActive": true };
    
    if let Some(workstation) = query.workstation {
        filter.insert("workstation", workstation);
    }

    let mut cursor = printer_collection.find(filter, None).await?;
    let mut printers = Vec::new();
    
    while cursor.advance().await? {
        printers.push(cursor.deserialize_current()?);
    }

    Ok(ApiResponse::success(json!({
        "data": printers,
        "total": printers.len()
    })))
}

/// Get printer by ID
pub async fn get_printer_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let printer_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid printer ID".to_string()))?;

    let printer_collection: mongodb::Collection<PrinterConfig> = 
        state.db.collection("printers");
    
    let printer = printer_collection
        .find_one(doc! { "_id": printer_id }, None)
        .await?
        .ok_or_else(|| AppError::NotFound("Printer not found".to_string()))?;

    Ok(ApiResponse::success(printer))
}

/// Update printer configuration
pub async fn update_printer_config(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<PrinterConfig>,
) -> AppResult<impl IntoResponse> {
    let printer_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid printer ID".to_string()))?;

    let printer_collection: mongodb::Collection<PrinterConfig> = 
        state.db.collection("printers");
    
    let mut updated_printer = payload;
    updated_printer.id = Some(printer_id);
    updated_printer.updated_at = chrono::Utc::now();

    printer_collection
        .replace_one(doc! { "_id": printer_id }, &updated_printer, None)
        .await?;

    Ok(ApiResponse::success(json!({
        "message": "Printer configuration updated successfully",
        "data": updated_printer
    })))
}

/// Delete (deactivate) printer
pub async fn delete_printer_config(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let printer_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid printer ID".to_string()))?;

    let printer_collection: mongodb::Collection<PrinterConfig> = 
        state.db.collection("printers");
    
    let result = printer_collection
        .update_one(
            doc! { "_id": printer_id },
            doc! { "$set": {
                "isActive": false,
                "updatedAt": chrono::Utc::now()
            }},
            None,
        )
        .await?;

    if result.matched_count == 0 {
        return Err(AppError::NotFound("Printer not found".to_string()));
    }

    Ok(ApiResponse::success(json!({
        "message": "Printer deactivated successfully"
    })))
}

/// Test printer connection
pub async fn test_printer_connection(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<TestPrinterRequest>,
) -> AppResult<impl IntoResponse> {
    let printer_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid printer ID".to_string()))?;

    let printer_collection: mongodb::Collection<PrinterConfig> = 
        state.db.collection("printers");
    
    let printer = printer_collection
        .find_one(doc! { "_id": printer_id }, None)
        .await?
        .ok_or_else(|| AppError::NotFound("Printer not found".to_string()))?;

    // TODO: Implement actual printer connection test
    // For now, just return success if printer has IP address
    let is_reachable = printer.ip_address.is_some();

    // Update health status
    let new_health = if is_reachable {
        HealthStatus::Healthy
    } else {
        HealthStatus::Offline
    };

    printer_collection
        .update_one(
            doc! { "_id": printer_id },
            doc! { "$set": {
                "healthStatus": mongodb::bson::to_bson(&new_health).unwrap(),
                "lastPrintAt": chrono::Utc::now(),
                "consecutiveFailures": 0
            }},
            None,
        )
        .await?;

    Ok(ApiResponse::success(json!({
        "success": is_reachable,
        "message": if is_reachable {
            format!("Test print sent: {}", payload.test_message)
        } else {
            "Printer offline or not configured".to_string()
        },
        "printerInfo": {
            "name": printer.printer_name,
            "type": printer.printer_type,
            "ip": printer.ip_address,
            "workstation": printer.workstation
        }
    })))
}

/// Get printer health status
pub async fn get_printer_health(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let printer_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid printer ID".to_string()))?;

    let printer_collection: mongodb::Collection<PrinterConfig> = 
        state.db.collection("printers");
    
    let printer = printer_collection
        .find_one(doc! { "_id": printer_id }, None)
        .await?
        .ok_or_else(|| AppError::NotFound("Printer not found".to_string()))?;

    Ok(ApiResponse::success(json!({
        "printerId": printer_id,
        "printerName": printer.printer_name,
        "healthStatus": printer.health_status,
        "consecutiveFailures": printer.consecutive_failures,
        "lastPrintAt": printer.last_print_at,
        "isActive": printer.is_active
    })))
}

// ============================================
// PRINT LOGGING
// ============================================

#[derive(Debug, Deserialize)]
pub struct LogPrintAttemptRequest {
    #[serde(rename = "orderId")]
    pub order_id: String,
    
    #[serde(rename = "outletId")]
    pub outlet_id: String,
    
    pub workstation: String,
    
    #[serde(rename = "itemId", skip_serializing_if = "Option::is_none")]
    pub item_id: Option<String>,
    
    #[serde(rename = "itemName", skip_serializing_if = "Option::is_none")]
    pub item_name: Option<String>,
}

/// Log print attempt
pub async fn log_print_attempt(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LogPrintAttemptRequest>,
) -> AppResult<impl IntoResponse> {
    let outlet_id = ObjectId::parse_str(&payload.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let print_log = PrintLog {
        id: None,
        order_id: payload.order_id,
        outlet: outlet_id,
        workstation: payload.workstation,
        printer_type: None,
        printer_info: None,
        status: PrintStatus::Pending,
        attempt_count: 1,
        failure_reason: None,
        printed_at: None,
        item_id: payload.item_id.and_then(|id| ObjectId::parse_str(&id).ok()),
        item_name: payload.item_name,
        printer_health: None,
        created_at: chrono::Utc::now(),
    };

    let log_collection: mongodb::Collection<PrintLog> = 
        state.db.collection("printlogs");
    
    let result = log_collection.insert_one(&print_log, None).await?;

    Ok(ApiResponse::success(json!({
        "logId": result.inserted_id.as_object_id().unwrap(),
        "message": "Print attempt logged"
    })))
}

#[derive(Debug, Deserialize)]
pub struct LogPrintResultRequest {
    #[serde(rename = "logId")]
    pub log_id: String,
    
    #[serde(rename = "failureReason", skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
}

/// Log print success
pub async fn log_print_success(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LogPrintResultRequest>,
) -> AppResult<impl IntoResponse> {
    let log_id = ObjectId::parse_str(&payload.log_id)
        .map_err(|_| AppError::BadRequest("Invalid log ID".to_string()))?;

    let log_collection: mongodb::Collection<PrintLog> = 
        state.db.collection("printlogs");
    
    log_collection
        .update_one(
            doc! { "_id": log_id },
            doc! { "$set": {
                "status": "success",
                "printedAt": chrono::Utc::now()
            }},
            None,
        )
        .await?;

    Ok(ApiResponse::success(json!({
        "message": "Print success logged"
    })))
}

/// Log print failure
pub async fn log_print_failure(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LogPrintResultRequest>,
) -> AppResult<impl IntoResponse> {
    let log_id = ObjectId::parse_str(&payload.log_id)
        .map_err(|_| AppError::BadRequest("Invalid log ID".to_string()))?;

    let log_collection: mongodb::Collection<PrintLog> = 
        state.db.collection("printlogs");
    
    log_collection
        .update_one(
            doc! { "_id": log_id },
            doc! { "$set": {
                "status": "failed",
                "failureReason": payload.failure_reason.unwrap_or_else(|| "Unknown error".to_string())
            }, "$inc": {
                "attemptCount": 1
            }},
            None,
        )
        .await?;

    Ok(ApiResponse::success(json!({
        "message": "Print failure logged"
    })))
}

/// Get print statistics
pub async fn get_print_stats(
    State(state): State<Arc<AppState>>,
    Query(query): Query<GetPrintersQuery>,
) -> AppResult<impl IntoResponse> {
    let outlet_id = ObjectId::parse_str(&query.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let log_collection: mongodb::Collection<PrintLog> = 
        state.db.collection("printlogs");
    
    // Get counts by status
    let total = log_collection.count_documents(doc! { "outlet": outlet_id }, None).await?;
    let success = log_collection.count_documents(doc! { "outlet": outlet_id, "status": "success" }, None).await?;
    let failed = log_collection.count_documents(doc! { "outlet": outlet_id, "status": "failed" }, None).await?;
    let pending = log_collection.count_documents(doc! { "outlet": outlet_id, "status": "pending" }, None).await?;

    Ok(ApiResponse::success(json!({
        "total": total,
        "success": success,
        "failed": failed,
        "pending": pending,
        "successRate": if total > 0 { (success as f64 / total as f64) * 100.0 } else { 0.0 }
    })))
}

/// Get order print history
pub async fn get_order_print_history(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let log_collection: mongodb::Collection<PrintLog> = 
        state.db.collection("printlogs");
    
    let mut cursor = log_collection
        .find(doc! { "orderId": &order_id }, None)
        .await?;

    let mut logs = Vec::new();
    while cursor.advance().await? {
        logs.push(cursor.deserialize_current()?);
    }

    Ok(ApiResponse::success(json!({
        "orderId": order_id,
        "logs": logs,
        "total": logs.len()
    })))
}
