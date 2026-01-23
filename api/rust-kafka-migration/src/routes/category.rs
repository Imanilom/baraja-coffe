use axum::{
    routing::{delete, get, post, put},
    Router,
};
use std::sync::Arc;

use crate::{handlers::category, AppState};

pub fn category_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route(
            "/",
            get(category::get_categories).post(category::create_category),
        )
        .route(
            "/:id",
            get(category::get_category)
                .put(category::update_category)
                .delete(category::delete_category),
        )
}
