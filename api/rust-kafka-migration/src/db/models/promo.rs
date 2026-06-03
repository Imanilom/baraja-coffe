use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Promo {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub name: String,
    #[serde(rename = "discountAmount")]
    pub discount_amount: f64,
    #[serde(rename = "discountType")]
    pub discount_type: String, // 'percentage', 'fixed'
    #[serde(rename = "customerType")]
    pub customer_type: String,
    #[serde(default)]
    pub outlet: Vec<ObjectId>,
    #[serde(rename = "createdBy", skip_serializing_if = "Option::is_none")]
    pub created_by: Option<ObjectId>,
    #[serde(rename = "validFrom")]
    pub valid_from: mongodb::bson::DateTime,
    #[serde(rename = "validTo")]
    pub valid_to: mongodb::bson::DateTime,
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

fn default_true() -> bool { true }

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AutoPromo {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub name: String,
    #[serde(rename = "promoType")]
    pub promo_type: String, // 'discount_on_quantity', 'discount_on_total', 'buy_x_get_y', 'bundling', 'product_specific'
    #[serde(rename = "discountType", skip_serializing_if = "Option::is_none")]
    pub discount_type: Option<String>,
    
    #[serde(default)]
    pub conditions: PromoConditions,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub discount: Option<f64>,
    #[serde(rename = "bundlePrice", skip_serializing_if = "Option::is_none")]
    pub bundle_price: Option<f64>,
    
    #[serde(rename = "consumerType", default = "default_consumer_type")]
    pub consumer_type: String,
    
    pub outlet: ObjectId,
    #[serde(rename = "createdBy")]
    pub created_by: ObjectId,
    
    #[serde(rename = "validFrom")]
    pub valid_from: mongodb::bson::DateTime,
    #[serde(rename = "validTo")]
    pub valid_to: mongodb::bson::DateTime,
    
    #[serde(rename = "activeHours", default)]
    pub active_hours: ActiveHours,
    
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

fn default_consumer_type() -> String { "all".to_string() }

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct PromoConditions {
    #[serde(rename = "minQuantity", skip_serializing_if = "Option::is_none")]
    pub min_quantity: Option<i32>,
    #[serde(rename = "minTotal", skip_serializing_if = "Option::is_none")]
    pub min_total: Option<f64>,
    #[serde(rename = "buyProduct", skip_serializing_if = "Option::is_none")]
    pub buy_product: Option<ObjectId>,
    #[serde(rename = "getProduct", skip_serializing_if = "Option::is_none")]
    pub get_product: Option<ObjectId>,
    #[serde(rename = "bundleProducts", default)]
    pub bundle_products: Vec<BundleProduct>,
    #[serde(default)]
    pub products: Vec<ObjectId>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BundleProduct {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub product: Option<ObjectId>,
    #[serde(default)]
    pub quantity: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct ActiveHours {
    #[serde(rename = "isEnabled", default)]
    pub is_enabled: bool,
    #[serde(default)]
    pub schedule: Vec<Schedule>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Schedule {
    #[serde(rename = "dayOfWeek", skip_serializing_if = "Option::is_none")]
    pub day_of_week: Option<i32>,
    #[serde(rename = "startTime", skip_serializing_if = "Option::is_none")]
    pub start_time: Option<String>,
    #[serde(rename = "endTime", skip_serializing_if = "Option::is_none")]
    pub end_time: Option<String>,
}

impl AutoPromo {
    pub fn is_active_now(&self) -> bool {
        if !self.is_active {
            return false;
        }
        let now = mongodb::bson::DateTime::now().to_chrono();
        if now < self.valid_from.to_chrono() || now > self.valid_to.to_chrono() {
            return false;
        }
        if self.active_hours.is_enabled {
            return self.is_within_active_hours(&now);
        }
        true
    }

    pub fn is_within_active_hours(&self, now: &chrono::DateTime<chrono::Utc>) -> bool {
        if !self.active_hours.is_enabled {
            return true;
        }

        use chrono::Datelike;
        let day_of_week = now.weekday().num_days_from_sunday() as i32; // 0=Sun, 6=Sat

        if let Some(schedule) = self.active_hours.schedule.iter().find(|s| s.day_of_week == Some(day_of_week)) {
            let current_time = now.format("%H:%M").to_string();
            let start = schedule.start_time.as_deref().unwrap_or("00:00");
            let end = schedule.end_time.as_deref().unwrap_or("23:59");
            
            if end < start {
                // Crosses midnight
                return current_time.as_str() >= start || current_time.as_str() <= end;
            } else {
                return current_time.as_str() >= start && current_time.as_str() <= end;
            }
        }
        
        false
    }

    pub fn calculate_discount(&self, original_amount: f64) -> f64 {
        if let (Some(discount), Some(discount_type)) = (self.discount, &self.discount_type) {
            match discount_type.as_str() {
                "percentage" => {
                    let percentage = discount.clamp(0.0, 100.0);
                    (original_amount * percentage) / 100.0
                },
                "fixed" => discount.min(original_amount),
                _ => 0.0,
            }
        } else {
            0.0
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct PromoResult {
    #[serde(rename = "totalDiscount")]
    pub total_discount: f64,
    #[serde(rename = "appliedPromos")]
    pub applied_promos: Vec<AppliedPromoDetails>,
    #[serde(rename = "bundleSets")]
    pub bundle_sets: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppliedPromoDetails {
    pub id: String,
    pub name: String,
    #[serde(rename = "promoType")]
    pub promo_type: String,
    pub amount: f64,
}
