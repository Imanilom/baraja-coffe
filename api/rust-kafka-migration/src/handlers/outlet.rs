use axum::{
    extract::{Path, State},
    Json,
};
use bson::oid::ObjectId;
use std::sync::Arc;

use crate::error::{ApiResponse, AppError, AppResult};
use crate::AppState;

/// Get all outlets - GET /api/outlets
pub async fn get_outlets(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<Vec<crate::db::models::Outlet>>>> {
    let outlets = state.outlet_service.get_all_outlets().await?;
    Ok(Json(ApiResponse::success(outlets)))
}

/// Get outlet by ID - GET /api/outlets/:id
pub async fn get_outlet(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<ApiResponse<crate::db::models::Outlet>>> {
    let object_id = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID format".to_string()))?;
    let outlet = state.outlet_service.get_outlet(&object_id).await?
        .ok_or_else(|| AppError::NotFound("Outlet not found".to_string()))?;
    Ok(Json(ApiResponse::success(outlet)))
}

/// Get all warehouses - GET /api/warehouses
pub async fn get_warehouses(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<Vec<crate::db::models::Warehouse>>>> {
    let warehouses = state.outlet_service.get_all_warehouses().await?;
    Ok(Json(ApiResponse::success(warehouses)))
}

/// Get all suppliers - GET /api/suppliers
pub async fn get_suppliers(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<Vec<crate::db::models::Supplier>>>> {
    let suppliers = state.outlet_service.get_all_suppliers().await?;
    Ok(Json(ApiResponse::success(suppliers)))
}
