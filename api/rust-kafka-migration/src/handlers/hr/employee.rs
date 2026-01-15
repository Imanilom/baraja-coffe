use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
    Json,
};
use bson::{doc, oid::ObjectId};
use std::sync::Arc;
use serde_json::json;

use crate::{
    db::models::Employee,
    error::{AppError, AppResult},
    AppState,
    common::PaginationParams,
    middleware::hr_middleware::CompanyId,
};

/// Create new employee
pub async fn create_employee(
    State(state): State<Arc<AppState>>,
    context: Option<axum::Extension<CompanyId>>, // Optional because admin might create without context? Best to require it or pass in body.
    Json(payload): Json<Employee>,
) -> AppResult<impl IntoResponse> {
    // If context is present, ensure payload uses that company
    if let Some(company_id) = context {
        if payload.company != company_id.0 .0 {
             return Err(AppError::Validation("Company ID mismatch with context".to_string()));
        }
    }

    let id = state.hr_services.employee_service.create_employee(payload).await?;
    Ok((axum::http::StatusCode::CREATED, Json(json!({"id": id.to_hex()}))).into_response())
}

/// Get all employees (filtered by context if set, else admin view)
pub async fn get_all_employees(
    State(state): State<Arc<AppState>>,
    context: Option<axum::Extension<CompanyId>>,
    Query(pagination): Query<PaginationParams>,
) -> AppResult<impl IntoResponse> {
    let company_id_filter = context.as_ref().map(|c| &c.0.0);
    // TODO: Extract department and is_active from query params
    let department = None; 
    let is_active = None;

    let employees = state.hr_repositories.employee_repo.find_all(company_id_filter, department, is_active, pagination.page, pagination.limit).await?;
    let count = state.hr_repositories.employee_repo.count(company_id_filter, is_active).await?;

    Ok(Json(json!({
        "data": employees,
        "total": count,
        "page": pagination.page.unwrap_or(1),
        "limit": pagination.limit.unwrap_or(10)
    })))
}

/// Get employee by ID
pub async fn get_employee_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
    let employee = state.hr_repositories.employee_repo.find_by_id(&oid).await?
        .ok_or_else(|| AppError::NotFound("Employee not found".to_string()))?;

    Ok(Json(employee))
}

/// Update employee
pub async fn update_employee(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<Employee>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
    
    // Convert payload to Document
    let doc = bson::to_document(&payload).map_err(AppError::BsonSerialization)?;
    state.hr_repositories.employee_repo.update(&oid, doc).await?;
    Ok(Json(json!({"status": "updated"})))
}

/// Deactivate employee
pub async fn deactivate_employee(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
    state.hr_repositories.employee_repo.deactivate(&oid).await?;
    Ok(Json(json!({"status": "deactivated"})))
}

/// Get salary summary
pub async fn get_salary_summary(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
    
    let summary = state.hr_services.employee_service.get_salary_components(&oid).await?
         .ok_or_else(|| AppError::NotFound("Employee not found".to_string()))?;
         
    Ok(Json(summary))
}
