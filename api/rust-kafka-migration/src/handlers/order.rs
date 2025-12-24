use axum::response::IntoResponse;
use tracing::{info, warn};
use axum::{
    extract::{State, Json},
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;
use bson::oid::ObjectId;
use chrono::Utc;

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};
use crate::db::models::order::Order;
use serde_json::json;
use validator::Validate;

#[derive(Debug, Deserialize, Serialize, Validate, Clone)]
pub struct CreateOrderRequest {
    pub order_id: Option<String>,
    #[validate(custom(function = "validate_source"))]
    pub source: String,
    pub table_number: Option<String>,
    #[serde(rename = "orderType")]
    pub order_type: Option<String>, // Dine-In, Reservation, etc.
    #[serde(rename = "customerId")]
    pub customer_id: Option<String>, // ObjectId
    #[validate(length(min = 1, message = "Outlet ID is required"))]
    #[serde(rename = "outletId")]
    pub outlet_id: String, // ObjectId
    #[serde(rename = "loyaltyPointsToRedeem")]
    pub loyalty_points_to_redeem: Option<i32>,
    pub delivery_option: Option<String>,
    pub recipient_data: Option<Value>,
    #[serde(rename = "customAmountItems")]
    pub custom_amount_items: Option<Vec<crate::services::order_service::CustomAmountItemInput>>,
    pub payment_details: Option<Value>, // Can be Object or Array
    pub user: Option<String>,
    pub contact: Option<ContactInfo>,
    #[serde(rename = "cashierId")]
    pub cashier_id: Option<String>,
    #[serde(rename = "deviceId")]
    pub device_id: Option<String>,
    #[serde(default)]
    pub is_split_payment: bool,
    pub items: Option<Vec<crate::services::order_service::OrderItemInput>>, // Typed items
    #[serde(rename = "voucherCode")]
    pub voucher_code: Option<String>,
    #[serde(rename = "customerType")]
    pub customer_type: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ContactInfo {
    pub phone: String,
    pub email: Option<String>,
}

fn validate_source(source: &str) -> std::result::Result<(), validator::ValidationError> {
    match source {
        "Web" | "App" | "Cashier" => Ok(()),
        _ => Err(validator::ValidationError::new("invalid_source")),
    }
}

pub async fn create_unified_order(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateOrderRequest>,
) -> AppResult<impl IntoResponse> {
    // 1. Initial Validation
    payload.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    // Specific Source Validation
    if payload.source == "Web" {
        if payload.is_split_payment {
            return Err(AppError::Validation("Split payment not allowed for Web source".to_string()));
        }
        if payload.cashier_id.is_some() {
            // Log warning but don't fail, just ignore (as per Node logic)
            warn!("cashierId provided for Web source, ignoring: {:?}", payload.cashier_id);
        }
        if payload.user.is_none() || payload.user.as_ref().unwrap().trim().is_empty() {
             return Err(AppError::Validation("Customer name required for Web orders".to_string()));
        }
        if payload.contact.is_none() || payload.contact.as_ref().unwrap().phone.trim().is_empty() {
             return Err(AppError::Validation("Customer phone required for Web orders".to_string()));
        }
    }

    if payload.source == "Cashier" && payload.cashier_id.is_none() {
         return Err(AppError::Validation("cashierId required for Cashier source".to_string()));
    }

    // Generate Order ID
    let order_id = if let Some(table_num) = &payload.table_number {
        // In real app, generateOrderId(tableNumber)
        // Placeholder:
        format!("ORD-{}-{}", table_num, chrono::Utc::now().timestamp())
    } else {
         // Default generic ID
         format!("{}-{}-{}", payload.source.to_uppercase(), chrono::Utc::now().timestamp(), uuid::Uuid::new_v4().to_string().chars().take(5).collect::<String>())
    };

    info!("📝 Creating order from {}: ID={}, Outlet={}", payload.source, order_id, payload.outlet_id);

    // 2. Branching Logic
    if payload.source == "Cashier" {
        info!("💰 Processing Cashier order directly (no lock needed)");
        let result = process_cashier_order(&state, &payload, &order_id).await?;
        return Ok(ApiResponse::success(json!(result)));
    }

    // Web & App: Use Atomic Lock
    info!("🔒 Processing with atomic lock for Web/App order: {}", order_id);

    // Pre-check existence
    let outlet_oid = ObjectId::parse_str(&payload.outlet_id).unwrap_or_default(); // Should handle error better in real app or trust validation
    let existing_order = state.order_repo.find_by_order_id_and_outlet(&order_id, &outlet_oid).await
        ?;

    if let Some(order) = existing_order {
        info!("🔄 Order already exists (pre-check), returning existing: {}", order_id);
        return Ok(ApiResponse::success(json!({
            "status": "Completed",
            "orderId": order_id,
            "message": "Order already exists",
            "order": order
         })))
    }

    let outlet_oid = ObjectId::parse_str(&payload.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid Outlet ID".to_string()))?;
    
    // Acquire lock and process
    let lock_owner = uuid::Uuid::new_v4().to_string();
    let state_clone = state.clone();
    let payload_clone = payload.clone();
    let order_id_clone = order_id.clone();

    state.lock_util.with_lock(
        &order_id,
        &lock_owner,
        30000, // 30s TTL
        10,    // 10 retries
        500,   // 500ms delay
        move || {
            let state = state_clone;
            let payload = payload_clone;
            let order_id = order_id_clone;
            
            async move {
                // Double check existence inside lock
                let existing = state.order_repo.find_by_order_id_and_outlet(&order_id, &outlet_oid).await?;
                if let Some(order) = existing {
                    return Ok(json!({
                        "status": "Completed",
                        "orderId": order_id,
                        "message": "Order already exists (double-check)",
                        "order": order
                    }));
                }

                // Process order items through service
                let process_result = state.order_service.process_order_items(crate::services::order_service::ProcessOrderItemsRequest {
                    items: payload.items.clone().unwrap_or_default(),
                    outlet: outlet_oid,
                    order_type: payload.order_type.clone().unwrap_or_else(|| "Dine-In".to_string()),
                    voucher_code: payload.voucher_code.clone(),
                    customer_type: payload.customer_type.clone(),
                    source: payload.source.clone(),
                    customer_id: payload.customer_id.as_ref().and_then(|id| ObjectId::parse_str(id).ok()),
                    loyalty_points_to_redeem: payload.loyalty_points_to_redeem,
                    custom_amount_items: payload.custom_amount_items.clone(),
                }).await?;

                // Map to Order model
                let mut order = map_request_to_order(&state, &payload, order_id.clone(), outlet_oid).await?;
                
                // Update order with processed data
                order.items = process_result.order_items;
                order.custom_amount_items = process_result.custom_amount_items;
                order.total_before_discount = process_result.totals.before_discount;
                order.total_after_discount = process_result.totals.after_discount;
                order.total_tax = process_result.totals.total_tax;
                order.total_service_fee = process_result.totals.total_service_fee;
                order.grand_total = process_result.totals.grand_total;
                
                // Save to database
                state.order_repo.create(order.clone()).await?;

                Ok(json!(order))
            }
        }
    ).await.map(ApiResponse::success)
}

// Helper to map request to Order model
async fn map_request_to_order(
    _state: &AppState, 
    payload: &CreateOrderRequest, 
    order_id: String,
    outlet_id: ObjectId
) -> AppResult<Order> {
    
    let cashier_oid = if let Some(cid) = &payload.cashier_id {
        Some(ObjectId::parse_str(cid).map_err(|_| AppError::BadRequest("Invalid Cashier ID".to_string()))?)
    } else {
        None
    };

    let device_oid = if let Some(did) = &payload.device_id {
        Some(ObjectId::parse_str(did).map_err(|_| AppError::BadRequest("Invalid Device ID".to_string()))?)
    } else {
        None
    };

    let user_name = payload.user.clone().unwrap_or_else(|| "Guest".to_string());
    
    // Simplified Items Mapping (Usually would involve looking up menu items)
    // For this migration, providing an empty list if not parsed strictly, 
    // but in real world we need to convert payload.items -> Vec<OrderItem>
    let items = Vec::new(); 

    Ok(Order {
        order_id,
        user: user_name,
        user_id: payload.customer_id.as_ref().and_then(|id| ObjectId::parse_str(id).ok()),
        cashier_id: cashier_oid,
        device_id: device_oid,
        outlet: Some(outlet_id),
        source: payload.source.clone(),
        order_type: payload.order_type.clone().unwrap_or_else(|| "Dine-In".to_string()),
        table_number: payload.table_number.clone(),
        items,
        status: "Pending".to_string(),
        total_before_discount: 0.0,
        total_after_discount: 0.0,
        grand_total: 0.0,
        created_at_wib: Utc::now().into(),
        updated_at_wib: Utc::now().into(),
        ..Default::default()
    })
}

async fn process_cashier_order(
    state: &Arc<AppState>,
    payload: &CreateOrderRequest,
    order_id: &String,
) -> AppResult<Value> {
    let outlet_oid = ObjectId::parse_str(&payload.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid Outlet ID".to_string()))?;
    
    // Process order items through service
    let process_result = state.order_service.process_order_items(crate::services::order_service::ProcessOrderItemsRequest {
        items: payload.items.clone().unwrap_or_default(),
        outlet: outlet_oid,
        order_type: payload.order_type.clone().unwrap_or_else(|| "Dine-In".to_string()),
        voucher_code: payload.voucher_code.clone(),
        customer_type: payload.customer_type.clone(),
        source: payload.source.clone(),
        customer_id: payload.customer_id.as_ref().and_then(|id| ObjectId::parse_str(id).ok()),
        loyalty_points_to_redeem: payload.loyalty_points_to_redeem,
        custom_amount_items: payload.custom_amount_items.clone(),
    }).await?;

    // Map to Order model
    let mut order = map_request_to_order(state, payload, order_id.clone(), outlet_oid).await?;
    
    // Update order with processed data
    order.items = process_result.order_items;
    order.custom_amount_items = process_result.custom_amount_items;
    order.total_before_discount = process_result.totals.before_discount;
    order.total_after_discount = process_result.totals.after_discount;
    order.total_tax = process_result.totals.total_tax;
    order.total_service_fee = process_result.totals.total_service_fee;
    order.grand_total = process_result.totals.grand_total;
    order.status = "Completed".to_string(); // Cashier orders are typically completed immediately
    
    // Save to database
    state.order_repo.create(order.clone()).await?;

    Ok(json!({
        "order": order,
        "loyalty": process_result.loyalty,
        "promotions": process_result.promotions
    }))
}
