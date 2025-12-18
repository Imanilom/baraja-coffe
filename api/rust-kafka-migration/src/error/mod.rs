use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

/// Application-wide error type
#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] mongodb::error::Error),

    #[error("BSON serialization error: {0}")]
    BsonSerialization(#[from] bson::ser::Error),

    #[error("BSON deserialization error: {0}")]
    BsonDeserialization(#[from] bson::de::Error),

    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),

    #[error("Kafka error: {0}")]
    Kafka(String),

    #[error("HTTP client error: {0}")]
    HttpClient(#[from] reqwest::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Authentication error: {0}")]
    Authentication(String),

    #[error("Authorization error: {0}")]
    Authorization(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal server error: {0}")]
    Internal(String),

    #[error("Payment processing error: {0}")]
    Payment(String),

    #[error("Stock error: {0}")]
    Stock(String),

    #[error("Lock acquisition error: {0}")]
    Lock(String),

    #[error("External service error: {0}")]
    ExternalService(String),

    #[error("Configuration error: {0}")]
    Config(#[from] config::ConfigError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Standard API response structure matching Node.js format
#[derive(serde::Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            message: None,
            data: Some(data),
            error: None,
        }
    }

    pub fn success_with_message(data: T, message: String) -> Self {
        Self {
            success: true,
            message: Some(message),
            data: Some(data),
            error: None,
        }
    }
}

impl ApiResponse<()> {
    pub fn error(message: String) -> Self {
        Self {
            success: false,
            message: Some(message.clone()),
            data: None,
            error: Some(message),
        }
    }
}

/// Convert AppError to HTTP response matching Node.js format
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::Database(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Database error: {}", e),
            ),
            AppError::BsonSerialization(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Serialization error: {}", e),
            ),
            AppError::BsonDeserialization(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Deserialization error: {}", e),
            ),
            AppError::Redis(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Cache error: {}", e),
            ),
            AppError::Kafka(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Kafka error: {}", e),
            ),
            AppError::HttpClient(e) => (
                StatusCode::BAD_GATEWAY,
                format!("External service error: {}", e),
            ),
            AppError::Serialization(e) => (
                StatusCode::BAD_REQUEST,
                format!("Invalid data format: {}", e),
            ),
            AppError::Config(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Configuration error: {}", e),
            ),
            AppError::Io(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("IO error: {}", e),
            ),
            AppError::Authentication(msg) | AppError::Authorization(msg) => {
                (StatusCode::UNAUTHORIZED, msg.clone())
            }
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg.clone()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            AppError::Payment(msg) => (StatusCode::PAYMENT_REQUIRED, msg.clone()),
            AppError::Stock(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Lock(msg) => (StatusCode::LOCKED, msg.clone()),
            AppError::ExternalService(msg) => (StatusCode::BAD_GATEWAY, msg.clone()),
        };

        // Log the error
        tracing::error!("API Error: {} - {}", status, message);

        // Return JSON response matching Node.js format
        let body = Json(json!({
            "success": false,
            "message": message,
            "error": message,
        }));

        (status, body).into_response()
    }
}

/// Result type alias for convenience
pub type AppResult<T> = Result<T, AppError>;
