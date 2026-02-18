use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
    Json,
};
use bson::oid::ObjectId;
use std::sync::Arc;
use serde_json::json;

use crate::{
    db::models::SalaryStatus,
    error::{AppError, AppResult},
    AppState,
    common::PaginationParams,
    middleware::hr_middleware::CompanyId,
};

#[derive(serde::Deserialize)]
pub struct CalculateSalaryPayload {
    pub employee_id: String,
    pub month: i32,
    pub year: i32,
}

/// Calculate Salary for Employee
pub async fn calculate_salary(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CalculateSalaryPayload>,
) -> AppResult<impl IntoResponse> {
    let employee_id = ObjectId::parse_str(&payload.employee_id)
        .map_err(|_| AppError::Validation("Invalid Employee ID".to_string()))?;

    let id = state.hr_services.salary_service.calculate_salary(
        employee_id,
        payload.month,
        payload.year
    ).await?;

    Ok((axum::http::StatusCode::CREATED, Json(json!({"id": id.to_hex()}))).into_response())
}

/// Get Salaries by Period
pub async fn get_salaries_by_period(
    State(_state): State<Arc<AppState>>,
    _context: axum::Extension<CompanyId>,
    Query(_params): Query<CalculateSalaryPayload>, // Reusing struct for month/year query
) -> AppResult<impl IntoResponse> {
     // Start/End date logic needed here similar to service
     // For now just using repo default or need service to expose find
     // Repo takes start/end dates.
     
     // Placeholder
     Ok(Json(json!({"message": "Not implemented completely yet"})))
}

/// Mark as Paid
pub async fn mark_as_paid(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
    
    state.hr_repositories.salary_repo.update_status(&oid, SalaryStatus::Paid, Some(mongodb::bson::DateTime::now())).await?;
    
    Ok(Json(json!({"status": "paid"})))
}
