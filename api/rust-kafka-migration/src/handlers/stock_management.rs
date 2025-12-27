use axum::{
    extract::{State, Json, Path},
    response::IntoResponse,
};
use std::sync::Arc;
use serde::Deserialize;
use serde_json::json;
use mongodb::bson::oid::ObjectId;

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::services::stock_deduction_service::{StockDeductionService, StockReservation};

#[derive(Debug, Deserialize)]
pub struct CheckStockRequest {
    pub reservations: Vec<StockReservationRequest>,
}

#[derive(Debug, Deserialize)]
pub struct StockReservationRequest {
    #[serde(rename = "menuItemId")]
    pub menu_item_id: String,
    
    pub quantity: i32,
    
    #[serde(rename = "warehouseId")]
    pub warehouse_id: String,
}

#[derive(Debug, Deserialize)]
pub struct DeductStockRequest {
    pub reservations: Vec<StockReservationRequest>,
}

#[derive(Debug, Deserialize)]
pub struct RestoreStockRequest {
    #[serde(rename = "orderId")]
    pub order_id: String,
}

/// Check stock availability
pub async fn check_stock_availability(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CheckStockRequest>,
) -> AppResult<impl IntoResponse> {
    let stock_service = StockDeductionService::new(state.clone());
    
    let reservations: Result<Vec<StockReservation>, _> = payload.reservations
        .into_iter()
        .map(|r| {
            Ok::<StockReservation, AppError>(StockReservation {
                menu_item_id: ObjectId::parse_str(&r.menu_item_id)
                    .map_err(|_| AppError::BadRequest("Invalid menu item ID".to_string()))?,
                quantity: r.quantity,
                warehouse_id: ObjectId::parse_str(&r.warehouse_id)
                    .map_err(|_| AppError::BadRequest("Invalid warehouse ID".to_string()))?,
            })
        })
        .collect();

    let reservations = reservations?;
    let available = stock_service.check_stock_availability(reservations).await?;

    Ok(ApiResponse::success(json!({
        "available": available,
        "message": if available {
            "Stock is available"
        } else {
            "Insufficient stock"
        }
    })))
}

/// Deduct stock for order
pub async fn deduct_stock(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<DeductStockRequest>,
) -> AppResult<impl IntoResponse> {
    let stock_service = StockDeductionService::new(state.clone());
    
    let reservations: Result<Vec<StockReservation>, _> = payload.reservations
        .into_iter()
        .map(|r| {
            Ok::<StockReservation, AppError>(StockReservation {
                menu_item_id: ObjectId::parse_str(&r.menu_item_id)
                    .map_err(|_| AppError::BadRequest("Invalid menu item ID".to_string()))?,
                quantity: r.quantity,
                warehouse_id: ObjectId::parse_str(&r.warehouse_id)
                    .map_err(|_| AppError::BadRequest("Invalid warehouse ID".to_string()))?,
            })
        })
        .collect();

    let reservations = reservations?;
    let deductions = stock_service.deduct_stock_with_locking(reservations).await?;

    Ok(ApiResponse::success(json!({
        "message": "Stock deducted successfully",
        "deductions": deductions
    })))
}

/// Restore stock (for order cancellation)
pub async fn restore_stock(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
) -> AppResult<impl IntoResponse> {
    // TODO: Get stock deductions from order history
    // For now, return success
    
    Ok(ApiResponse::success(json!({
        "message": "Stock restoration initiated",
        "orderId": order_id
    })))
}
