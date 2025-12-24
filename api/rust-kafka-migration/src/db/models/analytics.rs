use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CashierMetrics {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "cashierId")]
    pub cashier_id: ObjectId,
    
    pub outlet: ObjectId,
    
    pub date: DateTime<Utc>,
    
    #[serde(rename = "totalOrders")]
    pub total_orders: i32,
    
    #[serde(rename = "completedOrders")]
    pub completed_orders: i32,
    
    #[serde(rename = "cancelledOrders")]
    pub cancelled_orders: i32,
    
    #[serde(rename = "totalRevenue")]
    pub total_revenue: f64,
    
    #[serde(rename = "averageOrderValue")]
    pub average_order_value: f64,
    
    #[serde(rename = "averageCompletionTime")]
    pub average_completion_time: f64, // in seconds
    
    #[serde(rename = "fastestOrder")]
    pub fastest_order: Option<f64>,
    
    #[serde(rename = "slowestOrder")]
    pub slowest_order: Option<f64>,
    
    #[serde(rename = "shiftStart")]
    pub shift_start: DateTime<Utc>,
    
    #[serde(rename = "shiftEnd", skip_serializing_if = "Option::is_none")]
    pub shift_end: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrintFailureAnalysis {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub outlet: ObjectId,
    
    #[serde(rename = "printerId")]
    pub printer_id: ObjectId,
    
    #[serde(rename = "printerName")]
    pub printer_name: String,
    
    #[serde(rename = "analysisDate")]
    pub analysis_date: DateTime<Utc>,
    
    #[serde(rename = "totalAttempts")]
    pub total_attempts: i32,
    
    #[serde(rename = "successfulPrints")]
    pub successful_prints: i32,
    
    #[serde(rename = "failedPrints")]
    pub failed_prints: i32,
    
    #[serde(rename = "successRate")]
    pub success_rate: f64,
    
    #[serde(rename = "commonErrors")]
    pub common_errors: Vec<ErrorFrequency>,
    
    #[serde(rename = "peakFailureHours")]
    pub peak_failure_hours: Vec<i32>,
    
    #[serde(rename = "averageRetryCount")]
    pub average_retry_count: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ErrorFrequency {
    pub error: String,
    pub count: i32,
    pub percentage: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderCompletionMetrics {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub outlet: ObjectId,
    
    #[serde(rename = "analysisDate")]
    pub analysis_date: DateTime<Utc>,
    
    #[serde(rename = "totalOrders")]
    pub total_orders: i32,
    
    #[serde(rename = "averageCompletionTime")]
    pub average_completion_time: f64, // in minutes
    
    #[serde(rename = "medianCompletionTime")]
    pub median_completion_time: f64,
    
    #[serde(rename = "fastestCompletion")]
    pub fastest_completion: f64,
    
    #[serde(rename = "slowestCompletion")]
    pub slowest_completion: f64,
    
    #[serde(rename = "byOrderType")]
    pub by_order_type: Vec<OrderTypeMetric>,
    
    #[serde(rename = "byWorkstation")]
    pub by_workstation: Vec<WorkstationMetric>,
    
    #[serde(rename = "peakHours")]
    pub peak_hours: Vec<HourMetric>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderTypeMetric {
    #[serde(rename = "orderType")]
    pub order_type: String,
    
    pub count: i32,
    
    #[serde(rename = "averageTime")]
    pub average_time: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorkstationMetric {
    pub workstation: String,
    
    #[serde(rename = "averagePrepTime")]
    pub average_prep_time: f64,
    
    #[serde(rename = "itemsProcessed")]
    pub items_processed: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HourMetric {
    pub hour: i32,
    
    #[serde(rename = "orderCount")]
    pub order_count: i32,
    
    #[serde(rename = "averageTime")]
    pub average_time: f64,
}
