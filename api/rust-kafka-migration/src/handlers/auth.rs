use axum::{
    extract::State,
    Json,
};

use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::db::models::{User, UserResponse, AuthType};
use crate::db::repositories::UserRepository;
use crate::error::{ApiResponse, AppError, AppResult};
use crate::utils::generate_token;
use crate::AppState;

/// Signup request
#[derive(Debug, Deserialize)]
pub struct SignupRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

/// Signup response
#[derive(Debug, Serialize)]
pub struct SignupResponse {
    pub message: String,
    pub user: UserInfo,
    pub token: String,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: String,
    pub username: String,
    pub email: String,
    pub role: String,
    #[serde(rename = "authType")]
    pub auth_type: AuthType,
}

/// Signup handler - POST /api/auth/signup
pub async fn signup(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SignupRequest>,
) -> AppResult<Json<ApiResponse<SignupResponse>>> {
    // Validate input
    if payload.username.is_empty() || payload.email.is_empty() || payload.password.is_empty() {
        return Err(AppError::BadRequest(
            "Username, email, and password are required".to_string(),
        ));
    }

    let user_repo = UserRepository::new(state.db.clone());

    // Check if user already exists
    if user_repo.find_by_email(&payload.email).await?.is_some() {
        return Err(AppError::Conflict("Email already exists".to_string()));
    }

    // Find default customer role
    let customer_role = user_repo
        .get_role_by_name("customer")
        .await?
        .ok_or_else(|| {
            AppError::Internal(
                "Default role 'customer' not found. Please seed roles first.".to_string(),
            )
        })?;

    // Hash password
    let hashed_password = bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::Internal(format!("Failed to hash password: {}", e)))?;

    // Create new user
    let new_user = User::new(
        payload.username.clone(),
        Some(payload.email.clone()),
        hashed_password,
        customer_role.id.unwrap(),
        AuthType::Local,
    );

    let user_id = user_repo.create(new_user).await?;

    // Generate JWT token
    let token = generate_token(
        &user_id,
        &customer_role.name,
        Some(customer_role.permissions.clone()),
        None,
        &state.config.jwt,
    )?;

    let response = SignupResponse {
        message: "User created successfully".to_string(),
        user: UserInfo {
            id: user_id.to_hex(),
            username: payload.username,
            email: payload.email,
            role: customer_role.name,
            auth_type: AuthType::Local,
        },
        token,
    };

    Ok(Json(ApiResponse::success(response)))
}

/// Signin request
#[derive(Debug, Deserialize)]
pub struct SigninRequest {
    pub identifier: String, // email or username
    pub password: String,
}

/// Signin response
#[derive(Debug, Serialize)]
pub struct SigninResponse {
    #[serde(flatten)]
    pub user: UserResponse,
    #[serde(rename = "rolePermission")]
    pub role_permission: Vec<crate::db::models::Permission>,
    pub token: String,
}

/// Signin handler - POST /api/auth/signin
pub async fn signin(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SigninRequest>,
) -> AppResult<Json<ApiResponse<SigninResponse>>> {
    if payload.identifier.is_empty() || payload.password.is_empty() {
        return Err(AppError::BadRequest(
            "Identifier and password are required".to_string(),
        ));
    }

    let user_repo = UserRepository::new(state.db.clone());

    // Find user with role
    let (mut user, role) = user_repo
        .find_by_identifier_with_role(&payload.identifier)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    // Check if identifier is email (customer login)
    if payload.identifier.contains('@') {
        if role.name != "customer" {
            return Err(AppError::Authorization("Access denied".to_string()));
        }
    } else {
        // Staff/Admin login
        let allowed_roles = vec![
            "superadmin",
            "admin",
            "marketing",
            "akuntan",
            "inventory",
            "operational",
            "gro",
            "qc",
            "hrd",
            "staff",
            "cashier junior",
            "cashier senior",
        ];

        if !allowed_roles.contains(&role.name.as_str()) {
            return Err(AppError::Authorization("Access denied".to_string()));
        }
    }

    // Set default authType if not set
    if user.auth_type == AuthType::Local && user.password == "-" {
        user.auth_type = AuthType::Local;
        user_repo
            .update_auth_type(&user.id.unwrap(), "local")
            .await?;
    }

    // Verify password
    let is_valid = bcrypt::verify(&payload.password, &user.password)
        .map_err(|e| AppError::Internal(format!("Password verification failed: {}", e)))?;

    if !is_valid {
        return Err(AppError::Authentication("Wrong credentials".to_string()));
    }

    // Generate JWT token
    let token = generate_token(
        &user.id.unwrap(),
        &role.name,
        Some(role.permissions.clone()),
        user.cashier_type.as_ref().map(|ct| format!("{:?}", ct).to_lowercase()),
        &state.config.jwt,
    )?;

    let user_response = UserResponse::from((user, role.name.clone()));

    let response = SigninResponse {
        user: user_response,
        role_permission: role.permissions,
        token,
    };

    Ok(Json(ApiResponse::success(response)))
}

/// Get current user - GET /api/auth/me
pub async fn get_me(
    State(state): State<Arc<AppState>>,
    axum::Extension(user_id): axum::Extension<crate::middleware::UserId>,
) -> AppResult<Json<ApiResponse<UserResponse>>> {
    let user_repo = UserRepository::new(state.db.clone());

    let (user, role) = user_repo
        .find_with_role(&user_id.0)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let user_response = UserResponse::from((user, role.name));

    Ok(Json(ApiResponse::success(user_response)))
}

/// Update profile request
#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub username: Option<String>,
    pub phone: Option<String>,
}

/// Update profile - POST /api/auth/update-profile
pub async fn update_profile(
    State(state): State<Arc<AppState>>,
    axum::Extension(user_id): axum::Extension<crate::middleware::UserId>,
    Json(payload): Json<UpdateProfileRequest>,
) -> AppResult<Json<ApiResponse<UserResponse>>> {
    let user_repo = UserRepository::new(state.db.clone());

    // Update profile
    user_repo
        .update_profile(
            &user_id.0,
            payload.username.as_deref(),
            payload.phone.as_deref(),
        )
        .await?;

    // Get updated user
    let (user, role) = user_repo
        .find_with_role(&user_id.0)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let user_response = UserResponse::from((user, role.name));

    Ok(Json(ApiResponse::success_with_message(
        user_response,
        "Profile updated successfully".to_string(),
    )))
}

/// Change password request
#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    #[serde(rename = "currentPassword")]
    pub current_password: String,
    #[serde(rename = "newPassword")]
    pub new_password: String,
}

/// Change password - POST /api/auth/change-password
pub async fn change_password(
    State(state): State<Arc<AppState>>,
    axum::Extension(user_id): axum::Extension<crate::middleware::UserId>,
    Json(payload): Json<ChangePasswordRequest>,
) -> AppResult<Json<ApiResponse<()>>> {
    if payload.current_password.is_empty() || payload.new_password.is_empty() {
        return Err(AppError::BadRequest(
            "Current password and new password are required".to_string(),
        ));
    }

    let user_repo = UserRepository::new(state.db.clone());

    // Get user
    let user = user_repo
        .find_by_id(&user_id.0)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    // Verify current password
    let is_valid = bcrypt::verify(&payload.current_password, &user.password)
        .map_err(|e| AppError::Internal(format!("Password verification failed: {}", e)))?;

    if !is_valid {
        return Err(AppError::BadRequest(
            "Current password is incorrect".to_string(),
        ));
    }

    // Hash new password
    let hashed_password = bcrypt::hash(&payload.new_password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::Internal(format!("Failed to hash password: {}", e)))?;

    // Update password
    user_repo.update_password(&user_id.0, &hashed_password).await?;

    Ok(Json(ApiResponse::success_with_message(
        (),
        "Password changed successfully".to_string(),
    )))
}

/// Signout - GET /api/auth/signout
pub async fn signout() -> AppResult<Json<ApiResponse<String>>> {
    // In a stateless JWT system, signout is handled client-side
    // The client should remove the token from storage
    Ok(Json(ApiResponse::success("Signout success!".to_string())))
}
