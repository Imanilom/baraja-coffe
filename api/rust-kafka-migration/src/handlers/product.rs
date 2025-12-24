#![allow(dead_code)]
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

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::product::Product;

pub async fn get_products(State(state): State<Arc<AppState>>) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Product>("products");
    let cursor = collection.find(None, None).await?;
    let products: Vec<Product> = cursor.try_collect().await?;
    Ok(ApiResponse::success(products))
}

pub async fn get_product(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Product>("products");
    
    let product = collection.find_one(doc! { "_id": oid }, None).await?;
    match product {
        Some(p) => Ok(ApiResponse::success(p)),
        None => Err(AppError::NotFound("Product not found".to_string())),
    }
}

pub async fn create_product(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Product>,
) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Product>("products");
    let mut product = payload;
    product.id = None;
    product.created_at = Some(Utc::now());
    product.updated_at = Some(Utc::now());
    
    let result = collection.insert_one(product, None).await?;
    Ok(ApiResponse::success(json!({ "id": result.inserted_id.as_object_id().unwrap().to_hex() })))
}

pub async fn update_product(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<Product>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Product>("products");
    
    let update_doc = doc! {
        "$set": {
            "sku": payload.sku,
            "barcode": payload.barcode,
            "name": payload.name,
            "category": bson::to_bson(&payload.category).unwrap(),
            "unit": payload.unit,
            "minimumrequest": payload.minimumrequest,
            "limitperrequest": payload.limitperrequest,
            "suppliers": bson::to_bson(&payload.suppliers).unwrap(),
            "updatedAt": Utc::now()
        }
    };
    
    let result = collection.update_one(doc! { "_id": oid }, update_doc, None).await?;
    
    if result.matched_count == 0 {
        return Err(AppError::NotFound("Product not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "updated": true })))
}

pub async fn delete_product(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Product>("products");
    
    let result = collection.delete_one(doc! { "_id": oid }, None).await?;
    
    if result.deleted_count == 0 {
        return Err(AppError::NotFound("Product not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "deleted": true })))
}
