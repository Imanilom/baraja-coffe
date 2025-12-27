use axum::{
    extract::{State, Path, Query},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use mongodb::bson::{doc, oid::ObjectId};
use serde::Deserialize;
use serde_json::json;
use chrono::Utc;

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::workstation::{Table, TableStatus, TableTransferHistory};

#[derive(Debug, Deserialize)]
pub struct GetTablesQuery {
    #[serde(rename = "outletId")]
    pub outlet_id: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

/// Get available tables
pub async fn get_available_tables(
    State(state): State<Arc<AppState>>,
    Query(query): Query<GetTablesQuery>,
) -> AppResult<impl IntoResponse> {
    let outlet_id = ObjectId::parse_str(&query.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let table_collection: mongodb::Collection<Table> = 
        state.db.collection("tables");
    
    let mut filter = doc! { "outlet": outlet_id, "isActive": true };
    
    if let Some(status) = query.status {
        filter.insert("status", status);
    } else {
        filter.insert("status", "available");
    }

    let mut cursor = table_collection.find(filter, None).await?;
    let mut tables = Vec::new();
    
    while cursor.advance().await? {
        tables.push(cursor.deserialize_current()?);
    }

    Ok(ApiResponse::success(json!({
        "data": tables,
        "total": tables.len()
    })))
}

/// Get table occupancy status
pub async fn get_table_occupancy(
    State(state): State<Arc<AppState>>,
    Path(outlet_id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let outlet_oid = ObjectId::parse_str(&outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let table_collection: mongodb::Collection<Table> = 
        state.db.collection("tables");
    
    let mut cursor = table_collection
        .find(doc! { "outlet": outlet_oid, "isActive": true }, None)
        .await?;

    let mut tables = Vec::new();
    while cursor.advance().await? {
        tables.push(cursor.deserialize_current()?);
    }

    let total = tables.len();
    let available = tables.iter().filter(|t| matches!(t.status, TableStatus::Available)).count();
    let occupied = tables.iter().filter(|t| matches!(t.status, TableStatus::Occupied)).count();
    let reserved = tables.iter().filter(|t| matches!(t.status, TableStatus::Reserved)).count();

    Ok(ApiResponse::success(json!({
        "total": total,
        "available": available,
        "occupied": occupied,
        "reserved": reserved,
        "occupancyRate": if total > 0 { (occupied as f64 / total as f64) * 100.0 } else { 0.0 },
        "tables": tables
    })))
}

#[derive(Debug, Deserialize)]
pub struct TransferTableRequest {
    #[serde(rename = "toTable")]
    pub to_table: String,
    
    pub reason: Option<String>,
    
    #[serde(rename = "transferredBy")]
    pub transferred_by: String, // User ID
}

/// Transfer order to different table
pub async fn transfer_order_table(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
    Json(payload): Json<TransferTableRequest>,
) -> AppResult<impl IntoResponse> {
    let transferred_by_oid = ObjectId::parse_str(&payload.transferred_by)
        .map_err(|_| AppError::BadRequest("Invalid user ID".to_string()))?;

    // Get order
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let order = order_collection
        .find_one(doc! { "orderId": &order_id }, None)
        .await?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    let from_table = order.get_str("tableNumber")
        .map_err(|_| AppError::BadRequest("Order has no table number".to_string()))?
        .to_string();

    // Update order table
    order_collection
        .update_one(
            doc! { "orderId": &order_id },
            doc! { "$set": { "tableNumber": &payload.to_table } },
            None,
        )
        .await?;

    // Update old table status
    let table_collection: mongodb::Collection<Table> = 
        state.db.collection("tables");
    
    table_collection
        .update_one(
            doc! { "tableNumber": &from_table },
            doc! { "$set": {
                "status": "available",
                "currentOrder": null,
                "occupiedAt": null,
                "occupiedBy": null
            }},
            None,
        )
        .await?;

    // Update new table status
    table_collection
        .update_one(
            doc! { "tableNumber": &payload.to_table },
            doc! { "$set": {
                "status": "occupied",
                "currentOrder": order.get_object_id("_id").ok(),
                "occupiedAt": Utc::now(),
                "occupiedBy": order.get_str("user").ok()
            }},
            None,
        )
        .await?;

    // Create transfer history
    let history_collection: mongodb::Collection<TableTransferHistory> = 
        state.db.collection("tabletransfers");
    
    let history = TableTransferHistory {
        id: None,
        order_id: order.get_object_id("_id").unwrap(),
        from_table: from_table.clone(),
        to_table: payload.to_table.clone(),
        reason: payload.reason,
        transferred_by: transferred_by_oid,
        transferred_at: Utc::now(),
    };

    history_collection.insert_one(&history, None).await?;

    Ok(ApiResponse::success(json!({
        "message": "Table transferred successfully",
        "orderId": order_id,
        "fromTable": from_table,
        "toTable": payload.to_table
    })))
}

/// Get table transfer history for order
pub async fn get_table_history(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
) -> AppResult<impl IntoResponse> {
    // Get order ObjectId
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let order = order_collection
        .find_one(doc! { "orderId": &order_id }, None)
        .await?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    let order_oid = order.get_object_id("_id").unwrap();

    let history_collection: mongodb::Collection<TableTransferHistory> = 
        state.db.collection("tabletransfers");
    
    let mut cursor = history_collection
        .find(doc! { "orderId": order_oid }, None)
        .await?;

    let mut history = Vec::new();
    while cursor.advance().await? {
        history.push(cursor.deserialize_current()?);
    }

    Ok(ApiResponse::success(json!({
        "orderId": order_id,
        "transfers": history,
        "total": history.len()
    })))
}

#[derive(Debug, Deserialize)]
pub struct BulkUpdateTablesRequest {
    pub tables: Vec<TableUpdate>,
}

#[derive(Debug, Deserialize)]
pub struct TableUpdate {
    #[serde(rename = "tableNumber")]
    pub table_number: String,
    
    pub status: String,
}

/// Bulk update table status
pub async fn bulk_update_table_status(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<BulkUpdateTablesRequest>,
) -> AppResult<impl IntoResponse> {
    let table_collection: mongodb::Collection<Table> = 
        state.db.collection("tables");
    
    let mut updated_count = 0;

    for table_update in payload.tables {
        let result = table_collection
            .update_one(
                doc! { "tableNumber": &table_update.table_number },
                doc! { "$set": { "status": &table_update.status } },
                None,
            )
            .await?;

        updated_count += result.modified_count;
    }

    Ok(ApiResponse::success(json!({
        "message": format!("Updated {} tables", updated_count),
        "updatedCount": updated_count
    })))
}
