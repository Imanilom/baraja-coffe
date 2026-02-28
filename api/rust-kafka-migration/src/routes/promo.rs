use axum::{
    routing::{delete, get, post, put},
    Router,
};
use std::sync::Arc;

use crate::{handlers::promo, AppState};

pub fn promo_routes() -> Router<Arc<AppState>> {
    Router::new()
        // Auto-promo routes
        .route(
            "/auto",
            get(promo::get_auto_promos).post(promo::create_auto_promo),
        )
        .route(
            "/auto/:id",
            put(promo::update_auto_promo).delete(promo::delete_auto_promo),
        )
        // Manual promo routes
        .route("/", get(promo::get_promos).post(promo::create_promo))
        .route(
            "/:id",
            get(promo::get_promo_by_id)
                .put(promo::update_promo)
                .delete(promo::delete_promo),
        )
}
