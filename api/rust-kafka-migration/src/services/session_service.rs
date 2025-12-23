use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use uuid::Uuid;
use chrono::{DateTime, Utc, Duration};

use crate::error::{AppResult, AppError};

const SESSION_TTL_SECONDS: i64 = 3600; // 1 hour
const SESSION_PREFIX: &str = "session";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeviceSession {
    #[serde(rename = "deviceId")]
    pub device_id: String,
    
    #[serde(rename = "outletId")]
    pub outlet_id: String,
    
    #[serde(rename = "sessionId")]
    pub session_id: String,
    
    pub role: String,
    
    #[serde(rename = "deviceName")]
    pub device_name: String,
    
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
    
    #[serde(rename = "expiresAt")]
    pub expires_at: DateTime<Utc>,
}

pub struct SessionService {
    redis_client: redis::Client,
}

impl SessionService {
    pub fn new(redis_client: redis::Client) -> Self {
        Self { redis_client }
    }

    /// Create a new device session
    pub async fn create_session(
        &self,
        device_id: &str,
        outlet_id: &ObjectId,
        role: &str,
        device_name: &str,
    ) -> AppResult<DeviceSession> {
        let session_id = Uuid::new_v4().to_string();
        let now = Utc::now();
        let expires_at = now + Duration::seconds(SESSION_TTL_SECONDS);

        let session = DeviceSession {
            device_id: device_id.to_string(),
            outlet_id: outlet_id.to_string(),
            session_id: session_id.clone(),
            role: role.to_string(),
            device_name: device_name.to_string(),
            created_at: now,
            expires_at,
        };

        let session_key = self.get_session_key(device_id, &outlet_id.to_string());
        let session_json = serde_json::to_string(&session)
            .map_err(|e| AppError::Internal(format!("Failed to serialize session: {}", e)))?;

        let mut conn = self.redis_client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| AppError::Internal(format!("Redis connection failed: {}", e)))?;

        // Set session with TTL
        conn.set_ex(&session_key, session_json, SESSION_TTL_SECONDS as u64)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to create session: {}", e)))?;

        tracing::info!(
            "✅ Session created for device {} ({})",
            device_name,
            session_id
        );

        Ok(session)
    }

    /// Validate a session
    pub async fn validate_session(
        &self,
        device_id: &str,
        outlet_id: &str,
        session_id: &str,
    ) -> AppResult<DeviceSession> {
        let session_key = self.get_session_key(device_id, outlet_id);

        let mut conn = self.redis_client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| AppError::Internal(format!("Redis connection failed: {}", e)))?;

        let session_json: Option<String> = conn
            .get(&session_key)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to get session: {}", e)))?;

        let session_json = session_json
            .ok_or_else(|| AppError::Unauthorized("Session not found or expired".to_string()))?;

        let session: DeviceSession = serde_json::from_str(&session_json)
            .map_err(|e| AppError::Internal(format!("Failed to deserialize session: {}", e)))?;

        // Verify session ID matches
        if session.session_id != session_id {
            return Err(AppError::Unauthorized("Invalid session ID".to_string()));
        }

        // Check if expired
        if session.expires_at < Utc::now() {
            // Clean up expired session
            let _: () = conn.del(&session_key).await.unwrap_or(());
            return Err(AppError::Unauthorized("Session expired".to_string()));
        }

        Ok(session)
    }

    /// Refresh session TTL
    pub async fn refresh_session(
        &self,
        device_id: &str,
        outlet_id: &str,
    ) -> AppResult<()> {
        let session_key = self.get_session_key(device_id, outlet_id);

        let mut conn = self.redis_client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| AppError::Internal(format!("Redis connection failed: {}", e)))?;

        // Extend TTL
        let result: bool = conn
            .expire(&session_key, SESSION_TTL_SECONDS as i64)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to refresh session: {}", e)))?;

        if !result {
            return Err(AppError::Unauthorized("Session not found".to_string()));
        }

        tracing::debug!("Session refreshed for device {}", device_id);

        Ok(())
    }

    /// End a session
    pub async fn end_session(
        &self,
        device_id: &str,
        outlet_id: &str,
    ) -> AppResult<()> {
        let session_key = self.get_session_key(device_id, outlet_id);

        let mut conn = self.redis_client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| AppError::Internal(format!("Redis connection failed: {}", e)))?;

        let _: () = conn
            .del(&session_key)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to end session: {}", e)))?;

        tracing::info!("Session ended for device {}", device_id);

        Ok(())
    }

    /// Get all active sessions for an outlet
    pub async fn get_active_sessions(
        &self,
        outlet_id: &str,
    ) -> AppResult<Vec<DeviceSession>> {
        let pattern = format!("{}:*:{}", SESSION_PREFIX, outlet_id);

        let mut conn = self.redis_client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| AppError::Internal(format!("Redis connection failed: {}", e)))?;

        let keys: Vec<String> = conn
            .keys(&pattern)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to get session keys: {}", e)))?;

        let mut sessions = Vec::new();
        for key in keys {
            if let Ok(Some(session_json)) = conn.get::<_, Option<String>>(&key).await {
                if let Ok(session) = serde_json::from_str::<DeviceSession>(&session_json) {
                    // Check if not expired
                    if session.expires_at >= Utc::now() {
                        sessions.push(session);
                    }
                }
            }
        }

        Ok(sessions)
    }

    /// Generate session key
    fn get_session_key(&self, device_id: &str, outlet_id: &str) -> String {
        format!("{}:{}:{}", SESSION_PREFIX, device_id, outlet_id)
    }
}
