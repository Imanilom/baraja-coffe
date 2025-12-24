use axum::{
    extract::{State, Json},
    response::IntoResponse,
};
use std::sync::Arc;
use mongodb::bson::doc;
use serde::Deserialize;
use serde_json::json;

use crate::AppState;
use crate::error::{AppResult, ApiResponse};

// ============================================
// WEBHOOK HANDLERS
// ============================================

#[derive(Debug, Deserialize)]
pub struct MidtransWebhookPayload {
    pub order_id: String,
    pub transaction_status: String,
    pub fraud_status: Option<String>,
    pub transaction_id: Option<String>,
    pub gross_amount: Option<String>,
    pub payment_type: Option<String>,
}

/// Handle Midtrans payment webhook
pub async fn midtrans_webhook(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<MidtransWebhookPayload>,
) -> AppResult<impl IntoResponse> {
    tracing::info!(
        "📥 Midtrans webhook received: order={}, status={}",
        payload.order_id,
        payload.transaction_status
    );

    // TODO: Verify webhook signature
    // let server_key = &state.config.midtrans_server_key;
    // verify_signature(payload, server_key)?;

    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let payment_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("payments");

    // Update order based on transaction status
    match payload.transaction_status.as_str() {
        "capture" | "settlement" => {
            // Payment successful
            order_collection
                .update_one(
                    doc! { "orderId": &payload.order_id },
                    doc! { "$set": {
                        "paymentStatus": "paid",
                        "status": "Completed",
                        "paidAt": chrono::Utc::now()
                    }},
                    None,
                )
                .await?;

            // Create payment record
            let payment_doc = doc! {
                "orderId": &payload.order_id,
                "transactionId": payload.transaction_id.clone().unwrap_or_default(),
                "amount": payload.gross_amount.clone().unwrap_or_default().parse::<f64>().unwrap_or(0.0),
                "method": "Midtrans",
                "paymentType": payload.payment_type.clone().unwrap_or_default(),
                "status": &payload.transaction_status,
                "fraudStatus": payload.fraud_status.clone().unwrap_or_default(),
                "createdAt": chrono::Utc::now()
            };

            payment_collection.insert_one(payment_doc, None).await?;

            tracing::info!("✅ Payment successful for order: {}", payload.order_id);
        }
        "pending" => {
            order_collection
                .update_one(
                    doc! { "orderId": &payload.order_id },
                    doc! { "$set": {
                        "paymentStatus": "pending"
                    }},
                    None,
                )
                .await?;

            tracing::info!("⏳ Payment pending for order: {}", payload.order_id);
        }
        "deny" | "cancel" | "expire" => {
            order_collection
                .update_one(
                    doc! { "orderId": &payload.order_id },
                    doc! { "$set": {
                        "paymentStatus": "failed",
                        "status": "Cancelled"
                    }},
                    None,
                )
                .await?;

            tracing::warn!("❌ Payment failed for order: {}", payload.order_id);
        }
        _ => {
            tracing::warn!("⚠️ Unknown transaction status: {}", payload.transaction_status);
        }
    }

    Ok(ApiResponse::success(json!({
        "message": "Webhook processed",
        "orderId": payload.order_id
    })))
}

/// Verify Midtrans webhook signature
fn verify_signature(
    _payload: &MidtransWebhookPayload,
    _server_key: &str,
) -> AppResult<()> {
    // TODO: Implement signature verification
    // SHA512(order_id + status_code + gross_amount + server_key)
    Ok(())
}
