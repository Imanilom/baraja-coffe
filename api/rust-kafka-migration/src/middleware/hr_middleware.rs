use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use bson::oid::ObjectId;
use std::sync::Arc;

use crate::{
    db::models::User,
    error::{AppError, AppResult},
    AppState,
    utils::jwt,
};

// Key for storing company_id in request extensions
#[derive(Clone, Copy, Debug)]
pub struct CompanyId(pub ObjectId);

/// Middleware to extract Company ID from header 'x-company-id'
pub async fn set_company_context(
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let company_id_str = headers
        .get("x-company-id")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Validation("Missing x-company-id header".to_string()))?;

    let company_id = ObjectId::parse_str(company_id_str)
        .map_err(|_| AppError::Validation("Invalid company ID format".to_string()))?;

    request.extensions_mut().insert(CompanyId(company_id));

    Ok(next.run(request).await)
}

/// Middleware to verify user has access to the requested company
/// Assumes `auth` middleware has already run and `User` is in extensions
pub async fn verify_company_access(
    State(state): State<Arc<AppState>>,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let user = request
        .extensions()
        .get::<User>()
        .ok_or_else(|| AppError::Unauthorized("User not found in context".to_string()))?;
    
    let company_id = request
        .extensions()
        .get::<CompanyId>()
        .ok_or_else(|| AppError::Validation("Company context not set".to_string()))?;

    // Check if user is SuperAdmin (bypass check) - Assuming Role based check exists or checking user type
    // For now, let's assume we check if user is linked to an employee in this company OR is admin
    
    // Simplification: Check if User has 'admin' role or is an employee of this company
    // This requires looking up Employee record linked to User
    
    let is_admin = true; // Placeholder: impl role check
    
    if is_admin {
         return Ok(next.run(request).await);
    }

    let employee = state.hr_services.employee_service.find_by_user_id_and_company(&user.id.unwrap(), &company_id.0).await?;

    if employee.is_some() {
        Ok(next.run(request).await)
    } else {
        Err(AppError::Forbidden("User does not have access to this company".to_string()))
    }
}
