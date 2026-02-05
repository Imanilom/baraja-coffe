use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ReservationStatus {
    Pending,
    Confirmed,
    Cancelled,
    Completed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ReservationType {
    Blocking,
    NonBlocking,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TableType {
    #[serde(rename = "long table")]
    LongTable,
    Class,
    Casual,
    Theater,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ServingType {
    #[serde(rename = "ala carte")]
    AlaCarte,
    Buffet,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FoodServingOption {
    Immediate,
    Scheduled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmployeeInfo {
    pub employee_id: Option<ObjectId>,
    pub employee_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confirmed_at: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checked_in_at: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checked_out_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reservation {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,

    pub reservation_code: String,
    pub reservation_date: DateTime<Utc>,
    pub reservation_time: String,

    #[serde(default)]
    pub agenda: String,
    #[serde(default)]
    pub agenda_description: String,

    pub area_id: ObjectId,
    pub table_id: Vec<ObjectId>,

    #[serde(default = "default_table_type")]
    pub table_type: TableType,

    pub guest_count: i32,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub order_id: Option<ObjectId>,

    #[serde(default = "default_reservation_type")]
    pub reservation_type: ReservationType,

    #[serde(default = "default_status")]
    pub status: ReservationStatus,

    // Customer information
    #[serde(default)]
    pub customer_name: String,
    #[serde(default)]
    pub customer_phone: String,
    #[serde(default)]
    pub customer_email: String,
    #[serde(default)]
    pub guest_number: String,

    // Employee tracking
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_by: Option<EmployeeInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confirm_by: Option<EmployeeInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checked_in_by: Option<EmployeeInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checked_out_by: Option<EmployeeInfo>,

    // Check-in/out times
    #[serde(skip_serializing_if = "Option::is_none")]
    pub check_in_time: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub check_out_time: Option<DateTime<Utc>>,

    #[serde(default)]
    pub notes: String,

    // Serving information
    #[serde(skip_serializing_if = "Option::is_none")]
    pub serving_food: Option<bool>,

    #[serde(default = "default_serving_type")]
    pub serving_type: ServingType,

    #[serde(default)]
    pub equipment: Vec<String>,

    #[serde(default = "default_food_serving_option")]
    pub food_serving_option: FoodServingOption,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub food_serving_time: Option<DateTime<Utc>>,

    // Timestamps
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
    #[serde(rename = "createdAtWIB", skip_serializing_if = "Option::is_none")]
    pub created_at_wib: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAtWIB", skip_serializing_if = "Option::is_none")]
    pub updated_at_wib: Option<DateTime<Utc>>,
}

fn default_table_type() -> TableType {
    TableType::LongTable
}

fn default_reservation_type() -> ReservationType {
    ReservationType::NonBlocking
}

fn default_status() -> ReservationStatus {
    ReservationStatus::Pending
}

fn default_serving_type() -> ServingType {
    ServingType::AlaCarte
}

fn default_food_serving_option() -> FoodServingOption {
    FoodServingOption::Immediate
}

impl Reservation {
    pub fn new(
        reservation_code: String,
        reservation_date: DateTime<Utc>,
        reservation_time: String,
        area_id: ObjectId,
        table_ids: Vec<ObjectId>,
        guest_count: i32,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: None,
            reservation_code,
            reservation_date,
            reservation_time,
            agenda: String::new(),
            agenda_description: String::new(),
            area_id,
            table_id: table_ids,
            table_type: TableType::LongTable,
            guest_count,
            order_id: None,
            reservation_type: ReservationType::NonBlocking,
            status: ReservationStatus::Pending,
            customer_name: String::new(),
            customer_phone: String::new(),
            customer_email: String::new(),
            guest_number: String::new(),
            created_by: None,
            confirm_by: None,
            checked_in_by: None,
            checked_out_by: None,
            check_in_time: None,
            check_out_time: None,
            notes: String::new(),
            serving_food: None,
            serving_type: ServingType::AlaCarte,
            equipment: Vec::new(),
            food_serving_option: FoodServingOption::Immediate,
            food_serving_time: None,
            created_at: Some(now),
            updated_at: Some(now),
            created_at_wib: Some(now),
            updated_at_wib: Some(now),
        }
    }
}
