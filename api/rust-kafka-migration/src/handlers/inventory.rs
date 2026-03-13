use axum::{
    extract::{Path, State},
    Json,
};
use bson::oid::ObjectId;
use std::sync::Arc;
use serde::Deserialize;

use crate::db::models::{ProductMovement, ProductMovementType, StockReason};
use crate::error::{ApiResponse, AppError, AppResult};
use crate::AppState;

#[derive(Deserialize)]
pub struct StockUpdateRequest {
    pub quantity: f64,
    pub warehouse_id: String,
    pub reason: StockReason,
    pub notes: Option<String>,
}

/// Adjust menu stock - POST /api/inventory/menu-stock/:id
pub async fn adjust_menu_stock(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<StockUpdateRequest>,
) -> AppResult<Json<ApiResponse<()>>> {
    let menu_item_id = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid Menu Item ID".to_string()))?;
    let warehouse_id = ObjectId::parse_str(&payload.warehouse_id).map_err(|_| AppError::BadRequest("Invalid Warehouse ID".to_string()))?;
    
    state.inventory_service.adjust_menu_stock(
        &menu_item_id,
        &warehouse_id,
        payload.quantity,
        payload.reason,
        None,
    ).await?;

    Ok(Json(ApiResponse::success_with_message((), "Menu stock adjusted successfully".to_string())))
}

#[derive(Deserialize)]
pub struct ProductStockUpdateRequest {
    pub quantity_change: f64,
    pub warehouse_id: String,
    pub movement_type: ProductMovementType,
    pub notes: Option<String>,
}

/// Update product stock - POST /api/inventory/product-stock/:id
pub async fn update_product_stock(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<ProductStockUpdateRequest>,
) -> AppResult<Json<ApiResponse<()>>> {
    let product_id = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid Product ID".to_string()))?;
    let warehouse_id = ObjectId::parse_str(&payload.warehouse_id).map_err(|_| AppError::BadRequest("Invalid Warehouse ID".to_string()))?;
    
    let movement = ProductMovement {
        quantity: payload.quantity_change,
        movement_type: payload.movement_type,
        reference_id: None,
        notes: payload.notes,
        source_warehouse: None,
        destination_warehouse: None,
        handled_by: Some("system".to_string()),
        date: mongodb::bson::DateTime::now(),
    };

    state.inventory_service.update_product_stock(
        &product_id,
        &warehouse_id,
        payload.quantity_change,
        movement,
    ).await?;

    Ok(Json(ApiResponse::success_with_message((), "Product stock updated successfully".to_string())))
}
