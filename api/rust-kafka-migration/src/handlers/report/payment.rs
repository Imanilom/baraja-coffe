use axum::{
    extract::{Query, State},
    Json,
};
use bson::{doc, Bson, Document};
use chrono::{DateTime, TimeZone, Utc};
use chrono_tz::Asia::Jakarta;
use futures::TryStreamExt;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::try_join;

use crate::{
    error::{AppError, AppResult},
    AppState,
};

#[derive(Deserialize)]
pub struct PaymentReportQuery {
    #[serde(rename = "startDate")]
    pub start_date: String,
    #[serde(rename = "endDate")]
    pub end_date: String,
    #[serde(rename = "outletId")]
    pub outlet_id: Option<String>,
    #[serde(rename = "groupBy")]
    pub group_by: Option<String>,
    #[serde(rename = "includeTax")]
    pub include_tax: Option<String>,
}

#[derive(Serialize)]
pub struct PaymentReportResponse {
    pub success: bool,
    pub data: PaymentReportData,
}

#[derive(Serialize)]
pub struct PaymentReportData {
    pub period: ReportPeriod,
    pub summary: ReportSummary,
    #[serde(rename = "paymentMethods")]
    pub payment_methods: Vec<PaymentMethodData>,
    #[serde(rename = "splitPaymentAnalysis")]
    pub split_payment_analysis: SplitPaymentAnalysis,
    #[serde(rename = "itemSales")]
    pub item_sales: Vec<ItemSalesData>,
    #[serde(rename = "periodBreakdown")]
    pub period_breakdown: Vec<PeriodBreakdownData>,
    #[serde(rename = "rawDataCount")]
    pub raw_data_count: i64,
}

#[derive(Serialize)]
pub struct ReportPeriod {
    #[serde(rename = "startDate")]
    pub start_date: String,
    #[serde(rename = "endDate")]
    pub end_date: String,
    pub timezone: String,
    #[serde(rename = "groupBy")]
    pub group_by: String,
    #[serde(rename = "includeTax")]
    pub include_tax: bool,
}

#[derive(Debug, serde::Serialize, Clone, Default)]
pub struct ReportSummary {
    #[serde(rename = "totalRevenue")]
    pub total_revenue: f64,
    #[serde(rename = "totalRevenueWithTax")]
    pub total_revenue_with_tax: f64,
    #[serde(rename = "totalRevenueWithoutTax")]
    pub total_revenue_without_tax: f64,
    #[serde(rename = "totalTax")]
    pub total_tax: f64,
    #[serde(rename = "totalServiceCharge")]
    pub total_service_charge: f64,
    #[serde(rename = "totalDiscount")]
    pub total_discount: f64,
    #[serde(rename = "totalTransactions")]
    pub total_transactions: i64,
    #[serde(rename = "totalOrders")]
    pub total_orders: i64,
    #[serde(rename = "totalItemsSold")]
    pub total_items_sold: i64,
    #[serde(rename = "averageTransaction")]
    pub average_transaction: f64,
    #[serde(rename = "splitPaymentOrders")]
    pub split_payment_orders: i64,
    #[serde(rename = "singlePaymentOrders")]
    pub single_payment_orders: i64,
}

#[derive(Serialize, Clone)]
pub struct PaymentMethodData {
    pub method: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    #[serde(rename = "originalMethod")]
    pub original_method: String,
    #[serde(rename = "totalAmount")]
    pub total_amount: f64,
    pub amount: f64,
    #[serde(rename = "transactionCount")]
    pub transaction_count: i64,
    pub count: i64,
    #[serde(rename = "orderCount")]
    pub order_count: i64,
    #[serde(rename = "splitPaymentCount")]
    pub split_payment_count: i64,
    #[serde(rename = "singlePaymentCount")]
    pub single_payment_count: i64,
    #[serde(rename = "averageTransaction")]
    pub average_transaction: f64,
    #[serde(rename = "percentageOfTotal")]
    pub percentage_of_total: f64,
    pub percentage: String,
}

#[derive(Serialize)]
pub struct SplitPaymentAnalysis {
    #[serde(rename = "totalSplitOrders")]
    pub total_split_orders: i64,
    #[serde(rename = "totalOrders")]
    pub total_orders: i64,
    #[serde(rename = "percentageOfTotalOrders")]
    pub percentage_of_total_orders: f64,
    #[serde(rename = "methodCombinations")]
    pub method_combinations: Vec<MethodCombination>,
}

#[derive(Serialize)]
pub struct MethodCombination {
    pub combination: String,
    pub count: i64,
    #[serde(rename = "totalAmount")]
    pub total_amount: f64,
    #[serde(rename = "averageAmount")]
    pub average_amount: f64,
    #[serde(rename = "averagePaymentCount")]
    pub average_payment_count: f64,
    #[serde(rename = "percentageOfSplitOrders")]
    pub percentage_of_split_orders: f64,
}

#[derive(Serialize)]
pub struct ItemSalesData {
    #[serde(rename = "itemId")]
    pub item_id: String,
    pub name: String,
    pub price: f64,
    #[serde(rename = "totalQuantity")]
    pub total_quantity: i64,
    #[serde(rename = "totalRevenue")]
    pub total_revenue: f64,
    #[serde(rename = "totalOrders")]
    pub total_orders: i64,
    #[serde(rename = "isActive")]
    pub is_active: bool,
    #[serde(rename = "averageQuantityPerOrder")]
    pub average_quantity_per_order: f64,
    #[serde(rename = "percentageOfTotalRevenue")]
    pub percentage_of_total_revenue: f64,
}

#[derive(Serialize)]
pub struct PeriodBreakdownData {
    pub period: String,
    #[serde(rename = "totalRevenue")]
    pub total_revenue: f64,
    #[serde(rename = "totalRevenueWithTax")]
    pub total_revenue_with_tax: f64,
    #[serde(rename = "totalRevenueWithoutTax")]
    pub total_revenue_without_tax: f64,
    #[serde(rename = "orderCount")]
    pub order_count: i64,
    #[serde(rename = "splitPaymentCount")]
    pub split_payment_count: i64,
    #[serde(rename = "totalItemsSold")]
    pub total_items_sold: i64,
    #[serde(rename = "paymentMethods")]
    pub payment_methods: Vec<PeriodPaymentMethod>,
}

#[derive(Serialize)]
pub struct PeriodPaymentMethod {
    pub method: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub amount: f64,
    pub count: i64,
    #[serde(rename = "splitPaymentCount")]
    pub split_payment_count: i64,
}


pub async fn generate_sales_report(
    State(state): State<Arc<AppState>>,
    Query(query): Query<PaymentReportQuery>,
) -> AppResult<Json<PaymentReportResponse>> {
    let db = &state.db.database();
    let order_coll = db.collection::<Document>("orders");

    let group_by = query.group_by.unwrap_or("daily".to_string());
    let should_include_tax = query.include_tax.unwrap_or("true".to_string()) == "true";

    // Parse dates
        let start_naive = chrono::NaiveDateTime::parse_from_str(&format!("{} 00:00:00", query.start_date), "%Y-%m-%d %H:%M:%S")
            .map_err(|_| AppError::BadRequest("Invalid start date format".into()))?;
        let end_naive = chrono::NaiveDateTime::parse_from_str(&format!("{} 23:59:59.999", query.end_date), "%Y-%m-%d %H:%M:%S%.f")
            .map_err(|_| AppError::BadRequest("Invalid end date format".into()))?;
        
        use chrono::TimeZone;
        let start_dt = Jakarta.from_local_datetime(&start_naive)
            .earliest()
            .ok_or_else(|| AppError::BadRequest("Invalid start date format or timezone conversion failed".into()))?;
        let end_dt = Jakarta.from_local_datetime(&end_naive)
            .latest()
            .ok_or_else(|| AppError::BadRequest("Invalid end date format or timezone conversion failed".into()))?;

    if start_dt > end_dt {
         return Err(AppError::BadRequest("Start date cannot be after end date".into()));
    }

    let mut match_filter = doc! {
        "status": "Completed",
        "createdAt": {
            "$gte": start_dt.with_timezone(&Utc),
            "$lte": end_dt.with_timezone(&Utc)
        }
    };

    if let Some(outlet_id) = &query.outlet_id {
        if let Ok(oid) = bson::oid::ObjectId::parse_str(outlet_id) {
             match_filter.insert("outlet", oid);
        }
    }

    // 1. Summary Pipeline
    let summary_pipeline = vec![
        doc! { "$match": match_filter.clone() },
        doc! {
            "$group": {
                "_id": null,
                "totalSales": { "$sum": "$grandTotal" },
                "totalSalesWithoutTax": { "$sum": { "$ifNull": ["$totalAfterDiscount", "$grandTotal"] } },
                "totalTransactions": { "$sum": 1 },
                "totalTax": { "$sum": "$tax" },
                "totalServiceFee": { "$sum": "$serviceCharge" },
                "totalItems": { "$sum": { "$size": "$items" } },
                "avgOrderValue": { "$avg": "$grandTotal" },
                "avgOrderValueWithoutTax": { "$avg": { "$ifNull": ["$totalAfterDiscount", "$grandTotal"] } },
                "totalDiscount": { "$sum": "$discount" },
                "splitPaymentOrders": { "$sum": { "$cond": ["$isSplitPayment", 1, 0] } },
                "singlePaymentOrders": { "$sum": { "$cond": ["$isSplitPayment", 0, 1] } }
            }
        },
    ];

    // 2. Payment Breakdown Pipeline
    let payment_breakdown_pipeline = vec![
        doc! { "$match": match_filter.clone() },
        doc! {
            "$lookup": {
                "from": "payments",
                "localField": "order_id",
                "foreignField": "order_id",
                "as": "paymentRecords"
            }
        },
        doc! {
            "$addFields": {
                "mainPaymentMethod": {
                    "$let": {
                        "vars": {
                            "validPayments": {
                                "$filter": {
                                    "input": "$paymentRecords",
                                    "as": "payment",
                                    "cond": {
                                        "$and": [
                                            { "$in": ["$$payment.status", ["settlement", "paid", "partial"]] },
                                            { "$ne": ["$$payment.isAdjustment", true] }
                                        ]
                                    }
                                }
                            }
                        },
                        "in": {
                            "$arrayElemAt": [
                                {
                                    "$map": {
                                        "input": "$$validPayments",
                                        "as": "p",
                                        "in": "$$p.method_type"
                                    }
                                },
                                0
                            ]
                        }
                    }
                }
            }
        },
        doc! {
            "$match": {
                "mainPaymentMethod": { "$exists": true, "$ne": null }
            }
        },
        doc! {
            "$group": {
                "_id": "$order_id",
                "paymentMethod": { "$first": "$mainPaymentMethod" },
                "amountWithTax": { "$first": "$grandTotal" },
                "amountWithoutTax": { "$first": { "$ifNull": ["$totalAfterDiscount", "$grandTotal"] } },
                "isSplit": { "$first": "$isSplitPayment" }
            }
        },
        doc! {
            "$group": {
                "_id": "$paymentMethod",
                "totalAmountWithTax": { "$sum": "$amountWithTax" },
                "totalAmountWithoutTax": { "$sum": "$amountWithoutTax" },
                "transactionCount": { "$sum": 1 },
                "orderIds": { "$addToSet": "$_id" },
                "splitCount": { "$sum": { "$cond": ["$isSplit", 1, 0] } }
            }
        },
        doc! {
            "$project": {
                "_id": 1,
                "totalAmountWithTax": 1,
                "totalAmountWithoutTax": 1,
                "totalAmount": if should_include_tax { "$totalAmountWithTax" } else { "$totalAmountWithoutTax" },
                "transactionCount": 1,
                "orderCount": { "$size": "$orderIds" },
                "splitPaymentCount": "$splitCount",
                "singlePaymentCount": { "$subtract": ["$transactionCount", "$splitCount"] }
            }
        },
        doc! { "$sort": { "totalAmount": -1 } },
    ];

    // 3. Period Breakdown Pipeline
    let date_format = match group_by.as_str() {
        "monthly" => "%Y-%m",
        "weekly" => "%Y-W%V",
        _ => "%Y-%m-%d",
    };

    let period_breakdown_pipeline = vec![
        doc! { "$match": match_filter.clone() },
        doc! {
            "$lookup": {
                "from": "payments",
                "localField": "order_id",
                "foreignField": "order_id",
                "as": "payments"
            }
        },
        doc! {
            "$addFields": {
                "actualPaymentMethod": {
                    "$arrayElemAt": [
                        {
                            "$map": {
                                "input": {
                                    "$filter": {
                                        "input": "$payments",
                                        "as": "payment",
                                        "cond": { "$in": ["$$payment.status", ["settlement", "paid", "partial"]] }
                                    }
                                },
                                "as": "p",
                                "in": "$$p.method_type"
                            }
                        },
                        0
                    ]
                }
            }
        },
        doc! {
            "$group": {
                "_id": {
                    "period": {
                        "$dateToString": {
                            "format": date_format,
                            "date": "$createdAt",
                            "timezone": "Asia/Jakarta"
                        }
                    }
                },
                "totalRevenueWithTax": { "$sum": "$grandTotal" },
                "totalRevenueWithoutTax": { "$sum": { "$ifNull": ["$totalAfterDiscount", "$grandTotal"] } },
                "orderCount": { "$sum": 1 },
                "splitPaymentCount": { "$sum": { "$cond": ["$isSplitPayment", 1, 0] } },
                "totalItems": {
                    "$sum": {
                        "$reduce": {
                            "input": "$items",
                            "initialValue": 0,
                            "in": { "$add": ["$$value", { "$ifNull": ["$$this.quantity", 0] }] }
                        }
                    }
                },
                "paymentMethods": {
                    "$push": {
                        "method": "$actualPaymentMethod",
                        "amountWithTax": "$grandTotal",
                        "amountWithoutTax": { "$ifNull": ["$totalAfterDiscount", "$grandTotal"] },
                        "isSplit": "$isSplitPayment"
                    }
                }
            }
        },
        doc! { "$sort": { "_id.period": 1 } },
    ];

    // 4. Item Sales Pipeline
    let item_sales_pipeline = vec![
        doc! { "$match": match_filter.clone() },
        doc! { "$unwind": "$items" },
        doc! {
            "$lookup": {
                "from": "menuitems",
                "localField": "items.menuItem",
                "foreignField": "_id",
                "as": "menuData"
            }
        },
        doc! {
            "$group": {
                "_id": "$items.menuItem",
                "name": {
                    "$first": {
                        "$ifNull": [
                            { "$arrayElemAt": ["$menuData.name", 0] },
                            "Menu Item Deleted"
                        ]
                    }
                },
                "price": {
                    "$first": {
                        "$ifNull": [
                            "$items.price",
                            { "$arrayElemAt": ["$menuData.price", 0] }
                        ]
                    }
                },
                "totalQuantity": { "$sum": { "$ifNull": ["$items.quantity", 0] } },
                "totalRevenue": {
                    "$sum": {
                        "$multiply": [
                            { "$ifNull": ["$items.quantity", 0] },
                            { "$ifNull": ["$items.price", { "$arrayElemAt": ["$menuData.price", 0] }] }
                        ]
                    }
                },
                "orderCount": { "$sum": 1 },
                "isActive": {
                    "$first": {
                        "$ifNull": [
                            { "$arrayElemAt": ["$menuData.isActive", 0] },
                            false
                        ]
                    }
                }
            }
        },
        doc! { "$sort": { "totalRevenue": -1 } },
        doc! { "$limit": 100 },
    ];

    // 5. Split Payment Analysis Pipeline
    let mut split_filter = match_filter.clone();
    split_filter.insert("isSplitPayment", true);

    let split_pipeline = vec![
        doc! { "$match": split_filter },
        doc! {
            "$lookup": {
                "from": "payments",
                "localField": "order_id",
                "foreignField": "order_id",
                "as": "payments"
            }
        },
        doc! {
            "$project": {
                "order_id": 1,
                "grandTotal": if should_include_tax { 
                    Bson::String("$grandTotal".to_string()) 
                } else { 
                    Bson::Document(doc! { "$ifNull": ["$totalAfterDiscount", "$grandTotal"] }) 
                },
                "paymentCount": { "$size": { "$ifNull": ["$payments", []] } },
                "paymentMethodsCombined": {
                    "$reduce": {
                        "input": {
                            "$map": {
                                "input": {
                                    "$filter": {
                                        "input": "$payments",
                                        "as": "p",
                                        "cond": { "$in": ["$$p.status", ["settlement", "paid", "partial"]] }
                                    }
                                },
                                "as": "payment",
                                "in": "$$payment.method_type"
                            }
                        },
                        "initialValue": "",
                        "in": {
                            "$concat": [
                                "$$value",
                                { "$cond": [{ "$eq": ["$$value", ""] }, "", " + "] },
                                "$$this"
                            ]
                        }
                    }
                }
            }
        },
        doc! {
            "$group": {
                "_id": "$paymentMethodsCombined",
                "count": { "$sum": 1 },
                "totalAmount": { "$sum": "$grandTotal" },
                "avgPaymentCount": { "$avg": "$paymentCount" }
            }
        },
        doc! { "$sort": { "count": -1 } },
        doc! { "$limit": 20 },
    ];

    // Execute in Parallel
    let summary_future = order_coll.aggregate(summary_pipeline, None);
    let payment_breakdown_future = order_coll.aggregate(payment_breakdown_pipeline, None);
    let period_breakdown_future = order_coll.aggregate(period_breakdown_pipeline, None);
    let item_sales_future = order_coll.aggregate(item_sales_pipeline, None);
    let split_analysis_future = order_coll.aggregate(split_pipeline, None);

    let (mut summary_cur, mut payment_cur, mut period_cur, mut item_cur, mut split_cur) = 
        try_join!(summary_future, payment_breakdown_future, period_breakdown_future, item_sales_future, split_analysis_future)
        .map_err(|e| AppError::Database(e))?;

    // Process Summary
    let summary_doc = summary_cur.try_next().await.map_err(|e| AppError::Database(e))?;
    let summary = if let Some(doc) = summary_doc {
        ReportSummary {
            total_revenue: if should_include_tax { doc.get_f64("totalSales").unwrap_or(0.0) } else { doc.get_f64("totalSalesWithoutTax").unwrap_or(0.0) },
            total_revenue_with_tax: doc.get_f64("totalSales").unwrap_or(0.0),
            total_revenue_without_tax: doc.get_f64("totalSalesWithoutTax").unwrap_or(0.0),
            total_tax: doc.get_f64("totalTax").unwrap_or(0.0),
            total_service_charge: doc.get_f64("totalServiceFee").unwrap_or(0.0),
            total_discount: doc.get_f64("totalDiscount").unwrap_or(0.0),
            total_transactions: doc.get_i64("totalTransactions").unwrap_or(doc.get_i32("totalTransactions").unwrap_or(0) as i64),
            total_orders: doc.get_i64("totalTransactions").unwrap_or(doc.get_i32("totalTransactions").unwrap_or(0) as i64),
            total_items_sold: doc.get_i64("totalItems").unwrap_or(doc.get_i32("totalItems").unwrap_or(0) as i64),
            average_transaction: if should_include_tax { doc.get_f64("avgOrderValue").unwrap_or(0.0).round() } else { doc.get_f64("avgOrderValueWithoutTax").unwrap_or(0.0).round() },
            split_payment_orders: doc.get_i64("splitPaymentOrders").unwrap_or(doc.get_i32("splitPaymentOrders").unwrap_or(0) as i64),
            single_payment_orders: doc.get_i64("singlePaymentOrders").unwrap_or(doc.get_i32("singlePaymentOrders").unwrap_or(0) as i64),
        }
    } else {
        ReportSummary::default()
    };

    // Process Payment Breakdown
    let mut payment_methods = Vec::new();
    let mut total_payment_amount = 0.0;
    while let Some(doc) = payment_cur.try_next().await.map_err(|e| AppError::Database(e))? {
        let amount = doc.get_f64("totalAmount").unwrap_or(0.0);
        total_payment_amount += amount;
        let count = doc.get_i64("transactionCount").unwrap_or(doc.get_i32("transactionCount").unwrap_or(0) as i64);
        
        payment_methods.push(PaymentMethodData {
            method: doc.get_str("_id").unwrap_or("Unknown").to_string(),
            display_name: doc.get_str("_id").unwrap_or("Unknown").to_string(),
            original_method: doc.get_str("_id").unwrap_or("Unknown").to_string(),
            total_amount: amount,
            amount: amount,
            transaction_count: count,
            count: count,
            order_count: doc.get_i64("orderCount").unwrap_or(doc.get_i32("orderCount").unwrap_or(0) as i64),
            split_payment_count: doc.get_i64("splitPaymentCount").unwrap_or(doc.get_i32("splitPaymentCount").unwrap_or(0) as i64),
            single_payment_count: doc.get_i64("singlePaymentCount").unwrap_or(doc.get_i32("singlePaymentCount").unwrap_or(0) as i64),
            average_transaction: if count > 0 { amount / count as f64 } else { 0.0 },
            percentage_of_total: 0.0, // Calculated later
            percentage: "0.00".to_string(),
        });
    }

    // Calculate percentages
    for pm in &mut payment_methods {
        if total_payment_amount > 0.0 {
            pm.percentage_of_total = (pm.total_amount / total_payment_amount) * 100.0;
            pm.percentage = format!("{:.2}", pm.percentage_of_total);
        }
    }

    // Process Period Breakdown
    let mut period_breakdown = Vec::new();
    while let Some(doc) = period_cur.try_next().await.map_err(|e| AppError::Database(e))? {
        let id_doc = doc.get_document("_id").unwrap();
        let period = id_doc.get_str("period").unwrap_or("").to_string();
        
        let total_revenue_with_tax = doc.get_f64("totalRevenueWithTax").unwrap_or(0.0);
        let total_revenue_without_tax = doc.get_f64("totalRevenueWithoutTax").unwrap_or(0.0);
        
        // Process payment methods array
        let payment_methods_array = doc.get_array("paymentMethods").ok();
        let mut method_map: HashMap<String, (f64, i64, i64)> = HashMap::new(); // amount, count, splitCount

        if let Some(arr) = payment_methods_array {
             for pm in arr {
                 if let Some(pm_doc) = pm.as_document() {
                     let method = pm_doc.get_str("method").unwrap_or("Unknown").to_string();
                     let amount_with_tax = pm_doc.get_f64("amountWithTax").unwrap_or(0.0);
                     let amount_without_tax = pm_doc.get_f64("amountWithoutTax").unwrap_or(0.0);
                     let is_split = pm_doc.get_bool("isSplit").unwrap_or(false);

                     let amount = if should_include_tax { amount_with_tax } else { amount_without_tax };

                     let entry = method_map.entry(method).or_insert((0.0, 0, 0));
                     entry.0 += amount;
                     entry.1 += 1;
                     if is_split { entry.2 += 1; }
                 }
             }
        }

        let mut payment_methods_vec: Vec<PeriodPaymentMethod> = method_map.into_iter().map(|(k, v)| {
            PeriodPaymentMethod {
                method: k.clone(),
                display_name: k,
                amount: v.0,
                count: v.1,
                split_payment_count: v.2,
            }
        }).collect();
        payment_methods_vec.sort_by(|a, b| b.amount.partial_cmp(&a.amount).unwrap());

        period_breakdown.push(PeriodBreakdownData {
            period,
            total_revenue: if should_include_tax { total_revenue_with_tax } else { total_revenue_without_tax },
            total_revenue_with_tax,
            total_revenue_without_tax,
            order_count: doc.get_i64("orderCount").unwrap_or(doc.get_i32("orderCount").unwrap_or(0) as i64),
            split_payment_count: doc.get_i64("splitPaymentCount").unwrap_or(doc.get_i32("splitPaymentCount").unwrap_or(0) as i64),
            total_items_sold: doc.get_i64("totalItems").unwrap_or(doc.get_i32("totalItems").unwrap_or(0) as i64),
            payment_methods: payment_methods_vec,
        });
    }

    // Process Item Sales
    let mut item_sales = Vec::new();
    while let Some(doc) = item_cur.try_next().await.map_err(|e| AppError::Database(e))? {
        let revenue = doc.get_f64("totalRevenue").unwrap_or(0.0);
        item_sales.push(ItemSalesData {
            item_id: doc.get_object_id("_id").map(|oid| oid.to_string()).unwrap_or_else(|_| "deleted".to_string()),
            name: doc.get_str("name").unwrap_or("Unknown").to_string(),
            price: doc.get_f64("price").unwrap_or(0.0),
            total_quantity: doc.get_i64("totalQuantity").unwrap_or(doc.get_i32("totalQuantity").unwrap_or(0) as i64),
            total_revenue: revenue,
            total_orders: doc.get_i64("orderCount").unwrap_or(doc.get_i32("orderCount").unwrap_or(0) as i64),
            is_active: doc.get_bool("isActive").unwrap_or(false),
            average_quantity_per_order: 0.0, // calculated later if needed or in map
            percentage_of_total_revenue: if summary.total_revenue_with_tax > 0.0 { (revenue / summary.total_revenue_with_tax) * 100.0 } else { 0.0 },
        });
    }

    // Update avg quantity
    for item in &mut item_sales {
        if item.total_orders > 0 {
             item.average_quantity_per_order = item.total_quantity as f64 / item.total_orders as f64;
        }
    }


    // Process Split Payment
    let mut combinations = Vec::new();
    while let Some(doc) = split_cur.try_next().await.map_err(|e| AppError::Database(e))? {
        let count = doc.get_i64("count").unwrap_or(doc.get_i32("count").unwrap_or(0) as i64);
        combinations.push(MethodCombination {
             combination: doc.get_str("_id").unwrap_or("Unknown").to_string(),
             count,
             total_amount: doc.get_f64("totalAmount").unwrap_or(0.0),
             average_amount: if count > 0 { doc.get_f64("totalAmount").unwrap_or(0.0) / count as f64 } else { 0.0 },
             average_payment_count: doc.get_f64("avgPaymentCount").unwrap_or(0.0),
             percentage_of_split_orders: if summary.split_payment_orders > 0 { (count as f64 / summary.split_payment_orders as f64) * 100.0 } else { 0.0 },
        });
    }

    // Extract values we need before moving summary
    let total_split_orders = summary.split_payment_orders;
    let total_orders = summary.total_orders;
    let raw_data_count = summary.total_transactions;

    Ok(Json(PaymentReportResponse {
        success: true,
        data: PaymentReportData {
             period: ReportPeriod {
                 start_date: query.start_date,
                 end_date: query.end_date,
                 timezone: "Asia/Jakarta".to_string(),
                 group_by: group_by,
                 include_tax: should_include_tax,
             },
             summary,
             payment_methods,
             split_payment_analysis: SplitPaymentAnalysis {
                 total_split_orders,
                 total_orders,
                 percentage_of_total_orders: if total_orders > 0 { (total_split_orders as f64 / total_orders as f64) * 100.0 } else { 0.0 },
                 method_combinations: combinations,
             },
             item_sales,
             period_breakdown,
             raw_data_count,
        }
    }))

}

// Helper to process period breakdown which requires manual processing of paymentMethods array
async fn period_breakdown_pipeline_process(
    mut cursor: mongodb::Cursor<Document>, 
    should_include_tax: bool
) -> AppResult<Option<PeriodBreakdownData>> {
    // In Rust, we need to iterate and stream. 
    // This helper logic is actually weird as written because I need to return All of them.
    // I refactored above to loop.
    // The complexity is that MongoDB returns an array of documents, and I need to map them.
    // The "map" logic in Node.js was doing client-side aggregation of the `paymentMethods` array from the group stage.
    Ok(None)
}

// Redefining loop
// We need to implement the client-side aggregation logic for `period_breakdown`
// Node Logic:
/*
      p.paymentMethods.forEach(pm => {
        const method = pm.method || 'Unknown';
        const amount = shouldIncludeTax ? pm.amountWithTax : pm.amountWithoutTax;
        ... map aggregation ...
      });
*/

async fn period_breakdown_pipeline_process_real(
    cursor: &mut mongodb::Cursor<Document>,
    should_include_tax: bool
) -> AppResult<Option<PeriodBreakdownData>> {
     if let Some(doc) = cursor.try_next().await.map_err(|e| AppError::Database(e))? {
        let id_doc = doc.get_document("_id").unwrap();
        let period = id_doc.get_str("period").unwrap_or("").to_string();
        
        let total_revenue_with_tax = doc.get_f64("totalRevenueWithTax").unwrap_or(0.0);
        let total_revenue_without_tax = doc.get_f64("totalRevenueWithoutTax").unwrap_or(0.0);
        
        // Process payment methods array
        let payment_methods_array = doc.get_array("paymentMethods").ok();
        let mut method_map: HashMap<String, (f64, i64, i64)> = HashMap::new(); // amount, count, splitCount

        if let Some(arr) = payment_methods_array {
             for pm in arr {
                 if let Some(pm_doc) = pm.as_document() {
                     let method = pm_doc.get_str("method").unwrap_or("Unknown").to_string();
                     let amount_with_tax = pm_doc.get_f64("amountWithTax").unwrap_or(0.0);
                     let amount_without_tax = pm_doc.get_f64("amountWithoutTax").unwrap_or(0.0);
                     let is_split = pm_doc.get_bool("isSplit").unwrap_or(false);

                     let amount = if should_include_tax { amount_with_tax } else { amount_without_tax };

                     let entry = method_map.entry(method).or_insert((0.0, 0, 0));
                     entry.0 += amount;
                     entry.1 += 1;
                     if is_split { entry.2 += 1; }
                 }
             }
        }

        let mut payment_methods_vec: Vec<PeriodPaymentMethod> = method_map.into_iter().map(|(k, v)| {
            PeriodPaymentMethod {
                method: k.clone(),
                display_name: k,
                amount: v.0,
                count: v.1,
                split_payment_count: v.2,
            }
        }).collect();
        payment_methods_vec.sort_by(|a, b| b.amount.partial_cmp(&a.amount).unwrap());

        Ok(Some(PeriodBreakdownData {
            period,
            total_revenue: if should_include_tax { total_revenue_with_tax } else { total_revenue_without_tax },
            total_revenue_with_tax,
            total_revenue_without_tax,
            order_count: doc.get_i64("orderCount").unwrap_or(doc.get_i32("orderCount").unwrap_or(0) as i64),
            split_payment_count: doc.get_i64("splitPaymentCount").unwrap_or(doc.get_i32("splitPaymentCount").unwrap_or(0) as i64),
            total_items_sold: doc.get_i64("totalItems").unwrap_or(doc.get_i32("totalItems").unwrap_or(0) as i64),
            payment_methods: payment_methods_vec,
        }))
     } else {
         Ok(None)
     }
}
