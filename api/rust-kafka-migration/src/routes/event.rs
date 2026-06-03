use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;

use crate::{handlers::event, AppState};

pub fn event_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(event::get_events).post(event::create_event))
        .route("/:id", get(event::get_event_by_id))
        .route("/:id/register", post(event::register_free_event))
        .route("/:event_id/checkin", post(event::check_in_attendee))
        .route("/available", get(event::get_available_events))
}
