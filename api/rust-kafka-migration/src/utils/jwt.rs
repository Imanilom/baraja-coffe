#![allow(dead_code)]
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use bson::oid::ObjectId;
use chrono::{Utc, Duration};

use crate::config::JwtConfig;
use crate::error::{AppError, AppResult};
use crate::db::models::Permission;

/// JWT Claims structure
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,  // User ID
    pub role: String,  // Role name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role_permission: Option<Vec<Permission>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cashier_type: Option<String>,
    pub exp: i64,  // Expiration time
    pub iat: i64,  // Issued at
}

/// Generate JWT token
pub fn generate_token(
    user_id: &ObjectId,
    role_name: &str,
    permissions: Option<Vec<Permission>>,
    cashier_type: Option<String>,
    config: &JwtConfig,
) -> AppResult<String> {
    let now = Utc::now();
    let expiration = now + Duration::seconds(config.expiration);

    let claims = Claims {
        sub: user_id.to_hex(),
        role: role_name.to_string(),
        role_permission: permissions,
        cashier_type,
        exp: expiration.timestamp(),
        iat: now.timestamp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.secret.as_bytes()),
    )
    .map_err(|e| AppError::Authentication(format!("Failed to generate token: {}", e)))
}

/// Verify and decode JWT token
pub fn verify_token(token: &str, config: &JwtConfig) -> AppResult<Claims> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(config.secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|e| AppError::Authentication(format!("Invalid token: {}", e)))
}

/// Extract user ID from token
pub fn extract_user_id(token: &str, config: &JwtConfig) -> AppResult<ObjectId> {
    let claims = verify_token(token, config)?;
    ObjectId::parse_str(&claims.sub)
        .map_err(|e| AppError::Authentication(format!("Invalid user ID in token: {}", e)))
}
