use axum::{
    extract::{Path, State},
    Json,
};
use bson::oid::ObjectId;
use std::sync::Arc;

use crate::db::models::MenuItem;
use crate::error::{ApiResponse, AppError, AppResult};
use crate::AppState;

/// Get all menu items - GET /api/menu
pub async fn get_menu_items(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<Vec<MenuItem>>>> {
    let items = state.menu_service.get_all_menu_items(true).await?;
    Ok(Json(ApiResponse::success(items)))
}

/// Get menu item by ID - GET /api/menu/:id
pub async fn get_menu_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<ApiResponse<MenuItem>>> {
    let object_id = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID format".to_string()))?;
    let item = state.menu_service.get_menu_item(&object_id).await?
        .ok_or_else(|| AppError::NotFound("Menu item not found".to_string()))?;
    Ok(Json(ApiResponse::success(item)))
}

/// Create menu item - POST /api/menu (Admin)
pub async fn create_menu_item(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<MenuItem>,
) -> AppResult<Json<ApiResponse<MenuItem>>> {
    let mut item = payload;
    let id = state.menu_service.create_menu_item(item.clone()).await?;
    item.id = Some(id);
    Ok(Json(ApiResponse::success_with_message(item, "Menu item created successfully".to_string())))
}

/// Update menu item - PUT /api/menu/:id (Admin)
pub async fn update_menu_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<MenuItem>,
) -> AppResult<Json<ApiResponse<MenuItem>>> {
    let object_id = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID format".to_string()))?;
    let mut item = payload;
    state.menu_service.update_menu_item(&object_id, item.clone()).await?;
    item.id = Some(object_id);
    Ok(Json(ApiResponse::success_with_message(item, "Menu item updated successfully".to_string())))
}

/// Delete menu item - DELETE /api/menu/:id (Admin)
pub async fn delete_menu_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<ApiResponse<()>>> {
    let object_id = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID format".to_string()))?;
    state.menu_service.delete_menu_item(&object_id).await?;
    Ok(Json(ApiResponse::success_with_message((), "Menu item deleted successfully".to_string())))
}

/// Get categories - GET /api/categories
pub async fn get_categories(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<Vec<crate::db::models::Category>>>> {
    let categories = state.menu_service.get_categories().await?;
    Ok(Json(ApiResponse::success(categories)))
}
