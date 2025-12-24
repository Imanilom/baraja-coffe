use axum::{
    extract::{State, Json, Query},
// http::StatusCode,
};
use serde::Deserialize;
use std::sync::Arc;
use mongodb::bson::{doc, oid::ObjectId};

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::device::{Device, DeviceQuota, RoleQuota};

#[derive(Debug, Deserialize)]
pub struct CreateDeviceRequest {
    pub outlet: String,
    #[serde(rename = "deviceId")]
    pub device_id: String,
    pub role: String,
    pub location: String,
    #[serde(rename = "deviceName")]
    pub device_name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDeviceRequest {
    #[serde(rename = "deviceId")]
    pub device_id: Option<String>,
    pub role: Option<String>,
    pub location: Option<String>,
    #[serde(rename = "deviceName")]
    pub device_name: Option<String>,
    #[serde(rename = "isActive")]
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct GetDevicesQuery {
    #[serde(rename = "outletId")]
    pub outlet_id: String,
}

#[derive(Debug, Deserialize)]
pub struct SetQuotasRequest {
    pub outlet: String,
    pub quotas: Vec<RoleQuota>,
}

/// Create a new device
pub async fn create_device(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateDeviceRequest>,
) -> AppResult<impl axum::response::IntoResponse> {
    let outlet_id = ObjectId::parse_str(&payload.outlet)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    // Check if outlet exists
    let outlet_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("outlets");
    
    if outlet_collection.find_one(doc! { "_id": outlet_id }, None).await?.is_none() {
        return Err(AppError::NotFound("Outlet not found".to_string()));
    }

    // Check quota
    let quota_collection: mongodb::Collection<DeviceQuota> = 
        state.db.collection("devicequotas");
    
    let quota_doc = quota_collection
        .find_one(doc! { "outlet": outlet_id }, None)
        .await?
        .ok_or_else(|| AppError::BadRequest("Device quotas not configured for this outlet".to_string()))?;

    let role_quota = quota_doc.quotas.iter()
        .find(|q| q.role == payload.role)
        .ok_or_else(|| AppError::BadRequest(format!("No quota defined for role: {}", payload.role)))?;

    // Count active devices with same role
    let device_collection: mongodb::Collection<Device> = state.db.collection("devices");
    
    let active_count = device_collection
        .count_documents(doc! {
            "outlet": outlet_id,
            "role": &payload.role,
            "isActive": true
        }, None)
        .await? as i32;

    if active_count >= role_quota.max_devices {
        return Err(AppError::BadRequest(format!(
            "Quota exceeded for role \"{}\". Maximum allowed: {}",
            payload.role, role_quota.max_devices
        )));
    }

    // Check if device ID already exists
    if device_collection
        .find_one(doc! { "outlet": outlet_id, "deviceId": &payload.device_id }, None)
        .await?
        .is_some()
    {
        return Err(AppError::BadRequest("Device ID already registered in this outlet".to_string()));
    }

    // Create device
    let new_device = Device {
        id: None,
        device_id: payload.device_id,
        outlet: outlet_id,
        role: payload.role,
        location: payload.location,
        device_name: payload.device_name,
        assigned_areas: Vec::new(),
        assigned_tables: Vec::new(),
        order_types: Vec::new(),
        is_active: true,
        last_login: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let result = device_collection.insert_one(&new_device, None).await?;
    
    let mut created_device = new_device;
    created_device.id = Some(result.inserted_id.as_object_id().unwrap());

    Ok(ApiResponse::success(serde_json::json!({
        "message": "Device created successfully",
        "data": created_device
    })))
}

/// Get devices by outlet
pub async fn get_devices_by_outlet(
    State(state): State<Arc<AppState>>,
    Query(query): Query<GetDevicesQuery>,
) -> AppResult<impl axum::response::IntoResponse> {
    let outlet_id = ObjectId::parse_str(&query.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let device_collection: mongodb::Collection<Device> = state.db.collection("devices");
    
    let mut cursor = device_collection
        .find(doc! { "outlet": outlet_id, "isActive": true }, None)
        .await?;

    let mut devices = Vec::new();
    while cursor.advance().await? {
        devices.push(cursor.deserialize_current()?);
    }

    // Get quota info
    let quota_collection: mongodb::Collection<DeviceQuota> = 
        state.db.collection("devicequotas");
    
    let quota_status = if let Some(quota_doc) = quota_collection
        .find_one(doc! { "outlet": outlet_id }, None)
        .await?
    {
        let mut quota_map = std::collections::HashMap::new();
        
        for q in &quota_doc.quotas {
            let count = devices.iter().filter(|d| d.role == q.role).count() as i32;
            quota_map.insert(q.role.clone(), serde_json::json!({
                "max": q.max_devices,
                "current": count
            }));
        }
        
        quota_map
    } else {
        std::collections::HashMap::new()
    };

    Ok(ApiResponse::success(serde_json::json!({
        "data": devices,
        "quotaStatus": quota_status
    })))
}

/// Update device
pub async fn update_device(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(id): axum::extract::Path<String>,
    Json(payload): Json<UpdateDeviceRequest>,
) -> AppResult<impl axum::response::IntoResponse> {
    let device_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid device ID".to_string()))?;

    let device_collection: mongodb::Collection<Device> = state.db.collection("devices");
    
    let mut device = device_collection
        .find_one(doc! { "_id": device_id }, None)
        .await?
        .ok_or_else(|| AppError::NotFound("Device not found".to_string()))?;

    // Update fields
    if let Some(device_id_str) = payload.device_id {
        device.device_id = device_id_str;
    }
    if let Some(role) = payload.role {
        device.role = role;
    }
    if let Some(location) = payload.location {
        device.location = location;
    }
    if let Some(device_name) = payload.device_name {
        device.device_name = device_name;
    }
    if let Some(is_active) = payload.is_active {
        device.is_active = is_active;
        if is_active {
            device.last_login = Some(chrono::Utc::now());
        }
    }
    
    device.updated_at = chrono::Utc::now();

    device_collection
        .replace_one(doc! { "_id": device_id }, &device, None)
        .await?;

    Ok(ApiResponse::success(serde_json::json!({
        "message": "Device updated successfully",
        "data": device
    })))
}

/// Delete (deactivate) device
pub async fn delete_device(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> AppResult<impl axum::response::IntoResponse> {
    let device_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid device ID".to_string()))?;

    let device_collection: mongodb::Collection<Device> = state.db.collection("devices");
    
    let result = device_collection
        .update_one(
            doc! { "_id": device_id },
            doc! { "$set": { "isActive": false, "updatedAt": chrono::Utc::now() } },
            None,
        )
        .await?;

    if result.matched_count == 0 {
        return Err(AppError::NotFound("Device not found".to_string()));
    }

    Ok(ApiResponse::success(serde_json::json!({
        "message": "Device deactivated successfully"
    })))
}

/// Set device quotas for outlet
pub async fn set_device_quotas(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SetQuotasRequest>,
) -> AppResult<impl axum::response::IntoResponse> {
    let outlet_id = ObjectId::parse_str(&payload.outlet)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    // Validate outlet exists
    let outlet_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("outlets");
    
    if outlet_collection.find_one(doc! { "_id": outlet_id }, None).await?.is_none() {
        return Err(AppError::NotFound("Outlet not found".to_string()));
    }

    // Validate quotas
    if payload.quotas.is_empty() {
        return Err(AppError::BadRequest("Quotas must be a non-empty array".to_string()));
    }

    let valid_roles = vec![
        "cashier senior",
        "cashier junior",
        "inventory",
        "kitchen",
        "drive-thru",
        "waiter",
        "bar",
    ];

    let mut seen_roles = std::collections::HashSet::new();
    for q in &payload.quotas {
        if !valid_roles.contains(&q.role.as_str()) {
            return Err(AppError::BadRequest(format!("Invalid role: {}", q.role)));
        }
        if !seen_roles.insert(&q.role) {
            return Err(AppError::BadRequest(format!("Duplicate role not allowed: {}", q.role)));
        }
    }

    // Update or create quota document
    let quota_collection: mongodb::Collection<DeviceQuota> = 
        state.db.collection("devicequotas");
    
    let quota_doc = DeviceQuota {
        id: None,
        outlet: outlet_id,
        quotas: payload.quotas,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    quota_collection
        .replace_one(
            doc! { "outlet": outlet_id },
            &quota_doc,
            mongodb::options::ReplaceOptions::builder().upsert(true).build(),
        )
        .await?;

    Ok(ApiResponse::success(serde_json::json!({
        "message": "Device quotas updated successfully",
        "data": quota_doc
    })))
}

/// Get device quotas for outlet
pub async fn get_device_quotas(
    State(state): State<Arc<AppState>>,
    Query(query): Query<GetDevicesQuery>,
) -> AppResult<impl axum::response::IntoResponse> {
    let outlet_id = ObjectId::parse_str(&query.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let quota_collection: mongodb::Collection<DeviceQuota> = 
        state.db.collection("devicequotas");
    
    let quota_doc = quota_collection
        .find_one(doc! { "outlet": outlet_id }, None)
        .await?
        .ok_or_else(|| AppError::NotFound("No device quotas found for this outlet".to_string()))?;

    // Calculate current usage
    let device_collection: mongodb::Collection<Device> = state.db.collection("devices");
    
    let mut usage = Vec::new();
    for q in &quota_doc.quotas {
        let count = device_collection
            .count_documents(doc! {
                "outlet": outlet_id,
                "role": &q.role,
                "isActive": true
            }, None)
            .await? as i32;

        usage.push(serde_json::json!({
            "role": q.role,
            "maxDevices": q.max_devices,
            "currentDevices": count,
            "available": q.max_devices - count
        }));
    }

    Ok(ApiResponse::success(serde_json::json!({
        "outlet": outlet_id,
        "quotas": usage,
        "totalUsed": usage.iter().map(|u| u["currentDevices"].as_i64().unwrap_or(0)).sum::<i64>()
    })))
}
