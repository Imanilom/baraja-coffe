use axum::{
    extract::{State, Query},
    response::IntoResponse,
};
use std::sync::Arc;
use mongodb::bson::{doc, oid::ObjectId, DateTime as BsonDateTime};
use serde::Deserialize;
use serde_json::json;
use chrono::{Utc, NaiveDate};

use crate::AppState;
use crate::error::{AppResult, AppError, ApiResponse};

#[derive(Debug, Deserialize)]
pub struct ProfitLossQuery {
    #[serde(rename = "startDate")]
    pub start_date: String,
    
    #[serde(rename = "endDate")]
    pub end_date: String,
    
    #[serde(rename = "outletId", skip_serializing_if = "Option::is_none")]
    pub outlet_id: Option<String>,
    
    #[serde(rename = "groupBy", skip_serializing_if = "Option::is_none")]
    pub group_by: Option<String>,
}

/// Get profit & loss report
pub async fn get_profit_loss_report(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ProfitLossQuery>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let start = NaiveDate::parse_from_str(&query.start_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid start date format".to_string()))?
        .and_hms_opt(0, 0, 0)
        .ok_or_else(|| AppError::BadRequest("Invalid start date".to_string()))?
        .and_utc();
    
    let end = NaiveDate::parse_from_str(&query.end_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid end date format".to_string()))?
        .and_hms_opt(23, 59, 59)
        .ok_or_else(|| AppError::BadRequest("Invalid end date".to_string()))?
        .and_utc();
    
    let mut match_conditions = doc! {
        "createdAt": {
            "$gte": BsonDateTime::from_millis(start.timestamp_millis()),
            "$lte": BsonDateTime::from_millis(end.timestamp_millis())
        },
        "status": "Completed"
    };
    
    if let Some(outlet_id) = &query.outlet_id {
        let outlet_oid = ObjectId::parse_str(outlet_id)
            .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;
        match_conditions.insert("outlet", outlet_oid);
    }
    
    // P&L aggregation pipeline
    let pipeline = vec![
        doc! { "$match": match_conditions },
        doc! {
            "$addFields": {
                "estimatedCost": { "$multiply": ["$totalBeforeDiscount", 0.4] },
                "totalDiscounts": {
                    "$add": [
                        { "$ifNull": ["$discounts.autoPromoDiscount", 0.0] },
                        { "$ifNull": ["$discounts.manualDiscount", 0.0] },
                        { "$ifNull": ["$discounts.voucherDiscount", 0.0] }
                    ]
                },
                "netRevenue": {
                    "$add": [
                        "$totalAfterDiscount",
                        { "$ifNull": ["$totalTax", 0.0] },
                        { "$ifNull": ["$totalServiceFee", 0.0] }
                    ]
                },
                "grossProfit": {
                    "$subtract": ["$totalAfterDiscount", { "$multiply": ["$totalBeforeDiscount", 0.4] }]
                },
                "netProfit": {
                    "$subtract": [
                        {
                            "$add": [
                                "$totalAfterDiscount",
                                { "$ifNull": ["$totalTax", 0.0] },
                                { "$ifNull": ["$totalServiceFee", 0.0] }
                            ]
                        },
                        { "$multiply": ["$totalBeforeDiscount", 0.4] }
                    ]
                }
            }
        },
        doc! {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$createdAt"
                    }
                },
                "totalOrders": { "$sum": 1 },
                "totalRevenueBeforeDiscount": { "$sum": "$totalBeforeDiscount" },
                "totalRevenueAfterDiscount": { "$sum": "$totalAfterDiscount" },
                "totalDiscounts": { "$sum": "$totalDiscounts" },
                "totalTax": { "$sum": { "$ifNull": ["$totalTax", 0.0] } },
                "totalServiceFee": { "$sum": { "$ifNull": ["$totalServiceFee", 0.0] } },
                "totalNetRevenue": { "$sum": "$netRevenue" },
                "totalEstimatedCost": { "$sum": "$estimatedCost" },
                "totalGrossProfit": { "$sum": "$grossProfit" },
                "totalNetProfit": { "$sum": "$netProfit" },
                "avgOrderValue": { "$avg": "$grandTotal" }
            }
        },
        doc! {
            "$addFields": {
                "period": "$_id",
                "grossProfitMargin": {
                    "$cond": {
                        "if": { "$eq": ["$totalRevenueAfterDiscount", 0.0] },
                        "then": 0.0,
                        "else": {
                            "$multiply": [
                                { "$divide": ["$totalGrossProfit", "$totalRevenueAfterDiscount"] },
                                100.0
                            ]
                        }
                    }
                },
                "netProfitMargin": {
                    "$cond": {
                        "if": { "$eq": ["$totalRevenueAfterDiscount", 0.0] },
                        "then": 0.0,
                        "else": {
                            "$multiply": [
                                { "$divide": ["$totalNetProfit", "$totalRevenueAfterDiscount"] },
                                100.0
                            ]
                        }
                    }
                }
            }
        },
        doc! { "$sort": { "period": 1 } }
    ];
    
    let mut cursor = order_collection.aggregate(pipeline, None).await
        .map_err(|e| AppError::Database(e.to_string()))?;
    
    let mut period_breakdown = Vec::new();
    let mut overall_summary = json!({
        "totalOrders": 0,
        "totalRevenueBeforeDiscount": 0.0,
        "totalRevenueAfterDiscount": 0.0,
        "totalDiscounts": 0.0,
        "totalTax": 0.0,
        "totalServiceFee": 0.0,
        "totalNetRevenue": 0.0,
        "totalEstimatedCost": 0.0,
        "totalGrossProfit": 0.0,
        "totalNetProfit": 0.0,
        "grossProfitMargin": 0.0,
        "netProfitMargin": 0.0,
        "avgOrderValue": 0.0
    });
    
    while cursor.advance().await.map_err(|e| AppError::Database(e.to_string()))? {
        let doc = cursor.deserialize_current()
            .map_err(|e| AppError::Database(e.to_string()))?;
        
        let period_data = json!({
            "period": doc.get_str("period").unwrap_or(""),
            "summary": {
                "totalOrders": doc.get_i32("totalOrders").unwrap_or(0),
                "totalRevenueBeforeDiscount": doc.get_f64("totalRevenueBeforeDiscount").unwrap_or(0.0),
                "totalRevenueAfterDiscount": doc.get_f64("totalRevenueAfterDiscount").unwrap_or(0.0),
                "totalDiscounts": doc.get_f64("totalDiscounts").unwrap_or(0.0),
                "totalTax": doc.get_f64("totalTax").unwrap_or(0.0),
                "totalServiceFee": doc.get_f64("totalServiceFee").unwrap_or(0.0),
                "totalNetRevenue": doc.get_f64("totalNetRevenue").unwrap_or(0.0),
                "totalEstimatedCost": doc.get_f64("totalEstimatedCost").unwrap_or(0.0),
                "totalGrossProfit": doc.get_f64("totalGrossProfit").unwrap_or(0.0),
                "totalNetProfit": doc.get_f64("totalNetProfit").unwrap_or(0.0),
                "grossProfitMargin": doc.get_f64("grossProfitMargin").unwrap_or(0.0),
                "netProfitMargin": doc.get_f64("netProfitMargin").unwrap_or(0.0),
                "avgOrderValue": doc.get_f64("avgOrderValue").unwrap_or(0.0)
            }
        });
        
        // Accumulate overall summary
        if let Some(obj) = overall_summary.as_object_mut() {
            obj["totalOrders"] = json!(obj["totalOrders"].as_i64().unwrap_or(0) + doc.get_i32("totalOrders").unwrap_or(0) as i64);
            obj["totalRevenueBeforeDiscount"] = json!(obj["totalRevenueBeforeDiscount"].as_f64().unwrap_or(0.0) + doc.get_f64("totalRevenueBeforeDiscount").unwrap_or(0.0));
            obj["totalRevenueAfterDiscount"] = json!(obj["totalRevenueAfterDiscount"].as_f64().unwrap_or(0.0) + doc.get_f64("totalRevenueAfterDiscount").unwrap_or(0.0));
            obj["totalDiscounts"] = json!(obj["totalDiscounts"].as_f64().unwrap_or(0.0) + doc.get_f64("totalDiscounts").unwrap_or(0.0));
            obj["totalNetProfit"] = json!(obj["totalNetProfit"].as_f64().unwrap_or(0.0) + doc.get_f64("totalNetProfit").unwrap_or(0.0));
        }
        
        period_breakdown.push(period_data);
    }
    
    // Calculate overall margins
    if let Some(obj) = overall_summary.as_object_mut() {
        let total_revenue = obj["totalRevenueAfterDiscount"].as_f64().unwrap_or(0.0);
        if total_revenue > 0.0 {
            let net_profit = obj["totalNetProfit"].as_f64().unwrap_or(0.0);
            obj["netProfitMargin"] = json!((net_profit / total_revenue) * 100.0);
        }
    }
    
    Ok(ApiResponse::success(json!({
        "period": {
            "start": query.start_date,
            "end": query.end_date
        },
        "overallSummary": overall_summary,
        "periodBreakdown": period_breakdown
    })))
}

/// Get discount usage report
pub async fn get_discount_usage_report(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ProfitLossQuery>,
) -> AppResult<impl IntoResponse> {
    let order_collection: mongodb::Collection<mongodb::bson::Document> = 
        state.db.collection("orders");
    
    let start = NaiveDate::parse_from_str(&query.start_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid start date format".to_string()))?
        .and_hms_opt(0, 0, 0)
        .ok_or_else(|| AppError::BadRequest("Invalid start date".to_string()))?
        .and_utc();
    
    let end = NaiveDate::parse_from_str(&query.end_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid end date format".to_string()))?
        .and_hms_opt(23, 59, 59)
        .ok_or_else(|| AppError::BadRequest("Invalid end date".to_string()))?
        .and_utc();
    
    let mut match_conditions = doc! {
        "createdAt": {
            "$gte": BsonDateTime::from_millis(start.timestamp_millis()),
            "$lte": BsonDateTime::from_millis(end.timestamp_millis())
        },
        "status": "Completed"
    };
    
    if let Some(outlet_id) = &query.outlet_id {
        let outlet_oid = ObjectId::parse_str(outlet_id)
            .map_err(|_| AppError::BadRequest("Invalid outlet ID".to_string()))?;
        match_conditions.insert("outlet", outlet_oid);
    }
    
    let pipeline = vec![
        doc! { "$match": match_conditions },
        doc! {
            "$addFields": {
                "totalDiscount": {
                    "$add": [
                        { "$ifNull": ["$discounts.autoPromoDiscount", 0.0] },
                        { "$ifNull": ["$discounts.manualDiscount", 0.0] },
                        { "$ifNull": ["$discounts.voucherDiscount", 0.0] }
                    ]
                },
                "hasDiscount": {
                    "$gt": [{
                        "$add": [
                            { "$ifNull": ["$discounts.autoPromoDiscount", 0.0] },
                            { "$ifNull": ["$discounts.manualDiscount", 0.0] },
                            { "$ifNull": ["$discounts.voucherDiscount", 0.0] }
                        ]
                    }, 0.0]
                }
            }
        },
        doc! {
            "$group": {
                "_id": null,
                "totalOrders": { "$sum": 1 },
                "ordersWithDiscount": {
                    "$sum": { "$cond": ["$hasDiscount", 1, 0] }
                },
                "totalDiscountAmount": { "$sum": "$totalDiscount" },
                "autoPromoDiscount": { "$sum": { "$ifNull": ["$discounts.autoPromoDiscount", 0.0] } },
                "manualDiscount": { "$sum": { "$ifNull": ["$discounts.manualDiscount", 0.0] } },
                "voucherDiscount": { "$sum": { "$ifNull": ["$discounts.voucherDiscount", 0.0] } },
                "totalRevenueBeforeDiscount": { "$sum": "$totalBeforeDiscount" },
                "avgDiscountPerOrder": { "$avg": "$totalDiscount" }
            }
        }
    ];
    
    let mut cursor = order_collection.aggregate(pipeline, None).await
        .map_err(|e| AppError::Database(e.to_string()))?;
    
    let result = if cursor.advance().await.map_err(|e| AppError::Database(e.to_string()))? {
        let doc = cursor.deserialize_current()
            .map_err(|e| AppError::Database(e.to_string()))?;
        
        let total_orders = doc.get_i32("totalOrders").unwrap_or(0);
        let orders_with_discount = doc.get_i32("ordersWithDiscount").unwrap_or(0);
        let total_discount = doc.get_f64("totalDiscountAmount").unwrap_or(0.0);
        let auto_promo = doc.get_f64("autoPromoDiscount").unwrap_or(0.0);
        let manual = doc.get_f64("manualDiscount").unwrap_or(0.0);
        let voucher = doc.get_f64("voucherDiscount").unwrap_or(0.0);
        
        json!({
            "summary": {
                "totalOrders": total_orders,
                "ordersWithDiscount": orders_with_discount,
                "totalDiscountAmount": total_discount,
                "discountPenetrationRate": if total_orders > 0 {
                    (orders_with_discount as f64 / total_orders as f64) * 100.0
                } else { 0.0 },
                "avgDiscountPerOrder": doc.get_f64("avgDiscountPerOrder").unwrap_or(0.0)
            },
            "breakdown": {
                "autoPromo": {
                    "totalAmount": auto_promo,
                    "percentageOfTotalDiscount": if total_discount > 0.0 {
                        (auto_promo / total_discount) * 100.0
                    } else { 0.0 }
                },
                "manual": {
                    "totalAmount": manual,
                    "percentageOfTotalDiscount": if total_discount > 0.0 {
                        (manual / total_discount) * 100.0
                    } else { 0.0 }
                },
                "voucher": {
                    "totalAmount": voucher,
                    "percentageOfTotalDiscount": if total_discount > 0.0 {
                        (voucher / total_discount) * 100.0
                    } else { 0.0 }
                }
            }
        })
    } else {
        json!({
            "summary": {
                "totalOrders": 0,
                "ordersWithDiscount": 0,
                "totalDiscountAmount": 0.0,
                "discountPenetrationRate": 0.0,
                "avgDiscountPerOrder": 0.0
            },
            "breakdown": {
                "autoPromo": { "totalAmount": 0.0, "percentageOfTotalDiscount": 0.0 },
                "manual": { "totalAmount": 0.0, "percentageOfTotalDiscount": 0.0 },
                "voucher": { "totalAmount": 0.0, "percentageOfTotalDiscount": 0.0 }
            }
        })
    };
    
    Ok(ApiResponse::success(result))
}
