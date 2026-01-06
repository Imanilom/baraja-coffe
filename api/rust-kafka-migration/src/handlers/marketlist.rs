use axum::{
    extract::{State, Path, Query},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
// use futures::stream::TryStreamExt;
use bson::{doc, oid::ObjectId};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::{Request, MarketList, RequestStatus, FulfillmentStatus};

#[derive(Deserialize)]
pub struct RequestFilter {
    pub status: Option<String>,
    pub department: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub page: Option<u64>,
    pub limit: Option<i64>,
}

pub async fn create_request(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Request>,
) -> AppResult<impl IntoResponse> {
    let request = state.market_list_service.create_request(payload).await?;
    Ok(ApiResponse::success(request))
}

pub async fn get_requests(
    State(state): State<Arc<AppState>>,
    Query(filter): Query<RequestFilter>,
) -> AppResult<impl IntoResponse> {
    let mut db_filter = doc! {};
    
    if let Some(status) = filter.status {
        db_filter.insert("status", status);
    }
    
    // ... add more filter logic as needed ...

    let limit = filter.limit.unwrap_or(50);
    let _skip = (filter.page.unwrap_or(1).saturating_sub(1)) * limit as u64;

    let requests = state.db.collection::<Request>("requests")
        .find(db_filter, None).await?;
    
    use futures::stream::TryStreamExt;
    let results: Vec<Request> = requests.try_collect().await?;
    
    Ok(ApiResponse::success(results))
}

pub async fn get_request(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let request = state.market_list_service.get_request_by_id(&oid).await?
        .ok_or_else(|| AppError::NotFound("Request not found".to_string()))?;
    Ok(ApiResponse::success(request))
}

#[derive(Deserialize)]
pub struct ApproveItemsPayload {
    pub items: Vec<String>, // Item IDs
    pub source_warehouse: String,
    pub destination_warehouse: String,
    pub reviewed_by: String,
}

pub async fn approve_request_items(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<ApproveItemsPayload>,
) -> AppResult<impl IntoResponse> {
    let request_id = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let source_oid = ObjectId::parse_str(&payload.source_warehouse).map_err(|_| AppError::BadRequest("Invalid source warehouse ID".to_string()))?;
    let dest_oid = ObjectId::parse_str(&payload.destination_warehouse).map_err(|_| AppError::BadRequest("Invalid destination warehouse ID".to_string()))?;
    
    let item_oids = payload.items.iter()
        .map(|s| ObjectId::parse_str(s).map_err(|_| AppError::BadRequest(format!("Invalid item ID: {}", s))))
        .collect::<Result<Vec<ObjectId>, AppError>>()?;

    let updated_request = state.market_list_service.approve_request_items(
        request_id,
        item_oids,
        source_oid,
        dest_oid,
        payload.reviewed_by
    ).await?;

    Ok(ApiResponse::success(updated_request))
}

pub async fn record_purchase(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<MarketList>,
) -> AppResult<impl IntoResponse> {
    // In a real scenario, we'd get the user from auth middleware
    let handled_by = payload.created_by.clone(); 
    let result = state.market_list_service.record_purchase(payload, handled_by).await?;
    Ok(ApiResponse::success(result))
}
