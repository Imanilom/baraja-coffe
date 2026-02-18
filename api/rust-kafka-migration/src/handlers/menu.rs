use axum::{
    extract::{Path, State},
    Json,
};
use bson::{doc, oid::ObjectId};
use std::sync::Arc;
use crate::AppState;
use crate::db::models::{MenuItem, Category};
use crate::error::{ApiResponse, AppError, AppResult};


/// ===============================
/// GET /api/menu
/// ===============================
pub async fn get_menu_items(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<Vec<MenuItem>>>> {
    let items = state
        .menu_service
        .get_all_menu_items(false)
        .await?;

    Ok(Json(ApiResponse::success(items)))
}


/// ===============================
/// GET /api/menu/:id
/// ===============================
pub async fn get_menu_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<ApiResponse<MenuItem>>> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid ID format".to_string()))?;

    let item = state
        .menu_service
        .get_menu_item(&object_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Menu item not found".to_string()))?;

    Ok(Json(ApiResponse::success(item)))
}


/// ===============================
/// POST /api/menu
/// ===============================
pub async fn create_menu_item(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<MenuItem>,
) -> AppResult<Json<ApiResponse<MenuItem>>> {
    let mut item = payload;

    let id = state
        .menu_service
        .create_menu_item(item.clone())
        .await?;

    item.id = Some(id);

    Ok(Json(ApiResponse::success_with_message(
        item,
        "Menu item created successfully".to_string(),
    )))
}


/// ===============================
/// PUT /api/menu/:id
/// ===============================
pub async fn update_menu_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<MenuItem>,
) -> AppResult<Json<ApiResponse<MenuItem>>> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid ID format".to_string()))?;

    let mut item = payload;

    state
        .menu_service
        .update_menu_item(&object_id, item.clone())
        .await?;

    item.id = Some(object_id);

    Ok(Json(ApiResponse::success_with_message(
        item,
        "Menu item updated successfully".to_string(),
    )))
}


/// ===============================
/// DELETE /api/menu/:id
/// ===============================
pub async fn delete_menu_item(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<ApiResponse<()>>> {
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid ID format".to_string()))?;

    state
        .menu_service
        .delete_menu_item(&object_id)
        .await?;

    Ok(Json(ApiResponse::success_with_message(
        (),
        "Menu item deleted successfully".to_string(),
    )))
}


/// ===============================
/// GET /api/menu/categories
/// ===============================
pub async fn get_categories(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<Vec<Category>>>> {
    let categories = state.menu_service.get_categories().await?;
    Ok(Json(ApiResponse::success(categories)))
}


/// ===============================
/// GET /api/menu/debug/db
/// ===============================
pub async fn list_collections_debug(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<serde_json::Value>>> {
    let db = state.db.database();
    let db_name = db.name().to_string();

    let collection_names = db.list_collection_names(None).await?;

    let mut collections = serde_json::Map::new();
    for name in collection_names {
        let count = db
            .collection::<serde_json::Value>(&name)
            .count_documents(None, None)
            .await?;

        collections.insert(name, serde_json::json!(count));
    }

    Ok(Json(ApiResponse::success(serde_json::json!({
        "database": db_name,
        "collections": collections
    }))))
}


/// ===============================
/// GET /api/menu/customer
/// Get menu items for customer view (filtered by stock availability)
/// ===============================
pub async fn get_customer_menu(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<Vec<MenuItem>>>> {
    let items = state
        .menu_service
        .get_customer_menu_items()
        .await?;

    Ok(Json(ApiResponse::success(items)))
}


/// ===============================
/// GET /api/menu/cashier
/// Get menu items for cashier/POS (all active items, optimized)
/// ===============================
pub async fn get_cashier_menu(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<Vec<MenuItem>>>> {
    let items = state
        .menu_service
        .get_cashier_menu_items()
        .await?;

    Ok(Json(ApiResponse::success(items)))
}


/// ===============================
/// GET /api/menu/backoffice
/// Get menu items for backoffice (all items including inactive, optimized)
/// ===============================
pub async fn get_backoffice_menu(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<Vec<MenuItem>>>> {
    let items = state
        .menu_service
        .get_backoffice_menu_items()
        .await?;

    Ok(Json(ApiResponse::success(items)))
}
