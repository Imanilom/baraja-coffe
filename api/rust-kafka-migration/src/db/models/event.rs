use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum EventStatus {
    Upcoming,
    Ongoing,
    Completed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CheckInStatus {
    Pending,
    #[serde(rename = "checked-in")]
    CheckedIn,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FreeRegistration {
    #[serde(rename = "bookingCode")]
    pub booking_code: String,

    #[serde(rename = "fullName")]
    pub full_name: String,

    pub email: String,
    pub phone: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub gender: Option<String>,

    #[serde(rename = "currentCity", skip_serializing_if = "Option::is_none")]
    pub current_city: Option<String>,

    #[serde(rename = "registrationDate", default = "mongodb::bson::DateTime::now")]
    pub registration_date: mongodb::bson::DateTime,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,

    #[serde(rename = "checkInStatus", default = "default_check_in_status")]
    pub check_in_status: CheckInStatus,

    #[serde(rename = "checkInTime", skip_serializing_if = "Option::is_none")]
    pub check_in_time: Option<mongodb::bson::DateTime>,

    #[serde(rename = "checkInBy", skip_serializing_if = "Option::is_none")]
    pub check_in_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,

    pub name: String,
    pub description: String,
    pub location: String,

    pub date: mongodb::bson::DateTime,

    #[serde(rename = "endDate")]
    pub end_date: mongodb::bson::DateTime,

    pub price: f64,
    pub organizer: String,

    #[serde(rename = "contactEmail")]
    pub contact_email: String,

    #[serde(rename = "contactPhone", skip_serializing_if = "Option::is_none")]
    pub contact_phone: Option<String>,

    #[serde(rename = "imageUrl", default = "default_image_url")]
    pub image_url: String,

    pub category: String,

    #[serde(default)]
    pub tags: Vec<String>,

    #[serde(default = "default_event_status")]
    pub status: EventStatus,

    pub capacity: i32,

    #[serde(rename = "soldTickets", default)]
    pub sold_tickets: i32,

    #[serde(rename = "ticketPurchases", default)]
    pub ticket_purchases: Vec<ObjectId>,

    #[serde(default)]
    pub attendees: Vec<String>,

    #[serde(default = "default_privacy")]
    pub privacy: String,

    pub terms: String,

    #[serde(rename = "menuItem", skip_serializing_if = "Option::is_none")]
    pub menu_item: Option<ObjectId>,

    #[serde(rename = "isFreeEvent", default)]
    pub is_free_event: bool,

    #[serde(rename = "freeRegistrations", default)]
    pub free_registrations: Vec<FreeRegistration>,

    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,

    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

fn default_check_in_status() -> CheckInStatus {
    CheckInStatus::Pending
}

fn default_event_status() -> EventStatus {
    EventStatus::Upcoming
}

fn default_image_url() -> String {
    "https://placehold.co/1920x1080/png".to_string()
}

fn default_privacy() -> String {
    "public".to_string()
}

impl Event {
    pub fn available_tickets(&self) -> i32 {
        (self.capacity - self.sold_tickets).max(0)
    }

    pub fn has_available_tickets(&self, requested_quantity: i32) -> bool {
        self.available_tickets() >= requested_quantity
    }

    pub fn generate_booking_code(&self) -> String {
        use rand::Rng;
        let timestamp = chrono::Utc::now().timestamp().to_string();
        let timestamp_suffix = &timestamp[timestamp.len().saturating_sub(8)..];
        let random: String = rand::thread_rng()
            .sample_iter(&rand::distributions::Alphanumeric)
            .take(4)
            .map(|c| (c as char).to_uppercase().to_string())
            .collect();
        format!("BRJ{}{}", timestamp_suffix, random)
    }

    pub fn is_at_capacity(&self) -> bool {
        self.free_registrations.len() >= self.capacity as usize
    }

    pub fn find_registration_by_email(&self, email: &str) -> Option<&FreeRegistration> {
        self.free_registrations.iter().find(|r| r.email == email)
    }

    pub fn find_registration_by_booking_code(&self, code: &str) -> Option<&FreeRegistration> {
        self.free_registrations
            .iter()
            .find(|r| r.booking_code.eq_ignore_ascii_case(code))
    }
}
