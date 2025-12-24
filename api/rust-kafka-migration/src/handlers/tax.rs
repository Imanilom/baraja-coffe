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
use crate::db::models::tax::TaxAndService;

pub async fn get_taxes(State(state): State<Arc<AppState>>) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<TaxAndService>("taxandservices");
    let cursor = collection.find(None, None).await?;
    let taxes: Vec<TaxAndService> = cursor.try_collect().await?;
    Ok(ApiResponse::success(taxes))
}

pub async fn create_tax(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<TaxAndService>,
) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<TaxAndService>("taxandservices");
    let mut tax = payload;
    tax.id = None;
    tax.created_at = Some(Utc::now());
    tax.updated_at = Some(Utc::now());
    
    let result = collection.insert_one(tax, None).await?;
    Ok(ApiResponse::success(json!({ "id": result.inserted_id.as_object_id().unwrap().to_hex() })))
}

pub async fn update_tax(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<TaxAndService>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<TaxAndService>("taxandservices");
    
    // Simplified update (replace fields)
    let update_doc = doc! {
        "$set": {
            "name": payload.name,
            "type": payload.kind,
            "description": payload.description,
            "percentage": payload.percentage,
            "fixedFee": payload.fixed_fee,
            "appliesToOutlets": payload.applies_to_outlets,
            "appliesToMenuItems": payload.applies_to_menu_items,
            "isActive": payload.is_active,
            "updatedAt": Utc::now()
        }
    };
    
    let result = collection.update_one(doc! { "_id": oid }, update_doc, None).await?;
    
    if result.matched_count == 0 {
        return Err(AppError::NotFound("Tax not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "updated": true })))
}

pub async fn delete_tax(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<TaxAndService>("taxandservices");
    
    let result = collection.delete_one(doc! { "_id": oid }, None).await?;
    
    if result.deleted_count == 0 {
        return Err(AppError::NotFound("Tax not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "deleted": true })))
}
