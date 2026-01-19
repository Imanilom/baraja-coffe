use axum::{
    extract::{Path, State},
    Json,
};
use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{
    error::{ApiResponse, AppResult},
    services::EventService,
    AppState,
};

// Request DTOs
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEventRequest {
    name: String,
    description: String,
    location: String,
    date: String,
    end_date: String,
    price: f64,
    organizer: String,
    contact_email: String,
    contact_phone: Option<String>,
    image_url: Option<String>,
    category: String,
    tags: Vec<String>,
    capacity: i32,
    terms: String,
    is_free_event: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterFreeEventRequest {
    full_name: String,
    email: String,
    phone: String,
    gender: Option<String>,
    current_city: Option<String>,
    notes: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckInRequest {
    booking_code: String,
    check_in_by: String,
}

// Create event
pub async fn create_event(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateEventRequest>,
) -> AppResult<Json<ApiResponse<serde_json::Value>>> {
    let event_service = EventService::new(state.event_repo.clone(), state.menu_repo.clone());

    let event = crate::db::models::Event {
        id: None,
        name: req.name,
        description: req.description,
        location: req.location,
        date: parse_date(&req.date)?,
        end_date: parse_date(&req.end_date)?,
        price: req.price,
        organizer: req.organizer,
        contact_email: req.contact_email,
        contact_phone: req.contact_phone,
        image_url: req
            .image_url
            .unwrap_or_else(|| "https://placehold.co/1920x1080/png".to_string()),
        category: req.category,
        tags: req.tags,
        status: crate::db::models::EventStatus::Upcoming,
        capacity: req.capacity,
        sold_tickets: 0,
        ticket_purchases: vec![],
        attendees: vec![],
        privacy: "public".to_string(),
        terms: req.terms,
        menu_item: None,
        is_free_event: req.is_free_event,
        free_registrations: vec![],
        created_at: None,
        updated_at: None,
    };

    let (created_event, _menu_item) = event_service.create_event_with_menu_item(event).await?;

    Ok(Json(ApiResponse::success(serde_json::to_value(
        created_event,
    )?)))
}

// Get all events
pub async fn get_events(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<serde_json::Value>>> {
    let event_service = EventService::new(state.event_repo.clone(), state.menu_repo.clone());

    let events = event_service.get_all_events(None).await?;
    Ok(Json(ApiResponse::success(serde_json::to_value(events)?)))
}

// Get event by ID
pub async fn get_event_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<ApiResponse<serde_json::Value>>> {
    let event_service = EventService::new(state.event_repo.clone(), state.menu_repo.clone());

    let obj_id = ObjectId::parse_str(&id)
        .map_err(|_| crate::error::AppError::BadRequest("Invalid ID format".to_string()))?;

    let event = event_service
        .get_event_by_id(&obj_id)
        .await?
        .ok_or_else(|| crate::error::AppError::NotFound("Event not found".to_string()))?;

    Ok(Json(ApiResponse::success(serde_json::to_value(event)?)))
}

// Register for free event
pub async fn register_free_event(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<RegisterFreeEventRequest>,
) -> AppResult<Json<ApiResponse<serde_json::Value>>> {
    let event_service = EventService::new(state.event_repo.clone(), state.menu_repo.clone());

    let obj_id = ObjectId::parse_str(&id)
        .map_err(|_| crate::error::AppError::BadRequest("Invalid ID format".to_string()))?;

    let (booking_code, event) = event_service
        .register_free_event(
            &obj_id,
            req.full_name,
            req.email,
            req.phone,
            req.gender,
            req.current_city,
            req.notes,
        )
        .await?;

    let response = serde_json::json!({
        "bookingCode": booking_code,
        "event": event,
    });

    Ok(Json(ApiResponse::success(response)))
}

// Check-in attendee
pub async fn check_in_attendee(
    State(state): State<Arc<AppState>>,
    Path(event_id): Path<String>,
    Json(req): Json<CheckInRequest>,
) -> AppResult<Json<ApiResponse<serde_json::Value>>> {
    let event_service = EventService::new(state.event_repo.clone(), state.menu_repo.clone());

    let obj_id = ObjectId::parse_str(&event_id)
        .map_err(|_| crate::error::AppError::BadRequest("Invalid ID format".to_string()))?;

    let event = event_service
        .check_in_attendee(&obj_id, &req.booking_code, &req.check_in_by)
        .await?;

    Ok(Json(ApiResponse::success(serde_json::to_value(event)?)))
}

// Get available events
pub async fn get_available_events(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<ApiResponse<serde_json::Value>>> {
    let event_service = EventService::new(state.event_repo.clone(), state.menu_repo.clone());

    let events = event_service.get_available_events().await?;
    Ok(Json(ApiResponse::success(serde_json::to_value(events)?)))
}

// Helper function to parse date
fn parse_date(date_str: &str) -> AppResult<mongodb::bson::DateTime> {
    let dt = chrono::DateTime::parse_from_rfc3339(date_str)
        .map_err(|_| crate::error::AppError::BadRequest("Invalid date format".to_string()))?;
    Ok(mongodb::bson::DateTime::from_millis(dt.timestamp_millis()))
}
