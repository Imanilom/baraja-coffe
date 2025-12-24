#![allow(dead_code)]
use axum::{
    extract::{State, Path},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use bson::oid::ObjectId;
use bson::doc;
use chrono::Utc;
use futures::stream::TryStreamExt;
use serde_json::json;

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::recipe::Recipe;

pub async fn get_recipes(State(state): State<Arc<AppState>>) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Recipe>("recipes");
    let cursor = collection.find(None, None).await?;
    let recipes: Vec<Recipe> = cursor.try_collect().await?;
    Ok(ApiResponse::success(recipes))
}

pub async fn get_recipe_by_menu_id(
    State(state): State<Arc<AppState>>,
    Path(menu_id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&menu_id).map_err(|_| AppError::BadRequest("Invalid Menu ID".to_string()))?;
    let collection = state.db.collection::<Recipe>("recipes");
    
    let recipe = collection.find_one(doc! { "menuItemId": oid }, None).await?;
    match recipe {
        Some(r) => Ok(ApiResponse::success(r)),
        None => Err(AppError::NotFound("Recipe not found for this menu item".to_string())),
    }
}

pub async fn create_recipe(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Recipe>,
) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Recipe>("recipes");
    let mut recipe = payload;
    recipe.id = None;
    recipe.created_at = Utc::now();
    
    let result = collection.insert_one(recipe, None).await?;
    Ok(ApiResponse::success(json!({ "id": result.inserted_id.as_object_id().unwrap().to_hex() })))
}

pub async fn update_recipe(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<Recipe>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Recipe>("recipes");
    
    let update_doc = doc! {
        "$set": {
            "baseIngredients": bson::to_bson(&payload.base_ingredients).unwrap(),
            "toppingOptions": bson::to_bson(&payload.topping_options).unwrap(),
            "addonOptions": bson::to_bson(&payload.addon_options).unwrap(),
            "createdAt": Utc::now() // usually updateAt, but model only has createdAt
        }
    };
    
    let result = collection.update_one(doc! { "_id": oid }, update_doc, None).await?;
    
    if result.matched_count == 0 {
        return Err(AppError::NotFound("Recipe not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "updated": true })))
}

pub async fn delete_recipe(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id).map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Recipe>("recipes");
    
    let result = collection.delete_one(doc! { "_id": oid }, None).await?;
    
    if result.deleted_count == 0 {
        return Err(AppError::NotFound("Recipe not found".to_string()));
    }
    
    Ok(ApiResponse::success(json!({ "id": id, "deleted": true })))
}
