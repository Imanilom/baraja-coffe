use axum::{
    extract::{State, Path},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use bson::{doc, oid::ObjectId};
use chrono::Utc;
use futures::stream::TryStreamExt;
use serde_json::json;

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::Supplier;

pub async fn get_suppliers(State(state): State<Arc<AppState>>) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Supplier>("suppliers");
    let cursor = collection.find(None, None).await?;
    let suppliers: Vec<Supplier> = cursor.try_collect().await?;
    Ok(ApiResponse::success(suppliers))
}

pub async fn create_supplier(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Supplier>,
) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Supplier>("suppliers");
    let mut supplier = payload;
    supplier.id = None;
    supplier.created_at = Utc::now();
    
    let result = collection.insert_one(supplier, None).await?;
    Ok(ApiResponse::success(json!({ "id": result.inserted_id.as_object_id().unwrap().to_hex() })))
}

pub async fn bulk_create_suppliers(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Vec<Supplier>>,
) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Supplier>("suppliers");
    let mut suppliers = payload;
    for s in &mut suppliers {
        s.id = None;
        s.created_at = Utc::now();
    }
    
    let result = collection.insert_many(suppliers, None).await?;
    Ok(ApiResponse::success(json!({ "count": result.inserted_ids.len() })))
}

pub async fn update_supplier(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<Supplier>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Supplier>("suppliers");
    
    let update_doc = doc! {
        "$set": {
            "name": payload.name,
            "phone": payload.phone,
            "email": payload.email,
            "address": payload.address,
        }
    };
    
    let result = collection.update_one(doc! { "_id": oid }, update_doc, None).await?;
    if result.matched_count == 0 {
        return Err(AppError::NotFound("Supplier not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "updated": true })))
}

pub async fn delete_supplier(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Supplier>("suppliers");
    
    let result = collection.delete_one(doc! { "_id": oid }, None).await?;
    if result.deleted_count == 0 {
        return Err(AppError::NotFound("Supplier not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "deleted": true })))
}
