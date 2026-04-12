use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use bson::{doc, oid::ObjectId, Document};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info, warn};

use crate::{
    error::{AppError, AppResult},
    utils::lock::LockUtil,
    AppState,
};

// ============================================================================
// MIDTRANS WEBHOOK
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct MidtransWebhookPayload {
    pub transaction_status: String,
    pub order_id: String,
    pub fraud_status: Option<String>,
    pub payment_type: Option<String>,
    pub gross_amount: Option<String>,
    pub transaction_time: Option<String>,
    pub settlement_time: Option<String>,
    pub signature_key: Option<String>,
    pub merchant_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WebhookResponse {
    pub status: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub order_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub order_type: Option<String>,
}

pub async fn midtrans_webhook(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<MidtransWebhookPayload>,
) -> AppResult<Json<WebhookResponse>> {
    let request_id: String = format!("{:x}", rand::random::<u32>());
    
    info!(
        "[WEBHOOK {}] Received Midtrans notification: order_id={}, status={}, fraud_status={:?}",
        request_id, payload.order_id, payload.transaction_status, payload.fraud_status
    );

    // Validate required fields
    if payload.order_id.is_empty() || payload.transaction_status.is_empty() {
        warn!("[WEBHOOK {}] Invalid notification: Missing required fields", request_id);
        return Err(AppError::BadRequest("Missing required fields".into()));
    }

    let db = state.db.database();
    let payment_coll = db.collection::<Document>("payments");
    let order_coll = db.collection::<Document>("orders");

    // Use lock util from state
    let lock_util = &state.lock_util;
    let lock_key = payload.order_id.clone();
    let owner = format!("webhook-{}", std::process::id());

    // Process webhook with lock
    let result = lock_util.with_lock(
        &lock_key,
        &owner,
        60000, // 60 seconds TTL
        5,     // max retries
        200,   // retry delay ms
        || async {
            // Find payment record with multiple criteria
            let payment_filter = doc! {
                "$or": [
                    { "order_id": &payload.order_id },
                    { "payment_code": &payload.order_id },
                    { "transaction_id": &payload.order_id }
                ]
            };

            let existing_payment = payment_coll.find_one(payment_filter.clone(), None).await
                .map_err(|e| AppError::Database(e))?;

            let existing_payment = existing_payment.ok_or_else(|| {
                error!("[WEBHOOK {}] Payment record not found for: {}", request_id, payload.order_id);
                AppError::NotFound("Payment record not found".into())
            })?;

            info!(
                "[WEBHOOK {}] Processing webhook for payment: payment_code={:?}, order_id={:?}",
                request_id,
                existing_payment.get_str("payment_code").ok(),
                existing_payment.get_str("order_id").ok()
            );

            // Prepare payment update
            let gross_amount = payload.gross_amount.as_ref()
                .and_then(|s| s.parse::<f64>().ok())
                .or_else(|| existing_payment.get_f64("amount").ok())
                .unwrap_or(0.0);

            let paid_at = if matches!(payload.transaction_status.as_str(), "settlement" | "capture") {
                Some(Utc::now())
            } else {
                existing_payment.get_datetime("paidAt").ok().map(|dt| dt.to_chrono())
            };

            let mut update_doc = doc! {
                "$set": {
                    "status": &payload.transaction_status,
                    "gross_amount": gross_amount,
                    "updatedAt": Utc::now(),
                }
            };

            if let Some(fraud_status) = &payload.fraud_status {
                update_doc.get_document_mut("$set").unwrap().insert("fraud_status", fraud_status);
            }
            if let Some(payment_type) = &payload.payment_type {
                update_doc.get_document_mut("$set").unwrap().insert("payment_type", payment_type);
            }
            if let Some(transaction_time) = &payload.transaction_time {
                update_doc.get_document_mut("$set").unwrap().insert("transaction_time", transaction_time);
            }
            if let Some(settlement_time) = &payload.settlement_time {
                update_doc.get_document_mut("$set").unwrap().insert("settlement_time", settlement_time);
            }
            if let Some(signature_key) = &payload.signature_key {
                update_doc.get_document_mut("$set").unwrap().insert("signature_key", signature_key);
            }
            if let Some(merchant_id) = &payload.merchant_id {
                update_doc.get_document_mut("$set").unwrap().insert("merchant_id", merchant_id);
            }
            if let Some(paid_at) = paid_at {
                update_doc.get_document_mut("$set").unwrap().insert("paidAt", paid_at);
            }

            // Update payment record
            let updated_payment = payment_coll.find_one_and_update(
                payment_filter,
                update_doc,
                None,
            ).await.map_err(|e| AppError::Database(e))?;

            let updated_payment = updated_payment.ok_or_else(|| {
                error!("[WEBHOOK {}] Failed to update payment for: {}", request_id, payload.order_id);
                AppError::Internal("Payment update failed".into())
            })?;

            info!("[WEBHOOK {}] Payment record updated successfully", request_id);

            // Get order_id from payment record
            let target_order_id = updated_payment.get_str("order_id")
                .map_err(|_| AppError::Internal("Invalid payment record".into()))?;

            // Find and update order
            let order_filter = doc! { "order_id": target_order_id };
            let order = order_coll.find_one(order_filter.clone(), None).await
                .map_err(|e| AppError::Database(e))?;

            let order = order.ok_or_else(|| {
                warn!("[WEBHOOK {}] Order with ID {} not found", request_id, target_order_id);
                AppError::NotFound("Order not found".into())
            })?;

            let order_type = order.get_str("orderType").unwrap_or("Unknown");
            let payment_type_from_payment = updated_payment.get_str("paymentType").ok();

            info!(
                "[WEBHOOK {}] Order found: order_id={}, order_type={}, status={}, payment_status={:?}",
                request_id, target_order_id, order_type,
                order.get_str("status").unwrap_or("Unknown"),
                order.get_str("paymentStatus").ok()
            );

            // Determine order update based on transaction status
            let mut order_update = doc! {};
            let mut should_update_order = false;

            match payload.transaction_status.as_str() {
                "capture" | "settlement" => {
                    if payload.fraud_status.as_deref() == Some("accept") {
                        // Handle reservation vs regular order
                        if order_type == "Reservation" && payment_type_from_payment == Some("Down Payment") {
                            order_update = doc! {
                                "$set": {
                                    "paymentStatus": "Paid",
                                    "status": "Confirmed"
                                }
                            };
                            info!("[WEBHOOK {}] Down Payment successful for reservation order {}", request_id, target_order_id);
                        } else {
                            let current_status = order.get_str("status").unwrap_or("Pending");
                            order_update = doc! {
                                "$set": {
                                    "paymentStatus": "Paid",
                                    "status": current_status
                                }
                            };
                            info!("[WEBHOOK {}] Payment successful for regular order {}", request_id, target_order_id);
                        }
                        should_update_order = true;
                    } else if payload.fraud_status.as_deref() == Some("challenge") {
                        order_update = doc! {
                            "$set": {
                                "paymentStatus": "Challenged"
                            }
                        };
                        should_update_order = true;
                        info!("[WEBHOOK {}] Payment challenged for order {}", request_id, target_order_id);
                    }
                }
                "deny" | "cancel" | "expire" => {
                    order_update = doc! {
                        "$set": {
                            "paymentStatus": "Failed",
                            "status": "Canceled"
                        }
                    };
                    should_update_order = true;
                    info!("[WEBHOOK {}] Payment failed for order {}: {}", request_id, target_order_id, payload.transaction_status);
                }
                "pending" => {
                    order_update = doc! {
                        "$set": {
                            "paymentStatus": "Pending"
                        }
                    };
                    should_update_order = true;
                    info!("[WEBHOOK {}] Payment pending for order {}", request_id, target_order_id);
                }
                _ => {
                    warn!("[WEBHOOK {}] Unhandled transaction status: {}", request_id, payload.transaction_status);
                }
            }

            // Update order if needed
            if should_update_order {
                order_coll.update_one(order_filter, order_update, None).await
                    .map_err(|e| AppError::Database(e))?;
                info!("[WEBHOOK {}] Order {} updated", request_id, target_order_id);
            }

            Ok::<_, AppError>((target_order_id.to_string(), order_type.to_string()))
        },
    ).await?;

    let (order_id, order_type) = result;

    info!("[WEBHOOK {}] Webhook processed successfully for {}", request_id, order_id);

    Ok(Json(WebhookResponse {
        status: "ok".to_string(),
        message: "Webhook processed successfully".to_string(),
        order_id: Some(order_id),
        transaction_status: Some(payload.transaction_status),
        order_type: Some(order_type),
    }))
}

// ============================================================================
// GOSEND WEBHOOK
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct GoSendWebhookPayload {
    pub booking_id: String,
    pub status: String,
    pub driver_name: Option<String>,
    pub driver_phone: Option<String>,
    pub driver_photo_url: Option<String>,
    pub live_tracking_url: Option<String>,
}

pub async fn gosend_webhook(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<GoSendWebhookPayload>,
) -> AppResult<Json<WebhookResponse>> {
    let request_id: String = format!("{:x}", rand::random::<u32>());

    info!(
        "[GOSEND WEBHOOK {}] Received GoSend webhook: booking_id={}, status={}",
        request_id, payload.booking_id, payload.status
    );

    // Validate X-Callback-Token
    let received_token = headers.get("x-callback-token")
        .and_then(|v| v.to_str().ok());
    
    let expected_token = std::env::var("GOSEND_WEBHOOK_SECRET").ok();

    if received_token.is_none() {
        warn!("[GOSEND WEBHOOK {}] X-Callback-Token header missing", request_id);
        return Err(AppError::Unauthorized("X-Callback-Token header required".into()));
    }

    if received_token != expected_token.as_deref() {
        warn!("[GOSEND WEBHOOK {}] Invalid X-Callback-Token received", request_id);
        return Err(AppError::Unauthorized("Invalid token".into()));
    }

    info!("[GOSEND WEBHOOK {}] X-Callback-Token validation passed", request_id);

    // Validate payload
    if payload.booking_id.is_empty() || payload.status.is_empty() {
        warn!("[GOSEND WEBHOOK {}] Incomplete webhook payload", request_id);
        // Still return 200 to GoSend
        return Ok(Json(WebhookResponse {
            status: "ok".to_string(),
            message: "Webhook received but missing required fields".to_string(),
            order_id: None,
            transaction_status: None,
            order_type: None,
        }));
    }

    let db = state.db.database();
    let gosend_coll = db.collection::<Document>("gosendbookings");
    let order_coll = db.collection::<Document>("orders");

    // Use lock util from state
    let lock_util = &state.lock_util;
    let lock_key = payload.booking_id.clone();
    let owner = format!("gosend-webhook-{}", std::process::id());

    // Process webhook with lock
    let result = lock_util.with_lock(
        &lock_key,
        &owner,
        45000, // 45 seconds TTL
        3,     // max retries
        150,   // retry delay ms
        || async {
            // Find GoSend booking
            let booking_filter = doc! { "goSend_order_no": &payload.booking_id };
            let booking = gosend_coll.find_one(booking_filter.clone(), None).await
                .map_err(|e| AppError::Database(e))?;

            let booking = booking.ok_or_else(|| {
                warn!("[GOSEND WEBHOOK {}] GoSend booking not found: {}", request_id, payload.booking_id);
                AppError::NotFound("Booking not found in system".into())
            })?;

            let order_id = booking.get_str("order_id")
                .map_err(|_| AppError::Internal("Invalid booking record".into()))?;

            info!("[GOSEND WEBHOOK {}] Found booking: {}", request_id, order_id);

            // Update GoSend booking record
            let mut update_doc = doc! {
                "$set": {
                    "status": &payload.status,
                }
            };

            if let Some(driver_name) = &payload.driver_name {
                update_doc.get_document_mut("$set").unwrap().insert("driver_info.driver_name", driver_name);
            }
            if let Some(driver_phone) = &payload.driver_phone {
                update_doc.get_document_mut("$set").unwrap().insert("driver_info.driver_phone", driver_phone);
            }
            if let Some(driver_photo_url) = &payload.driver_photo_url {
                update_doc.get_document_mut("$set").unwrap().insert("driver_info.driver_photo", driver_photo_url);
            }
            if let Some(live_tracking_url) = &payload.live_tracking_url {
                update_doc.get_document_mut("$set").unwrap().insert("live_tracking_url", live_tracking_url);
            }

            gosend_coll.update_one(booking_filter, update_doc, None).await
                .map_err(|e| AppError::Database(e))?;

            // Update order
            let mut order_update = doc! {
                "$set": {
                    "deliveryTracking.status": &payload.status,
                }
            };

            if let Some(driver_name) = &payload.driver_name {
                order_update.get_document_mut("$set").unwrap().insert("deliveryTracking.driver_name", driver_name);
            }
            if let Some(driver_phone) = &payload.driver_phone {
                order_update.get_document_mut("$set").unwrap().insert("deliveryTracking.driver_phone", driver_phone);
            }
            if let Some(live_tracking_url) = &payload.live_tracking_url {
                order_update.get_document_mut("$set").unwrap().insert("deliveryTracking.live_tracking_url", live_tracking_url);
            }

            // Map GoSend status to internal delivery status
            if let Some(delivery_status) = map_gosend_status(&payload.status) {
                order_update.get_document_mut("$set").unwrap().insert("deliveryStatus", delivery_status);
            }

            // If delivered, mark order as completed
            if payload.status == "delivered" {
                order_update.get_document_mut("$set").unwrap().insert("status", "completed");
            }

            let order_filter = doc! { "order_id": order_id };
            order_coll.update_one(order_filter, order_update, None).await
                .map_err(|e| AppError::Database(e))?;

            Ok::<_, AppError>(order_id.to_string())
        },
    ).await.unwrap_or_else(|e| {
        // Handle lock errors gracefully for GoSend
        error!("[GOSEND WEBHOOK {}] Error: {:?}", request_id, e);
        payload.booking_id.clone()
    });

    info!("[GOSEND WEBHOOK {}] Webhook processed successfully for {}", request_id, result);

    // Always return 200 to GoSend
    Ok(Json(WebhookResponse {
        status: "ok".to_string(),
        message: "Webhook processed successfully".to_string(),
        order_id: None,
        transaction_status: None,
        order_type: None,
    }))
}

// Helper function to map GoSend status
fn map_gosend_status(gosend_status: &str) -> Option<&'static str> {
    match gosend_status {
        "confirmed" => Some("pending"),
        "allocated" => Some("driver_assigned"),
        "out_for_pickup" => Some("pickup_started"),
        "picked" => Some("picked_up"),
        "out_for_delivery" => Some("on_delivery"),
        "on_hold" => Some("on_hold"),
        "delivered" => Some("delivered"),
        "cancelled" => Some("cancelled"),
        "rejected" | "no_driver" => Some("failed"),
        _ => None,
    }
}
