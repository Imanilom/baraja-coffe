use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
    RequestExt,
};
use std::sync::Arc;
use bson::oid::ObjectId;

use crate::error::{AppError, AppResult};
use crate::utils::verify_token;
use crate::AppState;

/// User ID extension for request
#[derive(Clone, Debug)]
pub struct UserId(pub ObjectId);

/// Authentication middleware - validates JWT tokens
pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Extract Authorization header
    let auth_header = request
        .headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok());

    if let Some(auth_header) = auth_header {
        // Check if it starts with "Bearer "
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            // Verify JWT token
            match verify_token(token, &state.config.jwt) {
                Ok(claims) => {
                    // Parse user ID from claims
                    match ObjectId::parse_str(&claims.sub) {
                        Ok(user_id) => {
                            // Inject user ID directly into request extensions
                            request.extensions_mut().insert(UserId(user_id));
                            tracing::debug!("Authenticated user: {}", user_id);
                            return Ok(next.run(request).await);
                        }
                        Err(e) => {
                            tracing::warn!("Invalid user ID in token: {}", e);
                            return Err(AppError::Authentication("Invalid user ID in token".to_string()));
                        }
                    }
                }
                Err(e) => {
                    tracing::warn!("Token verification failed: {}", e);
                    return Err(e);
                }
            }
        }
    }

    // No valid token found
    Err(AppError::Authentication("Authentication required".to_string()))
}

/// Optional authentication middleware - doesn't fail if no token
pub async fn optional_auth_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let auth_header = request
        .headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok());

    if let Some(auth_header) = auth_header {
        if let Some(token) = auth_header.strip_prefix("Bearer ") {
            if let Ok(claims) = verify_token(token, &state.config.jwt) {
                if let Ok(user_id) = ObjectId::parse_str(&claims.sub) {
                    request.extensions_mut().insert(UserId(user_id));
                }
            }
        }
    }

    Ok(next.run(request).await)
}

/// Company/Tenant isolation middleware
/// Extracts company ID from headers or token for multi-tenant support
pub async fn company_middleware(
    request: Request,
    next: Next,
) -> AppResult<Response> {
    // Extract company ID from header or JWT token
    let company_id = request
        .headers()
        .get("x-company-id")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string());

    if let Some(company_id) = company_id {
        tracing::debug!("Request for company: {}", company_id);
    }

    // TODO: Inject company_id into request extensions for use in handlers
    Ok(next.run(request).await)
}
