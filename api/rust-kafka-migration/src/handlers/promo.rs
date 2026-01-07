use axum::{
    extract::{State, Path, Query},
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
use crate::db::models::promo::{AutoPromo, Promo, PromoConditions, ActiveHours, Schedule};

pub async fn get_auto_promos(State(state): State<Arc<AppState>>) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<AutoPromo>("autopromos");
    let now = Utc::now();
    
    // Deactivate expired promos
    let _ = collection.update_many(
        doc! { "isActive": true, "validTo": { "$lt": now } },
        doc! { "$set": { "isActive": false } },
        None
    ).await;
    
    let cursor = collection.find(None, None).await?;
    let promos: Vec<AutoPromo> = cursor.try_collect().await?;
    
    Ok(ApiResponse::success(promos))
}

pub async fn create_auto_promo(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<AutoPromo>,
) -> AppResult<impl IntoResponse> {
    // Validation logic (simplified)
    if payload.name.is_empty() {
        return Err(AppError::Validation("Name is required".to_string()));
    }
    
    let collection = state.db.collection::<AutoPromo>("autopromos");
    let mut promo = payload;
    promo.id = None; // Ensure new ID
    promo.created_at = Some(mongodb::bson::DateTime::now());
    promo.updated_at = Some(mongodb::bson::DateTime::now());
    
    let result = collection.insert_one(promo, None).await?;
    let created_id = result.inserted_id.as_object_id().unwrap();
    
    Ok(ApiResponse::success(json!({ "id": created_id.to_hex() })))
}

pub async fn update_auto_promo(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<AutoPromo>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<AutoPromo>("autopromos");
    
    let update_doc = doc! {
        "$set": {
            "name": payload.name,
            "promoType": payload.promo_type,
            "discountType": payload.discount_type,
            "conditions": bson::to_bson(&payload.conditions).unwrap(),
            "discount": payload.discount,
            "bundlePrice": payload.bundle_price,
            "consumerType": payload.consumer_type,
            "outlet": payload.outlet,
            "validFrom": payload.valid_from,
            "validTo": payload.valid_to,
            "activeHours": bson::to_bson(&payload.active_hours).unwrap(),
            "isActive": payload.is_active,
            "updatedAt": mongodb::bson::DateTime::now()
        }
    };
    
    let result = collection.update_one(doc! { "_id": oid }, update_doc, None).await?;
    
    if result.matched_count == 0 {
        return Err(AppError::NotFound("Promo not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "updated": true })))
}

pub async fn delete_auto_promo(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<AutoPromo>("autopromos");
    
    let result = collection.delete_one(doc! { "_id": oid }, None).await?;
    
    if result.deleted_count == 0 {
        return Err(AppError::NotFound("Promo not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "deleted": true })))
}

// Manual Promos

pub async fn get_promos(State(state): State<Arc<AppState>>) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Promo>("promos");
    let now = Utc::now();
    
    // Deactivate expired promos
    let _ = collection.update_many(
        doc! { "isActive": true, "validTo": { "$lt": now } },
        doc! { "$set": { "isActive": false } },
        None
    ).await;
    
    let cursor = collection.find(None, None).await?;
    let promos: Vec<Promo> = cursor.try_collect().await?;
    
    Ok(ApiResponse::success(promos))
}

pub async fn get_promo_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Promo>("promos");
    
    let promo = collection.find_one(doc! { "_id": oid }, None).await?;
    
    match promo {
        Some(p) => Ok(ApiResponse::success(p)),
        None => Err(AppError::NotFound("Promo not found".to_string())),
    }
}

pub async fn create_promo(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Promo>,
) -> AppResult<impl IntoResponse> {
    if payload.name.is_empty() {
        return Err(AppError::Validation("Name is required".to_string()));
    }
    
    let collection = state.db.collection::<Promo>("promos");
    let mut promo = payload;
    promo.id = None;
    promo.created_at = Some(mongodb::bson::DateTime::now());
    promo.updated_at = Some(mongodb::bson::DateTime::now());
    
    let result = collection.insert_one(promo, None).await?;
    let created_id = result.inserted_id.as_object_id().unwrap();
    
    Ok(ApiResponse::success(json!({ "id": created_id.to_hex() })))
}

pub async fn update_promo(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<Promo>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Promo>("promos");
    
    let update_doc = doc! {
        "$set": {
            "name": payload.name,
            "discountAmount": payload.discount_amount,
            "discountType": payload.discount_type,
            "customerType": payload.customer_type,
            "outlet": payload.outlet,
            "validFrom": payload.valid_from,
            "validTo": payload.valid_to,
            "isActive": payload.is_active,
            "updatedAt": mongodb::bson::DateTime::now()
        }
    };
    
    let result = collection.update_one(doc! { "_id": oid }, update_doc, None).await?;
    
    if result.matched_count == 0 {
        return Err(AppError::NotFound("Promo not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "updated": true })))
}

pub async fn delete_promo(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Promo>("promos");
    
    let result = collection.delete_one(doc! { "_id": oid }, None).await?;
    
    if result.deleted_count == 0 {
        return Err(AppError::NotFound("Promo not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "deleted": true })))
}
