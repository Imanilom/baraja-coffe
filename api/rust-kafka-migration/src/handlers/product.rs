use axum::{
    extract::{State, Path, Query, Json},
    response::IntoResponse,
};
use std::sync::Arc;
use bson::oid::ObjectId;
use bson::doc;
use chrono::Utc;
use futures::stream::TryStreamExt;
use serde::Deserialize;
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
    product.created_at = Some(mongodb::bson::DateTime::now());
    product.updated_at = Some(mongodb::bson::DateTime::now());
    
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
            "updatedAt": mongodb::bson::DateTime::now()
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

pub async fn bulk_create_products(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Vec<Product>>,
) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Product>("products");
    let mut products = payload;
    for p in &mut products {
        p.id = None;
        p.created_at = Some(mongodb::bson::DateTime::now());
        p.updated_at = Some(mongodb::bson::DateTime::now());
    }
    
    let result = collection.insert_many(products, None).await?;
    Ok(ApiResponse::success(json!({ "count": result.inserted_ids.len() })))
}

#[derive(Deserialize)]
pub struct PriceUpdatePayload {
    pub supplier_id: String,
    pub price: f64,
}

pub async fn update_product_price(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<PriceUpdatePayload>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let supplier_oid = ObjectId::parse_str(&payload.supplier_id).map_err(|_| AppError::BadRequest("Invalid supplier ID".to_string()))?;
    
    let collection = state.db.collection::<Product>("products");
    
    // Use MongoDB's positional operator to update the specific supplier's price
    let result = collection.update_one(
        doc! { "_id": oid, "suppliers.supplierId": supplier_oid },
        doc! {
            "$set": {
                "suppliers.$.price": payload.price,
                "suppliers.$.lastPurchaseDate": mongodb::bson::DateTime::now(),
                "updatedAt": mongodb::bson::DateTime::now()
            }
        },
        None
    ).await?;
    
    if result.matched_count == 0 {
        return Err(AppError::NotFound("Product or supplier not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "updated": true })))
}

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

pub async fn search_products(
    State(state): State<Arc<AppState>>,
    Query(query): Query<SearchQuery>,
) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Product>("products");
    let filter = doc! {
        "$or": [
            { "name": { "$regex": &query.q, "$options": "i" } },
            { "sku": { "$regex": &query.q, "$options": "i" } },
            { "barcode": { "$regex": &query.q, "$options": "i" } }
        ]
    };
    
    let cursor = collection.find(filter, None).await?;
    let products: Vec<Product> = cursor.try_collect().await?;
    
    Ok(ApiResponse::success(products))
}
