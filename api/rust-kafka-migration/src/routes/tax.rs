use axum::{
    routing::{delete, get, post, put},
    Router,
};
use std::sync::Arc;

use crate::{handlers::tax, AppState};

pub fn tax_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(tax::get_taxes).post(tax::create_tax))
        .route("/:id", put(tax::update_tax).delete(tax::delete_tax))
}
