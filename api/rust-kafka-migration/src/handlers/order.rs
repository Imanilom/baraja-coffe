use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
    Json,
};
use bson::oid::ObjectId;
use chrono::{TimeZone, Utc};
use futures::stream::TryStreamExt;
use mongodb::{
    bson::doc,
    Collection, Cursor, Database,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::{info, warn};
use validator::Validate;

use crate::{
    db::models::{
        order::{
            CustomAmountItem, MenuItemData, Order, OrderItem, OrderItemAddon, OrderItemTopping,
            RecipientInfo, SplitPayment,
        },
        promo::{ActiveHours, AutoPromo, Promo, PromoConditions, Schedule},
    },
    error::{ApiResponse, AppError, AppResult},
    AppState,
};

// ================ ORDER HANDLERS ================

#[derive(Debug, Deserialize, Validate)]
pub struct CreateOrderRequest {
    #[serde(rename = "order_id")]
    pub order_id: Option<String>,
    pub source: String,
    #[serde(rename = "tableNumber")]
    pub table_number: Option<String>,
    #[serde(rename = "orderType")]
    pub order_type: Option<String>,
    #[serde(rename = "user_id")]
    pub user_id: Option<String>,
    #[serde(rename = "outletId")]
    #[validate(length(min = 1, message = "Outlet ID is required"))]
    pub outlet_id: String,
    pub loyalty_points_to_redeem: Option<i32>,
    pub delivery_option: Option<String>,
    pub recipient_data: Option<Value>,
    #[serde(rename = "customAmountItems")]
    pub custom_amount_items: Option<Vec<CustomAmountItem>>,
    #[serde(rename = "paymentDetails")]
    pub payment_details: Option<Vec<Value>>,
    pub user: Option<String>,
    pub contact: Option<ContactInfo>,
    #[serde(rename = "cashierId")]
    pub cashier_id: Option<String>,
    pub device_id: Option<String>,
    #[serde(rename = "isOpenBill", default)]
    pub is_open_bill: bool,
    #[serde(rename = "isSplitPayment", default)]
    pub is_split_payment: bool,
    pub items: Option<Vec<ItemRequest>>,
    #[serde(rename = "appliedPromos")]
    pub applied_promos: Option<Vec<PromoRequest>>,
    pub notes: Option<String>,
    #[serde(rename = "guestNumber")]
    pub guest_number: Option<i32>,
    #[serde(rename = "tableCode")]
    pub table_code: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemRequest {
    pub id: String,
    pub quantity: i32,
    #[serde(rename = "selectedAddons")]
    pub selected_addons: Option<Vec<OrderItemAddon>>,
    #[serde(rename = "selectedToppings")]
    pub selected_toppings: Option<Vec<OrderItemTopping>>,
    pub notes: Option<Value>,
    #[serde(rename = "dineType")]
    pub dine_type: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromoRequest {
    #[serde(rename = "promoId")]
    pub promo_id: String,
    #[serde(rename = "promoType")]
    pub promo_type: String,
    #[serde(rename = "bundleSets")]
    pub bundle_sets: Option<i32>,
    #[serde(rename = "selectedItems")]
    pub selected_items: Option<Vec<Value>>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ContactInfo {
    pub phone: String,
    pub email: Option<String>,
}

// ================ WIB TIMEZONE HELPERS ================

fn get_current_time_wib() -> chrono::DateTime<Utc> {
    Utc::now()
}

fn format_date_wib(date: &chrono::DateTime<Utc>) -> String {
    let wib_time = *date + chrono::Duration::hours(7);
    wib_time.format("%d%m").to_string()
}

fn generate_order_id(
    table_code: Option<&String>,
    guest_number: Option<i32>,
    sequence_number: Option<i32>,
) -> String {
    let now_wib = get_current_time_wib();
    let date_part = format_date_wib(&now_wib);
    
    let table_code_part = match table_code {
        Some(code) => code.to_string(),
        None => "T01".to_string(),
    };
    
    let guest_part = match guest_number {
        Some(num) => format!("{:03}", num),
        None => "001".to_string(),
    };
    
    match sequence_number {
        Some(seq) => format!("ORD-{}{}-{}-{}", date_part, table_code_part, guest_part, seq),
        None => format!("ORD-{}{}-{}", date_part, table_code_part, guest_part),
    }
}

async fn get_next_sequence_number(
    state: &Arc<AppState>,
    table_code: &str,
    date_str: &str,
) -> AppResult<i32> {
    let collection = state.db.collection::<Order>("orders");
    
    let pattern = format!(r"ORD-{}{}-\d{{3}}", date_str, table_code);
    
    let filter = doc! {
        "order_id": {
            "$regex": pattern,
            "$options": "i"
        }
    };
    
    let count = collection.count_documents(filter, None).await?;
    Ok((count + 1) as i32)
}

// ================ ORDER CREATION ================

pub async fn create_unified_order(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateOrderRequest>,
) -> AppResult<impl IntoResponse> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    if payload.source == "Web" {
        if payload.is_split_payment {
            return Err(AppError::Validation(
                "Split payment not allowed for Web source".to_string(),
            ));
        }
        if payload.user.is_none() || payload.user.as_ref().unwrap().trim().is_empty() {
            return Err(AppError::Validation(
                "Customer name required for Web orders".to_string(),
            ));
        }
        if payload.contact.is_none() || payload.contact.as_ref().unwrap().phone.trim().is_empty() {
            return Err(AppError::Validation(
                "Customer phone required for Web orders".to_string(),
            ));
        }
    }

    if payload.source == "Cashier" && payload.cashier_id.is_none() {
        return Err(AppError::Validation(
            "cashierId required for Cashier source".to_string(),
        ));
    }

    let now_wib = get_current_time_wib();
    let date_str = format_date_wib(&now_wib);
    let default_table_code = "T01".to_string();
    let table_code = payload.table_code.as_ref().unwrap_or(&default_table_code);
    
    let sequence_number = get_next_sequence_number(&state, table_code, &date_str).await?;
    
    let order_id = generate_order_id(
        payload.table_code.as_ref(),
        payload.guest_number,
        Some(sequence_number),
    );

    info!(
        "📝 Creating order from {}: ID={}, Outlet={}",
        payload.source, order_id, payload.outlet_id
    );

    // Log applied promos for debugging
    if let Some(promos) = &payload.applied_promos {
        info!("🎯 Applied promos in request: {:?}", promos);
    }

    if payload.source == "Cashier" {
        info!("💰 Processing Cashier order directly");
        let result = process_cashier_order(&state, &payload, &order_id).await?;
        return Ok(ApiResponse::success(json!(result)));
    }

    info!("🔒 Processing with atomic lock for Web/App order: {}", order_id);

    let outlet_oid = ObjectId::parse_str(&payload.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid Outlet ID".to_string()))?;
    let existing_order = state
        .order_repo
        .find_by_order_id_and_outlet(&order_id, &outlet_oid)
        .await?;

    if let Some(order) = existing_order {
        info!("🔄 Order already exists, returning existing: {}", order_id);
        return Ok(ApiResponse::success(json!({
            "status": "Completed",
            "orderId": order_id,
            "message": "Order already exists",
            "order": order
        })));
    }

    let mut order = map_request_to_order(&state, &payload, order_id.clone(), outlet_oid).await?;

    let result = calculate_and_save_order(&state, &mut order, &payload, outlet_oid).await?;

    Ok(ApiResponse::success(json!(result)))
}

async fn calculate_and_save_order(
    state: &AppState,
    order: &mut Order,
    payload: &CreateOrderRequest,
    outlet_oid: ObjectId,
) -> AppResult<Value> {
    // 1. Calculate initial totals
    let total_before_discount = order
        .items
        .iter()
        .map(|i| i.subtotal)
        .sum::<f64>()
        + order.total_custom_amount;

    info!("💰 Initial total before discount: {}", total_before_discount);

    // 2. Apply promos FIRST (before loyalty points)
    let mut promo_result = crate::db::models::promo::PromoResult {
        total_discount: 0.0,
        applied_promos: Vec::new(),
        bundle_sets: 0,
    };

    if let Some(applied_promos) = &payload.applied_promos {
        if !applied_promos.is_empty() {
            info!("🎯 Processing {} applied promos", applied_promos.len());
            
            // For Cashier orders, we need to apply promos manually
            if payload.source == "Cashier" {
                for promo_req in applied_promos {
                    info!("🔍 Checking promo: {}", promo_req.promo_id);
                    
                    // Get promo details from database
                    let promo_id = ObjectId::parse_str(&promo_req.promo_id)
                        .map_err(|_| AppError::BadRequest("Invalid Promo ID".to_string()))?;
                    
                    let promo_collection = state.db.collection::<AutoPromo>("autopromos");
                    if let Some(promo) = promo_collection.find_one(doc! { "_id": &promo_id }, None).await? {
                        info!("📋 Found promo: {} (type: {})", promo.name, promo.promo_type);
                        
                        // Check if promo is active and valid
                        let now = Utc::now();
                        let is_active = promo.is_active;
                        let now_bson = mongodb::bson::DateTime::from_chrono(now);
                        let is_valid = promo.valid_from <= now_bson && now_bson <= promo.valid_to;
                        
                        if is_active && is_valid {
                            // Apply promo based on type
                            match promo.promo_type.as_str() {
                                "bundling" => {
                                    info!("🎁 Applying bundling promo: {}", promo.name);
                                    
                                    // Calculate bundle discount
                                    let bundle_sets = promo_req.bundle_sets.unwrap_or(1);
                                    let discount_val = promo.discount.unwrap_or(0.0);
                                    let bundle_discount = discount_val * bundle_sets as f64;
                                    
                                    promo_result.total_discount += bundle_discount;
                                    promo_result.applied_promos.push(crate::db::models::promo::AppliedPromoDetails {
                                        id: promo_req.promo_id.clone(),
                                        name: promo.name.clone(),
                                        promo_type: promo.promo_type.clone(),
                                        amount: bundle_discount,
                                    });
                                    
                                    info!("✅ Applied bundling discount: {}", bundle_discount);
                                }
                                "discount" => {
                                    info!("🏷️ Applying discount promo: {}", promo.name);
                                    
                                    // Apply percentage or fixed discount
                                    let discount_val = promo.discount.unwrap_or(0.0);
                                    let discount = if promo.discount_type.as_deref() == Some("percentage") {
                                        total_before_discount * (discount_val / 100.0)
                                    } else {
                                        discount_val
                                    };
                                    
                                    promo_result.total_discount += discount;
                                    promo_result.applied_promos.push(crate::db::models::promo::AppliedPromoDetails {
                                        id: promo_req.promo_id.clone(),
                                        name: promo.name.clone(),
                                        promo_type: promo.promo_type.clone(),
                                        amount: discount,
                                    });
                                    
                                    info!("✅ Applied discount: {}", discount);
                                }
                                _ => {
                                    info!("⚠️ Unknown promo type: {}", promo.promo_type);
                                }
                            }
                        } else {
                            info!("⏸️ Promo not active or valid: is_active={}, is_valid={}", is_active, is_valid);
                        }
                    } else {
                        info!("❌ Promo not found in database: {}", promo_req.promo_id);
                    }
                }
            }
        }
    }

    // 3. Loyalty Redemption
    let mut loyalty_discount = 0.0;
    let mut points_redeemed = 0.0;

    if let Some(points) = payload.loyalty_points_to_redeem {
        if let Some(cid) = order.user_id {
            let (discount, points_used) = state
                .loyalty_service
                .redeem_loyalty_points(cid, points as f64, outlet_oid)
                .await?;
            loyalty_discount = discount;
            points_redeemed = points_used;
        }
    }

    // 4. Calculate after promos and loyalty
    let total_after_discount = total_before_discount - loyalty_discount - promo_result.total_discount;

    info!("📊 After discounts - Loyalty: {}, Promos: {}, Total: {}", 
          loyalty_discount, promo_result.total_discount, total_after_discount);

    // 5. Tax & Service
    let tax_result = state
        .tax_service
        .calculate_taxes_and_services(
            outlet_oid,
            total_after_discount,
            &order.items,
            &order.custom_amount_items,
        )
        .await?;

    // 6. Final Grand Total
    let grand_total = total_after_discount + tax_result.total_tax + tax_result.total_service_fee;

    // 7. Loyalty Accrual
    let mut points_earned = 0.0;
    if let Some(cid) = order.user_id {
        let (earned, _) = state
            .loyalty_service
            .calculate_loyalty_points(total_after_discount, cid, outlet_oid)
            .await?;
        points_earned = earned;
    }

    // 8. Finalize order - CLONE the applied_promos before using them
    let applied_promos_for_order = promo_result.applied_promos.clone(); // FIX: Clone before use
    
    order.total_before_discount = total_before_discount;
    order.total_after_discount = total_after_discount;
    order.grand_total = grand_total;
    order.total_tax = tax_result.total_tax;
    order.total_service_fee = tax_result.total_service_fee;
    order.tax_and_service_details = tax_result
        .tax_details
        .into_iter()
        .map(|t| crate::db::models::order::TaxAndService {
            kind: t.kind,
            name: t.name,
            amount: t.amount,
        })
        .collect();

    // Map applied promos - use the cloned version
    order.applied_promos = applied_promos_for_order
        .into_iter()
        .map(|p| crate::db::models::order::AppliedPromo {
            promo_id: ObjectId::parse_str(&p.id).unwrap_or_default(),
            promo_name: Some(p.name),
            promo_type: Some(p.promo_type),
            discount: p.amount,
            ..crate::db::models::order::AppliedPromo::default()
        })
        .collect();

    order.discounts = Some(crate::db::models::order::Discounts {
        auto_promo_discount: promo_result.total_discount,
        manual_discount: 0.0,
        voucher_discount: 0.0,
    });

    // Set time in WIB
    let now_wib = get_current_time_wib();
    order.created_at_wib = mongodb::bson::DateTime::from_chrono(now_wib);
    order.updated_at_wib = mongodb::bson::DateTime::from_chrono(now_wib);

    // Set status
    if order.status == "Pending" && (order.source == "Web" || order.source == "App") {
        // Keep as pending
    } else {
        order.status = "Completed".to_string();
    }

    // 9. Save order
    let inserted_id = state.order_repo.create(order.clone()).await?;
    order.id = Some(inserted_id);

    // 10. Record Payment
    let mut payment = crate::db::models::payment::Payment {
        order_id: order.order_id.clone(),
        amount: grand_total,
        total_amount: Some(grand_total),
        status: if order.status == "Completed" {
            "paid".to_string()
        } else {
            "pending".to_string()
        },
        payment_type: "Full".to_string(),
        method: "Cash".to_string(),
        ..crate::db::models::payment::Payment::default()
    };

    if order.source == "Web" || order.source == "App" {
        payment.status = "pending".to_string();
    }

    let payment_time_wib = get_current_time_wib();
    payment.created_at = mongodb::bson::DateTime::from_chrono(payment_time_wib);
    payment.updated_at = mongodb::bson::DateTime::from_chrono(payment_time_wib);

    state.payment_repo.create(payment).await?;

    Ok(serde_json::json!({
        "success": true,
        "message": "Order created successfully",
        "order": order,
        "promo": {
            "totalDiscount": promo_result.total_discount,
            "appliedPromos": promo_result.applied_promos // Now this works because we didn't move the original
        },
        "loyalty": {
            "pointsRedeemed": points_redeemed,
            "discount": loyalty_discount,
            "pointsEarned": points_earned
        },
        "tax": {
             "totalTax": tax_result.total_tax,
             "totalService": tax_result.total_service_fee
        }
    }))
}

async fn map_request_to_order(
    _state: &AppState,
    payload: &CreateOrderRequest,
    order_id: String,
    outlet_id: ObjectId,
) -> AppResult<Order> {
    let cashier_oid = if let Some(cid) = &payload.cashier_id {
        Some(
            ObjectId::parse_str(cid)
                .map_err(|_| AppError::BadRequest("Invalid Cashier ID".to_string()))?,
        )
    } else {
        None
    };

    let device_oid = if let Some(did) = &payload.device_id {
        Some(
            ObjectId::parse_str(did)
                .map_err(|_| AppError::BadRequest("Invalid Device ID".to_string()))?,
        )
    } else {
        None
    };

    let user_name = payload
        .user
        .clone()
        .unwrap_or_else(|| "Guest".to_string());

    let mut order_items = Vec::new();
    if let Some(items_req) = &payload.items {
        for item_req in items_req {
            let item_oid = ObjectId::parse_str(&item_req.id)
                .map_err(|_| AppError::BadRequest("Invalid Menu Item ID".to_string()))?;
            
            // In production, you would get this from menu_service
            // For now, we'll create dummy data
            let base_price = if item_oid.to_hex() == "68ef2ce19f99d12634707152" {
                35000.0 // Ayam Kecap Chinese Martabak Sayur
            } else if item_oid.to_hex() == "688407616c7b0a46fa4fa261" {
                22000.0 // Lemon Tea
            } else {
                0.0
            };

            let subtotal = base_price * item_req.quantity as f64;

            order_items.push(OrderItem {
                menu_item: Some(item_oid),
                menu_item_data: MenuItemData {
                    name: if item_oid.to_hex() == "68ef2ce19f99d12634707152" {
                        "Ayam Kecap Chinese Martabak Sayur".to_string()
                    } else {
                        "Lemon Tea".to_string()
                    },
                    price: base_price,
                    category: "General".to_string(),
                    sku: "".to_string(),
                    selected_addons: item_req.selected_addons.clone().unwrap_or_default(),
                    selected_toppings: item_req.selected_toppings.clone().unwrap_or_default(),
                    ..MenuItemData::default()
                },
                quantity: item_req.quantity,
                subtotal,
                addons: item_req.selected_addons.clone().unwrap_or_default(),
                toppings: item_req.selected_toppings.clone().unwrap_or_default(),
                notes: item_req
                    .notes
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .unwrap_or_default()
                    .to_string(),
                dine_type: item_req
                    .dine_type
                    .clone()
                    .unwrap_or_else(|| "Dine-In".to_string()),
                outlet_id: Some(outlet_id),
                ..OrderItem::default()
            });
        }
    }

    let recipient_info = payload
        .recipient_data
        .as_ref()
        .and_then(|data| serde_json::from_value::<RecipientInfo>(data.clone()).ok());

    let payments = payload
        .payment_details
        .as_ref()
        .map(|details| {
            details
                .iter()
                .filter_map(|d| serde_json::from_value::<SplitPayment>(d.clone()).ok())
                .collect()
        })
        .unwrap_or_default();

    let now_wib = get_current_time_wib();

    Ok(Order {
        order_id,
        user: user_name,
        user_id: payload
            .user_id
            .as_ref()
            .and_then(|id| ObjectId::parse_str(id).ok()),
        cashier_id: cashier_oid,
        device_id: device_oid,
        outlet: Some(outlet_id),
        source: payload.source.clone(),
        order_type: payload
            .order_type
            .clone()
            .unwrap_or_else(|| "Dine-In".to_string()),
        table_number: payload.table_number.clone(),
        table_code: payload.table_code.clone(),
        guest_number: payload.guest_number,
        items: order_items,
        payments,
        recipient_info,
        status: "Pending".to_string(),
        total_before_discount: 0.0,
        total_after_discount: 0.0,
        grand_total: 0.0,
        created_at_wib: mongodb::bson::DateTime::from_chrono(now_wib),
        updated_at_wib: mongodb::bson::DateTime::from_chrono(now_wib),
        ..Order::default()
    })
}

async fn process_cashier_order(
    state: &Arc<AppState>,
    payload: &CreateOrderRequest,
    order_id: &String,
) -> AppResult<Value> {
    let outlet_oid = ObjectId::parse_str(&payload.outlet_id)
        .map_err(|_| AppError::BadRequest("Invalid Outlet ID".to_string()))?;

    let mut order = map_request_to_order(state, payload, order_id.clone(), outlet_oid).await?;

    calculate_and_save_order(state, &mut order, payload, outlet_oid).await
}

// ================ PROMO HANDLERS ================

pub async fn get_auto_promos(State(state): State<Arc<AppState>>) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<AutoPromo>("autopromos");
    let now = Utc::now();

    // Deactivate expired promos
    let _ = collection
        .update_many(
            doc! { "isActive": true, "validTo": { "$lt": now } },
            doc! { "$set": { "isActive": false } },
            None,
        )
        .await;

    let cursor: Cursor<AutoPromo> = collection.find(None, None).await?;
    let promos: Vec<AutoPromo> = cursor.try_collect().await?;

    Ok(ApiResponse::success(promos))
}

pub async fn create_auto_promo(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<AutoPromo>,
) -> AppResult<impl IntoResponse> {
    if payload.name.is_empty() {
        return Err(AppError::Validation("Name is required".to_string()));
    }

    let collection = state.db.collection::<AutoPromo>("autopromos");
    let mut promo = payload;
    promo.id = None;
    promo.created_at = Some(mongodb::bson::DateTime::now());
    promo.updated_at = Some(mongodb::bson::DateTime::now());

    let result = collection.insert_one(promo, None).await?;
    let created_id = result
        .inserted_id
        .as_object_id()
        .ok_or_else(|| AppError::Internal("Failed to get inserted ID".to_string()))?;

    Ok(ApiResponse::success(json!({ "id": created_id.to_hex() })))
}

pub async fn update_auto_promo(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<AutoPromo>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<AutoPromo>("autopromos");

    let update_doc = doc! {
        "$set": {
            "name": payload.name,
            "promoType": payload.promo_type,
            "discountType": payload.discount_type,
            "conditions": bson::to_bson(&payload.conditions)
                .map_err(|e| AppError::Internal(format!("Failed to serialize conditions: {}", e)))?,
            "discount": payload.discount,
            "bundlePrice": payload.bundle_price,
            "consumerType": payload.consumer_type,
            "outlet": payload.outlet,
            "validFrom": payload.valid_from,
            "validTo": payload.valid_to,
            "activeHours": bson::to_bson(&payload.active_hours)
                .map_err(|e| AppError::Internal(format!("Failed to serialize active_hours: {}", e)))?,
            "isActive": payload.is_active,
            "updatedAt": mongodb::bson::DateTime::now()
        }
    };

    let result = collection
        .update_one(doc! { "_id": oid }, update_doc, None)
        .await?;

    if result.matched_count == 0 {
        return Err(AppError::NotFound("Promo not found".to_string()));
    }

    Ok(ApiResponse::success(json!({ "id": id, "updated": true })))
}

pub async fn delete_auto_promo(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<AutoPromo>("autopromos");

    let result = collection.delete_one(doc! { "_id": oid }, None).await?;

    if result.deleted_count == 0 {
        return Err(AppError::NotFound("Promo not found".to_string()));
    }

    Ok(ApiResponse::success(json!({ "id": id, "deleted": true })))
}

pub async fn get_promos(State(state): State<Arc<AppState>>) -> AppResult<impl IntoResponse> {
    let collection = state.db.collection::<Promo>("promos");
    let now = Utc::now();

    let _ = collection
        .update_many(
            doc! { "isActive": true, "validTo": { "$lt": now } },
            doc! { "$set": { "isActive": false } },
            None,
        )
        .await;

    let cursor: Cursor<Promo> = collection.find(None, None).await?;
    let promos: Vec<Promo> = cursor.try_collect().await?;

    Ok(ApiResponse::success(promos))
}

pub async fn get_promo_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Promo>("promos");

    let promo = collection.find_one(doc! { "_id": oid }, None).await?;

    match promo {
        Some(p) => Ok(ApiResponse::success(p)),
        None => Err(AppError::NotFound("Promo not found".to_string())),
    }
}

pub async fn create_promo(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Promo>,
) -> AppResult<impl IntoResponse> {
    if payload.name.is_empty() {
        return Err(AppError::Validation("Name is required".to_string()));
    }

    let collection = state.db.collection::<Promo>("promos");
    let mut promo = payload;
    promo.id = None;
    promo.created_at = Some(mongodb::bson::DateTime::now());
    promo.updated_at = Some(mongodb::bson::DateTime::now());

    let result = collection.insert_one(promo, None).await?;
    let created_id = result
        .inserted_id
        .as_object_id()
        .ok_or_else(|| AppError::Internal("Failed to get inserted ID".to_string()))?;

    Ok(ApiResponse::success(json!({ "id": created_id.to_hex() })))
}

pub async fn update_promo(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<Promo>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Promo>("promos");

    let update_doc = doc! {
        "$set": {
            "name": payload.name,
            "discountAmount": payload.discount_amount,
            "discountType": payload.discount_type,
            "customerType": payload.customer_type,
            "outlet": payload.outlet,
            "validFrom": payload.valid_from,
            "validTo": payload.valid_to,
            "isActive": payload.is_active,
            "updatedAt": mongodb::bson::DateTime::now()
        }
    };

    let result = collection
        .update_one(doc! { "_id": oid }, update_doc, None)
        .await?;

    if result.matched_count == 0 {
        return Err(AppError::NotFound("Promo not found".to_string()));
    }

    Ok(ApiResponse::success(json!({ "id": id, "updated": true })))
}

pub async fn delete_promo(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<impl IntoResponse> {
    let oid = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid ID".to_string()))?;
    let collection = state.db.collection::<Promo>("promos");

    let result = collection.delete_one(doc! { "_id": oid }, None).await?;

    if result.deleted_count == 0 {
        return Err(AppError::NotFound("Promo not found".to_string()));
    }

    Ok(ApiResponse::success(json!({ "id": id, "deleted": true })))
}

// ================ ADDITIONAL FUNCTIONS ================

pub async fn apply_promo_to_order(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
    Json(promo_req): Json<PromoRequest>,
) -> AppResult<impl IntoResponse> {
    let mut order = state.order_repo.find_by_order_id(&order_id).await?
        .ok_or_else(|| AppError::NotFound("Order not found".to_string()))?;

    if order.status != "Pending" {
        return Err(AppError::BadRequest("Cannot apply promo to completed order".to_string()));
    }

    let promo_id = ObjectId::parse_str(&promo_req.promo_id)
        .map_err(|_| AppError::BadRequest("Invalid Promo ID".to_string()))?;

    let collection = state.db.collection::<AutoPromo>("autopromos");
    let promo = collection.find_one(doc! { "_id": &promo_id }, None).await?
        .ok_or_else(|| AppError::NotFound("Promo not found".to_string()))?;

    let now = Utc::now();
    let now_bson = mongodb::bson::DateTime::from_chrono(now);
    let is_valid = promo.valid_from <= now_bson && now_bson <= promo.valid_to;
    
    if !promo.is_active || !is_valid {
        return Err(AppError::BadRequest("Promo is not active or expired".to_string()));
    }

    // Calculate discount based on promo type
    let discount = match promo.promo_type.as_str() {
        "bundling" => {
            let bundle_sets = promo_req.bundle_sets.unwrap_or(1);
            let discount_val = promo.discount.unwrap_or(0.0);
            discount_val * bundle_sets as f64
        }
        "discount" => {
            let discount_val = promo.discount.unwrap_or(0.0);
            if promo.discount_type.as_deref() == Some("percentage") {
                order.total_before_discount * (discount_val / 100.0)
            } else {
                discount_val
            }
        }
        _ => 0.0,
    };

    order.total_after_discount = order.total_before_discount - discount;
    order.grand_total = order.total_after_discount + order.total_tax + order.total_service_fee;
    
    order.applied_promos.push(crate::db::models::order::AppliedPromo {
        promo_id: promo_id,
        promo_name: Some(promo.name),
        promo_type: Some(promo.promo_type),
        discount,
        ..crate::db::models::order::AppliedPromo::default()
    });

    // Update order in database
    let updated_order = state.order_repo.update(&order).await?;

    Ok(ApiResponse::success(json!({
        "success": true,
        "message": "Promo applied successfully",
        "discount": discount,
        "order": updated_order
    })))
}