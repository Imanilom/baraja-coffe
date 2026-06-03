use axum::{
    routing::{delete, get, post, put},
    Router,
};
use std::sync::Arc;

use crate::{handlers::recipe, AppState};

pub fn recipe_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(recipe::get_recipes).post(recipe::create_recipe))
        .route("/menu/:menu_id", get(recipe::get_recipe_by_menu_id))
        .route(
            "/:id",
            put(recipe::update_recipe).delete(recipe::delete_recipe),
        )
}
