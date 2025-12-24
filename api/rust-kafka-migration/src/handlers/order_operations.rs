use futures::stream::TryStreamExt;
use axum::{
    extract::{State, Path},
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use mongodb::bson::{doc, oid::ObjectId};
use serde::Deserialize;
use serde_json::json;
use chrono::Utc;

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::order::Order;

// ============================================
// GET ORDERS
// ============================================

#[derive(Debug, Deserialize)]
pub struct GetOrdersQuery {
    #[serde(rename = "outletId")]
    pub outlet_id: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<i64>,
}

/// Get pending orders by outlet
pub async fn get_pending_orders(
    State(state): State<Arc<AppState>>,
    Path(outlet_id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let outlet_oid = ObjectId::parse_str(&outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let order_collection: mongodb::Collection<Order> = 
        state.db.collection("orders");
    
    let mut cursor = order_collection
        .find(doc! {
            "outlet": outlet_oid,
            "status": { "$in": ["Pending", "Processing"] }
        }, None)
        .await?;

    let mut orders = Vec::new();
    while let Some(doc) = cursor.try_next().await? {
        orders.push(doc);
    }

    Ok(ApiResponse::success(json!({
        "data": orders,
        "total": orders.len()
    })))
}

/// Get active orders (for GRO/table management)
pub async fn get_active_orders(
    State(state): State<Arc<AppState>>,
    Path(outlet_id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let outlet_oid = ObjectId::parse_str(&outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;

    let order_collection: mongodb::Collection<Order> = 
        state.db.collection("orders");
    
    let mut cursor = order_collection
        .find(doc! {
            "outlet": outlet_oid,
            "status": { "$nin": ["Completed", "Cancelled"] }
        }, None)
        .await?;

    let mut orders = Vec::new();
    while let Some(doc) = cursor.try_next().await? {
        orders.push(doc);
    }

    Ok(ApiResponse::success(json!({
        "data": orders,
        "total": orders.len()
    })))
}

/// Get order by ID
pub async fn get_order_by_id(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<Order> = 
        state.db.collection("orders");
    
    let order = order_collection
        .find_one(doc! { "orderId": &order_id }, None)
        .await?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    Ok(ApiResponse::success(order))
}

/// Get cashier orders
pub async fn get_cashier_orders(
    State(state): State<Arc<AppState>>,
    Path(cashier_id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let cashier_oid = ObjectId::parse_str(&cashier_id)
        .map_err(|_| AppError::BadRequest("Invalid cashier ID".to_string()))?;

    let order_collection: mongodb::Collection<Order> = 
        state.db.collection("orders");
    
    let mut cursor = order_collection
        .find(doc! { "cashierId": cashier_oid }, None)
        .await?;

    let mut orders = Vec::new();
    while let Some(doc) = cursor.try_next().await? {
        orders.push(doc);
    }

    Ok(ApiResponse::success(json!({
        "data": orders,
        "total": orders.len()
    })))
}

// ============================================
// ORDER CONFIRMATION
// ============================================

#[derive(Debug, Deserialize)]
pub struct ConfirmOrderRequest {
    #[serde(rename = "paymentMethod", skip_serializing_if = "Option::is_none")]
    pub payment_method: Option<String>,
}

/// Confirm order (Web/App)
pub async fn confirm_order(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
    Json(payload): Json<ConfirmOrderRequest>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<Order> = 
        state.db.collection("orders");
    
    let order = order_collection
        .find_one(doc! { "orderId": &order_id }, None)
        .await?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    if order.status == "Completed" {
        return Ok(ApiResponse::success(json!({
            "message": "Order already confirmed",
            "order": order
        })));
    }

    // Update order status
    order_collection
        .update_one(
            doc! { "orderId": &order_id },
            doc! { "$set": {
                "status": "Completed",
                "confirmedAt": Utc::now()
            }},
            None,
        )
        .await?;

    // Get updated order
    let updated_order = order_collection
        .find_one(doc! { "orderId": &order_id }, None)
        .await?
        .unwrap();

    Ok(ApiResponse::success(json!({
        "message": "Order confirmed successfully",
        "order": updated_order
    })))
}

/// Confirm order by cashier
pub async fn confirm_order_by_cashier(
    State(state): State<Arc<AppState>>,
    Path(job_id): Path<String>,
) -> AppResult<impl IntoResponse> {
    // In Node.js, this uses job_id from queue
    // For now, treat it as order_id
    confirm_order(State(state), Path(job_id), Json(ConfirmOrderRequest { payment_method: None })).await
}

/// Batch confirm orders
pub async fn batch_confirm_orders(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Vec<String>>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<Order> = 
        state.db.collection("orders");
    
    let result = order_collection
        .update_many(
            doc! { "orderId": { "$in": payload.clone() } },
            doc! { "$set": {
                "status": "Completed",
                "confirmedAt": Utc::now()
            }},
            None,
        )
        .await?;

    Ok(ApiResponse::success(json!({
        "message": format!("Confirmed {} orders", result.modified_count),
        "confirmedCount": result.modified_count
    })))
}

// ============================================
// ORDER EDITING
// ============================================

#[derive(Debug, Deserialize)]
pub struct EditOrderRequest {
    #[serde(rename = "addItems", skip_serializing_if = "Option::is_none")]
    pub add_items: Option<Vec<serde_json::Value>>,
    
    #[serde(rename = "removeItems", skip_serializing_if = "Option::is_none")]
    pub remove_items: Option<Vec<String>>, // item IDs
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

/// Edit order (add/remove items)
pub async fn edit_order(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
    Json(payload): Json<EditOrderRequest>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<Order> = 
        state.db.collection("orders");
    
    let mut order = order_collection
        .find_one(doc! { "orderId": &order_id }, None)
        .await?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    // Remove items
    if let Some(remove_ids) = payload.remove_items {
        order.items.retain(|item| {
            if let Some(item_id) = &item.menu_item {
                !remove_ids.contains(&item_id.to_string())
            } else {
                false
            }
        });
    }

    // TODO: Add items (requires processing like in create order)
    // For now, just update the order

    // Recalculate totals
    let new_subtotal: f64 = order.items.iter().map(|item| item.subtotal).sum();
    order.total_before_discount = new_subtotal;
    order.grand_total = new_subtotal; // Simplified, should recalculate discounts/taxes

    // Update order
    order_collection
        .replace_one(doc! { "orderId": &order_id }, &order, None)
        .await?;

    Ok(ApiResponse::success(json!({
        "message": "Order updated successfully",
        "order": order
    })))
}

#[derive(Debug, Deserialize)]
pub struct DeleteOrderItemRequest {
    #[serde(rename = "orderId")]
    pub order_id: String,
    
    #[serde(rename = "itemId")]
    pub item_id: String,
}

/// Delete specific order item
pub async fn delete_order_item(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<DeleteOrderItemRequest>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<Order> = 
        state.db.collection("orders");
    
    let result = order_collection
        .update_one(
            doc! { "orderId": &payload.order_id },
            doc! { "$pull": {
                "items": { "menuItem": ObjectId::parse_str(&payload.item_id).ok() }
            }},
            None,
        )
        .await?;

    if result.modified_count == 0 {
        return Err(AppError::NotFound("Order or item not found".to_string()));
    }

    Ok(ApiResponse::success(json!({
        "message": "Item removed successfully"
    })))
}

// ============================================
// PAYMENT PROCESSING
// ============================================

#[derive(Debug, Deserialize)]
pub struct ProcessPaymentRequest {
    #[serde(rename = "orderId")]
    pub order_id: String,
    
    #[serde(rename = "paymentMethod")]
    pub payment_method: String,
    
    pub amount: f64,
    
    #[serde(rename = "cashierId", skip_serializing_if = "Option::is_none")]
    pub cashier_id: Option<String>,
}

/// Process cashier payment
pub async fn process_payment_cashier(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ProcessPaymentRequest>,
) -> AppResult<impl IntoResponse> {
    // TODO: Create payment record
    // TODO: Update order status
    // TODO: Trigger print to kitchen/bar

    Ok(ApiResponse::success(json!({
        "message": "Payment processed successfully",
        "orderId": payload.order_id,
        "amount": payload.amount,
        "method": payload.payment_method
    })))
}

/// Get payment status
pub async fn get_payment_status(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
) -> AppResult<impl IntoResponse> {
    // TODO: Get payment from payments collection
    
    Ok(ApiResponse::success(json!({
        "orderId": order_id,
        "status": "pending",
        "message": "Payment status check"
    })))
}

// ============================================
// ORDER STATUS UPDATES
// ============================================

#[derive(Debug, Deserialize)]
pub struct UpdateOrderStatusRequest {
    pub status: String,
}

/// Update order status
pub async fn update_order_status(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
    Json(payload): Json<UpdateOrderStatusRequest>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<Order> = 
        state.db.collection("orders");
    
    order_collection
        .update_one(
            doc! { "orderId": &order_id },
            doc! { "$set": {
                "status": &payload.status,
                "updatedAt": Utc::now()
            }},
            None,
        )
        .await?;

    Ok(ApiResponse::success(json!({
        "message": "Order status updated",
        "orderId": order_id,
        "newStatus": payload.status
    })))
}

#[derive(Debug, Deserialize)]
pub struct UpdateItemStatusRequest {
    pub status: String,
}

/// Update individual item status
pub async fn update_item_status(
    State(state): State<Arc<AppState>>,
    Path((order_id, item_id)): Path<(String, String)>,
    Json(payload): Json<UpdateItemStatusRequest>,
) -> AppResult<impl IntoResponse> {
    let item_oid = ObjectId::parse_str(&item_id)
        .map_err(|_| AppError::BadRequest("Invalid item ID".to_string()))?;

    let order_collection: mongodb::Collection<Order> = 
        state.db.collection("orders");
    
    order_collection
        .update_one(
            doc! {
                "orderId": &order_id,
                "items.menuItem": item_oid
            },
            doc! { "$set": {
                "items.$.status": &payload.status
            }},
            None,
        )
        .await?;

    Ok(ApiResponse::success(json!({
        "message": "Item status updated",
        "itemId": item_id,
        "newStatus": payload.status
    })))
}
