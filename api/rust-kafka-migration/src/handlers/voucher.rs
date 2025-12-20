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
use crate::db::models::voucher::Voucher;

pub async fn get_vouchers(State(state): State<Arc<AppState>>) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Voucher>("vouchers");
    let cursor = collection.find(None, None).await?;
    let vouchers: Vec<Voucher> = cursor.try_collect().await?;
    Ok(ApiResponse::success(vouchers))
}

pub async fn create_voucher(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Voucher>,
) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Voucher>("vouchers");
    let mut voucher = payload;
    voucher.id = None;
    voucher.created_at = Some(Utc::now());
    voucher.updated_at = Some(Utc::now());
    
    let result = collection.insert_one(voucher, None).await?;
    Ok(ApiResponse::success(json!({ "id": result.inserted_id.as_object_id().unwrap().to_hex() })))
}

pub async fn update_voucher(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<Voucher>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Voucher>("vouchers");
    
    let update_doc = doc! {
        "$set": {
            "code": payload.code,
            "name": payload.name,
            "description": payload.description,
            "discountAmount": payload.discount_amount,
            "discountType": payload.discount_type,
            "validFrom": payload.valid_from,
            "validTo": payload.valid_to,
            "quota": payload.quota,
            "oneTimeUse": payload.one_time_use,
            "applicableOutlets": payload.applicable_outlets,
            "customerType": payload.customer_type,
            "printOnReceipt": payload.print_on_receipt,
            "isActive": payload.is_active,
            "updatedAt": Utc::now()
        }
    };
    
    let result = collection.update_one(doc! { "_id": oid }, update_doc, None).await?;
    
    if result.matched_count == 0 {
        return Err(AppError::NotFound("Voucher not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "updated": true })))
}

pub async fn delete_voucher(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Voucher>("vouchers");
    
    let result = collection.delete_one(doc! { "_id": oid }, None).await?;
    
    if result.deleted_count == 0 {
        return Err(AppError::NotFound("Voucher not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "deleted": true })))
}
