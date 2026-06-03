use axum::{
    extract::{State, Path},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use bson::oid::ObjectId;
use bson::doc;
use chrono::Utc;
use futures::stream::TryStreamExt;
use serde_json::json;
use bson::DateTime as BsonDateTime;

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::category::Category;

pub async fn get_categories(State(state): State<Arc<AppState>>) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Category>("categories");
    let cursor = collection.find(None, None).await?;
    let categories: Vec<Category> = cursor.try_collect().await?;
    Ok(ApiResponse::success(categories))
}

pub async fn get_category(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Category>("categories");
    
    let category = collection.find_one(doc! { "_id": oid }, None).await?;
    match category {
        Some(c) => Ok(ApiResponse::success(c)),
        None => Err(AppError::NotFound("Category not found".to_string())),
    }
}

pub async fn create_category(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Category>,
) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Category>("categories");
    let mut category = payload;

    category.id = None;
    category.created_at = Some(BsonDateTime::now());
    category.updated_at = Some(BsonDateTime::now());

    let result = collection.insert_one(category, None).await?;
    Ok(ApiResponse::success(json!({
        "id": result.inserted_id.as_object_id().unwrap().to_hex()
    })))
}


pub async fn update_category(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<Category>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Category>("categories");
    
    let update_doc = doc! {
        "$set": {
            "name": payload.name,
            "description": payload.description,
            "type": payload.category_type,
            "parentCategory": payload.parent_category,
            "updatedAt": BsonDateTime::now()
        }
    };
    
    let result = collection.update_one(doc! { "_id": oid }, update_doc, None).await?;
    
    if result.matched_count == 0 {
        return Err(AppError::NotFound("Category not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "updated": true })))
}

pub async fn delete_category(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Category>("categories");
    
    let result = collection.delete_one(doc! { "_id": oid }, None).await?;
    
    if result.deleted_count == 0 {
        return Err(AppError::NotFound("Category not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "deleted": true })))
}
