use axum::{
    extract::{Query, State},
    Json,
};
use bson::{doc, Bson, Document};
use chrono::{DateTime, Duration, TimeZone, Utc};
use chrono_tz::Asia::Jakarta;
use futures::TryStreamExt;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::try_join;

use crate::{
    error::{AppError, AppResult},
    AppState,
};

#[derive(Deserialize)]
pub struct DashboardQuery {
    #[serde(rename = "startDate")]
    pub start_date: String,
    #[serde(rename = "endDate")]
    pub end_date: String,
    pub outlet: Option<String>,
}

#[derive(Serialize)]
pub struct DashboardResponse {
    pub success: bool,
    pub data: DashboardData,
}

#[derive(Serialize)]
pub struct DashboardData {
    pub summary: SummaryData,
    pub products: ProductBreakdown,
    pub charts: ChartsData,
    pub metadata: Metadata,
}

#[derive(Serialize)]
pub struct SummaryData {
    pub current: PeriodStats,
    pub previous: PeriodStats,
    pub comparison: ComparisonData,
}

#[derive(Serialize, Default)]
pub struct PeriodStats {
    pub sales: f64,
    pub orders: i64,
    #[serde(rename = "avgOrderValue")]
    pub avg_order_value: f64,
}

#[derive(Serialize)]
pub struct ComparisonData {
    pub sales: ComparisonMetric,
    pub orders: ComparisonMetric,
}

#[derive(Serialize)]
pub struct ComparisonMetric {
    pub percentage: String,
    pub amount: f64,
    #[serde(rename = "isPositive")]
    pub is_positive: bool,
}

#[derive(Serialize)]
pub struct ProductBreakdown {
    pub all: Vec<ProductSummary>,
    #[serde(rename = "top10")]
    pub top_10: Vec<ProductSummary>,
    pub food: Vec<SimpleProduct>,
    pub drinks: Vec<SimpleProduct>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ProductSummary {
    #[serde(rename = "productName")]
    pub product_name: String,
    #[serde(rename = "mainCategory")]
    pub main_category: String,
    pub category: String,
    pub sku: String,
    pub quantity: i64,
    pub subtotal: f64,
    pub discount: f64,
    pub total: f64,
}

#[derive(Serialize)]
pub struct SimpleProduct {
    pub name: String,
    pub value: f64,
}

#[derive(Serialize)]
pub struct ChartsData {
    pub hourly: Vec<HourlyData>,
    #[serde(rename = "orderTypes")]
    pub order_types: Vec<OrderTypeData>,
    #[serde(rename = "salesByCategory")]
    pub sales_by_category: Vec<SalesByCategory>,
}

#[derive(Serialize, Clone)]
pub struct HourlyData {
    pub time: String,
    pub subtotal: f64,
}

#[derive(Serialize, Deserialize)]
pub struct OrderTypeData {
    #[serde(rename = "orderType")]
    pub order_type: String,
    pub subtotal: f64,
    #[serde(rename = "totalTransaction")]
    pub total_transaction: i64,
}

#[derive(Serialize)]
pub struct SalesByCategory {
    pub name: String,
    pub category: String,
    pub value: f64,
}

#[derive(Serialize)]
pub struct Metadata {
    #[serde(rename = "dateRange")]
    pub date_range: DateRange,
    #[serde(rename = "previousRange")]
    pub previous_range: PreviousRange,
    pub outlet: String,
    #[serde(rename = "totalProducts")]
    pub total_products: usize,
    #[serde(rename = "generatedAt")]
    pub generated_at: String,
}

#[derive(Serialize)]
pub struct DateRange {
    pub start: String,
    pub end: String,
}

#[derive(Serialize)]
pub struct PreviousRange {
    pub start: String,
    pub end: String,
}

#[derive(Serialize)]
pub struct QuickStatsResponse {
    pub success: bool,
    pub data: QuickStatsData,
}

#[derive(Serialize)]
pub struct QuickStatsData {
    pub sales: f64,
    pub orders: i64,
    #[serde(rename = "avgOrderValue")]
    pub avg_order_value: f64,
}

// Handler Implementation

pub async fn get_dashboard_data(
    State(state): State<Arc<AppState>>,
    Query(query): Query<DashboardQuery>,
) -> AppResult<Json<DashboardResponse>> {
    let db = &state.db.database();
    let order_coll = db.collection::<Document>("orders");

    // Parse dates
    let start_dt = Jakarta
        .datetime_from_str(&format!("{} 00:00:00", query.start_date), "%Y-%m-%d %H:%M:%S")
        .map_err(|_| AppError::BadRequest("Invalid start date format".into()))?;
    
    let end_dt = Jakarta
        .datetime_from_str(&format!("{} 23:59:59.999", query.end_date), "%Y-%m-%d %H:%M:%S%.f")
        .map_err(|_| AppError::BadRequest("Invalid end date format".into()))?;

    // Date range logic for previous period
    let diff = end_dt.signed_duration_since(start_dt);
    // JS: const prevEnd = new Date(start.getTime() - 1);
    let prev_end_dt = start_dt - Duration::milliseconds(1);
    // JS: const prevStart = new Date(prevEnd.getTime() - diffTime);
    let prev_start_dt = prev_end_dt - diff;

    // Build Match Filters
    let mut match_filter = doc! {
        "status": "Completed",
        "createdAt": {
            "$gte": start_dt.with_timezone(&Utc),
            "$lte": end_dt.with_timezone(&Utc)
        }
    };

    let mut prev_match_filter = doc! {
        "status": "Completed",
        "createdAt": {
            "$gte": prev_start_dt.with_timezone(&Utc),
            "$lte": prev_end_dt.with_timezone(&Utc)
        }
    };

    if let Some(outlet_id) = &query.outlet {
        if let Ok(oid) = bson::oid::ObjectId::parse_str(outlet_id) {
            match_filter.insert("outlet", oid);
            prev_match_filter.insert("outlet", oid);
        }
    }

    // Pipeline 1: Current Stats
    let current_stats_pipeline = vec![
        doc! { "$match": match_filter.clone() },
        doc! {
            "$group": {
                "_id": null,
                "totalSales": { "$sum": "$grandTotal" },
                "totalOrders": { "$sum": 1 },
                "avgOrderValue": { "$avg": "$grandTotal" }
            }
        },
    ];

    // Pipeline 2: Previous Stats
    let prev_stats_pipeline = vec![
        doc! { "$match": prev_match_filter },
        doc! {
            "$group": {
                "_id": null,
                "totalSales": { "$sum": "$grandTotal" },
                "totalOrders": { "$sum": 1 }
            }
        },
    ];

    // Pipeline 3: Product Summary
    let product_summary_pipeline = vec![
        doc! { "$match": match_filter.clone() },
        doc! { "$unwind": "$items" },
        doc! {
            "$lookup": {
                "from": "menuitems",
                "localField": "items.menuItem",
                "foreignField": "_id",
                "as": "menuItemData"
            }
        },
        doc! { "$unwind": { "path": "$menuItemData", "preserveNullAndEmptyArrays": true } },
        doc! {
            "$lookup": {
                "from": "categories",
                "localField": "menuItemData.category",
                "foreignField": "_id",
                "as": "categoryData"
            }
        },
        doc! { "$unwind": { "path": "$categoryData", "preserveNullAndEmptyArrays": true } },
        doc! {
            "$group": {
                "_id": {
                    "name": { "$ifNull": ["$menuItemData.name", "Unknown"] },
                    "mainCategory": { "$ifNull": ["$menuItemData.mainCategory", "Unknown"] },
                    "category": { "$ifNull": ["$categoryData.name", "Uncategorized"] },
                    "sku": { "$ifNull": ["$menuItemData.sku", "-"] }
                },
                "quantity": { "$sum": "$items.quantity" },
                "subtotal": { "$sum": "$items.subtotal" },
                "discount": { "$sum": { "$ifNull": ["$items.discount", 0] } }
            }
        },
        doc! {
            "$project": {
                "_id": 0,
                "productName": "$_id.name",
                "mainCategory": "$_id.mainCategory",
                "category": "$_id.category",
                "sku": "$_id.sku",
                "quantity": 1,
                "subtotal": 1,
                "discount": 1,
                "total": "$subtotal"
            }
        },
        doc! { "$sort": { "subtotal": -1 } },
    ];

    // Pipeline 4: Hourly Data
    // Note: $hour operator might return UTC hour unless timezone is specified.
    // Rust mongo driver sends queries to server, server handles timezone if supported.
    // MongoDB 5.0+ supports timezone in $hour.
    let hourly_pipeline = vec![
        doc! { "$match": match_filter.clone() },
        doc! {
            "$project": {
                "hour": { "$hour": { "date": "$createdAt", "timezone": "Asia/Jakarta" } },
                "grandTotal": 1
            }
        },
        doc! {
            "$group": {
                "_id": "$hour",
                "subtotal": { "$sum": "$grandTotal" }
            }
        },
        doc! {
            "$project": {
                "_id": 0,
                "hourKey": "$_id",
                // Convert hour to string pad 2 logic is easier in Rust post-processing or sophisticated aggregation
                "subtotal": 1
            }
        },
        doc! { "$sort": { "hourKey": 1 } },
    ];

    // Pipeline 5: Order Type
    let order_type_pipeline = vec![
        doc! { "$match": match_filter.clone() },
        doc! {
            "$group": {
                "_id": "$orderType",
                "subtotal": { "$sum": "$grandTotal" },
                "totalTransaction": { "$sum": 1 }
            }
        },
        doc! {
            "$project": {
                "_id": 0,
                "orderType": { "$ifNull": ["$_id", "Unknown"] },
                "subtotal": 1,
                "totalTransaction": 1
            }
        }
    ];

    // Execute Futures
    let current_future = order_coll.aggregate(current_stats_pipeline, None);
    let prev_future = order_coll.aggregate(prev_stats_pipeline, None);
    let product_future = order_coll.aggregate(product_summary_pipeline, None);
    let hourly_future = order_coll.aggregate(hourly_pipeline, None);
    let type_future = order_coll.aggregate(order_type_pipeline, None);

    let (mut current_cur, mut prev_cur, mut product_cur, mut hourly_cur, mut type_cur) = 
        try_join!(current_future, prev_future, product_future, hourly_future, type_future)
        .map_err(|e| AppError::Database(e))?;

    // Process Results
    
    // Current Stats
    let current_res: Option<Document> = current_cur.try_next().await.map_err(|e| AppError::Database(e))?;
    let (c_sales, c_orders, c_avg) = if let Some(doc) = current_res {
        (
            doc.get_f64("totalSales").unwrap_or(0.0),
            doc.get_i64("totalOrders").unwrap_or(doc.get_i32("totalOrders").unwrap_or(0) as i64),
            doc.get_f64("avgOrderValue").unwrap_or(0.0)
        )
    } else { (0.0, 0, 0.0) };

    let current_stats = PeriodStats { sales: c_sales, orders: c_orders, avg_order_value: c_avg };

    // Previous Stats
    let prev_res: Option<Document> = prev_cur.try_next().await.map_err(|e| AppError::Database(e))?;
    let (p_sales, p_orders) = if let Some(doc) = prev_res {
        (
            doc.get_f64("totalSales").unwrap_or(0.0),
            doc.get_i64("totalOrders").unwrap_or(doc.get_i32("totalOrders").unwrap_or(0) as i64),
        )
    } else { (0.0, 0) };
    
    let previous_stats = PeriodStats { sales: p_sales, orders: p_orders, avg_order_value: 0.0 };

    // Comparison Logic
    let calc_comparison = |current: f64, previous: f64| -> ComparisonMetric {
        let diff = current - previous;
        let is_positive = diff >= 0.0;
        let percentage = if previous == 0.0 {
            if current == 0.0 { "0.00%".to_string() } else { "100.00%".to_string() }
        } else {
            format!("{:.2}%", (diff.abs() / previous) * 100.0)
        };

        ComparisonMetric {
            percentage: if is_positive { format!("+{}", percentage) } else { format!("-{}", percentage) },
            amount: diff.abs(),
            is_positive
        }
    };

    let comparison = ComparisonData {
        sales: calc_comparison(c_sales, p_sales),
        orders: calc_comparison(c_orders as f64, p_orders as f64),
    };

    // Products
    let mut products: Vec<ProductSummary> = Vec::new();
    while let Some(doc) = product_cur.try_next().await.map_err(|e| AppError::Database(e))? {
        products.push(bson::from_document(doc).unwrap_or_else(|_| ProductSummary {
            product_name: "Error".to_string(), main_category: "".into(), category: "".into(), sku: "".into(),
            quantity: 0, subtotal: 0.0, discount: 0.0, total: 0.0
        }));
    }

    // Top 10, Food, Drinks
    let top_10 = products.iter().take(10).cloned().collect();
    let food_products: Vec<SimpleProduct> = products.iter()
        .filter(|p| p.main_category == "makanan")
        .take(5)
        .map(|p| SimpleProduct { name: p.product_name.clone(), value: p.subtotal })
        .collect();
    let drink_products: Vec<SimpleProduct> = products.iter()
        .filter(|p| p.main_category == "minuman")
        .take(5)
        .map(|p| SimpleProduct { name: p.product_name.clone(), value: p.subtotal })
        .collect();

    // Hourly
    let mut hourly_map = std::collections::HashMap::new();
    for i in 0..24 {
        let hour_str = format!("{:02}:00", i);
        hourly_map.insert(hour_str.clone(), HourlyData { time: hour_str, subtotal: 0.0 });
    }

    while let Some(doc) = hourly_cur.try_next().await.map_err(|e| AppError::Database(e))? {
        if let Ok(hour) = doc.get_i32("hourKey") {
            let hour_str = format!("{:02}:00", hour);
            let subtotal = doc.get_f64("subtotal").unwrap_or(0.0);
            hourly_map.insert(hour_str.clone(), HourlyData { time: hour_str, subtotal });
        }
    }
    
    let mut hourly_data: Vec<HourlyData> = hourly_map.into_values().collect();
    hourly_data.sort_by(|a, b| a.time.cmp(&b.time));

    // Order Types
    let mut order_types: Vec<OrderTypeData> = Vec::new();
    while let Some(doc) = type_cur.try_next().await.map_err(|e| AppError::Database(e))? {
         order_types.push(bson::from_document(doc).unwrap_or_else(|_| OrderTypeData {
             order_type: "Error".to_string(), subtotal: 0.0, total_transaction: 0
         }));
    }

    let sales_by_category = products.iter().map(|p| SalesByCategory {
        name: p.product_name.clone(),
        category: p.main_category.clone(),
        value: p.subtotal,
    }).collect();

    let response = DashboardResponse {
        success: true,
        data: DashboardData {
            summary: SummaryData { current: current_stats, previous: previous_stats, comparison },
            products: ProductBreakdown {
                all: products.clone(),
                top_10,
                food: food_products,
                drinks: drink_products,
            },
            charts: ChartsData {
                hourly: hourly_data,
                order_types,
                sales_by_category,
            },
            metadata: Metadata {
                date_range: DateRange { start: query.start_date, end: query.end_date },
                previous_range: PreviousRange { 
                    start: prev_start_dt.format("%Y-%m-%d").to_string(), 
                    end: prev_end_dt.format("%Y-%m-%d").to_string() 
                },
                outlet: query.outlet.unwrap_or_else(|| "all".to_string()),
                total_products: products.len(),
                generated_at: Utc::now().to_rfc3339(),
            },
        },
    };

    Ok(Json(response))
}

pub async fn get_quick_stats(
    State(state): State<Arc<AppState>>,
    Query(query): Query<DashboardQuery>,
) -> AppResult<Json<QuickStatsResponse>> {
    let db = &state.db.database();
    let order_coll = db.collection::<Document>("orders");

     // Parse dates
    let start_dt = Jakarta
        .datetime_from_str(&format!("{} 00:00:00", query.start_date), "%Y-%m-%d %H:%M:%S")
        .map_err(|_| AppError::BadRequest("Invalid start date format".into()))?;
    
    let end_dt = Jakarta
        .datetime_from_str(&format!("{} 23:59:59.999", query.end_date), "%Y-%m-%d %H:%M:%S%.f")
        .map_err(|_| AppError::BadRequest("Invalid end date format".into()))?;

    let mut match_filter = doc! {
        "status": "Completed",
        "createdAt": {
            "$gte": start_dt.with_timezone(&Utc),
            "$lte": end_dt.with_timezone(&Utc)
        }
    };

    if let Some(outlet_id) = &query.outlet {
        if let Ok(oid) = bson::oid::ObjectId::parse_str(outlet_id) {
             match_filter.insert("outlet", oid);
        }
    }

    let pipeline = vec![
        doc! { "$match": match_filter },
        doc! {
            "$group": {
                "_id": null,
                "totalSales": { "$sum": "$grandTotal" },
                "totalOrders": { "$sum": 1 },
                "avgOrderValue": { "$avg": "$grandTotal" }
            }
        },
    ];

    let mut cursor = order_coll.aggregate(pipeline, None).await.map_err(|e| AppError::Database(e))?;
    
    let (sales, orders, avg) = if let Some(doc) = cursor.try_next().await.map_err(|e| AppError::Database(e))? {
        (
            doc.get_f64("totalSales").unwrap_or(0.0),
            doc.get_i64("totalOrders").unwrap_or(doc.get_i32("totalOrders").unwrap_or(0) as i64),
            doc.get_f64("avgOrderValue").unwrap_or(0.0)
        )
    } else { (0.0, 0, 0.0) };

    Ok(Json(QuickStatsResponse {
        success: true,
        data: QuickStatsData {
            sales,
            orders,
            avg_order_value: avg,
        }
    }))
}
