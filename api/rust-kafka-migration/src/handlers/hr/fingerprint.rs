use axum::{
    extract::{Path, State},
    response::IntoResponse,
    Json,
};
use bson::oid::ObjectId;
use std::sync::Arc;
use serde_json::json;

use crate::{
    error::{AppError, AppResult},
    AppState,
    middleware::hr_middleware::CompanyId,
};

#[derive(serde::Deserialize)]
pub struct RegisterFingerprintPayload {
    pub employee_id: String,
    pub device_user_id: String,
}

/// Register Fingerprint
pub async fn register_fingerprint(
    State(state): State<Arc<AppState>>,
    context: axum::Extension<CompanyId>,
    Json(payload): Json<RegisterFingerprintPayload>,
) -> AppResult<impl IntoResponse> {
    let employee_id = ObjectId::parse_str(&payload.employee_id)
        .map_err(|_| AppError::Validation("Invalid Employee ID".to_string()))?;

    // Verify employee belongs to company from context
    let employee = state.hr_repositories.employee_repo.find_by_id(&employee_id).await?
        .ok_or_else(|| AppError::NotFound("Employee not found".to_string()))?;

    if employee.company != context.0 .0 {
         return Err(AppError::Validation("Employee does not belong to this company".to_string()));
    }

    let id = state.hr_services.fingerprint_service.register_fingerprint(
        employee_id,
        payload.device_user_id
    ).await?;

    Ok((axum::http::StatusCode::CREATED, Json(json!({"id": id.to_hex()}))).into_response())
}

/// Sync Device Data
pub async fn sync_device(
    State(_state): State<Arc<AppState>>,
) -> AppResult<impl IntoResponse> {
    // Logic to sync with external device or process bulk data
    Ok(Json(json!({"status": "synced", "message": "Not fully implemented"})))
}
