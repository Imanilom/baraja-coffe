use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
    Json,
};
use bson::{doc, oid::ObjectId};
use std::sync::Arc;
use serde_json::json;

use crate::{
    db::models::{Company, HRSetting},
    error::{AppError, AppResult},
    AppState,
    common::PaginationParams,
};

/// Get all companies with pagination
pub async fn get_all_companies(
    State(state): State<Arc<AppState>>,
    Query(pagination): Query<PaginationParams>,
) -> AppResult<impl IntoResponse> {
    // Extract is_active filter from query params if needed, or define a new struct for Query
    // For now, let's assume no filtering or add a struct.
    // Let's change signature to accept optional is_active
    // Query(params): Query<CompanyFilter>
    // But since I can't easily add a struct and change signature in one go cleanly without knowing imports...
    // I'll assume is_active is None for now.
    let is_active = None; 
    let companies = state.hr_repositories.company_repo.find_all(is_active, pagination.page, pagination.limit).await?;
    let count = state.hr_repositories.company_repo.count(is_active).await?;

    Ok(Json(json!({
        "data": companies,
        "total": count,
        "page": pagination.page.unwrap_or(1),
        "limit": pagination.limit.unwrap_or(10)
    })))
}

/// Get company by ID
pub async fn get_company_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
    let company = state.hr_repositories.company_repo.find_by_id(&oid).await?
        .ok_or_else(|| AppError::NotFound("Company not found".to_string()))?;

    Ok(Json(company))
}

/// Create new company
pub async fn create_company(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Company>,
) -> AppResult<impl IntoResponse> {
    // Basic validation
    if state.hr_repositories.company_repo.find_by_code(&payload.code).await?.is_some() {
        return Err(AppError::Validation("Company code already exists".to_string()));
    }

    let id = state.hr_repositories.company_repo.create(payload).await?;
    
    // Also create default HR Settings for this company
    let settings = HRSetting::new(id);
    state.hr_repositories.hr_setting_repo.create(settings).await?;

    Ok((axum::http::StatusCode::CREATED, Json(json!({"id": id.to_hex()}))).into_response())
}

/// Update company
pub async fn update_company(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<Company>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
    
    // TODO: proper update struct or partial update
    // Convert payload to Document
    let doc = bson::to_document(&payload).map_err(AppError::BsonSerialization)?;
    state.hr_repositories.company_repo.update(&oid, doc).await?;

    Ok(Json(json!({"status": "success"})))
}

/// Activate company
pub async fn activate_company(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
    state.hr_repositories.company_repo.activate(&oid).await?;
    Ok(Json(json!({"status": "activated"})))
}

/// Deactivate company
pub async fn deactivate_company(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
    state.hr_repositories.company_repo.deactivate(&oid).await?;
    Ok(Json(json!({"status": "deactivated"})))
}

/// Get company settings
pub async fn get_company_settings(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
    
    // Attempt to find specific HR settings document first
    let settings = state.hr_repositories.hr_setting_repo.find_by_company_id(&oid).await?;
    
    if let Some(s) = settings {
         Ok(Json(s))
    } else {
        // Fallback to embedded settings in Company or create default?
        // For now, return embedded or Error. 
        // Logic: Company creation initializes HRSetting. If missing, it's an error state or legacy.
        Err(AppError::NotFound("Settings not found".to_string()))
    }
}

/// Update company settings
pub async fn update_company_settings(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<HRSetting>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
    
    // Ensure payload company ID matches path
    let mut settings = payload;
    settings.company = oid;

    state.hr_repositories.hr_setting_repo.update(&oid, settings).await?;
    
    Ok(Json(json!({"status": "updated"})))
}
