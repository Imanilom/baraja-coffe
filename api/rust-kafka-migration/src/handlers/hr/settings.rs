use axum::{
    extract::{Path, State},
    response::IntoResponse,
    Json,
};
use bson::oid::ObjectId;
use std::sync::Arc;
use serde_json::json;

use crate::{
    db::models::hr_setting::BpjsSettings,
    error::{AppError, AppResult},
    AppState,
};

/// Get BPJS Preview
pub async fn get_bpjs_preview(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<serde_json::Value>, // { basic_salary: 5000000, settings: { ... } }
) -> AppResult<impl IntoResponse> {
    let basic_salary = payload.get("basic_salary").and_then(|v| v.as_f64()).unwrap_or(0.0);
    // Parse settings from payload or use default if not provided?
    // Ideally user provides settings to test, or we fetch from company ID in query
    
    // For now simple implementation assuming full settings passed or defaults used
    let settings: BpjsSettings = if let Some(s) = payload.get("settings") {
        serde_json::from_value(s.clone()).unwrap_or_default()
    } else {
        BpjsSettings::default()
    };

    let preview = state.hr_services.bpjs_service.get_preview(basic_salary, &settings);
    
    Ok(Json(preview))
}

/// Reset Settings
pub async fn reset_settings(
    State(state): State<Arc<AppState>>,
    Path(company_id): Path<String>,
) -> AppResult<impl IntoResponse> {
     let oid = ObjectId::parse_str(&company_id).map_err(|_| AppError::Validation("Invalid ID".to_string()))?;
     
     state.hr_repositories.hr_setting_repo.delete_by_company_id(&oid).await?;
     // Re-create default
     let settings = crate::db::models::HRSetting::new(oid);
     state.hr_repositories.hr_setting_repo.create(settings).await?;
     
     Ok(Json(json!({"status": "reset"})))
}
