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
// use crate::db::models::workstation::{WorkstationItem, ItemStatus};

#[derive(Debug, Deserialize)]
pub struct GetWorkstationOrdersQuery {
    #[serde(rename = "outletId")]
    pub outlet_id: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

/// Get orders for specific workstation (kitchen/bar)
pub async fn get_workstation_orders(
    State(state): State<Arc<AppState>>,
    Path(workstation_type): Path<String>,
    Query(query): Query<GetWorkstationOrdersQuery>,
) -> AppResult<impl IntoResponse> {
    let outlet_id = ObjectId::parse_str(&query.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let mut filter = doc! {
        "outlet": outlet_id,
        "status": { "$nin": ["Completed", "Cancelled"] }
    };

    if let Some(status) = query.status {
        filter.insert("status", status);
    }

    let mut cursor = order_collection.find(filter, None).await?;
    let mut orders = Vec::new();
    
    while cursor.advance().await? {
        orders.push(cursor.deserialize_current()?);
    }

    // TODO: Filter items by workstation type (kitchen vs bar)
    // This would require checking menu item categories

    Ok(ApiResponse::success(json!({
        "workstation": workstation_type,
        "data": orders,
        "total": orders.len()
    })))
}

#[derive(Debug, Deserialize)]
pub struct UpdateItemStatusRequest {
    pub status: String,
    
    #[serde(rename = "preparedBy", skip_serializing_if = "Option::is_none")]
    pub prepared_by: Option<String>,
}

/// Update kitchen/bar item status
pub async fn update_workstation_item_status(
    State(state): State<Arc<AppState>>,
    Path((order_id, item_id)): Path<(String, String)>,
    Json(payload): Json<UpdateItemStatusRequest>,
) -> AppResult<impl IntoResponse> {
    let item_oid = ObjectId::parse_str(&item_id)
        .map_err(|_| AppError::BadRequest("Invalid item ID".to_string()))?;

    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let mut update_doc = doc! {
        "items.$.status": &payload.status
    };

    // Update timestamps based on status
    match payload.status.as_str() {
        "preparing" => {
            update_doc.insert("items.$.startedAt", Utc::now());
            if let Some(prepared_by) = payload.prepared_by {
                if let Ok(oid) = ObjectId::parse_str(&prepared_by) {
                    update_doc.insert("items.$.preparedBy", oid);
                }
            }
        }
        "ready" => {
            update_doc.insert("items.$.readyAt", Utc::now());
        }
        "served" => {
            update_doc.insert("items.$.servedAt", Utc::now());
        }
        _ => {}
    }

    order_collection
        .update_one(
            doc! {
                "orderId": &order_id,
                "items.menuItem": item_oid
            },
            doc! { "$set": update_doc },
            None,
        )
        .await?;

    // TODO: Send WebSocket notification to devices
    tracing::info!("Item {} status updated to {}", item_id, payload.status);

    Ok(ApiResponse::success(json!({
        "message": "Item status updated",
        "itemId": item_id,
        "newStatus": payload.status
    })))
}

#[derive(Debug, Deserialize)]
pub struct BulkUpdateItemsRequest {
    pub items: Vec<ItemUpdate>,
}

#[derive(Debug, Deserialize)]
pub struct ItemUpdate {
    #[serde(rename = "itemId")]
    pub item_id: String,
    
    pub status: String,
}

/// Bulk update kitchen items
pub async fn bulk_update_workstation_items(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
    Json(payload): Json<BulkUpdateItemsRequest>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    for item_update in &payload.items {
        let item_oid = ObjectId::parse_str(&item_update.item_id)
            .map_err(|_| AppError::BadRequest("Invalid item ID".to_string()))?;

        let mut update_doc = doc! {
            "items.$.status": &item_update.status
        };

        if item_update.status == "ready" {
            update_doc.insert("items.$.readyAt", Utc::now());
        }

        order_collection
            .update_one(
                doc! {
                    "orderId": &order_id,
                    "items.menuItem": item_oid
                },
                doc! { "$set": update_doc },
                None,
            )
            .await?;
    }

    Ok(ApiResponse::success(json!({
        "message": "Items updated successfully",
        "updatedCount": payload.items.len()
    })))
}

/// Get kitchen orders (backward compatibility)
pub async fn get_kitchen_orders(
    State(state): State<Arc<AppState>>,
    Query(query): Query<GetWorkstationOrdersQuery>,
) -> AppResult<impl IntoResponse> {
    get_workstation_orders(State(state), Path("kitchen".to_string()), Query(query)).await
}

/// Get bar orders (backward compatibility)
pub async fn get_bar_orders(
    State(state): State<Arc<AppState>>,
    Path(bar_type): Path<String>,
    Query(query): Query<GetWorkstationOrdersQuery>,
) -> AppResult<impl IntoResponse> {
    get_workstation_orders(State(state), Path(format!("bar-{}", bar_type)), Query(query)).await
}
