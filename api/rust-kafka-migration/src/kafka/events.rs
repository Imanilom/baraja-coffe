#![allow(dead_code)]
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// Order event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum OrderEvent {
    Created {
        order_id: String,
        user_id: String,
        order_type: String,
        total: f64,
        timestamp: DateTime<Utc>,
    },
    Updated {
        order_id: String,
        status: String,
        timestamp: DateTime<Utc>,
    },
    Completed {
        order_id: String,
        timestamp: DateTime<Utc>,
    },
    Cancelled {
        order_id: String,
        reason: String,
        timestamp: DateTime<Utc>,
    },
}

/// Payment event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum PaymentEvent {
    Processed {
        payment_id: String,
        order_id: String,
        amount: f64,
        method: String,
        timestamp: DateTime<Utc>,
    },
    Failed {
        payment_id: String,
        order_id: String,
        reason: String,
        timestamp: DateTime<Utc>,
    },
    Refunded {
        payment_id: String,
        order_id: String,
        amount: f64,
        timestamp: DateTime<Utc>,
    },
}

/// Inventory event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum InventoryEvent {
    StockUpdated {
        item_id: String,
        warehouse_id: String,
        old_quantity: i32,
        new_quantity: i32,
        timestamp: DateTime<Utc>,
    },
    StockCalibrated {
        warehouse_id: String,
        items_count: usize,
        timestamp: DateTime<Utc>,
    },
    LowStock {
        item_id: String,
        warehouse_id: String,
        current_quantity: i32,
        threshold: i32,
        timestamp: DateTime<Utc>,
    },
}

/// Notification event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum NotificationEvent {
    OrderNotification {
        user_id: String,
        order_id: String,
        title: String,
        message: String,
        timestamp: DateTime<Utc>,
    },
    PaymentNotification {
        user_id: String,
        payment_id: String,
        title: String,
        message: String,
        timestamp: DateTime<Utc>,
    },
    GeneralNotification {
        user_id: String,
        title: String,
        message: String,
        timestamp: DateTime<Utc>,
    },
}
