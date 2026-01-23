use axum::{
    routing::{delete, get, post, put},
    Router,
};
use std::sync::Arc;

use crate::{handlers::voucher, AppState};

pub fn voucher_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route(
            "/",
            get(voucher::get_vouchers).post(voucher::create_voucher),
        )
        .route(
            "/:id",
            put(voucher::update_voucher).delete(voucher::delete_voucher),
        )
}
